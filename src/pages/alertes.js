import { db }   from '../supabase.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatDate } from '../utils.js';
import { t } from '../i18n.js';

// ── Vues par type d'alerte ──────────────────────────────────
const TYPE_VIEWS = {
  all:      { types: null,                                          icon: 'bi-bell-fill',                 labelKey: 'alerts.tabAll' },
  meds:     { types: ['medicament_24h','medicament_epuise'],        icon: 'bi-capsule-pill',              labelKey: 'alerts.tabMeds' },
  visites:  { types: ['visite_requise','rdv_manque','pas_vu_30j'],  icon: 'bi-calendar-check',            labelKey: 'alerts.tabVisits' },
  urgences: { types: ['urgence'],                                   icon: 'bi-exclamation-octagon-fill',  labelKey: 'alerts.tabUrgences' },
  bday:     { types: ['anniversaire'],                              icon: 'bi-balloon-heart-fill',        labelKey: 'alerts.tabBday' },
  autres:   { types: ['autre'],                                     icon: 'bi-info-circle-fill',          labelKey: 'alerts.tabOther' },
};

const ICONS = {
  'medicament_24h':'bi-capsule-pill',
  'medicament_epuise':'bi-capsule-pill',
  'visite_requise':'bi-calendar-check',
  'rdv_manque':'bi-calendar-x',
  'pas_vu_30j':'bi-person-x-fill',
  'urgence':'bi-exclamation-octagon-fill',
  'anniversaire':'bi-balloon-heart-fill',
  'autre':'bi-info-circle-fill',
};

const TYPE_LABEL_KEYS = {
  'medicament_24h':'alerts.typeMed24h',
  'medicament_epuise':'alerts.typeMedOut',
  'visite_requise':'alerts.typeVisitReq',
  'rdv_manque':'alerts.typeRdvMiss',
  'pas_vu_30j':'alerts.typeNotSeen',
  'urgence':'alerts.typeUrgent',
  'anniversaire':'alerts.typeAnniversaire',
  'autre':'alerts.typeOther',
};

let _view = 'all', _etat = 'nonlues';

