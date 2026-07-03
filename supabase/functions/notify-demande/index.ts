// Notification email au demandeur après validation ou refus d'une
// demande de visite. Optionnelle : sans RESEND_API_KEY configurée,
// la fonction répond simplement 200 et le flux continue sans email.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = Deno.env.get("RESEND_FROM") ?? "St Hugh's Anglican Home <no-reply@sthughs.mu>";

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { error: "Méthode non autorisée" });

  let p: { email?: string; prenom?: string; statut?: string; date?: string; creneau?: string; motif?: string };
  try {
    p = await req.json();
  } catch {
    return reply(400, { error: "JSON invalide" });
  }

  if (!RESEND_API_KEY) {
    // TODO : configurer RESEND_API_KEY (et RESEND_FROM) dans les secrets
    // du projet pour activer l'envoi. En attendant : no-op volontaire.
    return reply(200, { ok: true, sent: false });
  }

  const creneauTxt = p.creneau === "matin" ? "matin (10h à 13h)" : "après-midi (16h à 19h)";
  const sujet = p.statut === "validee"
    ? "Votre visite à St Hugh's est confirmée"
    : "Votre demande de visite à St Hugh's";
  const corps = p.statut === "validee"
    ? `Bonjour ${p.prenom ?? ""},\n\nVotre visite du ${p.date ?? ""} (${creneauTxt}) est confirmée.\nMerci de vous présenter à l'accueil à votre arrivée.\n\nSt Hugh's Anglican Home, Rose Hill\nTél : 4641124`
    : `Bonjour ${p.prenom ?? ""},\n\nNous ne pouvons pas donner suite à votre demande de visite du ${p.date ?? ""}.\n${p.motif ? "Motif : " + p.motif + "\n" : ""}Vous pouvez nous joindre au 4641124 pour convenir d'une autre date.\n\nSt Hugh's Anglican Home, Rose Hill`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [p.email], subject: sujet, text: corps }),
  });

  return reply(200, { ok: true, sent: res.ok });
});
