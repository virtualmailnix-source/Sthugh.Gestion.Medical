import { db }            from '../supabase.js';
import { openModal, closeModal } from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatDate, fullName, escapeHtml, debounce } from '../utils.js';
import { t, getLang }   from '../i18n.js';
import { isSuperAdmin } from '../auth.js';

export async function renderTraitements(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('treatments.title')}</h2>
        <span class="sub">${t('treatments.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input type="text" id="trt-search" placeholder="${t('treatments.searchPlaceholder')}">
        </div>
        <button class="btn btn-secondary" id="btn-meds-mgr">
          <i class="bi bi-list-ul"></i> ${t('treatments.manageMeds')}
        </button>
        <button class="btn btn-primary" id="btn-add-trt">
          <i class="bi bi-plus-lg"></i> ${t('treatments.addTreatment')}
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-chips">
        <button class="chip active" data-f="all">${t('treatments.filterAll')}</button>
        <button class="chip" data-f="urgent">${t('treatments.filterUrgent')}</button>
        <button class="chip" data-f="bientot">${t('treatments.filterSoon')}</button>
        <button class="chip" data-f="expire">${t('treatments.filterExpired')}</button>
        <button class="chip" data-f="chronique">${t('treatments.filterChronic')}</button>
        <button class="chip" data-f="stock"><i class="bi bi-box-seam"></i> ${t('treatments.filterStock')}</button>
      </div>
    </div>

    <div class="card"><div id="trt-table-wrap"></div></div>`;

  let _filter = 'all', _search = '';

  document.getElementById('btn-add-trt').addEventListener('click', () => openFormTraitement(null, null));
  document.getElementById('btn-meds-mgr').addEventListener('click', () => _openMedsManager(''));
  document.getElementById('trt-search').addEventListener('input', debounce(e => {
    _search = e.target.value; _load(_filter, _search);
  }, 300));
  document.querySelectorAll('.chip[data-f]').forEach(c =>
    c.addEventListener('click', e => {
      document.querySelectorAll('.chip[data-f]').forEach(x=>x.classList.remove('active'));
      e.target.classList.add('active');
      _filter = e.target.dataset.f; _load(_filter, _search);
    })
  );
  _load('all', '');
}

async function _load(filter, search) {
  const wrap = document.getElementById('trt-table-wrap');
  if (!wrap) return;

  let query = db.from('v_traitements_actifs').select('*');

  if (filter === 'urgent')   query = query.in('statut_alerte',['alerte_24h','expire_aujourd_hui']);
  if (filter === 'bientot')  query = query.in('statut_alerte',['alerte_24h','alerte_3j','expire_aujourd_hui']);
  if (filter === 'expire')   query = query.eq('statut_alerte','expire');
  if (filter === 'chronique') query = query.eq('statut_alerte','chronique');
  if (filter === 'stock')    query = query.in('statut_stock',['orange','rouge']).eq('actif',true);

  if (search) query = query.or(
    `resident_nom.ilike.%${search}%,resident_prenom.ilike.%${search}%,nom_medicament.ilike.%${search}%`
  );

  const { data, error } = await query;
  if (error) { toastError('Erreur chargement traitements'); return; }

  const rows = data || [];
  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-capsule"></i><p>${t('treatments.noTreatments')}</p></div>`;
    return;
  }

  wrap.innerHTML = `<div class="table-wrap"><table class="table">
    <thead><tr>
      <th>${t('treatments.colResident')}</th><th>${t('treatments.colRoom')}</th>
      <th>${t('treatments.colMed')}</th><th>${t('treatments.colDosage')}</th>
      <th>${t('treatments.colStart')}</th><th>${t('treatments.colEnd')}</th>
      <th>${t('treatments.colDays')}</th><th>${t('treatments.colStatus')}</th>
      <th>${t('treatments.colStock')}</th>
      <th style="text-align:right">&nbsp;</th>
    </tr></thead>
    <tbody>
      ${rows.map(r=>`<tr data-id="${r.id}">
        <td style="font-weight:600">${fullName(r.resident_nom,r.resident_prenom)}</td>
        <td><span class="badge badge-teal">${r.numero_chambre||'—'}</span></td>
        <td><strong>${r.nom_medicament}</strong>${r.dosage?'<br><small style="color:var(--text-light)">'+r.dosage+'</small>':''}</td>
        <td style="font-size:.83rem;max-width:160px">${r.posologie}</td>
        <td style="font-size:.83rem">${formatDate(r.date_debut)}</td>
        <td style="font-size:.83rem">
          ${r.traitement_chronique ? `<span class="badge badge-chronique">${t('status.chronique')}</span>`
            : r.date_fin ? formatDate(r.date_fin)+'<br><small style="color:var(--text-light)">'+r.duree_jours+' '+t('treatments.days')+'</small>'
            : '—'}
        </td>
        <td>
          ${r.traitement_chronique ? '—'
            : r.jours_restants === null ? '—'
            : `<span class="jours-badge ${_joursCls(r.jours_restants)}">
                <i class="bi ${r.jours_restants<=1?'bi-exclamation-triangle-fill':'bi-clock'}"></i>
                ${r.jours_restants <= 0 ? t('treatments.expired') : r.jours_restants+' '+(r.jours_restants>1?t('treatments.days'):t('treatments.day'))}
              </span>`}
        </td>
        <td>${_alerteBadge(r.statut_alerte)}</td>
        <td>${_stockBadge(r)}</td>
        <td><div class="table-actions">
          <button class="btn-icon" data-action="restock" title="${t('treatments.restock')}" style="color:var(--teal-mid)"><i class="bi bi-box-seam"></i></button>
          <button class="btn-icon" data-action="renew"  title="${t('treatments.renew')}" style="color:var(--teal-dark)"><i class="bi bi-arrow-clockwise"></i></button>
          <button class="btn-icon" data-action="edit"   title="${t('common.modify')}"><i class="bi bi-pencil-fill"></i></button>
          <button class="btn-icon" data-action="stop"   title="${t('treatments.stop')}" style="color:#d97706"><i class="bi bi-stop-circle-fill"></i></button>
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;

  // onclick : _load est rappelée sur le même élément, addEventListener empilerait
  wrap.onclick = e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('tr[data-id]');
    if (!row) return;
    const tid = row.dataset.id;
    const trow = rows.find(r=>r.id===tid);
    if (btn.dataset.action==='edit')    openFormTraitement(tid, null);
    if (btn.dataset.action==='renew')   _renewTraitement(trow);
    if (btn.dataset.action==='stop')    _stopTraitement(tid);
    if (btn.dataset.action==='restock') _openRestock(trow);
  };
}

