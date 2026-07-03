import { db }                          from '../supabase.js';
import { openModal, closeModal }       from '../../script.js';
import { toastSuccess, toastError }    from '../toast.js';
import {
  formatDate, formatAge, initials, fullName,
  escapeHtml, debounce, nowLocalInput
} from '../utils.js';
import { openFormConsultation }        from './consultations.js';
import { openFormRdv }                 from './rendez-vous.js';
import { isSuperAdmin, isReceptionist, currentUserInfo } from '../auth.js';
import { t, getLang }                  from '../i18n.js';

const PAGE_SIZE = 15;
let _page = 1, _search = '', _filter = 'actif';

export async function renderResidents(container) {
  _page = 1; _search = ''; _filter = 'actif';
  const sa = isSuperAdmin();

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('residents.title')}</h2>
        <span class="sub">${t('residents.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input type="text" id="res-search" placeholder="Nom, chambre…">
        </div>
        ${sa ? `<button class="btn btn-primary" id="btn-add-res">
          <i class="bi bi-person-plus-fill"></i> ${t('residents.addResident')}
        </button>` : ''}
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-chips">
        <button class="chip active" data-filter="actif">${t('residents.filterActive')}</button>
        <button class="chip" data-filter="tous">${t('residents.filterAll')}</button>
        ${!isReceptionist() ? `
        <button class="chip" data-filter="urgents">${t('residents.filterUrgent')}</button>` : ''}
        <button class="chip" data-filter="vacances"><i class="bi bi-luggage-fill"></i> ${t('depart.filterVacances')}</button>
        <button class="chip" data-filter="depart"><i class="bi bi-door-open-fill"></i> ${t('depart.filterDeparts')}</button>
        ${!isReceptionist() ? `
        <button class="chip" data-filter="deces">✝ ${t('depart.filterDeces')}</button>
        <button class="chip" data-filter="inactif">${t('residents.filterArchived')}</button>` : ''}
      </div>
    </div>

    <div class="card"><div id="res-table-wrap"></div></div>
    <div id="res-pagination"></div>`;

  if (sa) {
    document.getElementById('btn-add-res')?.addEventListener('click', () => openFormResident(null));
  }
  document.getElementById('res-search').addEventListener('input',
    debounce(e => { _search = e.target.value; _page = 1; _loadResidents(); }, 300));
  document.querySelectorAll('.chip[data-filter]').forEach(c =>
    c.addEventListener('click', e => {
      document.querySelectorAll('.chip[data-filter]').forEach(x => x.classList.remove('active'));
      e.target.classList.add('active');
      _filter = e.target.dataset.filter; _page = 1; _loadResidents();
    })
  );
  _loadResidents();
}

async function _loadResidents() {
  const wrap = document.getElementById('res-table-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<div style="padding:1.5rem">${_sk()}</div>`;

  // Réceptionniste : vue publique (colonnes non médicales), jamais les décédés
  const source = isReceptionist() ? 'v_residents_public' : 'v_residents_priorite';
  let query = db.from(source)
    .select('*', { count: 'exact' })
    .range((_page - 1) * PAGE_SIZE, _page * PAGE_SIZE - 1);

  // (or : un simple neq exclurait aussi les statut_depart NULL, donc les présents)
  if (isReceptionist()) query = query.or('statut_depart.is.null,statut_depart.neq.deces');

  if (_filter === 'actif')    query = query.eq('actif', true).is('statut_depart', null);
  if (_filter === 'inactif')  query = query.eq('actif', false);
  if (_filter === 'urgents')  query = query.eq('actif', true).eq('niveau_priorite', 1);
  if (_filter === 'vacances') query = query.eq('statut_depart', 'vacances');
  if (_filter === 'depart')   query = query.eq('statut_depart', 'depart');
  if (_filter === 'deces')    query = query.eq('statut_depart', 'deces');

  if (_search) query = query.or(
    `nom.ilike.%${_search}%,prenom.ilike.%${_search}%,numero_chambre.ilike.%${_search}%`
  );

  const { data, error, count } = await query;
  if (error) { toastError('Erreur chargement résidents'); return; }

  wrap.innerHTML = isReceptionist() ? _tableAccueilHTML(data || []) : _tableHTML(data || []);
  _renderPagination(count || 0);

  // onclick (et non addEventListener) : _loadResidents est rappelée à chaque
  // filtre/recherche sur le même élément — les listeners s'empileraient
  wrap.onclick = e => {
    const btn = e.target.closest('button[data-action]');
    const row = e.target.closest('tr[data-id]');
    if (isReceptionist()) {
      if (row) _openProfileAccueil(row.dataset.id);
      return;
    }
    if (btn?.dataset.action === 'view')    { _openProfile(row.dataset.id); return; }
    if (btn?.dataset.action === 'edit')    { openFormResident(row.dataset.id); return; }
    if (btn?.dataset.action === 'consult') { openFormConsultation(null, row.dataset.id); return; }
    if (btn?.dataset.action === 'rdv')     { openFormRdv(null, row.dataset.id); return; }
    if (btn?.dataset.action === 'delete')  { _confirmDelete(row.dataset.id, row.dataset.name); return; }
    if (row) _openProfile(row.dataset.id);
  };
}

// ── Tableau réceptionniste : identité / chambre / statut seulement ──
function _tableAccueilHTML(rows) {
  if (!rows.length) return `<div class="empty-state"><i class="bi bi-people"></i><p>${t('residents.noResidents')}</p></div>`;
  return `<div class="table-wrap"><table class="table">
    <thead><tr>
      <th>${t('common.roomFull')}</th><th>${t('residents.colResident')}</th>
      <th>${t('residents.colAgeSex')}</th><th>${t('residents.colStatus')}</th>
      <th style="text-align:right">${t('common.actions')}</th>
    </tr></thead>
    <tbody>
      ${rows.map(r => `<tr data-id="${r.id}" data-name="${escapeHtml(fullName(r.nom, r.prenom))}" style="cursor:pointer">
        <td><span class="badge badge-teal">${r.numero_chambre || '—'}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:.6rem">
            ${r.photo_url
              ? `<img src="${r.photo_url}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid var(--card-border)">`
              : `<div class="patient-avatar">${initials(r.nom, r.prenom)}</div>`}
            <div style="font-weight:600">${fullName(r.nom, r.prenom)}</div>
          </div>
        </td>
        <td>${formatAge(r.date_naissance)} / ${r.sexe ? r.sexe[0] : '—'}</td>
        <td style="font-size:.83rem">
          ${r.statut_depart === 'vacances'
            ? `<span class="badge" style="background:#dbeafe;color:#1d4ed8"><i class="bi bi-luggage-fill"></i> ${t('depart.badgeVacances')}</span>`
            : r.statut_depart === 'depart'
            ? `<span class="badge" style="background:#f3f4f6;color:#374151"><i class="bi bi-door-open-fill"></i> ${t('depart.badgeDeparture')}</span>`
            : `<span class="badge badge-actif">${t('residents.statusPresent')}</span>`}
        </td>
        <td><div class="table-actions">
          <button class="btn-icon" data-action="view" title="Dossier"><i class="bi bi-folder2-open"></i></button>
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function _tableHTML(rows) {
  const sa = isSuperAdmin();
  if (!rows.length) return `<div class="empty-state"><i class="bi bi-people"></i><p>${t('residents.noResidents')}</p></div>`;
  return `<div class="table-wrap"><table class="table">
    <thead><tr>
      <th>${t('common.roomFull')}</th><th>${t('residents.colResident')}</th><th>${t('residents.colAgeSex')}</th>
      <th>${t('residents.colDoctor')}</th><th>${t('residents.colLastVisit')}</th><th>${t('residents.colUrgMeds')}</th><th>${t('residents.colPriority')}</th>
      <th style="text-align:right">${t('common.actions')}</th>
    </tr></thead>
    <tbody>
      ${rows.map(r => `<tr data-id="${r.id}" data-name="${escapeHtml(fullName(r.nom, r.prenom))}" style="cursor:pointer">
        <td><span class="badge badge-teal">${r.numero_chambre || '—'}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:.6rem">
            ${r.photo_url
              ? `<img src="${r.photo_url}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid var(--card-border)">`
              : `<div class="patient-avatar">${initials(r.nom, r.prenom)}</div>`}
            <div>
              <div style="font-weight:600">${fullName(r.nom, r.prenom)}</div>
              <div style="font-size:.75rem;color:var(--text-light)">${r.conditions_chroniques?.split('\n')[0] || ''}</div>
            </div>
          </div>
        </td>
        <td>${formatAge(r.date_naissance)} / ${r.sexe ? r.sexe[0] : '—'}</td>
        <td style="font-size:.85rem">${r.medecin_nom ? (r.medecin_titre || 'Dr.') + ' ' + r.medecin_nom : '—'}</td>
        <td style="font-size:.83rem">
          ${r.statut_depart === 'vacances'
            ? `<span class="badge" style="background:#dbeafe;color:#1d4ed8"><i class="bi bi-luggage-fill"></i> ${t('depart.badgeVacances')}</span>`
            : r.statut_depart === 'depart'
            ? `<span class="badge" style="background:#f3f4f6;color:#374151"><i class="bi bi-door-open-fill"></i> ${t('depart.badgeDeparture')}</span>`
            : r.statut_depart === 'deces'
            ? `<span class="badge" style="background:#fee2e2;color:#991b1b">✝ ${t('depart.badgeDeath')}</span>`
            : r.derniere_consultation
            ? `${formatDate(r.derniere_consultation)} <span style="color:${r.jours_sans_consultation > 30 ? '#dc2626' : r.jours_sans_consultation > 14 ? '#d97706' : 'var(--text-light)'};font-size:.75rem">(${r.jours_sans_consultation}${t('residents.daysAgo')})</span>`
            : `<span style="color:#dc2626;font-weight:600">${t('residents.never')}</span>`}
        </td>
        <td>
          ${r.traitements_urgents > 0
            ? `<span class="badge badge-alerte-24h"><i class="bi bi-exclamation-triangle-fill"></i> ${r.traitements_urgents}</span>`
            : r.traitements_bientot > 0
            ? `<span class="badge badge-alerte-3j">${r.traitements_bientot}</span>`
            : '<span style="color:var(--text-light);font-size:.8rem">—</span>'}
        </td>
        <td>
          <div>
            ${_prioriteBadge(r.niveau_priorite)}
            <div class="priority-bar" style="margin-top:.3rem">
              <div class="priority-bar-fill" style="width:${Math.min(100, r.score_priorite)}%;background:${r.score_priorite >= 60 ? '#dc2626' : r.score_priorite >= 30 ? '#d97706' : '#16a34a'}"></div>
            </div>
          </div>
        </td>
        <td><div class="table-actions">
          <button class="btn-icon" data-action="view"    title="Dossier"><i class="bi bi-folder2-open"></i></button>
          ${!r.statut_depart || r.statut_depart === 'vacances' ? `
            <button class="btn-icon" data-action="consult" title="Consultation"><i class="bi bi-journal-plus"></i></button>
            <button class="btn-icon" data-action="rdv"     title="RDV"><i class="bi bi-calendar-plus"></i></button>
          ` : ''}
          ${sa ? `<button class="btn-icon" data-action="edit"   title="Modifier"><i class="bi bi-pencil-fill"></i></button>` : ''}
          ${sa ? `<button class="btn-icon" data-action="delete" title="Supprimer" style="color:#dc2626"><i class="bi bi-trash3-fill"></i></button>` : ''}
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function _prioriteBadge(n) {
  const map = {
    1: `<span class="badge badge-priorite-1">${t('priority.p1')}</span>`,
    2: `<span class="badge badge-priorite-2">${t('priority.p2')}</span>`,
    3: `<span class="badge badge-priorite-3">${t('priority.p3')}</span>`,
  };
  return map[n] || map[3];
}

function _renderPagination(total) {
  const pages = Math.ceil(total / PAGE_SIZE);
  const wrap  = document.getElementById('res-pagination');
  if (!wrap || pages <= 1) { if (wrap) wrap.innerHTML = ''; return; }
  wrap.innerHTML = `<div class="pagination">
    <button class="page-btn" ${_page === 1 ? 'disabled' : ''} data-p="${_page - 1}"><i class="bi bi-chevron-left"></i></button>
    ${Array.from({length: pages}, (_, i) => i + 1).map(i =>
      Math.abs(i - _page) <= 2 || i === 1 || i === pages
        ? `<button class="page-btn ${i === _page ? 'active' : ''}" data-p="${i}">${i}</button>`
        : (Math.abs(i - _page) === 3 ? `<span style="padding:0 .3rem">…</span>` : '')
    ).join('')}
    <button class="page-btn" ${_page === pages ? 'disabled' : ''} data-p="${_page + 1}"><i class="bi bi-chevron-right"></i></button>
  </div>`;
  wrap.onclick = e => {
    const btn = e.target.closest('[data-p]');
    if (btn && !btn.disabled) { _page = +btn.dataset.p; _loadResidents(); }
  };
}

// ── Formulaire résident ─────────────────────────────────────
export async function openFormResident(id) {
  let res = null, existingContacts = [];

  if (id) {
    const [{ data }, { data: contacts }] = await Promise.all([
      db.from('residents').select('*').eq('id', id).single(),
      db.from('contacts_famille').select('*').eq('resident_id', id).order('est_principal', { ascending: false }),
    ]);
    res = data;
    existingContacts = contacts || [];
  }
  const r = res || {};

  const { data: docs } = await db.from('doctors').select('id,titre,nom,prenom').eq('actif', true).order('nom');
  const doctors = docs || [];
  const docOpts = doctors.map(d => `<option value="${d.id}" ${r.medecin_id === d.id ? 'selected' : ''}>${d.titre || 'Dr.'} ${d.prenom} ${d.nom}</option>`).join('');

  const contactsHTML = existingContacts.length
    ? existingContacts.map(c => _contactRowHTML(c)).join('')
    : _contactRowHTML({});

  const body = `<form id="form-res">

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-camera-fill"></i> ${t('residents.photo')} <span style="font-weight:400;font-size:.8rem;color:var(--text-light)">(${getLang()==='en'?'optional':'facultatif'})</span></div>
      <div style="display:flex;align-items:center;gap:1.25rem">
        <div id="photo-preview" style="width:76px;height:76px;border-radius:50%;background:var(--teal-pale);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;border:2px solid var(--card-border)">
          ${r.photo_url
            ? `<img src="${r.photo_url}" style="width:100%;height:100%;object-fit:cover">`
            : `<span id="photo-initials" style="font-size:1.6rem;font-weight:700;color:var(--teal-dark)">${initials(r.nom || '?', r.prenom || '?')}</span>`}
        </div>
        <div style="display:flex;flex-direction:column;gap:.5rem">
          <label class="btn btn-secondary btn-sm" style="cursor:pointer">
            <i class="bi bi-upload"></i> ${t('residents.photoChoose')}
            <input type="file" id="photo-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          </label>
          ${r.photo_url ? `<button type="button" id="btn-rm-photo" class="btn btn-secondary btn-sm" style="color:#dc2626;border-color:#dc2626"><i class="bi bi-trash3-fill"></i> ${t('residents.removePhoto')}</button>` : ''}
          <div style="font-size:.75rem;color:var(--text-light)">${t('residents.photoSizeNote')}</div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-person-fill"></i> ${t('residents.identity')}</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('residents.lastname')} <span class="required">*</span></label>
          <input class="form-control" name="nom" id="res-nom" value="${escapeHtml(r.nom || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t('residents.firstname')} <span class="required">*</span></label>
          <input class="form-control" name="prenom" id="res-prenom" value="${escapeHtml(r.prenom || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t('residents.roomNumber')}</label>
          <input class="form-control" name="numero_chambre" value="${escapeHtml(r.numero_chambre || '')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('residents.dob')}</label>
          <input class="form-control" type="date" name="date_naissance" value="${r.date_naissance || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('residents.sex')}</label>
          <select class="form-control" name="sexe">
            <option value="">—</option>
            <option value="Masculin" ${r.sexe === 'Masculin' ? 'selected' : ''}>${t('residents.sexM')}</option>
            <option value="Féminin" ${r.sexe === 'Féminin' ? 'selected' : ''}>${t('residents.sexF')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('residents.height')}</label>
          <input class="form-control" type="number" step=".1" min="100" max="220" name="taille" value="${r.taille || ''}" placeholder="ex: 165">
        </div>
        <div class="form-group">
          <label class="form-label">${t('residents.entryDate')}</label>
          <input class="form-control" type="date" name="date_entree" value="${r.date_entree || new Date().toISOString().slice(0, 10)}">
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-person-badge-fill"></i> ${t('residents.sectionMedDoctor')}</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('residents.treatingDoctor')}</label>
          <select class="form-control" name="medecin_id">
            <option value="">${t('residents.noneDoctor')}</option>${docOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('residents.priorityLevel')}</label>
          <select class="form-control" name="niveau_priorite">
            <option value="1" ${(r.niveau_priorite || 3) === 1 ? 'selected' : ''}>${t('residents.p1option')}</option>
            <option value="2" ${(r.niveau_priorite || 3) === 2 ? 'selected' : ''}>${t('residents.p2option')}</option>
            <option value="3" ${(r.niveau_priorite || 3) === 3 ? 'selected' : ''}>${t('residents.p3option')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('residents.mobility')}</label>
          <select class="form-control" name="mobilite">
            <option value="">—</option>
            <option value="Autonome" ${r.mobilite === 'Autonome' ? 'selected' : ''}>${t('residents.mobilityAuto')}</option>
            <option value="Assistance partielle" ${r.mobilite === 'Assistance partielle' ? 'selected' : ''}>${t('residents.mobilityPartial')}</option>
            <option value="Fauteuil roulant" ${r.mobilite === 'Fauteuil roulant' ? 'selected' : ''}>${t('residents.mobilityChair')}</option>
            <option value="Alitement" ${r.mobilite === 'Alitement' ? 'selected' : ''}>${t('residents.mobilityBed')}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-clipboard2-pulse"></i> ${t('residents.sectionMedicalData')}</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('residents.bloodGroup')}</label>
          <select class="form-control" name="groupe_sanguin">
            <option value="">—</option>
            ${['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => `<option ${r.groupe_sanguin === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('residents.allergiesLabel')}</label>
        <textarea class="form-control" name="allergies" rows="2">${escapeHtml(r.allergies || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">${t('residents.history')}</label>
        <textarea class="form-control" name="antecedents" rows="2">${escapeHtml(r.antecedents || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">${t('residents.chronic')}</label>
        <textarea class="form-control" name="conditions_chroniques" rows="2">${escapeHtml(r.conditions_chroniques || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">${t('residents.medNotes')}</label>
        <textarea class="form-control" name="notes_medicales" rows="2">${escapeHtml(r.notes_medicales || '')}</textarea>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">
        <i class="bi bi-telephone"></i> ${t('residents.familyContacts')}
        <button type="button" id="btn-add-contact" class="btn btn-secondary btn-sm" style="margin-left:auto">
          <i class="bi bi-plus-lg"></i> ${t('residents.addContact')}
        </button>
      </div>
      <div id="contacts-container">${contactsHTML}</div>
    </div>
  </form>`;

  openModal(
    id ? `<i class="bi bi-pencil-fill"></i> ${t('residents.formTitleEdit')}` : `<i class="bi bi-person-plus-fill"></i> ${t('residents.formTitle')}`,
    body,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
      { label: id ? t('common.modify') : t('common.save'), cls: 'btn btn-primary', action: () => _submitResident(id) }
    ], 'modal-xl'
  );

  _initFormEvents(r, !id);
}

function _contactRowHTML(c) {
  return `<div class="contact-row" style="background:var(--bg-alt);border-radius:var(--radius-sm);padding:.85rem;margin-bottom:.6rem">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('residents.contactName')}</label>
        <input class="form-control contact-nom" placeholder="${getLang()==='en'?'Contact name':'Nom du contact'}" value="${escapeHtml(c.nom || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('residents.contactPhone')}</label>
        <input class="form-control contact-tel" placeholder="+230 5XXX XXXX" value="${escapeHtml(c.telephone || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('residents.contactRelation')}</label>
        <input class="form-control contact-relation" placeholder="${getLang()==='en'?'Son, Daughter…':'Fils, Fille, Neveu…'}" value="${escapeHtml(c.relation || '')}">
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:.75rem;margin-top:.5rem">
      <label style="display:flex;align-items:center;gap:.5rem;font-size:.83rem;cursor:pointer">
        <input type="checkbox" class="contact-principal" ${c.est_principal ? 'checked' : ''}>
        ${t('residents.contactPrimary')}
      </label>
      <button type="button" class="btn-icon btn-rm-contact" style="color:#dc2626;margin-left:auto" title="${t('residents.removeContact')}">
        <i class="bi bi-trash3-fill"></i>
      </button>
    </div>
  </div>`;
}

function _initFormEvents(r, isNew) {
  // Photo preview
  document.getElementById('photo-input')?.addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toastError(t('residents.photoTooLarge')); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = ev => {
      document.getElementById('photo-preview').innerHTML =
        `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover">`;
    };
    reader.readAsDataURL(f);
  });

  // Mise à jour des initiales en temps réel (seulement à la création)
  if (isNew) {
    ['res-nom', 'res-prenom'].forEach(fid => {
      document.getElementById(fid)?.addEventListener('input', () => {
        const el = document.getElementById('photo-initials');
        if (!el) return;
        const nom    = document.getElementById('res-nom')?.value || '';
        const prenom = document.getElementById('res-prenom')?.value || '';
        el.textContent = initials(nom || '?', prenom || '?');
      });
    });
  }

  // Supprimer photo existante
  document.getElementById('btn-rm-photo')?.addEventListener('click', () => {
    document.getElementById('photo-preview').innerHTML =
      `<span id="photo-initials" style="font-size:1.6rem;font-weight:700;color:var(--teal-dark)">${initials(r.nom || '?', r.prenom || '?')}</span>`;
    const fi = document.getElementById('photo-input');
    if (fi) fi.value = '';
    document.getElementById('photo-preview').dataset.removed = 'true';
  });

  // Ajouter un contact
  document.getElementById('btn-add-contact')?.addEventListener('click', () => {
    const div = document.createElement('div');
    div.innerHTML = _contactRowHTML({});
    const row = div.firstElementChild;
    document.getElementById('contacts-container')?.appendChild(row);
    _initContactRemove(row);
  });

  // Init suppression sur les contacts existants
  document.querySelectorAll('.contact-row').forEach(row => _initContactRemove(row));
}

function _initContactRemove(row) {
  row.querySelector('.btn-rm-contact')?.addEventListener('click', () => {
    const c = document.getElementById('contacts-container');
    if (c && c.querySelectorAll('.contact-row').length <= 1) {
      toastError(t('residents.minContact'));
      return;
    }
    row.remove();
  });
}

async function _submitResident(id) {
  const form = document.getElementById('form-res');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const fd   = new FormData(form);
  const data = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));

  // Photo
  const photoFile    = document.getElementById('photo-input')?.files[0];
  const photoRemoved = document.getElementById('photo-preview')?.dataset.removed === 'true';

  if (photoFile) {
    const ext  = photoFile.name.split('.').pop().toLowerCase();
    const path = `residents/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await db.storage
      .from('photos-residents')
      .upload(path, photoFile, { contentType: photoFile.type || 'image/jpeg' });
    if (upErr) {
      // Upload échoué : on sauvegarde quand même le résident sans photo
      toastError(t('residents.uploadErrPhoto') + ' — ' + upErr.message);
    } else {
      const { data: urlData } = db.storage.from('photos-residents').getPublicUrl(path);
      data.photo_url = urlData?.publicUrl ?? null;
    }
  } else if (photoRemoved) {
    data.photo_url = null;
  }

  // Collecter les contacts depuis le DOM
  const contacts = [];
  document.querySelectorAll('.contact-row').forEach(row => {
    const nom = row.querySelector('.contact-nom')?.value?.trim();
    if (!nom) return;
    contacts.push({
      nom,
      telephone:     row.querySelector('.contact-tel')?.value?.trim() || null,
      relation:      row.querySelector('.contact-relation')?.value?.trim() || null,
      est_principal: row.querySelector('.contact-principal')?.checked || false,
    });
  });

  // Sauvegarder le résident
  let residentId = id;
  if (id) {
    const { error } = await db.from('residents').update(data).eq('id', id);
    if (error) { toastError(error.message); return; }
  } else {
    const { data: newRes, error } = await db.from('residents').insert(data).select('id').single();
    if (error) { toastError(error.message); return; }
    residentId = newRes.id;
  }

  // Sauvegarder les contacts : supprimer les anciens, insérer les nouveaux
  await db.from('contacts_famille').delete().eq('resident_id', residentId);
  if (contacts.length > 0) {
    const { error: cErr } = await db.from('contacts_famille').insert(
      contacts.map(c => ({ ...c, resident_id: residentId }))
    );
    if (cErr) console.warn('Erreur contacts:', cErr);
  }

  toastSuccess(id ? t('residents.saved') : t('residents.saved'));
  closeModal();
  _loadResidents();
}

// ── Profil résident ─────────────────────────────────────────
export async function openResidentProfile(id) {
  return isReceptionist() ? _openProfileAccueil(id) : _openProfile(id);
}

async function _openProfile(id) {
  const [resRes, consRes, traitRes, rdvRes, contactsRes, histSortiesRes, histCoursesRes] = await Promise.all([
    db.from('v_residents_priorite').select('*').eq('id', id).single(),
    db.from('v_consultations_detail').select('*').eq('resident_id', id).order('date_consultation', { ascending: false }).limit(10),
    db.from('v_traitements_actifs').select('*').eq('resident_id', id),
    db.from('v_rdv_detail').select('*').eq('resident_id', id).order('date_rdv', { ascending: false }).limit(8),
    db.from('contacts_famille').select('*').eq('resident_id', id).order('est_principal', { ascending: false }),
    db.from('historique_sorties').select('*').eq('resident_id', id).order('date_sortie', { ascending: false }),
    db.from('courses').select('*').eq('resident_id', id).order('date_sortie', { ascending: false }).order('heure_depart', { ascending: false }),
  ]);

  const r             = resRes.data;
  const cons          = consRes.data || [];
  const trais         = traitRes.data || [];
  const rdvs          = rdvRes.data || [];
  const contacts      = contactsRes.data || [];
  const histSorties   = histSortiesRes.data || [];
  const histCourses   = histCoursesRes.data || [];
  if (!r) return;

  const sa         = isSuperAdmin();
  const isArchived = r.statut_depart === 'deces' || r.statut_depart === 'depart';
  const isVacances = r.statut_depart === 'vacances';
  const isActive   = !r.statut_depart;

  const contactsHTML = contacts.length
    ? contacts.map(c => `
        <div style="display:flex;align-items:flex-start;gap:.75rem;padding:.65rem 0;border-bottom:1px solid var(--card-border)">
          <i class="bi bi-person-circle" style="color:var(--teal-light);font-size:1.2rem;margin-top:.1rem"></i>
          <div style="flex:1">
            <div style="font-weight:600">${escapeHtml(c.nom)}
              ${c.est_principal ? `<span class="badge badge-teal" style="font-size:.68rem;margin-left:.4rem">${t('residents.primaryBadge')}</span>` : ''}
              ${c.relation ? `<span style="color:var(--text-light);font-weight:400"> — ${escapeHtml(c.relation)}</span>` : ''}
            </div>
            ${c.telephone ? `<div style="font-size:.83rem;color:var(--text-light);margin-top:.15rem"><i class="bi bi-telephone"></i> ${escapeHtml(c.telephone)}</div>` : ''}
          </div>
        </div>`).join('')
    : `<div class="empty-state" style="padding:1.5rem"><i class="bi bi-telephone-x"></i><p>${t('residents.noContacts')}</p></div>`;

  // Bannière de statut pour dossiers archivés
  const archiveBanner = r.statut_depart === 'deces' ? `
    <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:var(--radius-sm);padding:.8rem 1rem;margin:.5rem 0 .25rem;display:flex;align-items:center;gap:.75rem">
      <span style="font-size:1.5rem;color:#991b1b;line-height:1">✝</span>
      <div style="flex:1">
        <div style="font-weight:700;color:#991b1b">${t('depart.profileDeceased')}</div>
        ${r.date_sortie ? `<div style="font-size:.82rem;color:#7f1d1d;margin-top:.1rem">${t('depart.deceasedOn')} ${formatDate(r.date_sortie)}</div>` : ''}
        ${r.motif_deces ? `<div style="font-size:.82rem;color:#7f1d1d;margin-top:.2rem;font-style:italic">${escapeHtml(r.motif_deces)}</div>` : ''}
      </div>
      <span class="badge" style="background:#fecaca;color:#991b1b;font-size:.78rem;white-space:nowrap"><i class="bi bi-lock-fill"></i> ${t('depart.archivedReadOnly')}</span>
    </div>
  ` : r.statut_depart === 'depart' ? `
    <div style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:var(--radius-sm);padding:.8rem 1rem;margin:.5rem 0 .25rem;display:flex;align-items:center;gap:.75rem">
      <i class="bi bi-door-open-fill" style="font-size:1.4rem;color:#6b7280"></i>
      <div style="flex:1">
        <div style="font-weight:700;color:#374151">${t('depart.profileDeparted')}</div>
        ${r.date_sortie ? `<div style="font-size:.82rem;color:#6b7280;margin-top:.1rem">${t('depart.departedOn')} ${formatDate(r.date_sortie)}</div>` : ''}
        ${r.motif_sortie ? `<div style="font-size:.82rem;color:#6b7280;margin-top:.2rem;font-style:italic">${escapeHtml(r.motif_sortie)}</div>` : ''}
      </div>
      <span class="badge" style="background:#e5e7eb;color:#374151;font-size:.78rem;white-space:nowrap"><i class="bi bi-lock-fill"></i> ${t('depart.archivedReadOnly')}</span>
    </div>
  ` : '';

  const readOnlyNotice = `
    <div style="background:var(--bg-alt);border-radius:var(--radius-sm);padding:.5rem .9rem;margin-bottom:.75rem;font-size:.82rem;color:var(--text-light)">
      <i class="bi bi-lock-fill"></i> ${t('depart.archivedReadOnly')}
    </div>`;

  const body = `
    <div class="resident-profile-head">
      ${r.photo_url
        ? `<img src="${r.photo_url}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(255,255,255,.3);${r.statut_depart === 'deces' ? 'filter:grayscale(60%)' : ''}">`
        : `<div class="resident-avatar-lg" style="${r.statut_depart === 'deces' ? 'filter:grayscale(60%)' : ''}">${initials(r.nom, r.prenom)}</div>`}
      <div>
        <div style="font-family:Georgia,serif;font-size:1.25rem;font-weight:700">${fullName(r.nom, r.prenom)}</div>
        <div style="font-size:.85rem;opacity:.8;margin-top:.2rem">
          Ch. ${r.numero_chambre || '—'} &bull; ${formatAge(r.date_naissance)} &bull; ${r.sexe || '—'}
          ${r.taille ? ` &bull; ${r.taille} cm` : ''}
        </div>
        ${!isArchived ? `<div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap">
          ${_prioriteBadge(r.niveau_priorite)}
          ${r.traitements_urgents > 0 ? `<span class="badge badge-alerte-24h"><i class="bi bi-capsule-pill"></i> ${r.traitements_urgents} ${t('residents.urgMeds')}</span>` : ''}
          ${!r.derniere_consultation ? `<span class="badge badge-expire">${t('residents.neverConsulted')}</span>` : ''}
        </div>` : ''}
      </div>
    </div>
    ${archiveBanner}

    <div class="tabs">
      <button class="tab-btn active" data-tab="infos">${t('residents.tabInfo')}</button>
      <button class="tab-btn" data-tab="contacts">${t('residents.tabContacts')} (${contacts.length})</button>
      <button class="tab-btn" data-tab="traitements">${isArchived ? t('depart.tabHistorique') : t('residents.tabTreatments')} (${trais.length})</button>
      <button class="tab-btn" data-tab="consultations">${t('residents.tabConsultations')} (${cons.length})</button>
      ${!isArchived ? `<button class="tab-btn" data-tab="rdv">${t('residents.tabRdv')} (${rdvs.length})</button>` : ''}
    </div>

    <div class="tab-pane active" data-pane="infos">
      <table style="width:100%;font-size:.9rem">
        ${_row(t('residents.treatingDoctor'), r.medecin_nom ? (r.medecin_titre || 'Dr.') + ' ' + r.medecin_prenom + ' ' + r.medecin_nom : '—')}
        ${_row(t('residents.profileLabelAdmission'), formatDate(r.date_entree))}
        ${r.statut_depart === 'deces' && r.date_sortie ? _row(t('depart.deceasedOn'), `<strong style="color:#991b1b">${formatDate(r.date_sortie)}</strong>`) : ''}
        ${r.statut_depart === 'deces' && r.motif_deces ? _row(getLang() === 'en' ? 'Cause of death' : 'Cause du décès', escapeHtml(r.motif_deces)) : ''}
        ${r.statut_depart === 'depart' && r.date_sortie ? _row(t('depart.departedOn'), formatDate(r.date_sortie)) : ''}
        ${r.statut_depart === 'depart' && r.motif_sortie ? _row(getLang() === 'en' ? 'Reason' : 'Motif', escapeHtml(r.motif_sortie)) : ''}
        ${_row(t('residents.bloodGroup'), r.groupe_sanguin || '—')}
        ${_row(t('residents.heightShort'), r.taille ? r.taille + ' cm' : '—')}
        ${_row(t('residents.mobility'), r.mobilite || '—')}
        ${_row(t('residents.allergies'), escapeHtml(r.allergies) || '—')}
        ${_row(t('residents.historyShort'), escapeHtml(r.antecedents) || '—')}
        ${_row(t('residents.chronic'), escapeHtml(r.conditions_chroniques) || '—')}
        ${r.notes_medicales ? _row(t('common.notes'), escapeHtml(r.notes_medicales)) : ''}
        ${!isArchived ? `
          ${_row(t('residents.profileLabelLastConsult'), r.derniere_consultation
            ? formatDate(r.derniere_consultation, { time: true }) + ' (' + r.jours_sans_consultation + ' ' + t('common.days') + ')'
            : `<span style="color:#dc2626">${t('residents.never')}</span>`)}
          ${_row(t('residents.profileLabelScore'), r.score_priorite + ' / 100+')}
        ` : ''}
      </table>
      ${histSorties.length ? `
        <div style="margin-top:1.25rem">
          <div style="font-weight:600;font-size:.85rem;color:var(--teal-dark);margin-bottom:.5rem;display:flex;align-items:center;gap:.4rem">
            <i class="bi bi-luggage-fill"></i> ${t('historiqueSorties.sectionTitle')} (${histSorties.length})
          </div>
          <div class="table-wrap"><table class="table" style="font-size:.82rem">
            <thead><tr>
              <th>${t('historiqueSorties.colDateSortie')}</th>
              <th>${t('historiqueSorties.colDateRetour')}</th>
              <th>${t('historiqueSorties.colMotif')}</th>
            </tr></thead>
            <tbody>
              ${histSorties.map(h => `<tr>
                <td>${h.date_sortie ? formatDate(h.date_sortie, { time: true }) : '—'}</td>
                <td>${h.date_retour ? formatDate(h.date_retour, { time: true }) : '—'}</td>
                <td style="color:var(--text-light)">${escapeHtml(h.motif_sortie || '—')}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>` : ''}
      ${histCourses.length ? `
        <div style="margin-top:1.25rem">
          <div style="font-weight:600;font-size:.85rem;color:var(--teal-dark);margin-bottom:.5rem;display:flex;align-items:center;gap:.4rem">
            <i class="bi bi-bag-fill"></i> ${t('historiqueCourses.sectionTitle')} (${histCourses.length})
          </div>
          <div class="table-wrap"><table class="table" style="font-size:.82rem">
            <thead><tr>
              <th>${t('historiqueCourses.colDate')}</th>
              <th>${t('historiqueCourses.colDepart')}</th>
              <th>${t('historiqueCourses.colRetour')}</th>
              <th>${t('historiqueCourses.colArticles')}</th>
              <th>${t('historiqueCourses.colStatut')}</th>
            </tr></thead>
            <tbody>
              ${histCourses.map(c => {
                const rentre = c.est_rentre;
                const dehors = !c.est_rentre && c.heure_depart;
                return `<tr>
                  <td>${formatDate(c.date_sortie)}</td>
                  <td style="font-weight:600">${c.heure_depart ? c.heure_depart.slice(0,5) : '—'}</td>
                  <td>${c.heure_retour ? c.heure_retour.slice(0,5) : '—'}</td>
                  <td style="color:var(--text-light);max-width:180px;white-space:pre-wrap">${escapeHtml(c.articles || '—')}</td>
                  <td><span class="badge ${rentre ? 'badge-actif' : (dehors ? 'badge-attente' : 'badge-teal')}">
                    ${rentre ? t('courses.statusRentre') : (dehors ? t('courses.statusDehors') : t('courses.statusPlanned'))}
                  </span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table></div>
        </div>` : ''}
    </div>

    <div class="tab-pane" data-pane="contacts">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <span style="font-size:.82rem;color:var(--text-light)">${contacts.length} ${t('residents.contactCount')}</span>
        ${sa && !isArchived ? `<button class="btn btn-secondary btn-sm" id="btn-edit-contacts"><i class="bi bi-pencil-fill"></i> Modifier</button>` : ''}
      </div>
      ${contactsHTML}
    </div>

    <div class="tab-pane" data-pane="traitements">
      ${isArchived ? readOnlyNotice : `
        <div style="display:flex;justify-content:flex-end;margin-bottom:1rem">
          <button class="btn btn-primary btn-sm" id="btn-add-trait" data-rid="${r.id}">
            <i class="bi bi-plus-lg"></i> ${t('residents.addTreatmentBtn')}
          </button>
        </div>
      `}
      ${trais.length ? trais.map(tr => `
        <div class="consult-mini">
          <div class="consult-mini-header">
            <span style="font-weight:700">${tr.nom_medicament}${tr.dosage ? ' — ' + tr.dosage : ''}</span>
            ${isArchived ? '' : _alerteBadge(tr.statut_alerte, tr.jours_restants)}
          </div>
          <div class="consult-mini-body">${tr.posologie}</div>
          <div style="font-size:.77rem;color:var(--text-light);margin-top:.3rem">
            ${tr.traitement_chronique ? t('residents.chronicTreatment') : `${t('residents.fromDate')} ${formatDate(tr.date_debut)} ${t('residents.toDate')} ${formatDate(tr.date_fin)}`}
            ${!isArchived && tr.jours_restants !== null ? ` &bull; <strong>${tr.jours_restants} ${t('residents.daysLeft')}</strong>` : ''}
          </div>
        </div>`).join('')
        : `<div class="empty-state"><i class="bi bi-capsule"></i><p>${t('residents.noTreatments')}</p></div>`}
    </div>

    <div class="tab-pane" data-pane="consultations">
      ${cons.length ? cons.map(c => `
        <div class="consult-mini">
          <div class="consult-mini-header">
            <span class="consult-mini-date">${formatDate(c.date_consultation, { time: true })}</span>
            <span style="font-size:.8rem;color:var(--text-light)">${c.medecin_titre || ''} ${c.medecin_nom || ''}</span>
          </div>
          <div class="consult-mini-body">${c.diagnostic || c.motif || '—'}</div>
          ${c.ordonnance_url ? `<div style="margin-top:.4rem"><a href="${c.ordonnance_url}" target="_blank" class="btn btn-secondary btn-sm"><i class="bi bi-file-earmark-pdf-fill"></i> ${t('consultations.prescriptionView')}</a></div>` : ''}
        </div>`).join('')
        : `<div class="empty-state"><i class="bi bi-journal-x"></i><p>${t('residents.noConsult')}</p></div>`}
    </div>

    ${!isArchived ? `<div class="tab-pane" data-pane="rdv">
      ${rdvs.length ? rdvs.map(rv => `
        <div class="consult-mini">
          <div class="consult-mini-header">
            <span class="consult-mini-date">${formatDate(rv.date_rdv, { time: true })}</span>
            <span class="badge ${rv.statut === 'effectue' ? 'badge-confirme' : rv.statut === 'annule' ? 'badge-annule' : 'badge-planifie'}">${t('status.' + rv.statut) || rv.statut}</span>
          </div>
          <div class="consult-mini-body">${rv.motif || t('appointments.title')} — ${rv.medecin_titre || ''} ${rv.medecin_nom || ''}</div>
        </div>`).join('')
        : `<div class="empty-state"><i class="bi bi-calendar-x"></i><p>${t('residents.noRdv')}</p></div>`}
    </div>` : ''}`;

  // Titre et boutons du modal selon le statut
  const modalTitle = r.statut_depart === 'deces'
    ? `✝ ${t('depart.profileDeceased')} — ${fullName(r.nom, r.prenom)}`
    : r.statut_depart === 'depart'
    ? `<i class="bi bi-door-open-fill"></i> ${t('depart.profileDeparted')}`
    : `<i class="bi bi-folder2-open"></i> ${t('residents.profileTitle')}`;

  const pdfLabel = r.statut_depart === 'deces'
    ? `<i class="bi bi-file-earmark-pdf-fill"></i> ${t('depart.pdfDeces')}`
    : r.statut_depart === 'depart'
    ? `<i class="bi bi-file-earmark-pdf-fill"></i> ${t('depart.pdfDepart')}`
    : `<i class="bi bi-file-earmark-pdf-fill"></i> ${t('common.export')}`;

  openModal(modalTitle, body, [
    // Modifier : super_admin uniquement, jamais pour les décédés
    ...(sa && r.statut_depart !== 'deces' ? [{ label: t('common.modify'), cls: 'btn btn-secondary btn-sm', action: () => { closeModal(); openFormResident(id); } }] : []),
    // Nouvelle consultation : actif ou vacances seulement
    ...(isActive || isVacances ? [{ label: t('residents.newConsult'), cls: 'btn btn-primary btn-sm', action: () => { closeModal(); openFormConsultation(null, id); } }] : []),
    // PDF : toujours visible, libellé selon statut — ouvre le choix du contenu
    { label: pdfLabel, cls: 'btn btn-secondary btn-sm', action: () => _openExportChoice(r, cons, trais, contacts, histSorties, histCourses) },
    // Retour au foyer (vacances)
    ...(isVacances ? [{ label: `<i class="bi bi-house-fill"></i> ${t('depart.btnRestore')}`, cls: 'btn btn-success btn-sm', action: () => { closeModal(); _openRestoreModal(r); } }] : []),
    // Gérer sortie : actif + super_admin → toutes options; actif + admin → vacances uniquement
    ...(isActive && sa  ? [{ label: `<i class="bi bi-box-arrow-right"></i> ${t('depart.btnExit')}`, cls: 'btn btn-secondary btn-sm', action: () => { closeModal(); _openDepartModal(r); } }] : []),
    ...(isActive && !sa ? [{ label: `<i class="bi bi-luggage-fill"></i> ${t('depart.typeVacances')}`, cls: 'btn btn-secondary btn-sm', action: () => { closeModal(); _openDepartModal(r); } }] : []),
    { label: t('common.close'), cls: 'btn btn-secondary btn-sm', action: closeModal }
  ], 'modal-xl');

  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn,.tab-pane').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`[data-pane="${btn.dataset.tab}"]`)?.classList.add('active');
    })
  );

  document.getElementById('btn-add-trait')?.addEventListener('click', e => {
    closeModal();
    // currentTarget : un clic sur l'icône <i> du bouton ne porte pas data-rid
    _openFormTraitement(null, e.currentTarget.dataset.rid);
  });

  document.getElementById('btn-edit-contacts')?.addEventListener('click', () => {
    closeModal();
    openFormResident(id);
  });
}

// ── Profil réceptionniste : identité, contacts, visites — rien de médical ──
async function _openProfileAccueil(id) {
  const [resRes, contactsRes, histSortiesRes, histCoursesRes, visitesRes] = await Promise.all([
    db.from('v_residents_public').select('*').eq('id', id).single(),
    db.from('contacts_famille').select('*').eq('resident_id', id).order('est_principal', { ascending: false }),
    db.from('historique_sorties').select('*').eq('resident_id', id).order('date_sortie', { ascending: false }),
    db.from('courses').select('*').eq('resident_id', id).order('date_sortie', { ascending: false }),
    db.from('visites').select('*').eq('resident_id', id).order('date_visite', { ascending: false }).limit(10),
  ]);

  const r           = resRes.data;
  const contacts    = contactsRes.data || [];
  const histSorties = histSortiesRes.data || [];
  const histCourses = histCoursesRes.data || [];
  const visites     = visitesRes.data || [];
  if (!r) return;

  const isVacances = r.statut_depart === 'vacances';
  const isActive   = !r.statut_depart;

  const contactsHTML = contacts.length
    ? contacts.map(c => `
        <div style="display:flex;align-items:flex-start;gap:.75rem;padding:.65rem 0;border-bottom:1px solid var(--card-border)">
          <i class="bi bi-person-circle" style="color:var(--teal-light);font-size:1.2rem;margin-top:.1rem"></i>
          <div style="flex:1">
            <div style="font-weight:600">${escapeHtml(c.nom)}
              ${c.est_principal ? `<span class="badge badge-teal" style="font-size:.68rem;margin-left:.4rem">${t('residents.primaryBadge')}</span>` : ''}
              ${c.relation ? `<span style="color:var(--text-light);font-weight:400"> — ${escapeHtml(c.relation)}</span>` : ''}
            </div>
            ${c.telephone ? `<div style="font-size:.83rem;color:var(--text-light);margin-top:.15rem"><i class="bi bi-telephone"></i> ${escapeHtml(c.telephone)}</div>` : ''}
          </div>
        </div>`).join('')
    : `<div class="empty-state" style="padding:1.5rem"><i class="bi bi-telephone-x"></i><p>${t('residents.noContacts')}</p></div>`;

  const body = `
    <div class="resident-profile-head">
      ${r.photo_url
        ? `<img src="${r.photo_url}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(255,255,255,.3)">`
        : `<div class="resident-avatar-lg">${initials(r.nom, r.prenom)}</div>`}
      <div>
        <div style="font-family:Georgia,serif;font-size:1.25rem;font-weight:700">${fullName(r.nom, r.prenom)}</div>
        <div style="font-size:.85rem;opacity:.8;margin-top:.2rem">
          Ch. ${r.numero_chambre || '—'} &bull; ${formatAge(r.date_naissance)} &bull; ${r.sexe || '—'}
        </div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="infos">${t('residents.tabInfo')}</button>
      <button class="tab-btn" data-tab="contacts">${t('residents.tabContacts')} (${contacts.length})</button>
      <button class="tab-btn" data-tab="visites">${t('visites.title')} (${visites.length})</button>
    </div>

    <div class="tab-pane active" data-pane="infos">
      <table style="width:100%;font-size:.9rem">
        ${_row(t('residents.profileLabelAdmission'), formatDate(r.date_entree))}
        ${r.statut_depart === 'vacances' && r.date_sortie ? _row(t('depart.badgeVacances'), formatDate(r.date_sortie) + (r.date_retour_prevue ? ' → ' + formatDate(r.date_retour_prevue) : '')) : ''}
        ${r.statut_depart === 'depart' && r.date_sortie ? _row(t('depart.departedOn'), formatDate(r.date_sortie)) : ''}
      </table>
      ${histSorties.length ? `
        <div style="margin-top:1.25rem">
          <div style="font-weight:600;font-size:.85rem;color:var(--teal-dark);margin-bottom:.5rem">
            <i class="bi bi-luggage-fill"></i> ${t('historiqueSorties.sectionTitle')} (${histSorties.length})
          </div>
          <div class="table-wrap"><table class="table" style="font-size:.82rem">
            <thead><tr><th>${t('historiqueSorties.colDateSortie')}</th><th>${t('historiqueSorties.colDateRetour')}</th><th>${t('historiqueSorties.colMotif')}</th></tr></thead>
            <tbody>${histSorties.map(h => `<tr>
              <td>${h.date_sortie ? formatDate(h.date_sortie, { time: true }) : '—'}</td>
              <td>${h.date_retour ? formatDate(h.date_retour, { time: true }) : '—'}</td>
              <td style="color:var(--text-light)">${escapeHtml(h.motif_sortie || '—')}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>` : ''}
      ${histCourses.length ? `
        <div style="margin-top:1.25rem">
          <div style="font-weight:600;font-size:.85rem;color:var(--teal-dark);margin-bottom:.5rem">
            <i class="bi bi-bag-fill"></i> ${t('historiqueCourses.sectionTitle')} (${histCourses.length})
          </div>
          <div class="table-wrap"><table class="table" style="font-size:.82rem">
            <thead><tr><th>${t('historiqueCourses.colDate')}</th><th>${t('historiqueCourses.colDepart')}</th><th>${t('historiqueCourses.colRetour')}</th><th>${t('historiqueCourses.colStatut')}</th></tr></thead>
            <tbody>${histCourses.map(c => `<tr>
              <td>${formatDate(c.date_sortie)}</td>
              <td>${c.heure_depart ? c.heure_depart.slice(0,5) : '—'}</td>
              <td>${c.heure_retour ? c.heure_retour.slice(0,5) : '—'}</td>
              <td><span class="badge ${c.est_rentre ? 'badge-actif' : (c.heure_depart ? 'badge-attente' : 'badge-teal')}">
                ${c.est_rentre ? t('courses.statusRentre') : (c.heure_depart ? t('courses.statusDehors') : t('courses.statusPlanned'))}
              </span></td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>` : ''}
    </div>

    <div class="tab-pane" data-pane="contacts">${contactsHTML}</div>

    <div class="tab-pane" data-pane="visites">
      ${visites.length ? visites.map(v => `
        <div class="consult-mini">
          <div class="consult-mini-header">
            <span class="consult-mini-date">${formatDate(v.date_visite)}</span>
            <span class="badge ${v.statut === 'terminee' ? 'badge-actif' : v.statut === 'annulee' ? 'badge-annule' : 'badge-planifie'}">${t('visites.status' + v.statut.charAt(0).toUpperCase() + v.statut.slice(1).replace('_c','C')) || v.statut}</span>
          </div>
          <div class="consult-mini-body">${escapeHtml(fullName(v.visiteur_nom, v.visiteur_prenom))}${v.relation ? ' — ' + escapeHtml(v.relation) : ''} (${v.nb_personnes || 1} pers.)</div>
        </div>`).join('')
        : `<div class="empty-state"><i class="bi bi-person-x"></i><p>${t('visites.noVisits')}</p></div>`}
    </div>`;

  openModal(`<i class="bi bi-folder2-open"></i> ${t('residents.profileTitle')}`, body, [
    { label: `<i class="bi bi-file-earmark-pdf-fill"></i> ${t('common.export')}`, cls: 'btn btn-secondary btn-sm',
      action: () => _exportPDF(r, [], [], contacts, histSorties, histCourses, 'admin') },
    ...(isActive ? [{ label: `<i class="bi bi-luggage-fill"></i> ${t('depart.typeVacances')}`, cls: 'btn btn-secondary btn-sm',
      action: () => { closeModal(); _openVacancesAccueil(r); } }] : []),
    ...(isVacances ? [{ label: `<i class="bi bi-house-fill"></i> ${t('depart.btnRestore')}`, cls: 'btn btn-success btn-sm',
      action: async () => {
        const { data, error } = await db.rpc('fn_accueil_retour', { p_resident_id: r.id });
        if (error || !data) { toastError(error?.message || t('depart.restoreErr')); return; }
        toastSuccess(t('depart.restoreOk'));
        closeModal();
        _loadResidents();
      } }] : []),
    { label: t('common.close'), cls: 'btn btn-secondary btn-sm', action: closeModal }
  ], 'modal-xl');

  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn,.tab-pane').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`[data-pane="${btn.dataset.tab}"]`)?.classList.add('active');
    })
  );
}

// Sortie vacances côté accueil — passe par la RPC (RLS bloque l'UPDATE direct)
function _openVacancesAccueil(r) {
  const body = `<form id="form-vac">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('depart.exitDate')}</label>
        <input class="form-control" type="datetime-local" name="date_sortie" value="${nowLocalInput()}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('depart.returnDate')}</label>
        <input class="form-control" type="date" name="date_retour_prevue">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('depart.exitReason')}</label>
      <textarea class="form-control" name="motif_sortie" rows="2"></textarea>
    </div>
  </form>`;

  openModal(`<i class="bi bi-luggage-fill"></i> ${t('depart.typeVacances')} — ${fullName(r.nom, r.prenom)}`, body, [
    { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
    { label: t('common.save'), cls: 'btn btn-primary', action: async () => {
      const fd = new FormData(document.getElementById('form-vac'));
      const { data, error } = await db.rpc('fn_accueil_sortie_vacances', {
        p_resident_id: r.id,
        p_date_sortie: fd.get('date_sortie') ? new Date(fd.get('date_sortie')).toISOString() : new Date().toISOString(),
        p_date_retour_prevue: fd.get('date_retour_prevue') || null,
        p_motif: fd.get('motif_sortie') || null,
      });
      if (error || !data) { toastError(error?.message || t('depart.saveErr')); return; }
      toastSuccess(t('depart.confirmed'));
      closeModal();
      _loadResidents();
    }}
  ], 'modal-lg');
}

function _row(label, val) {
  return `<tr>
    <td style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:var(--text-light);padding:.5rem 0;width:38%;vertical-align:top">${label}</td>
    <td style="padding:.5rem 0">${val}</td>
  </tr>`;
}

function _alerteBadge(s, jours) {
  const map = {
    'alerte_24h':         `<span class="badge badge-alerte-24h"><i class="bi bi-exclamation-triangle-fill"></i> ${t('status.alerte_24h')}</span>`,
    'expire':             `<span class="badge badge-expire">${t('status.expire')}</span>`,
    'expire_aujourd_hui': `<span class="badge badge-expire">${t('status.expireAuj')}</span>`,
    'alerte_3j':          `<span class="badge badge-alerte-3j">${t('status.alerte_3j')}</span>`,
    'alerte_7j':          `<span class="badge badge-alerte-7j">${t('status.alerte_7j')}</span>`,
    'ok':                 `<span class="badge badge-ok">${jours} ${t('residents.daysAgo')}</span>`,
    'chronique':          `<span class="badge badge-chronique">${t('status.chronique')}</span>`,
  };
  return map[s] || s;
}

// ── Choix du contenu à exporter ─────────────────────────────
function _openExportChoice(r, cons, trais, contacts, histSorties, histCourses) {
  const choices = [
    { mode: 'medical', icon: 'bi-heart-pulse-fill',      color: '#1b6b6b', label: t('residents.exportMedical'), desc: t('residents.exportMedicalDesc') },
    { mode: 'admin',   icon: 'bi-folder2-open',          color: '#b8963e', label: t('residents.exportAdmin'),   desc: t('residents.exportAdminDesc') },
    { mode: 'complet', icon: 'bi-file-earmark-pdf-fill', color: '#6b7280', label: t('residents.exportFull'),    desc: t('residents.exportFullDesc') },
  ];

  const body = `
    <p style="font-size:.88rem;color:var(--text-light);margin-bottom:1rem">
      ${t('residents.exportChoiceSub')} — <strong>${fullName(r.nom, r.prenom)}</strong>
    </p>
    <div style="display:flex;flex-direction:column;gap:.6rem">
      ${choices.map(c => `
        <button type="button" class="export-choice" data-mode="${c.mode}"
          style="display:flex;align-items:center;gap:.9rem;padding:.9rem 1rem;border:1px solid var(--card-border);border-left:3px solid ${c.color};border-radius:var(--radius-sm);background:var(--bg-alt);cursor:pointer;text-align:left;width:100%">
          <i class="bi ${c.icon}" style="font-size:1.5rem;color:${c.color};flex-shrink:0"></i>
          <span>
            <span style="display:block;font-weight:700">${c.label}</span>
            <span style="display:block;font-size:.8rem;color:var(--text-light);margin-top:.15rem">${c.desc}</span>
          </span>
        </button>`).join('')}
    </div>`;

  openModal(
    `<i class="bi bi-file-earmark-pdf-fill"></i> ${t('residents.exportChoiceTitle')}`,
    body,
    [{ label: `<i class="bi bi-arrow-left"></i> ${t('residents.backToProfile')}`, cls: 'btn btn-secondary btn-sm', action: () => { closeModal(); _openProfile(r.id); } }],
    ''
  );

  document.querySelectorAll('.export-choice').forEach(btn =>
    btn.addEventListener('click', () => {
      _exportPDF(r, cons, trais, contacts, histSorties, histCourses, btn.dataset.mode);
      closeModal();
      _openProfile(r.id);
    })
  );
}

function _exportPDF(r, cons, trais, contacts, histSorties = [], histCourses = [], mode = 'complet') {
  if (!window.jspdf) { alert('Bibliothèque PDF non chargée. Vérifiez votre connexion.'); return; }
  const withMedical = mode !== 'admin';    // sections médicales
  const withAdmin   = mode !== 'medical';  // sections non médicales
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 14;
  const teal = [18, 72, 72];
  const gold = [184, 150, 62];
  const red  = [153, 27, 27];
  const gray = [75, 85, 99];

  const isDeces  = r.statut_depart === 'deces';
  const isDepart = r.statut_depart === 'depart';
  const headerColor = isDeces ? red : isDepart ? gray : teal;
  let y = 0;

  const exporter = currentUserInfo();
  const exporterLabel = exporter
    ? `${exporter.prenom || ''} ${exporter.nom || ''}`.trim() + (exporter.email ? ` (${exporter.email})` : '')
    : '';

  const slug = s => (s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  const tableOpts = {
    margin: { left: M, right: M },
    styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [220, 220, 220] },
    headStyles: { fillColor: [235, 245, 245], textColor: headerColor, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [251, 251, 251] },
    theme: 'grid',
  };

  const newPageIfNeeded = (needed = 40) => {
    if (y > 297 - 20 - needed) { doc.addPage(); y = 20; }
  };

  const section = title => {
    newPageIfNeeded(20);
    doc.setFillColor(...headerColor);
    doc.rect(M, y - 4, W - M * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(title, M + 2, y + 1.5);
    y += 9;
  };

  const emptyLine = msg => {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(150, 150, 150);
    doc.text(msg, M + 2, y + 3);
    y += 12;
  };

  // ── En-tête ────────────────────────────────────────────────
  doc.setFillColor(...headerColor);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text("ST HUGH'S ANGLICAN HOME", M, 14);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('Hope, Dignity & Respect', M, 21);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Rose Hill, Mauritius  |  Tel: 4641124  |  Diocese Anglican de Maurice', M, 28);

  const modeLabel = mode === 'medical' ? 'MEDICAL' : mode === 'admin' ? 'ADMINISTRATIF' : 'COMPLET';
  const docType = isDeces
    ? `DOSSIER DE DECES${mode !== 'complet' ? ' — ' + modeLabel : ''}`
    : isDepart
    ? `DOSSIER ARCHIVE${mode !== 'complet' ? ' — ' + modeLabel : ''}`
    : `DOSSIER ${modeLabel}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(docType, W - M, 14, { align: 'right' });

  doc.setDrawColor(...gold);
  doc.setLineWidth(1);
  doc.line(0, 38, W, 38);

  // ── Identité ───────────────────────────────────────────────
  y = 48;
  doc.setTextColor(...headerColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(fullName(r.nom, r.prenom), M, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const parts = [];
  if (r.date_naissance) {
    const age = Math.floor((Date.now() - new Date(r.date_naissance)) / 31557600000);
    parts.push(`${age} ans`);
  }
  if (r.numero_chambre) parts.push(`Chambre ${r.numero_chambre}`);
  if (r.sexe)           parts.push(r.sexe);
  if (r.taille)         parts.push(`${r.taille} cm`);
  doc.text(parts.join('  |  '), M, y);

  y += 5;
  const entree = r.date_entree ? new Date(r.date_entree).toLocaleDateString('fr-MU') : '—';
  if (isDeces) {
    const dateDeces = r.date_sortie ? new Date(r.date_sortie).toLocaleDateString('fr-MU') : '—';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...red);
    doc.text(`Entree: ${entree}  |  Deces le: ${dateDeces}`, M, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    if (r.motif_deces) { y += 5; doc.text(`Cause: ${r.motif_deces}`, M, y); }
  } else if (isDepart) {
    const dateDepart = r.date_sortie ? new Date(r.date_sortie).toLocaleDateString('fr-MU') : '—';
    doc.text(`Entree: ${entree}  |  Depart le: ${dateDepart}${r.motif_sortie ? '  |  ' + r.motif_sortie : ''}`, M, y);
  } else if (withMedical) {
    const niv = r.niveau_priorite === 1 ? 'Urgente' : r.niveau_priorite === 2 ? 'Elevee' : 'Normale';
    doc.text(`Entree: ${entree}  |  Priorite: ${niv}  |  Score: ${r.score_priorite || 0}`, M, y);
  } else {
    // Mode administratif : pas de donnees medicales (priorite/score)
    doc.text(`Entree: ${entree}`, M, y);
  }

  y += 8;
  doc.setDrawColor(...headerColor);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 7;

  // ── Informations médicales ─────────────────────────────────
  const medecin = r.medecin_nom
    ? `${r.medecin_titre || 'Dr.'} ${r.medecin_prenom || ''} ${r.medecin_nom}`.trim()
    : '—';

  if (withMedical) {
    section(isDeces ? 'INFORMATIONS MEDICALES AU MOMENT DU DECES' : 'INFORMATIONS MEDICALES');
    const infoRows = [
      ['Medecin traitant',      medecin],
      ['Groupe sanguin',        r.groupe_sanguin || '—'],
      ['Mobilite',              r.mobilite || '—'],
      ['Allergies',             r.allergies || '—'],
      ['Conditions chroniques', r.conditions_chroniques || '—'],
      ['Antecedents',           r.antecedents || '—'],
      ...(r.notes_medicales ? [['Notes medicales', r.notes_medicales]] : []),
    ];
    if (!isDeces && !isDepart) {
      const derniereC = r.derniere_consultation
        ? `${new Date(r.derniere_consultation).toLocaleDateString('fr-MU')} (${r.jours_sans_consultation} j.)`
        : 'Jamais';
      infoRows.splice(1, 0, ['Derniere consultation', derniereC]);
    }
    doc.autoTable({ ...tableOpts, startY: y, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 52, textColor: [50,50,50] } }, body: infoRows });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Contacts famille ───────────────────────────────────────
  if (withAdmin) {
    section('CONTACTS FAMILLE');
    if (contacts.length) {
      doc.autoTable({
        ...tableOpts, startY: y,
        head: [['Nom', 'Relation', 'Telephone', 'Principal']],
        body: contacts.map(c => [c.nom || '—', c.relation || '—', c.telephone || '—', c.est_principal ? 'Oui' : '']),
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      emptyLine('Aucun contact enregistre');
    }
  }

  // ── Traitements ────────────────────────────────────────────
  if (withMedical) {
    section(isDeces || isDepart ? 'HISTORIQUE DES TRAITEMENTS' : 'TRAITEMENTS EN COURS');
    const traisActifs = trais.filter(tr => tr.actif !== false);
    if (traisActifs.length) {
      doc.autoTable({
        ...tableOpts, startY: y,
        head: [['Medicament', 'Dosage', 'Posologie', isDeces || isDepart ? 'Periode' : 'Fin / Statut']],
        body: traisActifs.map(tr => [
          tr.nom_medicament || '—', tr.dosage || '—', tr.posologie || '—',
          tr.traitement_chronique ? 'Chronique' : (tr.date_fin ? new Date(tr.date_fin).toLocaleDateString('fr-MU') : '—'),
        ]),
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      emptyLine(isDeces || isDepart ? 'Aucun traitement enregistre' : 'Aucun traitement actif');
    }

    // ── Consultations ────────────────────────────────────────
    section(isDeces || isDepart ? 'HISTORIQUE DES CONSULTATIONS' : 'CONSULTATIONS RECENTES');
    const consRecentes = cons.slice(0, isDeces || isDepart ? 10 : 5);
    if (consRecentes.length) {
      doc.autoTable({
        ...tableOpts, startY: y,
        head: [['Date', 'Medecin', 'Diagnostic / Motif']],
        body: consRecentes.map(c => [
          new Date(c.date_consultation).toLocaleDateString('fr-MU'),
          `${c.medecin_titre || ''} ${c.medecin_nom || ''}`.trim() || '—',
          c.diagnostic || c.motif || '—',
        ]),
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      emptyLine('Aucune consultation enregistree');
    }
  }

  if (withAdmin) {
    // ── Historique vacances ──────────────────────────────────
    section('HISTORIQUE DES VACANCES');
    if (histSorties.length) {
      doc.autoTable({
        ...tableOpts, startY: y,
        head: [['Date de sortie', 'Date de retour', 'Motif']],
        body: histSorties.map(h => [
          h.date_sortie ? new Date(h.date_sortie).toLocaleDateString('fr-MU') : '—',
          h.date_retour ? new Date(h.date_retour).toLocaleDateString('fr-MU') : '—',
          h.motif_sortie || '—',
        ]),
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      emptyLine('Aucune sortie vacances enregistree');
    }

    // ── Historique courses ───────────────────────────────────
    section('HISTORIQUE DES COURSES');
    if (histCourses.length) {
      doc.autoTable({
        ...tableOpts, startY: y,
        head: [['Date', 'Depart', 'Retour', 'Articles achetes', 'Statut']],
        columnStyles: { 3: { cellWidth: 60 } },
        body: histCourses.map(c => [
          c.date_sortie ? new Date(c.date_sortie).toLocaleDateString('fr-MU') : '—',
          c.heure_depart ? c.heure_depart.slice(0,5) : '—',
          c.heure_retour ? c.heure_retour.slice(0,5) : '—',
          c.articles || '—',
          c.est_rentre ? 'Rentre(e)' : (!c.est_rentre && c.heure_depart ? 'Dehors' : 'Planifie'),
        ]),
      });
      y = doc.lastAutoTable.finalY + 8;
    } else {
      emptyLine('Aucune sortie courses enregistree');
    }
  }

  // ── Pied de page sur chaque page ───────────────────────────
  const nb = doc.internal.getNumberOfPages();
  const footerDoc = isDeces
    ? "Dossier de Deces — Confidentiel — St Hugh's Anglican Home"
    : isDepart
    ? "Dossier Archive — Confidentiel — St Hugh's Anglican Home"
    : "Dossier confidentiel — St Hugh's Anglican Home";
  const dateStr = new Date().toLocaleDateString('fr-MU');

  for (let i = 1; i <= nb; i++) {
    doc.setPage(i);
    const H = doc.internal.pageSize.getHeight();

    // Bande footer
    doc.setFillColor(...headerColor);
    doc.rect(0, H - 16, W, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');

    // Ligne 1 : doc type (gauche) | Page X/N (droite)
    doc.setFontSize(7.5);
    doc.text(footerDoc, M, H - 9);
    doc.text(`Page ${i} / ${nb}`, W - M, H - 9, { align: 'right' });

    // Ligne 2 : exporter (gauche) | date (droite)
    doc.setFontSize(7);
    if (exporterLabel) doc.text(`Exporte par: ${exporterLabel}`, M, H - 4);
    doc.text(`Genere le ${dateStr}`, W - M, H - 4, { align: 'right' });
  }

  // ── Téléchargement ─────────────────────────────────────────
  const modeSuffix = mode === 'medical' ? 'medical' : mode === 'admin' ? 'administratif' : 'complet';
  const suffix = `${isDeces ? 'deces' : isDepart ? 'archive' : 'dossier'}_${modeSuffix}`;
  doc.save(`${slug(r.nom)}_${slug(r.prenom)}_${suffix}_St_Hughs.pdf`);
}

async function _confirmDelete(id, name) {
  openModal(
    `<i class="bi bi-exclamation-triangle-fill" style="color:#dc2626"></i> ${t('residents.deleteTitle')}`,
    `<p>${t('residents.deleteMsg')} <strong>${name}</strong> ?<br>${t('residents.deleteMsg2')}</p>`,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
      { label: t('common.delete'), cls: 'btn btn-danger', action: async () => {
        const { error } = await db.from('residents').delete().eq('id', id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('residents.deleted'));
        closeModal();
        _loadResidents();
      }}
    ], 'modal-sm'
  );
}

async function _openFormTraitement(id, residentId) {
  const { openFormTraitement: fn } = await import('./traitements.js');
  fn(id, residentId);
}

function _sk() {
  return Array(6).fill(0).map(() =>
    `<div class="skeleton skeleton-text" style="height:44px;margin-bottom:.5rem"></div>`
  ).join('');
}

// ── Gestion sorties / décès ───────────────────────────────
export function _openDepartModal(r) {
  const sa = isSuperAdmin();

  const body = `<form id="form-depart">
    <div class="form-group">
      <label class="form-label">${t('depart.typeLabel')} <span class="required">*</span></label>
      ${!sa ? `<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:var(--radius-sm);padding:.6rem .9rem;margin-bottom:.65rem;font-size:.82rem;color:#92400e">
        <i class="bi bi-info-circle-fill" style="color:#d97706"></i> ${t('depart.adminOnlyVacances')}
      </div>` : ''}
      <div style="display:flex;flex-direction:column;gap:.5rem;margin-top:.25rem">
        <label style="display:flex;align-items:center;gap:.65rem;cursor:pointer;padding:.6rem .9rem;border:1px solid var(--card-border);border-radius:var(--radius-sm)">
          <input type="radio" name="type_sortie" value="vacances" required>
          <i class="bi bi-luggage-fill" style="color:#2563eb"></i>
          <span>${t('depart.typeVacances')}</span>
        </label>
        ${sa ? `
        <label style="display:flex;align-items:center;gap:.65rem;cursor:pointer;padding:.6rem .9rem;border:1px solid var(--card-border);border-radius:var(--radius-sm)">
          <input type="radio" name="type_sortie" value="depart">
          <i class="bi bi-door-open-fill" style="color:#6b7280"></i>
          <span>${t('depart.typeDeparture')}</span>
        </label>
        <label style="display:flex;align-items:center;gap:.65rem;cursor:pointer;padding:.6rem .9rem;border:1px solid var(--card-border);border-radius:var(--radius-sm)">
          <input type="radio" name="type_sortie" value="deces">
          <span style="color:#991b1b;font-size:1.15rem;font-weight:700;line-height:1;width:16px;text-align:center">✝</span>
          <span>${t('depart.typeDeath')}</span>
        </label>
        ` : ''}
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('depart.exitDate')}</label>
        <input class="form-control" type="datetime-local" name="date_sortie"
          value="${nowLocalInput()}">
      </div>
      <div class="form-group" id="return-date-group" style="display:none">
        <label class="form-label">${t('depart.returnDate')}</label>
        <input class="form-control" type="date" name="date_retour_prevue">
      </div>
    </div>
    <div class="form-group" id="motif-sortie-group">
      <label class="form-label">${t('depart.exitReason')}</label>
      <textarea class="form-control" name="motif_sortie" rows="2"></textarea>
    </div>
    <div class="form-group" id="deces-reason-group" style="display:none">
      <label class="form-label">${t('depart.deathReason')}</label>
      <textarea class="form-control" name="motif_deces" rows="2"></textarea>
    </div>
  </form>`;

  openModal(
    `<i class="bi bi-box-arrow-right"></i> ${t('depart.title')} — ${fullName(r.nom, r.prenom)}`,
    body,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
      { label: t('common.save'), cls: 'btn btn-primary', action: () => _submitDepart(r.id) }
    ],
    'modal-lg'
  );

  // Show/hide fields based on type
  document.querySelectorAll('input[name="type_sortie"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const v = document.querySelector('input[name="type_sortie"]:checked')?.value;
      document.getElementById('return-date-group').style.display  = v === 'vacances' ? '' : 'none';
      document.getElementById('motif-sortie-group').style.display = v === 'deces'    ? 'none' : '';
      document.getElementById('deces-reason-group').style.display = v === 'deces'    ? '' : 'none';
    });
  });
}

async function _submitDepart(id) {
  const form = document.getElementById('form-depart');
  const type = document.querySelector('input[name="type_sortie"]:checked')?.value;
  if (!type) { toastError(t('depart.required')); return; }

  const fd = new FormData(form);
  const updates = {
    statut_depart:     type,
    date_sortie:       fd.get('date_sortie') || null,
    date_retour_prevue: fd.get('date_retour_prevue') || null,
    motif_sortie:      fd.get('motif_sortie') || null,
    motif_deces:       fd.get('motif_deces') || null,
    actif:             type === 'vacances', // vacances = still actif, depart/deces = false
  };

  const { data: saved, error } = await db.from('residents')
    .update(updates).eq('id', id).select('id');

  if (error) {
    toastError('Erreur: ' + error.message);
    return;
  }
  // Supabase retourne [] si la RLS a bloqué silencieusement sans erreur
  if (!saved || saved.length === 0) {
    toastError(getLang() === 'en'
      ? 'Update blocked by database policy — run 12_fix_rls_departs.sql'
      : 'Bloqué par la base — exécutez 12_fix_rls_departs.sql dans Supabase');
    return;
  }
  toastSuccess(t('depart.confirmed'));
  closeModal();
  _loadResidents();
}

async function _openRestoreModal(r) {
  openModal(
    `<i class="bi bi-house-fill"></i> ${t('depart.btnRestore')}`,
    `<p>${t('depart.restoreConfirm')}</p><p style="font-size:.9rem;color:var(--text-light);margin-top:.5rem">${fullName(r.nom, r.prenom)}</p>`,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
      { label: t('depart.btnRestore'), cls: 'btn btn-success', action: async () => {
        // Sauvegarder la période vacances dans l'historique avant de l'effacer
        if (r.date_sortie) {
          await db.from('historique_sorties').insert({
            resident_id:        r.id,
            date_sortie:        r.date_sortie,
            date_retour:        new Date().toISOString(),
            date_retour_prevue: r.date_retour_prevue || null,
            motif_sortie:       r.motif_sortie || null,
          });
        }
        const { error } = await db.from('residents').update({
          statut_depart: null, date_sortie: null,
          date_retour_prevue: null, motif_sortie: null, actif: true
        }).eq('id', r.id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('depart.restoreOk'));
        closeModal();
        _loadResidents();
      }}
    ],
    'modal-sm'
  );
}
