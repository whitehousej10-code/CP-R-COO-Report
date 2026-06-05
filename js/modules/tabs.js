const instances = new Map();

function activateTab(group, tabId) {
  document.querySelectorAll(`[data-tabs="${group}"] .tab-btn`).forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(`[data-tab-group="${group}"]`).forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === tabId);
  });
  document.dispatchEvent(new CustomEvent("tabs:change", { detail: { group, tabId } }));
}

function activateSubpage(root, subpageId) {
  root.querySelectorAll("[data-subpage]").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.subpage === subpageId);
  });
  root.querySelectorAll("[data-subnav]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.subnav === subpageId);
  });
  document.dispatchEvent(new CustomEvent("subpage:change", { detail: { subpageId, root } }));
}

function activateChartView(root, viewId) {
  root.querySelectorAll("[data-chart-view]").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.chartView === viewId);
  });
  root.querySelectorAll("[data-chart-select]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.chartSelect === viewId);
  });
  document.dispatchEvent(new CustomEvent("chartview:change", { detail: { viewId, root } }));
}

function initTabGroup(tabsEl) {
  const group = tabsEl.dataset.tabs;
  const activeBtn = tabsEl.querySelector(".tab-btn.is-active") ?? tabsEl.querySelector(".tab-btn");
  if (activeBtn) activateTab(group, activeBtn.dataset.tab);
}

function handleClick(event) {
  const tabBtn = event.target.closest(".tab-btn[data-tab]");
  if (tabBtn) {
    const group = tabBtn.closest("[data-tabs]")?.dataset.tabs;
    if (group) {
      activateTab(group, tabBtn.dataset.tab);
      // initialise any nested tab groups that just became visible
      const root = document.getElementById("page-root");
      if (root) {
        root.querySelectorAll("[data-tabs]").forEach((el) => {
          // only init groups inside newly-active panels
          const panel = el.closest("[data-tab-group]");
          if (panel && panel.classList.contains("is-active")) {
            initTabGroup(el);
          }
        });
      }
    }
    return;
  }

  const subnavBtn = event.target.closest("[data-subnav]");
  if (subnavBtn) {
    event.preventDefault();
    const root = document.getElementById("page-root");
    const subpageId = subnavBtn.dataset.subnav;
    activateSubpage(root, subpageId);
    const routeId = root?.dataset.routeId;
    if (routeId === "partnerships") {
      const target = subpageId === "referrals" ? "#partnerships/referrals" : "#partnerships";
      if (location.hash !== target) {
        location.hash = target;
      } else {
        document.dispatchEvent(new CustomEvent("subpage:change", { detail: { subpageId, root } }));
      }
    }
    return;
  }

  const chartBtn = event.target.closest("[data-chart-select]");
  if (chartBtn) {
    const root = document.getElementById("page-root");
    activateChartView(root, chartBtn.dataset.chartSelect);
  }
}

export function initTabs(root = document.getElementById("page-root")) {
  if (!root || instances.has(root)) return;
  root.addEventListener("click", handleClick);
  instances.set(root, handleClick);

  root.querySelectorAll("[data-tabs]").forEach((tabsEl) => {
    initTabGroup(tabsEl);
  });
}

export function destroyTabs(root = document.getElementById("page-root")) {
  const handler = instances.get(root);
  if (handler && root) {
    root.removeEventListener("click", handler);
    instances.delete(root);
  }
}

export { activateTab, activateSubpage, activateChartView };
