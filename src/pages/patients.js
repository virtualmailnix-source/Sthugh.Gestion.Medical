import { db }            from '../supabase.js';
import { openModal, closeModal } from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import {
  formatDate, formatAge, initials, fullName,
  statusBadge, escapeHtml, debounce, nowLocalInput
} from '../utils.js';

const PAGE_SIZE = 15;
let _page = 1;
let _search = '';
let _filter = 'actif';
let _container = null;

export async function renderPatients(container) {
  _container = container;
  _page = 1; _search = ''; _filter = 'actif';

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Patients</h2>
        <span class="sub">Gestion des dossiers patients</span>
      </div>
      <div class="page-header-actions">
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input type="text" id="patient-search" placeholder="Nom, téléphone, dossier…">
        </div>
        <button class="btn btn-primary" id="btn-add-patient">
          <i class="bi bi-person-plus-fill"></i> Nouveau patient
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-chips">
        <button class="chip active" data-filter="actif">Actifs</button>
        <button class="chip" data-filter="tous">Tous</button>
        <button class="chip" data-filter="inactif">Archivés</button>
      </div>
    </div>

    <div class="card">
      <div id="patients-table-wrap"></div>
    </div>
    <div id="patients-pagination"></div>`;

  document.getElementById('btn-add-patient')
    .addEventListener('click', () => openFormPatient(null));

  document.getElementById('patient-search')
    .addEventListener('input', debounce(e => {
      _search = e.target.value.trim();
      _page = 1;
      _loadPatients();
    }, 300));

  document.querySelectorAll('.chip[data-filter]').forEach(c =>
    c.addEventListener('click', e => {
      document.querySelectorAll('.chip[data-filter]').forEach(x => x.classList.remove('active'));
      e.target.classList.add('active');
      _filter = e.target.dataset.filter;
      _page = 1;
      _loadPatients();
    })
  );

  _loadPatients();
}

async function _loadPatients() {
  const wrap = document.getElementById('patients-table-wrap');
  wrap.innerHTML = `<div style="padding:1.5rem">${_skeletonRows()}</div>`;

  let query = db.from('patients')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((_page - 1) * PAGE_SIZE, _page * PAGE_SIZE - 1);

  if (_filter === 'actif')   query = query.eq('actif', true);
  if (_filter === 'inactif') query = query.eq('actif', false);

  if (_search) {
    query = query.or(
      `nom.ilike.%${_search}%,prenom.ilike.%${_search}%,telephone.ilike.%${_search}%,numero_dossier.ilike.%${_search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) { toastError('Erreur de chargement des patients'); return; }

  wrap.innerHTML = _tableHTML(data || []);
  _renderPagination(count || 0);

  wrap.addEventListener('click', e => {
    const row = e.target.closest('tr[data-id]');
    if (!row) return;
    const btn = e.target.closest('button');
    if (btn?.dataset.action === 'edit')   { openFormPatient(row.dataset.id); return; }
    if (btn?.dataset.action === 'delete') { confirmDelete(row.dataset.id, row.dataset.name); return; }
    if (btn?.dataset.action === 'consult') { _openDetailPanel(row.dataset.id); return; }
    _openDetailPanel(row.dataset.id);
  });
}

