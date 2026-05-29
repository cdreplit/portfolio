// Track open order to cascade windows predictably
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

    if (clock) {
      clock.textContent = `${hours}:${minutes} ${ampm}`;
    }
  }

  setInterval(updateClock, 1000);
  updateClock();

  // START MENU
  const startButton = document.getElementById("startButton");
  const startMenu = document.getElementById("startMenu");

  startButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = startMenu.classList.contains("open");

    if (isOpen) {
      startMenu.classList.remove("open");
      startButton.setAttribute("aria-expanded", "false");
    } else {
      startMenu.classList.add("open");
      startButton.setAttribute("aria-expanded", "true");
    }
  });

  document.addEventListener("click", (e) => {
    if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
      startMenu.classList.remove("open");
      startButton.setAttribute("aria-expanded", "false");
    }
  });

  // START MENU ITEMS
  const menuItems = document.querySelectorAll(".menu-items li[data-href]");

  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      const href = item.getAttribute("data-href");
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    });

    // Keyboard accessibility
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const href = item.getAttribute("data-href");
        if (href) {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      }
    });
  });

  // INITIALIZE DRAGGING
  makeDraggable("about-window");
  makeDraggable("music-window");
  makeDraggable("videos-window");
  makeDraggable("art-window");
  makeDraggable("programms-window");
  makeDraggable("contact-window");

  // VIDEOS WINDOW: table-of-contents navigation
  const videoNavButtons = document.querySelectorAll(
    "#videos-window .videos-nav-item[data-target]"
  );
  const videosMain = document.querySelector("#videos-window .videos-main");

  videoNavButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      if (!targetId || !videosMain) return;
      const target = videosMain.querySelector("#" + targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // MUSIC WINDOW: table-of-contents navigation
  const musicNavButtons = document.querySelectorAll(
    "#music-window .music-nav-item[data-target]"
  );
  const musicMain = document.querySelector("#music-window .music-main");

  musicNavButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      if (!targetId || !musicMain) return;
      const target = musicMain.querySelector("#" + targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  initVideoPlayers();

  // AUTO-OPEN ABOUT ME ON LOAD
  openApp("about-window", "About Me");
});

function initVideoPlayers() {
  document.querySelectorAll(".video-wrap").forEach((wrap) => {
    if (wrap.dataset.playerInit) return;
    wrap.dataset.playerInit = "1";

    const provider = getVideoProvider(wrap);
    const posterBtn = createVideoPosterButton();

    if (provider === "html5") {
      setupHtml5Player(wrap, posterBtn);
    } else if (provider === "vimeo") {
      setupVimeoPlayer(wrap, posterBtn);
    } else {
      setupYouTubePlayer(wrap, posterBtn);
    }
  });
}

function getVideoProvider(wrap) {
  if (wrap.dataset.provider) return wrap.dataset.provider;
  if (wrap.querySelector("video source, video[src]")) return "html5";
  const iframe = wrap.querySelector("iframe");
  if (iframe?.src.includes("vimeo.com")) return "vimeo";
  return "youtube";
}

function getVideoId(wrap, provider) {
  if (wrap.dataset.videoId) return wrap.dataset.videoId;
  const iframe = wrap.querySelector("iframe");
  if (!iframe) return null;
  const src = iframe.getAttribute("src") || "";
  if (provider === "vimeo") {
    const match = src.match(/vimeo\.com\/video\/(\d+)/);
    return match ? match[1] : null;
  }
  const match = src.match(/embed\/([^?&]+)/);
  return match ? match[1] : null;
}

function createVideoPosterButton() {
  const poster = document.createElement("button");
  poster.type = "button";
  poster.className = "video-poster";
  poster.setAttribute("aria-label", "Play video");

  const thumb = document.createElement("img");
  thumb.alt = "";
  thumb.decoding = "async";
  thumb.loading = "eager";

  const playIcon = document.createElement("span");
  playIcon.className = "video-play-icon";
  playIcon.setAttribute("aria-hidden", "true");
  playIcon.textContent = "▶";

  poster.append(thumb, playIcon);
  return poster;
}

