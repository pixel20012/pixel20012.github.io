let ring = null;
let previousButton = null;
let nextButton = null;
let randomButton = null;
let ringSource = "https://wirenook.net/udurgh-webring.yaml";
let currentSiteId = "pixel20012";
let ringSourceBase = new URL(ringSource, window.location.href);
let items = [];
let selectedIndex = 0;
let timer = null;

const fallbackSites = [
  {
    id: "neocities",
    name: "Neocities",
    url: "https://neocities.org",
    image: "images/neocities.png"
  },
  {
    id: "pixel20012",
    name: "Pixel20012",
    url: "https://pixel20012.neocities.org",
    image: "images/placeholder.png"
  },
  {
    id: "signal_placeholder",
    name: "Signal Placeholder",
    url: "#",
    image: "images/placeholder.png"
  }
];

function parseYaml(text) {
  const sites = [];
  let current = null;

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || line.startsWith(";")) {
      return;
    }

    if (line === "sites:") {
      return;
    }

    if (line.startsWith("- ")) {
      current = {};
      sites.push(current);
      const firstPair = line.slice(2);

      if (!firstPair.includes(":")) {
        return;
      }

      const separator = firstPair.indexOf(":");
      const key = firstPair.slice(0, separator).trim();
      const value = firstPair.slice(separator + 1).trim();
      current[key] = cleanYamlValue(value);
      return;
    }

    if (!current || !line.includes(":")) {
      return;
    }

    const separator = line.indexOf(":");
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    current[key] = cleanYamlValue(value);
  });

  return sites
    .map(normalizeSite)
    .filter((site) => site.id && site.name && site.url);
}

function cleanYamlValue(value) {
  return value.replace(/^["']|["']$/g, "");
}

function normalizeSite(site) {
  const name = site.name || site.title || site.site || site.label;
  const url = site.url || site.href || site.link || site.website;
  const image = site.image || site.img || site.button || site.banner || "images/placeholder.png";
  const id = site.id || slugify(name || url || "");

  return {
    id,
    name,
    url,
    image
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sortSites(sites) {
  return sites
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

function createRingItem(site) {
  const link = document.createElement("a");
  link.className = "webring-item";
  link.href = site.url;
  link.dataset.ringItem = "";
  link.dataset.siteId = site.id;

  const image = document.createElement("img");
  image.src = resolveAsset(site.image || "placeholder.png");
  image.alt = `${site.name} web button`;
  image.width = 200;
  image.height = 59;

  const label = document.createElement("span");
  label.textContent = site.name;

  link.append(image, label);
  return link;
}

function resolveAsset(path) {
  if (!path || path === "placeholder.png") {
    return "images/placeholder.png";
  }

  try {
    return new URL(path, ringSourceBase).href;
  } catch {
  return path;
}
}

function shortestSpot(index) {
  const raw = index - selectedIndex;
  const half = Math.floor(items.length / 2);

  if (raw > half) {
    return raw - items.length;
  }

  if (raw < -half) {
    return raw + items.length;
  }

  return raw;
}

function renderRing() {
  items.forEach((item, index) => {
    const spot = shortestSpot(index);
    const depth = Math.abs(spot);
    item.style.setProperty("--spot", spot);
    item.style.setProperty("--depth", depth);
    item.style.setProperty("--z", 10 - depth);
    item.classList.toggle("is-selected", index === selectedIndex);
    item.setAttribute("aria-current", index === selectedIndex ? "true" : "false");
  });
}

function selectItem(index) {
  selectedIndex = (index + items.length) % items.length;
  renderRing();
}

function restartTimer() {
  window.clearInterval(timer);
  timer = window.setInterval(() => selectItem(selectedIndex + 1), 3600);
}

function userSelect(index) {
  selectItem(index);
  restartTimer();
}

function bindControls() {
  previousButton.addEventListener("click", () => userSelect(selectedIndex - 1));
  nextButton.addEventListener("click", () => userSelect(selectedIndex + 1));
  randomButton.addEventListener("click", () => {
    let nextIndex = selectedIndex;

    while (nextIndex === selectedIndex && items.length > 1) {
      nextIndex = Math.floor(Math.random() * items.length);
    }

    userSelect(nextIndex);
  });

  items.forEach((item, index) => {
    item.addEventListener("click", (event) => {
      if (index !== selectedIndex) {
        event.preventDefault();
        userSelect(index);
      } else if (item.getAttribute("href") === "#") {
        event.preventDefault();
      }
    });

    item.addEventListener("focus", () => userSelect(index));
  });

  ring.addEventListener("pointerenter", () => window.clearInterval(timer));
  ring.addEventListener("pointerleave", restartTimer);
}

function mountRing(sites) {
  const sortedSites = sortSites(sites.length ? sites : fallbackSites);
  ring.replaceChildren(...sortedSites.map(createRingItem));
  items = Array.from(document.querySelectorAll("[data-ring-item]"));
  selectedIndex = Math.max(0, sortedSites.findIndex((site) => {
    return site.id === currentSiteId ||
      site.name.toLowerCase().includes(currentSiteId) ||
      site.url.toLowerCase().includes(currentSiteId);
  }));
  bindControls();
  renderRing();
  restartTimer();
}

function initWebring() {
  ring = document.querySelector("[data-webring]");

  if (!ring) {
    return;
  }

  previousButton = document.querySelector("[data-ring-prev]");
  nextButton = document.querySelector("[data-ring-next]");
  randomButton = document.querySelector("[data-ring-random]");
  ringSource = ring.dataset.ringSource || ringSource;
  currentSiteId = ring.dataset.currentSite || currentSiteId;
  ringSourceBase = new URL(ringSource, window.location.href);

  fetch(ringSource)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load ${ringSource}`);
      }

      return response.text();
    })
    .then((text) => mountRing(parseYaml(text)))
    .catch(() => mountRing(fallbackSites));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWebring, { once: true });
} else {
  initWebring();
}
