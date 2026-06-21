(function () {
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".quiz-section").forEach((section) => {
      const data = JSON.parse(section.getAttribute("data-quiz") || "[]");
      const container = section.querySelector(".quiz-container");
      const submitBtn = section.querySelector(".quiz-submit");
      const resultEl = section.querySelector(".quiz-result");

      data.forEach((q, qi) => {
        const div = document.createElement("div");
        div.className = "quiz-question";
        div.innerHTML = `<p><strong>Câu ${qi + 1}:</strong> ${q.question}</p>`;
        q.options.forEach((opt, oi) => {
          const id = `q${qi}-o${oi}`;
          div.innerHTML += `<label><input type="radio" name="q${qi}" value="${oi}"> ${opt}</label>`;
        });
        container.appendChild(div);
      });

      submitBtn?.addEventListener("click", () => {
        let correct = 0;
        let html = "";
        data.forEach((q, qi) => {
          const selected = section.querySelector(`input[name="q${qi}"]:checked`);
          const selVal = selected ? parseInt(selected.value, 10) : -1;
          const isCorrect = selVal === q.answer;
          if (isCorrect) correct++;
          html += `<p><strong>Câu ${qi + 1}:</strong> ${isCorrect ? "✓ Đúng" : "✗ Sai"} — ${q.explanation}</p>`;
        });
        const pct = Math.round((correct / data.length) * 100);
        resultEl.hidden = false;
        resultEl.className = "quiz-result " + (pct >= 70 ? "pass" : "fail");
        resultEl.innerHTML = `<p><strong>Kết quả: ${correct}/${data.length} (${pct}%)</strong></p>${html}`;
        const chapterEl = section.closest("[data-chapter-id]");
        const chapterId = chapterEl?.getAttribute("data-chapter-id");
        if (chapterId && window.QAGamify) {
          window.QAGamify.onQuizPass(chapterId, pct);
          const xpNote = pct >= 70 ? `<p class="xp-earned">+20 XP · Quiz ≥70%</p>` : "";
          resultEl.innerHTML += xpNote;
        }
      });
    });
  });
})();
