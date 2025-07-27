chrome.storage.local.get("cardList", function (result) {
  // Önce sayfadaki mevcut kartları temizle
  const allCards = document.querySelectorAll(".st-container");
  allCards.forEach((div) => div.remove());

  const cardList = result.cardList || [];
  console.log("Loaded cardList:", cardList);

  for (let card of cardList) {
    if (card.url === document.URL) {
      const container = document.createElement("div");
      container.id = "st-container";
      container.dataset.id = card.id;

      // Kesinlikle position: absolute olmalı ki hareket ettirebilelim
      container.style.cssText = `
        position: absolute;
        width: ${card.element?.width || 200}px;
        height: ${card.element?.height || 150}px;
        top: ${card.element?.offsetTop || 100}px;
        left: ${card.element?.offsetLeft || 100}px;
      `;

      // InnerHTML'yi parse edip DOM'a ekle
      const parser = new DOMParser();
      const parsedDocument = parser.parseFromString(
        card.element?.innerHTML || "",
        "text/html"
      );
      const bodyChildNodes = parsedDocument.body.childNodes;

      const textarea = parsedDocument.body.querySelector("textarea");
      if (textarea) textarea.value = card.element?.value || "";
      else console.warn("Textarea bulunamadı!");

      while (bodyChildNodes.length > 0) {
        container.appendChild(bodyChildNodes[0]);
      }

      // Butonları DOM'dan seç
      const buttonSave = container.querySelector("#st-button-save");
      const buttonDelete = container.querySelector("#st-button-delete");
      const buttonMove = container.querySelector("#st-button-move");

      if (!buttonSave || !buttonDelete || !buttonMove || !textarea) {
        console.error("Kart içindeki elementler eksik:", {
          buttonSave,
          buttonDelete,
          buttonMove,
          textarea,
        });
        continue;
      }

      // Kaydet butonu
      buttonSave.addEventListener("click", () => {
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
          chrome.storage.local.get("cardList", (result) => {
            let cardList = result.cardList || [];
            cardList = cardList.map((card) => {
              if (card.id == container.dataset.id) {
                card.value = textarea.value;
                card.element = containerInfo;
              }
              return card;
            });
            chrome.storage.local.set({ cardList }, () => {
              console.log("Kart güncellendi:", containerInfo);
            });
          });
        }
        buttonSave.classList.add("st-button-saved");
        setTimeout(() => buttonSave.classList.remove("st-button-saved"), 3000);
      });

      // Sil butonu
      buttonDelete.addEventListener("click", () => {
        chrome.storage.local.get("cardList", (result) => {
          let cardList = result.cardList || [];
          cardList = cardList.filter((card) => card.id != container.dataset.id);
          chrome.storage.local.set({ cardList }, () => {
            console.log("Kart silindi:", container.dataset.id);
          });
        });
        container.remove();
      });

      // Drag & Drop işlemi için değişkenler
      let isDragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      let dragTimer = null;

      // Drag başlat
      buttonMove.addEventListener("mousedown", (e) => {
        console.log("mousedown tetiklendi");
        e.preventDefault();
        isDragging = true;
        const rect = container.getBoundingClientRect();
        dragOffsetX = e.pageX - (rect.left + window.scrollX);
        dragOffsetY = e.pageY - (rect.top + window.scrollY);
        document.body.style.userSelect = "none";
      });

      // Drag hareketleri
      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const x = e.pageX - dragOffsetX;
        const y = e.pageY - dragOffsetY;

        container.style.left = `${x}px`;
        container.style.top = `${y}px`;

        // 3 saniye sonra pozisyonu kaydet
        if (dragTimer) clearTimeout(dragTimer);
        dragTimer = setTimeout(() => {
          if (container.dataset.id) {
            const containerInfo = {
              innerHTML: container.innerHTML,
              height: container.clientHeight,
              width: container.clientWidth,
              offsetLeft: container.offsetLeft,
              offsetTop: container.offsetTop,
              offsetParent: container.offsetParent,
              value: textarea.value,
            };
            chrome.storage.local.get("cardList", (result) => {
              let cardList = result.cardList || [];
              cardList = cardList.map((card) => {
                if (card.id == container.dataset.id) {
                  card.element = containerInfo;
                }
                return card;
              });
              chrome.storage.local.set({ cardList }, () => {
                console.log("Kart pozisyonu kaydedildi:", containerInfo);
              });
            });
          }
        }, 1000);
      });

      // Drag bitir
      document.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.userSelect = "";
        }
      });

      // Kartı DOM'a ekle
      document.body.appendChild(container);
    }
  }
});
