(function () {
  // Current UI language for this page; resolved on load (saved preference, or the
  // browser's language) and updated when the user picks a different one from the
  // dashboard's language switcher.
  let currentLanguage = StickyNotesI18n.defaultLanguage;

  function t(key) {
    return StickyNotesI18n.t(currentLanguage, key);
  }

  function unknownSiteLabel() {
    return t("unknownSite");
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = t("months")[date.getMonth()];
    const year = date.getFullYear();
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");

    return `${day} ${month} ${year}, ${hour}:${minute}`;
  }

  // Note content/selected text comes from arbitrary web pages and isn't trusted; escape it
  // before writing it into HTML (XSS prevention).
  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // item.url can be missing/malformed (e.g. records written before this validation
  // existed); new URL() would throw and crash the whole dashboard render, so this wraps it.
  function getHostname(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }

  // Search and the note-detail popup used to re-read the whole cardList from storage on
  // every interaction; we keep it here instead. chrome.storage.onChanged (below) keeps it
  // fresh whenever another tab/background changes it, so there's no need to re-fetch.
  let cachedCardList = [];

  // null = showing the default grouped-by-domain view; otherwise the last search/filter the
  // user ran, so a live storage update re-applies the same view instead of resetting it.
  let lastSearch = null;

  // Notes get created/edited/deleted from any tab (or the dashboard itself), and every
  // keystroke-driven autosave rewrites the whole cardList, so this fires often while the
  // user is actively typing a note elsewhere. Debounce the re-render so a typing burst
  // doesn't rebuild the table on every keystroke, and keep it in sync with whichever view
  // (grouped or search results) is currently on screen — without this, a note deleted from
  // another tab stayed visible in an already-open dashboard until the page was reloaded.
  let renderDebounceTimer = null;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.cardList) return;
    cachedCardList = changes.cardList.newValue || [];
    if (renderDebounceTimer) clearTimeout(renderDebounceTimer);
    renderDebounceTimer = setTimeout(() => {
      renderDebounceTimer = null;
      if (lastSearch) searchNotes(lastSearch.searchText, lastSearch.selectedSite);
      else renderDashboard(cachedCardList);
    }, 300);
  });

  // The synthetic "unknown site" group for malformed/missing urls isn't a real hostname,
  // so it must not be rendered as a clickable link (it would otherwise point at
  // https://Unknown or similar nonsense).
  function renderDomainLink(domain) {
    if (domain === unknownSiteLabel()) return escapeHtml(domain);
    return `<a href="https://${escapeHtml(domain)}" target="_blank">${escapeHtml(domain)}</a>`;
  }

  function renderNoteRow(item) {
    return `
        <div class="st-table-row">
          <div></div>
          <div>
            <a href="${escapeHtml(item.url)}" title="${escapeHtml(item.url)}" target="_blank">
              ${escapeHtml(item.url)}
            </a>
          </div>
          <div>
            <p title="${escapeHtml(item.selectedText)}">${escapeHtml(item.selectedText)}</p>
          </div>
          <div>
            <p title="${escapeHtml(item.value)}">${escapeHtml(item.value)}</p>
          </div>
          <div>${formatDate(item.id)}</div>
          <div class="st-table-actions">
            <img src="assets/icons/external-link.svg" width="20" height="20" alt="Sticky Notes icon" class="st-icon"
              data-url="${escapeHtml(item.url)}" id="st-icon-link_${item.id}" />
            <img src="assets/icons/eye.svg" width="20" height="20" alt="Sticky Notes icon" class="st-icon"
              id="st-icon-popup_${item.id}" />
            <img src="assets/icons/trash.svg" width="20" height="20" alt="Sticky Notes icon" class="st-icon"
              id="st-icon-delete_${item.id}" />
          </div>
        </div>
      `;
  }

  function removeCard(cardId) {
    chrome.runtime.sendMessage({ action: "deleteCard", id: Number(cardId) }, function (response) {
      if (!response || !response.ok) {
        console.error("Note could not be deleted:", response && response.error);
        return;
      }
      const cardElement = document.getElementById(`st-icon-delete_${cardId}`)?.closest(".st-table-row");
      if (!cardElement) return;

      // If this was the last note under a domain in the grouped view, remove the now-empty
      // header too — otherwise it stays on screen, clickable but empty, until reload.
      // In search results (no .note-list wrapper) this is a no-op.
      const noteList = cardElement.closest(".note-list");
      cardElement.remove();
      if (noteList && noteList.children.length === 0) {
        const domainRow = noteList.previousElementSibling;
        noteList.remove();
        if (domainRow && domainRow.classList.contains("domain-row")) {
          domainRow.remove();
        }
      }
    });
  }

  // Link/eye/delete icons are re-created on every render, so we use delegation and register
  // these once regardless of whether the initial list was empty (search can add rows later).
  document.addEventListener("click", function (event) {
    if (event.target.id.startsWith("st-icon-link")) {
      const url = event.target.dataset.url;
      chrome.tabs.create({ url });
    }
  });

  document.addEventListener("click", function (event) {
    if (event.target.id.startsWith("st-icon-popup")) {
      const cardId = event.target.id.split("_")[1];
      const selectedNote = cachedCardList.find((note) => String(note.id) === String(cardId));
      if (selectedNote) {
        document.getElementById("st-popup-site").textContent = getHostname(selectedNote.url) || unknownSiteLabel();
        document.getElementById("st-popup-content").textContent = selectedNote.selectedText;
        document.getElementById("st-popup-note").textContent = selectedNote.value;
      }
      const popup = document.getElementById("st-note-detail");
      popup.style.display = "flex";
    }
  });

  document.addEventListener("click", function (event) {
    if (event.target.id.startsWith("st-icon-delete")) {
      const cardId = event.target.id.split("_")[1];
      removeCard(cardId);
    }
  });

  function applyStaticTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
  }

  function populateLanguageSelect() {
    const select = document.getElementById("st-language");
    if (!select) return;
    const displayNames = { en: "English", tr: "Türkçe" };
    select.innerHTML = StickyNotesI18n.supportedLanguages
      .map((lang) => `<option value="${lang}">${escapeHtml(displayNames[lang] || lang)}</option>`)
      .join("");
    select.value = currentLanguage;
  }

  function setupLanguageSwitcher() {
    const select = document.getElementById("st-language");
    if (!select) return;
    select.addEventListener("change", async () => {
      currentLanguage = select.value;
      await StickyNotesI18n.setLanguage(currentLanguage);
      applyStaticTranslations();
      renderDashboard(cachedCardList);
    });
  }
  setupLanguageSwitcher();

  // Builds the grouped-by-domain, collapsible notes table. Used for the initial load and to
  // re-render with fresh data after a language switch or a live storage change.
  function renderDashboard(cardList) {
    cachedCardList = cardList;
    const notesContainer = document.getElementById("notes");
    const siteSelect = document.getElementById("site");

    // Remember which domain groups were collapsed so a re-render (e.g. triggered by a note
    // being edited elsewhere) doesn't spring every group back open.
    const collapsedDomains = new Set(
      Array.from(document.querySelectorAll('.domain-row[data-collapsed="true"]')).map((row) => row.dataset.domain)
    );

    siteSelect.innerHTML = `<option value="all">${escapeHtml(t("siteAll"))}</option>`;

    // Compute each card's hostname once and reuse it for both the site dropdown and the
    // grouping below, instead of parsing the same url twice.
    const cardsWithDomain = cardList.map((item) => ({
      item,
      domain: getHostname(item.url) || unknownSiteLabel(),
    }));

    const uniqueSites = [...new Set(cardsWithDomain.map((c) => c.domain))];
    uniqueSites.forEach((site) => {
      const option = document.createElement("option");
      option.value = site;
      option.textContent = site;
      siteSelect.appendChild(option);
    });

    notesContainer.innerHTML = "";

    if (cardList.length === 0) {
      notesContainer.innerHTML = `<div class="st-table-empty">${escapeHtml(t("emptyState"))}</div>`;
      return;
    }

    const arrangeCards = cardsWithDomain.reduce((acc, { item, domain }) => {
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(item);
      return acc;
    }, {});

    const tempDiv = document.createElement("div");
    const row = Object.entries(arrangeCards)
      .map(
        ([domain, list]) => `
    <div class="st-table-row domain-row" data-domain="${escapeHtml(domain)}" data-collapsed="false" style="cursor: pointer;">
      <img id="st-icon-collapse_${escapeHtml(domain)}"
        src="assets/icons/arrow-down.svg" width="16" height="16"
        alt="Sticky Notes icon" class="st-icon collapse-icon" />
      <div style="font-weight: 600">
        ${renderDomainLink(domain)}
      </div>
    </div>
    <div class="note-list" style="display: block;">
      ${list.map(renderNoteRow).join("")}
    </div>
  `
      )
      .join("");
    tempDiv.innerHTML = row;
    notesContainer.appendChild(tempDiv);

    // Wire up collapse/expand for each domain group, restoring whatever was collapsed before
    // this render (see collapsedDomains above).
    document.querySelectorAll(".domain-row").forEach((row) => {
      if (collapsedDomains.has(row.dataset.domain)) {
        row.setAttribute("data-collapsed", "true");
        row.nextElementSibling.style.display = "none";
        row.querySelector(".collapse-icon").src = "assets/icons/arrow-up.svg";
      }

      row.addEventListener("click", function () {
        const noteList = this.nextElementSibling;
        const isCollapsed = this.getAttribute("data-collapsed") === "true";

        noteList.style.display = isCollapsed ? "block" : "none";
        this.setAttribute("data-collapsed", !isCollapsed);

        const collapseIcon = this.querySelector(".collapse-icon");
        collapseIcon.src = isCollapsed ? "assets/icons/arrow-down.svg" : "assets/icons/arrow-up.svg";
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    currentLanguage = await StickyNotesI18n.getLanguage();
    applyStaticTranslations();
    populateLanguageSelect();
    const result = await new Promise((resolve) => chrome.storage.local.get("cardList", resolve));
    renderDashboard(result.cardList || []);
  });

  const closeButton = document.getElementById("st-close-popup");
  const popup = document.getElementById("st-note-detail");
  if (closeButton && popup) {
    popup.addEventListener("click", function () {
      document.getElementById("st-note-detail").style.display = "none";
    });
  }

  window.addEventListener("click", function (event) {
    if (event.target === popup) {
      popup.style.display = "none";
    }
  });

  const searchInput = document.getElementById("st-note");
  const searchButton = document.getElementById("st-search-button");
  const siteSelect = document.getElementById("site");

  function performSearch() {
    const searchText = searchInput.value.toLowerCase();
    const selectedSite = siteSelect.value;
    lastSearch = { searchText, selectedSite };
    searchNotes(searchText, selectedSite);
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        performSearch();
      }
    });
  }
  if (searchButton) {
    searchButton.addEventListener("click", function () {
      performSearch();
    });
  }
  if (siteSelect) {
    siteSelect.addEventListener("change", performSearch);
  }

  function searchNotes(searchText, selectedSite) {
    const notesContainer = document.getElementById("notes");
    if (cachedCardList.length === 0) {
      notesContainer.innerHTML = `<div class="st-table-empty">${escapeHtml(t("emptyState"))}</div>`;
      return;
    }
    const filteredNotes = cachedCardList.filter((item) => {
      const isSiteMatch = selectedSite === "all" || (getHostname(item.url) || unknownSiteLabel()) === selectedSite;
      const isTextMatch =
        (item.selectedText || "").toLowerCase().includes(searchText) || (item.value || "").toLowerCase().includes(searchText);
      return isSiteMatch && isTextMatch;
    });
    renderNotes(filteredNotes);
  }

  function renderNotes(filteredNotes) {
    const notesContainer = document.getElementById("notes");
    notesContainer.innerHTML = "";
    if (filteredNotes.length === 0) {
      notesContainer.innerHTML = `<div class="st-table-empty">${escapeHtml(t("noResults"))}</div>`;
      return;
    }
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = filteredNotes.map(renderNoteRow).join("");
    notesContainer.appendChild(tempDiv);
  }
})();
