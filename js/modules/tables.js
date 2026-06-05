const tableHandlers = new Map();

function parseCellValue(text) {
  const cleaned = text.replace(/[£%,↑↓\s]/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? text.toLowerCase() : num;
}

function sortTable(table, columnIndex, direction) {
  const tbody = table.querySelector("tbody");
  const rows = [...tbody.querySelectorAll("tr")];
  const totalRow = rows.find((row) => row.textContent.toLowerCase().includes("grand total"));
  const dataRows = rows.filter((row) => row !== totalRow);

  dataRows.sort((a, b) => {
    const aVal = parseCellValue(a.cells[columnIndex]?.textContent ?? "");
    const bVal = parseCellValue(b.cells[columnIndex]?.textContent ?? "");
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = "";
  dataRows.forEach((row) => tbody.appendChild(row));
  if (totalRow) tbody.appendChild(totalRow);
}

function handleTableClick(event) {
  const th = event.target.closest("th[data-sortable]");
  if (!th) return;

  const table = th.closest("table");
  const headers = [...table.querySelectorAll("th[data-sortable]")];
  const columnIndex = headers.indexOf(th);
  const nextDir = th.dataset.sort === "asc" ? "desc" : "asc";

  headers.forEach((header) => header.removeAttribute("data-sort"));
  th.dataset.sort = nextDir;
  sortTable(table, columnIndex + 1, nextDir);
}

export function initTables(root = document.getElementById("page-root")) {
  if (!root) return;

  root.querySelectorAll("table[data-table-sortable]").forEach((table) => {
    if (tableHandlers.has(table)) return;
    const handler = (e) => handleTableClick(e);
    table.addEventListener("click", handler);
    tableHandlers.set(table, handler);

    table.querySelectorAll("th").forEach((th, i) => {
      if (i > 0) th.setAttribute("data-sortable", "");
    });
  });

  root.querySelectorAll("[data-heatmap]").forEach(async (table) => {
    const { renderHeatmap } = await import("./charts.js");
    await renderHeatmap(table, table.dataset.heatmap);
  });
}

export function destroyTables(root = document.getElementById("page-root")) {
  if (!root) return;
  root.querySelectorAll("table[data-table-sortable]").forEach((table) => {
    const handler = tableHandlers.get(table);
    if (handler) {
      table.removeEventListener("click", handler);
      tableHandlers.delete(table);
    }
  });
}
