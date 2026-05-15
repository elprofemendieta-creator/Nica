const startBtn = document.getElementById("startBtn");
const menuSection = document.getElementById("menuSection");

startBtn.addEventListener("click", () => {

  menuSection.classList.remove("hidden");

  startBtn.style.display = "none";

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth"
  });

});
