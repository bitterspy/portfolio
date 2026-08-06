(function () {
  "use strict";

  // Scripted flow: kazdy krok to stale pytanie bota + opcjonalne chipy
  // (szybkie odpowiedzi). Groq nie prowadzi rozmowy - tylko na koncu
  // sklada podsumowanie z zebranych odpowiedzi (patrz /api/chat-summary).
  var STEPS = [
    {
      key: "oldSite",
      q: "Cześć! Zacznijmy od Twojej obecnej strony — wklej link (albo napisz, że jej nie masz).",
      chips: ["Nie mam jeszcze strony"]
    },
    {
      key: "problem",
      q: "Co Cię w niej najbardziej irytuje / co chcesz zmienić?",
      chips: ["Wygląda przestarzale", "Źle się ją obsługuje", "Nie działa na telefonie", "Buduję od zera"]
    },
    {
      key: "color",
      q: "Jaki kierunek kolorystyczny Ci pasuje?",
      chips: ["Ciemny, nowoczesny", "Jasny, minimalistyczny", "Stonowany, naturalny", "Odważny, kolorowy"]
    },
    {
      key: "style",
      q: "A jaki ogólny styl / charakter ma mieć strona?",
      chips: ["Korporacyjny, poważny", "Kreatywny, nietypowy", "Prosty i funkcjonalny", "Ciepły, kameralny"]
    },
    {
      key: "layout",
      q: "Jak wyobrażasz sobie układ strony głównej? Co ma rzucać się w oczy jako pierwsze?",
      chips: ["Duże zdjęcie/hero", "Oferta / produkty", "Formularz kontaktowy", "Realizacje / portfolio"]
    },
    {
      key: "menu",
      q: "Gdzie ma siedzieć menu nawigacyjne?",
      chips: ["Góra, na całej szerokości", "Boczne menu", "Proste, kilka linków u góry"]
    },
    {
      key: "note",
      q: "Coś jeszcze, o czym powinienem wiedzieć — termin, budżet, strona konkurencji, która Ci się podoba?",
      chips: ["Nie, to tyle"]
    }
  ];

  var state = { step: 0, answers: [], done: false };

  var log = document.getElementById("chatLog");
  var form = document.getElementById("chatForm");
  var input = document.getElementById("chatInput");
  var chipsBox = document.getElementById("chatChips");

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function addMsg(role, html, isHtml) {
    var div = document.createElement("div");
    div.className = "chat__msg chat__msg--" + role;
    div.innerHTML = isHtml ? html : esc(html);
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function showChips(list) {
    if (!list || !list.length) { chipsBox.hidden = true; chipsBox.innerHTML = ""; return; }
    chipsBox.innerHTML = list.map(function (c) {
      return '<button type="button" class="chat__chip">' + esc(c) + "</button>";
    }).join("");
    chipsBox.hidden = false;
  }

  function askStep(i) {
    var step = STEPS[i];
    addMsg("bot", step.q);
    showChips(step.chips);
    input.placeholder = "Twoja odpowiedź…";
    input.focus();
  }

  function renderContactStep() {
    form.hidden = true;
    showChips([]);
    addMsg("bot", "Super, to wszystko czego potrzebuję. Podaj dane kontaktowe, a wyślę to jako zgłoszenie.");
    var wrap = document.createElement("form");
    wrap.className = "chat__contact";
    wrap.id = "chatContactForm";
    wrap.innerHTML =
      '<input type="text" id="ccName" class="chat__input" placeholder="Imię" autocomplete="given-name" required>' +
      '<input type="email" id="ccEmail" class="chat__input" placeholder="E-mail" autocomplete="email" required>' +
      '<input type="tel" id="ccPhone" class="chat__input" placeholder="Telefon (opcjonalnie)" autocomplete="tel">' +
      '<input type="text" id="ccCompany" class="chat__input" placeholder="Nazwa firmy (opcjonalnie)" autocomplete="organization">' +
      '<button type="submit" class="btn btn--primary chat__send" id="ccSend">Wyślij zgłoszenie</button>' +
      '<p class="chat__error" id="ccError" hidden></p>';
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;

    wrap.addEventListener("submit", function (e) {
      e.preventDefault();
      submitContact(wrap);
    });
    document.getElementById("ccName").focus();
  }

  function showError(node, msg) {
    if (!msg) { node.hidden = true; node.textContent = ""; return; }
    node.textContent = msg;
    node.hidden = false;
  }

  function submitContact(wrap) {
    var name = document.getElementById("ccName").value.trim();
    var email = document.getElementById("ccEmail").value.trim();
    var errNode = document.getElementById("ccError");

    if (!name) { showError(errNode, "Podaj imię."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showError(errNode, "Podaj poprawny adres e-mail."); return; }
    showError(errNode, "");

    var btn = document.getElementById("ccSend");
    btn.disabled = true;
    btn.textContent = "Wysyłam…";

    var answersForApi = state.answers.map(function (a) {
      return { question: a.question, answer: a.answer };
    });

    fetch("/api/chat-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: answersForApi })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (d) {
        var summary = d.summary || answersForApi.map(function (a) { return a.question + " " + a.answer; }).join("\n");
        var byKey = {};
        state.answers.forEach(function (a) { byKey[a.key] = a.answer; });

        return fetch("/api/send-brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name,
            email: email,
            phone: document.getElementById("ccPhone").value.trim(),
            company: document.getElementById("ccCompany").value.trim(),
            oldSite: byKey.oldSite || "",
            note: byKey.note || "",
            summary: summary,
            answers: answersForApi
          })
        });
      })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || "Nie udało się wysłać."); return d; }); })
      .then(function () {
        wrap.remove();
        addMsg("bot", "Dziękuję — zgłoszenie poszło w świat. Odezwę się na podany adres, zwykle w ciągu jednego dnia roboczego.");
      })
      .catch(function (err) {
        showError(errNode, err.message || "Coś poszło nie tak. Spróbuj ponownie.");
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = "Wyślij zgłoszenie";
      });
  }

  function handleAnswer(text) {
    if (!text.trim() || state.done) return;
    var step = STEPS[state.step];
    addMsg("user", text);
    state.answers.push({ key: step.key, question: step.q, answer: text.trim() });
    input.value = "";
    state.step += 1;

    if (state.step < STEPS.length) {
      setTimeout(function () { askStep(state.step); }, 250);
    } else {
      state.done = true;
      setTimeout(renderContactStep, 250);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    handleAnswer(input.value);
  });

  chipsBox.addEventListener("click", function (e) {
    var btn = e.target.closest(".chat__chip");
    if (!btn) return;
    handleAnswer(btn.textContent);
  });

  askStep(0);
})();
