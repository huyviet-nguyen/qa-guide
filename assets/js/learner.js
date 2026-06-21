(function () {
  const STORAGE_KEY = "qa-ebook-learner";
  const PROGRESS_KEY = "qa-ebook-progress";
  const GAMIFY_KEY = "qa-ebook-gamify";
  const cfg = window.LEARNER_CONFIG || {};

  function getIdentity() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data?.name?.trim() || !data?.email?.trim()) return null;
      return {
        name: data.name.trim(),
        email: data.email.trim(),
        since: data.since || null,
      };
    } catch {
      return null;
    }
  }

  function saveIdentity(name, email) {
    const data = {
      name: name.trim(),
      email: email.trim(),
      since: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateSidebar();
    window.dispatchEvent(new CustomEvent("qa-learner-ready", { detail: data }));
    return data;
  }

  function clearLearningData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(GAMIFY_KEY);
    if (window.QAProgress?.updateUI) window.QAProgress.updateUI();
    if (window.QAGamify?.updateUI) window.QAGamify.updateUI();
  }

  function updateSidebar() {
    const box = document.getElementById("sidebar-learner");
    const nameEl = document.getElementById("learner-display-name");
    const emailEl = document.getElementById("learner-display-email");
    const id = getIdentity();
    if (!box) return;
    if (!id) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    if (nameEl) nameEl.textContent = id.name;
    if (emailEl) emailEl.textContent = id.email;
  }

  const welcomeDialog = document.getElementById("learner-welcome-dialog");
  const welcomeForm = document.getElementById("learner-welcome-form");
  const nameInput = document.getElementById("learner-name");
  const emailInput = document.getElementById("learner-email");
  const welcomeError = document.getElementById("learner-welcome-error");

  function showWelcome() {
    if (!welcomeDialog) return;
    welcomeError.hidden = true;
    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";
    welcomeDialog.showModal();
    nameInput?.focus();
  }

  function ensureIdentity() {
    if (getIdentity()) {
      updateSidebar();
      return true;
    }
    showWelcome();
    return false;
  }

  welcomeDialog?.addEventListener("cancel", (e) => {
    e.preventDefault();
  });

  welcomeForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput?.value?.trim() || "";
    const email = emailInput?.value?.trim() || "";
    if (name.length < 2) {
      welcomeError.hidden = false;
      welcomeError.textContent = "Vui lòng nhập họ tên.";
      nameInput?.focus();
      return;
    }
    if (!email || !emailInput?.checkValidity()) {
      welcomeError.hidden = false;
      welcomeError.textContent = "Vui lòng nhập email hợp lệ.";
      emailInput?.focus();
      return;
    }
    saveIdentity(name, email);
    welcomeDialog.close();
  });

  document.getElementById("learner-logout")?.addEventListener("click", () => {
    const msg = cfg.logoutConfirm || "Đăng xuất sẽ xóa tiến độ học. Tiếp tục?";
    if (!window.confirm(msg)) return;
    clearLearningData();
    updateSidebar();
    showWelcome();
  });

  document.addEventListener("DOMContentLoaded", () => {
    ensureIdentity();
  });

  window.QALearner = {
    getIdentity,
    saveIdentity,
    clearLearningData,
    ensureIdentity,
    showWelcome,
    updateSidebar,
  };
})();
