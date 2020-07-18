const PROJECT_CLEANUP_DELAY = 3000;

const MAIN_CSS = "main.css";
const FLICKITY_DIST = "https://unpkg.com/flickity@2/dist/flickity.pkgd.min.js";
const FLICKITY_CSS_DIST = "https://unpkg.com/flickity@2/dist/flickity.min.css";
const FLICKITY_BG_LAZY_LOAD_DIST = "https://npmcdn.com/flickity-bg-lazyload@1.0.0/bg-lazyload.js";
const FLICKITY_FULLSCREEN_DIST = "https://unpkg.com/flickity-fullscreen@1/fullscreen.js";
const FLICKITY_FULLSCREEN_CSS_DIST = "https://unpkg.com/flickity-fullscreen@1/fullscreen.css";

const VIMEO_DIST = "https://player.vimeo.com/api/player.js";
const FONT_DIST = "https://fonts.googleapis.com/css2?family=Arsenal:ital,wght@0,400;0,700;1,400;1,700&display=swap";
const FONT_AWESOME_DIST = "https://kit.fontawesome.com/0bbdfd8b39.js";

const imageLoadHandler = (event) => {
  const image = event.target;
  image.classList.add("loaded");
  event.target.removeEventListener("load", imageLoadHandler);
}

// restoring back image src attributes
for (let i = 0; i < document.images.length; i++) {
  const image = document.images[i];
  const dataSrc = image.getAttribute("data-src");
  if (dataSrc) {
    image.addEventListener("load", imageLoadHandler);
    image.src = image.getAttribute("data-src");
    image.removeAttribute("data-src");
  }
}

const miniatures = document.getElementById("project-miniatures");
const projects = document.getElementById("projects");
const me = document.getElementById("me");
const footer = document.getElementsByTagName("footer")[0];

function show(element) {
  element.classList.remove("hidden");
  element.classList.add("fade-in");
}

function addCss(href, callback, errorCallback) {
  const link = document.createElement("link");
  if (callback) {
    link.onload = callback;
  }
  if (errorCallback) {
    link.onerror = errorCallback;
  };
  link.setAttribute("href", href);
  link.setAttribute("rel", "stylesheet");
  document.head.appendChild(link);
}

const loadJs = (src, crossorigin) => new Promise((resolve, reject) => {
  addScript(src, () => { resolve(); }, (error) => { reject(error); }, crossorigin);
});

const loadCss = (src) => new Promise((resolve, reject) => {
  addCss(src, () => { resolve(); }, (error) => { reject(error); });
});

function newPlayer(element) {
  element.player = new Vimeo.Player(element, {
    id: element.getAttribute("data-video-id"),
    responsive: true,
    byline: false,
    title: false,
    color: "ffffff"
  });
  return element.player;
}

function setVisibility(button, visibility) {
  const value = visibility ? "visible" : "hidden";
  button.element.style.visibility = value;
}

function initializeMedia(media) {
  media.querySelectorAll(":scope > .flickity").forEach(flickityElement => {
    const flickity = flickityElement.flickity;
    flickityElement.querySelectorAll(".vimeo-video").forEach(video => {
      function showButtons(visibility) {
        setVisibility(flickity.prevButton, visibility);
        setVisibility(flickity.nextButton, visibility);
      }
      const player = newPlayer(video);
      player.ready().then(() => flickity.resize());
      player.on("playing", () => showButtons(false));
      player.on("pause",   () => showButtons(true));
      player.on("ended",   () => showButtons(true));
      player.on("loaded", () => {
        video.classList.add("loaded");
        flickity.resize();
      });
      flickity.on("change", (index) => { player.pause(); });
    });
  });
  media.querySelectorAll(":scope > .vimeo-video").forEach(video => {
    newPlayer(video);
  });
}

function cleanUpMedia(media) {
  videos = media.querySelectorAll(".vimeo-video");
  videos.forEach(video => {
    if (video.player) {
      video.player.destroy().then(() => {
        video.player = null;
        video.textContent = "";
      });
    }
    video.classList.remove("loaded");
  });
}

function initializeProject(project) {
  if (project.id == "xemantic") {
    const iframe = project.querySelector("iframe");
    iframe.src = window.location.href.split("#")[0] + "?x"
  } else {
    initializeMedia(project.querySelector(".media"));
  }
}

function cleanUpProject(project) {
  if (project.id == "xemantic") {
    let iframe = project.querySelector("iframe");
    iframe.removeAttribute("src");
  } else {
    cleanUpMedia(project.querySelector(".media"));
  }
}

Promise.all([
  loadCss(FONT_DIST),
  loadJs(FONT_AWESOME_DIST, "anonymous"),
  loadJs(FLICKITY_DIST).then(() => Promise.all([
    loadJs(FLICKITY_FULLSCREEN_DIST),
    loadJs(FLICKITY_BG_LAZY_LOAD_DIST)
  ])),
  loadJs(VIMEO_DIST),
  loadCss(MAIN_CSS),
  loadCss(FLICKITY_CSS_DIST),
  loadCss(FLICKITY_FULLSCREEN_CSS_DIST)
]).then(() => initialize());

function initialize() {
  const flickityMiniatures = new Flickity(miniatures, {
    bgLazyLoad: 2,
    freeScroll: true,
    pageDots: false,
  });
  var selectedProject = null;
  const projectCleaner = (projectToClean) => {
    if (!projectToClean) {
      return;
    }
    setTimeout(() => {
      if (projectToClean != selectedProject) {
        cleanUpProject(projectToClean);
      }
    }, PROJECT_CLEANUP_DELAY);
  }

  const hashChangeHandler = (e) => {
    const hash = location.hash;
    if (!hash) return;
    const project = projects.querySelector(hash);
    if (!project) return;
    flickityMiniatures.selectCell("[href='" + hash + "']");
    const height = project.clientHeight + "px";
    projects.style.height = height;
    me.style.marginTop = height;
    initializeProject(project);
    projectCleaner(selectedProject);
    selectedProject = project;
  };
  window.addEventListener("hashchange", hashChangeHandler, false);

  root.style.setProperty("--z-index-background", -2);
  show(miniatures);
  show(projects);
  show(me);
  show(footer);
  flickityMiniatures.resize();

  initializeProjects();

  let hash = window.location.hash;
  if (hash) {
    hashChangeHandler();
    if (selectedProject) {
      selectedProject.scrollIntoView();
    }
  }
}

function initializeProjects() {
  projects.querySelectorAll(".flickity").forEach(flickityElement => {
    const flickity = new Flickity(flickityElement, {
      adaptiveHeight: true
    });
    flickityElement.flickity = flickity;
    flickityElement.imageLoadHandler = (e) => flickity.resize();
    flickityElement.querySelectorAll("img.medium").forEach(image => {
      image.addEventListener("load", flickity.imageLoadHandler);
    });
  });
}
