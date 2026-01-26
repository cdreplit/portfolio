// track open order to cascade windows predictably
const windowOpenOrder = [];

document.addEventListener("DOMContentLoaded", () => { 
  // CLOCK
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

  // INITIALIZE DRAGGING
  makeDraggable("about-window");
  makeDraggable("music-window");
  makeDraggable("videos-window");
  makeDraggable("art-window");
  makeDraggable("programms-window");
  makeDraggable("contact-window");
});

function openApp(id, name) {
  const win = document.getElementById(id);
  // determine if window was hidden so we only reposition on newly opening
  const wasHidden = (win.style.display === 'none' || getComputedStyle(win).display === 'none');

  // base position and cascade settings
  const BASE_LEFT = 150;
  const BASE_TOP = 100;
  const STEP = 20; // pixels to offset per open window
  const MAX_OFFSET_INDEX = 5; // for up to 6 windows diagonal

  if (wasHidden) {
    // treat this as newly opened: remove existing occurrence then push to end
    const existing = windowOpenOrder.indexOf(id);
    if (existing !== -1) windowOpenOrder.splice(existing, 1);
    windowOpenOrder.push(id);

    const offsetIndex = Math.min(windowOpenOrder.indexOf(id), MAX_OFFSET_INDEX);
    win.style.left = (BASE_LEFT + offsetIndex * STEP) + 'px';
    win.style.top = (BASE_TOP + offsetIndex * STEP) + 'px';
  }

  win.style.display = 'flex';
  const taskbar = document.getElementById('taskbar-apps');
  if (!document.getElementById('task-' + id)) {
    // helper: find desktop icon src by matching the visible label
    const findIconSrc = (appName) => {
      const icons = document.querySelectorAll('.desktop .icon');
      for (const ic of icons) {
        const label = ic.querySelector('span');
        const img = ic.querySelector('img');
        if (label && img && label.textContent.trim() === appName) return img.src;
      }
      return null;
    };

    const btn = document.createElement('div');
    btn.id = 'task-' + id;
    btn.className = 'task-button';

    const src = findIconSrc(name);
    if (src) {
      const i = document.createElement('img');
      i.src = src;
      i.alt = name;
      i.className = 'task-button-icon';
      btn.appendChild(i);
    }

    const text = document.createElement('span');
    text.textContent = name;
    btn.appendChild(text);

    btn.onclick = () => toggleMinimize(id);
    taskbar.appendChild(btn);
  }
  // bring the window to front
  document.querySelectorAll('.window').forEach(w => w.style.zIndex = 100);
  win.style.zIndex = 1001;
}

function closeWindow(id) {
  document.getElementById(id).style.display = 'none';
  const taskBtn = document.getElementById('task-' + id);
  if (taskBtn) taskBtn.remove();
  // remove from open order when closed
  const idx = windowOpenOrder.indexOf('' + id);
  if (idx !== -1) windowOpenOrder.splice(idx, 1);
}

function toggleMinimize(id) {
  const win = document.getElementById(id);
  const nowHidden = (win.style.display === 'none' || getComputedStyle(win).display === 'none');
  if (nowHidden) {
    // showing window
    openApp(id, (document.getElementById('task-' + id) || {}).innerText || id.replace('-window',''));
  } else {
    // hiding window
    win.style.display = 'none';
    const idx = windowOpenOrder.indexOf('' + id);
    if (idx !== -1) windowOpenOrder.splice(idx, 1);
  }
}

function maximizeWindow(id) {
  const win = document.getElementById(id);
  if (win.style.width === '100vw') {
    win.style.width = '400px'; win.style.height = 'auto'; win.style.top = '100px'; win.style.left = '150px';
  } else {
    win.style.width = '100vw'; win.style.height = 'calc(100vh - 40px)'; win.style.top = '0'; win.style.left = '0';
  }
}

function makeDraggable(windowId) {
  const win = document.getElementById(windowId);
  const titleBar = win.querySelector(".window-titlebar");
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  titleBar.onmousedown = (e) => {
    e.preventDefault();
    pos3 = e.clientX; pos4 = e.clientY;
    document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
    document.onmousemove = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
      pos3 = e.clientX; pos4 = e.clientY;
      win.style.top = (win.offsetTop - pos2) + "px";
      win.style.left = (win.offsetLeft - pos1) + "px";
    };
    document.querySelectorAll('.window').forEach(w => w.style.zIndex = 100);
    win.style.zIndex = 1001;
  };
}
