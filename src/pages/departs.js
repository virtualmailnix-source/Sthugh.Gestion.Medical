import { db }                       from '../supabase.js';
import { openModal, closeModal }    from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatDate, formatAge, initials, fullName, escapeHtml } from '../utils.js';
import { t }                        from '../i18n.js';
import { isSuperAdmin, isReceptionist } from '../auth.js';
import { resolvePhotos }            from '../storage.js';

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
        <button class="chip" data-f="hospitalisation">
          <i class="bi bi-hospital-fill"></i> ${t('depart.filterHospitalisation')}
        </button>
        <button class="chip" data-f="depart">
          <i class="bi bi-door-open-fill"></i> ${t('depart.filterDeparts')}
        </button>
        ${!isReceptionist() ? `<button class="chip" data-f="deces">
          ✝ ${t('depart.filterDeces')}
        </button>` : ''}
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

  // Staff : requête directe sur residents (inclut motif_deces + médecin).
  // Réceptionniste : vue publique, sans les décès ni le volet médical.
  let q;
  if (isReceptionist()) {
    q = db.from('v_residents_public')
      .select('id, numero_chambre, nom, prenom, date_naissance, sexe, photo_url, statut_depart, date_sortie, date_retour_prevue, motif_sortie, etablissement_sante')
      .not('statut_depart', 'is', null)
      .neq('statut_depart', 'deces')
      .order('date_sortie', { ascending: false, nullsFirst: false });
  } else {
    q = db.from('residents')
      .select(`
        id, numero_chambre, nom, prenom, date_naissance, sexe, photo_url,
        statut_depart, date_sortie, date_retour_prevue, motif_sortie, motif_deces,
        etablissement_sante, conditions_chroniques,
        doctors ( id, nom, prenom, titre )
      `)
      .not('statut_depart', 'is', null)
      .order('date_sortie', { ascending: false, nullsFirst: false });
  }

  if (_filter !== 'all') q = q.eq('statut_depart', _filter);

  const { data, error } = await q;
  if (error) { toastError(t('common.error')); return; }
  await resolvePhotos(data || []);

  const rows = data || [];

  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i><p>${t('common.noResult')}</p></div>`;
    return;
  }

  /* Grouper par type */
  const vacances = rows.filter(r => r.statut_depart === 'vacances');
  const hospit   = rows.filter(r => r.statut_depart === 'hospitalisation');
  const departs  = rows.filter(r => r.statut_depart === 'depart');
  const deces    = rows.filter(r => r.statut_depart === 'deces');

  let html = '';

  if (vacances.length && (_filter === 'all' || _filter === 'vacances')) {
    html += _section(
      `<i class="bi bi-luggage-fill"></i> ${t('depart.filterVacances')} (${vacances.length})`,
      'blue', vacances, 'vacances'
    );
  }
  if (hospit.length && (_filter === 'all' || _filter === 'hospitalisation')) {
    html += _section(
      `<i class="bi bi-hospital-fill"></i> ${t('depart.filterHospitalisation')} (${hospit.length})`,
      'blue', hospit, 'hospitalisation'
    );
  }
  if (departs.length && (_filter === 'all' || _filter === 'depart')) {
    html += _section(
      `<i class="bi bi-door-open-fill"></i> ${t('depart.filterDeparts')} (${departs.length})`,
      'gray', departs, 'depart'
    );
  }
  if (deces.length && (_filter === 'all' || _filter === 'deces')) {
    html += _section(
      `<span style="font-weight:700">✝</span> ${t('depart.filterDeces')} (${deces.length})`,
      'red', deces, 'deces'
    );
  }

  wrap.innerHTML = html || `<div class="empty-state"><i class="bi bi-inbox"></i><p>${t('common.noResult')}</p></div>`;

  // onclick : _load est rappelée sur le même élément, addEventListener empilerait
  wrap.onclick = async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id   = btn.dataset.id;
    const nom  = btn.dataset.nom;

    if (btn.dataset.action === 'restore') {
      _confirmRestore(id, nom);
    }
    if (btn.dataset.action === 'profile') {
      const { openResidentProfile } = await import('./residents.js');
      openResidentProfile(id);
    }
  };
}

function _section(title, tint, rows, type) {
  // Vacances et hospitalisation sont des absences temporaires : date de
  // retour prévue et bouton de retour au foyer.
  const temporaire = type === 'vacances' || type === 'hospitalisation';
  return `
    <div style="margin-bottom:2rem">
      <div style="display:flex;align-items:center;gap:.6rem;font-size:1rem;font-weight:700;
        color:var(--tint-${tint}-fg);margin-bottom:1rem;padding:.6rem .9rem;
        background:var(--tint-${tint}-bg);border-radius:var(--radius-sm);">
        ${title}
      </div>
      <div class="table-wrap"><table class="table">
        <thead><tr>
          <th>${t('common.roomFull')}</th>
          <th>${t('residents.colResident')}</th>
          <th>${t('residents.dob')}</th>
          <th>${t('depart.exitDate')}</th>
          ${temporaire ? `<th>${t('depart.returnDate')}</th>` : ''}
          ${type === 'hospitalisation' ? `<th>${t('depart.facility')}</th>` : ''}
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
            ${temporaire ? `<td style="font-size:.83rem">${r.date_retour_prevue ? formatDate(r.date_retour_prevue) : '—'}</td>` : ''}
            ${type === 'hospitalisation' ? `<td style="font-size:.83rem">${escapeHtml(r.etablissement_sante || '—')}</td>` : ''}
            <td style="font-size:.83rem;max-width:200px">
              ${escapeHtml(type === 'deces' ? (r.motif_deces || '—') : (r.motif_sortie || '—'))}
            </td>
            <td>
              <div class="table-actions">
                ${temporaire
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
        if (isReceptionist()) {
          // RPC dédiée : la RLS bloque l'accès direct à residents pour l'accueil
          const { data, error } = await db.rpc('fn_accueil_retour', { p_resident_id: id });
          if (error || !data) { toastError(error?.message || t('common.error')); return; }
          toastSuccess(t('depart.restoreOk'));
          closeModal();
          _load();
          return;
        }
        // Récupérer les données de l'absence avant de les effacer
        const { data: res } = await db.from('residents')
          .select('statut_depart, date_sortie, date_retour_prevue, motif_sortie, etablissement_sante')
          .eq('id', id).single();
        if (res?.date_sortie) {
          await db.from('historique_sorties').insert({
            resident_id:        id,
            date_sortie:        res.date_sortie,
            date_retour:        new Date().toISOString(),
            date_retour_prevue: res.date_retour_prevue || null,
            motif_sortie:       res.motif_sortie || null,
            // Sans ce type, l'historique ne dirait pas s'il s'agissait
            // de vacances ou d'une hospitalisation
            type_sortie:         res.statut_depart || 'vacances',
            etablissement_sante: res.etablissement_sante || null,
          });
        }
        const { error } = await db.from('residents').update({
          statut_depart: null, date_sortie: null,
          date_retour_prevue: null, motif_sortie: null,
          etablissement_sante: null, actif: true
        }).eq('id', id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('depart.restoreOk'));
        closeModal();
        _load();
      }}
    ], 'modal-sm'
  );
}
