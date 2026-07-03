import { db }            from '../supabase.js';
import { openModal, closeModal } from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { escapeHtml, fullName, initials, debounce } from '../utils.js';
import { isSuperAdmin } from '../auth.js';
import { t } from '../i18n.js';

export async function renderMedecins(container) {
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
        <button class="btn btn-primary" id="btn-add-med">
          <i class="bi bi-person-plus-fill"></i> ${t('doctors.addDoctor')}
        </button>
      </div>
    </div>
    <div id="med-list"></div>`;

  document.getElementById('btn-add-med').addEventListener('click', () => openFormMedecin(null));
  document.getElementById('med-search').addEventListener('input', debounce(e => _load(e.target.value), 300));
  _load('');
}

async function _load(search = '') {
  const wrap = document.getElementById('med-list');
  if (!wrap) return;

  let query = db.from('doctors').select(`
    id, titre, nom, prenom, specialite, telephone, telephone2, email,
    clinique, jours_consultation, notes, actif,
    nb_residents:residents(count)
  `).order('nom');

  if (search) query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,specialite.ilike.%${search}%`);

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
              <div style="font-family:Georgia,serif;font-size:1.05rem;font-weight:700">${d.titre||'Dr.'} ${d.prenom} ${d.nom}</div>
              <div style="font-size:.82rem;color:var(--gold);font-weight:600">${d.specialite||'Médecine Générale'}</div>
              ${!d.actif ? `<span class="badge badge-inactif" style="margin-top:.3rem">${t('common.inactive')}</span>` : ''}
            </div>
          </div>
          <div style="margin-top:1rem;display:grid;gap:.4rem;font-size:.85rem">
            ${d.telephone ? `<div><i class="bi bi-telephone-fill" style="color:var(--teal-light);margin-right:.5rem"></i>${d.telephone}</div>` : ''}
            ${d.email ? `<div><i class="bi bi-envelope-fill" style="color:var(--teal-light);margin-right:.5rem"></i>${d.email}</div>` : ''}
            ${d.clinique ? `<div><i class="bi bi-building-fill" style="color:var(--teal-light);margin-right:.5rem"></i>${d.clinique}</div>` : ''}
            ${d.jours_consultation ? `<div><i class="bi bi-calendar3" style="color:var(--teal-light);margin-right:.5rem"></i>${d.jours_consultation}</div>` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:1rem;padding-top:.75rem;border-top:1px solid var(--card-border)">
            <div style="font-size:.8rem;color:var(--text-light)">
              <i class="bi bi-people-fill" style="margin-right:.3rem"></i>
              <span style="font-weight:700;color:var(--teal-dark)">${d.nb_residents?.[0]?.count ?? 0}</span> ${t('doctors.residents')}
            </div>
            <div style="display:flex;gap:.5rem">
              <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${d.id}">
                <i class="bi bi-pencil-fill"></i>
              </button>
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
          <label class="form-label">Titre</label>
          <select class="form-control" name="titre">
            ${['Dr.','Pr.','M.','Mme'].map(t=>`<option ${(d.titre||'Dr.')===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Nom <span class="required">*</span></label>
          <input class="form-control" name="nom" value="${escapeHtml(d.nom||'')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Prénom</label>
          <input class="form-control" name="prenom" value="${escapeHtml(d.prenom||'')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Spécialité</label>
        <input class="form-control" name="specialite" value="${escapeHtml(d.specialite||'Médecine Générale')}">
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-telephone"></i> Coordonnées</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Téléphone</label>
          <input class="form-control" name="telephone" value="${escapeHtml(d.telephone||'')}">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" type="email" name="email" value="${escapeHtml(d.email||'')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Clinique / Hôpital</label>
        <input class="form-control" name="clinique" value="${escapeHtml(d.clinique||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Adresse</label>
        <input class="form-control" name="adresse" value="${escapeHtml(d.adresse||'')}">
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-calendar3"></i> Planning</div>
      <div class="form-group">
        <label class="form-label">Jours de consultation</label>
        <input class="form-control" name="jours_consultation" placeholder="ex: Mardi, Vendredi" value="${escapeHtml(d.jours_consultation||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
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
}

async function _submit(id) {
  const form = document.getElementById('form-med');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const fd   = new FormData(form);
  const data = Object.fromEntries([...fd.entries()].filter(([,v])=>v!==''));

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
