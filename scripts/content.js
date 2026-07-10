Promise.all([
  new Promise((resolve) => chrome.storage.local.get("cardList", (result) => resolve(result.cardList || []))),
  StickyNotesI18n.getLanguage(),
]).then(([cardList, language]) => {
  // Clear any existing cards from the page first (cards get id="st-container", not a class).
  document.querySelectorAll("#st-container").forEach((div) => div.remove());

  for (const card of cardList) {
    if (card.url === document.URL) {
      // Card creation/wiring logic lives in scripts/card.js; background.js's context-menu
      // handler uses the same function.
      window.__stickyNotesCreateCard({
        id: card.id,
        value: card.value,
        url: card.url,
        selectedText: card.selectedText,
        element: card.element,
        language,
      });
    }
  }
});
