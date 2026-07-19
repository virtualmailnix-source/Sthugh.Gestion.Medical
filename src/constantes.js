// ── Relevés de constantes ───────────────────────────────────
//  Points 2 et 3 des MAJ du 19/07/2026, partie interface.
//  Le socle base est le SQL 30 : table `constantes` (relevés
//  libres, historique jamais écrasé) et `v_constantes_unifiees`
//  (relevés libres + constantes saisies en consultation).
//
//  Ce module est utilisé par le dossier résident et servira de
//  source aux courbes d'évolution (lot D).

import { db }                       from './supabase.js';
import { openModal, closeModal }    from '../script.js';
import { toastSuccess, toastError } from './toast.js';
import { formatDate, escapeHtml, nowLocalInput } from './utils.js';
import { t }                        from './i18n.js';

// Plages usuelles, pour AVERTIR seulement, jamais pour bloquer.
// La base ne pose aucune contrainte : le personnel doit pouvoir
// enregistrer une valeur inhabituelle si elle est réellement
// mesurée. Ces bornes sont larges à dessein.
export const PARAMETRES = [
  { cle:'poids',          i18n:'weight',   unite:'kg',   step:'.1', min:25,  max:200 },
  { cle:'pouls',          i18n:'pulse',    unite:'bpm',  step:'1',  min:40,  max:140 },
  { cle:'ta_systolique',  i18n:'bpSys',    unite:'mmHg', step:'1',  min:70,  max:220 },
  { cle:'ta_diastolique', i18n:'bpDia',    unite:'mmHg', step:'1',  min:40,  max:130 },
  { cle:'temperature',    i18n:'temp',     unite:'°C',   step:'.1', min:34,  max:42  },
  { cle:'saturation_o2',  i18n:'spo2',     unite:'%',    step:'.1', min:70,  max:100 },
  { cle:'glycemie',       i18n:'glucose',  unite:'mmol/L', step:'.1', min:2, max:25  },
];

// Format « 120/80 » de la tension saisie en consultation.
const RE_TENSION = /^\s*(\d{2,3})\s*\/\s*(\d{1,3})\s*$/;

// Valeurs hors plage usuelle d'un jeu de données saisi.
// Renvoie [{ i18n, valeur, unite, min, max }], plus une entrée de
// type 'format' pour une tension libre illisible.
export function valeursInhabituelles(data) {
  const anomalies = PARAMETRES.reduce((acc, p) => {
    const v = data[p.cle];
    if (v === undefined || v === null || v === '') return acc;
    const n = Number(v);
    if (Number.isNaN(n) || (n >= p.min && n <= p.max)) return acc;
    return acc.concat({ ...p, valeur: n });
  }, []);

  // Le formulaire de consultation saisit la tension en texte libre.
  // Une valeur illisible ne partira jamais dans les courbes
  // (v_constantes_unifiees la met à NULL) : autant le dire tout de suite.
  const ta = data.tension_arterielle;
  if (ta !== undefined && ta !== null && String(ta).trim() !== '') {
    const m = RE_TENSION.exec(String(ta));
    if (!m) {
      anomalies.push({ type:'format', i18n:'bp', valeur: String(ta) });
    } else {
      [['ta_systolique', +m[1]], ['ta_diastolique', +m[2]]].forEach(([cle, n]) => {
        const p = PARAMETRES.find(x => x.cle === cle);
        if (n < p.min || n > p.max) anomalies.push({ ...p, valeur: n });
      });
    }
  }

  return anomalies;
}

// Message d'avertissement lisible, une ligne par valeur.
export function messageAvertissement(anomalies) {
  return anomalies
    .map(a => a.type === 'format'
      ? `${t('constantes.' + a.i18n)} : « ${escapeHtml(a.valeur)} » ${t('constantes.badFormat')}`
      : `${t('constantes.' + a.i18n)} : ${a.valeur} ${a.unite} (${t('constantes.usualRange')} ${a.min} - ${a.max})`)
    .join('<br>');
}

