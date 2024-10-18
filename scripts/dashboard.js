function formatDate(timestamp) {
  const date = new Date(timestamp);
  const months = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");

  const formattedDate = `${day} ${month} ${year}, ${hour}:${minute}`;
  return formattedDate;
}

document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get("cardList", function (result) {
    const notesContainer = document.getElementById("notes");
    const siteSelect = document.getElementById("site");
    siteSelect.innerHTML = '<option value="all">Hepsi</option>';
    const uniqueSites = [
      ...new Set(result.cardList.map((item) => new URL(item.url).hostname)),
    ];
    uniqueSites.forEach((site) => {
      const option = document.createElement("option");
      option.value = site;
      option.textContent = site;
      siteSelect.appendChild(option);
    });

    notesContainer.innerHTML = "";

    if (!result.cardList || result.cardList.length === 0) {
      notesContainer.innerHTML = `
        <div class="st-table-empty">Henüz bir not eklenmedi.</div>
        `;
    } else {
      const arrangeCards = result.cardList.reduce((acc, item) => {
        const domain = new URL(item.url).hostname;
        if (!acc[domain]) {
          acc[domain] = [];
        }
        acc[domain].push(item);
        return acc;
      }, {});

      const groupedCardList = Object.entries(arrangeCards).map(
        ([domain, list]) => ({
          domain,
          list,
        })
      );

      const tempDiv = document.createElement("div");
      const row = groupedCardList
        .map(
          ({ domain, list }) => `
    <div class="st-table-row domain-row" data-collapsed="false" style="cursor: pointer;">
      <img id="st-icon-collapse_${domain}" 
        src="assets/icons/arrow-down.svg" width="16" height="16" 
        alt="Sticky Notes icon" class="st-icon collapse-icon" />
      <div style="font-weight: 600">
        <a href=${domain} target="_blank">${domain}</a>
      </div>
    </div>
    <div class="note-list" style="display: block;">
      ${list
        .map(
          (item) => `
        <div class="st-table-row">
          <div></div>
          <div>
            <a href="${item.url}" title="${item.url}" target="_blank">
              ${item.url}
            </a>
          </div>
          <div>
            <p title="${item.selectedText}">${item.selectedText}</p>
          </div>
          <div>
            <p title="${item.value}">${item.value}</p>
          </div>
          <div>${formatDate(item.id)}</div>
          <div class="st-table-actions">
            <img src="assets/icons/external-link.svg" width="20" height="20" alt="Sticky Notes icon" 
              data-url="${item.url}" id="st-icon-link_${item.id}" />
            <img src="assets/icons/eye.svg" width="20" height="20" alt="Sticky Notes icon" 
              id="st-icon-popup_${item.id}" />
            <img src="assets/icons/trash.svg" width="20" height="20" alt="Sticky Notes icon" 
              id="st-icon-delete_${item.id}" />
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `
        )
        .join("");
      tempDiv.innerHTML = row;
      notesContainer.appendChild(tempDiv);

      // Add collapse functionality
      const domainRows = document.querySelectorAll(".domain-row");

      domainRows.forEach((row) => {
        row.addEventListener("click", function () {
          const noteList = this.nextElementSibling; // Get the next sibling (note-list)
          const isCollapsed = this.getAttribute("data-collapsed") === "true";

          // Toggle visibility
          noteList.style.display = isCollapsed ? "block" : "none";
          this.setAttribute("data-collapsed", !isCollapsed);

          // Update the icon
          const collapseIcon = this.querySelector(".collapse-icon");
          collapseIcon.src = isCollapsed
            ? "assets/icons/arrow-down.svg"
            : "assets/icons/arrow-up.svg";
        });
      });

      document.addEventListener("click", function (event) {
        if (event.target.id.startsWith("st-icon-link")) {
          const url = event.target.dataset.url;
          chrome.tabs.create({ url });
        }
      });

      document.addEventListener("click", function (event) {
        if (event.target.id.startsWith("st-icon-popup")) {
          const cardId = event.target.id.split("_")[1];
          chrome.storage.local.get("cardList", function (result) {
            const selectedNote = result.cardList.find(
              (note) => String(note.id) === String(cardId)
            );
            if (selectedNote) {
              document.getElementById("st-popup-site").textContent = new URL(
                selectedNote.url
              ).hostname;
              document.getElementById("st-popup-content").textContent =
                selectedNote.selectedText;
              document.getElementById("st-popup-note").textContent =
                selectedNote.value;
            }
            const popup = document.getElementById("st-note-detail");
            popup.style.display = "flex";
          });
        }
      });

      document.addEventListener("click", function (event) {
        if (event.target.id.startsWith("st-icon-delete")) {
          const cardId = event.target.id.split("_")[1];
          removeCard(cardId);
          console.log(cardId);
        }
      });
      function removeCard(cardId) {
        const updatedCardList = result.cardList.filter(
          (card) => card.id !== Number(cardId)
        );
        chrome.storage.local.set({ cardList: updatedCardList }, function () {
          const cardElement = document
            .getElementById(`st-icon-delete_${cardId}`)
            .closest(".st-table-row");
          if (cardElement) {
            cardElement.remove();
          }
        });
      }
    }
  });
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
  chrome.storage.local.get("cardList", function (result) {
    if (!result.cardList || result.cardList.length === 0) {
      notesContainer.innerHTML = `<div class="st-table-empty">Henüz bir not eklenmedi.</div>`;
    } else {
      const filteredNotes = result.cardList.filter((item) => {
        const isSiteMatch =
          selectedSite === "all" || new URL(item.url).hostname === selectedSite;
        const isTextMatch =
          item.selectedText.toLowerCase().includes(searchText) ||
          item.value.toLowerCase().includes(searchText);
        return isSiteMatch && isTextMatch;
      });
      renderNotes(filteredNotes);
    }
  });
}

function renderNotes(filteredNotes) {
  const notesContainer = document.getElementById("notes");
  notesContainer.innerHTML = "";
  if (filteredNotes.length === 0) {
    notesContainer.innerHTML = `<div class="st-table-empty">Sonuç bulunamadı.</div>`;
  } else {
    const tempDiv = document.createElement("div");
    const row = filteredNotes
      .map(
        (item) => `
        <div class="st-table-row">
          <div></div>
          <div>
            <a href="${item.url}" title="${item.url}" target="_blank">
              ${item.url}
            </a>
          </div>
          <div>
            <p title="${item.selectedText}">${item.selectedText}</p>
          </div>
          <div>
            <p title="${item.value}">${item.value}</p>
          </div>
          <div>${formatDate(item.id)}</div>
          <div class="st-table-actions">
            <img src="assets/icons/external-link.svg" width="20" height="20" alt="Sticky Notes icon" class="st-icon" data-url="${
              item.url
            }" id="st-icon-link_${item.id}" />
            <img 
              src="assets/icons/eye.svg" width="20" height="20" 
              alt="Sticky Notes icon" class="st-icon" 
               id="st-icon-popup_${item.id}"
            />
            <img src="assets/icons/trash.svg" width="20" height="20" alt="Sticky Notes icon" class="st-icon" id="st-icon-delete_${
              item.id
            }" />
          </div>
        </div>
      `
      )
      .join("");
    tempDiv.innerHTML = row;
    notesContainer.appendChild(tempDiv);
  }
}