// Badge stock : vert (OK) / orange (à racheter) / rouge (épuisé ou < 2 j)
function _stockBadge(r) {
  if (!r.statut_stock) return '<span style="color:var(--text-light);font-size:.8rem">—</span>';
  const rest = r.stock_restant !== null && r.stock_restant !== undefined
    ? `<br><small style="color:var(--text-light)">${Math.round(r.stock_restant)} ${r.unite || ''}</small>` : '';
  if (r.statut_stock === 'rouge')
    return `<span class="badge badge-expire"><i class="bi bi-exclamation-triangle-fill"></i> ${r.autonomie_jours !== null && r.autonomie_jours > 0 ? r.autonomie_jours + t('residents.daysAgo') : t('treatments.outOfStock')}</span>${rest}`;
  if (r.statut_stock === 'orange')
    return `<span class="badge badge-alerte-3j"><i class="bi bi-cart-plus"></i> ${t('treatments.statusOrange')}${r.autonomie_jours !== null ? ' · ' + r.autonomie_jours + t('residents.daysAgo') : ''}</span>${rest}`;
  return `<span class="badge badge-ok">${r.autonomie_jours !== null ? r.autonomie_jours + t('residents.daysAgo') : 'OK'}</span>${rest}`;
}

// ── Réapprovisionnement ───────────────────────────────────
function _openRestock(trow) {
  if (!trow) return;
  const condOk = trow.unites_par_plaquette > 0 && trow.plaquettes_par_boite > 0;
  const parBoite = condOk ? trow.unites_par_plaquette * trow.plaquettes_par_boite : 0;

  const body = `<form id="form-restock">
    <p style="margin-bottom:.75rem">
      <strong>${trow.nom_medicament}</strong> - ${trow.resident_prenom} ${trow.resident_nom}
    </p>
    <div style="font-size:.85rem;color:var(--text-light);margin-bottom:1rem">
      ${t('treatments.restockCurrent')} : <strong>${trow.stock_restant !== null ? Math.round(trow.stock_restant) : '—'} ${trow.unite || ''}</strong>
      ${trow.autonomie_jours !== null ? ` (${trow.autonomie_jours} ${t('treatments.days')})` : ''}
    </div>
    <div class="form-row">
      ${condOk ? `<div class="form-group">
        <label class="form-label">${t('treatments.restockBoxes')}</label>
        <input class="form-control" type="number" name="boites" min="0" step="1" placeholder="2">
        <div class="form-hint">1 ${t('treatments.box')} = ${parBoite} ${trow.unite || t('treatments.unitsShort')}</div>
      </div>` : ''}
      <div class="form-group">
        <label class="form-label">${t('treatments.restockUnits')}</label>
        <input class="form-control" type="number" name="unites" min="0" step="0.5" placeholder="20">
      </div>
    </div>
  </form>`;

  openModal(`<i class="bi bi-box-seam"></i> ${t('treatments.restockTitle')}`, body, [
    { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
    { label: t('treatments.restock'), cls:'btn btn-primary', action: async () => {
      const fd = new FormData(document.getElementById('form-restock'));
      const boites = parseInt(fd.get('boites')) || null;
      const unites = parseFloat(fd.get('unites')) || null;
      if (!boites && !unites) { toastError(t('treatments.restockQtyRequired')); return; }
      const { error } = await db.rpc('fn_reapprovisionner', {
        p_traitement_id: trow.id,
        p_boites: boites,
        p_unites: unites,
      });
      if (error) { toastError(error.message); return; }
      toastSuccess(t('treatments.restockOk'));
      closeModal();
      const container = document.getElementById('page-content');
      if (container) renderTraitements(container);
    }}
  ], 'modal-sm');
}

function _joursCls(j) {
  if (j <= 0) return 'badge-expire';
  if (j <= 1) return 'badge-alerte-24h';
  if (j <= 3) return 'badge-alerte-3j';
  if (j <= 7) return 'badge-alerte-7j';
  return 'badge-ok';
}

function _alerteBadge(s) {
  const map = {
    'alerte_24h':`<span class="badge badge-alerte-24h"><i class="bi bi-exclamation-triangle-fill"></i> ${t('status.alerte_24h')}</span>`,
    'expire':`<span class="badge badge-expire">${t('status.expire')}</span>`,
    'expire_aujourd_hui':`<span class="badge badge-expire">${t('status.expireAuj')}</span>`,
    'alerte_3j':`<span class="badge badge-alerte-3j">${t('status.alerte_3j')}</span>`,
    'alerte_7j':`<span class="badge badge-alerte-7j">${t('status.alerte_7j')}</span>`,
    'ok':`<span class="badge badge-ok">${t('status.ok')}</span>`,
    'chronique':`<span class="badge badge-chronique">${t('status.chronique')}</span>`,
  };
  return map[s]||s;
}

// ── Formulaire traitement ─────────────────────────────────
export async function openFormTraitement(id, prefillResidentId) {
  let trt = null;
  if (id) {
    const { data } = await db.from('traitements').select('*').eq('id',id).single();
    trt = data;
  }
  const tData = trt || {};

  const { data: residents } = await db.from('residents')
    .select('id,nom,prenom,numero_chambre').eq('actif',true).order('nom').limit(200);
  const { data: meds } = await db.from('medicaments')
    .select('id,nom_commercial,dosage_standard,forme').order('nom_commercial').limit(500);
  const { data: docs } = await db.from('doctors').select('id,titre,nom,prenom').eq('actif',true).order('nom');

  const resOpts = (residents||[]).map(r=>
    `<option value="${r.id}" ${(tData.resident_id||prefillResidentId)===r.id?'selected':''}>${r.prenom} ${r.nom} - Ch.${r.numero_chambre||'—'}</option>`
  ).join('');
  const docOpts = (docs||[]).map(d=>
    `<option value="${d.id}" ${tData.prescrit_par===d.id?'selected':''}>${d.titre||'Dr.'} ${d.prenom} ${d.nom}</option>`
  ).join('');
  const medOptions = (meds||[]).map(m=>
    `<option value="${m.nom_commercial}|${m.dosage_standard||''}">${m.nom_commercial}${m.forme?' ('+m.forme+')':''}</option>`
  ).join('');

  const isChronique = !!tData.traitement_chronique;

  const body = `<form id="form-trt">
    <div class="form-group">
      <label class="form-label">${t('treatments.resident')} <span class="required">*</span></label>
      <select class="form-control" name="resident_id" required>
        <option value="">${t('treatments.selectResident')}</option>${resOpts}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">${t('treatments.medication')} <span class="required">*</span></label>
      <datalist id="med-dl">${medOptions}</datalist>
      <input class="form-control" list="med-dl" name="nom_medicament" id="f-med-name"
        placeholder="${t('treatments.medication')}" value="${escapeHtml(tData.nom_medicament||'')}" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('treatments.dosage')}</label>
        <input class="form-control" name="dosage" id="f-dosage" placeholder="500mg" value="${escapeHtml(tData.dosage||'')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('treatments.prescriber')}</label>
        <select class="form-control" name="prescrit_par">
          <option value="">—</option>${docOpts}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('treatments.posology')} <span class="required">*</span></label>
      <input class="form-control" name="posologie" placeholder="${t('treatments.posologyPlaceholder')}" value="${escapeHtml(tData.posologie||'')}" required>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-box-seam"></i> ${t('treatments.secStock')}</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('treatments.dosePerIntake')}</label>
          <input class="form-control stock-field" type="number" name="dose_par_prise" min="0" step="0.5" value="${tData.dose_par_prise||''}" placeholder="1">
        </div>
        <div class="form-group">
          <label class="form-label">${t('treatments.intakesPerDay')}</label>
          <input class="form-control stock-field" type="number" name="prises_par_jour" min="0" step="0.5" value="${tData.prises_par_jour||''}" placeholder="2">
        </div>
        <div class="form-group">
          <label class="form-label">${t('treatments.unit')}</label>
          <select class="form-control" name="unite">
            <option value="">—</option>
            <option value="comprimé" ${tData.unite==='comprimé'?'selected':''}>${t('treatments.unitCp')}</option>
            <option value="sachet" ${tData.unite==='sachet'?'selected':''}>${t('treatments.unitSachet')}</option>
            <option value="ml" ${tData.unite==='ml'?'selected':''}>${t('treatments.unitMl')}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('treatments.unitsPerBlister')}</label>
          <input class="form-control stock-field" type="number" name="unites_par_plaquette" min="1" value="${tData.unites_par_plaquette||''}" placeholder="10">
        </div>
        <div class="form-group">
          <label class="form-label">${t('treatments.blistersPerBox')}</label>
          <input class="form-control stock-field" type="number" name="plaquettes_par_boite" min="1" value="${tData.plaquettes_par_boite||''}" placeholder="2">
        </div>
        <div class="form-group">
          <label class="form-label">${t('treatments.stockBoxes')}</label>
          <input class="form-control stock-field" type="number" name="stock_boites" min="0" step="0.5" placeholder="1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('treatments.stockUnits')}</label>
          <input class="form-control stock-field" type="number" name="stock_initial_unites" min="0" step="0.5" value="${tData.stock_initial_unites||''}" placeholder="20">
          <div class="form-hint">${t('treatments.stockUnitsHint')}</div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('treatments.safetyMargin')}</label>
          <input class="form-control stock-field" type="number" name="marge_securite_jours" min="0" value="${tData.marge_securite_jours??7}">
        </div>
      </div>
      <div class="form-hint" id="stock-preview" style="font-weight:600"></div>
      <div class="form-group" style="margin-top:.6rem">
        <label class="form-label">${t('treatments.estimatedEnd')}</label>
        <input class="form-control" type="date" name="date_fin_estimee" value="${tData.date_fin_estimee||''}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('treatments.startDate')} <span class="required">*</span></label>
        <input class="form-control" type="date" name="date_debut" value="${tData.date_debut||new Date().toISOString().slice(0,10)}" required>
      </div>
      <div class="form-group" id="duree-group" ${isChronique?'style="display:none"':''}>
        <label class="form-label">${t('treatments.duration')}</label>
        <input class="form-control" type="number" name="duree_jours" id="f-duree" min="1" value="${tData.duree_jours||''}">
        <div class="form-hint" id="date-fin-preview"></div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
      <div class="toggle-wrap">
        <div class="toggle ${isChronique?'on':''}" id="toggle-chronique"></div>
        <label style="font-size:.9rem;cursor:pointer" id="label-chronique">
          ${isChronique ? t('treatments.chronic') : t('treatments.limited')}
        </label>
      </div>
    </div>
    <input type="hidden" name="traitement_chronique" id="f-chronique" value="${isChronique?'true':'false'}">
    <div class="form-group">
      <label class="form-label">${t('common.notes')}</label>
      <textarea class="form-control" name="notes" rows="2">${escapeHtml(tData.notes||'')}</textarea>
    </div>
    <div style="display:flex;align-items:center;gap:.75rem">
      <input type="checkbox" id="alerte-check" name="alerte_renouvellement" value="true" ${tData.alerte_renouvellement!==false?'checked':''}>
      <label for="alerte-check" style="font-size:.88rem;cursor:pointer">${t('treatments.alertRenewal')}</label>
    </div>
  </form>`;

  openModal(
    id ? `<i class="bi bi-pencil-fill"></i> ${t('treatments.formTitleEdit')}` : `<i class="bi bi-capsule-pill"></i> ${t('treatments.formTitleNew')}`,
    body,
    [
      { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
      { label: id ? t('common.modify') : t('common.save'), cls:'btn btn-primary', action: () => _submitTrt(id, tData) }
    ], 'modal-lg'
  );

  // Prévisualisation autonomie du stock
  document.querySelectorAll('#form-trt .stock-field').forEach(el =>
    el.addEventListener('input', _previewStock)
  );
  _previewStock();

  // Toggle chronique
  const toggle = document.getElementById('toggle-chronique');
  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('on');
    const on = toggle.classList.contains('on');
    document.getElementById('f-chronique').value = on ? 'true' : 'false';
    document.getElementById('label-chronique').textContent = on ? t('treatments.chronic') : t('treatments.limited');
    document.getElementById('duree-group').style.display = on ? 'none' : '';
  });

  // Preview date de fin
  ['f-duree','[name="date_debut"]'].forEach(sel => {
    document.querySelector(sel)?.addEventListener('input', _previewDateFin);
  });
  _previewDateFin();

  // Autocomplétion dosage
  document.getElementById('f-med-name')?.addEventListener('input', e => {
    const val = e.target.value;
    const med = (meds||[]).find(m=>m.nom_commercial===val);
    const dosEl = document.getElementById('f-dosage');
    if (med && dosEl && !dosEl.value && med.dosage_standard) dosEl.value = med.dosage_standard;
  });
}