// Encart d'avertissement à insérer dans un formulaire ouvert.
// Non bloquant : il informe, la sauvegarde reste possible.
export function encartAvertissement(anomalies) {
  return `
    <div style="background:var(--tint-amber-bg);border:1px solid var(--tint-amber-border);border-radius:var(--radius-sm);padding:.7rem .9rem;margin-bottom:.85rem;font-size:.85rem;color:var(--tint-amber-fg)">
      <div style="font-weight:700;margin-bottom:.3rem">
        <i class="bi bi-exclamation-triangle-fill"></i> ${t('constantes.unusualTitle')}
      </div>
      <div style="line-height:1.5">${messageAvertissement(anomalies)}</div>
      <div style="margin-top:.4rem;font-style:italic">${t('constantes.unusualConfirm')}</div>
    </div>`;
}

// Branche la validation douce sur un formulaire déjà ouvert.
// Le champ hors plage se teinte, et le premier clic sur
// « enregistrer » affiche l'encart au lieu de sauvegarder ; le
// second clic sauvegarde. La saisie n'est jamais refusée.
//   formId     : id du <form>
//   zoneAlerte : id du conteneur où insérer l'encart
//   onValider  : appelé quand la sauvegarde est confirmée
export function brancherValidationDouce(formId, zoneAlerte, onValider) {
  const form = document.getElementById(formId);
  if (!form) return () => onValider();

  let confirme = false;

  const relire = () => {
    const fd = new FormData(form);
    return Object.fromEntries([...fd.entries()]);
  };

  // Teinte du champ dès la frappe
  const teinter = (champ, hors, infobulle) => {
    champ.style.borderColor = hors ? 'var(--tint-amber-border)' : '';
    champ.title = hors ? infobulle : '';
    // Une valeur modifiée après confirmation doit être reconfirmée
    if (hors) confirme = false;
  };

  PARAMETRES.forEach(p => {
    const champ = form.querySelector(`[name="${p.cle}"]`);
    if (!champ) return;
    champ.addEventListener('input', () => {
      const v = champ.value;
      const n = Number(v);
      teinter(champ, v !== '' && !Number.isNaN(n) && (n < p.min || n > p.max),
        `${t('constantes.usualRange')} ${p.min} - ${p.max} ${p.unite}`);
    });
  });

  // Tension en texte libre (formulaire de consultation)
  const champTa = form.querySelector('[name="tension_arterielle"]');
  champTa?.addEventListener('input', () => {
    const v = champTa.value.trim();
    teinter(champTa, v !== '' && !RE_TENSION.test(v), t('constantes.badFormat'));
  });

  return function tenterSauvegarde() {
    const anomalies = valeursInhabituelles(relire());
    const zone = document.getElementById(zoneAlerte);

    if (!anomalies.length || confirme) {
      if (zone) zone.innerHTML = '';
      return onValider();
    }

    confirme = true;
    if (zone) {
      zone.innerHTML = encartAvertissement(anomalies);
      zone.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }
  };
}

// ── Formulaire de saisie d'un relevé ────────────────────────
// onSaved : rappel après enregistrement (rechargement du dossier)
export function openFormConstante(residentId, onSaved) {
  const champ = p => `
    <div class="form-group">
      <label class="form-label">${t('constantes.' + p.i18n)} (${p.unite})</label>
      <input class="form-control" type="number" step="${p.step}" name="${p.cle}">
    </div>`;

  const body = `
    <div id="const-alerte"></div>
    <form id="form-constante">
      <input type="hidden" name="resident_id" value="${escapeHtml(residentId)}">

      <div class="form-section">
        <div class="form-section-title"><i class="bi bi-clock-history"></i> ${t('constantes.secDate')}</div>
        <div class="form-group">
          <label class="form-label">${t('constantes.dateTime')}</label>
          <input class="form-control" type="datetime-local" name="date_releve" value="${nowLocalInput()}" required>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title"><i class="bi bi-activity"></i> ${t('constantes.secValues')}</div>
        <div class="form-row">
          ${PARAMETRES.filter(p => p.cle !== 'glycemie').map(champ).join('')}
        </div>
        <div class="form-row">
          ${PARAMETRES.filter(p => p.cle === 'glycemie').map(champ).join('')}
        </div>
        <div style="font-size:.82rem;color:var(--text-light)">
          <i class="bi bi-info-circle"></i> ${t('constantes.partialNote')}
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title"><i class="bi bi-journal-text"></i> ${t('common.notes')}</div>
        <div class="form-group">
          <textarea class="form-control" name="notes" rows="2"></textarea>
        </div>
      </div>
    </form>`;

  openModal(
    `<i class="bi bi-heart-pulse-fill"></i> ${t('constantes.formTitleNew')}`,
    body,
    [
      { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
      { label: t('common.save'),   cls:'btn btn-primary',   action: () => sauvegarder() }
    ], 'modal-lg'
  );

  const sauvegarder = brancherValidationDouce('form-constante', 'const-alerte', () => _submitConstante(onSaved));
}

async function _submitConstante(onSaved) {
  const form = document.getElementById('form-constante');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const fd   = new FormData(form);
  const data = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));

  // Un relevé sans aucune mesure n'a pas d'intérêt
  const mesures = PARAMETRES.filter(p => data[p.cle] !== undefined);
  if (!mesures.length) { toastError(t('constantes.emptyForm')); return; }

  // Un datetime-local n'a pas de fuseau : envoyé tel quel, Postgres
  // l'interpréterait en UTC et daterait le relevé 4 h trop tôt.
  // Ici toISOString est le bon outil : on convertit un INSTANT, pas
  // une date calendaire (voir la règle sur ymdLocal dans utils.js).
  if (data.date_releve) data.date_releve = new Date(data.date_releve).toISOString();

  const { error } = await db.from('constantes').insert(data);
  if (error) { toastError(error.message); return; }

  toastSuccess(t('constantes.saved'));
  closeModal();
  onSaved?.();
}