function _tableHTML(rows) {
  if (!rows.length) return `<div class="empty-state"><i class="bi bi-people"></i><p>Aucun patient trouvé</p></div>`;
  return `
    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th>Dossier</th><th>Patient</th><th>Âge/Sexe</th>
          <th>Téléphone</th><th>Statut</th><th style="text-align:right">Actions</th>
        </tr></thead>
        <tbody>
          ${rows.map(p => `<tr data-id="${p.id}" data-name="${escapeHtml(fullName(p.nom,p.prenom))}" style="cursor:pointer">
            <td><span class="badge badge-teal">${p.numero_dossier||'—'}</span></td>
            <td>
              <div style="display:flex;align-items:center;gap:.6rem">
                <div class="patient-avatar">${initials(p.nom, p.prenom)}</div>
                <div>
                  <div style="font-weight:600">${fullName(p.nom,p.prenom)}</div>
                  <div style="font-size:.78rem;color:var(--text-light)">${p.profession||''}</div>
                </div>
              </div>
            </td>
            <td>${formatAge(p.date_naissance)} / ${p.sexe?p.sexe[0]:'—'}</td>
            <td>${p.telephone||'—'}</td>
            <td>${p.actif ? '<span class="badge badge-actif">Actif</span>' : '<span class="badge badge-inactif">Archivé</span>'}</td>
            <td>
              <div class="table-actions">
                <button class="btn-icon" data-action="consult" title="Voir le dossier"><i class="bi bi-folder2-open"></i></button>
                <button class="btn-icon" data-action="edit"    title="Modifier"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn-icon" data-action="delete"  title="Supprimer" style="color:#dc2626"><i class="bi bi-trash3-fill"></i></button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function _renderPagination(total) {
  const pages = Math.ceil(total / PAGE_SIZE);
  const wrap  = document.getElementById('patients-pagination');
  if (pages <= 1) { wrap.innerHTML = ''; return; }
  let html = `<div class="pagination">
    <button class="page-btn" ${_page===1?'disabled':''} data-p="${_page-1}"><i class="bi bi-chevron-left"></i></button>`;
  for (let i = 1; i <= pages; i++) {
    if (i===1||i===pages||Math.abs(i-_page)<=1)
      html += `<button class="page-btn ${i===_page?'active':''}" data-p="${i}">${i}</button>`;
    else if (Math.abs(i-_page)===2)
      html += `<span style="padding:0 .3rem;color:var(--text-light)">…</span>`;
  }
  html += `<button class="page-btn" ${_page===pages?'disabled':''} data-p="${_page+1}"><i class="bi bi-chevron-right"></i></button></div>`;
  wrap.innerHTML = html;
  wrap.addEventListener('click', e => {
    const btn = e.target.closest('[data-p]');
    if (btn && !btn.disabled) { _page = +btn.dataset.p; _loadPatients(); }
  });
}

