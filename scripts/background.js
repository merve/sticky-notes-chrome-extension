importScripts("i18n.js");

chrome.runtime.onInstalled.addListener(async function () {
  const language = await StickyNotesI18n.getLanguage();
  chrome.contextMenus.create({
    title: StickyNotesI18n.t(language, "addNoteContextMenu"),
    contexts: ["all"],
    id: "addNoteContextMenu",
  });
});

// Keep the context menu label in sync when the user changes language from the dashboard.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.language) {
    StickyNotesI18n.getLanguage().then((language) => {
      chrome.contextMenus.update("addNoteContextMenu", {
        title: StickyNotesI18n.t(language, "addNoteContextMenu"),
      });
    });
  }
});

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  if (info.menuItemId !== "addNoteContextMenu") return;

  const target = { tabId: tab.id, frameIds: [info.frameId] };
  const language = await StickyNotesI18n.getLanguage();

  // Card creation logic lives in scripts/card.js (content.js uses the same function).
  // content_scripts (JS + CSS) are normally already injected when the page loaded, but a
  // tab that was already open before the extension was installed/reloaded never gets them
  // automatically; re-injecting card.js/i18n.js and the stylesheet here (harmless — it just
  // redefines the function/styles) guarantees they're present regardless. Re-injecting only
  // the JS and forgetting the CSS would leave the note rendered as an unstyled bare div.
  try {
    await Promise.all([
      chrome.scripting.executeScript({ target, files: ["scripts/i18n.js", "scripts/card.js"] }),
      chrome.scripting.insertCSS({ target, files: ["styles/main.css"] }),
    ]);
    await chrome.scripting.executeScript({
      target,
      args: [language],
      function: (language) => {
        const selection = window.getSelection();

        // The user may have right-clicked without selecting any text (adding a note
        // directly on the page). In that case selection.rangeCount is 0 and
        // getRangeAt(0) throws.
        let selectedText = "";
        let rect = null;
        if (selection && selection.rangeCount > 0) {
          selectedText = selection.toString();
          rect = selection.getRangeAt(0).getBoundingClientRect();
        } else if (document.selection && document.selection.type != "Control") {
          selectedText = document.selection.createRange().text;
        }

        // Without a selection, stagger new notes by the number already on the page so
        // they don't all land in the exact same spot.
        const existingNoteCount = document.querySelectorAll("#st-container").length;
        const fallbackOffset = existingNoteCount * 24;
        const top = rect ? rect.top + window.scrollY : window.scrollY + 100 + fallbackOffset;
        const left = rect ? rect.right + window.scrollX : window.scrollX + 100 + fallbackOffset;

        window.__stickyNotesCreateCard({
          url: window.location.href,
          selectedText,
          position: { top, left },
          language,
        });
      },
    });
  } catch (err) {
    console.error("Failed to create note:", err);
  }
});

// All cardList read-modify-write operations are funneled through a single chain. Without
// this, the same page open in multiple tabs would each call chrome.storage.local.get/set
// independently, causing a "lost update": both tabs read the same old list and one tab's
// write would clobber the other's.
let writeChain = Promise.resolve();

// Every keystroke/resize/drag used to re-read the entire cardList from storage just to save
// a small change. We keep the last-written list in memory for the lifetime of this worker
// and skip the redundant "get" on consecutive writes — the service worker can be evicted at
// any time so correctness never depends on this, it only avoids unnecessary reads while the
// worker stays alive (e.g. during a single editing session).
let cardListCache = null;

function withSerializedCardList(mutate) {
  // chrome.storage.local.get/set don't throw; they just set chrome.runtime.lastError (e.g.
  // when the storage quota is full). Not checking it means a write can fail silently while
  // the caller still believes it succeeded.
  const result = writeChain.then(
    () =>
      new Promise((resolve, reject) => {
        const applyMutation = (list) => {
          // If mutate() throws synchronously (e.g. a malformed message) this call auto-
          // rejects the promise when the cache is warm, because it runs inside the
          // Promise executor's synchronous body — but when the cache is cold it runs
          // inside chrome.storage.local.get's async callback instead, where a throw would
          // fall outside the executor and leave the promise pending forever (sendResponse
          // never fires, writeChain gets stuck). Catching explicitly here makes both paths
          // behave the same way.
          let cardList;
          try {
            cardList = mutate(list);
          } catch (err) {
            cardListCache = null;
            reject(err);
            return;
          }
          chrome.storage.local.set({ cardList }, () => {
            if (chrome.runtime.lastError) {
              // Don't leave a half-applied mutation in the cache; the next call re-reads
              // the real state from storage.
              cardListCache = null;
              reject(chrome.runtime.lastError);
              return;
            }
            cardListCache = cardList;
            resolve();
          });
        };

        if (cardListCache) {
          applyMutation(cardListCache.slice());
          return;
        }

        chrome.storage.local.get("cardList", (getResult) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          applyMutation(getResult.cardList || []);
        });
      })
  );
  // writeChain must always stay "resolved" — otherwise one failed write would permanently
  // block every write queued after it. We swallow the error here; the actual caller learns
  // about the failure through `result` rejecting and handles it on its own.
  writeChain = result.catch((err) => console.error("cardList write failed:", err));
  return result;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openDashboard") {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    return;
  }

  if (request.action === "saveCard") {
    withSerializedCardList((cardList) => {
      const idx = cardList.findIndex((c) => c.id == request.card.id);
      if (idx >= 0) {
        // Preserve the id's type (number): dataset.id is a string, so overwriting it would
        // break code like formatDate(item.id) that treats the id as an epoch timestamp.
        cardList[idx] = { ...cardList[idx], ...request.card, id: cardList[idx].id };
      } else if (request.card.url) {
        // url is only sent when creating a brand-new note.
        cardList.push(request.card);
      } else {
        // An update message with no url, for a card that isn't in the list: either it was
        // already deleted in another tab/the dashboard, or this card's very FIRST save
        // never actually succeeded (e.g. quota exceeded) and the client had already
        // optimistically assigned it an id. Either way, recreating it with incomplete
        // (url-less) data isn't right — but we must not silently report success either,
        // or the client shows a "saved" checkmark for a note that was never written and
        // permanently loses the content.
        throw new Error("Card not found (it may have been deleted, or its first save never completed)");
      }
      return cardList;
    })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err && err.message }));
    return true; // async sendResponse
  }

  if (request.action === "deleteCard") {
    withSerializedCardList((cardList) => cardList.filter((c) => c.id != request.id))
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err && err.message }));
    return true; // async sendResponse
  }
});
