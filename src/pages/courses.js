import { db }                       from '../supabase.js';
import { openModal, closeModal }    from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatDate, fullName, escapeHtml, todayISO, nowLocalInput, initials } from '../utils.js';
import { t, getLang }               from '../i18n.js';
import { isSuperAdmin }             from '../auth.js';
import { resolvePhotos }            from '../storage.js';

let _filter = 'today';
let _autonomes = []; // cache résidents autonomes pour le select

export async function renderCourses(container) {
  _filter = 'today';

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('courses.title')}</h2>
        <span class="sub">${t('courses.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-add-course">
          <i class="bi bi-bag-fill"></i> ${t('courses.addCourse')}
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-chips">
        <button class="chip active" data-f="today">${t('courses.filterToday')}</button>
        <button class="chip" data-f="out">${t('courses.filterOut')}</button>
        <button class="chip" data-f="all">${t('common.all')}</button>
        <button class="chip" data-f="history">${t('courses.filterHistory')}</button>
      </div>
    </div>

    <div id="courses-list"></div>`;

  document.getElementById('btn-add-course').addEventListener('click', () => _openForm(null));

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
  const wrap = document.getElementById('courses-list');
  if (!wrap) return;
  wrap.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-light)"><i class="bi bi-hourglass-split"></i></div>`;

  // Jointure client via v_residents_public : accessible à tous les rôles,
  // y compris la réceptionniste (l'embed residents(...) serait vide sous RLS)
  let q = db.from('courses')
    .select('id, resident_id, date_sortie, heure_depart, heure_retour, est_rentre, articles, notes, created_at')
    .order('date_sortie', { ascending: false })
    .order('heure_depart', { ascending: false });

  const today = todayISO();

  if (_filter === 'today') {
    q = q.eq('date_sortie', today);
  } else if (_filter === 'out') {
    q = q.eq('est_rentre', false);
  } else if (_filter === 'history') {
    q = q.lt('date_sortie', today);
  }

  const [{ data, error }, resPubRes] = await Promise.all([
    q,
    db.from('v_residents_public').select('id, nom, prenom, numero_chambre, photo_url'),
  ]);
  if (error) { toastError(t('common.error')); return; }

  await resolvePhotos(resPubRes.data || []);
  const resById = {};
  (resPubRes.data || []).forEach(r => { resById[r.id] = r; });
  const rows = (data || []).map(c => ({ ...c, residents: resById[c.resident_id] || null }));

  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-bag-x"></i><p>${t('courses.noResult')}</p></div>`;
    return;
  }

  const sa = isSuperAdmin();

  wrap.innerHTML = `
    <div class="table-wrap"><table class="table">
      <thead><tr>
        <th>${t('common.roomFull')}</th>
        <th>${t('residents.colResident')}</th>
        <th>${t('courses.colDate')}</th>
        <th>${t('courses.colDepart')}</th>
        <th>${t('courses.colRetour')}</th>
        <th>${t('courses.colArticles')}</th>
        <th>${t('courses.colStatus')}</th>
        <th style="text-align:right"></th>
      </tr></thead>
      <tbody>
        ${rows.map(c => {
          const r = c.residents || {};
          const estSorti = !c.est_rentre && c.heure_depart;
          const badgeCls  = c.est_rentre ? 'badge-actif' : (estSorti ? 'badge-attente' : 'badge-teal');
          const badgeTxt  = c.est_rentre
            ? t('courses.statusRentre')
            : (estSorti ? t('courses.statusDehors') : t('courses.statusPlanned'));
          return `<tr>
            <td><span class="badge badge-teal">${r.numero_chambre || '—'}</span></td>
            <td>
              <div style="display:flex;align-items:center;gap:.6rem">
                ${r.photo_url
                  ? `<img src="${r.photo_url}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0">`
                  : `<div class="patient-avatar" style="width:34px;height:34px;font-size:.82rem">${initials(r.nom, r.prenom)}</div>`}
                <div style="font-weight:600">${fullName(r.nom, r.prenom)}</div>
              </div>
            </td>
            <td style="font-size:.83rem">${formatDate(c.date_sortie)}</td>
            <td style="font-size:.85rem;font-weight:600">${c.heure_depart ? c.heure_depart.slice(0,5) : '—'}</td>
            <td style="font-size:.85rem">${c.heure_retour ? c.heure_retour.slice(0,5) : '—'}</td>
            <td style="font-size:.83rem;max-width:200px;white-space:pre-wrap">${escapeHtml(c.articles || '—')}</td>
            <td><span class="badge ${badgeCls}">${badgeTxt}</span></td>
            <td>
              <div class="table-actions">
                ${!c.est_rentre ? `
                  <button class="btn btn-success btn-sm" data-action="retour" data-id="${c.id}"
                    data-nom="${escapeHtml(fullName(r.nom, r.prenom))}">
                    <i class="bi bi-house-fill"></i> ${t('courses.btnRetour')}
                  </button>` : ''}
                <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${c.id}">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                ${sa ? `
                  <button class="btn btn-danger btn-sm" data-action="delete" data-id="${c.id}"
                    data-nom="${escapeHtml(fullName(r.nom, r.prenom))}">
                    <i class="bi bi-trash-fill"></i>
                  </button>` : ''}
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`;

  // Stocker les données pour l'édition
  wrap._data = rows;

  // onclick : _load est rappelée sur le même élément, addEventListener empilerait
  wrap.onclick = async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id, nom } = btn.dataset;

    if (action === 'retour') {
      _confirmRetour(id, nom);
    } else if (action === 'edit') {
      const row = rows.find(x => x.id === id);
      if (row) _openForm(row);
    } else if (action === 'delete') {
      _confirmDelete(id, nom);
    }
  };
}

