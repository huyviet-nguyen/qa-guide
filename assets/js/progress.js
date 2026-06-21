(function () {
  const STORAGE_KEY = "qa-ebook-progress";
  const TOTAL_CHAPTERS = 45;

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveProgress(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateUI();
  }

  function markComplete(chapterId) {
    const progress = getProgress();
    progress[String(chapterId)] = { completed: true, at: new Date().toISOString() };
    saveProgress(progress);
    if (window.QAGamify) window.QAGamify.onChapterComplete(chapterId);
  }

  function updateUI() {
    const progress = getProgress();
    const completed = Object.values(progress).filter((p) => p.completed).length;
    const pct = Math.round((completed / TOTAL_CHAPTERS) * 100);

    const fill = document.getElementById("global-progress");
    const text = document.getElementById("progress-text");
    if (fill) fill.style.width = pct + "%";
    if (text) text.textContent = pct + "% hoàn thành (" + completed + "/" + TOTAL_CHAPTERS + ")";

    document.querySelectorAll("[data-chapter-link]").forEach((link) => {
      const id = link.getAttribute("data-chapter-link");
      if (progress[id]?.completed) link.classList.add("completed");
    });

    document.querySelectorAll(".mark-complete").forEach((btn) => {
      const id = btn.getAttribute("data-chapter");
      if (progress[id]?.completed) {
        btn.classList.add("completed");
        btn.textContent = "✓ Đã hoàn thành";
      }
    });

    document.querySelectorAll("[data-dashboard]").forEach((el) => {
      const month = el.getAttribute("data-dashboard");
      const monthChapters = el.querySelectorAll("[data-chapter-id]");
      let done = 0;
      monthChapters.forEach((c) => {
        if (progress[c.getAttribute("data-chapter-id")]?.completed) done++;
      });
      const pctEl = el.querySelector(".month-pct");
      if (pctEl) pctEl.textContent = Math.round((done / monthChapters.length) * 100) + "%";
    });
  }

  function exportJson() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      progress: getProgress(),
      gamify: JSON.parse(localStorage.getItem("qa-ebook-gamify") || "{}"),
    };
    return JSON.stringify(payload, null, 2);
  }

  function importJson(text) {
    try {
      const data = JSON.parse(text);
      if (data.progress && typeof data.progress === "object") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.progress));
      }
      if (data.gamify && typeof data.gamify === "object") {
        localStorage.setItem("qa-ebook-gamify", JSON.stringify(data.gamify));
      }
      updateUI();
      return true;
    } catch {
      return false;
    }
  }

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("mark-complete")) {
      markComplete(e.target.getAttribute("data-chapter"));
    }
  });

  document.addEventListener("DOMContentLoaded", updateUI);
  window.QAProgress = { getProgress, markComplete, updateUI, exportJson, importJson };
})();
