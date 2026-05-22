(function () {
  const forms = document.querySelectorAll("[data-demo-form]");
  const storageKey = "sentinel-demo-submissions";

  function captchaSignal(form) {
    let signal = form.querySelector("[data-captcha-signal]");
    if (signal) return signal;

    const slot = form.querySelector(".captcha-slot");
    signal = document.createElement("p");
    signal.className = "captcha-signal warning";
    signal.dataset.captchaSignal = "";
    signal.setAttribute("role", "status");
    signal.setAttribute("aria-live", "polite");
    signal.textContent = form.hasAttribute("data-passive-guard")
      ? "Passive check runs when the form is submitted."
      : "Complete the verification before sending.";

    if (slot) {
      slot.insertAdjacentElement("afterend", signal);
    } else {
      form.insertBefore(signal, form.querySelector("[type='submit']"));
    }

    return signal;
  }

  function showStatus(status, message, tone) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("success", "warning", "pending");
    status.classList.add(tone || "success");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
  }

  function showCaptchaSignal(form, message, tone) {
    const signal = captchaSignal(form);
    signal.textContent = message;
    signal.classList.remove("success", "warning", "pending");
    signal.classList.add(tone || "success");
  }

  function providerMessage(form) {
    const provider = form.getAttribute("data-provider") || "captcha";
    const passiveVerdict = form.querySelector("[name='passive-verdict']");
    const passiveScore = form.querySelector("[name='passive-score']");

    if (passiveVerdict && passiveScore) {
      return `${provider} complete: ${passiveVerdict.value} visitor signal, score ${passiveScore.value}. Message saved for review.`;
    }

    return `${provider} complete: verification token captured and message saved.`;
  }

  function tokenValue(form) {
    if (form.dataset.captchaToken) {
      return form.dataset.captchaToken;
    }

    const tokenFields = [
      "g-recaptcha-response",
      "h-captcha-response",
      "cf-turnstile-response",
      "frc-captcha-solution",
      "friendly-captcha-solution",
      "arkose-token",
      "altcha",
      "captcha-token"
    ];

    for (const name of tokenFields) {
      const field = form.querySelector(`[name="${name}"]`);
      if (field && String(field.value || "").trim()) {
        return field.value;
      }
    }

    return "";
  }

  function needsCaptcha(form) {
    return !form.hasAttribute("data-passive-guard");
  }

  function providerName(form) {
    return form.getAttribute("data-provider") || "CAPTCHA";
  }

  function markCaptchaSolved(form, token) {
    if (token) {
      form.dataset.captchaToken = token;
      let fallback = form.querySelector("[name='captcha-token']");
      if (!fallback) {
        fallback = document.createElement("input");
        fallback.type = "hidden";
        fallback.name = "captcha-token";
        form.appendChild(fallback);
      }
      fallback.value = token;
    }

    showCaptchaSignal(form, `${providerName(form)} verified. You can send the form now.`, "success");
  }

  function markCaptchaWaiting(form) {
    if (form.hasAttribute("data-passive-guard")) {
      showCaptchaSignal(form, "Passive check will run at submit time.", "pending");
      return;
    }

    showCaptchaSignal(form, `Waiting for ${providerName(form)} verification.`, "warning");
  }

  function findCaptchaForm() {
    return document.querySelector("[data-demo-form]:not([data-passive-guard])");
  }

  window.sentinelCaptchaSolved = function (token) {
    const form = findCaptchaForm();
    if (form) markCaptchaSolved(form, token);
  };

  window.sentinelCaptchaExpired = function () {
    const form = findCaptchaForm();
    if (form) {
      delete form.dataset.captchaToken;
      showCaptchaSignal(form, `${providerName(form)} expired. Complete it again before sending.`, "warning");
    }
  };

  window.sentinelCaptchaError = function () {
    const form = findCaptchaForm();
    if (form) {
      delete form.dataset.captchaToken;
      showCaptchaSignal(form, `${providerName(form)} could not verify. Try the challenge again.`, "warning");
    }
  };

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
    markCaptchaWaiting(form);

    form.addEventListener("input", () => {
      if (needsCaptcha(form) && tokenValue(form)) {
        markCaptchaSolved(form);
      }
    });

    form.addEventListener("change", () => {
      if (needsCaptcha(form) && tokenValue(form)) {
        markCaptchaSolved(form);
      }
    });

    form.addEventListener("statechange", (event) => {
      const state = event.detail && event.detail.state;
      if (state === "verified" || state === "done") {
        markCaptchaSolved(form);
      }
    });

    form.addEventListener("verified", () => markCaptchaSolved(form));

    form.querySelectorAll(".captcha-slot *").forEach((widget) => {
      ["complete", "done", "success", "verified"].forEach((eventName) => {
        widget.addEventListener(eventName, () => markCaptchaSolved(form));
      });

      widget.addEventListener("statechange", (event) => {
        const state = event.detail && event.detail.state;
        if (state === "verified" || state === "done" || state === "complete") {
          markCaptchaSolved(form);
        }
      });

      widget.addEventListener("error", () => {
        showCaptchaSignal(form, `${providerName(form)} could not verify. Try the challenge again.`, "warning");
      });
    });

    const observer = new MutationObserver(() => {
      if (needsCaptcha(form) && tokenValue(form)) {
        markCaptchaSolved(form);
      }
    });
    observer.observe(form, { childList: true, subtree: true, attributes: true, attributeFilter: ["value"] });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (form.hasAttribute("data-passive-guard") && window.PassiveGuard) {
        window.PassiveGuard.assess(form);
        showCaptchaSignal(form, `${providerName(form)} assessment complete.`, "success");
      }

      if (needsCaptcha(form) && !tokenValue(form)) {
        showCaptchaSignal(form, `${providerName(form)} is not complete yet. Finish the challenge before sending.`, "warning");
        showStatus(status, "The form was not saved because verification is still missing.", "warning");
        return;
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
      if (needsCaptcha(form)) {
        delete form.dataset.captchaToken;
        showCaptchaSignal(form, "Message saved. Complete a new verification before sending another message.", "pending");
      }
    });
  });
})();
