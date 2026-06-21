(function () {
  const STORAGE_KEY = "qa-ebook-theme";
  const toggle = document.querySelector(".theme-toggle");
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    document.querySelectorAll(".mermaid[data-processed]").forEach((el) => {
      el.removeAttribute("data-processed");
      el.innerHTML = el.textContent;
    });
    if (window.QAMermaid) window.QAMermaid.renderMermaid();
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(saved || preferred);

  toggle?.addEventListener("click", () => {
    const current = html.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
})();
