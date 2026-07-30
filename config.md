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

## Czat AI (widget na stronie)

- Provider: Groq (chat completions, model llama), endpoint wywoływany bezpośrednio z frontendu (`script.js`)
- Klucz API: współdzielony z produkcją Kupbezposrednio (`GROQ_API_KEY` z `Kupbezposrednio/CREDENTIALS.md`) — świadomie użyty tu mimo że jest widoczny w źródle strony (patrz TODO niżej)
- System prompt: zachęcać klienta do kontaktu, chwalić jakość zrobionych stron/realizacji
- **WAŻNE**: w repo GitHub (`script.js` na GitHubie) klucz jest zastąpiony placeholderem `WPISZ_TU_KLUCZ_GROQ_PRZED_DEPLOYEM` — GitHub push protection blokował push z prawdziwym kluczem. Prawdziwy klucz jest wpisany TYLKO w pliku na serwerze produkcyjnym `/var/www/html/script.js` (mikr.us). Jeśli redeployujesz z repo, pamiętaj wkleić realny klucz z powrotem przed wgraniem na serwer — albo lepiej, dokończ TODO poniżej i przejdź na osobny dedykowany klucz.

## TODO

- [x] Ustalić live URL dla BT-Styl i damcar (Netlify: bt-styl.netlify.app, damcar.netlify.app) + dodano 21brothers-demo.netlify.app
- [x] Zrobić realny screenshot Kupbezposrednio.pl w przeglądarce
- [ ] **Zmienić klucz Groq użyty w czacie na stronie na osobny, dedykowany klucz** — obecnie używany jest ten sam klucz co w produkcyjnym Kupbezposrednio, wpisany wprost w JS frontendu (widoczny publicznie w źródle strony). Ryzyko: ktoś wyciągnie klucz i wyczerpie limit/budżet współdzielony z produkcją. Założyć nowy klucz w Groq Console dedykowany portfolio, z osobnym niskim limitem. Po założeniu: wpisać go zarówno w lokalnym `repo/script.js` (do commitowania jako placeholder trzeba pamiętać) jak i bezpośrednio na serwerze.
