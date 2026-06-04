import { db }                       from '../supabase.js';
import { openModal, closeModal }    from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatDate, formatTime, fullName, escapeHtml, debounce, nowLocalInput, todayISO } from '../utils.js';
import { t, getLang }               from '../i18n.js';

let _filter = 'today';

export async function renderVisites(container) {
  _filter = 'today';

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('visites.title')}</h2>
        <span class="sub">${t('visites.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-add-visit">
          <i class="bi bi-person-walking"></i> ${t('visites.addVisit')}
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-chips">
        <button class="chip active" data-f="today">${t('visites.filterToday')}</button>
        <button class="chip" data-f="upcoming">${t('visites.filterUpcoming')}</button>
        <button class="chip" data-f="all">${t('visites.filterAll')}</button>
        <button class="chip" data-f="history">${t('visites.filterHistory')}</button>
      </div>
    </div>

    <div id="visits-list"></div>`;

  document.getElementById('btn-add-visit').addEventListener('click', () => _openFormVisite(null));

  document.querySelectorAll('.chip[data-f]').forEach(c =>
    c.addEventListener('click', e => {
      document.querySelectorAll('.chip[data-f]').forEach(x => x.classList.remove('active'));
      e.target.classList.add('active');
      _filter = e.target.dataset.f;
      _load();
    })
  );

  _load();
}

async function _load() {
  const wrap = document.getElementById('visits-list');
  if (!wrap) return;
  wrap.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-light)"><i class="bi bi-hourglass-split"></i></div>`;

  const today = todayISO();

  let q = db.from('visites')
    .select('*, residents(nom,prenom,numero_chambre,photo_url)')
    .order('heure_arrivee', { ascending: _filter !== 'history' });

  if (_filter === 'today')    q = q.eq('date_visite', today);
  if (_filter === 'upcoming') q = q.gt('date_visite', today).eq('est_planifiee', true).in('statut', ['planifiee']);
  if (_filter === 'history')  q = q.lt('date_visite', today).order('date_visite', { ascending: false });

  const { data, error } = await q.limit(100);
  if (error) { toastError(t('visites.noVisits')); wrap.innerHTML = ''; return; }

  const rows = data || [];

  if (!rows.length) {
    const msg = _filter === 'today' ? t('visites.noToday')
              : _filter === 'upcoming' ? t('visites.noUpcoming')
              : t('visites.noVisits');
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-person-walking"></i><p>${msg}</p></div>`;
    return;
  }

  wrap.innerHTML = `<div style="display:grid;gap:1rem">
    ${rows.map(v => _visitCard(v)).join('')}
  </div>`;

  wrap.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id  = btn.dataset.id;
    if (btn.dataset.action === 'edit')   _openFormVisite(id);
    if (btn.dataset.action === 'arrive') _markStatus(id, 'en_cours');
    if (btn.dataset.action === 'done')   _markStatus(id, 'terminee', true);
    if (btn.dataset.action === 'cancel') _markStatus(id, 'annulee');
    if (btn.dataset.action === 'delete') _deleteVisite(id);
  });
}

