import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Import JSON-a przez fs - skladnia `assert/with` roznila sie miedzy wersjami Node.
const here = dirname(fileURLToPath(import.meta.url));
const styles = JSON.parse(readFileSync(join(here, "..", "data", "styles.json"), "utf8"));

const MAX_BRIEF = 1200;
const SHORTLIST = 14;   // ile stylow trafia do Groq
const PICK = 6;         // ile Groq ma wybrac

// Rdzen slowa - polska fleksja ("kawiarnie" -> "kawiarni" pasuje do "kawiarnia").
function stem(w) {
  return w.length > 5 ? w.slice(0, Math.max(5, w.length - 2)) : w;
}

// Zwraca style wstepnie dopasowane po slowach kluczowych.
function prefilter(brief) {
  const text = brief.toLowerCase();
  const words = text.split(/[^a-ząćęłńóśźż0-9]+/).filter((w) => w.length > 2);
  const stems = words.map(stem);

  const scored = styles.styles.map((s) => {
    let score = 0;
    for (const topic of s.topics) {
      const t = topic.toLowerCase();
      const ts = stem(t);
      // Krotkie tematy (ai, ml, hr, it) tylko jako cale slowo - inaczej "ml"
      // trafia w srodek "mlodzi" i kawiarnia dostaje styl dla AI.
      const whole = words.includes(t);
      if (t.length <= 3) {
        if (whole) score += 10;
        continue;
      }
      if (text.includes(t)) score += 10;
      else if (stems.some((w) => w === ts)) score += 7;
      else if (t.length > 4 && stems.some((w) => w.length > 4 && (ts.startsWith(w) || w.startsWith(ts)))) score += 4;
    }
    const mood = s.mood.toLowerCase();
    if (words.some((w) => w.length > 4 && mood.includes(w))) score += 2;
    return { style: s, score };
  });

  const hits = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  const seenIds = new Set(hits.map((h) => h.style.id));

  // Za malo trafien - dosypujemy z rodzin ktore juz trafily (pokrewne),
  // a dopiero na koncu z pozostalych. Inaczej kawiarnia dostaje styl gamingowy.
  if (hits.length < SHORTLIST) {
    const hitFamilies = [...new Set(hits.map((h) => h.style.family))];
    for (const fam of hitFamilies) {
      for (const s of styles.styles) {
        if (hits.length >= SHORTLIST) break;
        if (seenIds.has(s.id) || s.family !== fam) continue;
        hits.push({ style: s, score: 0 });
        seenIds.add(s.id);
      }
    }
  }

  // Nadal za malo (bardzo nietypowy opis) - bierzemy przekroj rodzin.
  if (hits.length < SHORTLIST) {
    const usedFamilies = new Set(hits.map((h) => h.style.family));
    for (const s of styles.styles) {
      if (hits.length >= SHORTLIST) break;
      if (seenIds.has(s.id) || usedFamilies.has(s.family)) continue;
      hits.push({ style: s, score: 0 });
      usedFamilies.add(s.family);
      seenIds.add(s.id);
    }
  }

  return hits.slice(0, SHORTLIST).map((x) => x.style);
}

// Skrocony opis stylu dla modelu - pelne tokeny sa niepotrzebne i kosztuja.
function forModel(s) {
  return {
    id: s.id,
    nazwa: s.name,
    rodzina: s.family,
    charakter: s.mood,
    tematy: s.topics.join(", "),
    hero: s.hero
  };
}

// Bez AI nie zmyslamy uzasadnienia - front pokaze wtedy `signature`,
// czyli konkret o wygladzie zamiast powtorzonego `mood`.
function fallback(shortlist) {
  return shortlist.slice(0, PICK).map((s) => ({ id: s.id, reason: "" }));
}

async function askGroq(brief, shortlist, apiKey) {
  const catalog = shortlist.map(forModel);

  const system =
    "Jestes doradca od projektowania stron. Dostajesz opis firmy klienta i katalog stylow wizualnych. " +
    "Wybierasz " + PICK + " stylow najlepiej pasujacych do tej firmy. " +
    "Odpowiadasz WYLACZNIE poprawnym JSON-em, bez markdown, bez komentarza. " +
    'Format: {"picks":[{"id":"<id ze katalogu>","reason":"<jedno zdanie po polsku, dlaczego ten styl pasuje wlasnie tej firmie>"}]}. ' +
    "Uzywaj wylacznie id z katalogu. Reason ma byc konkretny i odnosic sie do branzy klienta, nie ogolnikowy. " +
    "Pisz po polsku z pelnymi znakami diakrytycznymi.";

  const user =
    "OPIS FIRMY KLIENTA:\n" + brief + "\n\nKATALOG STYLOW:\n" + JSON.stringify(catalog);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.4,
      max_tokens: 900,
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) throw new Error("groq " + res.status);

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("empty");

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.picks)) throw new Error("shape");

  // Model bywa kreatywny z id - przepuszczamy tylko te istniejace w shortliscie.
  const allowed = new Set(shortlist.map((s) => s.id));
  const picks = parsed.picks
    .filter((p) => p && allowed.has(p.id))
    .slice(0, PICK)
    .map((p) => ({
      id: p.id,
      reason: typeof p.reason === "string" ? p.reason.slice(0, 240) : ""
    }));

  if (!picks.length) throw new Error("no valid picks");
  return picks;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { brief } = req.body || {};
  if (typeof brief !== "string" || brief.trim().length < 10) {
    return res.status(400).json({ error: "Opisz krótko swoją firmę (min. 10 znaków)." });
  }

  const clean = brief.trim().slice(0, MAX_BRIEF);
  const shortlist = prefilter(clean);

  let picks;
  let usedAi = false;

  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey) {
    try {
      picks = await askGroq(clean, shortlist, apiKey);
      usedAi = true;
    } catch (err) {
      picks = fallback(shortlist);
    }
  } else {
    picks = fallback(shortlist);
  }

  // Doklejamy pelne tokeny - front renderuje z nich podglad.
  const byId = new Map(styles.styles.map((s) => [s.id, s]));
  const result = picks
    .map((p) => {
      const s = byId.get(p.id);
      if (!s) return null;
      return {
        id: s.id,
        name: s.name,
        family: s.family,
        mood: s.mood,
        hero: s.hero,
        signature: s.signature,
        palette: s.palette,
        fonts: s.fonts,
        scale: s.scale,
        geometry: s.geometry,
        reason: p.reason
      };
    })
    .filter(Boolean);

  return res.status(200).json({ styles: result, ai: usedAi });
}
