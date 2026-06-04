import { db }            from '../supabase.js';
import { openModal, closeModal } from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatDate, fullName, escapeHtml, debounce, calcAge } from '../utils.js';

const PAGE_SIZE = 15;
let _page   = 1;
let _search = '';

export async function renderOrdonnances(container) {
  _page = 1; _search = '';
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Ordonnances</h2>
        <span class="sub">Rédaction et impression des ordonnances</span>
      </div>
      <div class="page-header-actions">
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input type="text" id="ord-search" placeholder="Patient, numéro…">
        </div>
        <button class="btn btn-primary" id="btn-new-ord">
          <i class="bi bi-file-earmark-plus-fill"></i> Nouvelle ordonnance
        </button>
      </div>
    </div>
    <div class="card">
      <div id="ord-table-wrap"></div>
    </div>
    <div id="ord-pagination"></div>`;

  document.getElementById('btn-new-ord').addEventListener('click', () => openFormOrdonnance(null));
  document.getElementById('ord-search').addEventListener('input', debounce(e => {
    _search = e.target.value; _page = 1; _load();
  }, 300));

  _load();
}

async function _load() {
  const wrap = document.getElementById('ord-table-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<div style="padding:1.5rem">${_sk()}</div>`;

  let query = db.from('ordonnances')
    .select(`id,numero,date_ordonnance,notes,patients(nom,prenom,numero_dossier)`, { count:'exact' })
    .order('date_ordonnance', { ascending:false })
    .range((_page-1)*PAGE_SIZE, _page*PAGE_SIZE-1);

  if (_search) query = query.or(
    `numero.ilike.%${_search}%,patients.nom.ilike.%${_search}%`
  );

  const { data, error, count } = await query;
  if (error) { toastError('Erreur chargement ordonnances'); return; }

  const rows = data || [];
  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-file-earmark-medical"></i><p>Aucune ordonnance</p></div>`;
    return;
  }

  wrap.innerHTML = `<div class="table-wrap"><table class="table">
    <thead><tr>
      <th>N° Ordonnance</th><th>Patient</th><th>Date</th><th style="text-align:right">Actions</th>
    </tr></thead>
    <tbody>
      ${rows.map(o=>`<tr data-id="${o.id}">
        <td><span class="badge badge-teal">${o.numero||'—'}</span></td>
        <td style="font-weight:600">${o.patients ? fullName(o.patients.nom,o.patients.prenom) : '—'}</td>
        <td style="font-size:.88rem">${formatDate(o.date_ordonnance)}</td>
        <td><div class="table-actions">
          <button class="btn-icon" data-action="print"  title="Imprimer"><i class="bi bi-printer-fill"></i></button>
          <button class="btn-icon" data-action="edit"   title="Modifier"><i class="bi bi-pencil-fill"></i></button>
          <button class="btn-icon" data-action="delete" title="Supprimer" style="color:#dc2626"><i class="bi bi-trash3-fill"></i></button>
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;

  _renderPagination(count||0);

  wrap.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('tr[data-id]');
    if (btn.dataset.action==='print')  _printOrdonnance(row.dataset.id);
    if (btn.dataset.action==='edit')   openFormOrdonnance(row.dataset.id);
    if (btn.dataset.action==='delete') _confirmDelete(row.dataset.id);
  });
}

function _renderPagination(total) {
  const pages = Math.ceil(total/PAGE_SIZE);
  const wrap  = document.getElementById('ord-pagination');
  if (!wrap || pages<=1) { if(wrap) wrap.innerHTML=''; return; }
  wrap.innerHTML = `<div class="pagination">
    <button class="page-btn" ${_page===1?'disabled':''} data-p="${_page-1}"><i class="bi bi-chevron-left"></i></button>
    ${Array.from({length:pages},(_,i)=>i+1).map(i=>
      Math.abs(i-_page)<=2||i===1||i===pages
        ? `<button class="page-btn ${i===_page?'active':''}" data-p="${i}">${i}</button>`
        : (Math.abs(i-_page)===3?`<span style="padding:0 .3rem">…</span>`:'')
    ).join('')}
    <button class="page-btn" ${_page===pages?'disabled':''} data-p="${_page+1}"><i class="bi bi-chevron-right"></i></button>
  </div>`;
  wrap.addEventListener('click', e => {
    const btn = e.target.closest('[data-p]');
    if (btn && !btn.disabled) { _page=+btn.dataset.p; _load(); }
  });
}