function _visitCard(v) {
  const r = v.residents || {};
  const avatar = r.photo_url
    ? `<img src="${r.photo_url}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid var(--card-border)">`
    : `<div class="patient-avatar" style="width:44px;height:44px;flex-shrink:0">${((r.nom||'')[0]||'').toUpperCase()}${((r.prenom||'')[0]||'').toUpperCase()}</div>`;

  const statusBadge = {
    planifiee:  `<span class="badge badge-planifie">${t('visites.statusPlanifiee')}</span>`,
    en_cours:   `<span class="badge" style="background:#dcfce7;color:#166534">${t('visites.statusEnCours')}</span>`,
    terminee:   `<span class="badge badge-confirme">${t('visites.statusTerminee')}</span>`,
    annulee:    `<span class="badge badge-annule">${t('visites.statusAnnulee')}</span>`,
  }[v.statut] || `<span class="badge badge-teal">${v.statut}</span>`;

  const others = v.autres_visiteurs || [];
  const othersTxt = others.length > 0
    ? `<div style="font-size:.77rem;color:var(--text-light);margin-top:.2rem">
        + ${others.map(o => `${o.prenom || ''} ${o.nom || ''}`.trim()).join(', ')}
      </div>`
    : '';

  const nbTxt = v.nb_personnes > 1
    ? `<span class="badge badge-teal" style="font-size:.72rem">${v.nb_personnes} ${t('visites.persons')}</span>`
    : '';

  const actions = [];
  if (v.statut === 'planifiee') {
    actions.push(`<button class="btn btn-success btn-sm" data-action="arrive" data-id="${v.id}"><i class="bi bi-door-open-fill"></i> ${t('visites.markArrived')}</button>`);
    actions.push(`<button class="btn btn-secondary btn-sm" data-action="edit" data-id="${v.id}"><i class="bi bi-pencil-fill"></i></button>`);
    actions.push(`<button class="btn btn-secondary btn-sm" data-action="cancel" data-id="${v.id}" style="color:#dc2626;border-color:#dc2626"><i class="bi bi-x-lg"></i></button>`);
  } else if (v.statut === 'en_cours') {
    actions.push(`<button class="btn btn-primary btn-sm" data-action="done" data-id="${v.id}"><i class="bi bi-check2-all"></i> ${t('visites.markDone')}</button>`);
  } else {
    actions.push(`<button class="btn btn-secondary btn-sm" data-action="delete" data-id="${v.id}" style="color:#dc2626"><i class="bi bi-trash3-fill"></i></button>`);
  }

  return `<div class="card" style="padding:1rem 1.25rem">
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
      ${avatar}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.3rem">
          <strong style="font-size:.95rem">${fullName(r.nom, r.prenom)}</strong>
          <span class="badge badge-teal" style="font-size:.72rem">${t('common.roomFull')} ${r.numero_chambre || '—'}</span>
          ${statusBadge}
          ${nbTxt}
        </div>
        <div style="font-size:.88rem;font-weight:600;color:var(--teal-dark)">
          <i class="bi bi-person-fill" style="margin-right:.3rem"></i>${v.visiteur_prenom} ${v.visiteur_nom}
          ${v.visiteur_relation ? `<span style="font-weight:400;color:var(--text-light)"> — ${escapeHtml(v.visiteur_relation)}</span>` : ''}
          ${v.visiteur_telephone ? `<span style="font-size:.78rem;color:var(--text-light);margin-left:.5rem"><i class="bi bi-telephone"></i> ${v.visiteur_telephone}</span>` : ''}
        </div>
        ${othersTxt}
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:.82rem;color:var(--text-light)">
          ${formatDate(v.date_visite)}
        </div>
        <div style="font-size:.82rem;margin-top:.2rem">
          ${v.heure_arrivee ? `<i class="bi bi-door-open-fill" style="color:#16a34a"></i> ${formatTime(v.heure_arrivee)}` : ''}
          ${v.heure_depart  ? ` → <i class="bi bi-door-closed-fill" style="color:#dc2626"></i> ${formatTime(v.heure_depart)}` : ''}
        </div>
      </div>
      <div style="display:flex;gap:.4rem;flex-shrink:0">
        ${actions.join('')}
      </div>
    </div>
  </div>`;
}

async function _markStatus(id, statut, askDepart = false) {
  const updates = { statut };
  if (statut === 'en_cours' && !updates.heure_arrivee) {
    updates.heure_arrivee = new Date().toISOString();
  }
  if (statut === 'terminee') {
    updates.heure_depart = new Date().toISOString();
  }
  const { error } = await db.from('visites').update(updates).eq('id', id);
  if (error) { toastError(error.message); return; }
  toastSuccess(statut === 'en_cours' ? t('visites.arrived') : statut === 'terminee' ? t('visites.departed') : '');
  _load();
}