// ── Historique dans le dossier résident ─────────────────────
// rows : lignes de v_constantes_unifiees, triées du plus récent.
// Le tableau n'affiche que les plus récentes ; la profondeur
// complète reste chargée pour les courbes.
const MAX_LIGNES_TABLEAU = 30;

export function constantesPaneHTML(rows) {
  if (!rows.length) {
    return `<div class="empty-state"><i class="bi bi-heart-pulse"></i><p>${t('constantes.none')}</p></div>`;
  }

  const total   = rows.length;
  const affiche = rows.slice(0, MAX_LIGNES_TABLEAU);

  const tension = r => (r.ta_systolique && r.ta_diastolique)
    ? `${r.ta_systolique}/${r.ta_diastolique}` : '—';

  // Une valeur hors plage est signalée à la lecture aussi : c'est
  // là que le personnel repère une saisie ancienne à corriger.
  const marque = (cle, valeur) => {
    if (valeur === null || valeur === undefined || valeur === '') return '—';
    const p = PARAMETRES.find(x => x.cle === cle);
    const n = Number(valeur);
    if (!p || Number.isNaN(n) || (n >= p.min && n <= p.max)) return valeur;
    return `<span style="color:var(--tint-amber-fg);font-weight:700" title="${t('constantes.usualRange')} ${p.min} - ${p.max} ${p.unite}">${valeur} <i class="bi bi-exclamation-triangle-fill" style="font-size:.7rem"></i></span>`;
  };

  return `
    <div class="table-wrap"><table class="table" style="font-size:.82rem">
      <thead><tr>
        <th>${t('constantes.colDate')}</th>
        <th>${t('constantes.colSource')}</th>
        <th>${t('constantes.bpShort')}</th>
        <th>${t('constantes.pulseShort')}</th>
        <th>${t('constantes.tempShort')}</th>
        <th>${t('constantes.spo2Short')}</th>
        <th>${t('constantes.weightShort')}</th>
        <th>${t('constantes.glucoseShort')}</th>
      </tr></thead>
      <tbody>
        ${affiche.map(r => `<tr>
          <td style="white-space:nowrap">${formatDate(r.date_releve, { time:true })}</td>
          <td>${r.source === 'consultation'
            // Même famille de badge que le relevé (pilule pleine), pas un
            // badge de statut : c'est une catégorie, pas un état. Bleu
            // plutôt qu'ambre, qui signale déjà les valeurs hors plage.
            ? `<span class="badge" style="font-size:.66rem;border-left:none;padding:.2rem .55rem;background:var(--tint-blue-bg);color:var(--tint-blue-fg)">${t('constantes.srcConsult')}</span>`
            : `<span class="badge badge-teal" style="font-size:.66rem">${t('constantes.srcReleve')}</span>`}</td>
          <td>${tension(r)}</td>
          <td>${marque('pouls', r.pouls)}</td>
          <td>${marque('temperature', r.temperature)}</td>
          <td>${marque('saturation_o2', r.saturation_o2)}</td>
          <td>${marque('poids', r.poids)}</td>
          <td>${marque('glycemie', r.glycemie)}</td>
        </tr>${r.notes ? `<tr><td colspan="8" style="color:var(--text-light);font-style:italic;padding-top:0;border-top:none">${escapeHtml(r.notes)}</td></tr>` : ''}`).join('')}
      </tbody>
    </table></div>
    <div style="font-size:.78rem;color:var(--text-light);margin-top:.6rem">
      ${total > affiche.length
        ? `<div style="margin-bottom:.3rem"><i class="bi bi-list-ul"></i> ${affiche.length} ${t('constantes.tableTruncated')} ${total}.</div>`
        : ''}
      <i class="bi bi-info-circle"></i> ${t('constantes.unitsNote')}
    </div>`;
}

