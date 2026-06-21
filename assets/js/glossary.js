(function () {
  const popover = document.getElementById("glossary-popover");
  const glossary = window.SITE_CONFIG?.glossary || {};

  function showPopover(term, x, y) {
    const entry = glossary[term.toLowerCase()];
    if (!entry || !popover) return;
    popover.innerHTML = `<strong>${entry.en}</strong><span>${entry.vi}</span>${entry.note ? `<br><em>${entry.note}</em>` : ""}`;
    popover.hidden = false;
    popover.style.left = x + "px";
    popover.style.top = y + "px";
  }

  function hidePopover() {
    if (popover) popover.hidden = true;
  }

  document.addEventListener("mouseover", (e) => {
    if (e.target.classList.contains("glossary-term")) {
      const rect = e.target.getBoundingClientRect();
      showPopover(e.target.getAttribute("data-term"), rect.left, rect.bottom + 8);
    }
  });

  document.addEventListener("mouseout", (e) => {
    if (e.target.classList.contains("glossary-term")) hidePopover();
  });

  document.addEventListener("focusin", (e) => {
    if (e.target.classList.contains("glossary-term")) {
      const rect = e.target.getBoundingClientRect();
      showPopover(e.target.getAttribute("data-term"), rect.left, rect.bottom + 8);
    }
  });

  document.addEventListener("focusout", (e) => {
    if (e.target.classList.contains("glossary-term")) hidePopover();
  });
})();
