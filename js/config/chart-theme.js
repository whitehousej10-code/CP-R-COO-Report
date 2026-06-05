export const CHART_COLORS = {
  blue: "#44c8f5",
  yellow: "#ffe512",
  green: "#4db848",
  pink: "#e3407f",
  grid: "rgba(255,255,255,0.06)",
  tick: "rgba(255,255,255,0.6)",
};

export function darkBarOptions({ yMax, yMin = 0, yBeginAtZero = true } = {}) {
  const yScale = {
    grid: { color: CHART_COLORS.grid },
    ticks: { color: CHART_COLORS.tick, font: { size: 12 } },
    beginAtZero: yBeginAtZero,
  };
  if (yMax !== undefined) yScale.max = yMax;
  if (yMin !== undefined && !yBeginAtZero) {
    yScale.min = yMin;
    delete yScale.beginAtZero;
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: CHART_COLORS.grid },
        ticks: { color: CHART_COLORS.tick, font: { size: 12 } },
      },
      y: yScale,
    },
  };
}
