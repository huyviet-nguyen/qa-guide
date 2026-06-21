(function () {
  function getTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "default";
  }

  async function renderMermaid() {
    if (!window.mermaid) return;
    mermaid.initialize({
      startOnLoad: false,
      theme: getTheme(),
      securityLevel: "loose",
      fontFamily: "Segoe UI, system-ui, sans-serif",
    });
    const nodes = document.querySelectorAll(".mermaid:not([data-processed])");
    if (nodes.length === 0) return;
    try {
      await mermaid.run({ nodes: Array.from(nodes) });
      nodes.forEach((n) => n.setAttribute("data-processed", "true"));
    } catch (e) {
      console.warn("Mermaid render error:", e);
    }
  }

  window.QAMermaid = { renderMermaid };

  document.addEventListener("DOMContentLoaded", renderMermaid);
})();
