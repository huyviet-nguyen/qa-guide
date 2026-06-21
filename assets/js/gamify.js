(function () {
  const STORAGE_KEY = "qa-ebook-gamify";
  const XP_PER_LEVEL = 100;

  const BADGES = {
    quiz_ace: { label: "Quiz Ace", icon: "🎯" },
    hands_on: { label: "Hands-on", icon: "🛠" },
    month1_graduate: { label: "Tháng 1 xong", icon: "🥉" },
    month2_graduate: { label: "Tháng 2 xong", icon: "🥈" },
    month3_graduate: { label: "Tháng 3 xong", icon: "🥇" },
    qa_graduate: { label: "QA Graduate", icon: "🏆" },
  };

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function defaultState() {
    return { xp: 0, level: 1, streak: { count: 0, lastDate: null }, chapters: {}, badges: [] };
  }

  function getState() {
    try {
      return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return defaultState();
    }
  }

  function saveState(state) {
    state.level = Math.max(1, Math.floor(state.xp / XP_PER_LEVEL) + 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateUI();
  }

  function addXp(amount, reason) {
    const state = getState();
    state.xp += amount;
    if (reason) state.lastXpReason = reason;
    touchStreak(state);
    saveState(state);
    return state;
  }

  function touchStreak(state) {
    const d = today();
    if (state.streak.lastDate === d) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    if (state.streak.lastDate === y) state.streak.count += 1;
    else state.streak.count = 1;
    state.streak.lastDate = d;
  }

  function awardBadge(id) {
    const state = getState();
    if (!state.badges.includes(id)) {
      state.badges.push(id);
      saveState(state);
    }
  }

  function chapterKey(id) {
    return String(id);
  }

  function onQuizPass(chapterId, scorePct) {
    const state = getState();
    const key = chapterKey(chapterId);
    state.chapters[key] = state.chapters[key] || {};
    state.chapters[key].quizScore = scorePct;
    if (scorePct >= 70) {
      addXp(20, "Quiz pass");
      awardBadge(`quiz_ace_ch${String(chapterId).padStart(2, "0")}`);
    }
    saveState(state);
  }

  function onChapterComplete(chapterId) {
    addXp(30, "Chapter complete");
    checkMonthBadges();
  }

  function onExerciseDone(chapterId) {
    const state = getState();
    const key = chapterKey(chapterId);
    state.chapters[key] = state.chapters[key] || {};
    state.chapters[key].exerciseDone = true;
    addXp(15, "Exercise done");
    awardBadge(`hands_on_ch${String(chapterId).padStart(2, "0")}`);
    saveState(state);
  }

  function checkMonthBadges() {
    const progress = window.QAProgress?.getProgress?.() || {};
    const done = Object.keys(progress).filter((k) => progress[k]?.completed).map(Number);
    if (done.filter((n) => n >= 1 && n <= 15).length >= 15) awardBadge("month1_graduate");
    if (done.filter((n) => n >= 16 && n <= 31).length >= 16) awardBadge("month2_graduate");
    if (done.filter((n) => n >= 32 && n <= 45).length >= 14) awardBadge("month3_graduate");
    if (done.length >= 45) awardBadge("qa_graduate");
  }

  function updateUI() {
    const state = getState();
    const xpInLevel = state.xp % XP_PER_LEVEL;
    const fill = document.getElementById("xp-bar-fill");
    const levelEl = document.getElementById("gamify-level");
    const streakEl = document.getElementById("gamify-streak");
    const xpText = document.getElementById("gamify-xp-text");
    if (fill) fill.style.width = Math.round((xpInLevel / XP_PER_LEVEL) * 100) + "%";
    if (levelEl) levelEl.textContent = "Lv " + state.level;
    if (streakEl) streakEl.textContent = state.streak.count > 0 ? "🔥 " + state.streak.count : "";
    if (xpText) xpText.textContent = state.xp + " XP";

    document.querySelectorAll(".exercise-checklist input").forEach((cb) => {
      const ch = cb.closest("[data-chapter-id]")?.getAttribute("data-chapter-id");
      if (!ch) return;
      const key = chapterKey(ch);
      if (state.chapters[key]?.exerciseDone) cb.checked = true;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    document.querySelectorAll(".exercise-checklist").forEach((list) => {
      list.addEventListener("change", () => {
        const ch = list.closest("[data-chapter-id]")?.getAttribute("data-chapter-id");
        const boxes = list.querySelectorAll('input[type="checkbox"]');
        const all = [...boxes].every((b) => b.checked);
        if (all && ch) onExerciseDone(ch);
      });
    });
  });

  window.QAGamify = {
    getState,
    addXp,
    onQuizPass,
    onChapterComplete,
    onExerciseDone,
    updateUI,
    BADGES,
  };
})();
