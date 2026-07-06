import { t } from './i18n.js';

// Préparation des images avant upload (photos résidents et photos de
// profil - les ordonnances ne passent PAS par ici) :
//  - dialogue de redimensionnement (curseur d'échelle, taille estimée
//    en direct) ;
//  - compression automatique dès que le fichier dépasse 2 Mo, avec
//    garantie de sortie sous ce seuil (baisse de qualité puis d'échelle) ;
//  - PNG recodé en JPEG lors d'une compression (fond blanc).
// Le dialogue a son propre overlay (z-index au-dessus de la modale
// partagée) : il peut s'ouvrir par-dessus le formulaire résident.

const MAX_BYTES = 2 * 1024 * 1024;  // seuil de compression automatique
const QUALITY   = 0.85;             // qualité de départ des recodages

function _fmtSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' Mo';
  return Math.max(1, Math.round(bytes / 1024)) + ' Ko';
}

function _loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image illisible')); };
    img.src = url;
  });
}

// Recode l'image à l'échelle demandée. JPEG/WebP conservent leur format,
// tout le reste (PNG inclus) devient du JPEG aplati sur fond blanc.
function _encode(img, scale, srcType, quality) {
  const type = srcType === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const w = Math.max(1, Math.round(img.naturalWidth  * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise(resolve => canvas.toBlob(b => resolve({ blob: b, w, h, type }), type, quality));
}

// Compression garantie sous MAX_BYTES : qualité dégressive puis échelle.
async function _encodeUnderLimit(img, scale, srcType) {
  let quality = QUALITY, s = scale, out = await _encode(img, s, srcType, quality);
  for (let i = 0; out.blob && out.blob.size > MAX_BYTES && i < 12; i++) {
    if (quality > 0.6) quality -= 0.1; else s *= 0.85;
    out = await _encode(img, s, srcType, quality);
  }
  return out;
}

function _dialogHTML(file, img) {
  const isPng = file.type === 'image/png';
  const tooBig = file.size > MAX_BYTES;
  return `
  <div class="imgedit-box">
    <div class="imgedit-head">
      <i class="bi bi-aspect-ratio"></i> ${t('imgedit.title')}
    </div>
    <div class="imgedit-preview"><img id="imgedit-img" alt=""></div>
    <div class="imgedit-controls">
      <label class="form-label" for="imgedit-range">${t('imgedit.resize')}
        <span id="imgedit-dim">${img.naturalWidth} × ${img.naturalHeight} px</span>
      </label>
      <input type="range" id="imgedit-range" min="10" max="100" step="5" value="100">
      <div class="imgedit-meta">
        <span>${t('imgedit.original')} : ${_fmtSize(file.size)}</span>
        <span id="imgedit-size">${t('imgedit.estimating')}</span>
      </div>
      ${tooBig ? `<div class="imgedit-note"><i class="bi bi-info-circle"></i> ${t('imgedit.autoNote')}${isPng ? ' ' + t('imgedit.pngNote') : ''}</div>` : ''}
    </div>
    <div class="imgedit-foot">
      <button type="button" class="btn btn-secondary" id="imgedit-cancel">${t('common.cancel')}</button>
      <button type="button" class="btn btn-primary"   id="imgedit-ok">${t('imgedit.apply')}</button>
    </div>
  </div>`;
}

// Ouvre le dialogue et rend le fichier prêt à uploader (< 2 Mo garanti),
// ou null si l'utilisateur annule. En cas d'image illisible, le fichier
// d'origine est rendu tel quel (le navire ne doit pas couler pour ça).
export async function prepareImage(file) {
  if (!file || !String(file.type).startsWith('image/')) return file;

  let loaded;
  try { loaded = await _loadImage(file); }
  catch (_) { return file; }
  const { img, url } = loaded;

  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'imgedit-overlay';
    overlay.innerHTML = _dialogHTML(file, img);
    document.body.appendChild(overlay);
    overlay.querySelector('#imgedit-img').src = url;

    const range  = overlay.querySelector('#imgedit-range');
    const dimEl  = overlay.querySelector('#imgedit-dim');
    const sizeEl = overlay.querySelector('#imgedit-size');

    // Estimation de la taille finale, recalculée après chaque réglage
    // (petit délai pour ne pas encoder à chaque cran du curseur)
    let estTimer = null, estSeq = 0;
    async function refreshEstimate() {
      const scale = range.value / 100;
      dimEl.textContent =
        `${Math.round(img.naturalWidth * scale)} × ${Math.round(img.naturalHeight * scale)} px`;
      if (scale === 1 && file.size <= MAX_BYTES) {
        // Fichier gardé tel quel : sa vraie taille, sans encodage
        sizeEl.textContent = `${t('imgedit.final')} : ${_fmtSize(file.size)}`;
        return;
      }
      sizeEl.textContent = t('imgedit.estimating');
      const seq = ++estSeq;
      const { blob } = await _encodeUnderLimit(img, scale, file.type);
      if (seq !== estSeq) return;                      // un réglage plus récent existe
      if (blob) sizeEl.textContent = `${t('imgedit.final')} : ${_fmtSize(blob.size)}`;
    }
    range.addEventListener('input', () => {
      clearTimeout(estTimer);
      estTimer = setTimeout(refreshEstimate, 250);
    });
    refreshEstimate();

    function done(result) {
      clearTimeout(estTimer);
      document.removeEventListener('keydown', onKey, true);
      URL.revokeObjectURL(url);
      overlay.remove();
      resolve(result);
    }

    // Échap ferme l'éditeur SANS atteindre le listener global de
    // script.js (sinon la modale résident en dessous se fermerait aussi)
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); done(null); }
    }
    document.addEventListener('keydown', onKey, true);
    overlay.addEventListener('click', e => { if (e.target === overlay) done(null); });
    overlay.querySelector('#imgedit-cancel').addEventListener('click', () => done(null));

    overlay.querySelector('#imgedit-ok').addEventListener('click', async () => {
      const scale = range.value / 100;
      // Image légère et non retouchée : aucune perte, fichier d'origine
      if (scale === 1 && file.size <= MAX_BYTES) { done(file); return; }
      const { blob, type } = await _encodeUnderLimit(img, scale, file.type);
      if (!blob) { done(file); return; }
      const ext  = type === 'image/webp' ? 'webp' : 'jpg';
      const base = (file.name.replace(/\.[^.]+$/, '') || 'photo');
      done(new File([blob], `${base}.${ext}`, { type }));
    });
  });
}
