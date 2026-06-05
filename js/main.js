import { renderSidebar } from "./modules/layout.js";
import { initRouter } from "./modules/router.js";

const sidebar = document.getElementById("sidebar");
if (sidebar) {
  renderSidebar(sidebar, "overview");
}

initRouter();
