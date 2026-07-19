// ── Annuaire des établissements de santé ────────────────────
//  Point 6 des MAJ du 19/07/2026, lot I.
//  L'annuaire démarre vide, à la demande de l'utilisateur : les
//  établissements déjà saisis en texte libre restent affichés
//  ailleurs tant qu'une fiche ne les remplace pas. La saisie libre
//  reste donc possible dans les formulaires de rendez-vous et
//  d'hospitalisation, sans quoi rien ne serait saisissable tant
//  que cette page n'a pas été remplie.

import { db }                       from '../supabase.js';
import { openModal, closeModal }    from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { escapeHtml, debounce, telHref } from '../utils.js';
import { isMedicalStaff, isSuperAdmin }  from '../auth.js';
import { t }                        from '../i18n.js';

export const TYPES    = ['hopital', 'clinique', 'cabinet'];
export const SECTEURS = ['public', 'prive'];

let _search = '', _type = '', _secteur = '';

// Liste des établissements actifs, pour les listes déroulantes des
// autres pages. Un seul endroit fait cette requête.
export async function listeHopitaux() {
  const { data } = await db.from('hopitaux')
    .select('id,nom,type,secteur,telephone')
    .eq('actif', true).order('nom');
  return data || [];
}

// Options d'un <select>, avec « Autre » pour la saisie libre : tant
// que l'annuaire est incomplet, il ne faut bloquer aucune saisie.
export function optionsHopitaux(liste, selectionId) {
  return liste.map(h =>
    `<option value="${h.id}" ${selectionId === h.id ? 'selected' : ''}>${escapeHtml(h.nom)}</option>`
  ).join('');
}

