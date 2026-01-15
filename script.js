
    // --- CLOCK LOGIC ---
    function updateClock() {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      document.getElementById('win95-clock').textContent = `${hours}:${minutes} ${ampm}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- START MENU TOGGLE ---
    const startButton = document.getElementById('startButton');
    const startMenu = document.getElementById('startMenu');

    startButton.addEventListener('click', (e) => {
      const isVisible = startMenu.style.display === 'flex';
      startMenu.style.display = isVisible ? 'none' : 'flex';
      e.stopPropagation();
    });

    // Close menu when clicking desktop
    document.addEventListener('click', () => {
      startMenu.style.display = 'none';
    });

// Toggle Start Menu
const startButton = document.getElementById('startButton');
const startMenu = document.getElementById('startMenu');

startButton.addEventListener('click', () => {
  if (startMenu.style.display === 'flex') {
    startMenu.style.display = 'none';
  } else {
    startMenu.style.display = 'flex';
  }
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!startButton.contains(e.target) && !startMenu.contains(e.target)) {
    startMenu.style.display = 'none';
  }
});
