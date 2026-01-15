document.addEventListener("DOMContentLoaded", () => {
  // CLOCK LOGIC
  function updateClock() {
    const clock = document.getElementById("win95-clock");
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    if (clock) clock.textContent = `${hours}:${minutes} ${ampm}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // START MENU
  const startButton = document.getElementById("startButton");
  const startMenu = document.getElementById("startMenu");
  startButton.addEventListener("click", (e) => {
    e.stopPropagation();
    startMenu.style.display = startMenu.style.display === "flex" ? "none" : "flex";
  });
  document.addEventListener("click", (e) => {
    if (!startMenu.contains(e.target)) startMenu.style.display = "none";
  });

  // DRAGGING INITIALIZATION
  makeDraggable("about-window");
  makeDraggable("music-window");
});

// WINDOW MANAGEMENT
function openApp(id, name) {
  const win = document.getElementById(id);
  win.style.display = 'flex';
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
  win.style.display = (win.style.display === 'none') ? 'flex' : 'none';
}

function maximizeWindow(id) {
  const win = document.getElementById(id);
  if (win.style.width === '100vw') {
    win.style.width = '400px';
    win.style.height = 'auto';
    win.style.top = '100px';
    win.style.left = '150px';
  } else {
    win.style.width = '100vw';
    win.style.height = 'calc(100vh - 40px)';
    win.style.top = '0';
    win.style.left = '0';
  }
}

function makeDraggable(windowId) {
  const win = document.getElementById(windowId);
  const titleBar = win.querySelector(".window-titlebar");
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  titleBar.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    document.querySelectorAll('.window').forEach(w => w.style.zIndex = 100);
    win.style.zIndex = 1001; 
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    win.style.top = (win.offsetTop - pos2) + "px";
    win.style.left = (win.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