export async function renderAlertes(container) {
  _view = 'all'; _etat = 'nonlues';

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('alerts.title')}</h2>
        <span class="sub">${t('alerts.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-gen-alertes">
          <i class="bi bi-arrow-clockwise"></i> ${t('alerts.generateAlerts')}
        </button>
        <button class="btn btn-primary" id="btn-tout-lire">
          <i class="bi bi-check2-all"></i> ${t('alerts.markAllRead')}
        </button>
      </div>
    </div>

    <div class="tabs" id="alertes-tabs" style="margin-bottom:.75rem">
      ${Object.entries(TYPE_VIEWS).map(([k, v]) => `
        <button class="tab-btn ${k === 'all' ? 'active' : ''}" data-view="${k}">
          <i class="bi ${v.icon}"></i> ${t(v.labelKey)}
          <span class="alert-tab-count" data-count="${k}" style="display:none;margin-left:.3rem;font-size:.72rem;font-weight:700;background:#dc2626;color:#fff;border-radius:8px;padding:0 .38rem"></span>
        </button>`).join('')}
    </div>

    <div class="filter-bar">
      <div class="filter-chips">
        <button class="chip active" data-f="nonlues">${t('alerts.filterUnread')}</button>
        <button class="chip" data-f="all">${t('alerts.filterAll')}</button>
        <button class="chip" data-f="traitees">${t('alerts.filterTreated')}</button>
      </div>
    </div>

    <div id="alertes-list"></div>`;

  document.getElementById('btn-gen-alertes')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    btn.disabled = true;
    // Génère les alertes médicaments ET anniversaires
    const [rMed, rBday] = await Promise.all([
      db.rpc('fn_generer_alertes_medicaments'),
      db.rpc('fn_generer_alertes_anniversaires'),
    ]);
    btn.disabled = false;
    if (rMed.error && rBday.error) { toastError('Erreur génération alertes'); return; }
    if (rMed.error)  console.warn('Alertes médicaments:', rMed.error);
    if (rBday.error) console.warn('Alertes anniversaires:', rBday.error);
    toastSuccess(t('alerts.generated'));
    _load();
    _updateBadge();
  });

  document.getElementById('btn-tout-lire')?.addEventListener('click', async () => {
    await db.from('alertes').update({ lue:true }).eq('lue',false);
    toastSuccess(t('alerts.allMarkedRead'));
    _load();
    _updateBadge();
  });

  document.getElementById('alertes-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn[data-view]');
    if (!btn) return;
    document.querySelectorAll('#alertes-tabs .tab-btn').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    _view = btn.dataset.view;
    _load();
  });

  document.querySelectorAll('.chip[data-f]').forEach(c =>
    c.addEventListener('click', e => {
      document.querySelectorAll('.chip[data-f]').forEach(x => x.classList.remove('active'));
      e.target.classList.add('active');
      _etat = e.target.dataset.f;
      _load();
    })
  );

  // Délégation d'actions — attachée UNE SEULE fois (l'élément est recréé à chaque render de page)
  document.getElementById('alertes-list')?.addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'lire') {
      await db.from('alertes').update({ lue:true }).eq('id',id);
      toastSuccess(t('alerts.markedRead'));
    }
    if (btn.dataset.action === 'traiter') {
      await db.from('alertes').update({ lue:true, traitee:true }).eq('id',id);
      toastSuccess(t('alerts.markedDone'));
    }
    if (btn.dataset.action === 'del') {
      await db.from('alertes').delete().eq('id',id);
    }
    _load();
    _updateBadge();
  });

  _load();
}

async function _load() {
  const wrap = document.getElementById('alertes-list');
  if (!wrap) return;

  let query = db.from('alertes')
    .select('*,residents(nom,prenom,numero_chambre)')
    .order('created_at',{ascending:false})
    .limit(100);

  const types = TYPE_VIEWS[_view]?.types;
  if (types) query = query.in('type', types);

  if (_etat === 'nonlues')  query = query.eq('lue', false);
  if (_etat === 'traitees') query = query.eq('traitee', true);

  const [{ data, error }, countsRes] = await Promise.all([
    query,
    db.from('alertes').select('type').eq('lue', false),
  ]);
  if (error) { toastError('Erreur chargement alertes'); return; }

  _updateTabCounts(countsRes.data || []);

  const rows = data || [];
  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-bell-slash"></i><p>${t('alerts.noAlerts')}</p></div>`;
    return;
  }

  wrap.innerHTML = rows.map(a=>`
    <div class="alert-card alert-p${a.priorite} ${a.lue?'lue':''}" data-id="${a.id}">
      <i class="bi ${ICONS[a.type]||'bi-bell-fill'} alert-icon"></i>
      <div class="alert-content" style="flex:1">
        <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-light);margin-bottom:.15rem">
          ${t(TYPE_LABEL_KEYS[a.type]) || a.type}
        </div>
        <div class="alert-title">${a.titre}</div>
        ${a.residents ? `<div class="alert-msg">${a.residents.prenom} ${a.residents.nom} — ${t('alerts.room')} ${a.residents.numero_chambre||'—'}</div>` : ''}
        ${a.message ? `<div class="alert-msg" style="margin-top:.2rem">${a.message}</div>` : ''}
        <div class="alert-time">${formatDate(a.created_at,{time:true})}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:.4rem;align-items:flex-end">
        ${!a.lue ? `<button class="btn btn-secondary btn-sm" data-action="lire" data-id="${a.id}"><i class="bi bi-check2"></i> ${t('alerts.markRead')}</button>` : ''}
        ${!a.traitee ? `<button class="btn btn-success btn-sm" data-action="traiter" data-id="${a.id}"><i class="bi bi-check2-all"></i> ${t('alerts.markDone')}</button>` : `<span class="badge badge-ok" style="font-size:.72rem">${t('alerts.markDone')}</span>`}
        <button class="btn-icon" data-action="del" data-id="${a.id}" style="color:#dc2626" title="Supprimer"><i class="bi bi-trash3"></i></button>
      </div>
    </div>`).join('');
}

function _updateTabCounts(unread) {
  const counts = {};
  for (const [k, v] of Object.entries(TYPE_VIEWS)) {
    counts[k] = v.types
      ? unread.filter(a => v.types.includes(a.type)).length
      : unread.length;
  }
  document.querySelectorAll('.alert-tab-count').forEach(el => {
    const n = counts[el.dataset.count] || 0;
    el.textContent = n;
    el.style.display = n > 0 ? 'inline-block' : 'none';
  });
}

function _updateBadge() {
  db.from('alertes').select('id',{count:'exact'}).eq('lue',false).eq('traitee',false)
    .then(({count}) => {
      const b = document.getElementById('badge-alertes');
      if (!b) return;
      b.textContent = count||0;
      b.style.display = (count||0)>0 ? 'flex' : 'none';
    });
}
