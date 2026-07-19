import { db }            from '../supabase.js';
import { openModal, closeModal } from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { escapeHtml, fullName, initials, debounce, telHref } from '../utils.js';
import { isSuperAdmin, isMedicalStaff } from '../auth.js';
import { t } from '../i18n.js';
import { listeHopitaux, optionsHopitaux } from './hopitaux.js';

// Liste fermée des spécialités. Elle doit rester ALIGNÉE SUR LA
// CONTRAINTE `doctors_specialite_check` du SQL 32 : une valeur
// absente de la contrainte serait refusée à l'insertion.
export const SPECIALITES = [
  'Médecine Générale', 'Gériatrie', 'Médecine Interne',
  'Cardiologie', 'Neurologie', 'Pneumologie', 'Gastro-entérologie',
  'Endocrinologie', 'Néphrologie', 'Rhumatologie', 'Urologie',
  'Dermatologie', 'Ophtalmologie', 'ORL', 'Orthopédie',
  'Psychiatrie', 'Dentiste', 'Kinésithérapie', 'Podologie',
  'Autre',
];

let _search = '', _specialite = '', _secteur = '';

export async function renderMedecins(container) {
  _search = ''; _specialite = ''; _secteur = '';
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('doctors.title')}</h2>
        <span class="sub">${t('doctors.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input type="text" id="med-search" placeholder="${t('doctors.searchPlaceholder')}">
        </div>
        ${isMedicalStaff() ? `<button class="btn btn-primary" id="btn-add-med">
          <i class="bi bi-person-plus-fill"></i> ${t('doctors.addDoctor')}
        </button>` : ''}
      </div>
    </div>
    <div class="filter-bar">
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <select class="form-control" id="med-specialite" style="width:auto;min-width:180px;font-size:.85rem">
          <option value="">${t('doctors.allSpecialties')}</option>
          ${SPECIALITES.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
        </select>
        <select class="form-control" id="med-secteur" style="width:auto;min-width:150px;font-size:.85rem">
          <option value="">${t('doctors.allSectors')}</option>
          <option value="prive">${t('doctors.sectorPrivate')}</option>
          <option value="public">${t('doctors.sectorPublic')}</option>
        </select>
      </div>
    </div>

    <div id="med-list"></div>`;

  document.getElementById('btn-add-med')?.addEventListener('click', () => openFormMedecin(null));
  document.getElementById('med-search').addEventListener('input',
    debounce(e => { _search = e.target.value; _load(); }, 300));
  document.getElementById('med-specialite').addEventListener('change', e => { _specialite = e.target.value; _load(); });
  document.getElementById('med-secteur').addEventListener('change', e => { _secteur = e.target.value; _load(); });
  _load();
}

async function _load() {
  const wrap = document.getElementById('med-list');
  if (!wrap) return;

  let query = db.from('doctors').select(`
    id, titre, nom, prenom, specialite, telephone, telephone2, email,
    clinique, jours_consultation, notes, actif, secteur, hopital_id,
    hopitaux ( nom ),
    nb_residents:residents(count)
  `).order('nom');

  if (_search)     query = query.or(`nom.ilike.%${_search}%,prenom.ilike.%${_search}%,specialite.ilike.%${_search}%`);
  if (_specialite) query = query.eq('specialite', _specialite);
  if (_secteur)    query = query.eq('secteur', _secteur);

  const { data, error } = await query;
  if (error) { toastError(t('doctors.loadError')); return; }

  const docs = data || [];
  if (!docs.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-person-badge"></i><p>${t('doctors.noDoctors')}</p></div>`;
    return;
  }

  wrap.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.25rem">
    ${docs.map(d => `
      <div class="card" style="position:relative">
        <div class="card-body">
          <div class="doctor-card" style="padding:0;border:none;background:transparent;margin-bottom:0">
            <div class="doctor-avatar">${initials(d.nom,d.prenom)}</div>
            <div style="flex:1">
              <div style="font-size:1.05rem;font-weight:700">${d.titre||'Dr.'} ${d.prenom} ${d.nom}</div>
              <div style="font-size:.82rem;color:var(--gold);font-weight:600">${d.specialite||'Médecine Générale'}</div>
              <div style="margin-top:.3rem;display:flex;gap:.35rem;flex-wrap:wrap">
                ${d.secteur === 'public'
                  ? `<span class="badge" style="font-size:.66rem;border-left:none;padding:.2rem .55rem;background:var(--tint-blue-bg);color:var(--tint-blue-fg)">${t('doctors.sectorPublic')}</span>`
                  : `<span class="badge badge-teal" style="font-size:.66rem">${t('doctors.sectorPrivate')}</span>`}
                ${!d.actif ? `<span class="badge badge-inactif">${t('common.inactive')}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="margin-top:1rem;display:grid;gap:.4rem;font-size:.85rem">
            ${d.telephone ? `<div><i class="bi bi-telephone-fill" style="color:var(--teal-light);margin-right:.5rem"></i><a href="${telHref(d.telephone)}" style="color:inherit">${d.telephone}</a></div>` : ''}
            ${d.telephone2 ? `<div><i class="bi bi-telephone-fill" style="color:var(--teal-light);margin-right:.5rem"></i><a href="${telHref(d.telephone2)}" style="color:inherit">${d.telephone2}</a></div>` : ''}
            ${d.email ? `<div><i class="bi bi-envelope-fill" style="color:var(--teal-light);margin-right:.5rem"></i><a href="mailto:${escapeHtml(d.email)}" style="color:inherit">${escapeHtml(d.email)}</a></div>` : ''}
            ${d.hopitaux?.nom || d.clinique ? `<div><i class="bi bi-building-fill" style="color:var(--teal-light);margin-right:.5rem"></i>${escapeHtml(d.hopitaux?.nom || d.clinique)}</div>` : ''}
            ${d.jours_consultation ? `<div><i class="bi bi-calendar3" style="color:var(--teal-light);margin-right:.5rem"></i>${d.jours_consultation}</div>` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:1rem;padding-top:.75rem;border-top:1px solid var(--card-border)">
            <div style="font-size:.8rem;color:var(--text-light)">
              <i class="bi bi-people-fill" style="margin-right:.3rem"></i>
              <span style="font-weight:700;color:var(--teal-dark)">${d.nb_residents?.[0]?.count ?? 0}</span> ${t('doctors.residents')}
            </div>
            <div style="display:flex;gap:.5rem">
              ${isMedicalStaff() ? `<button class="btn btn-secondary btn-sm" data-action="edit" data-id="${d.id}">
                <i class="bi bi-pencil-fill"></i>
              </button>` : ''}
              ${isSuperAdmin() ? `<button class="btn btn-danger btn-sm" data-action="delete" data-id="${d.id}">
                <i class="bi bi-trash3-fill"></i>
              </button>` : ''}
            </div>
          </div>
        </div>
      </div>`).join('')}
  </div>`;

  // onclick : _load est rappelée sur le même élément, addEventListener empilerait
  wrap.onclick = e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'edit')   openFormMedecin(btn.dataset.id);
    if (btn.dataset.action === 'delete') _confirmDelete(btn.dataset.id);
  };
}

export async function openFormMedecin(id) {
  const hops = await listeHopitaux();
  let doc = null;
  if (id) {
    const { data } = await db.from('doctors').select('*').eq('id',id).single();
    doc = data;
  }
  const d = doc || {};

  const body = `<form id="form-med">
    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-person-badge"></i> Identité</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('doctors.title_')}</label>
          <select class="form-control" name="titre">
            ${['Dr.','Pr.','M.','Mme'].map(t=>`<option ${(d.titre||'Dr.')===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('doctors.lastname')} <span class="required">*</span></label>
          <input class="form-control" name="nom" value="${escapeHtml(d.nom||'')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t('doctors.firstname')}</label>
          <input class="form-control" name="prenom" value="${escapeHtml(d.prenom||'')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('doctors.specialty')}</label>
          <select class="form-control" name="specialite">
            ${SPECIALITES.map(s => {
              // Une spécialité déjà en base et hors liste serait refusée
              // en modification : on prend « Médecine Générale » par défaut.
              const courante = SPECIALITES.includes(d.specialite) ? d.specialite : 'Médecine Générale';
              return `<option value="${escapeHtml(s)}" ${courante === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('doctors.sector')}</label>
          <select class="form-control" name="secteur">
            <option value="prive"  ${(d.secteur||'prive')==='prive'  ? 'selected' : ''}>${t('doctors.sectorPrivate')}</option>
            <option value="public" ${d.secteur==='public' ? 'selected' : ''}>${t('doctors.sectorPublic')}</option>
          </select>
        </div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-telephone"></i> Coordonnées</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('doctors.phone')}</label>
          <input class="form-control" name="telephone" value="${escapeHtml(d.telephone||'')}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('doctors.email')}</label>
          <input class="form-control" type="email" name="email" value="${escapeHtml(d.email||'')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('doctors.clinic')}</label>
        <select class="form-control" name="hopital_id" id="med-hopital">
          <option value="">—</option>
          ${optionsHopitaux(hops, d.hopital_id)}
          <option value="_libre" ${!d.hopital_id && d.clinique ? 'selected' : ''}>${t('hospitals.freeText')}</option>
        </select>
        <input class="form-control" name="clinique" id="med-clinique" style="margin-top:.5rem;${(!d.hopital_id && d.clinique) || !hops.length ? '' : 'display:none'}"
          placeholder="${t('doctors.clinic')}" value="${escapeHtml(d.clinique||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('doctors.address')}</label>
        <input class="form-control" name="adresse" value="${escapeHtml(d.adresse||'')}">
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-calendar3"></i> Planning</div>
      <div class="form-group">
        <label class="form-label">${t('doctors.consultDays')}</label>
        <input class="form-control" name="jours_consultation" placeholder="${t('doctors.consultDaysPlaceholder')}" value="${escapeHtml(d.jours_consultation||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('doctors.notes')}</label>
        <textarea class="form-control" name="notes" rows="2">${escapeHtml(d.notes||'')}</textarea>
      </div>
    </div>
  </form>`;

  openModal(
    id ? `<i class="bi bi-pencil-fill"></i> ${t('doctors.formTitleEdit')}` : `<i class="bi bi-person-plus-fill"></i> ${t('doctors.formTitleNew')}`,
    body,
    [
      { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
      { label: id ? t('common.modify') : t('common.save'), cls:'btn btn-primary', action: () => _submit(id) }
    ], 'modal-lg'
  );

  // Tant que l'annuaire est incomplet, la saisie libre reste ouverte
  document.getElementById('med-hopital')?.addEventListener('change', e => {
    const libre = e.target.value === '_libre' || e.target.value === '';
    const champ = document.getElementById('med-clinique');
    champ.style.display = libre ? '' : 'none';
    if (!libre) champ.value = '';
  });
}

async function _submit(id) {
  const form = document.getElementById('form-med');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const fd   = new FormData(form);
  const data = Object.fromEntries([...fd.entries()].filter(([,v])=>v!==''));

  // « _libre » n'est qu'un marqueur d'interface, pas une clé.
  // Une fiche d'annuaire prime : le texte libre est alors effacé.
  if (data.hopital_id === '_libre') delete data.hopital_id;
  if (data.hopital_id) data.clinique = null;
  else                 data.hopital_id = null;
  if (fd.get('clinique') === '' && !data.hopital_id) data.clinique = null;

  const { error } = id
    ? await db.from('doctors').update(data).eq('id',id)
    : await db.from('doctors').insert(data);

  if (error) { toastError(error.message); return; }
  toastSuccess(id ? t('doctors.saved') : t('doctors.created'));
  closeModal();
  _load('');
}

async function _confirmDelete(id) {
  const { data } = await db.from('residents').select('id').eq('medecin_id',id).limit(1);
  const msg = data?.length
    ? `<p>${t('doctors.deleteConfirmAssigned')}</p>`
    : `<p>${t('doctors.deleteConfirm')}</p>`;

  openModal(
    `<i class="bi bi-exclamation-triangle-fill" style="color:#dc2626"></i> ${t('common.delete')}`,
    msg,
    [
      { label: t('common.cancel'),  cls:'btn btn-secondary', action: closeModal },
      { label: t('common.delete'),  cls:'btn btn-danger',    action: async () => {
        const { error } = await db.from('doctors').delete().eq('id',id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('doctors.deleted'));
        closeModal();
        _load('');
      }}
    ], 'modal-sm'
  );
}
