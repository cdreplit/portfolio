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

function openApp(id, name) {
  const win = document.getElementById(id);
  win.style.display = 'block';

  // Add to Taskbar if not already there
  const taskbar = document.getElementById('taskbar-apps');
  if (!document.getElementById('task-' + id)) {
    const btn = document.createElement('div');
    btn.id = 'task-' + id;
    btn.className = 'task-button';
    btn.innerText = name;
    btn.onclick = () => toggleMinimize(id);
    taskbar.appendChild(btn);
  }
}

function closeWindow(id) {
  document.getElementById(id).style.display = 'none';
  const taskBtn = document.getElementById('task-' + id);
  if (taskBtn) taskBtn.remove();
}

function toggleMinimize(id) {
  const win = document.getElementById(id);
  win.style.display = (win.style.display === 'none') ? 'block' : 'none';
}

// Simple Maximize Toggle
function maximizeWindow(id) {
  const win = document.getElementById(id);
  if (win.style.width === '100%') {
    win.style.width = '400px';
    win.style.height = 'auto';
    win.style.top = '100px';
    win.style.left = '100px';
  } else {
    win.style.width = '100%';
    win.style.height = 'calc(100% - 40px)';
    win.style.top = '0';
    win.style.left = '0';
  }
}
