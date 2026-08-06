(function () {
  "use strict";
  var KEY = "connect_theme";
  var stored;
  try { stored = localStorage.getItem(KEY); } catch (err) {}
  var theme = stored === "light" || stored === "dark" ? stored : "dark";
  document.documentElement.setAttribute("data-theme", theme);

  function apply(t) {
    document.documentElement.setAttribute("data-theme", t);
    var btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = t === "light" ? "☾" : "☀︎";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = theme === "light" ? "☾" : "☀︎";
    if (!btn) return;
    btn.addEventListener("click", function () {
      theme = theme === "light" ? "dark" : "light";
      try { localStorage.setItem(KEY, theme); } catch (err) {}
      apply(theme);
    });
  });
})();