// Dernières valeurs connues, pour l'en-tête du dossier.
// Chaque paramètre est cherché indépendamment : un relevé partiel
// ne masque pas une mesure plus ancienne mais complète.
export function dernieresValeurs(rows) {
  const out = {};
  PARAMETRES.forEach(p => {
    const ligne = rows.find(r => r[p.cle] !== null && r[p.cle] !== undefined);
    if (ligne) out[p.cle] = { valeur: ligne[p.cle], date: ligne.date_releve };
  });
  return out;
}

// ── Courbes d'évolution (point 9) ───────────────────────────
//  Chart.js 4.4.0, déjà chargé par index.html et utilisé par la
//  page Statistiques. L'échelle de l'axe X est de type 'category',
//  pas 'time' : l'adaptateur de dates de Chart.js n'est pas chargé
//  et une échelle temporelle échouerait silencieusement.

// La tension est tracée en deux séries, comme sur un relevé papier.
const COURBES = [
  { id:'tension',       cles:['ta_systolique','ta_diastolique'], i18n:'bp',      unite:'mmHg',   couleurs:['#dc2626','#2563eb'] },
  { id:'pouls',         cles:['pouls'],                          i18n:'pulse',   unite:'bpm',    couleurs:['#124848'] },
  { id:'temperature',   cles:['temperature'],                    i18n:'temp',    unite:'°C',     couleurs:['#d97706'] },
  { id:'saturation_o2', cles:['saturation_o2'],                  i18n:'spo2',    unite:'%',      couleurs:['#0891b2'] },
  { id:'poids',         cles:['poids'],                          i18n:'weight',  unite:'kg',     couleurs:['#16a34a'] },
  { id:'glycemie',      cles:['glycemie'],                       i18n:'glucose', unite:'mmol/L', couleurs:['#7c3aed'] },
];

const PERIODES = [
  { id:'90',  i18n:'days90' },
  { id:'365', i18n:'year1' },
  { id:'0',   i18n:'periodAll' },
];

let _chartEvolution = null;

export function detruireCourbe() {
  _chartEvolution?.destroy();
  _chartEvolution = null;
}

