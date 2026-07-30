(function () {
  var GROQ_API_KEY = "WPISZ_TU_KLUCZ_GROQ_PRZED_DEPLOYEM";
  var GROQ_MODEL = "llama-3.3-70b-versatile";
  var GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

  var SYSTEM_PROMPT =
    "Jesteś asystentem AI na stronie portfolio firmy Connect (Wojciech Spychała), " +
    "która buduje strony i aplikacje webowe (Next.js, React, TypeScript, Supabase) DLA DOWOLNEJ branży klienta — " +
    "nie ma znaczenia, czy to sklep z zabawkami, kancelaria, restauracja, startup, cokolwiek. Nigdy nie sugeruj, " +
    "że jakiś temat 'nie pasuje' do stylu czy oferty firmy — zawsze reaguj entuzjastycznie, że damy radę to zrobić. " +
    "Portfolio zawiera przykładowe realizacje: kupbezposrednio.pl (portal ogłoszeń nieruchomości), " +
    "BT-Styl (strona firmy okiennej), damcar (wypożyczalnia aut), 21'BROTHERS (marka toreb motocyklowych) — " +
    "to tylko próbki umiejętności, nie ograniczenie branżowe. " +
    "Dane kontaktowe (connect.szczecin@gmail.com, 694 515 715) zostały już podane rozmówcy w wiadomości powitalnej — " +
    "NIE powtarzaj ich ponownie w kolejnych odpowiedziach, nawet jeśli rozmowa naturalnie do tego zmierza. " +
    "Skup się wyłącznie na merytorycznej rozmowie o stronie/aplikacji, którą rozmówca chce zbudować. " +
    "Odpowiadaj krótko, po polsku, w luźnym, pomocnym tonie, jak kolega z branży, nie jak automat sprzedażowy. " +
    "Nie wymyślaj cen ani terminów.";

  var WELCOME_MESSAGE =
    "Cześć! Jestem botem AI portfolio Connect 🤖 Chętnie pogadam o Twoim pomyśle na stronę. " +
    "Jeśli wolisz od razu do człowieka: connect.szczecin@gmail.com albo 694 515 715.";

  var toggle = document.getElementById("chatToggle");
  var panel = document.getElementById("chatPanel");
  var overlay = document.getElementById("chatOverlay");
  var header = document.getElementById("chatHeader");
  var closeBtn = document.getElementById("chatClose");
  var copyBtn = document.getElementById("chatCopy");
  var form = document.getElementById("chatForm");
  var input = document.getElementById("chatInput");
  var messages = document.getElementById("chatMessages");

  var history = [{ role: "system", content: SYSTEM_PROMPT }];
  var expanded = false;
  addMessage(WELCOME_MESSAGE, "bot");
  history.push({ role: "assistant", content: WELCOME_MESSAGE });

  function expandPanel() {
    if (expanded) return;
    expanded = true;
    panel.classList.add("chat__panel--expanded");
    header.hidden = false;
    messages.hidden = false;
    overlay.hidden = false;
    toggle.classList.add("chat__toggle--seen");
  }
  function collapsePanel() {
    expanded = false;
    panel.classList.remove("chat__panel--expanded");
    header.hidden = true;
    messages.hidden = true;
    overlay.hidden = true;
  }

  toggle.addEventListener("click", function () {
    if (!expanded) expandPanel();
    else collapsePanel();
  });
  overlay.addEventListener("click", collapsePanel);
  closeBtn.addEventListener("click", collapsePanel);

  function addMessage(text, role) {
    var el = document.createElement("div");
    el.className = "chat__msg chat__msg--" + (role === "user" ? "user" : "bot");
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function addTyping() {
    var el = document.createElement("div");
    el.className = "chat__msg chat__msg--bot chat__msg--typing";
    el.textContent = "piszę…";
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function callGroq(messagesPayload) {
    return fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messagesPayload,
        temperature: 0.7,
        max_tokens: 300
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Groq API error " + res.status);
        return res.json();
      })
      .then(function (data) {
        return data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : null;
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) {
      if (!expanded) expandPanel();
      else input.focus();
      return;
    }

    expandPanel();
    addMessage(text, "user");
    history.push({ role: "user", content: text });
    input.value = "";
    input.disabled = true;

    var typingEl = addTyping();

    callGroq(history)
      .then(function (reply) {
        reply = reply || "Przepraszam, coś poszło nie tak. Napisz do nas bezpośrednio: connect.szczecin@gmail.com";
        typingEl.remove();
        addMessage(reply, "bot");
        history.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        typingEl.remove();
        addMessage("Ups, chwilowy problem z połączeniem. Napisz do nas: connect.szczecin@gmail.com", "bot");
      })
      .finally(function () {
        input.disabled = false;
        input.focus();
      });
  });

  copyBtn.addEventListener("click", function () {
    if (history.length <= 2) {
      copyBtn.textContent = "…";
      copyBtn.disabled = true;
      setTimeout(function () {
        copyBtn.textContent = "⧉";
        copyBtn.disabled = false;
      }, 800);
      return;
    }

    copyBtn.disabled = true;
    copyBtn.textContent = "…";

    var summaryRequest = history.concat([{
      role: "user",
      content: "Podsumuj naszą rozmowę w 3-5 zdaniach po polsku: czego chce klient, jakie ustalenia padły. " +
        "To podsumowanie trafi do Wojciecha mailem/SMS-em, więc pisz o kliencie w trzeciej osobie, rzeczowo, bez zwrotów do niego."
    }]);

    callGroq(summaryRequest)
      .then(function (summary) {
        var text = summary || "Nie udało się wygenerować podsumowania.";
        return navigator.clipboard.writeText(text);
      })
      .then(function () {
        copyBtn.textContent = "✓";
      })
      .catch(function () {
        copyBtn.textContent = "!";
      })
      .finally(function () {
        setTimeout(function () {
          copyBtn.textContent = "⧉";
          copyBtn.disabled = false;
        }, 1800);
      });
  });
})();
