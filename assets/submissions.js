(function () {
  const storageKey = "sentinel-demo-submissions";
  const list = document.querySelector("[data-submission-list]");
  const empty = document.querySelector("[data-empty-state]");
  const clearButton = document.querySelector("[data-clear-submissions]");

  function readSubmissions() {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  }

  function writeLocalSubmissions(submissions) {
    localStorage.setItem(storageKey, JSON.stringify(submissions.slice(0, 50)));
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function renderFieldRows(fields) {
    return Object.entries(fields).map(([key, value]) => {
      const displayValue = Array.isArray(value) ? value.join(", ") : value;
      return `<div class="submission-row"><strong>${key}</strong><span>${String(displayValue || "").replaceAll("<", "&lt;")}</span></div>`;
    }).join("");
  }

  function render(submissions) {
    const savedSubmissions = submissions || readSubmissions();

    if (!list || !empty) return;
    list.innerHTML = "";
    empty.hidden = savedSubmissions.length > 0;

    savedSubmissions.forEach((submission) => {
      const article = document.createElement("article");
      article.className = "card submission-card";
      article.innerHTML = `
        <div class="submission-head">
          <div>
            <span class="tag">${submission.provider}</span>
            <h3>${submission.site}</h3>
            <p>${formatDate(submission.createdAt)}</p>
          </div>
          <a class="button secondary" href="${submission.page}">Open source page</a>
        </div>
        <div class="submission-fields">${renderFieldRows(submission.fields || {})}</div>
      `;
      list.appendChild(article);
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      if (window.location.protocol !== "file:") {
        fetch("/api/submissions", { method: "DELETE" }).catch(() => {});
      }
      render();
    });
  }

  if (window.location.protocol === "file:") {
    render();
  } else {
    fetch("/api/submissions")
      .then((response) => response.ok ? response.json() : readSubmissions())
      .then((submissions) => {
        if (Array.isArray(submissions)) {
          writeLocalSubmissions(submissions);
          render(submissions);
        } else {
          render();
        }
      })
      .catch(() => render());
  }
})();