async function _loadAutonomes() {
  if (_autonomes.length) return _autonomes;
  // RPC : accessible à tous les rôles sans exposer la colonne mobilite
  const { data } = await db.rpc('fn_residents_autonomes');
  // Ordre alphabétique NOM puis prénom (la RPC ne garantit pas l'ordre)
  _autonomes = (data || []).sort((a, b) =>
    (a.nom || '').localeCompare(b.nom || '', 'fr') ||
    (a.prenom || '').localeCompare(b.prenom || '', 'fr'));
  return _autonomes;
}

async function _openForm(course) {
  const autonomes = await _loadAutonomes();

  const isEdit = !!course;
  const residentOptions = autonomes.map(r =>
    `<option value="${r.id}" ${course?.resident_id === r.id ? 'selected' : ''}>
      ${r.nom} ${r.prenom} - Ch.${r.numero_chambre || '?'}
    </option>`
  ).join('');

  // Récupérer resident_id depuis course.residents si c'est un objet
  const currentResId = course?.residents?.id || course?.resident_id || '';

  const body = `<form id="form-course">
    <div class="form-group">
      <label class="form-label">${t('courses.labelResident')} <span class="required">*</span></label>
      <select class="form-control" name="resident_id" required>
        <option value="">— ${t('visites.selectResident')} —</option>
        ${autonomes.map(r =>
          `<option value="${r.id}" ${currentResId === r.id ? 'selected' : ''}>
            ${r.nom} ${r.prenom} - Ch.${r.numero_chambre || '?'}
          </option>`
        ).join('')}
      </select>
      ${autonomes.length === 0
        ? `<div style="margin-top:.4rem;font-size:.82rem;color:#d97706">
            <i class="bi bi-info-circle-fill"></i> ${t('courses.noAutonomes')}
           </div>`
        : ''}
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('courses.labelDate')} <span class="required">*</span></label>
        <input class="form-control" type="date" name="date_sortie"
          value="${course?.date_sortie || todayISO()}" required>
      </div>
      <div class="form-group">
        <label class="form-label">${t('courses.labelDepart')}</label>
        <input class="form-control" type="time" name="heure_depart"
          value="${course?.heure_depart?.slice(0,5) || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('courses.labelRetour')}</label>
        <input class="form-control" type="time" name="heure_retour"
          value="${course?.heure_retour?.slice(0,5) || ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('courses.labelArticles')}</label>
      <textarea class="form-control" name="articles" rows="3"
        placeholder="${t('courses.articlesPlaceholder')}">${escapeHtml(course?.articles || '')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">${t('common.notes')}</label>
      <textarea class="form-control" name="notes" rows="2">${escapeHtml(course?.notes || '')}</textarea>
    </div>
    ${isEdit && course.heure_retour ? `
      <div class="form-group">
        <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
          <input type="checkbox" name="est_rentre" ${course.est_rentre ? 'checked' : ''}>
          ${t('courses.marquerRentre')}
        </label>
      </div>` : ''}
  </form>`;

  openModal(
    isEdit
      ? `<i class="bi bi-pencil-fill"></i> ${t('courses.editTitle')}`
      : `<i class="bi bi-bag-fill"></i> ${t('courses.addTitle')}`,
    body,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
      { label: t('common.save'),   cls: 'btn btn-primary',   action: () => _submit(course?.id || null) }
    ],
    'modal-lg'
  );
}

