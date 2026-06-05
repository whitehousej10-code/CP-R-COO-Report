import { findNavItem, DEFAULT_ROUTE } from "../config/navigation.js";
import { setActiveNav, setPageTitle } from "./layout.js";
import { initTabs, destroyTabs, activateSubpage } from "./tabs.js";
import { initCharts, destroyCharts } from "./charts.js";
import { initTables, destroyTables } from "./tables.js";

let currentRoute = null;
let currentSubRoute = null;

export function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || DEFAULT_ROUTE;
  const [routeId, subRoute] = raw.split("/");
  return { routeId: routeId || DEFAULT_ROUTE, subRoute: subRoute || null };
}

async function loadPartial(routeId) {
  const response = await fetch(`pages/${routeId}.html`);
  if (!response.ok) {
    throw new Error(`Failed to load page: ${routeId}`);
  }
  return response.text();
}

function applySubRoute(root, subRoute, routeId) {
  if (routeId === "partnerships" && subRoute === "referrals") {
    activateSubpage(root, "referrals");
  } else if (routeId === "partnerships") {
    activateSubpage(root, "income");
  }
}

export async function navigate(routeId, subRoute = null) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (routeId === currentRoute && subRoute !== currentSubRoute) {
    currentSubRoute = subRoute;
    applySubRoute(root, subRoute, routeId);
    initCharts(root);
    return;
  }

  if (routeId === currentRoute && subRoute === currentSubRoute) {
    return;
  }

  destroyTabs(root);
  destroyCharts(root);
  destroyTables(root);

  root.innerHTML = '<div class="page-loading">Loading…</div>';
  setActiveNav(routeId);

  try {
    const html = await loadPartial(routeId);
    root.innerHTML = html;
    currentRoute = routeId;
    currentSubRoute = subRoute;

    const navItem = findNavItem(routeId);
    const pageTitle = root.querySelector("[data-page-title]")?.dataset.pageTitle;
    setPageTitle(pageTitle ?? navItem.title);

    initTabs(root);
    initCharts(root);
    initTables(root);

    if (subRoute) {
      applySubRoute(root, subRoute, routeId);
    } else if (routeId === "partnerships") {
      applySubRoute(root, "income", routeId);
    }
  } catch (error) {
    root.innerHTML = `<div class="page-error">${error.message}. Serve via HTTP (see scripts/serve.sh).</div>`;
    setPageTitle("CP+R · Error");
  }
}

export function initRouter() {
  const go = () => {
    const { routeId, subRoute } = parseHash();
    navigate(routeId, subRoute);
  };

  window.addEventListener("hashchange", go);
  go();
}

export function getCurrentRoute() {
  return { routeId: currentRoute, subRoute: currentSubRoute };
}
