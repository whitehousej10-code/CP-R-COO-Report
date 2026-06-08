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

// Colour scale used by the heatmap cells (matches tables.css data-level rules)
const HEATMAP_COLORS = [
  "rgba(255, 255, 255, 0.04)",
  "rgb(20, 50, 100)",
  "rgb(28, 70, 130)",
  "rgb(36, 90, 160)",
  "rgb(44, 110, 190)",
  "rgb(52, 130, 210)",
  "rgb(60, 150, 230)",
  "rgb(68, 170, 235)",
];

function buildHeatmapLegend(maxVal) {
  const band = maxVal / 7;
  const legend = document.createElement("div");
  legend.className = "heatmap-legend";

  const label = document.createElement("span");
  label.className = "heatmap-legend-label";
  label.textContent = "Volume key:";
  legend.appendChild(label);

  const items = document.createElement("div");
  items.className = "heatmap-legend-items";

  const noneItem = document.createElement("div");
  noneItem.className = "heatmap-legend-item";
  noneItem.innerHTML =
    `<div class="heatmap-legend-swatch" style="background:${HEATMAP_COLORS[0]};"></div>` +
    `<div class="heatmap-legend-range">None</div>`;
  items.appendChild(noneItem);

  for (let level = 1; level <= 7; level++) {
    const lo = Math.floor(band * (level - 1)) + 1;
    const hi = level === 7 ? maxVal : Math.floor(band * level);
    const item = document.createElement("div");
    item.className = "heatmap-legend-item";
    item.innerHTML =
      `<div class="heatmap-legend-swatch" style="background:${HEATMAP_COLORS[level]};"></div>` +
      `<div class="heatmap-legend-range">${lo}\u2013${hi}</div>`;
    items.appendChild(item);
  }

  legend.appendChild(items);

  const arrow = document.createElement("span");
  arrow.className = "heatmap-legend-arrow";
  arrow.textContent = "\u2192";
  legend.appendChild(arrow);

  const more = document.createElement("span");
  more.style.cssText = "font-size:10px; color:rgba(255,255,255,0.35); font-style:italic;";
  more.textContent = "Higher volume";
  legend.appendChild(more);

  return legend;
}

function drawFyLineChart(canvas, months, values) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.parentElement.clientWidth || 800;
  const H = 200;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const ml = 48, mr = 20, mt = 20, mb = 40;
  const cw = W - ml - mr;
  const ch = H - mt - mb;
  const minVal = 0, maxVal = 110;
  const ySteps = [0, 20, 40, 60, 80, 100];
  const n = values.length;
  const xStep = cw / (n - 1);
  const yFor = (v) => mt + ch - ((v - minVal) / (maxVal - minVal)) * ch;

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "9px Inter, sans-serif";
  ctx.textAlign = "right";
  ySteps.forEach((y) => {
    const yp = yFor(y);
    ctx.beginPath();
    ctx.moveTo(ml, yp);
    ctx.lineTo(ml + cw, yp);
    ctx.stroke();
    ctx.fillText(y, ml - 6, yp + 3);
  });

  const grad = ctx.createLinearGradient(0, mt, 0, mt + ch);
  grad.addColorStop(0, "rgba(68,170,235,0.3)");
  grad.addColorStop(1, "rgba(68,170,235,0.02)");
  ctx.beginPath();
  ctx.moveTo(ml, mt + ch);
  values.forEach((v, i) => ctx.lineTo(ml + i * xStep, yFor(v)));
  ctx.lineTo(ml + (n - 1) * xStep, mt + ch);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = "rgb(68, 170, 235)";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  values.forEach((v, i) => {
    const x = ml + i * xStep, y = yFor(v);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  values.forEach((v, i) => {
    const x = ml + i * xStep, y = yFor(v);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgb(68, 170, 235)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "bold 9px Inter, sans-serif";
  ctx.textAlign = "center";
  values.forEach((v, i) => ctx.fillText(v, ml + i * xStep, yFor(v) - 9));

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "9px Inter, sans-serif";
  months.forEach((m, i) => ctx.fillText(m.toUpperCase(), ml + i * xStep, H - 10));
}

function buildFyLineChart(months, latestRow) {
  const wrap = document.createElement("div");
  wrap.className = "fy2526-line-chart";

  const title = document.createElement("div");
  title.className = "fy2526-chart-title";
  title.textContent = `${latestRow.fy} \u2014 Monthly Referrals (Jun\u2013May)`;
  wrap.appendChild(title);

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "width:100%; max-height:200px;";
  wrap.appendChild(canvas);

  requestAnimationFrame(() => drawFyLineChart(canvas, months, latestRow.vals));
  return wrap;
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

  // Add the colour legend and the latest-FY line chart once, after the table.
  const host = table.parentElement;
  if (host && !host.parentElement.querySelector(".heatmap-legend")) {
    host.insertAdjacentElement("afterend", buildHeatmapLegend(maxVal));
    const latestRow = rows[rows.length - 1];
    host.parentElement.querySelector(".heatmap-legend")
      .insertAdjacentElement("afterend", buildFyLineChart(months, latestRow));
  }
}
