const TO = "connect.szczecin@gmail.com";
const FROM = process.env.BRIEF_FROM || "Kreator stylu <onboarding@resend.dev>";

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

function swatches(palette) {
  if (!palette) return "";
  return Object.entries(palette)
    .map(
      ([k, v]) =>
        '<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 8px;border:1px solid #ddd;border-radius:4px;font:12px monospace">' +
        '<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' +
        esc(v) +
        ';border:1px solid rgba(0,0,0,.2);vertical-align:middle;margin-right:6px"></span>' +
        esc(k) + " " + esc(v) +
        "</span>"
    )
    .join("");
}

function buildHtml(d) {
  const chosen = d.chosen
    .map(
      (s, i) =>
        '<div style="border:1px solid #e2e2e6;border-radius:10px;padding:14px 16px;margin:0 0 12px">' +
        '<div style="font:700 15px system-ui;color:#111">' + (i + 1) + ". " + esc(s.name) +
        ' <span style="font:400 12px system-ui;color:#888">(' + esc(s.id) + " · " + esc(s.family) + ")</span></div>" +
        (s.reason ? '<div style="font:400 13px/1.5 system-ui;color:#555;margin-top:6px">' + esc(s.reason) + "</div>" : "") +
        '<div style="margin-top:10px">' + swatches(s.palette) + "</div>" +
        "</div>"
    )
    .join("");

  return (
    '<div style="font:400 14px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#222;max-width:640px">' +
    '<h2 style="font:700 19px system-ui;margin:0 0 4px">Nowy brief z kreatora stylu</h2>' +
    '<p style="color:#777;margin:0 0 20px;font-size:13px">' + esc(d.stamp) + "</p>" +

    '<h3 style="font:700 14px system-ui;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:0 0 8px">Kontakt</h3>' +
    '<table style="border-collapse:collapse;margin:0 0 22px;font-size:14px">' +
    "<tr><td style='padding:3px 14px 3px 0;color:#777'>Imię</td><td><strong>" + esc(d.name) + "</strong></td></tr>" +
    "<tr><td style='padding:3px 14px 3px 0;color:#777'>E-mail</td><td><a href='mailto:" + esc(d.email) + "'>" + esc(d.email) + "</a></td></tr>" +
    (d.phone ? "<tr><td style='padding:3px 14px 3px 0;color:#777'>Telefon</td><td>" + esc(d.phone) + "</td></tr>" : "") +
    (d.company ? "<tr><td style='padding:3px 14px 3px 0;color:#777'>Firma</td><td>" + esc(d.company) + "</td></tr>" : "") +
    "</table>" +

    '<h3 style="font:700 14px system-ui;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:0 0 8px">Opis projektu</h3>' +
    '<div style="background:#f6f6f8;border-radius:8px;padding:14px 16px;margin:0 0 22px;white-space:pre-wrap">' + esc(d.brief) + "</div>" +

    '<h3 style="font:700 14px system-ui;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:0 0 10px">Wybrane style (' + d.chosen.length + ")</h3>" +
    chosen +

    (d.note
      ? '<h3 style="font:700 14px system-ui;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:18px 0 8px">Uwagi klienta</h3>' +
        '<div style="background:#f6f6f8;border-radius:8px;padding:14px 16px;white-space:pre-wrap">' + esc(d.note) + "</div>"
      : "") +
    "</div>"
  );
}

function buildText(d) {
  const lines = [
    "NOWY BRIEF Z KREATORA STYLU",
    d.stamp,
    "",
    "KONTAKT",
    "Imię:   " + d.name,
    "E-mail: " + d.email
  ];
  if (d.phone) lines.push("Telefon: " + d.phone);
  if (d.company) lines.push("Firma:   " + d.company);
  lines.push("", "OPIS PROJEKTU", d.brief, "", "WYBRANE STYLE");
  d.chosen.forEach((s, i) => {
    lines.push(i + 1 + ". " + s.name + " (" + s.id + " · " + s.family + ")");
    if (s.reason) lines.push("   " + s.reason);
    if (s.palette) lines.push("   " + Object.entries(s.palette).map(([k, v]) => k + ":" + v).join("  "));
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
  const brief = String(body.brief || "").trim().slice(0, 2000);
  const note = String(body.note || "").trim().slice(0, 1000);
  const chosen = Array.isArray(body.chosen) ? body.chosen.slice(0, 4) : [];

  if (!name) return res.status(400).json({ error: "Podaj imię." });
  if (!validEmail(email)) return res.status(400).json({ error: "Podaj poprawny adres e-mail." });
  if (brief.length < 10) return res.status(400).json({ error: "Opis projektu jest za krótki." });
  if (!chosen.length) return res.status(400).json({ error: "Wybierz przynajmniej jeden styl." });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Wysyłka nie jest jeszcze skonfigurowana." });
  }

  const data = {
    name, email, phone, company, brief, note, chosen,
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
        subject: "Brief: " + (company || name) + " — " + chosen.map((c) => c.name).join(" + "),
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
