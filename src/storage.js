import { db } from './supabase.js';

// Buckets privés (SQL 25 et 26) : la base ne stocke que des chemins de
// fichiers. Ce module convertit les chemins en URLs signées temporaires,
// par lot (un seul appel réseau par page) et avec un cache par bucket
// commun à toutes les pages.

const EXPIRY = 3600;             // durée de vie d'une URL signée (secondes)
const MARGE  = 600 * 1000;       // renouvelée 10 min avant expiration

const BUCKET_PHOTOS      = 'photos-residents';   // résidents + users/ (avatars)
const BUCKET_ORDONNANCES = 'ordonnances';

const _caches = new Map();       // bucket -> Map(chemin -> { url, exp })
function _cacheOf(bucket) {
  if (!_caches.has(bucket)) _caches.set(bucket, new Map());
  return _caches.get(bucket);
}

// Valeur historique (URL publique complète) ou actuelle (chemin) -> chemin.
// Renvoie null pour une URL étrangère au bucket.
function _toPath(v, bucket) {
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) return v;
  const m = String(v).match(new RegExp(`/storage/v1/object/(?:public|sign)/${bucket}/([^?]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

// Remplace, sur chaque ligne, row[field] (chemin ou ancienne URL publique)
// par une URL signée prête à afficher. Conserve le chemin d'origine dans
// row[pathField] (nécessaire au remplacement/suppression du fichier).
// Sans fichier ou en cas d'échec de signature : row[field] = null, les
// templates retombent d'eux-mêmes sur leur fallback.
async function _resolve(rows, field, bucket, pathField) {
  const list = (Array.isArray(rows) ? rows : [rows]).filter(r => r && r[field]);
  if (!list.length) return;

  const cache = _cacheOf(bucket);
  const now = Date.now();
  const missing = new Set();

  for (const r of list) {
    const path = _toPath(r[field], bucket);
    r[pathField] = path;
    if (path) {
      const hit = cache.get(path);
      if (!hit || hit.exp < now) missing.add(path);
    }
  }

  if (missing.size) {
    try {
      const { data, error } = await db.storage.from(bucket)
        .createSignedUrls([...missing], EXPIRY);
      if (!error) (data || []).forEach(d => {
        const url = d.signedUrl || d.signedURL;
        if (url && d.path) cache.set(d.path, { url, exp: now + EXPIRY * 1000 - MARGE });
      });
    } catch (_) { /* hors ligne ou bucket indisponible : fallback des templates */ }
  }

  for (const r of list) {
    if (r[pathField]) r[field] = cache.get(r[pathField])?.url ?? null;
    // URL étrangère au bucket (pathField null) : laissée telle quelle
  }
}

function _randomName(file, prefix) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  return `${prefix}/${crypto.randomUUID()}.${ext}`;
}

/* ── Photos (résidents + avatars utilisateurs, même bucket) ───── */

export function resolvePhotos(rows, field = 'photo_url') {
  return _resolve(rows, field, BUCKET_PHOTOS, '_photo_path');
}

// prefix : 'residents' (défaut) ou 'users' (photo de profil).
// Nom de fichier aléatoire (UUID) : aucune information identifiante.
export async function uploadPhoto(file, prefix = 'residents') {
  const path = _randomName(file, prefix);
  const { error } = await db.storage.from(BUCKET_PHOTOS)
    .upload(path, file, { contentType: file.type || 'image/jpeg' });
  if (error) throw error;
  return path;
}

// Suppression silencieuse (remplacement ou retrait) : ne doit jamais
// bloquer l'enregistrement en cours.
export function removePhoto(path) {
  if (!path) return;
  db.storage.from(BUCKET_PHOTOS).remove([path]).then(() => {}, () => {});
}

/* ── Ordonnances (PDF/images, staff médical uniquement) ───────── */

export function resolveOrdonnances(rows, field = 'ordonnance_url') {
  return _resolve(rows, field, BUCKET_ORDONNANCES, '_ordonnance_path');
}

export async function uploadOrdonnance(file) {
  const path = _randomName(file, 'consultations');
  const { error } = await db.storage.from(BUCKET_ORDONNANCES)
    .upload(path, file, { contentType: file.type || 'application/pdf' });
  if (error) throw error;
  return path;
}

export function removeOrdonnance(path) {
  if (!path) return;
  db.storage.from(BUCKET_ORDONNANCES).remove([path]).then(() => {}, () => {});
}
