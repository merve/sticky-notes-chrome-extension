// Shared translation dictionaries and helpers. Loaded in every execution context this
// extension runs in (content-script isolated world, the background service worker via
// importScripts, and extension pages via a <script> tag), so it attaches to globalThis
// rather than window/self directly — that's the one identifier guaranteed to exist in all
// three environments.
//
// The user's language preference (if any) is stored in chrome.storage.local under
// "language" and can be changed from the dashboard. When unset, the browser's own
// language (navigator.language) is used, falling back to English if unsupported.
//
// Languages included: English and Turkish (the extension's original languages), plus the
// other most-used languages on the internet by content share/users (Spanish, German,
// Japanese, French, Portuguese, Russian, Mandarin Chinese, Indonesian, Arabic). Ordered
// alphabetically by English language name, which also determines the order shown in the
// dashboard's language switcher.
const STICKY_NOTES_TRANSLATIONS = {
  ar: {
    addNoteContextMenu: "إضافة ملاحظة",
    notePlaceholder: "اكتب ملاحظة.",
    dashboardTitle: "Sticky Notes",
    searchLabel: "عن أي ملاحظة تبحث؟",
    searchPlaceholder: "النص المحدد، الملاحظة",
    siteLabel: "الموقع",
    siteAll: "الكل",
    searchButton: "بحث",
    columnSite: "الموقع",
    columnSelectedText: "النص المحدد",
    columnNote: "ملاحظتي",
    columnDate: "التاريخ",
    columnActions: "إجراء",
    emptyState: "لم تتم إضافة أي ملاحظات بعد.",
    noResults: "لم يتم العثور على نتائج.",
    unknownSite: "غير معروف",
    languageLabel: "اللغة",
    popupTitle: "محتوى الملاحظة",
    popupSite: "الموقع:",
    popupSelectedText: "النص المحدد:",
    popupNote: "الملاحظة:",
    popupIntro:
      "باستخدام Website Stickies، يمكنك إضافة ملاحظات بسرعة عن طريق تحديد نص في أي موقع ويب. ما عليك سوى النقر بزر الماوس الأيمن واختيار «إضافة ملاحظة» لإنشاء ملاحظة لاصقة بجانب التحديد.",
    popupOpenNotes: "عرض جميع الملاحظات",
    months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
  },
  zh: {
    addNoteContextMenu: "添加笔记",
    notePlaceholder: "写一条笔记。",
    dashboardTitle: "Sticky Notes",
    searchLabel: "您在查找哪条笔记？",
    searchPlaceholder: "选中的文字、笔记",
    siteLabel: "网站",
    siteAll: "全部",
    searchButton: "搜索",
    columnSite: "网站",
    columnSelectedText: "选中文字",
    columnNote: "我的笔记",
    columnDate: "日期",
    columnActions: "操作",
    emptyState: "尚未添加任何笔记。",
    noResults: "未找到结果。",
    unknownSite: "未知",
    languageLabel: "语言",
    popupTitle: "笔记内容",
    popupSite: "网站：",
    popupSelectedText: "选中文字：",
    popupNote: "笔记：",
    popupIntro:
      "使用 Website Stickies，您可以在任意网站上选中文字后快速添加笔记。只需右键点击并选择“添加笔记”，即可在所选文字旁创建一张便签。",
    popupOpenNotes: "查看所有笔记",
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  },
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
  fr: {
    addNoteContextMenu: "Ajouter une note",
    notePlaceholder: "Écrivez une note.",
    dashboardTitle: "Sticky Notes",
    searchLabel: "Quelle note recherchez-vous ?",
    searchPlaceholder: "Texte sélectionné, note",
    siteLabel: "Site",
    siteAll: "Tous",
    searchButton: "RECHERCHER",
    columnSite: "Site",
    columnSelectedText: "Texte sélectionné",
    columnNote: "Ma note",
    columnDate: "Date",
    columnActions: "Action",
    emptyState: "Aucune note ajoutée pour le moment.",
    noResults: "Aucun résultat trouvé.",
    unknownSite: "Inconnu",
    languageLabel: "Langue",
    popupTitle: "Contenu de la note",
    popupSite: "Site :",
    popupSelectedText: "Texte sélectionné :",
    popupNote: "Note :",
    popupIntro:
      "Avec Website Stickies, vous pouvez rapidement ajouter des notes en sélectionnant du texte sur n'importe quel site web. Faites simplement un clic droit et choisissez « Ajouter une note » pour créer une note autocollante à côté de votre sélection.",
    popupOpenNotes: "Voir toutes les notes",
    months: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  },
  de: {
    addNoteContextMenu: "Notiz hinzufügen",
    notePlaceholder: "Schreibe eine Notiz.",
    dashboardTitle: "Sticky Notes",
    searchLabel: "Welche Notiz suchst du?",
    searchPlaceholder: "Ausgewählter Text, Notiz",
    siteLabel: "Website",
    siteAll: "Alle",
    searchButton: "SUCHEN",
    columnSite: "Website",
    columnSelectedText: "Ausgewählter Text",
    columnNote: "Meine Notiz",
    columnDate: "Datum",
    columnActions: "Aktion",
    emptyState: "Noch keine Notizen hinzugefügt.",
    noResults: "Keine Ergebnisse gefunden.",
    unknownSite: "Unbekannt",
    languageLabel: "Sprache",
    popupTitle: "Notizinhalt",
    popupSite: "Website:",
    popupSelectedText: "Ausgewählter Text:",
    popupNote: "Notiz:",
    popupIntro:
      "Mit Website Stickies kannst du schnell Notizen hinzufügen, indem du Text auf einer beliebigen Website markierst. Klicke einfach mit der rechten Maustaste und wähle „Notiz hinzufügen“, um eine Haftnotiz neben deiner Auswahl zu erstellen.",
    popupOpenNotes: "Alle Notizen anzeigen",
    months: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
  },
  id: {
    addNoteContextMenu: "Tambah Catatan",
    notePlaceholder: "Tulis catatan.",
    dashboardTitle: "Sticky Notes",
    searchLabel: "Catatan apa yang Anda cari?",
    searchPlaceholder: "Teks yang dipilih, catatan",
    siteLabel: "Situs",
    siteAll: "Semua",
    searchButton: "CARI",
    columnSite: "Situs",
    columnSelectedText: "Teks yang dipilih",
    columnNote: "Catatan saya",
    columnDate: "Tanggal",
    columnActions: "Tindakan",
    emptyState: "Belum ada catatan yang ditambahkan.",
    noResults: "Tidak ada hasil ditemukan.",
    unknownSite: "Tidak diketahui",
    languageLabel: "Bahasa",
    popupTitle: "Isi Catatan",
    popupSite: "Situs:",
    popupSelectedText: "Teks yang dipilih:",
    popupNote: "Catatan:",
    popupIntro:
      "Dengan Website Stickies, Anda dapat menambahkan catatan dengan cepat dengan memilih teks di situs web mana pun. Cukup klik kanan dan pilih 'Tambah Catatan' untuk membuat catatan tempel di samping pilihan Anda.",
    popupOpenNotes: "Lihat semua catatan",
    months: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  },
  ja: {
    addNoteContextMenu: "メモを追加",
    notePlaceholder: "メモを書く。",
    dashboardTitle: "Sticky Notes",
    searchLabel: "どのメモをお探しですか？",
    searchPlaceholder: "選択したテキスト、メモ",
    siteLabel: "サイト",
    siteAll: "すべて",
    searchButton: "検索",
    columnSite: "サイト",
    columnSelectedText: "選択したテキスト",
    columnNote: "メモ",
    columnDate: "日付",
    columnActions: "操作",
    emptyState: "まだメモが追加されていません。",
    noResults: "結果が見つかりませんでした。",
    unknownSite: "不明",
    languageLabel: "言語",
    popupTitle: "メモの内容",
    popupSite: "サイト：",
    popupSelectedText: "選択したテキスト：",
    popupNote: "メモ：",
    popupIntro:
      "Website Stickies を使えば、どのウェブサイトでもテキストを選択するだけですばやくメモを追加できます。右クリックして「メモを追加」を選ぶだけで、選択箇所の横に付箋メモが作成されます。",
    popupOpenNotes: "すべてのメモを表示",
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
  },
  pt: {
    addNoteContextMenu: "Adicionar nota",
    notePlaceholder: "Escreva uma nota.",
    dashboardTitle: "Sticky Notes",
    searchLabel: "Qual nota você está procurando?",
    searchPlaceholder: "Texto selecionado, nota",
    siteLabel: "Site",
    siteAll: "Todos",
    searchButton: "PESQUISAR",
    columnSite: "Site",
    columnSelectedText: "Texto selecionado",
    columnNote: "Minha nota",
    columnDate: "Data",
    columnActions: "Ação",
    emptyState: "Nenhuma nota adicionada ainda.",
    noResults: "Nenhum resultado encontrado.",
    unknownSite: "Desconhecido",
    languageLabel: "Idioma",
    popupTitle: "Conteúdo da nota",
    popupSite: "Site:",
    popupSelectedText: "Texto selecionado:",
    popupNote: "Nota:",
    popupIntro:
      "Com o Website Stickies, você pode adicionar notas rapidamente selecionando texto em qualquer site. Basta clicar com o botão direito e escolher 'Adicionar nota' para criar uma nota adesiva ao lado da sua seleção.",
    popupOpenNotes: "Ver todas as notas",
    months: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  },
  ru: {
    addNoteContextMenu: "Добавить заметку",
    notePlaceholder: "Напишите заметку.",
    dashboardTitle: "Sticky Notes",
    searchLabel: "Какую заметку вы ищете?",
    searchPlaceholder: "Выделенный текст, заметка",
    siteLabel: "Сайт",
    siteAll: "Все",
    searchButton: "ПОИСК",
    columnSite: "Сайт",
    columnSelectedText: "Выделенный текст",
    columnNote: "Моя заметка",
    columnDate: "Дата",
    columnActions: "Действие",
    emptyState: "Заметок пока нет.",
    noResults: "Результатов не найдено.",
    unknownSite: "Неизвестно",
    languageLabel: "Язык",
    popupTitle: "Содержание заметки",
    popupSite: "Сайт:",
    popupSelectedText: "Выделенный текст:",
    popupNote: "Заметка:",
    popupIntro:
      "С Website Stickies вы можете быстро добавлять заметки, выделяя текст на любом сайте. Просто щёлкните правой кнопкой мыши и выберите «Добавить заметку», чтобы создать стикер рядом с выделением.",
    popupOpenNotes: "Показать все заметки",
    months: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  },
  es: {
    addNoteContextMenu: "Añadir nota",
    notePlaceholder: "Escribe una nota.",
    dashboardTitle: "Sticky Notes",
    searchLabel: "¿Qué nota estás buscando?",
    searchPlaceholder: "Texto seleccionado, nota",
    siteLabel: "Sitio",
    siteAll: "Todos",
    searchButton: "BUSCAR",
    columnSite: "Sitio",
    columnSelectedText: "Texto seleccionado",
    columnNote: "Mi nota",
    columnDate: "Fecha",
    columnActions: "Acción",
    emptyState: "Aún no se ha añadido ninguna nota.",
    noResults: "No se encontraron resultados.",
    unknownSite: "Desconocido",
    languageLabel: "Idioma",
    popupTitle: "Contenido de la nota",
    popupSite: "Sitio:",
    popupSelectedText: "Texto seleccionado:",
    popupNote: "Nota:",
    popupIntro:
      "Con Website Stickies, puedes añadir notas rápidamente seleccionando texto en cualquier sitio web. Solo haz clic derecho y elige 'Añadir nota' para crear una nota adhesiva junto a tu selección.",
    popupOpenNotes: "Ver todas las notas",
    months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
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
