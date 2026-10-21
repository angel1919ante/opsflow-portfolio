(function () {
  "use strict";
  const root = document.documentElement;
  const toggle = document.querySelector("#theme-toggle");
  const preferred = localStorage.getItem("opsflow-theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  function setTheme(theme) {
    root.dataset.theme = theme;
    toggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    localStorage.setItem("opsflow-theme", theme);
  }

  toggle.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
  setTheme(preferred);
})();
