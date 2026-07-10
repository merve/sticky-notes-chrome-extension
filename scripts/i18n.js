// Shared translation dictionaries and helpers. Loaded in every execution context this
// extension runs in (content-script isolated world, the background service worker via
// importScripts, and extension pages via a <script> tag), so it attaches to globalThis
// rather than window/self directly — that's the one identifier guaranteed to exist in all
// three environments.
//
// The user's language preference (if any) is stored in chrome.storage.local under
// "language" and can be changed from the dashboard. When unset, the browser's own
// language (navigator.language) is used, falling back to English if unsupported.
const STICKY_NOTES_TRANSLATIONS = {
  en: {
    addNoteContextMenu: "Add Note",
    notePlaceholder: "Write a note.",
    dashboardTitle: "Sticky Notes",
    searchLabel: "What note are you looking for?",
    searchPlaceholder: "Selected text, note",
    siteLabel: "Site",
    siteAll: "All",
    searchButton: "SEARCH",
    columnSite: "Site",
    columnSelectedText: "Selected text",
    columnNote: "My note",
    columnDate: "Date",
    columnActions: "Action",
    emptyState: "No notes added yet.",
    noResults: "No results found.",
    unknownSite: "Unknown",
    languageLabel: "Language",
    popupTitle: "Note Content",
    popupSite: "Site:",
    popupSelectedText: "Selected text:",
    popupNote: "Note:",
    popupIntro:
      "With Website Stickies, you can quickly add notes by selecting text on any website. Just right-click and choose ‘Add Note’ to create a sticky note next to your selection.",
    popupOpenNotes: "View all notes",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  tr: {
    addNoteContextMenu: "Not Ekle",
    notePlaceholder: "Bir not yaz.",
    dashboardTitle: "Sticky Notes",
    searchLabel: "Hangi Notu Arıyorsunuz?",
    searchPlaceholder: "Seçilen yazı, not",
    siteLabel: "Site",
    siteAll: "Hepsi",
    searchButton: "ARA",
    columnSite: "Site",
    columnSelectedText: "Seçilen yazı",
    columnNote: "Notum",
    columnDate: "Tarih",
    columnActions: "Aksiyon",
    emptyState: "Henüz bir not eklenmedi.",
    noResults: "Sonuç bulunamadı.",
    unknownSite: "Bilinmeyen",
    languageLabel: "Dil",
    popupTitle: "Not İçeriği",
    popupSite: "Site:",
    popupSelectedText: "Seçilen metin:",
    popupNote: "Not:",
    popupIntro:
      "Website Stickies ile web sitelerinde istediğiniz metni seçerek hızlıca notlar ekleyebilirsiniz. Sadece sağ tıklayın, ‘Not Ekle’ seçeneğine tıklayarak seçtiğiniz metin yanında bir yapışkan not oluşturun.",
    popupOpenNotes: "Tüm notları görüntüle",
    months: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  },
};

const STICKY_NOTES_DEFAULT_LANGUAGE = "en";
const STICKY_NOTES_SUPPORTED_LANGUAGES = Object.keys(STICKY_NOTES_TRANSLATIONS);

function stickyNotesDetectBrowserLanguage() {
  const raw =
    (typeof navigator !== "undefined" && (navigator.language || (navigator.languages && navigator.languages[0]))) ||
    STICKY_NOTES_DEFAULT_LANGUAGE;
  const code = raw.slice(0, 2).toLowerCase();
  return STICKY_NOTES_SUPPORTED_LANGUAGES.includes(code) ? code : STICKY_NOTES_DEFAULT_LANGUAGE;
}

// Returns the user's saved language preference, or the browser's language if none was set.
function stickyNotesGetLanguage() {
  return new Promise((resolve) => {
    chrome.storage.local.get("language", (result) => {
      if (result.language && STICKY_NOTES_SUPPORTED_LANGUAGES.includes(result.language)) {
        resolve(result.language);
      } else {
        resolve(stickyNotesDetectBrowserLanguage());
      }
    });
  });
}

function stickyNotesSetLanguage(lang) {
  return new Promise((resolve) => chrome.storage.local.set({ language: lang }, resolve));
}

function stickyNotesTranslate(lang, key) {
  const dict = STICKY_NOTES_TRANSLATIONS[lang] || STICKY_NOTES_TRANSLATIONS[STICKY_NOTES_DEFAULT_LANGUAGE];
  return dict[key] ?? STICKY_NOTES_TRANSLATIONS[STICKY_NOTES_DEFAULT_LANGUAGE][key] ?? key;
}

globalThis.StickyNotesI18n = {
  translations: STICKY_NOTES_TRANSLATIONS,
  supportedLanguages: STICKY_NOTES_SUPPORTED_LANGUAGES,
  defaultLanguage: STICKY_NOTES_DEFAULT_LANGUAGE,
  detectBrowserLanguage: stickyNotesDetectBrowserLanguage,
  getLanguage: stickyNotesGetLanguage,
  setLanguage: stickyNotesSetLanguage,
  t: stickyNotesTranslate,
};