async function _deleteVisite(id) {
  openModal(
    `<i class="bi bi-exclamation-triangle-fill" style="color:#dc2626"></i> ${t('common.delete')}`,
    `<p>${t('visites.deleteConfirm')}</p>`,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
      { label: t('common.delete'), cls: 'btn btn-danger', action: async () => {
        const { error } = await db.from('visites').delete().eq('id', id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('visites.deleted'));
        closeModal(); _load();
      }}
    ], 'modal-sm'
  );
}

// ── Formulaire visite ─────────────────────────────────────
async function _openFormVisite(id) {
  let visite = null;
  if (id) {
    const { data } = await db.from('visites').select('*').eq('id', id).single();
    visite = data;
  }
  const v = visite || {};

  const { data: resList } = await db.from('residents')
    .select('id,nom,prenom,numero_chambre')
    .eq('actif', true).is('statut_depart', null)
    .order('nom').limit(300);

  const resOpts = (resList || []).map(r =>
    `<option value="${r.id}" ${v.resident_id === r.id ? 'selected' : ''}>${r.prenom} ${r.nom} — Ch.${r.numero_chambre || '—'}</option>`
  ).join('');

  const others = v.autres_visiteurs || [];
  const othersHTML = others.map((o, idx) => _otherRow(idx, o)).join('');

  const body = `<form id="form-visit">
    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-people-fill"></i> ${t('visites.secVisitor')}</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('visites.firstname')} <span class="required">*</span></label>
          <input class="form-control" name="visiteur_prenom" value="${escapeHtml(v.visiteur_prenom || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t('visites.lastname')} <span class="required">*</span></label>
          <input class="form-control" name="visiteur_nom" value="${escapeHtml(v.visiteur_nom || '')}" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('visites.phone')}</label>
          <input class="form-control" name="visiteur_telephone" value="${escapeHtml(v.visiteur_telephone || '')}" placeholder="+230 5XXX XXXX">
        </div>
        <div class="form-group">
          <label class="form-label">${t('visites.relation')}</label>
          <input class="form-control" name="visiteur_relation" value="${escapeHtml(v.visiteur_relation || '')}" placeholder="${getLang()==='en'?'Son, Daughter…':'Fils, Fille, Neveu…'}">
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-door-open-fill"></i> ${t('visites.secVisit')}</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('visites.resident')} <span class="required">*</span></label>
          <select class="form-control" name="resident_id" required>
            <option value="">${t('visites.selectResident')}</option>${resOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('visites.nbPersons')}</label>
          <input class="form-control" type="number" id="nb-personnes" name="nb_personnes"
            min="1" max="50" value="${v.nb_personnes || 1}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('visites.arrivalTime')}</label>
          <input class="form-control" type="datetime-local" name="heure_arrivee_input"
            value="${v.heure_arrivee ? new Date(v.heure_arrivee).toISOString().slice(0,16) : nowLocalInput()}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('visites.departureTime')}</label>
          <input class="form-control" type="datetime-local" name="heure_depart_input"
            value="${v.heure_depart ? new Date(v.heure_depart).toISOString().slice(0,16) : ''}">
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem">
        <input type="checkbox" id="is-planned" name="est_planifiee" ${v.est_planifiee ? 'checked' : ''}>
        <label for="is-planned" style="font-size:.88rem;cursor:pointer">${t('visites.isPlanned')}</label>
      </div>
    </div>

    <div class="form-section" id="others-section">
      <div class="form-section-title">
        <i class="bi bi-people-fill"></i> ${t('visites.othersTitle')}
        <span style="font-size:.78rem;font-weight:400;color:var(--text-light)"> (${getLang()==='en'?'only if more than 1 person':'si plus d\'une personne'})</span>
        <button type="button" id="btn-add-other" class="btn btn-secondary btn-sm" style="margin-left:auto">
          <i class="bi bi-plus-lg"></i> ${t('visites.addOther')}
        </button>
      </div>
      <div id="others-container">${othersHTML}</div>
    </div>

    <div class="form-group">
      <label class="form-label">${t('visites.notes')}</label>
      <textarea class="form-control" name="notes" rows="2">${escapeHtml(v.notes || '')}</textarea>
    </div>
  </form>`;

  openModal(
    id ? `<i class="bi bi-pencil-fill"></i> ${t('visites.formTitleEdit')}`
       : `<i class="bi bi-person-walking"></i> ${t('visites.formTitle')}`,
    body,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
      { label: id ? t('common.modify') : t('common.save'), cls: 'btn btn-primary', action: () => _submitVisite(id) }
    ],
    'modal-xl'
  );

  // Add other visitor row
  document.getElementById('btn-add-other')?.addEventListener('click', () => {
    const c = document.getElementById('others-container');
    const idx = c.querySelectorAll('.other-row').length;
    const div = document.createElement('div');
    div.innerHTML = _otherRow(idx, {});
    c.appendChild(div.firstElementChild);
    _initOtherRemove(div.firstElementChild);
  });

  // Init existing other rows
  document.querySelectorAll('.other-row').forEach(row => _initOtherRemove(row));
}

