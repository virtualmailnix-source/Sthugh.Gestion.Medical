import { db } from './supabase.js';

// Photos résidents : le bucket est privé (SQL 25), la base ne stocke
// que le chemin du fichier. Ce module convertit les chemins en URLs
// signées temporaires, par lot (un seul appel réseau par page) et
// avec un cache commun à toutes les pages.

const BUCKET = 'photos-residents';
const EXPIRY = 3600;             // durée de vie d'une URL signée (secondes)
const MARGE  = 600 * 1000;       // renouvelée 10 min avant expiration
const _cache = new Map();        // chemin -> { url, exp }

// Valeur historique (URL publique complète) ou actuelle (chemin) -> chemin.
// Renvoie null pour une URL étrangère au bucket.
function _toPath(v) {
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) return v;
  const m = String(v).match(/\/storage\/v1\/object\/(?:public|sign)\/photos-residents\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Remplace, sur chaque ligne, row[field] (chemin ou ancienne URL publique)
// par une URL signée prête pour <img src>. Conserve le chemin d'origine
// dans row._photo_path (nécessaire au remplacement/suppression du fichier).
// Sans photo ou en cas d'échec de signature : row[field] = null, les
// templates retombent d'eux-mêmes sur les initiales.
export async function resolvePhotos(rows, field = 'photo_url') {
  const list = (Array.isArray(rows) ? rows : [rows]).filter(r => r && r[field]);
  if (!list.length) return;

  const now = Date.now();
  const missing = new Set();

  for (const r of list) {
    const path = _toPath(r[field]);
    r._photo_path = path;
    if (path) {
      const hit = _cache.get(path);
      if (!hit || hit.exp < now) missing.add(path);
    }
  }

  if (missing.size) {
    try {
      const { data, error } = await db.storage.from(BUCKET)
        .createSignedUrls([...missing], EXPIRY);
      if (!error) (data || []).forEach(d => {
        const url = d.signedUrl || d.signedURL;
        if (url && d.path) _cache.set(d.path, { url, exp: now + EXPIRY * 1000 - MARGE });
      });
    } catch (_) { /* hors ligne ou bucket indisponible : fallback initiales */ }
  }

  for (const r of list) {
    if (r._photo_path) r[field] = _cache.get(r._photo_path)?.url ?? null;
    // URL étrangère au bucket (_photo_path null) : laissée telle quelle
  }
}

// Upload d'une nouvelle photo : nom de fichier aléatoire (UUID), aucune
// information identifiante dans le chemin. Renvoie le chemin à stocker.
export async function uploadPhoto(file) {
  const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `residents/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg' });
  if (error) throw error;
  return path;
}

// Suppression silencieuse (remplacement ou retrait de photo) : ne doit
// jamais bloquer l'enregistrement du résident.
export function removePhoto(path) {
  if (!path) return;
  db.storage.from(BUCKET).remove([path]).then(() => {}, () => {});
}