// ── Formulaire ajout / modification ───────────────────────
export async function openFormPatient(id) {
  let patient = null;
  if (id) {
    const { data } = await db.from('patients').select('*').eq('id', id).single();
    patient = data;
  }

  const title = id ? '<i class="bi bi-pencil-fill"></i> Modifier le patient' : '<i class="bi bi-person-plus-fill"></i> Nouveau patient';
  const p = patient || {};

  const body = `
    <form id="form-patient">
      <div class="form-section">
        <div class="form-section-title"><i class="bi bi-person-badge"></i> Identité</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nom <span class="required">*</span></label>
            <input class="form-control" name="nom" value="${escapeHtml(p.nom||'')}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Prénom <span class="required">*</span></label>
            <input class="form-control" name="prenom" value="${escapeHtml(p.prenom||'')}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date de naissance</label>
            <input class="form-control" type="date" name="date_naissance" value="${p.date_naissance||''}">
          </div>
          <div class="form-group">
            <label class="form-label">Sexe</label>
            <select class="form-control" name="sexe">
              <option value="">— Sélectionner —</option>
              ${['Masculin','Féminin','Autre'].map(s=>`<option ${p.sexe===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Groupe sanguin</label>
            <select class="form-control" name="groupe_sanguin">
              <option value="">—</option>
              ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=>`<option ${p.groupe_sanguin===g?'selected':''}>${g}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title"><i class="bi bi-telephone"></i> Coordonnées</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Téléphone <span class="required">*</span></label>
            <input class="form-control" name="telephone" value="${escapeHtml(p.telephone||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">Téléphone 2</label>
            <input class="form-control" name="telephone2" value="${escapeHtml(p.telephone2||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-control" type="email" name="email" value="${escapeHtml(p.email||'')}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Adresse</label>
            <input class="form-control" name="adresse" value="${escapeHtml(p.adresse||'')}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Ville</label>
            <input class="form-control" name="ville" value="${escapeHtml(p.ville||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">Pays</label>
            <input class="form-control" name="pays" value="${escapeHtml(p.pays||'Haïti')}">
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title"><i class="bi bi-briefcase"></i> Informations complémentaires</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Profession</label>
            <input class="form-control" name="profession" value="${escapeHtml(p.profession||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">Situation familiale</label>
            <select class="form-control" name="situation_familiale">
              <option value="">—</option>
              ${['Célibataire','Marié(e)','Divorcé(e)','Veuf/Veuve','Union libre'].map(s=>`<option ${p.situation_familiale===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Contact urgence — Nom</label>
            <input class="form-control" name="contact_urgence_nom" value="${escapeHtml(p.contact_urgence_nom||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">Contact urgence — Tél.</label>
            <input class="form-control" name="contact_urgence_tel" value="${escapeHtml(p.contact_urgence_tel||'')}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-control" name="notes" rows="2">${escapeHtml(p.notes||'')}</textarea>
        </div>
      </div>
    </form>`;

  openModal(title, body, [
    { label: 'Annuler',       cls: 'btn btn-secondary', action: closeModal },
    { label: id ? 'Modifier' : 'Enregistrer', cls: 'btn btn-primary', action: () => _submitPatient(id) }
  ], 'modal-lg');
}

async function _submitPatient(id) {
  const form = document.getElementById('form-patient');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const fd   = new FormData(form);
  const data = Object.fromEntries([...fd.entries()].filter(([,v]) => v !== ''));

  const { error } = id
    ? await db.from('patients').update(data).eq('id', id)
    : await db.from('patients').insert(data);

  if (error) { toastError(error.message); return; }
  toastSuccess(id ? 'Patient modifié' : 'Patient créé');
  closeModal();
  _loadPatients();
}

async function confirmDelete(id, name) {
  openModal(
    '<i class="bi bi-exclamation-triangle-fill" style="color:#dc2626"></i> Supprimer le patient',
    `<p>Voulez-vous vraiment supprimer <strong>${name}</strong> ? Cette action supprimera également toutes ses consultations, ordonnances et rendez-vous.</p>`,
    [
      { label: 'Annuler',    cls: 'btn btn-secondary', action: closeModal },
      { label: 'Supprimer', cls: 'btn btn-danger',    action: async () => {
        const { error } = await db.from('patients').delete().eq('id', id);
        if (error) { toastError(error.message); return; }
        toastSuccess('Patient supprimé');
        closeModal();
        _loadPatients();
      }}
    ], 'modal-sm'
  );
}

// ── Panel latéral détail patient ──────────────────────────
async function _openDetailPanel(id) {
  const { data: p } = await db.from('patients').select('*').eq('id', id).single();
  if (!p) return;

  const [antRes, consultRes, ordRes, rdvRes] = await Promise.all([
    db.from('antecedents').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
    db.from('consultations').select('*').eq('patient_id', id).order('date_consultation', { ascending: false }).limit(20),
    db.from('ordonnances').select('*').eq('patient_id', id).order('date_ordonnance', { ascending: false }).limit(20),
    db.from('rendez_vous').select('*').eq('patient_id', id).order('date_rdv', { ascending: false }).limit(20),
  ]);

  const ant   = antRes.data   || [];
  const cons  = consultRes.data || [];
  const ords  = ordRes.data   || [];
  const rdvs  = rdvRes.data   || [];

  const body = `
    <div style="background:linear-gradient(135deg,var(--teal-dark),var(--teal-mid));padding:1.5rem;margin:-1.5rem -1.5rem 1.5rem;border-radius:var(--radius-lg) var(--radius-lg) 0 0">
      <div style="display:flex;align-items:center;gap:1rem;color:var(--white)">
        <div class="patient-avatar" style="width:54px;height:54px;font-size:1.25rem;background:rgba(255,255,255,.15);color:var(--gold-light)">
          ${initials(p.nom, p.prenom)}
        </div>
        <div>
          <div style="font-family:Georgia,serif;font-size:1.2rem;font-weight:700">${fullName(p.nom,p.prenom)}</div>
          <div style="font-size:.82rem;opacity:.8">${p.numero_dossier||''} &bull; ${formatAge(p.date_naissance)} &bull; ${p.sexe||'—'}</div>
          <div style="font-size:.82rem;opacity:.7;margin-top:.15rem">${p.telephone||''}</div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="infos">Infos</button>
      <button class="tab-btn" data-tab="antecedents">Antécédents (${ant.length})</button>
      <button class="tab-btn" data-tab="consultations">Consultations (${cons.length})</button>
      <button class="tab-btn" data-tab="ordonnances">Ordonnances (${ords.length})</button>
      <button class="tab-btn" data-tab="rdv">RDV (${rdvs.length})</button>
    </div>

    <div class="tab-pane active" data-pane="infos">
      ${_panelInfos(p)}
    </div>
    <div class="tab-pane" data-pane="antecedents">
      <div style="display:flex;justify-content:flex-end;margin-bottom:1rem">
        <button class="btn btn-primary btn-sm" id="btn-add-ant" data-pid="${p.id}">
          <i class="bi bi-plus-lg"></i> Ajouter
        </button>
      </div>
      ${ant.length ? ant.map(_antItem).join('') : '<div class="empty-state"><i class="bi bi-clipboard2-minus"></i><p>Aucun antécédent</p></div>'}
    </div>
    <div class="tab-pane" data-pane="consultations">
      ${cons.length ? _miniTableConsult(cons) : '<div class="empty-state"><i class="bi bi-journal-x"></i><p>Aucune consultation</p></div>'}
    </div>
    <div class="tab-pane" data-pane="ordonnances">
      ${ords.length ? _miniTableOrd(ords) : '<div class="empty-state"><i class="bi bi-file-medical"></i><p>Aucune ordonnance</p></div>'}
    </div>
    <div class="tab-pane" data-pane="rdv">
      ${rdvs.length ? _miniTableRdv(rdvs) : '<div class="empty-state"><i class="bi bi-calendar-x"></i><p>Aucun rendez-vous</p></div>'}
    </div>`;

  openModal(`<i class="bi bi-folder2-open"></i> Dossier patient`, body, [
    { label: 'Modifier', cls:'btn btn-secondary btn-sm', action: () => { closeModal(); openFormPatient(id); } },
    { label: 'Fermer',   cls:'btn btn-primary btn-sm',  action: closeModal }
  ], 'modal-xl');

  // Onglets
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`[data-pane="${btn.dataset.tab}"]`)?.classList.add('active');
    });
  });

  document.getElementById('btn-add-ant')?.addEventListener('click', e => {
    _openFormAntecedent(e.target.dataset.pid, null, id);
  });
}

function _panelInfos(p) {
  const row = (label, val) => val
    ? `<tr><td style="font-size:.8rem;color:var(--text-light);padding:.4rem 0;width:40%">${label}</td><td style="font-size:.9rem">${val}</td></tr>`
    : '';
  return `<table style="width:100%">
    ${row('Dossier',         p.numero_dossier)}
    ${row('Date naissance',  formatDate(p.date_naissance))}
    ${row('Sexe',            p.sexe)}
    ${row('Groupe sanguin',  p.groupe_sanguin)}
    ${row('Téléphone',       p.telephone)}
    ${row('Téléphone 2',     p.telephone2)}
    ${row('Email',           p.email)}
    ${row('Adresse',         [p.adresse, p.ville, p.pays].filter(Boolean).join(', '))}
    ${row('Profession',      p.profession)}
    ${row('Situation',       p.situation_familiale)}
    ${row('Contact urgence', [p.contact_urgence_nom, p.contact_urgence_tel].filter(Boolean).join(' — '))}
    ${p.notes ? `<tr><td colspan="2" style="padding-top:.75rem"><div class="form-section-title"><i class="bi bi-chat-text"></i> Notes</div><div style="font-size:.9rem">${escapeHtml(p.notes)}</div></td></tr>` : ''}
  </table>`;
}

function _antItem(a) {
  const types = { medical:'Médical', chirurgical:'Chirurgical', familial:'Familial', allergie:'Allergie', traitement_en_cours:'Traitement en cours', vaccin:'Vaccin' };
  return `<div class="antecedent-item">
    <div class="antecedent-type">${types[a.type]||a.type}</div>
    <div class="antecedent-desc">${escapeHtml(a.description)}</div>
    ${a.date_debut ? `<div class="antecedent-date">Depuis ${formatDate(a.date_debut)}${a.date_fin?' — '+formatDate(a.date_fin):''}</div>` : ''}
  </div>`;
}

function _miniTableConsult(rows) {
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th>Date</th><th>Motif</th><th>Statut</th></tr></thead>
    <tbody>${rows.map(c=>`<tr>
      <td style="white-space:nowrap;font-size:.85rem">${formatDate(c.date_consultation)}</td>
      <td style="font-size:.85rem">${c.motif||c.diagnostic||'—'}</td>
      <td>${statusBadge(c.statut_paiement)}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function _miniTableOrd(rows) {
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th>N°</th><th>Date</th></tr></thead>
    <tbody>${rows.map(o=>`<tr>
      <td><span class="badge badge-teal">${o.numero||'—'}</span></td>
      <td style="font-size:.85rem">${formatDate(o.date_ordonnance)}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function _miniTableRdv(rows) {
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th>Date</th><th>Motif</th><th>Statut</th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td style="white-space:nowrap;font-size:.85rem">${formatDate(r.date_rdv,{time:true})}</td>
      <td style="font-size:.85rem">${r.motif||'—'}</td>
      <td>${statusBadge(r.statut)}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

async function _openFormAntecedent(patientId, antId, ownerId) {
  let ant = null;
  if (antId) {
    const { data } = await db.from('antecedents').select('*').eq('id', antId).single();
    ant = data;
  }
  const a = ant || {};
  const body = `<form id="form-ant">
    <div class="form-group">
      <label class="form-label">Type <span class="required">*</span></label>
      <select class="form-control" name="type" required>
        <option value="">— Sélectionner —</option>
        ${[['medical','Médical'],['chirurgical','Chirurgical'],['familial','Familial'],['allergie','Allergie'],['traitement_en_cours','Traitement en cours'],['vaccin','Vaccin']]
          .map(([v,l])=>`<option value="${v}" ${a.type===v?'selected':''}>${l}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Description <span class="required">*</span></label>
      <textarea class="form-control" name="description" rows="3" required>${escapeHtml(a.description||'')}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date début</label>
        <input class="form-control" type="date" name="date_debut" value="${a.date_debut||''}">
      </div>
      <div class="form-group">
        <label class="form-label">Date fin</label>
        <input class="form-control" type="date" name="date_fin" value="${a.date_fin||''}">
      </div>
    </div>
  </form>`;

  openModal('<i class="bi bi-clipboard2-pulse"></i> Antécédent médical', body, [
    { label: 'Annuler',    cls:'btn btn-secondary', action: closeModal },
    { label: 'Enregistrer', cls:'btn btn-primary', action: async () => {
      const form = document.getElementById('form-ant');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const fd   = new FormData(form);
      const data = Object.fromEntries([...fd.entries()].filter(([,v])=>v!==''));
      data.patient_id = patientId;
      const { error } = antId
        ? await db.from('antecedents').update(data).eq('id', antId)
        : await db.from('antecedents').insert(data);
      if (error) { toastError(error.message); return; }
      toastSuccess('Antécédent enregistré');
      closeModal();
      _openDetailPanel(ownerId || patientId);
    }}
  ]);
}

function _skeletonRows() {
  return Array(6).fill(0).map(()=>`<div class="skeleton skeleton-text" style="height:40px;margin-bottom:.5rem"></div>`).join('');
}