function setPosterImage(img, url, fallbackUrls = []) {
  const urls = [url, ...fallbackUrls];
  let index = 0;

  const tryNext = () => {
    if (index >= urls.length) return;
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    img.src = urls[index];
    index += 1;
  };

  img.onload = () => {
    // YouTube sometimes returns a tiny grey placeholder instead of 404
    if (img.naturalWidth <= 120 && index < urls.length) {
      tryNext();
    }
  };

  img.onerror = tryNext;

  index = 0;
  tryNext();
}

function setYouTubePoster(img, videoId) {
  const base = `https://i.ytimg.com/vi/${videoId}`;
  setPosterImage(img, `${base}/maxresdefault.jpg`, [
    `${base}/sddefault.jpg`,
    `${base}/hqdefault.jpg`,
    `${base}/mqdefault.jpg`,
  ]);
}

async function fetchVimeoPoster(videoId) {
  const res = await fetch(
    `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`
  );
  if (!res.ok) throw new Error("Vimeo oEmbed failed");
  const data = await res.json();
  const url = data.thumbnail_url || "";
  return url.replace(/_\d+(?:x\d+)?(\.\w+)$/, "_1280$1");
}

function setupYouTubePlayer(wrap, posterBtn) {
  const videoId = getVideoId(wrap, "youtube");
  if (!videoId) return;

  const thumb = posterBtn.querySelector("img");
  setYouTubePoster(thumb, videoId);
  wrap.appendChild(posterBtn);

  posterBtn.addEventListener("click", () => {
    let iframe = wrap.querySelector("iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      );
      iframe.title = "YouTube video player";
      wrap.appendChild(iframe);
    }
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&playsinline=1`;
    wrap.classList.add("is-playing");
    posterBtn.setAttribute("hidden", "");
  });
}

function setupVimeoPlayer(wrap, posterBtn) {
  const videoId = getVideoId(wrap, "vimeo");
  if (!videoId) return;

  const thumb = posterBtn.querySelector("img");
  wrap.appendChild(posterBtn);

  fetchVimeoPoster(videoId)
    .then((url) => setPosterImage(thumb, url))
    .catch(() => {
      thumb.src = `https://vumbnail.com/${videoId}.jpg`;
    });

  posterBtn.addEventListener("click", () => {
    let iframe = wrap.querySelector("iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute(
        "allow",
        "autoplay; fullscreen; picture-in-picture"
      );
      iframe.title = "Vimeo video player";
      wrap.appendChild(iframe);
    }
    iframe.src = `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0&quality=1080p`;
    wrap.classList.add("is-playing");
    posterBtn.setAttribute("hidden", "");
  });
}

function setupHtml5Player(wrap, posterBtn) {
  let video = wrap.querySelector("video");
  if (!video) return;

  const thumb = posterBtn.querySelector("img");
  const posterUrl =
    wrap.dataset.poster || video.getAttribute("poster") || "";
  if (posterUrl) {
    setPosterImage(thumb, posterUrl);
  } else {
    thumb.remove();
  }

  wrap.appendChild(posterBtn);
  video.preload = "none";
  video.playsInline = true;
  video.controls = true;

  posterBtn.addEventListener("click", () => {
    wrap.classList.add("is-playing");
    posterBtn.setAttribute("hidden", "");
    video.play().catch(() => {});
  });
}

