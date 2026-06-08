async function includeLayouts() {
  const includeTargets = Array.from(document.querySelectorAll("[data-include]"));

  await Promise.all(includeTargets.map(async (target) => {
    const source = target.dataset.include;

    try {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(`Could not load ${source}`);
      }

      target.innerHTML = await response.text();
    } catch (error) {
      const localFileHint = window.location.protocol === "file:"
        ? " Open the site through a local server instead of directly from disk."
        : "";

      target.innerHTML = `<p class="layout-error">Layout could not load: ${source}.${localFileHint}</p>`;
    }
  }));

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
  const context = document.querySelector("[data-rail-context]");
  const detail = document.querySelector("[data-rail-detail]");

  if (context && document.body.dataset.railContext) {
    context.textContent = document.body.dataset.railContext;
  }

  if (detail && document.body.dataset.railDetail) {
    detail.textContent = document.body.dataset.railDetail;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", includeLayouts);
} else {
  includeLayouts();
}
