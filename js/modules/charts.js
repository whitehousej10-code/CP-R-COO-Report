import { CHART_COLORS, darkBarOptions } from "../config/chart-theme.js";

function getChart() {
  if (!window.Chart) {
    throw new Error("Chart.js not loaded");
  }
  return window.Chart;
}

const chartInstances = new Map();

async function loadChartConfig(canvas) {
  const inline = canvas.dataset.chartConfig;
  if (inline) {
    return JSON.parse(inline);
  }
  const src = canvas.dataset.chartSrc;
  const key = canvas.dataset.chart;
  if (src) {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Chart config not found: ${src}`);
    const all = await response.json();
    return key ? all[key] : all;
  }
  return null;
}

function buildChart(canvas, config) {
  const key = canvas.id || canvas.dataset.chart;
  if (chartInstances.has(key)) return chartInstances.get(key);

  const ctx = canvas.getContext("2d");
  let chartConfig;

  if (config.preset === "fyVolume") {
    chartConfig = {
      type: "bar",
      data: {
        labels: config.labels,
        datasets: [{
          data: config.data,
          backgroundColor: CHART_COLORS.blue,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: darkBarOptions({ yMax: config.yMax ?? 1100 }),
    };
  } else if (config.preset === "seasonality") {
    const colors = config.data.map((v, i) =>
      i === 11 ? CHART_COLORS.yellow : v >= 400 ? CHART_COLORS.blue : "#3a7fad"
    );
    chartConfig = {
      type: "bar",
      data: {
        labels: config.labels,
        datasets: [{
          data: config.data,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: darkBarOptions({ yMin: 200, yMax: 500, yBeginAtZero: false }),
    };
  } else {
    chartConfig = config;
  }

  const Chart = getChart();
  const chart = new Chart(ctx, chartConfig);
  chartInstances.set(key, chart);
  return chart;
}

async function initCanvas(canvas) {
  if (canvas.dataset.chartInitialized === "true") return;
  const config = await loadChartConfig(canvas);
  if (!config) return;
  buildChart(canvas, config);
  canvas.dataset.chartInitialized = "true";
}

function initVisibleCharts(root) {
  root.querySelectorAll("canvas[data-chart]").forEach((canvas) => {
    const view = canvas.closest("[data-chart-view]");
    if (!view || view.classList.contains("is-active")) {
      initCanvas(canvas);
    }
  });
}

function destroyChartInstances(root) {
  root.querySelectorAll("canvas[data-chart]").forEach((canvas) => {
    const key = canvas.id || canvas.dataset.chart;
    const chart = chartInstances.get(key);
    if (chart) {
      chart.destroy();
      chartInstances.delete(key);
    }
    canvas.removeAttribute("data-chart-initialized");
  });
}

function onChartViewChange(event) {
  const { root } = event.detail;
  initVisibleCharts(root);
}

function onSubpageChange(event) {
  const { root } = event.detail;
  initVisibleCharts(root);
}

function onTabsChange() {
  const root = document.getElementById("page-root");
  if (root) initVisibleCharts(root);
}

export function initCharts(root = document.getElementById("page-root")) {
  if (!root) return;
  initVisibleCharts(root);
  document.addEventListener("chartview:change", onChartViewChange);
  document.addEventListener("subpage:change", onSubpageChange);
  document.addEventListener("tabs:change", onTabsChange);
}

export function destroyCharts(root = document.getElementById("page-root")) {
  document.removeEventListener("chartview:change", onChartViewChange);
  document.removeEventListener("subpage:change", onSubpageChange);
  document.removeEventListener("tabs:change", onTabsChange);
  if (root) destroyChartInstances(root);
}

export async function renderHeatmap(table, dataUrl) {
  const response = await fetch(dataUrl);
  if (!response.ok) return;
  const { rows, months } = await response.json();
  const allValues = rows.flatMap((r) => r.vals);
  const maxVal = Math.max(...allValues);

  const thead = table.querySelector("thead tr");
  thead.innerHTML = `<th></th>${months.map((m) => `<th>${m}</th>`).join("")}`;

  const tbody = table.querySelector("tbody");
  tbody.innerHTML = rows
    .map((row) => {
      const cells = row.vals
        .map((v) => {
          const level = v === 0 ? 0 : Math.min(7, Math.ceil((v / maxVal) * 7));
          const text = v === 0 ? "" : v;
          return `<td data-level="${level}">${text}</td>`;
        })
        .join("");
      return `<tr><th class="fy-label">${row.fy}</th>${cells}</tr>`;
    })
    .join("");
}
