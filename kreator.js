(function () {
  "use strict";

  var MAX_PICKS = 2;

  var state = { brief: "", styles: [], picked: [] };

  var $ = function (id) { return document.getElementById(id); };

  var el = {
    steps: document.querySelectorAll(".kr__step"),
    panels: {
      1: $("step-1"), 2: $("step-2"), 3: $("step-3"), done: $("step-done")
    },
    brief: $("brief"),
    briefCount: $("brief-count"),
    briefForm: $("brief-form"),
    briefSubmit: $("brief-submit"),
    briefError: $("brief-error"),
    loading: $("loading"),
    grid: $("grid"),
    pickbar: $("pickbar"),
    pickedLabel: $("picked-label"),
    pickHint: $("pick-hint"),
    to3: $("to-3"),
    back1: $("back-1"),
    back2: $("back-2"),
    summary: $("summary"),
    contactForm: $("contact-form"),
    sendBtn: $("send-btn"),
    sendError: $("send-error")
  };

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function showStep(n) {
    Object.keys(el.panels).forEach(function (k) {
      el.panels[k].classList.toggle("is-active", String(k) === String(n));
    });
    var idx = n === "done" ? 4 : Number(n);
    el.steps.forEach(function (s) {
      var sn = Number(s.dataset.step);
      s.classList.toggle("is-active", sn === idx);
      s.classList.toggle("is-done", sn < idx);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showError(node, msg) {
    if (!msg) { node.hidden = true; node.textContent = ""; return; }
    node.textContent = msg;
    node.hidden = false;
  }

  function isDark(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length < 6) return false;
    var r = parseInt(h.slice(0, 2), 16),
        g = parseInt(h.slice(2, 4), 16),
        b = parseInt(h.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
  }

  // Podglad renderowany z tokenow stylu - to co klient widzi, tak powstanie strona.
  function cardHtml(s, i) {
    var p = s.palette || {}, f = s.fonts || {}, g = s.geometry || {};
    var btnRad = g.radius || "6px";
    var boxRad = btnRad === "999px" ? "14px" : btnRad;
    var heroBg = "linear-gradient(135deg," + (p.surface || "#eee") + "," + (p.bg || "#fff") + ")";

    function card() {
      return '<div class="sc__c" style="background:' + esc(p.surface) + ';border:1px solid ' + esc(p.line) + ';border-radius:' + esc(boxRad) + '">' +
        '<span class="d" style="background:' + esc(p.accent) + ';border-radius:' + esc(btnRad) + '"></span>' +
        '<span class="l" style="background:' + esc(p.ink) + ';opacity:.75"></span>' +
        '<span class="l s" style="background:' + esc(p.muted) + ';opacity:.5"></span></div>';
    }

    var sw = ["bg", "surface", "ink", "accent", "muted"].map(function (k) {
      return '<span style="background:' + esc(p[k]) + '"></span>';
    }).join("");

    return '' +
      '<button type="button" class="sc" data-id="' + esc(s.id) + '" aria-pressed="false">' +
        '<span class="sc__tick" aria-hidden="true">✓</span>' +
        '<div class="sc__frame" style="background:' + esc(p.bg) + ';font-family:' + esc(f.body) + '">' +
          '<div class="sc__nav" style="border-bottom:1px solid ' + esc(p.line) + '">' +
            '<span class="sc__logo" style="color:' + esc(p.ink) + ';font-family:' + esc(f.heading) + ';font-weight:' + esc(f.headingWeight) + ';letter-spacing:' + esc(f.tracking) + '">Aa</span>' +
            '<span class="sc__links">' +
              '<i style="background:' + esc(p.muted) + '"></i><i style="background:' + esc(p.muted) + '"></i><i style="background:' + esc(p.muted) + '"></i>' +
              '<b style="background:' + esc(p.accent) + ';border-radius:' + esc(btnRad) + '"></b>' +
            '</span>' +
          '</div>' +
          '<div class="sc__hero" style="background:' + heroBg + '">' +
            '<div class="sc__eyebrow" style="color:' + esc(p.accent) + ';letter-spacing:.14em">STYL ' + (i + 1) + '</div>' +
            '<div class="sc__h1" style="color:' + esc(p.ink) + ';font-family:' + esc(f.heading) + ';font-weight:' + esc(f.headingWeight) + ';letter-spacing:' + esc(f.tracking) + ';line-height:1.08">' + esc(s.name) + '</div>' +
            '<div class="sc__lead" style="color:' + esc(p.muted) + '">' + esc(s.mood) + '</div>' +
            '<div class="sc__btns">' +
              '<span class="sc__btn" style="background:' + esc(p.accent) + ';color:' + esc(p.bg) + ';border-radius:' + esc(btnRad) + '">Zacznij</span>' +
              '<span class="sc__btn" style="border:1px solid ' + esc(p.line) + ';color:' + esc(p.ink) + ';border-radius:' + esc(btnRad) + '">Więcej</span>' +
            '</div>' +
          '</div>' +
          '<div class="sc__cards">' + card() + card() + card() + '</div>' +
        '</div>' +
        '<div class="sc__meta">' +
          '<div class="sc__row"><span class="sc__name">' + esc(s.name) + '</span>' +
          '<span class="sc__fam">' + esc(s.family) + '</span></div>' +
          '<p class="sc__why">' + esc(s.reason || s.signature || s.hero) + '</p>' +
          '<div class="sc__sw">' + sw + '</div>' +
        '</div>' +
      '</button>';
  }

  function renderGrid() {
    el.grid.innerHTML = state.styles.map(cardHtml).join("");
    el.pickbar.hidden = false;
    updatePicks();
  }

  function updatePicks() {
    var n = state.picked.length;
    el.pickedLabel.textContent = "Zaznaczono: " + n + " z " + MAX_PICKS;
    el.to3.disabled = n === 0;

    var full = n >= MAX_PICKS;
    Array.prototype.forEach.call(el.grid.querySelectorAll(".sc"), function (btn) {
      var on = state.picked.indexOf(btn.dataset.id) !== -1;
      btn.classList.toggle("is-picked", on);
      btn.classList.toggle("is-disabled", full && !on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    el.pickHint.textContent = full
      ? "Masz dwa style. Kliknij zaznaczony, żeby go odznaczyć."
      : "Kliknij kafelek, żeby zaznaczyć. Możesz wybrać od jednego do dwóch.";
  }

  el.grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".sc");
    if (!btn) return;
    var id = btn.dataset.id;
    var at = state.picked.indexOf(id);
    var wasEmpty = state.picked.length === 0;

    if (at !== -1) state.picked.splice(at, 1);
    else if (state.picked.length < MAX_PICKS) state.picked.push(id);
    updatePicks();

    // Po pierwszym wyborze pokazujemy przycisk "Dalej" - inaczej klient
    // moze go nie zauwazyc, bo siedzi pod dluga siatka kart.
    if (wasEmpty && state.picked.length === 1) {
      el.pickbar.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  el.brief.addEventListener("input", function () {
    el.briefCount.textContent = el.brief.value.length;
  });

  el.briefForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = el.brief.value.trim();
    if (v.length < 10) {
      showError(el.briefError, "Napisz choć zdanie lub dwa o swojej firmie — inaczej nie dobierzemy trafnie.");
      el.brief.focus();
      return;
    }
    showError(el.briefError, "");
    state.brief = v;
    state.picked = [];

    showStep(2);
    el.grid.innerHTML = "";
    el.pickbar.hidden = true;
    el.loading.hidden = false;
    el.briefSubmit.disabled = true;

    fetch("/api/match-style", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: v })
    })
      .then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) throw new Error(d.error || "Nie udało się dobrać stylów.");
          return d;
        });
      })
      .then(function (d) {
        state.styles = d.styles || [];
        if (!state.styles.length) throw new Error("Nie znaleźliśmy pasujących stylów. Spróbuj opisać firmę inaczej.");
        renderGrid();
      })
      .catch(function (err) {
        showStep(1);
        showError(el.briefError, err.message || "Coś poszło nie tak. Spróbuj ponownie.");
      })
      .finally(function () {
        el.loading.hidden = true;
        el.briefSubmit.disabled = false;
      });
  });

  el.back1.addEventListener("click", function () { showStep(1); });
  el.back2.addEventListener("click", function () { showStep(2); });

  function chosenStyles() {
    return state.picked.map(function (id) {
      return state.styles.filter(function (s) { return s.id === id; })[0];
    }).filter(Boolean);
  }

  el.to3.addEventListener("click", function () {
    var chosen = chosenStyles();
    el.summary.innerHTML = chosen.map(function (s) {
      var p = s.palette || {};
      var sw = ["bg", "ink", "accent"].map(function (k) {
        return '<span style="background:' + esc(p[k]) + '"></span>';
      }).join("");
      return '<span class="kr__chip"><span class="kr__chipsw">' + sw + '</span>' + esc(s.name) + '</span>';
    }).join("");
    showStep(3);
  });

  el.contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("c-name").value.trim();
    var email = $("c-email").value.trim();

    if (!name) { showError(el.sendError, "Podaj imię."); $("c-name").focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      showError(el.sendError, "Podaj poprawny adres e-mail.");
      $("c-email").focus();
      return;
    }
    showError(el.sendError, "");
    el.sendBtn.disabled = true;
    el.sendBtn.textContent = "Wysyłam…";

    fetch("/api/send-brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        email: email,
        phone: $("c-phone").value.trim(),
        company: $("c-company").value.trim(),
        note: $("c-note").value.trim(),
        brief: state.brief,
        chosen: chosenStyles().map(function (s) {
          return { id: s.id, name: s.name, family: s.family, reason: s.reason, palette: s.palette };
        })
      })
    })
      .then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) throw new Error(d.error || "Nie udało się wysłać zgłoszenia.");
          return d;
        });
      })
      .then(function () { showStep("done"); })
      .catch(function (err) {
        showError(el.sendError, err.message || "Nie udało się wysłać. Spróbuj ponownie.");
      })
      .finally(function () {
        el.sendBtn.disabled = false;
        el.sendBtn.textContent = "Wyślij zgłoszenie";
      });
  });

  $("year").textContent = new Date().getFullYear();
})();
