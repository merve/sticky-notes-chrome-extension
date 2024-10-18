document.addEventListener("DOMContentLoaded", function () {
  const goToNotes = document.getElementById("popup-open-notes");
  goToNotes.addEventListener("click", function () {
    chrome.tabs.create({ url: "dashboard.html" });
  });
});