// Calcule stock total (unités) + autonomie depuis les champs du formulaire
function _stockFromForm() {
  const g = n => parseFloat(document.querySelector(`#form-trt [name="${n}"]`)?.value) || 0;
  const dose   = g('dose_par_prise');
  const prises = g('prises_par_jour');
  const upp    = g('unites_par_plaquette');
  const ppb    = g('plaquettes_par_boite');
  const boites = g('stock_boites');
  let unites   = g('stock_initial_unites');
  // Les boîtes priment si le conditionnement est complet
  if (boites > 0 && upp > 0 && ppb > 0) unites = boites * ppb * upp;
  const conso = dose * prises;
  return { unites, conso, autonomie: conso > 0 && unites > 0 ? Math.floor(unites / conso) : null };
}

function _previewStock() {
  const prev = document.getElementById('stock-preview');
  if (!prev) return;
  const { unites, conso, autonomie } = _stockFromForm();
  if (autonomie === null) { prev.textContent = ''; return; }
  const fin = new Date();
  fin.setDate(fin.getDate() + autonomie);
  const locale = getLang() === 'en' ? 'en-MU' : 'fr-MU';
  prev.textContent = `${t('treatments.stockPreview')}: ${unites} ${t('treatments.unitsShort')} ÷ ${conso}/j → ${autonomie} ${t('treatments.days')} (${fin.toLocaleDateString(locale)})`;
}

