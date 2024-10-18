chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    title: "Not Ekle",
    contexts: ["all"],
    id: "addNoteContextMenu",
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "addNoteContextMenu") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        let selectedText = "";
        if (selection) {
          selectedText = selection.toString();
        } else if (document.selection && document.selection.type != "Control") {
          selectedText = document.selection.createRange().text;
        }

        // CREATES
        const container = document.createElement("div");
        container.id = "st-container";
        container.style.top =
          range.getBoundingClientRect().top + window.scrollY + "px";
        container.style.left =
          range.getBoundingClientRect().right + window.scrollX + "px";

        const textarea = document.createElement("textarea");
        textarea.placeholder = "Bir not yaz.";
        textarea.id = "st-textarea";

        const buttonGroup = document.createElement("div");
        buttonGroup.className = "st-button-group";

        const buttonDashboard = document.createElement("div");
        buttonDashboard.id = "st-button-dashboard";

        const buttonSave = document.createElement("div");
        buttonSave.id = "st-button-save";

        const buttonDelete = document.createElement("div");
        buttonDelete.id = "st-button-delete";

        buttonGroup.appendChild(buttonDashboard);
        buttonGroup.appendChild(buttonDelete);
        buttonGroup.appendChild(buttonSave);
        container.appendChild(buttonGroup);
        container.appendChild(textarea);
        document.body.appendChild(container);

        buttonDashboard.addEventListener("click", function () {
          chrome.runtime.sendMessage({ action: "openDashboard" });
        });

        buttonSave.addEventListener("click", function () {
          const containerInfo = {
            innerHTML: container.innerHTML,
            height: container.clientHeight,
            width: container.clientWidth,
            offsetLeft: container.offsetLeft,
            offsetTop: container.offsetTop,
            offsetParent: container.offsetParent,
            value: textarea.value,
          };
          if (container.dataset.id) {
            chrome.storage.local.get("cardList", function (result) {
              let cardList = result.cardList || [];
              cardList = cardList.map((card) => {
                if (card.id == container.dataset.id) {
                  card.value = textarea.value;
                  card.element = containerInfo;
                }
                return card;
              });
              chrome.storage.local.set({ cardList: cardList }, function () {
                console.log("Card updated to storage.");
              });
              console.log(cardList);
            });
          } else {
            const newCard = {
              id: new Date().getTime(),
              value: textarea.value,
              element: containerInfo,
              url: window.location.href,
              selectedText: selectedText,
            };
            container.dataset.id = newCard.id;
            chrome.storage.local.get("cardList", function (result) {
              let cardList = result.cardList || [];
              cardList.push(newCard);
              chrome.storage.local.set({ cardList: cardList }, function () {
                console.log("Card info saved to storage.");
              });
              console.log(cardList);
            });
          }
          buttonSave.classList.add("st-button-saved");
          setTimeout(() => {
            buttonSave.classList.remove("st-button-saved");
          }, 3000);
        });

        buttonDelete.addEventListener("click", function () {
          chrome.storage.local.get("cardList", function (result) {
            let cardList = result.cardList || [];
            cardList = cardList.filter(
              (card) => card.id != container.dataset.id
            );
            chrome.storage.local.set({ cardList: cardList }, function () {
              console.log("Card deleted from storage.");
            });
            console.log(cardList);
          });

          container.remove();
        });
      },
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openDashboard") {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  }
});
