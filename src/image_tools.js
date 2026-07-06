import { t } from './i18n.js';

// Préparation des images avant upload (photos résidents et photos de
// profil - les ordonnances ne passent PAS par ici) :
//  - dialogue de RECADRAGE : cadre déplaçable et redimensionnable par
//    les poignées d'angle, plein cadre par défaut (valider sans toucher
//    ne recadre pas) ;
//  - compression automatique dès que le fichier dépasse 2 Mo, avec
//    garantie de sortie sous ce seuil (baisse de qualité puis d'échelle) ;
//  - PNG recodé en JPEG lors d'un recodage (fond blanc) ;
//  - image intacte si < 2 Mo et non recadrée.
// Le dialogue a son propre overlay (z-index au-dessus de la modale
// partagée) : il peut s'ouvrir par-dessus le formulaire résident.

const MAX_BYTES = 2 * 1024 * 1024;  // seuil de compression automatique
const QUALITY   = 0.85;             // qualité de départ des recodages
const MIN_SEL   = 24;               // taille mini du cadre (px affichés)

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

// Recode la zone recadrée (coordonnées naturelles) à l'échelle donnée.
// JPEG/WebP conservent leur format, tout le reste (PNG inclus) devient
// du JPEG aplati sur fond blanc.
function _encode(img, crop, scale, srcType, quality) {
  const type = srcType === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const w = Math.max(1, Math.round(crop.w * scale));
  const h = Math.max(1, Math.round(crop.h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  return new Promise(resolve => canvas.toBlob(b => resolve({ blob: b, type }), type, quality));
}

// Compression garantie sous MAX_BYTES : qualité dégressive puis échelle.
async function _encodeUnderLimit(img, crop, srcType) {
  let quality = QUALITY, scale = 1, out = await _encode(img, crop, scale, srcType, quality);
  for (let i = 0; out.blob && out.blob.size > MAX_BYTES && i < 12; i++) {
    if (quality > 0.6) quality -= 0.1; else scale *= 0.85;
    out = await _encode(img, crop, scale, srcType, quality);
  }
  return out;
}

function _dialogHTML(file) {
  const isPng = file.type === 'image/png';
  const tooBig = file.size > MAX_BYTES;
  return `
  <div class="imgedit-box">
    <div class="imgedit-head">
      <i class="bi bi-crop"></i> ${t('imgedit.title')}
    </div>
    <div class="imgedit-preview">
      <div class="imgedit-stage">
        <img id="imgedit-img" alt="" draggable="false">
        <div class="imgedit-crop" id="imgedit-crop">
          <span class="imgedit-h imgedit-h-nw" data-h="nw"></span>
          <span class="imgedit-h imgedit-h-ne" data-h="ne"></span>
          <span class="imgedit-h imgedit-h-sw" data-h="sw"></span>
          <span class="imgedit-h imgedit-h-se" data-h="se"></span>
        </div>
      </div>
    </div>
    <div class="imgedit-controls">
      <div class="imgedit-hint">
        <span>${t('imgedit.cropHint')}</span>
        <button type="button" class="imgedit-reset" id="imgedit-reset">${t('imgedit.reset')}</button>
      </div>
      <div class="imgedit-meta">
        <span id="imgedit-dim"></span>
        <span id="imgedit-size"></span>
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
    overlay.innerHTML = _dialogHTML(file);
    document.body.appendChild(overlay);

    const imgEl  = overlay.querySelector('#imgedit-img');
    const cropEl = overlay.querySelector('#imgedit-crop');
    const dimEl  = overlay.querySelector('#imgedit-dim');
    const sizeEl = overlay.querySelector('#imgedit-size');
    imgEl.src = url;

    // Cadre de sélection en pixels AFFICHÉS ; plein cadre par défaut
    let sel = { x: 0, y: 0, w: 0, h: 0 };
    let stageW = 0, stageH = 0;

    function isFullFrame() {
      return sel.x <= 1 && sel.y <= 1 && sel.w >= stageW - 2 && sel.h >= stageH - 2;
    }
    // Sélection -> zone en pixels naturels de l'image
    function selToNatural() {
      const r = img.naturalWidth / stageW;
      return {
        x: Math.max(0, Math.round(sel.x * r)),
        y: Math.max(0, Math.round(sel.y * r)),
        w: Math.min(img.naturalWidth,  Math.max(1, Math.round(sel.w * r))),
        h: Math.min(img.naturalHeight, Math.max(1, Math.round(sel.h * r))),
      };
    }
    function drawSel() {
      cropEl.style.left   = sel.x + 'px';
      cropEl.style.top    = sel.y + 'px';
      cropEl.style.width  = sel.w + 'px';
      cropEl.style.height = sel.h + 'px';
      const nat = selToNatural();
      dimEl.textContent = `${nat.w} × ${nat.h} px`;
    }

    // Estimation de la taille finale (encodage réel, anti-course)
    let estTimer = null, estSeq = 0;
    async function refreshEstimate() {
      if (isFullFrame() && file.size <= MAX_BYTES) {
        // Fichier gardé tel quel : sa vraie taille, sans encodage
        sizeEl.textContent = `${t('imgedit.final')} : ${_fmtSize(file.size)}`;
        return;
      }
      sizeEl.textContent = t('imgedit.estimating');
      const seq = ++estSeq;
      const { blob } = await _encodeUnderLimit(img, selToNatural(), file.type);
      if (seq !== estSeq) return;                      // un réglage plus récent existe
      if (blob) sizeEl.textContent = `${t('imgedit.final')} : ${_fmtSize(blob.size)}`;
    }
    function queueEstimate() {
      clearTimeout(estTimer);
      estTimer = setTimeout(refreshEstimate, 250);
    }

    // Le cadre n'est posé qu'une fois l'aperçu chargé ET mis en page
    // (clientWidth vaut 0 avant)
    function initSel() {
      requestAnimationFrame(() => {
        stageW = imgEl.clientWidth;
        stageH = imgEl.clientHeight;
        sel = { x: 0, y: 0, w: stageW, h: stageH };
        drawSel();
        refreshEstimate();
      });
    }
    if (imgEl.complete && imgEl.naturalWidth) initSel();
    else imgEl.onload = initSel;

    // Déplacement (intérieur du cadre) et redimensionnement (poignées)
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    let drag = null;
    cropEl.addEventListener('pointerdown', e => {
      drag = { mode: e.target.dataset.h || 'move', sx: e.clientX, sy: e.clientY, o: { ...sel } };
      e.preventDefault();
    });
    function onMove(e) {
      if (!drag) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      const o = drag.o, m = drag.mode;
      if (m === 'move') {
        sel.x = clamp(o.x + dx, 0, stageW - o.w);
        sel.y = clamp(o.y + dy, 0, stageH - o.h);
      } else {
        // Bords opposés fixes, bord(s) saisi(s) mobiles
        let x1 = o.x, y1 = o.y, x2 = o.x + o.w, y2 = o.y + o.h;
        if (m.includes('w')) x1 = clamp(o.x + dx, 0, x2 - MIN_SEL);
        if (m.includes('e')) x2 = clamp(o.x + o.w + dx, x1 + MIN_SEL, stageW);
        if (m.includes('n')) y1 = clamp(o.y + dy, 0, y2 - MIN_SEL);
        if (m.includes('s')) y2 = clamp(o.y + o.h + dy, y1 + MIN_SEL, stageH);
        sel = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
      }
      drawSel();
    }
    function onUp() {
      if (!drag) return;
      drag = null;
      queueEstimate();
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    overlay.querySelector('#imgedit-reset').addEventListener('click', () => {
      sel = { x: 0, y: 0, w: stageW, h: stageH };
      drawSel();
      queueEstimate();
    });

    function done(result) {
      clearTimeout(estTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
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
      // Image légère et non recadrée : aucune perte, fichier d'origine
      if (isFullFrame() && file.size <= MAX_BYTES) { done(file); return; }
      const { blob, type } = await _encodeUnderLimit(img, selToNatural(), file.type);
      if (!blob) { done(file); return; }
      const ext  = type === 'image/webp' ? 'webp' : 'jpg';
      const base = (file.name.replace(/\.[^.]+$/, '') || 'photo');
      done(new File([blob], `${base}.${ext}`, { type }));
    });
  });
}