// ── Formulaire ordonnance ─────────────────────────────────
export async function openFormOrdonnance(id, prefillPatientId) {
  let ord = null;
  let lignes = [];
  if (id) {
    const [ordRes, ligRes] = await Promise.all([
      db.from('ordonnances').select('*').eq('id',id).single(),
      db.from('ordonnance_lignes').select('*').eq('ordonnance_id',id).order('ordre')
    ]);
    ord    = ordRes.data;
    lignes = ligRes.data || [];
  }
  const o = ord || {};

  const { data: patients } = await db.from('patients')
    .select('id,nom,prenom,numero_dossier').eq('actif',true).order('nom').limit(200);
  const { data: meds } = await db.from('medicaments')
    .select('id,nom_commercial,forme,dosage_standard').order('nom_commercial').limit(500);

  const pats = patients || [];
  const medList = meds || [];
  const medOptions = medList.map(m=>`<option value="${m.nom_commercial}|${m.dosage_standard||''}">${m.nom_commercial}${m.forme?' ('+m.forme+')':''}</option>`).join('');

  const patOpts = pats.map(p=>`<option value="${p.id}" ${(o.patient_id||prefillPatientId)===p.id?'selected':''}>${p.nom} ${p.prenom} (${p.numero_dossier||'—'})</option>`).join('');

  if (!lignes.length) lignes = [{ nom_medicament:'', dosage:'', posologie:'', duree:'', quantite:'' }];

  const body = `<form id="form-ord">
    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-person-fill"></i> Patient</div>
      <div class="form-row">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">Patient <span class="required">*</span></label>
          <select class="form-control" name="patient_id" required>
            <option value="">— Sélectionner —</option>${patOpts}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date <span class="required">*</span></label>
          <input class="form-control" type="date" name="date_ordonnance"
            value="${o.date_ordonnance||new Date().toISOString().slice(0,10)}" required>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-capsule-pill"></i> Médicaments prescrits</div>
      <datalist id="med-list">${medOptions}</datalist>
      <div id="lignes-container">
        ${lignes.map((l,i)=>_ligneHTML(l,i)).join('')}
      </div>
      <button type="button" class="btn btn-secondary btn-sm" id="btn-add-ligne" style="margin-top:.5rem">
        <i class="bi bi-plus-lg"></i> Ajouter un médicament
      </button>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-chat-text"></i> Notes</div>
      <div class="form-group">
        <textarea class="form-control" name="notes" rows="2" placeholder="Instructions particulières…">${escapeHtml(o.notes||'')}</textarea>
      </div>
    </div>
  </form>`;

  openModal(
    id ? '<i class="bi bi-pencil-fill"></i> Modifier l\'ordonnance' : '<i class="bi bi-file-earmark-plus-fill"></i> Nouvelle ordonnance',
    body,
    [
      { label:'Annuler',      cls:'btn btn-secondary', action: closeModal },
      { label: id ? 'Modifier' : 'Créer', cls:'btn btn-primary', action: () => _submitOrd(id) },
      { label:'Créer & Imprimer', cls:'btn btn-success', action: () => _submitOrd(id, true) }
    ],
    'modal-xl'
  );

  let ligneCount = lignes.length;
  document.getElementById('btn-add-ligne')?.addEventListener('click', () => {
    const c = document.getElementById('lignes-container');
    const div = document.createElement('div');
    div.innerHTML = _ligneHTML({}, ligneCount++);
    c.appendChild(div.firstElementChild);
    _bindRemoveLigne();
  });
  _bindRemoveLigne();

  // Autocomplétion médicament → dosage
  document.getElementById('lignes-container')?.addEventListener('input', e => {
    if (!e.target.classList.contains('med-input')) return;
    const val  = e.target.value;
    const med  = medList.find(m=>m.nom_commercial===val || val.startsWith(m.nom_commercial));
    if (!med) return;
    const row  = e.target.closest('.med-line-row');
    const dos  = row?.querySelector('.med-dosage');
    if (dos && !dos.value && med.dosage_standard) dos.value = med.dosage_standard;
  });
}