export function courbeHTML() {
  return `
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:flex-end;margin-bottom:.85rem">
      <div class="form-group" style="margin:0;min-width:170px">
        <label class="form-label" style="font-size:.78rem">${t('constantes.chartParam')}</label>
        <select class="form-control" id="courbe-param">
          ${COURBES.map(c => `<option value="${c.id}">${t('constantes.' + c.i18n)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin:0;min-width:140px">
        <label class="form-label" style="font-size:.78rem">${t('constantes.chartPeriod')}</label>
        <select class="form-control" id="courbe-periode">
          ${PERIODES.map(p => `<option value="${p.id}">${t('constantes.' + p.i18n)}</option>`).join('')}
        </select>
      </div>
      <label style="display:flex;align-items:center;gap:.4rem;font-size:.82rem;padding-bottom:.55rem;cursor:pointer">
        <input type="checkbox" id="courbe-filtre" checked>
        ${t('constantes.chartHideOutliers')}
      </label>
    </div>
    <div class="chart-container" id="courbe-zone"><canvas id="courbe-constantes"></canvas></div>
    <div id="courbe-note" style="font-size:.78rem;color:var(--text-light);margin-top:.5rem"></div>`;
}

// rows : lignes de v_constantes_unifiees, du plus récent au plus ancien.
// Appelée à l'ouverture de l'onglet, quand le canvas a enfin une
// taille : Chart.js mesure mal un conteneur encore masqué.
export function initCourbe(rows) {
  if (!document.getElementById('courbe-constantes')) return;

  const redessiner = () => _dessinerCourbe(rows);
  ['courbe-param', 'courbe-periode', 'courbe-filtre'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.onchange = redessiner;
  });
  redessiner();
}

function _dessinerCourbe(rows) {
  const canvas = document.getElementById('courbe-constantes');
  const note   = document.getElementById('courbe-note');
  const zone   = document.getElementById('courbe-zone');
  if (!canvas || !window.Chart) return;

  detruireCourbe();

  const courbe   = COURBES.find(c => c.id === document.getElementById('courbe-param')?.value) || COURBES[0];
  const jours    = +(document.getElementById('courbe-periode')?.value || 0);
  const filtrer  = document.getElementById('courbe-filtre')?.checked !== false;

  // Du plus ancien au plus récent : une courbe se lit dans le sens
  // du temps, la liste arrive dans l'ordre inverse.
  let points = [...rows].reverse();

  if (jours > 0) {
    const depuis = Date.now() - jours * 86400000;
    points = points.filter(r => new Date(r.date_releve).getTime() >= depuis);
  }

  // Une ligne n'entre dans la courbe que si elle porte au moins une
  // des mesures tracées : un relevé partiel ne crée pas de trou.
  points = points.filter(r => courbe.cles.some(c => r[c] !== null && r[c] !== undefined));

  // Les valeurs aberrantes déjà en base (saturation 545 %, pouls 454)
  // écraseraient l'échelle et rendraient la courbe illisible. Elles
  // sont écartées par défaut, jamais supprimées : le compte est
  // annoncé sous le graphique et le tableau continue de les montrer.
  let exclus = 0;
  if (filtrer) {
    const avant = points.length;
    points = points.filter(r => courbe.cles.every(c => {
      const v = r[c];
      if (v === null || v === undefined) return true;
      const p = PARAMETRES.find(x => x.cle === c);
      return !p || (Number(v) >= p.min && Number(v) <= p.max);
    }));
    exclus = avant - points.length;
  }

  const messages = [];
  if (exclus) messages.push(`${exclus} ${t('constantes.chartExcluded')}`);

  if (points.length < 2) {
    if (zone) zone.style.display = 'none';
    if (note) note.innerHTML = `<i class="bi bi-info-circle"></i> ${t('constantes.chartNotEnough')}`
      + (messages.length ? ' ' + messages.join(' ') : '');
    return;
  }
  if (zone) zone.style.display = '';

  const encre  = getComputedStyle(document.body).getPropertyValue('--text-mid').trim() || '#666';
  const grille = getComputedStyle(document.body).getPropertyValue('--card-border').trim() || '#ddd';

  _chartEvolution = new window.Chart(canvas, {
    type:'line',
    data:{
      labels: points.map(r => formatDate(r.date_releve)),
      datasets: courbe.cles.map((cle, i) => ({
        label: t('constantes.' + (courbe.cles.length > 1 ? (cle === 'ta_systolique' ? 'bpSys' : 'bpDia') : courbe.i18n)),
        // null laisse un trou : Chart.js relie les points connus
        data: points.map(r => (r[cle] === null || r[cle] === undefined) ? null : Number(r[cle])),
        borderColor: courbe.couleurs[i],
        backgroundColor: courbe.couleurs[i],
        borderWidth: 2,
        pointRadius: 3,
        tension: .25,
        spanGaps: true,
      }))
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ display: courbe.cles.length > 1, position:'bottom', labels:{ color:encre, font:{ size:11 } } },
        tooltip:{ callbacks:{ label: c => `${c.dataset.label} : ${c.parsed.y} ${courbe.unite}` } }
      },
      scales:{
        y:{ ticks:{ color:encre }, grid:{ color:grille }, title:{ display:true, text:courbe.unite, color:encre } },
        x:{ ticks:{ color:encre, maxRotation:45, autoSkip:true, maxTicksLimit:12 }, grid:{ display:false } }
      }
    }
  });

  messages.unshift(`${points.length} ${t('constantes.chartPoints')}`);
  if (note) note.innerHTML = `<i class="bi bi-info-circle"></i> ${messages.join(' &bull; ')}`;
}