export async function renderHopitaux(container) {
  _search = ''; _type = ''; _secteur = '';

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('hospitals.title')}</h2>
        <span class="sub">${t('hospitals.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input type="text" id="hop-search" placeholder="${t('hospitals.searchPlaceholder')}">
        </div>
        ${isMedicalStaff() ? `<button class="btn btn-primary" id="btn-add-hop">
          <i class="bi bi-plus-lg"></i> ${t('hospitals.add')}
        </button>` : ''}
      </div>
    </div>

    <div class="filter-bar">
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <select class="form-control" id="hop-type" style="width:auto;min-width:150px;font-size:.85rem">
          <option value="">${t('hospitals.allTypes')}</option>
          ${TYPES.map(x => `<option value="${x}">${t('hospitals.type_' + x)}</option>`).join('')}
        </select>
        <select class="form-control" id="hop-secteur" style="width:auto;min-width:150px;font-size:.85rem">
          <option value="">${t('doctors.allSectors')}</option>
          ${SECTEURS.map(x => `<option value="${x}">${t('hospitals.sector_' + x)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div id="hop-list"></div>`;

  document.getElementById('btn-add-hop')?.addEventListener('click', () => openFormHopital(null));
  document.getElementById('hop-search').addEventListener('input',
    debounce(e => { _search = e.target.value; _load(); }, 300));
  document.getElementById('hop-type').addEventListener('change', e => { _type = e.target.value; _load(); });
  document.getElementById('hop-secteur').addEventListener('change', e => { _secteur = e.target.value; _load(); });

  _load();
}

async function _load() {
  const wrap = document.getElementById('hop-list');
  if (!wrap) return;

  let query = db.from('hopitaux').select('*, nb_medecins:doctors(count)').order('nom');
  if (_search)  query = query.or(`nom.ilike.%${_search}%,adresse.ilike.%${_search}%`);
  if (_type)    query = query.eq('type', _type);
  if (_secteur) query = query.eq('secteur', _secteur);

  const { data, error } = await query;
  if (error) { toastError(t('hospitals.loadError')); return; }
  const rows = data || [];

  if (!rows.length) {
    // L'annuaire démarre vide : le dire, plutôt que de laisser croire
    // à une erreur de chargement.
    wrap.innerHTML = `<div class="empty-state">
      <i class="bi bi-hospital"></i>
      <p>${_search || _type || _secteur ? t('common.noResult') : t('hospitals.emptyDirectory')}</p>
    </div>`;
    return;
  }

  wrap.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1.25rem">
    ${rows.map(h => `
      <div class="card">
        <div class="card-body">
          <div style="display:flex;align-items:flex-start;gap:.75rem">
            <i class="bi ${h.type === 'cabinet' ? 'bi-door-closed-fill' : h.type === 'clinique' ? 'bi-building-fill' : 'bi-hospital-fill'}"
               style="font-size:1.6rem;color:var(--teal-light)"></i>
            <div style="flex:1;min-width:0">
              <div style="font-size:1.02rem;font-weight:700">${escapeHtml(h.nom)}</div>
              <div style="margin-top:.3rem;display:flex;gap:.35rem;flex-wrap:wrap">
                <span class="badge badge-teal" style="font-size:.66rem">${t('hospitals.type_' + h.type)}</span>
                ${h.secteur === 'public'
                  ? `<span class="badge" style="font-size:.66rem;border-left:none;padding:.2rem .55rem;background:var(--tint-blue-bg);color:var(--tint-blue-fg)">${t('hospitals.sector_public')}</span>`
                  : `<span class="badge" style="font-size:.66rem;border-left:none;padding:.2rem .55rem;background:var(--tint-gray-bg);color:var(--tint-gray-fg)">${t('hospitals.sector_prive')}</span>`}
                ${!h.actif ? `<span class="badge badge-inactif" style="font-size:.66rem">${t('common.inactive')}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="margin-top:.9rem;display:grid;gap:.4rem;font-size:.85rem">
            ${h.telephone ? `<div><i class="bi bi-telephone-fill" style="color:var(--teal-light);margin-right:.5rem"></i><a href="${telHref(h.telephone)}" style="color:inherit">${escapeHtml(h.telephone)}</a></div>` : ''}
            ${h.telephone2 ? `<div><i class="bi bi-telephone-fill" style="color:var(--teal-light);margin-right:.5rem"></i><a href="${telHref(h.telephone2)}" style="color:inherit">${escapeHtml(h.telephone2)}</a></div>` : ''}
            ${h.email ? `<div><i class="bi bi-envelope-fill" style="color:var(--teal-light);margin-right:.5rem"></i><a href="mailto:${escapeHtml(h.email)}" style="color:inherit">${escapeHtml(h.email)}</a></div>` : ''}
            ${h.adresse ? `<div><i class="bi bi-geo-alt-fill" style="color:var(--teal-light);margin-right:.5rem"></i>${escapeHtml(h.adresse)}</div>` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:1rem;padding-top:.75rem;border-top:1px solid var(--card-border)">
            <div style="font-size:.8rem;color:var(--text-light)">
              <i class="bi bi-person-badge" style="margin-right:.3rem"></i>
              <span style="font-weight:700;color:var(--teal-dark)">${h.nb_medecins?.[0]?.count ?? 0}</span> ${t('hospitals.doctorsCount')}
            </div>
            ${isMedicalStaff() ? `<div class="table-actions">
              <button class="btn-icon" data-action="edit" data-id="${h.id}" title="${t('common.modify')}"><i class="bi bi-pencil-fill"></i></button>
              ${isSuperAdmin() ? `<button class="btn-icon" data-action="del" data-id="${h.id}" data-nom="${escapeHtml(h.nom)}" title="${t('common.delete')}" style="color:#dc2626"><i class="bi bi-trash-fill"></i></button>` : ''}
            </div>` : ''}
          </div>
        </div>
      </div>`).join('')}
  </div>`;

  // onclick : _load est rappelée sur le même élément, addEventListener empilerait
  wrap.onclick = e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'edit') openFormHopital(btn.dataset.id);
    if (btn.dataset.action === 'del')  _confirmDelete(btn.dataset.id, btn.dataset.nom);
  };
}

export async function openFormHopital(id) {
  let h = {};
  if (id) {
    const { data } = await db.from('hopitaux').select('*').eq('id', id).single();
    h = data || {};
  }

  const body = `<form id="form-hop">
    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-hospital"></i> ${t('hospitals.secIdentity')}</div>
      <div class="form-group">
        <label class="form-label">${t('hospitals.name')} <span class="required">*</span></label>
        <input class="form-control" name="nom" required value="${escapeHtml(h.nom || '')}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('hospitals.type')}</label>
          <select class="form-control" name="type">
            ${TYPES.map(x => `<option value="${x}" ${(h.type || 'hopital') === x ? 'selected' : ''}>${t('hospitals.type_' + x)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('doctors.sector')}</label>
          <select class="form-control" name="secteur">
            ${SECTEURS.map(x => `<option value="${x}" ${(h.secteur || 'public') === x ? 'selected' : ''}>${t('hospitals.sector_' + x)}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-telephone"></i> ${t('hospitals.secContact')}</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('doctors.phone')}</label>
          <input class="form-control" name="telephone" value="${escapeHtml(h.telephone || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('hospitals.phone2')}</label>
          <input class="form-control" name="telephone2" value="${escapeHtml(h.telephone2 || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('doctors.email')}</label>
        <input class="form-control" type="email" name="email" value="${escapeHtml(h.email || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('doctors.address')}</label>
        <input class="form-control" name="adresse" value="${escapeHtml(h.adresse || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('common.notes')}</label>
        <textarea class="form-control" name="notes" rows="2">${escapeHtml(h.notes || '')}</textarea>
      </div>
      ${id ? `<label style="display:flex;align-items:center;gap:.5rem;font-size:.88rem;cursor:pointer">
        <input type="checkbox" id="hop-actif" ${h.actif !== false ? 'checked' : ''}> ${t('hospitals.activeLabel')}
      </label>` : ''}
    </div>
  </form>`;

  openModal(
    id ? `<i class="bi bi-pencil-fill"></i> ${t('hospitals.formTitleEdit')}` : `<i class="bi bi-hospital"></i> ${t('hospitals.formTitleNew')}`,
    body,
    [
      { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
      { label: id ? t('common.modify') : t('common.save'), cls:'btn btn-primary', action: () => _submit(id) }
    ], 'modal-lg'
  );
}

async function _submit(id) {
  const form = document.getElementById('form-hop');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const fd   = new FormData(form);
  const data = Object.fromEntries([...fd.entries()]);
  // Les champs facultatifs vidés doivent s'effacer, pas rester
  ['telephone','telephone2','email','adresse','notes'].forEach(k => { if (data[k] === '') data[k] = null; });
  data.nom = data.nom.trim();
  if (id) data.actif = !!document.getElementById('hop-actif')?.checked;

  const { error } = id
    ? await db.from('hopitaux').update(data).eq('id', id)
    : await db.from('hopitaux').insert(data);

  if (error) {
    // L'index unique sur lower(nom) remonte une 23505 peu parlante
    toastError(error.code === '23505' ? t('hospitals.duplicateName') : error.message);
    return;
  }
  toastSuccess(id ? t('hospitals.modified') : t('hospitals.created'));
  closeModal();
  _load();
}

function _confirmDelete(id, nom) {
  openModal(
    `<i class="bi bi-exclamation-triangle-fill" style="color:#dc2626"></i> ${t('common.delete')}`,
    `<p>${t('hospitals.deleteConfirm')}</p>
     <p style="font-weight:600;margin-top:.5rem">${escapeHtml(nom || '')}</p>
     <p style="font-size:.83rem;color:var(--text-light);margin-top:.5rem">${t('hospitals.deleteNote')}</p>`,
    [
      { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
      { label: t('common.delete'), cls:'btn btn-danger', action: async () => {
        const { error } = await db.from('hopitaux').delete().eq('id', id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('hospitals.deleted'));
        closeModal();
        _load();
      }}
    ], 'modal-sm'
  );
}