function _ligneHTML(l, i) {
  return `<div class="med-line-row" style="display:grid;grid-template-columns:1.8fr 1fr 2fr 1fr 80px auto;gap:.6rem;align-items:start;padding:.75rem;background:var(--bg-alt);border-radius:var(--radius-sm);border:1px solid var(--card-border);margin-bottom:.5rem">
    <div>
      <label class="form-label" style="font-size:.72rem">Médicament <span class="required">*</span></label>
      <input class="form-control med-input" list="med-list" name="nom_medicament[${i}]"
        placeholder="Nom du médicament" value="${escapeHtml(l.nom_medicament||'')}" required>
    </div>
    <div>
      <label class="form-label" style="font-size:.72rem">Dosage</label>
      <input class="form-control med-dosage" name="dosage[${i}]" placeholder="500mg" value="${escapeHtml(l.dosage||'')}">
    </div>
    <div>
      <label class="form-label" style="font-size:.72rem">Posologie <span class="required">*</span></label>
      <input class="form-control" name="posologie[${i}]" placeholder="1 cp matin, midi, soir" value="${escapeHtml(l.posologie||'')}" required>
    </div>
    <div>
      <label class="form-label" style="font-size:.72rem">Durée</label>
      <input class="form-control" name="duree[${i}]" placeholder="7 jours" value="${escapeHtml(l.duree||'')}">
    </div>
    <div>
      <label class="form-label" style="font-size:.72rem">Qté</label>
      <input class="form-control" type="number" name="quantite[${i}]" placeholder="1" value="${l.quantite||''}">
    </div>
    <div style="padding-top:1.5rem">
      <button type="button" class="btn-icon btn-remove-ligne" style="color:#dc2626" title="Supprimer">
        <i class="bi bi-trash3"></i>
      </button>
    </div>
  </div>`;
}

function _bindRemoveLigne() {
  document.querySelectorAll('.btn-remove-ligne').forEach(btn => {
    btn.onclick = () => {
      const rows = document.querySelectorAll('.med-line-row');
      if (rows.length > 1) btn.closest('.med-line-row').remove();
    };
  });
}

async function _submitOrd(id, print = false) {
  const form = document.getElementById('form-ord');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const fd = new FormData(form);

  const ordData = {
    patient_id:      fd.get('patient_id'),
    date_ordonnance: fd.get('date_ordonnance'),
    notes:           fd.get('notes') || null,
  };

  const { data: saved, error } = id
    ? await db.from('ordonnances').update(ordData).eq('id',id).select().single()
    : await db.from('ordonnances').insert(ordData).select().single();

  if (error) { toastError(error.message); return; }

  // Lignes
  const oid = saved.id;
  await db.from('ordonnance_lignes').delete().eq('ordonnance_id', oid);

  const rows = document.querySelectorAll('.med-line-row');
  const lignesData = [];
  rows.forEach((row, idx) => {
    const nom = row.querySelector(`[name^="nom_medicament"]`)?.value?.trim();
    if (!nom) return;
    lignesData.push({
      ordonnance_id:   oid,
      nom_medicament:  nom,
      dosage:          row.querySelector(`[name^="dosage"]`)?.value    || null,
      posologie:       row.querySelector(`[name^="posologie"]`)?.value || '',
      duree:           row.querySelector(`[name^="duree"]`)?.value     || null,
      quantite:        +row.querySelector(`[name^="quantite"]`)?.value || null,
      ordre:           idx + 1
    });
  });
  if (lignesData.length) await db.from('ordonnance_lignes').insert(lignesData);

  toastSuccess(id ? 'Ordonnance modifiée' : 'Ordonnance créée');
  closeModal();

  if (print) {
    await _printOrdonnance(oid);
  } else {
    _load();
  }
}

