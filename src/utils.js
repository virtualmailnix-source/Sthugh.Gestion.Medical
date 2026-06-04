export const MOIS_FR = [
  'janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre'
];

export const JOURS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

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
    return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
  }
  if (full) {
    return d.toLocaleDateString('fr-FR', {
      weekday:'long', day:'numeric', month:'long', year:'numeric'
    });
  }
  const day  = d.getDate();
  const mon  = MOIS_FR[d.getMonth()];
  const year = d.getFullYear();
  let str = `${day} ${mon} ${year}`;
  if (time) {
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    str += ` à ${hh}:${mm}`;
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
  return new Intl.NumberFormat('fr-MU', {
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

export function todayISO() {
  return new Date().toISOString().slice(0,10);
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
