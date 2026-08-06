const TO = "connect.szczecin@gmail.com";
const FROM = process.env.BRIEF_FROM || "Bot doradca <onboarding@resend.dev>";

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function validEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function answersHtml(answers) {
  return answers
    .map(
      (a) =>
        '<div style="margin:0 0 12px">' +
        '<div style="font:700 13px system-ui;color:#666;text-transform:uppercase;letter-spacing:.04em">' + esc(a.question) + "</div>" +
        '<div style="font:400 14px/1.5 system-ui;color:#222;margin-top:2px;white-space:pre-wrap">' + esc(a.answer) + "</div>" +
        "</div>"
    )
    .join("");
}

function buildHtml(d) {
  return (
    '<div style="font:400 14px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#222;max-width:640px">' +
    '<h2 style="font:700 19px system-ui;margin:0 0 4px">Nowe zgłoszenie z bota-doradcy</h2>' +
    '<p style="color:#777;margin:0 0 20px;font-size:13px">' + esc(d.stamp) + "</p>" +

    '<h3 style="font:700 14px system-ui;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:0 0 8px">Kontakt</h3>' +
    '<table style="border-collapse:collapse;margin:0 0 22px;font-size:14px">' +
    "<tr><td style='padding:3px 14px 3px 0;color:#777'>Imię</td><td><strong>" + esc(d.name) + "</strong></td></tr>" +
    "<tr><td style='padding:3px 14px 3px 0;color:#777'>E-mail</td><td><a href='mailto:" + esc(d.email) + "'>" + esc(d.email) + "</a></td></tr>" +
    (d.phone ? "<tr><td style='padding:3px 14px 3px 0;color:#777'>Telefon</td><td>" + esc(d.phone) + "</td></tr>" : "") +
    (d.company ? "<tr><td style='padding:3px 14px 3px 0;color:#777'>Firma</td><td>" + esc(d.company) + "</td></tr>" : "") +
    (d.oldSite ? "<tr><td style='padding:3px 14px 3px 0;color:#777'>Stara strona</td><td><a href='" + esc(d.oldSite) + "'>" + esc(d.oldSite) + "</a></td></tr>" : "") +
    "</table>" +

    '<h3 style="font:700 14px system-ui;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:0 0 10px">Podsumowanie rozmowy</h3>' +
    '<div style="background:#f6f6f8;border-radius:8px;padding:14px 16px;margin:0 0 22px;white-space:pre-wrap">' + esc(d.summary) + "</div>" +

    '<h3 style="font:700 14px system-ui;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:0 0 10px">Pełne odpowiedzi</h3>' +
    answersHtml(d.answers) +

    (d.note
      ? '<h3 style="font:700 14px system-ui;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:18px 0 8px">Uwagi klienta</h3>' +
        '<div style="background:#f6f6f8;border-radius:8px;padding:14px 16px;white-space:pre-wrap">' + esc(d.note) + "</div>"
      : "") +
    "</div>"
  );
}

function buildText(d) {
  const lines = [
    "NOWE ZGŁOSZENIE Z BOTA-DORADCY",
    d.stamp,
    "",
    "KONTAKT",
    "Imię:   " + d.name,
    "E-mail: " + d.email
  ];
  if (d.phone) lines.push("Telefon: " + d.phone);
  if (d.company) lines.push("Firma:   " + d.company);
  if (d.oldSite) lines.push("Stara strona: " + d.oldSite);
  lines.push("", "PODSUMOWANIE", d.summary, "", "PEŁNE ODPOWIEDZI");
  d.answers.forEach((a) => {
    lines.push("- " + a.question);
    lines.push("  " + a.answer);
  });
  if (d.note) lines.push("", "UWAGI KLIENTA", d.note);
  return lines.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160);
  const phone = String(body.phone || "").trim().slice(0, 60);
  const company = String(body.company || "").trim().slice(0, 160);
  const oldSite = String(body.oldSite || "").trim().slice(0, 300);
  const note = String(body.note || "").trim().slice(0, 1000);
  const summary = String(body.summary || "").trim().slice(0, 3000);
  const answers = Array.isArray(body.answers)
    ? body.answers
        .filter((a) => a && typeof a.question === "string" && typeof a.answer === "string")
        .map((a) => ({ question: a.question.slice(0, 200), answer: a.answer.slice(0, 800) }))
        .slice(0, 20)
    : [];

  if (!name) return res.status(400).json({ error: "Podaj imię." });
  if (!validEmail(email)) return res.status(400).json({ error: "Podaj poprawny adres e-mail." });
  if (!answers.length) return res.status(400).json({ error: "Brak odpowiedzi z rozmowy." });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Wysyłka nie jest jeszcze skonfigurowana." });
  }

  const data = {
    name, email, phone, company, oldSite, note, summary, answers,
    stamp: new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })
  };

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: "Zgłoszenie: " + (company || name),
        html: buildHtml(data),
        text: buildText(data)
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("resend failed", r.status, detail);
      return res.status(502).json({ error: "Nie udało się wysłać zgłoszenia. Spróbuj ponownie." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-brief error", err);
    return res.status(500).json({ error: "Nie udało się wysłać zgłoszenia. Spróbuj ponownie." });
  }
}
