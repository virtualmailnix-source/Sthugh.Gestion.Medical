# Déploiement : réservation de visites en ligne

Le site public et l'application médicale communiquent par un webhook
authentifié. Un secret partagé, identique des deux côtés, protège
l'Edge Function de réception.

## Le secret

La valeur a été générée avec `openssl rand -hex 32` et rangée dans
`.secrets.local` à la racine de ce projet (fichier ignoré par git,
lisible uniquement par votre compte). Elle ne doit apparaître dans
aucun fichier commité ni dans le code du front.

Pour en générer une nouvelle : `openssl rand -hex 32`
(équivalent SQL : `select encode(gen_random_bytes(32), 'hex');`).
En cas de rotation, mettre à jour les deux projets en même temps.

## Configuration côté app médicale (projet wfngkkrnzoponrajgdqk)

Dashboard Supabase → Edge Functions → Secrets :

| Secret | Valeur |
|---|---|
| `WEBHOOK_SECRET` | la valeur de `.secrets.local` |
| `RESEND_API_KEY` | optionnel, active l'email au demandeur |
| `RESEND_FROM` | optionnel, expéditeur des emails |

Déployer les fonctions `visit-request` et `notify-demande`
(dossier `supabase/functions/`). Avec le CLI :

    supabase functions deploy visit-request --project-ref wfngkkrnzoponrajgdqk
    supabase functions deploy notify-demande --project-ref wfngkkrnzoponrajgdqk
    supabase secrets set WEBHOOK_SECRET=<valeur> --project-ref wfngkkrnzoponrajgdqk

Exécuter aussi `requetes_sql/24_demandes_visite.sql` dans le SQL Editor
(après le 23).

## Configuration côté site public (projet mgbfcznrpiwobsxxryhl)

Dashboard Supabase → Edge Functions → Secrets :

| Secret | Valeur |
|---|---|
| `WEBHOOK_SECRET` | la même valeur que côté médical |
| `MEDICAL_WEBHOOK_URL` | `https://wfngkkrnzoponrajgdqk.supabase.co/functions/v1/visit-request` |

Déployer la fonction `reservation-visite`
(dossier `Web site/supabase/functions/`). Avec le CLI :

    supabase functions deploy reservation-visite --project-ref mgbfcznrpiwobsxxryhl
    supabase secrets set WEBHOOK_SECRET=<valeur> MEDICAL_WEBHOOK_URL=https://wfngkkrnzoponrajgdqk.supabase.co/functions/v1/visit-request --project-ref mgbfcznrpiwobsxxryhl

Exécuter `sql/demandes_visite_site.sql` dans le SQL Editor du site.

## Vérification rapide

1. Appel sans secret → 401 :

       curl -s -o /dev/null -w "%{http_code}" -X POST \
         https://wfngkkrnzoponrajgdqk.supabase.co/functions/v1/visit-request \
         -H "Content-Type: application/json" -d '{}'

2. Envoi d'un formulaire depuis le site → la demande apparaît dans
   Visites → Demandes en ligne, avec le badge dans la barre latérale.
3. Deuxième envoi identique (même email, même date) → message
   « Une demande existe déjà pour cette date. »