async function _submit(id) {
  const form = document.getElementById('form-course');
  const fd   = new FormData(form);

  const resident_id = fd.get('resident_id');
  if (!resident_id) { toastError(t('courses.residentRequired')); return; }

  const heure_retour = fd.get('heure_retour') || null;
  const payload = {
    resident_id,
    date_sortie:  fd.get('date_sortie'),
    heure_depart: fd.get('heure_depart') || null,
    heure_retour,
    articles:     fd.get('articles') || null,
    notes:        fd.get('notes') || null,
    est_rentre:   form.querySelector('[name="est_rentre"]')?.checked || (heure_retour ? true : false),
  };

  let error;
  if (id) {
    ({ error } = await db.from('courses').update(payload).eq('id', id));
  } else {
    ({ error } = await db.from('courses').insert(payload));
  }

  if (error) { toastError(error.message); return; }
  toastSuccess(t('courses.saved'));
  closeModal();
  _autonomes = []; // reset cache
  _load();
}

function _confirmRetour(id, nom) {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mm  = String(now.getMinutes()).padStart(2,'0');
  const heureNow = `${hh}:${mm}`;

  openModal(
    `<i class="bi bi-house-fill"></i> ${t('courses.retourTitle')}`,
    `<p>${t('courses.retourConfirm')}</p>
     <p style="font-weight:600;margin-top:.5rem">${nom}</p>
     <div class="form-group" style="margin-top:1rem">
       <label class="form-label">${t('courses.labelRetour')}</label>
       <input class="form-control" type="time" id="heure-retour-input" value="${heureNow}">
     </div>`,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
      { label: t('courses.btnRetour'), cls: 'btn btn-success', action: async () => {
        const h = document.getElementById('heure-retour-input')?.value || null;
        const { error } = await db.from('courses').update({
          est_rentre: true,
          heure_retour: h || null,
        }).eq('id', id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('courses.retourOk'));
        closeModal();
        _load();
      }}
    ], 'modal-sm'
  );
}

function _confirmDelete(id, nom) {
  openModal(
    `<i class="bi bi-trash-fill"></i> ${t('common.delete')}`,
    `<p>${t('courses.deleteConfirm')}</p><p style="font-weight:600;margin-top:.5rem">${nom}</p>`,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
      { label: t('common.delete'), cls: 'btn btn-danger', action: async () => {
        const { error } = await db.from('courses').delete().eq('id', id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('courses.deleted'));
        closeModal();
        _load();
      }}
    ], 'modal-sm'
  );
}
