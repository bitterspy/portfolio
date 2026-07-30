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
    "Twoim celem jest: (1) krótko i naturalnie odpowiadać na pytania rozmówcy, pokazując kompetencję, " +
    "(2) wspominać o kontakcie (connect.szczecin@gmail.com, 694 515 715) tylko gdy naturalnie pasuje do rozmowy — " +
    "NIE w każdej wiadomości, nie nachalnie. Odpowiadaj krótko, po polsku, w luźnym, pomocnym tonie, jak kolega z branży, " +
    "nie jak automat sprzedażowy. Nie wymyślaj cen ani terminów — jeśli ktoś pyta o konkrety, zaproponuj kontakt.";

  var toggle = document.getElementById("chatToggle");
  var panel = document.getElementById("chatPanel");
  var overlay = document.getElementById("chatOverlay");
  var header = document.getElementById("chatHeader");
  var closeBtn = document.getElementById("chatClose");
  var form = document.getElementById("chatForm");
  var input = document.getElementById("chatInput");
  var messages = document.getElementById("chatMessages");

  var history = [{ role: "system", content: SYSTEM_PROMPT }];
  var expanded = false;

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

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;

    expandPanel();
    addMessage(text, "user");
    history.push({ role: "user", content: text });
    input.value = "";
    input.disabled = true;

    var typingEl = addTyping();

    fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: history,
        temperature: 0.7,
        max_tokens: 300
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Groq API error " + res.status);
        return res.json();
      })
      .then(function (data) {
        var reply = data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content
          : "Przepraszam, coś poszło nie tak. Napisz do nas bezpośrednio: connect.szczecin@gmail.com";
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
})();
