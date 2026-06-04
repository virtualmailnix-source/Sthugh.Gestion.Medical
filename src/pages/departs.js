import { db }                       from '../supabase.js';
import { openModal, closeModal }    from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatDate, formatAge, initials, fullName, escapeHtml } from '../utils.js';
import { t }                        from '../i18n.js';
import { isSuperAdmin }             from '../auth.js';

let _filter = 'all';

export async function renderDeparts(container) {
  _filter = 'all';

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('depart.archiveTitle')}</h2>
        <span class="sub">${t('depart.archiveSubtitle') || 'Sorties, départs et décès des résidents'}</span>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-chips">
        <button class="chip active" data-f="all">${t('common.all')}</button>
        <button class="chip" data-f="vacances">
          <i class="bi bi-luggage-fill"></i> ${t('depart.filterVacances')}
        </button>
        <button class="chip" data-f="depart">
          <i class="bi bi-door-open-fill"></i> ${t('depart.filterDeparts')}
        </button>
        <button class="chip" data-f="deces">
          ✝ ${t('depart.filterDeces')}
        </button>
      </div>
    </div>

    <div id="departs-list"></div>`;

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
  const wrap = document.getElementById('departs-list');
  if (!wrap) return;
  wrap.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-light)"><i class="bi bi-hourglass-split"></i></div>`;

  // Requête directe sur residents (pas la vue) pour inclure actif=false
  let q = db.from('residents')
    .select(`
      id, numero_chambre, nom, prenom, date_naissance, sexe, photo_url,
      statut_depart, date_sortie, date_retour_prevue, motif_sortie, motif_deces,
      conditions_chroniques,
      doctors ( id, nom, prenom, titre )
    `)
    .not('statut_depart', 'is', null)
    .order('date_sortie', { ascending: false, nullsFirst: false });

  if (_filter !== 'all') q = q.eq('statut_depart', _filter);

  const { data, error } = await q;
  if (error) { toastError(t('common.error')); return; }

  const rows = data || [];

  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i><p>${t('common.noResult')}</p></div>`;
    return;
  }

  /* Grouper par type */
  const vacances = rows.filter(r => r.statut_depart === 'vacances');
  const departs  = rows.filter(r => r.statut_depart === 'depart');
  const deces    = rows.filter(r => r.statut_depart === 'deces');

  let html = '';

  if (vacances.length && (_filter === 'all' || _filter === 'vacances')) {
    html += _section(
      `<i class="bi bi-luggage-fill" style="color:#2563eb"></i> ${t('depart.filterVacances')} (${vacances.length})`,
      '#dbeafe', vacances, 'vacances'
    );
  }
  if (departs.length && (_filter === 'all' || _filter === 'depart')) {
    html += _section(
      `<i class="bi bi-door-open-fill" style="color:#6b7280"></i> ${t('depart.filterDeparts')} (${departs.length})`,
      '#f3f4f6', departs, 'depart'
    );
  }
  if (deces.length && (_filter === 'all' || _filter === 'deces')) {
    html += _section(
      `<span style="color:#991b1b;font-weight:700">✝</span> ${t('depart.filterDeces')} (${deces.length})`,
      '#fee2e2', deces, 'deces'
    );
  }

  wrap.innerHTML = html || `<div class="empty-state"><i class="bi bi-inbox"></i><p>${t('common.noResult')}</p></div>`;

  wrap.addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id   = btn.dataset.id;
    const nom  = btn.dataset.nom;
    const type = btn.dataset.type;

    if (btn.dataset.action === 'restore') {
      _confirmRestore(id, nom);
    }
    if (btn.dataset.action === 'profile') {
      const { openResidentProfile } = await import('./residents.js');
      openResidentProfile(btn.dataset.id);
    }
  });
}

function _section(title, bgColor, rows, type) {
  return `
    <div style="margin-bottom:2rem">
      <div style="display:flex;align-items:center;gap:.6rem;font-family:Georgia,serif;font-size:1rem;font-weight:700;
        color:var(--teal-dark);margin-bottom:1rem;padding:.6rem .9rem;
        background:${bgColor};border-radius:var(--radius-sm);">
        ${title}
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr>
          <th>${t('common.roomFull')}</th>
          <th>${t('residents.colResident')}</th>
          <th>${t('residents.dob')}</th>
          <th>${t('depart.exitDate')}</th>
          ${type === 'vacances' ? `<th>${t('depart.returnDate')}</th>` : ''}
          <th>${type === 'deces' ? t('depart.deathReason') : t('depart.exitReason')}</th>
          <th style="text-align:right"></th>
        </tr></thead>
        <tbody>
          ${rows.map(r => `<tr>
            <td><span class="badge badge-teal">${r.numero_chambre || '—'}</span></td>
            <td>
              <div style="display:flex;align-items:center;gap:.6rem">
                ${r.photo_url
                  ? `<img src="${r.photo_url}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0">`
                  : `<div class="patient-avatar" style="width:34px;height:34px;font-size:.82rem">${initials(r.nom, r.prenom)}</div>`}
                <div>
                  <div style="font-weight:600">${fullName(r.nom, r.prenom)}</div>
                  <div style="font-size:.75rem;color:var(--text-light)">${r.doctors ? (r.doctors.titre || 'Dr.') + ' ' + r.doctors.nom : '—'}</div>
                </div>
              </div>
            </td>
            <td style="font-size:.85rem">${formatAge(r.date_naissance)}</td>
            <td style="font-size:.83rem">${r.date_sortie ? formatDate(r.date_sortie, { time: true }) : '—'}</td>
            ${type === 'vacances' ? `<td style="font-size:.83rem">${r.date_retour_prevue ? formatDate(r.date_retour_prevue) : '—'}</td>` : ''}
            <td style="font-size:.83rem;max-width:200px">
              ${escapeHtml(type === 'deces' ? (r.motif_deces || '—') : (r.motif_sortie || '—'))}
            </td>
            <td>
              <div class="table-actions">
                ${type === 'vacances'
                  ? `<button class="btn btn-success btn-sm" data-action="restore" data-id="${r.id}" data-nom="${escapeHtml(fullName(r.nom, r.prenom))}">
                      <i class="bi bi-house-fill"></i> ${t('depart.btnRestore')}
                     </button>`
                  : `<button class="btn btn-secondary btn-sm" data-action="profile" data-id="${r.id}">
                      <i class="bi bi-folder2-open"></i>
                     </button>`
                }
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
}

function _confirmRestore(id, nom) {
  openModal(
    `<i class="bi bi-house-fill"></i> ${t('depart.btnRestore')}`,
    `<p>${t('depart.restoreConfirm')}</p><p style="font-weight:600;margin-top:.5rem">${nom}</p>`,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: closeModal },
      { label: t('depart.btnRestore'), cls: 'btn btn-success', action: async () => {
        // Récupérer les données vacances avant de les effacer
        const { data: res } = await db.from('residents')
          .select('date_sortie, date_retour_prevue, motif_sortie')
          .eq('id', id).single();
        if (res?.date_sortie) {
          await db.from('historique_sorties').insert({
            resident_id:        id,
            date_sortie:        res.date_sortie,
            date_retour:        new Date().toISOString(),
            date_retour_prevue: res.date_retour_prevue || null,
            motif_sortie:       res.motif_sortie || null,
          });
        }
        const { error } = await db.from('residents').update({
          statut_depart: null, date_sortie: null,
          date_retour_prevue: null, motif_sortie: null, actif: true
        }).eq('id', id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('depart.restoreOk'));
        closeModal();
        _load();
      }}
    ], 'modal-sm'
  );
}
