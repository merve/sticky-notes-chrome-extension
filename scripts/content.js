chrome.storage.local.get("cardList", function (result) {
  // Remove all cards first
  const allCards = document.querySelectorAll(".st-container");
  allCards.forEach((div) => {
    div.remove();
  });

  const { cardList } = result;
  for (let card of cardList) {
    if (card.url === document.URL) {
      const container = document.createElement("div");
      container.id = "st-container";
      container.dataset.id = card.id;
      container.style.cssText = `
      width: ${card.element.width}px;
      height: ${card.element.height}px;
      top: ${card.element.offsetTop}px;
      left: ${card.element.offsetLeft}px;
    `;

      const parser = new DOMParser();
      const parsedDocument = parser.parseFromString(
        card.element.innerHTML,
        "text/html"
      );
      const bodyChildNodes = parsedDocument.body.childNodes;

      const textarea = parsedDocument.body.querySelector("textarea");
      textarea.value = card.element.value;

      while (bodyChildNodes.length > 0) {
        container.appendChild(bodyChildNodes[0]);
      }

      const buttonSave = container.querySelector("#st-button-save");
      const buttonDelete = container.querySelector("#st-button-delete");

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
        }
        // kayıt butonuna tıklanınca background image svgnin sadece kendisi yeşil olur ve 3 saniye sonra tekrar kendi rengine döner
        buttonSave.classList.add("st-button-saved");
        setTimeout(() => {
          buttonSave.classList.remove("st-button-saved");
        }, 3000);
      });

      buttonDelete.addEventListener("click", function () {
        chrome.storage.local.get("cardList", function (result) {
          let cardList = result.cardList || [];
          cardList = cardList.filter((card) => card.id != container.dataset.id);
          chrome.storage.local.set({ cardList: cardList }, function () {
            console.log("Card deleted from storage.");
          });
          console.log(cardList);
        });

        container.remove();
      });

      document.body.appendChild(container);
    }
  }
});