function openApp(id, name) {
  const win = document.getElementById(id);

  // Determine if window was hidden
  const wasHidden =
    win.style.display === "none" ||
    getComputedStyle(win).display === "none";

  // Cascade settings
  const BASE_LEFT = 150;
  const BASE_TOP = 100;
  const STEP = 20;
  const MAX_OFFSET_INDEX = 5;

  if (wasHidden) {
    const existing = windowOpenOrder.indexOf(id);
    if (existing !== -1) windowOpenOrder.splice(existing, 1);

    windowOpenOrder.push(id);

    win.classList.remove("maximized");
    win.style.width = "";
    win.style.height = "";

    const offsetIndex = Math.min(
      windowOpenOrder.indexOf(id),
      MAX_OFFSET_INDEX
    );

    win.style.left = `${BASE_LEFT + offsetIndex * STEP}px`;
    win.style.top = `${BASE_TOP + offsetIndex * STEP}px`;
  }

  win.style.display = "flex";

  const taskbar = document.getElementById("taskbar-apps");

  if (!document.getElementById("task-" + id)) {
    // Find desktop icon src
    const findIconSrc = (appName) => {
      const icons = document.querySelectorAll(".desktop .icon");
      for (const ic of icons) {
        const label = ic.querySelector("span");
        const img = ic.querySelector("img");
        if (label && img && label.textContent.trim() === appName) {
          return img.src;
        }
      }
      return null;
    };

    const btn = document.createElement("div");
    btn.id = "task-" + id;
    btn.className = "task-button";

    const src = findIconSrc(name);
    if (src) {
      const i = document.createElement("img");
      i.src = src;
      i.alt = name;
      i.className = "task-button-icon";
      btn.appendChild(i);
    }

    const text = document.createElement("span");
    text.textContent = name;
    btn.appendChild(text);

    btn.onclick = () => toggleMinimize(id);
    taskbar.appendChild(btn);
  }

  // Bring window to front
  document.querySelectorAll(".window").forEach(
    (w) => (w.style.zIndex = 100)
  );
  win.style.zIndex = 1001;
}

function closeWindow(id) {
  const win = document.getElementById(id);

  win.style.display = "none";
  win.classList.remove("maximized");
  win.style.width = "";
  win.style.height = "";

  const taskBtn = document.getElementById("task-" + id);
  if (taskBtn) taskBtn.remove();

  const idx = windowOpenOrder.indexOf(id);
  if (idx !== -1) windowOpenOrder.splice(idx, 1);

  win.querySelectorAll(".video-wrap").forEach((wrap) => {
    const frame = wrap.querySelector("iframe");
    if (frame) {
      frame.src = "";
      frame.remove();
    }

    const video = wrap.querySelector("video");
    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    wrap.classList.remove("is-playing");

    const poster = wrap.querySelector(".video-poster");
    if (poster) poster.removeAttribute("hidden");
  });
}


function toggleMinimize(id) {
  const win = document.getElementById(id);
  const nowHidden =
    win.style.display === "none" ||
    getComputedStyle(win).display === "none";

  if (nowHidden) {
    openApp(
      id,
      (document.getElementById("task-" + id) || {}).innerText ||
        id.replace("-window", "")
    );
  } else {
    win.style.display = "none";
    const idx = windowOpenOrder.indexOf(id);
    if (idx !== -1) windowOpenOrder.splice(idx, 1);
  }
}

function maximizeWindow(id) {
  const win = document.getElementById(id);
  const isMax = win.classList.contains("maximized");

  if (isMax) {
    win.classList.remove("maximized");
    win.style.width = "";
    win.style.height = "";
    win.style.left = win._restoreLeft ?? "150px";
    win.style.top = win._restoreTop ?? "100px";
  } else {
    win._restoreLeft = win.style.left || "150px";
    win._restoreTop = win.style.top || "100px";
    win.classList.add("maximized");
  }
}

function makeDraggable(windowId) {
  const win = document.getElementById(windowId);
  const titleBar = win.querySelector(".window-titlebar");

  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  titleBar.onmousedown = (e) => {
    if (win.classList.contains("maximized")) return;

    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;

    document.onmouseup = () => {
      document.onmouseup = null;
      document.onmousemove = null;
    };

    document.onmousemove = (e) => {
      e.preventDefault();

      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      win.style.top = win.offsetTop - pos2 + "px";
      win.style.left = win.offsetLeft - pos1 + "px";
    };

    document.querySelectorAll(".window").forEach(
      (w) => (w.style.zIndex = 100)
    );
    win.style.zIndex = 1001;
  };
}
