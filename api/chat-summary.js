// Podsumowuje odpowiedzi z czatu-doradcy w zwiezly brief PL do maila.
// Bez klucza Groq zwracamy surowe odpowiedzi - front i tak ma je wszystkie,
// to tylko ladniejsze sformulowanie do podsumowania na ekranie.

function fallbackSummary(answers) {
  return answers
    .filter((a) => a.answer && a.answer.trim())
    .map((a) => a.question + " " + a.answer.trim())
    .join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { answers } = req.body || {};
  if (!Array.isArray(answers) || !answers.length) {
    return res.status(400).json({ error: "Brak odpowiedzi do podsumowania." });
  }

  const clean = answers
    .filter((a) => a && typeof a.question === "string" && typeof a.answer === "string")
    .map((a) => ({ question: a.question.slice(0, 200), answer: a.answer.trim().slice(0, 800) }))
    .filter((a) => a.answer.length > 0)
    .slice(0, 12);

  if (!clean.length) {
    return res.status(200).json({ summary: "" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ summary: fallbackSummary(clean) });
  }

  const system =
    "Jestes asystentem, ktory na podstawie rozmowy z klientem o przebudowie jego strony internetowej " +
    "pisze krotkie, rzeczowe podsumowanie po polsku dla developera. " +
    "Pisz w punktach (jedna linia = jedna decyzja/ustalenie), bez lania wody, bez powtarzania pytan wprost. " +
    "Uzywaj pelnych polskich znakow diakrytycznych. Nie dodawaj nic poza tym, co wynika z odpowiedzi klienta.";

  const user = clean.map((a) => "Pytanie: " + a.question + "\nOdpowiedz klienta: " + a.answer).join("\n\n");

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!r.ok) throw new Error("groq " + r.status);
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("empty");

    return res.status(200).json({ summary: text.trim() });
  } catch (err) {
    return res.status(200).json({ summary: fallbackSummary(clean) });
  }
}
