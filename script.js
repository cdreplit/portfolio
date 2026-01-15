document.addEventListener("DOMContentLoaded", () => {

  // ===== CLOCK =====
  function updateClock() {
    const clock = document.getElementById("win95-clock");
    if (!clock) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0"); 
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;
    clock.textContent = `${hours}:${minutes} ${ampm}`;
  }

  setInterval(updateClock, 1000);
  updateClock();


  // ===== START MENU =====
  const startButton = document.getElementById("startButton");
  const startMenu = document.getElementById("startMenu");

  if (!startButton || !startMenu) return;

  startButton.addEventListener("click", (e) => {
    e.stopPropagation();
    startMenu.style.display =
      startMenu.style.display === "flex" ? "none" : "flex";
  });

  document.addEventListener("click", (e) => {
    if (!startButton.contains(e.target) && !startMenu.contains(e.target)) {
      startMenu.style.display = "none";
    }
  });

});
