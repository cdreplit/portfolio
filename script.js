// script.js

// track open order to cascade windows predictably
const windowOpenOrder = [];
let zIndexCounter = 1000;

document.addEventListener("DOMContentLoaded", () => {
  // Clock (updates on load and then every minute)
  const clock = document.getElementById("win95-clock");
  function updateClock() {
    if (!clock) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    clock.textContent = `${hours}:${minutes} ${ampm}`;
  }
  updateClock();
  const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000;
  setTimeout(() => { updateClock(); setInterval(updateClock, 60 * 1000); }, msUntilNextMinute);

  // Start menu wiring
  const startButton = document.getElementById("startButton");
  const startMenu = document.getElementById("startMenu");

  if (startButton && startMenu) {
    const toggleStartMenu = (open) => {
      const willOpen = typeof open === 'boolean' ? open : !(startMenu.classList.contains('open'));
      if (willOpen) {
        startMenu.classList.add('open');
        startMenu.style.display = 'flex';
        startMenu.setAttribute('data-open', 'true');
        startButton.setAttribute('aria-expanded', 'true');
        startMenu.setAttribute('aria-hidden', 'false');
        // focus first menu item for keyboard users
        const firstItem = startMenu.querySelector('.menu-items li');
        if (firstItem) firstItem.focus();
      } else {
        startMenu.classList.remove('open');
        startMenu.setAttribute('data-open', 'false');
        startButton.setAttribute('aria-expanded', 'false');
        startMenu.setAttribute('aria-hidden', 'true');
        setTimeout(() => { if (!startMenu.classList.contains('open')) startMenu.style.display = 'none'; }, 140);
      }
    };

    startButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStartMenu();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!startMenu.contains(e.target) && !startButton.contains(e.target)) toggleStartMenu(false);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggleStartMenu(false);
    });

    // Make menu items open links
    startMenu.querySelectorAll('.menu-items li[data-href]').forEach(li => {
      li.addEventListener('click', (ev) => {
        const href = li.dataset.href;
        if (href) window.open(href, '_blank', 'noopener,noreferrer');
      });
      li.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          const href = li.dataset.href;
          if (href) window.open(href, '_blank', 'noopener,noreferrer');
        }
      });
    });
  }

  // Wire desktop icons to open apps
  document.querySelectorAll('.desktop .icon[data-app]').forEach(icon => {
    const appId = icon.dataset.app;
    const appName = icon.querySelector('span')?.textContent?.trim() || appId;
    // click opens app
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      openApp(appId, appName);
    });
    // keyboard support
    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openApp(appId, appName);
      }
    });
  });

  // Initialize draggable windows if present
  ["about-window","music-window","videos-window","art-window","programms-window","contact-window"]
    .forEach(id => { if (document.getElementById(id)) makeDraggable(id); });
});

function openApp(id, name) {
  const win = document.getElementById(id);
  if (!win) return;
  const wasHidden = (win.style.display === 'none' || getComputedStyle(win).display === 'none');

  // base position and cascade settings
  const BASE_LEFT = 150;
  const BASE_TOP = 100;
  const STEP = 20;
  const MAX_OFFSET_INDEX = 5;

  if (wasHidden) {
    const existing = windowOpenOrder.indexOf(id);
    if (existing !== -1) windowOpenOrder.splice(existing, 1);
    windowOpenOrder.push(id);

    const offsetIndex = Math.min(windowOpenOrder.indexOf(id), MAX_OFFSET_INDEX);
    win.style.left = (BASE_LEFT + offsetIndex * STEP) + 'px';
    win.style.top = (BASE_TOP + offsetIndex * STEP) + 'px';
  }

  win.style.display = 'flex';

  const taskbar = document.getElementById('taskbar-apps');
  if (taskbar && !document.getElementById('task-' + id)) {
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
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;
    btn.dataset.appName = name || id.replace('-window','');

    const src = findIconSrc(name);
    if (src) {
      const i = document.createElement('img');
      i.src = src;
      i.alt = name;
      i.className = 'task-button-icon';
      btn.appendChild(i);
    }

    const text = document.createElement('span');
    text.textContent = name || id.replace('-window','');
    btn.appendChild(text);

    btn.addEventListener('click', () => toggleMinimize(id));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMinimize(id); }
    });

    taskbar.appendChild(btn);
  }

  // bring the window to front using counter
  zIndexCounter += 1;
  win.style.zIndex = zIndexCounter;
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) win.style.display = 'none';
  const taskBtn = document.getElementById('task-' + id);
  if (taskBtn) taskBtn.remove();
  const idx = windowOpenOrder.indexOf(id);
  if (idx !== -1) windowOpenOrder.splice(idx, 1);
}

function toggleMinimize(id) {
  const win = document.getElementById(id);
  if (!win) return;
  const nowHidden = (win.style.display === 'none' || getComputedStyle(win).display === 'none');
  if (nowHidden) {
    const taskBtn = document.getElementById('task-' + id);
    const name = taskBtn?.dataset?.appName || id.replace('-window','');
    openApp(id, name);
  } else {
    win.style.display = 'none';
    const idx = windowOpenOrder.indexOf(id);
    if (idx !== -1) windowOpenOrder.splice(idx, 1);
  }
}

function maximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  const isMax = win.dataset.maximized === "true";
  if (isMax) {
    win.style.width = win.dataset.prevWidth || '400px';
    win.style.height = win.dataset.prevHeight || 'auto';
    win.style.top = win.dataset.prevTop || '100px';
    win.style.left = win.dataset.prevLeft || '150px';
    win.dataset.maximized = "false";
  } else {
    win.dataset.prevWidth = win.style.width || getComputedStyle(win).width;
    win.dataset.prevHeight = win.style.height || getComputedStyle(win).height;
    win.dataset.prevTop = win.style.top || getComputedStyle(win).top;
    win.dataset.prevLeft = win.style.left || getComputedStyle(win).left;
    win.style.width = '100vw';
    win.style.height = 'calc(100vh - 40px)';
    win.style.top = '0';
    win.style.left = '0';
    win.dataset.maximized = "true";
  }
}

function makeDraggable(windowId) {
  const win = document.getElementById(windowId);
  if (!win) return;
  const titleBar = win.querySelector(".window-titlebar");
  if (!titleBar) return;

  let startX = 0, startY = 0, startLeft = 0, startTop = 0;
  const onPointerDown = (e) => {
    e.preventDefault();
    const isTouch = e.type === 'touchstart';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;
    startLeft = win.offsetLeft;
    startTop = win.offsetTop;

    const onPointerMove = (ev) => {
      const mx = (ev.type.startsWith('touch')) ? ev.touches[0].clientX : ev.clientX;
      const my = (ev.type.startsWith('touch')) ? ev.touches[0].clientY : ev.clientY;
      const dx = mx - startX;
      const dy = my - startY;
      win.style.left = (startLeft + dx) + "px";
      win.style.top = (startTop + dy) + "px";
    };

    const onPointerUp = () => {
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);
    };

    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);

    // bring to front
    zIndexCounter += 1;
    win.style.zIndex = zIndexCounter;
  };

  titleBar.addEventListener('mousedown', onPointerDown);
  titleBar.addEventListener('touchstart', onPointerDown, { passive: false });
}
