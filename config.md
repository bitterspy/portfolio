# Config — treść strony Portfolio

Plik roboczy z danymi używanymi do zbudowania strony (index.html). Edytuj tutaj,
potem przenieś zmiany do HTML.

## Dane osobowe

- **Imię i nazwisko / marka**: Wojciech Spychała
- **Tytuł/rola**: Developer / Twórca aplikacji webowych
- **Krótki opis (hero)**: Buduję aplikacje webowe — od pomysłu po wdrożenie.
- **Email kontaktowy**: wspychala71@gmail.com
- **Telefon**: 694 515 715
- **GitHub**: https://github.com/bitterspy

## Hosting

- **Docelowy serwer produkcyjny**: `ivy202-44591.mikrus.cloud` (mikr.us) — tu ma finalnie stanąć strona portfolio
- Deploy: statyczny HTML/CSS/JS, wgrywany przez SSH/SCP na serwer
- Netlify (bt-styl.netlify.app, damcar.netlify.app, 21brothers-demo.netlify.app) to tylko demo/podglądy INNYCH projektów użytych jako realizacje w portfolio — samo portfolio NIE hostujemy na Netlify

## Projekty

### 1. Kupbezposrednio.pl
- **Opis**: Portal ogłoszeń nieruchomości wyłącznie dla właścicieli (bez pośredników). USP: weryfikacja właściciela przez numer Księgi Wieczystej (KW).
- **Stack**: Next.js 14 (App Router), Supabase (PostgreSQL + PostGIS + Auth + Storage + Realtime), Mapbox, Tailwind CSS + shadcn/ui
- **Live URL**: https://kupbezposrednio.pl
- **Screenshot**: do zrobienia (Chrome → navigate → screenshot)

### 2. BT-Styl
- **Opis**: Strona wizytówka firmy sprzedającej okna (Szczecin) — oferta, realizacje, porady, formularz kontaktowy.
- **Stack**: Next.js 16 (App Router, static export), Tailwind CSS 4, Web3Forms
- **Live URL**: — (wkrótce, do ustalenia adres na mikr.us)
- **Screenshot**: placeholder na razie

### 3. damcar
- **Opis**: Wypożyczalnia aut — aplikacja webowa.
- **Stack**: Next.js
- **Live URL**: — (wkrótce, do ustalenia adres na mikr.us)
- **Screenshot**: placeholder na razie

## Sekcje strony (standard)

1. Hero — imię/marka, rola, krótki opis, CTA (scroll do projektów / kontakt)
2. O mnie — krótki akapit
3. Projekty — karty: Kupbezposrednio, BT-Styl, damcar
4. Umiejętności — lista technologii (Next.js, React, TypeScript, Tailwind, Supabase, Node.js, Vercel, git)
5. Kontakt — email, telefon, GitHub

## Kreator stylu (`/kreator.html`)

Zastąpił czat AI (usunięty 2026-08-02 — trzymał klucz Groq wprost w kodzie frontendu, więc byłby publiczny).

- Trzy kroki: opis firmy → wybór 2 z 6 dobranych stylów → formularz kontaktowy
- `api/match-style.js` — filtr słów kluczowych po `data/styles.json` (106 stylów), potem Groq układa kolejność i pisze uzasadnienia. Bez klucza działa sam filtr.
- `api/send-brief.js` — wysyłka briefu przez Resend na connect.szczecin@gmail.com
- Klucze **wyłącznie po stronie serwera**, jako zmienne środowiskowe Vercela: `GROQ_API_KEY` (ustawiony, dedykowany dla tego projektu), `RESEND_API_KEY` (do ustawienia)
- Podglądy stylów renderowane na żywo z tokenów w `styles.json` — to, co klient wybierze, tak zostanie zbudowane

## TODO

- [x] Ustalić live URL dla BT-Styl i damcar (Netlify: bt-styl.netlify.app, damcar.netlify.app) + dodano 21brothers-demo.netlify.app
- [x] Zrobić realny screenshot Kupbezposrednio.pl w przeglądarce
- [x] Osobny klucz Groq dla portfolio — zrobione 2026-08-02, klucz siedzi w zmiennych Vercela, nie w kodzie
- [ ] Założyć konto Resend i ustawić `RESEND_API_KEY` — bez tego formularz kreatora nie wyśle briefu
