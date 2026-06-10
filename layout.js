async function includeLayouts() {
  const includeTargets = Array.from(document.querySelectorAll("[data-include]"));
  const baseUrl = document.baseURI;
  const isFileProtocol = window.location.protocol === "file:";

  for (const target of includeTargets) {
    const source = String(target.dataset.include || "").trim();
    if (!source) {
      continue;
    }

    const requestUrl = new URL(source, baseUrl).href;

    try {
      const response = await fetch(requestUrl, { cache: "reload" });

      if (!response.ok) {
        throw new Error(`Could not load ${source} (${response.status})`);
      }

      const html = await response.text();
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      target.replaceWith(...Array.from(wrapper.childNodes));
    } catch (error) {
      console.error("Layout include failed:", source, error);
      target.innerHTML = "";
      const errorNode = document.createElement("p");
      errorNode.className = "layout-error";
      errorNode.textContent = `Layout could not load: ${source}${isFileProtocol ? " (run via a local HTTP server)" : ""}`;
      target.appendChild(errorNode);
    }
  }

  setActiveNavigation();
  setArchiveRail();
  document.dispatchEvent(new CustomEvent("pixel20012:layouts-ready"));
}

function setActiveNavigation() {
  const page = document.body.dataset.page || "home";
  const activeLink = document.querySelector(`[data-nav-page="${page}"]`);

  if (!activeLink) {
    return;
  }

  activeLink.classList.add("active");
  activeLink.setAttribute("aria-current", "page");
}

function setArchiveRail() {
  const contexts = document.body.querySelectorAll("[data-rail-context]");
  const details = document.body.querySelectorAll("[data-rail-detail]");

  if (document.body.dataset.railContext) {
    contexts.forEach((context) => {
      context.textContent = document.body.dataset.railContext;
    });
  }

  if (document.body.dataset.railDetail) {
    details.forEach((detail) => {
      detail.textContent = document.body.dataset.railDetail;
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", includeLayouts);
} else {
  includeLayouts();
}