function _previewDateFin() {
  const duree  = +document.getElementById('f-duree')?.value;
  const debut  = document.querySelector('[name="date_debut"]')?.value;
  const prev   = document.getElementById('date-fin-preview');
  if (!prev) return;
  if (duree > 0 && debut) {
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + duree);
    const locale = getLang() === 'en' ? 'en-MU' : 'fr-MU';
    prev.textContent = t('treatments.endPreview') + ' ' + fin.toLocaleDateString(locale,{day:'2-digit',month:'long',year:'numeric'});
  } else {
    prev.textContent = '';
  }
}

async function _submitTrt(id, prev = {}) {
  const form = document.getElementById('form-trt');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const fd = new FormData(form);
  const data = {};
  fd.forEach((v,k) => { if(v!=='') data[k]=v; });
  data.traitement_chronique = data.traitement_chronique === 'true';
  data.alerte_renouvellement = !!document.getElementById('alerte-check')?.checked;
  if (data.traitement_chronique) { delete data.duree_jours; }

  // Stock : les boîtes sont un raccourci de saisie, pas une colonne
  const { unites } = _stockFromForm();
  delete data.stock_boites;
  if (unites > 0) {
    data.stock_initial_unites = unites;
    // Création : le stock correspond au début du traitement.
    // Édition : si la quantité change, le décompte repart d'aujourd'hui.
    if (!id) {
      data.date_stock = data.date_debut || new Date().toISOString().slice(0,10);
    } else if (String(unites) !== String(prev.stock_initial_unites ?? '')) {
      data.date_stock = new Date().toISOString().slice(0,10);
    }
  } else {
    data.stock_initial_unites = null;
  }

  const { error } = id
    ? await db.from('traitements').update(data).eq('id',id)
    : await db.from('traitements').insert(data);

  if (error) { toastError(error.message); return; }
  toastSuccess(id ? t('treatments.modified') : t('treatments.added'));
  closeModal();
  const container = document.getElementById('page-content');
  if (container) renderTraitements(container);
}

