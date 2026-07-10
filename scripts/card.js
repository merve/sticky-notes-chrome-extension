// Card creation/wiring logic lives in exactly one place: both content.js (renders saved
// notes on page load) and background.js's context-menu handler (creates a brand-new note)
// call this function. Content scripts and chrome.scripting.executeScript run in the same
// "isolated world", so a function hung off window is reachable from both.
window.__stickyNotesCreateCard = function (options) {
  const {
    id = null,
    value = "",
    url = window.location.href,
    selectedText = "",
    position = null, // new note: {top, left}
    element = null, // saved note: {width, height, offsetLeft, offsetTop}
    language = StickyNotesI18n.defaultLanguage,
  } = options;

  const container = document.createElement("div");
  container.id = "st-container";
  if (id) container.dataset.id = id;

  if (element) {
    // Using ?? rather than ||: a note dragged to the very top/left edge of the page can
    // legitimately have offsetTop/offsetLeft equal to 0 — || would treat that as "missing"
    // and reset it to 100px, making the note jump on every reload.
    container.style.cssText = `
      position: absolute;
      width: ${element.width ?? 200}px;
      height: ${element.height ?? 150}px;
      top: ${element.offsetTop ?? 100}px;
      left: ${element.offsetLeft ?? 100}px;
    `;
  } else {
    container.style.position = "absolute";
    container.style.top = (position?.top ?? window.scrollY + 100) + "px";
    container.style.left = (position?.left ?? window.scrollX + 100) + "px";
  }

  const textarea = document.createElement("textarea");
  textarea.placeholder = StickyNotesI18n.t(language, "notePlaceholder");
  textarea.id = "st-textarea";
  textarea.value = value;

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "st-button-group";
  const buttonMove = document.createElement("div");
  buttonMove.id = "st-button-move";
  const buttonDashboard = document.createElement("div");
  buttonDashboard.id = "st-button-dashboard";
  const buttonSave = document.createElement("div");
  buttonSave.id = "st-button-save";
  const buttonDelete = document.createElement("div");
  buttonDelete.id = "st-button-delete";

  buttonGroup.appendChild(buttonMove);
  buttonGroup.appendChild(buttonDashboard);
  buttonGroup.appendChild(buttonDelete);
  buttonGroup.appendChild(buttonSave);
  container.appendChild(buttonGroup);
  container.appendChild(textarea);
  document.body.appendChild(container);

  let saveDebounceTimer = null;
  let dragTimer = null;

  // Writes go through background's serialized handler rather than storage directly, to
  // avoid two tabs with the same page open racing each other's writes (a "lost update").
  function persistCard() {
    const hasContent = container.dataset.id || textarea.value.trim() !== "";
    if (!hasContent) return Promise.resolve(null);

    const containerInfo = {
      height: container.clientHeight,
      width: container.clientWidth,
      offsetLeft: container.offsetLeft,
      offsetTop: container.offsetTop,
    };

    const card = container.dataset.id
      ? { id: Number(container.dataset.id), value: textarea.value, element: containerInfo }
      : {
          id: new Date().getTime(),
          value: textarea.value,
          element: containerInfo,
          url,
          selectedText,
        };
    container.dataset.id = card.id;

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "saveCard", card }, resolve);
    });
  }

  function showSavedFeedback() {
    buttonSave.classList.add("st-button-saved");
    setTimeout(() => buttonSave.classList.remove("st-button-saved"), 3000);
  }

  // The single place that interprets background's {ok, error} response contract: response
  // is null when there was nothing to save, or response.ok is false when the storage write
  // genuinely failed (e.g. quota exceeded) — either way we log it and never assume success.
  function logIfFailed(response, action) {
    if (response === null) return; // persistCard() returned null: nothing to save, not an error
    if (!response || !response.ok) console.error(action, response && response.error);
  }

  function persistCardAndShowFeedback() {
    return persistCard().then((response) => {
      if (response && response.ok) showSavedFeedback();
      else logIfFailed(response, "Note could not be saved:");
    });
  }

  function cancelPendingSave() {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = null;
    }
  }

  function scheduleSave() {
    cancelPendingSave();
    saveDebounceTimer = setTimeout(() => {
      saveDebounceTimer = null;
      persistCardAndShowFeedback();
    }, 700);
  }

  // Autosave while typing, so the user doesn't lose their note if they forget to click Save.
  textarea.addEventListener("input", scheduleSave);

  // Autosave when the note is resized from its corner.
  let isFirstResizeCallback = true;
  const resizeObserver = new ResizeObserver(() => {
    if (isFirstResizeCallback) {
      isFirstResizeCallback = false;
      return;
    }
    scheduleSave();
  });
  resizeObserver.observe(container);

  // "My notes" button: save any pending edit before navigating away to the dashboard.
  buttonDashboard.addEventListener("click", () => {
    cancelPendingSave();
    persistCard().then((response) => {
      logIfFailed(response, "Note could not be saved:");
      chrome.runtime.sendMessage({ action: "openDashboard" });
    });
  });

  // Save button (immediate/manual save).
  buttonSave.addEventListener("click", () => {
    cancelPendingSave();
    persistCardAndShowFeedback();
  });

  // Drag & drop state.
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  buttonMove.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isDragging = true;
    const rect = container.getBoundingClientRect();
    dragOffsetX = e.pageX - (rect.left + window.scrollX);
    dragOffsetY = e.pageY - (rect.top + window.scrollY);
    document.body.style.userSelect = "none";
  });

  // mousemove/mouseup are attached to document so dragging keeps working anywhere on the
  // page. They're kept as named functions so they can be removed with removeEventListener
  // when the card is deleted — otherwise every deleted card would leave behind 2 permanent
  // document listeners keeping its whole DOM subtree alive via closure forever.
  function onMouseMove(e) {
    if (!isDragging) return;

    const x = e.pageX - dragOffsetX;
    const y = e.pageY - dragOffsetY;

    container.style.left = `${x}px`;
    container.style.top = `${y}px`;

    // Save the position once dragging has been idle for 1 second.
    if (dragTimer) clearTimeout(dragTimer);
    dragTimer = setTimeout(() => {
      dragTimer = null;
      persistCard();
    }, 1000);
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = "";
    }
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  function cleanupAndRemove() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    container.remove();
  }

  // Delete button.
  buttonDelete.addEventListener("click", () => {
    cancelPendingSave();
    if (dragTimer) {
      clearTimeout(dragTimer);
      dragTimer = null;
    }
    resizeObserver.disconnect();
    // Don't remove the card from the DOM until storage confirms it was actually deleted;
    // otherwise if the message never arrives (e.g. the extension was reloaded/updated) the
    // note survives in storage and "comes back" on the next page load.
    if (container.dataset.id) {
      chrome.runtime.sendMessage({ action: "deleteCard", id: Number(container.dataset.id) }, (response) => {
        if (response && response.ok) cleanupAndRemove();
        else logIfFailed(response, "Note could not be deleted:");
      });
    } else {
      cleanupAndRemove();
    }
  });

  return container;
};
