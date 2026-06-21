(function () {
  const cfg = window.FEEDBACK_CONFIG;
  const learnerCfg = window.LEARNER_CONFIG || {};
  if (!cfg) return;

  const SKIP_ANCESTOR =
    ".quiz-section, .mermaid, pre, code, .flashcard, .eli5-box, figure, table, " +
    ".chapter-header, .chapter-footer, .chapter-nav, .site-footer, .feedback-dialog, " +
    ".card-grid, .hero, .sidebar, .top-bar, .qa-journey, .progress-bar";

  const LINE_TAGS = "p, li, h2, h3, h4, blockquote";

  function isLearningPage() {
    const p = window.location.pathname;
    return p.includes("/month-") || p.includes("/appendices/");
  }

  function getLearner() {
    return window.QALearner?.getIdentity?.() || null;
  }

  function getPageMeta() {
    const article = document.querySelector("article.chapter[data-chapter-id]");
    let prefix;
    if (article) {
      const n = String(article.dataset.chapterId || "0").padStart(2, "0");
      prefix = "ch" + n;
    } else {
      const slug = window.location.pathname
        .replace(/\/$/, "")
        .split("/")
        .filter(Boolean)
        .slice(-2)
        .join("-") || "page";
      prefix = "pg-" + slug.replace(/[^a-z0-9-]/gi, "-");
    }
    const title =
      document.querySelector("article h1, main h1")?.textContent?.trim() ||
      document.title;
    return {
      prefix,
      title,
      url: window.location.href,
    };
  }

  function attachLineFeedback() {
    if (!isLearningPage()) return;

    const root =
      document.querySelector(".chapter-body") ||
      document.querySelector("main.content");
    if (!root) return;

    const meta = getPageMeta();
    let index = 0;

    root.querySelectorAll(LINE_TAGS).forEach((el) => {
      if (el.closest(SKIP_ANCESTOR)) return;
      if (el.classList.contains("feedback-line")) return;

      const text = (el.textContent || "").trim();
      if (text.length < 12) return;

      index += 1;
      const lineId = meta.prefix + "-L" + String(index).padStart(3, "0");

      el.classList.add("feedback-line");
      el.dataset.lineId = lineId;
      el.dataset.lineText = text.slice(0, 600);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "feedback-trigger";
      btn.setAttribute("aria-label", cfg.labels?.triggerTitle || "Hỏi dòng này");
      btn.textContent = "💬";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!getLearner()) {
          window.QALearner?.ensureIdentity?.();
          return;
        }
        openModal(el, meta);
      });

      el.insertBefore(btn, el.firstChild);
    });
  }

  const dialog = document.getElementById("feedback-dialog");
  const form = document.getElementById("feedback-form");
  const lineIdEl = document.getElementById("feedback-line-id");
  const previewEl = document.getElementById("feedback-line-preview");
  const senderEl = document.getElementById("feedback-sender");
  const questionEl = document.getElementById("feedback-question");
  const statusEl = document.getElementById("feedback-status");
  const submitBtn = document.getElementById("feedback-submit");

  let activeMeta = null;
  let activeLine = null;

  function updateSenderLine() {
    const learner = getLearner();
    if (!senderEl) return;
    if (!learner) {
      senderEl.hidden = true;
      return;
    }
    const prefix = learnerCfg.senderPrefix || "Gửi với tư cách";
    senderEl.innerHTML =
      prefix + ": <strong>" + escapeHtml(learner.name) + "</strong> (" + escapeHtml(learner.email) + ")";
    senderEl.hidden = false;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openModal(lineEl, pageMeta) {
    if (!dialog) return;
    const learner = getLearner();
    if (!learner) {
      window.QALearner?.ensureIdentity?.();
      return;
    }
    activeLine = lineEl;
    activeMeta = pageMeta;
    lineIdEl.textContent = lineEl.dataset.lineId || "";
    previewEl.textContent = lineEl.dataset.lineText || "";
    questionEl.value = "";
    updateSenderLine();
    statusEl.hidden = true;
    statusEl.className = "feedback-status";
    submitBtn.disabled = false;
    dialog.showModal();
    questionEl.focus();
  }

  function closeModal() {
    dialog?.close();
  }

  document.querySelectorAll("[data-feedback-close]").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  dialog?.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModal();
  });

  function showStatus(msg, type) {
    statusEl.hidden = false;
    statusEl.textContent = msg;
    statusEl.className = "feedback-status feedback-status--" + type;
  }

  function isConfigured() {
    return (
      cfg.enabled &&
      cfg.formAction &&
      cfg.formAction.includes("formResponse") &&
      cfg.entries?.question
    );
  }

  async function submitToGoogleForm(question, learner) {
    const body = new URLSearchParams();
    const e = cfg.entries;
    const pageLabel =
      learner.name +
      " <" +
      learner.email +
      "> | " +
      activeMeta.title +
      " | " +
      activeMeta.url;

    const questionBody =
      "[Người gửi: " + learner.name + " · " + learner.email + "]\n\n" + question;

    body.append("emailAddress", learner.email);
    body.append(e.page, pageLabel);
    body.append(e.lineId, activeLine.dataset.lineId || "");
    body.append(e.lineText, (activeLine.dataset.lineText || "").slice(0, 2000));
    body.append(e.question, questionBody.slice(0, 2000));
    if (e.answer) body.append(e.answer, "");

    await fetch(cfg.formAction, {
      method: "POST",
      mode: "no-cors",
      body,
    });
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const learner = getLearner();
    if (!learner) {
      window.QALearner?.ensureIdentity?.();
      return;
    }
    const question = questionEl.value.trim();
    if (!question) {
      questionEl.focus();
      return;
    }

    if (!isConfigured()) {
      showStatus(cfg.labels?.notConfigured || "Form chưa cấu hình.", "err");
      return;
    }

    submitBtn.disabled = true;
    showStatus("Đang gửi…", "ok");

    try {
      await submitToGoogleForm(question, learner);
      showStatus(cfg.labels?.success || "Đã gửi!", "ok");
      setTimeout(closeModal, 1800);
    } catch {
      showStatus(cfg.labels?.error || "Lỗi gửi form.", "err");
      submitBtn.disabled = false;
    }
  });

  window.addEventListener("qa-learner-ready", updateSenderLine);

  document.addEventListener("DOMContentLoaded", attachLineFeedback);
})();