async function _printOrdonnance(id) {
  const [ordRes, ligRes, medRes] = await Promise.all([
    db.from('ordonnances').select('*,patients(*)').eq('id',id).single(),
    db.from('ordonnance_lignes').select('*').eq('ordonnance_id',id).order('ordre'),
    db.from('medecin').select('*').limit(1)
  ]);

  const ord   = ordRes.data;
  const lignes = ligRes.data || [];
  const med   = medRes.data?.[0] || {};
  const p     = ord?.patients || {};

  const age   = calcAge(p.date_naissance);
  const zone  = document.getElementById('print-zone');
  if (!zone) return;

  zone.innerHTML = `<div class="rx-page">
    <header class="rx-header">
      <div class="cabinet-name">Cabinet St Hugh Anglican</div>
      <div class="medecin-name">${med.titre||'Dr.'} ${med.prenom||''} ${med.nom||''}</div>
      <div class="medecin-spec">${med.specialite||'Médecine Générale'}</div>
      <div class="medecin-contact">${[med.adresse, med.ville, med.telephone].filter(Boolean).join(' &mdash; ')}</div>
      ${med.numero_ordre ? `<div class="medecin-contact">N° Ordre: ${med.numero_ordre}</div>` : ''}
    </header>

    <div class="rx-patient">
      <div>
        <strong>Patient:</strong> ${fullName(p.nom,p.prenom)}
        ${age !== null ? ` &mdash; ${age} ans` : ''}
        ${p.sexe ? ` &mdash; ${p.sexe}` : ''}
      </div>
      <div>
        <strong>Date:</strong> ${formatDate(ord.date_ordonnance)}
        &nbsp; <strong>N°:</strong> ${ord.numero||'—'}
      </div>
    </div>

    <div class="rx-body">
      <div class="rx-symbol">&#x211E;</div>
      ${lignes.map(l=>`<div class="rx-med-item">
        <div class="rx-med-name">${escapeHtml(l.nom_medicament)}${l.dosage?' '+escapeHtml(l.dosage):''}</div>
        <div class="rx-med-posologie">
          ${escapeHtml(l.posologie)}
          ${l.duree    ? ` &mdash; Durée: ${escapeHtml(l.duree)}` : ''}
          ${l.quantite ? ` &mdash; Qté: ${l.quantite}` : ''}
        </div>
      </div>`).join('')}
      ${ord.notes ? `<div style="margin-top:5mm;font-style:italic;font-size:9pt">${escapeHtml(ord.notes)}</div>` : ''}
    </div>

    <footer class="rx-footer">
      <div>${med.adresse||''}<br>${med.ville||''} &mdash; ${med.pays||'Haïti'}</div>
      <div style="text-align:right">
        <div style="min-height:15mm;border-top:.5pt solid #000;width:50mm;text-align:center;padding-top:2mm;margin-left:auto">
          Cachet &amp; Signature
        </div>
      </div>
    </footer>
  </div>`;

  window.print();
  zone.innerHTML = '';
  _load();
}

async function _confirmDelete(id) {
  openModal(
    '<i class="bi bi-exclamation-triangle-fill" style="color:#dc2626"></i> Supprimer',
    '<p>Voulez-vous vraiment supprimer cette ordonnance ?</p>',
    [
      { label:'Annuler',   cls:'btn btn-secondary', action: closeModal },
      { label:'Supprimer', cls:'btn btn-danger',    action: async () => {
        const { error } = await db.from('ordonnances').delete().eq('id',id);
        if (error) { toastError(error.message); return; }
        toastSuccess('Ordonnance supprimée');
        closeModal();
        _load();
      }}
    ], 'modal-sm'
  );
}

function _sk() { return Array(5).fill(0).map(()=>`<div class="skeleton skeleton-text" style="height:44px;margin-bottom:.5rem"></div>`).join(''); }
