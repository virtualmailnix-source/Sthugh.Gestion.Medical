import { getLang } from './i18n.js';

// Locale d'affichage des dates, alignée sur la convention déjà en place
// dans le projet (panel_admin, anniversaires, traitements, script.js).
// i18n.js n'importe rien, aucun cycle possible.
export function locale() { return getLang() === 'en' ? 'en-MU' : 'fr-MU'; }

// Noms de mois et de jours dans la langue courante. Calculés à chaque appel :
// la langue peut changer sans recharger la page.
export function moisNoms() {
  const f = new Intl.DateTimeFormat(locale(), { month:'long' });
  return Array.from({ length:12 }, (_, m) => f.format(new Date(2021, m, 1)));
}

// Le 1er août 2021 est un dimanche : l'ordre correspond à Date.getDay().
export function joursNoms() {
  const f = new Intl.DateTimeFormat(locale(), { weekday:'short' });
  return Array.from({ length:7 }, (_, d) => f.format(new Date(2021, 7, 1 + d)));
}

export function formatDate(date, opts = {}) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  const {
    time = false,
    short = false,
    full = false
  } = opts;
  if (short) {
    return d.toLocaleDateString(locale(), { day:'2-digit', month:'2-digit', year:'numeric' });
  }
  if (full) {
    return d.toLocaleDateString(locale(), {
      weekday:'long', day:'numeric', month:'long', year:'numeric'
    });
  }
  let str = d.toLocaleDateString(locale(), { day:'numeric', month:'long', year:'numeric' });
  if (time) {
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    str += `${getLang() === 'fr' ? ' à ' : ' at '}${hh}:${mm}`;
  }
  return str;
}

export function formatTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}

export function formatCurrency(amount) {
  if (amount == null || amount === '') return '—';
  return new Intl.NumberFormat(locale(), {
    style: 'currency', currency: 'MUR',
    minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(amount);
}

export function calcAge(birthDate) {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function formatAge(birthDate) {
  const a = calcAge(birthDate);
  if (a === null) return '—';
  if (a === 0) {
    const months = Math.floor((new Date() - new Date(birthDate)) / (1000 * 60 * 60 * 24 * 30));
    return `${months} mois`;
  }
  return `${a} ans`;
}

export function initials(nom, prenom) {
  const n = (nom   || '').trim()[0] || '';
  const p = (prenom|| '').trim()[0] || '';
  return (n + p).toUpperCase() || '?';
}

export function fullName(nom, prenom) {
  return [prenom, nom].filter(Boolean).join(' ') || '—';
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth()    === db.getMonth()    &&
         da.getDate()     === db.getDate();
}

// Date au format YYYY-MM-DD dans le fuseau LOCAL.
// toISOString() convertit en UTC : à Maurice (UTC+4) cela recule de 4 h et
// renvoie la veille entre minuit et 4 h du matin, ou le mois précédent pour
// un 1er du mois. Ne jamais utiliser toISOString() pour une date calendaire.
export function ymdLocal(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.getFullYear() + '-'
       + String(d.getMonth() + 1).padStart(2, '0') + '-'
       + String(d.getDate()).padStart(2, '0');
}

export function todayISO() {
  return ymdLocal(new Date());
}

export function nowLocalInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,16);
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Lien téléphone cliquable : ne garde que chiffres et + ("+230 5XX…" → tel:+2305XX…)
export function telHref(tel) {
  return 'tel:' + String(tel || '').replace(/[^+\d]/g, '');
}

export function imcLabel(imc) {
  if (!imc) return { label: '—', cls: '' };
  if (imc < 18.5) return { label: 'Insuffisance pondérale', cls: 'badge-warning' };
  if (imc < 25)   return { label: 'Poids normal', cls: 'badge-success' };
  if (imc < 30)   return { label: 'Surpoids', cls: 'badge-warning' };
  return { label: 'Obésité', cls: 'badge-danger' };
}

export function statusBadge(statut) {
  const map = {
    paye:       { cls:'badge-paye',     label:'Payé' },
    en_attente: { cls:'badge-attente',  label:'En attente' },
    gratuit:    { cls:'badge-gratuit',  label:'Gratuit' },
    partiel:    { cls:'badge-partiel',  label:'Partiel' },
    planifie:   { cls:'badge-planifie', label:'Planifié' },
    confirme:   { cls:'badge-confirme', label:'Confirmé' },
    effectue:   { cls:'badge-effectue', label:'Effectué' },
    annule:     { cls:'badge-annule',   label:'Annulé' },
    absent:     { cls:'badge-absent',   label:'Absent' },
  };
  const s = map[statut] || { cls:'badge-teal', label: statut };
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}