function _otherRow(idx, o) {
  return `<div class="other-row" style="display:flex;align-items:center;gap:.75rem;padding:.5rem 0;border-bottom:1px solid var(--card-border)">
    <span style="font-size:.78rem;color:var(--text-light);min-width:20px">${idx + 2}.</span>
    <input class="form-control other-name" placeholder="${t('visites.otherNamePlaceholder')}"
      value="${escapeHtml((o.prenom || '') + (o.nom ? ' ' + o.nom : ''))}" style="flex:1">
    <button type="button" class="btn-icon btn-rm-other" style="color:#dc2626">
      <i class="bi bi-x-lg"></i>
    </button>
  </div>`;
}

function _initOtherRemove(row) {
  row.querySelector('.btn-rm-other')?.addEventListener('click', () => row.remove());
}

async function _submitVisite(id) {
  const form = document.getElementById('form-visit');
  if (!form?.checkValidity()) { form?.reportValidity(); return; }

  const fd = new FormData(form);

  // Collect other visitors
  const others = [];
  document.querySelectorAll('.other-name').forEach(inp => {
    const val = inp.value.trim();
    if (!val) return;
    const parts = val.split(/\s+/);
    const prenom = parts[0] || '';
    const nom    = parts.slice(1).join(' ') || '';
    others.push({ prenom, nom });
  });

  const arriHeure = fd.get('heure_arrivee_input');
  const departHeure = fd.get('heure_depart_input');

  const data = {
    resident_id:         fd.get('resident_id'),
    visiteur_prenom:     fd.get('visiteur_prenom')?.trim(),
    visiteur_nom:        fd.get('visiteur_nom')?.trim(),
    visiteur_telephone:  fd.get('visiteur_telephone')?.trim() || null,
    visiteur_relation:   fd.get('visiteur_relation')?.trim() || null,
    nb_personnes:        Math.max(1, parseInt(fd.get('nb_personnes')) || 1),
    autres_visiteurs:    others,
    date_visite:         arriHeure ? arriHeure.slice(0, 10) : todayISO(),
    heure_arrivee:       arriHeure ? new Date(arriHeure).toISOString() : null,
    heure_depart:        departHeure ? new Date(departHeure).toISOString() : null,
    est_planifiee:       !!fd.get('est_planifiee'),
    statut:              arriHeure && new Date(arriHeure) <= new Date() ? 'en_cours' : 'planifiee',
    notes:               fd.get('notes')?.trim() || null,
  };

  // If departure time is set, mark as terminée
  if (data.heure_depart) data.statut = 'terminee';

  const { error } = id
    ? await db.from('visites').update(data).eq('id', id)
    : await db.from('visites').insert(data);

  if (error) { toastError(error.message); return; }
  toastSuccess(t('visites.saved'));
  closeModal();
  _load();
}
