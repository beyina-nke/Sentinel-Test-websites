(function () {
  const forms = document.querySelectorAll("[data-demo-form]");
  const storageKey = "sentinel-demo-submissions";

  function showStatus(status, message, tone) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("success", "warning");
    status.classList.add(tone || "success");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
  }

  function providerMessage(form) {
    const provider = form.getAttribute("data-provider") || "captcha";
    const passiveVerdict = form.querySelector("[name='passive-verdict']");
    const passiveScore = form.querySelector("[name='passive-score']");

    if (passiveVerdict && passiveScore) {
      return `${provider} feedback: ${passiveVerdict.value} visitor signal, score ${passiveScore.value}. The message is ready for server-side review and token verification.`;
    }

    return `${provider} submission feedback: token captured. In production, submit this form to your server and verify the token before sending the message.`;
  }

  function fieldValues(form) {
    const data = {};
    const formData = new FormData(form);

    formData.forEach((value, key) => {
      if (data[key]) {
        data[key] = Array.isArray(data[key]) ? data[key].concat(value) : [data[key], value];
      } else {
        data[key] = value;
      }
    });

    return data;
  }

  function saveSubmission(form) {
    const payload = {
      id: `submission-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      provider: form.getAttribute("data-provider") || "captcha",
      site: document.title,
      page: window.location.href,
      createdAt: new Date().toISOString(),
      fields: fieldValues(form)
    };

    const submissions = JSON.parse(localStorage.getItem(storageKey) || "[]");
    submissions.unshift(payload);
    localStorage.setItem(storageKey, JSON.stringify(submissions.slice(0, 50)));

    return payload;
  }

  function persistToServer(payload) {
    if (window.location.protocol === "file:") {
      return Promise.resolve();
    }

    return fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  forms.forEach((form) => {
    const status = form.querySelector("[data-status]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (form.hasAttribute("data-passive-guard") && window.PassiveGuard) {
          window.PassiveGuard.assess(form);
      }

      const submission = saveSubmission(form);
      persistToServer(submission);
      showStatus(status, providerMessage(form), "success");
      const viewerLink = document.createElement("a");
      viewerLink.href = form.getAttribute("data-viewer-path") || "../submissions.html";
      viewerLink.textContent = ` View saved submission.`;
      status.appendChild(viewerLink);
      status.dataset.submissionId = submission.id;
      form.reset();
    });
  });
})();
