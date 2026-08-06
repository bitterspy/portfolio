# TODO — Portfolio Connect

## Zrobione 2026-08-06

- Bot doradca w hero (`chat.js`) zastąpił kreator stylu — scripted flow pytań
  (stara strona → problem → kolor → styl → układ → menu → uwagi), chipy
  szybkich odpowiedzi, formularz kontaktowy jako ostatni krok czatu.
- Groq (`api/chat-summary.js`) składa podsumowanie rozmowy do maila.
- `api/send-brief.js` przebudowany pod nową treść (stara strona + podsumowanie
  + pełne odpowiedzi zamiast wybranych stylów).
- Usunięte: `kreator.html/css/js`, `api/match-style.js`, `data/styles.json`
  (biblioteka stylów w `style-library/` poza repo zostaje nietknięta).
- Przełącznik ciemny/jasny (☀︎/☾) w nawigacji — `theme.js`, prosta paleta
  jasna bez tekstury papieru, zapis w `localStorage`.

## Otwarte

- [ ] Założyć konto Resend i ustawić `RESEND_API_KEY` w Vercel — bez tego
      formularz na końcu czatu nie wyśle zgłoszenia (zwróci błąd 500).
- [ ] Obejrzeć czat i przełącznik motywu w przeglądarce na produkcji po
      deployu, przetestować pełny przepływ (wszystkie pytania → wysyłka).
