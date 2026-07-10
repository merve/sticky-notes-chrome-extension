document.addEventListener("DOMContentLoaded", async function () {
  const language = await StickyNotesI18n.getLanguage();
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = StickyNotesI18n.t(language, el.dataset.i18n);
  });

  const goToNotes = document.getElementById("popup-open-notes");
  goToNotes.addEventListener("click", function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  });
});
