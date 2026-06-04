import { db }   from '../supabase.js';
import { openModal, closeModal } from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatDate, fullName }    from '../utils.js';
import { t } from '../i18n.js';

export async function renderAlertes(container) {
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

    <div class="filter-bar">
      <div class="filter-chips">
        <button class="chip active" data-f="nonlues">${t('alerts.filterUnread')}</button>
        <button class="chip" data-f="all">${t('alerts.filterAll')}</button>
        <button class="chip" data-f="medicament">${t('alerts.filterMeds')}</button>
        <button class="chip" data-f="visite">${t('alerts.filterVisits')}</button>
        <button class="chip" data-f="urgence">${t('common.emergency')}</button>
      </div>
    </div>

    <div id="alertes-list"></div>`;

  let _filter = 'nonlues';

  document.getElementById('btn-gen-alertes')?.addEventListener('click', async () => {
    const { data, error } = await db.rpc('fn_generer_alertes_medicaments');
    if (error) { toastError('Erreur génération alertes'); return; }
    toastSuccess(t('alerts.generated'));
    _load(_filter);
    _updateBadge();
  });

  document.getElementById('btn-tout-lire')?.addEventListener('click', async () => {
    await db.from('alertes').update({ lue:true }).eq('lue',false);
    toastSuccess(t('alerts.allMarkedRead'));
    _load(_filter);
    _updateBadge();
  });

  document.querySelectorAll('.chip[data-f]').forEach(c =>
    c.addEventListener('click', e => {
      document.querySelectorAll('.chip[data-f]').forEach(x=>x.classList.remove('active'));
      e.target.classList.add('active');
      _filter = e.target.dataset.f; _load(_filter);
    })
  );

  _load('nonlues');
}

async function _load(filter) {
  const wrap = document.getElementById('alertes-list');
  if (!wrap) return;

  let query = db.from('alertes')
    .select('*,residents(nom,prenom,numero_chambre)')
    .order('created_at',{ascending:false})
    .limit(100);

  if (filter === 'nonlues')   query = query.eq('lue',false);
  if (filter === 'medicament') query = query.in('type',['medicament_24h','medicament_epuise']);
  if (filter === 'visite')    query = query.in('type',['visite_requise','rdv_manque','pas_vu_30j']);
  if (filter === 'urgence')   query = query.eq('type','urgence');

  const { data, error } = await query;
  if (error) { toastError('Erreur chargement alertes'); return; }
  const rows = data || [];

  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-bell-slash"></i><p>${t('alerts.noAlerts')}</p></div>`;
    return;
  }

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

  wrap.innerHTML = rows.map(a=>`
    <div class="alert-card alert-p${a.priorite} ${a.lue?'lue':''}" data-id="${a.id}">
      <i class="bi ${ICONS[a.type]||'bi-bell-fill'} alert-icon"></i>
      <div class="alert-content" style="flex:1">
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

  wrap.addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action==='lire') {
      await db.from('alertes').update({ lue:true }).eq('id',id);
      toastSuccess(t('alerts.markedRead'));
      _load(filter);
      _updateBadge();
    }
    if (btn.dataset.action==='traiter') {
      await db.from('alertes').update({ lue:true, traitee:true }).eq('id',id);
      toastSuccess(t('alerts.markedDone'));
      _load(filter);
      _updateBadge();
    }
    if (btn.dataset.action==='del') {
      await db.from('alertes').delete().eq('id',id);
      _load(filter);
      _updateBadge();
    }
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
