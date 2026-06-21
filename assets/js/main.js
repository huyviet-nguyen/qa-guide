(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    menuToggle?.addEventListener("click", () => {
      const open = sidebar.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", open);
    });

    const currentPath = window.location.pathname;
    document.querySelectorAll(".sidebar a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href && (currentPath.endsWith(href.replace(/^\//, "")) || currentPath === href)) {
        a.classList.add("active");
      }
    });

    if (window.QAProgress) window.QAProgress.updateUI();
    if (window.QAMermaid) window.QAMermaid.renderMermaid();
  });
})();
