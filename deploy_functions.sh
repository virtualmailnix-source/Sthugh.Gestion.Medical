#!/usr/bin/env bash
# Déploiement des Edge Functions (voir README_DEPLOIEMENT.md).
# Déploie les 3 fonctions, pose les secrets depuis .secrets.local,
# puis vérifie que le webhook répond 401 sans secret et 400 avec.
# S'arrête à la première erreur.
set -euo pipefail

MEDICAL_REF="wfngkkrnzoponrajgdqk"
SITE_REF="mgbfcznrpiwobsxxryhl"
MAJ="/home/hsergio/Bureau/MAJ"
SITE="/home/hsergio/Bureau/MAJ site web St Hugh/Web site"
SECRETS="$MAJ/.secrets.local"

echo "=== 1/5 : deploiement visit-request (projet medical) ==="
cd "$MAJ"
supabase functions deploy visit-request --project-ref "$MEDICAL_REF"

echo "=== 2/5 : deploiement notify-demande (projet medical) ==="
supabase functions deploy notify-demande --project-ref "$MEDICAL_REF"

echo "=== 3/5 : secret WEBHOOK_SECRET (projet medical) ==="
WS="$(grep '^WEBHOOK_SECRET=' "$SECRETS" | cut -d= -f2-)"
supabase secrets set "WEBHOOK_SECRET=$WS" --project-ref "$MEDICAL_REF"

echo "=== 4/5 : deploiement reservation-visite (projet site) ==="
cd "$SITE"
supabase functions deploy reservation-visite --project-ref "$SITE_REF"

echo "=== 5/5 : secrets WEBHOOK_SECRET + MEDICAL_WEBHOOK_URL (projet site) ==="
supabase secrets set --env-file "$SECRETS" --project-ref "$SITE_REF"

echo ""
echo "=== Verification ==="
sleep 3
CODE_SANS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "https://$MEDICAL_REF.supabase.co/functions/v1/visit-request" \
  -H "Content-Type: application/json" -d '{}')
echo "Appel sans secret  -> HTTP $CODE_SANS (attendu : 401)"

CODE_AVEC=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "https://$MEDICAL_REF.supabase.co/functions/v1/visit-request" \
  -H "Content-Type: application/json" -H "x-webhook-secret: $WS" -d '{}')
echo "Appel avec secret  -> HTTP $CODE_AVEC (attendu : 400, champs manquants)"

if [ "$CODE_SANS" = "401" ] && [ "$CODE_AVEC" = "400" ]; then
  echo ""
  echo "TOUT EST BON : fonctions deployees et secrets en place."
else
  echo ""
  echo "ATTENTION : codes inattendus, montrer cette sortie a Claude."
fi
