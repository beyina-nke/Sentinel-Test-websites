(function () {
  const signals = {
    startedAt: Date.now(),
    pointerMoves: 0,
    keyPresses: 0,
    focusedFields: new Set(),
    scrolls: 0,
    visibilityChanges: 0
  };

  document.addEventListener("pointermove", () => {
    signals.pointerMoves += 1;
  }, { passive: true });

  document.addEventListener("keydown", () => {
    signals.keyPresses += 1;
  });

  document.addEventListener("focusin", (event) => {
    if (event.target && event.target.name) {
      signals.focusedFields.add(event.target.name);
    }
  });

  document.addEventListener("scroll", () => {
    signals.scrolls += 1;
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    signals.visibilityChanges += 1;
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function score() {
    const elapsedSeconds = (Date.now() - signals.startedAt) / 1000;
    const elapsedScore = elapsedSeconds > 3 ? 18 : elapsedSeconds * 4;
    const pointerScore = clamp(signals.pointerMoves, 0, 40) * 0.8;
    const keyScore = clamp(signals.keyPresses, 0, 25) * 1.1;
    const focusScore = signals.focusedFields.size * 8;
    const scrollScore = clamp(signals.scrolls, 0, 6) * 2;
    const visibilityPenalty = signals.visibilityChanges > 4 ? 16 : 0;

    return Math.round(clamp(elapsedScore + pointerScore + keyScore + focusScore + scrollScore - visibilityPenalty, 0, 100));
  }

  function verdict(value) {
    if (value >= 62) return "low-risk";
    if (value >= 34) return "review";
    return "high-risk";
  }

  window.PassiveGuard = {
    assess(form) {
      const value = score();
      const fields = {
        "passive-score": String(value),
        "passive-verdict": verdict(value),
        "passive-details": JSON.stringify({
          pointerMoves: signals.pointerMoves,
          keyPresses: signals.keyPresses,
          focusedFields: signals.focusedFields.size,
          scrolls: signals.scrolls
        })
      };

      Object.keys(fields).forEach((name) => {
        let input = form.querySelector(`[name="${name}"]`);
        if (!input) {
          input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          form.appendChild(input);
        }
        input.value = fields[name];
      });

      return { score: value, verdict: fields["passive-verdict"] };
    }
  };
})();
