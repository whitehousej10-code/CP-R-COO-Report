export const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "🏠", title: "CP+R · Overview" },
  { id: "referrals", label: "Referrals", icon: "📈", title: "CP+R · Referrals" },
  { id: "partnerships", label: "Partners", icon: "🤝", title: "CP+R · Partnerships" },
  { id: "onboarding", label: "Onboard", icon: "📋", title: "CP+R · Onboarding" },
  { id: "em-performance", label: "EM Perf", icon: "⚡", title: "CP+R · EM Performance" },
  { id: "clinical", label: "Clinical", icon: "🏥", title: "CP+R · Clinical" },
  { id: "people", label: "People", icon: "👥", title: "CP+R · People" },
  { id: "operations", label: "Operations", icon: "⚙️", title: "CP+R · Operations" },
  { id: "tech", label: "Tech", icon: "💻", title: "CP+R · Technology" },
  { id: "fy2627", label: "FY26/27", icon: "🔭", title: "CP+R · FY26/27" },
];

export const DEFAULT_ROUTE = "overview";

export function findNavItem(routeId) {
    return NAV_ITEMS.find((item) => item.id === routeId) ?? NAV_ITEMS[0];
}
