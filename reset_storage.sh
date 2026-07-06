#!/usr/bin/env bash
# Purge des fichiers devenus orphelins après 27_reboot_complet_v2.sql.
# Supabase interdit le DELETE direct sur storage.objects (trigger
# storage.protect_delete) : on passe donc par l'API Storage.
#
# Supprime, dans le projet MÉDICAL :
#   - bucket photos-residents : TOUT sauf le dossier users/
#     (avatars du personnel, car app_users est conservé)
#   - bucket ordonnances      : TOUT
#
# Clé requise : service_role (Dashboard > Settings > API Keys).
# Elle est lue dans $SERVICE_ROLE_KEY, sinon dans la ligne
# SERVICE_ROLE_KEY=... de .secrets.local, sinon demandée au clavier
# (saisie masquée, jamais écrite sur disque).
set -euo pipefail

MEDICAL_REF="wfngkkrnzoponrajgdqk"
SECRETS="/home/hsergio/Bureau/MAJ/.secrets.local"

KEY="${SERVICE_ROLE_KEY:-}"
if [ -z "$KEY" ] && [ -f "$SECRETS" ]; then
  KEY="$(grep '^SERVICE_ROLE_KEY=' "$SECRETS" | cut -d= -f2- || true)"
fi
if [ -z "$KEY" ]; then
  read -rsp "Cle service_role du projet medical : " KEY; echo ""
fi
[ -n "$KEY" ] || { echo "Aucune cle fournie, abandon."; exit 1; }

export SB_URL="https://$MEDICAL_REF.supabase.co" SB_KEY="$KEY"

python3 - <<'EOF'
import json, os, sys, urllib.request

URL, KEY = os.environ['SB_URL'], os.environ['SB_KEY']
HEADERS = {'Authorization': f'Bearer {KEY}', 'apikey': KEY,
           'Content-Type': 'application/json'}

def api(method, path, body):
    req = urllib.request.Request(URL + path, method=method,
        data=json.dumps(body).encode(), headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} sur {path} : {e.read().decode()[:300]}\n"
                 "(cle service_role invalide ?)")

# Liste récursive : les dossiers ont id null, les fichiers un id
def walk(bucket, prefix, skip=()):
    files, offset = [], 0
    while True:
        page = api('POST', f'/storage/v1/object/list/{bucket}', {
            'prefix': prefix, 'limit': 1000, 'offset': offset,
            'sortBy': {'column': 'name', 'order': 'asc'}})
        for e in page:
            full = f"{prefix}/{e['name']}" if prefix else e['name']
            if e.get('id') is None:
                if full not in skip:
                    files += walk(bucket, full, skip)
            else:
                files.append(full)
        if len(page) < 1000:
            return files
        offset += 1000

def purge(bucket, skip=()):
    files = walk(bucket, '', skip)
    if not files:
        print(f"{bucket} : deja vide (hors {', '.join(skip) or 'rien'})")
        return
    for i in range(0, len(files), 100):
        api('DELETE', f'/storage/v1/object/{bucket}',
            {'prefixes': files[i:i+100]})
    print(f"{bucket} : {len(files)} fichier(s) supprime(s)")

purge('photos-residents', skip=('users',))
purge('ordonnances')
print("Purge terminee. Relancer la verification du SQL 27 : les deux")
print("compteurs storage doivent etre a 0.")
EOF
