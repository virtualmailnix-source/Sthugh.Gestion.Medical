// Edge Function : réception des demandes de visite du site public.
// Appel server-to-server uniquement, authentifié par le header
// x-webhook-secret (comparé au secret d'environnement WEBHOOK_SECRET).
// Déployer avec verify_jwt = false (voir supabase/config.toml).

import { createClient } from "npm:@supabase/supabase-js@2";

const CRENEAUX = ["matin", "apres_midi"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405, { error: "Méthode non autorisée" });

  const secret = Deno.env.get("WEBHOOK_SECRET");
  const given = req.headers.get("x-webhook-secret");
  if (!secret || !given || given !== secret) {
    return reply(401, { error: "Secret webhook invalide" });
  }

  let p: Record<string, unknown>;
  try {
    p = await req.json();
  } catch {
    return reply(400, { error: "JSON invalide" });
  }

  const prenom = String(p.demandeur_prenom ?? "").trim();
  const nom = String(p.demandeur_nom ?? "").trim();
  const email = String(p.demandeur_email ?? "").trim().toLowerCase();
  const telephone = String(p.demandeur_telephone ?? "").trim();
  const residentSaisi = String(p.resident_saisi ?? "").trim();
  const lienParente = String(p.lien_parente ?? "").trim() || null;
  const dateVisite = String(p.date_visite ?? "").trim();
  const creneau = String(p.creneau ?? "").trim();
  const nbVisiteurs = Number(p.nb_visiteurs ?? 1);
  const message = String(p.message ?? "").trim() || null;

  if (!prenom || !nom || !email || !telephone || !residentSaisi || !dateVisite || !creneau) {
    return reply(400, { error: "Champs requis manquants" });
  }
  if (!EMAIL_RE.test(email)) return reply(400, { error: "Email invalide" });
  if (!CRENEAUX.includes(creneau)) return reply(400, { error: "Créneau invalide" });
  if (!Number.isInteger(nbVisiteurs) || nbVisiteurs < 1 || nbVisiteurs > 6) {
    return reply(400, { error: "Nombre de visiteurs invalide (1 à 6)" });
  }
  const d = new Date(dateVisite + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(d.getTime()) || d <= today) {
    return reply(400, { error: "La date doit être future" });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Anti-doublon : même email + même date déjà en attente
  const { data: existing } = await db
    .from("demandes_visite")
    .select("id")
    .eq("demandeur_email", email)
    .eq("date_visite", dateVisite)
    .eq("statut", "en_attente")
    .limit(1);

  if (existing && existing.length > 0) {
    return reply(409, { error: "Une demande existe déjà pour cette date" });
  }

  const { data, error } = await db
    .from("demandes_visite")
    .insert({
      demandeur_prenom: prenom,
      demandeur_nom: nom,
      demandeur_email: email,
      demandeur_telephone: telephone,
      resident_saisi: residentSaisi,
      lien_parente: lienParente,
      date_visite: dateVisite,
      creneau,
      nb_visiteurs: nbVisiteurs,
      message,
      statut: "en_attente",
    })
    .select("id")
    .single();

  if (error) return reply(500, { error: error.message });
  return reply(201, { ok: true, id: data.id });
});