async function _renewTraitement(trow) {
  if (!trow) return;
  const body = `<form id="form-renew">
    <p style="margin-bottom:1rem">${t('treatments.renewFor')} <strong>${trow.nom_medicament}</strong> - <strong>${trow.resident_prenom} ${trow.resident_nom}</strong></p>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('treatments.newStartDate')} <span class="required">*</span></label>
        <input class="form-control" type="date" name="date_debut" value="${new Date().toISOString().slice(0,10)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">${t('treatments.duration')} <span class="required">*</span></label>
        <input class="form-control" type="number" name="duree_jours" min="1" value="${trow.duree_jours||30}" required>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('treatments.posology')}</label>
      <input class="form-control" name="posologie" value="${escapeHtml(trow.posologie)}">
    </div>
  </form>`;

  openModal(`<i class="bi bi-arrow-clockwise"></i> ${t('treatments.renewTitle')}`, body, [
    { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
    { label: t('treatments.renewBtn'), cls:'btn btn-primary', action: async () => {
      const form = document.getElementById('form-renew');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const fd = new FormData(form);
      const data = Object.fromEntries([...fd.entries()]);
      data.resident_id = trow.resident_id;
      data.nom_medicament = trow.nom_medicament;
      data.dosage = trow.dosage;
      data.alerte_renouvellement = true;
      data.traitement_chronique = false;
      data.actif = true;

      // Désactiver l'ancien
      await db.from('traitements').update({ actif: false }).eq('id', trow.id);
      // Créer nouveau
      const { error } = await db.from('traitements').insert(data);
      if (error) { toastError(error.message); return; }

      toastSuccess(t('treatments.renewed'));
      closeModal();
      const container = document.getElementById('page-content');
      if (container) renderTraitements(container);
    }}
  ]);
}

async function _stopTraitement(id) {
  openModal(`<i class="bi bi-stop-circle-fill" style="color:#d97706"></i> ${t('treatments.stopTitle')}`,
    `<p>${t('treatments.stopConfirm')}</p>`,
    [
      { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
      { label: t('treatments.stopBtn'), cls:'btn btn-danger', action: async () => {
        const { error } = await db.from('traitements').update({ actif:false }).eq('id',id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('treatments.stopped'));
        closeModal();
        const container = document.getElementById('page-content');
        if (container) renderTraitements(container);
      }}
    ], 'modal-sm'
  );
}

// ── Gestion catalogue médicaments ────────────────────────
export async function _openMedsManager(search = '') {
  const sa = isSuperAdmin();
  let query = db.from('medicaments').select('*').order('nom_commercial').limit(500);
  if (search) query = query.or(`nom_commercial.ilike.%${search}%,nom_generique.ilike.%${search}%,classe.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) { toastError(t('treatments.loadError')); return; }
  const meds = data || [];

  const rows = meds.map(m => `
    <tr data-id="${m.id}">
      <td style="font-weight:600">${escapeHtml(m.nom_commercial)}</td>
      <td style="font-size:.83rem;color:var(--text-light)">${escapeHtml(m.nom_generique || '—')}</td>
      <td style="font-size:.83rem">${escapeHtml(m.forme || '—')}</td>
      <td style="font-size:.83rem">${escapeHtml(m.dosage_standard || '—')}</td>
      <td style="font-size:.83rem">${escapeHtml(m.classe || '—')}</td>
      <td><div class="table-actions">
        <button class="btn-icon" data-action="edit" title="${t('common.modify')}"><i class="bi bi-pencil-fill"></i></button>
        ${sa ? `<button class="btn-icon" data-action="delete" title="${t('common.delete')}" style="color:#dc2626"><i class="bi bi-trash3-fill"></i></button>` : ''}
      </div></td>
    </tr>`).join('');

  const body = `
    <p style="font-size:.82rem;color:var(--text-light);margin-bottom:.75rem">${t('treatments.medsSubtitle')}</p>
    <div style="display:flex;gap:.75rem;margin-bottom:.75rem;align-items:center">
      <div class="search-bar" style="flex:1">
        <i class="bi bi-search"></i>
        <input type="text" id="meds-search-q" placeholder="${t('treatments.searchPlaceholder')}" value="${escapeHtml(search)}" style="width:100%">
      </div>
      <button class="btn btn-primary btn-sm" id="btn-add-med-inner">
        <i class="bi bi-plus-lg"></i> ${t('treatments.addMed')}
      </button>
    </div>
    <div style="font-size:.78rem;color:var(--text-light);margin-bottom:.5rem">${meds.length} ${t('treatments.medCount')}</div>
    <div class="table-wrap" style="max-height:400px;overflow-y:auto">
      <table class="table">
        <thead><tr>
          <th>${t('treatments.colMedName')}</th><th>${t('treatments.colGenName')}</th>
          <th>${t('treatments.colMedForm')}</th><th>${t('treatments.colMedDosage')}</th>
          <th>${t('treatments.colMedClass')}</th><th style="text-align:right"></th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-light)">${t('treatments.noMeds')}</td></tr>`}</tbody>
      </table>
    </div>`;

  openModal(
    `<i class="bi bi-capsule-pill"></i> ${t('treatments.medsTitle')}`,
    body,
    [{ label: t('common.close'), cls: 'btn btn-secondary', action: closeModal }],
    'modal-xl'
  );

  document.getElementById('meds-search-q')?.addEventListener('input', debounce(e => {
    _openMedsManager(e.target.value);
  }, 300));

  document.getElementById('btn-add-med-inner')?.addEventListener('click', () => _openMedForm(null));

  document.querySelector('#modal-body .table-wrap')?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    const row = btn?.closest('tr[data-id]');
    if (!btn || !row) return;
    const id = row.dataset.id;
    if (btn.dataset.action === 'edit')   _openMedForm(id);
    if (btn.dataset.action === 'delete') _deleteMed(id);
  });
}

async function _openMedForm(id) {
  let med = null;
  if (id) {
    const { data } = await db.from('medicaments').select('*').eq('id', id).single();
    med = data;
  }
  const m = med || {};
  const locale = getLang();

  const body = `<form id="form-med">
    <div class="form-group">
      <label class="form-label">${t('treatments.medNameLabel')} <span class="required">*</span></label>
      <input class="form-control" name="nom_commercial" value="${escapeHtml(m.nom_commercial || '')}" required>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('treatments.medGenLabel')}</label>
        <input class="form-control" name="nom_generique" value="${escapeHtml(m.nom_generique || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('treatments.medFormLabel')}</label>
        <input class="form-control" name="forme" value="${escapeHtml(m.forme || '')}" placeholder="${t('treatments.medFormPlaceholder')}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('treatments.medDosageLabel')}</label>
        <input class="form-control" name="dosage_standard" value="${escapeHtml(m.dosage_standard || '')}" placeholder="500mg, 10mg/ml…">
      </div>
      <div class="form-group">
        <label class="form-label">${t('treatments.medClassLabel')}</label>
        <input class="form-control" name="classe" value="${escapeHtml(m.classe || '')}" placeholder="${locale==='en'?'Analgesic, Antibiotic…':'Analgésique, Antibiotique…'}">
      </div>
    </div>
  </form>`;

  openModal(
    id ? `<i class="bi bi-pencil-fill"></i> ${t('treatments.editMedTitle')}` : `<i class="bi bi-plus-lg"></i> ${t('treatments.newMedTitle')}`,
    body,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: () => _openMedsManager('') },
      { label: id ? t('common.modify') : t('common.save'), cls: 'btn btn-primary', action: () => _saveMed(id) }
    ],
    'modal-lg'
  );
}

async function _saveMed(id) {
  const form = document.getElementById('form-med');
  if (!form?.checkValidity()) { form?.reportValidity(); return; }
  const fd = new FormData(form);
  const data = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));

  const { error } = id
    ? await db.from('medicaments').update(data).eq('id', id)
    : await db.from('medicaments').insert(data);

  if (error) { toastError(error.message); return; }
  toastSuccess(t('treatments.medSaved'));
  _openMedsManager('');
}

async function _deleteMed(id) {
  openModal(
    `<i class="bi bi-exclamation-triangle-fill" style="color:#dc2626"></i> ${t('common.delete')}`,
    `<p>${t('treatments.medDeleteConfirm')}</p>`,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary', action: () => _openMedsManager('') },
      { label: t('common.delete'), cls: 'btn btn-danger', action: async () => {
        const { error } = await db.from('medicaments').delete().eq('id', id);
        if (error) { toastError(error.message); return; }
        toastSuccess(t('treatments.medDeleted'));
        _openMedsManager('');
      }}
    ],
    'modal-sm'
  );
}
