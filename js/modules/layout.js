import { NAV_ITEMS } from "../config/navigation.js";

export function renderSidebar(container, activeRoute) {
  container.innerHTML = `
    <div class="sidebar-logo">CP+R<span>FY 25/26</span></div>
    <div class="nav-items">
      ${NAV_ITEMS.map(
        (item) => `
        <a href="#${item.id}" class="nav-item${item.id === activeRoute ? " is-active" : ""}"
           data-route="${item.id}"
           ${item.id === activeRoute ? 'aria-current="page"' : ""}>
          <span class="nav-icon">${item.icon}</span>
          ${item.label}
        </a>`
      ).join("")}
    </div>`;
}

export function setActiveNav(activeRoute) {
  document.querySelectorAll(".nav-item[data-route]").forEach((el) => {
    const isActive = el.dataset.route === activeRoute;
    el.classList.toggle("is-active", isActive);
    if (isActive) {
      el.setAttribute("aria-current", "page");
    } else {
      el.removeAttribute("aria-current");
    }
  });
}

export function setPageTitle(title) {
  document.title = title;
}
