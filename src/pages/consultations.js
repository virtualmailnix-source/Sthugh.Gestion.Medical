import { db }               from '../supabase.js';
import { openModal, closeModal } from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { isSuperAdmin }       from '../auth.js';
import {
  formatDate, fullName, escapeHtml, debounce, nowLocalInput, todayISO
} from '../utils.js';
import { t } from '../i18n.js';
import { resolveOrdonnances, uploadOrdonnance, removeOrdonnance } from '../storage.js';

const PAGE_SIZE = 15;
let _page = 1, _search = '', _dateFrom = todayISO(), _dateTo = todayISO();

export async function renderConsultations(container) {
  _page = 1;
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('consultations.title')}</h2>
        <span class="sub">${t('consultations.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <div class="search-bar">
          <i class="bi bi-search"></i>
          <input type="text" id="cons-search" placeholder="${t('consultations.searchPlaceholder')}">
        </div>
        <button class="btn btn-primary" id="btn-new-cons">
          <i class="bi bi-journal-plus"></i> ${t('consultations.addConsult')}
        </button>
      </div>
    </div>
    <div class="filter-bar">
      <label style="font-size:.82rem;font-weight:700;color:var(--text-mid)">${t('consultations.from')}</label>
      <input type="date" id="df" class="form-control" style="width:auto" value="${_dateFrom}">
      <label style="font-size:.82rem;font-weight:700;color:var(--text-mid)">${t('consultations.to')}</label>
      <input type="date" id="dt" class="form-control" style="width:auto" value="${_dateTo}">
      <button class="chip active" id="b-today">${t('consultations.todayShort')}</button>
      <button class="chip" id="b-week">${t('consultations.weekShort')}</button>
      <button class="chip" id="b-month">${t('consultations.monthShort')}</button>
      <button class="chip" id="b-all">${t('consultations.allShort')}</button>
    </div>
    <div class="card"><div id="cons-wrap"></div></div>
    <div id="cons-pages"></div>`;

  document.getElementById('btn-new-cons').addEventListener('click', () => openFormConsultation(null, null));
  document.getElementById('cons-search').addEventListener('input', debounce(e => {
    _search = e.target.value; _page=1; _load();
  }, 300));
  ['df','dt'].forEach(id => document.getElementById(id)?.addEventListener('change', e => {
    if(id==='df') _dateFrom=e.target.value; else _dateTo=e.target.value; _page=1; _load();
  }));

  const ranges = {
    'b-today': () => { _dateFrom=_dateTo=todayISO(); },
    'b-week':  () => { _dateTo=todayISO(); _dateFrom=_ago(6); },
    'b-month': () => { _dateTo=todayISO(); _dateFrom=_ago(29); },
    'b-all':   () => { _dateFrom=''; _dateTo=''; },
  };
  Object.entries(ranges).forEach(([id,fn]) =>
    document.getElementById(id)?.addEventListener('click', () => {
      fn();
      document.getElementById('df').value=_dateFrom;
      document.getElementById('dt').value=_dateTo;
      _page=1; _load();
    })
  );
  _load();
}

function _ago(n) {
  const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10);
}

async function _load() {
  const wrap = document.getElementById('cons-wrap');
  if (!wrap) return;

  // Vue unifiée : consultations saisies + RDV échus (règle métier)
  let q = db.from('v_consultations_unifiees').select('*',{count:'exact'})
    .order('date_consultation',{ascending:false})
    .range((_page-1)*PAGE_SIZE, _page*PAGE_SIZE-1);

  if (_dateFrom) q=q.gte('date_consultation',_dateFrom+'T00:00:00');
  if (_dateTo)   q=q.lte('date_consultation',_dateTo+'T23:59:59');
  if (_search)   q=q.or(`resident_nom.ilike.%${_search}%,resident_prenom.ilike.%${_search}%,motif.ilike.%${_search}%`);

  const { data, error, count } = await q;
  if (error) { toastError('Erreur'); return; }

  const rows = data||[];
  await resolveOrdonnances(rows);   // chemin -> URL signée (bucket privé)
  if (!rows.length) { wrap.innerHTML=`<div class="empty-state"><i class="bi bi-journal-x"></i><p>${t('consultations.noConsultShort')}</p></div>`; return; }

  wrap.innerHTML=`<div class="table-wrap"><table class="table">
    <thead><tr><th>${t('consultations.colResident')}</th><th>${t('consultations.colRoom')}</th><th>${t('consultations.colDate')}</th><th>${t('consultations.colDoctor')}</th><th>${t('consultations.colReason')}</th><th>${t('consultations.colOrdonnance')}</th><th style="text-align:right">${t('consultations.colActions')}</th></tr></thead>
    <tbody>
      ${rows.map(c=>`<tr data-id="${c.id}">
        <td style="font-weight:600">${fullName(c.resident_nom,c.resident_prenom)}
          ${c.source === 'rdv' ? `<span class="badge badge-planifie" style="font-size:.68rem;margin-left:.35rem" title="${t('consultations.fromRdvTitle')}">${t('consultations.fromRdv')}</span>` : ''}
        </td>
        <td><span class="badge badge-teal">${c.numero_chambre||'—'}</span></td>
        <td style="font-size:.85rem;white-space:nowrap">${formatDate(c.date_consultation,{time:true})}</td>
        <td style="font-size:.83rem">${c.medecin_titre||''} ${c.medecin_nom||'—'}</td>
        <td style="font-size:.85rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.motif||c.diagnostic||'—'}</td>
        <td>${c.ordonnance_url ? `<a href="${c.ordonnance_url}" target="_blank" class="btn btn-secondary btn-sm"><i class="bi bi-file-earmark-pdf-fill"></i></a>` : '—'}</td>
        <td><div class="table-actions">
          ${c.source === 'rdv' ? `<span style="font-size:.75rem;color:var(--text-light)" title="${t('consultations.fromRdvTitle')}"><i class="bi bi-calendar3"></i></span>` : `
          <button class="btn-icon" data-action="view"   title="${t('common.view')}"><i class="bi bi-eye-fill"></i></button>
          <button class="btn-icon" data-action="edit"   title="${t('common.modify')}"><i class="bi bi-pencil-fill"></i></button>
          ${isSuperAdmin() ? `<button class="btn-icon" data-action="delete" title="${t('common.delete')}" style="color:#dc2626"><i class="bi bi-trash3-fill"></i></button>` : ''}`}
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;

  // Pagination
  const pages=Math.ceil((count||0)/PAGE_SIZE);
  const pg=document.getElementById('cons-pages');
  if (pg) {
    if (pages<=1) { pg.innerHTML=''; }
    else {
      pg.innerHTML=`<div class="pagination">
        <button class="page-btn" ${_page===1?'disabled':''} data-p="${_page-1}"><i class="bi bi-chevron-left"></i></button>
        ${Array.from({length:pages},(_,i)=>i+1).map(i=>Math.abs(i-_page)<=2||i===1||i===pages?`<button class="page-btn ${i===_page?'active':''}" data-p="${i}">${i}</button>`:(Math.abs(i-_page)===3?`<span>…</span>`:'')).join('')}
        <button class="page-btn" ${_page===pages?'disabled':''} data-p="${_page+1}"><i class="bi bi-chevron-right"></i></button>
      </div>`;
      pg.onclick = e=>{const b=e.target.closest('[data-p]');if(b&&!b.disabled){_page=+b.dataset.p;_load();}};
    }
  }

  // onclick : _load est rappelée sur le même élément, addEventListener empilerait
  wrap.onclick = e=>{
    const btn=e.target.closest('button[data-action]');
    const row=btn?.closest('tr[data-id]');
    if (!btn||!row) return;
    if (btn.dataset.action==='view')   _viewConsultation(row.dataset.id);
    if (btn.dataset.action==='edit')   openFormConsultation(row.dataset.id, null);
    if (btn.dataset.action==='delete') _del(row.dataset.id);
  };
}

// ── Formulaire ────────────────────────────────────────────
export async function openFormConsultation(id, prefillResidentId) {
  let cons=null;
  if (id) {
    const {data}=await db.from('consultations').select('*').eq('id',id).single();
    cons=data;
  }
  const c=cons||{};
  await resolveOrdonnances(c);   // ordonnance_url -> URL signée, _ordonnance_path -> chemin

  const [{data:ress},{data:docs}]=await Promise.all([
    db.from('residents').select('id,nom,prenom,numero_chambre').eq('actif',true).order('nom').order('prenom').limit(200),
    db.from('doctors').select('id,titre,nom,prenom').eq('actif',true).order('nom'),
  ]);

  const resOpts=(ress||[]).map(r=>`<option value="${r.id}" ${(c.resident_id||prefillResidentId)===r.id?'selected':''}>${r.nom} ${r.prenom} - Ch.${r.numero_chambre||'—'}</option>`).join('');
  const docOpts=(docs||[]).map(d=>`<option value="${d.id}" ${c.medecin_id===d.id?'selected':''}>${d.titre||'Dr.'} ${d.prenom} ${d.nom}</option>`).join('');

  const body=`<form id="form-cons" enctype="multipart/form-data">
    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-person-fill"></i> ${t('consultations.secResidentDate')}</div>
      <div class="form-row">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">${t('consultations.resident')} <span class="required">*</span></label>
          <select class="form-control" name="resident_id" required><option value="">${t('consultations.selectResident')}</option>${resOpts}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('consultations.dateTime')} <span class="required">*</span></label>
          <input class="form-control" type="datetime-local" name="date_consultation" value="${c.date_consultation?new Date(c.date_consultation).toISOString().slice(0,16):nowLocalInput()}" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t('consultations.doctor')}</label>
          <select class="form-control" name="medecin_id"><option value="">—</option>${docOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('consultations.reason')}</label>
          <input class="form-control" name="motif" value="${escapeHtml(c.motif||'')}">
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-activity"></i> ${t('consultations.secVitals')}</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">${t('consultations.bpShort')}</label><input class="form-control" name="tension_arterielle" placeholder="120/80" value="${escapeHtml(c.tension_arterielle||'')}"></div>
        <div class="form-group"><label class="form-label">${t('consultations.tempShort')}</label><input class="form-control" type="number" step=".1" name="temperature" value="${c.temperature||''}"></div>
        <div class="form-group"><label class="form-label">${t('consultations.pulseShort')}</label><input class="form-control" type="number" name="pouls" value="${c.pouls||''}"></div>
        <div class="form-group"><label class="form-label">${t('consultations.spo2Short')}</label><input class="form-control" type="number" step=".1" name="saturation_o2" value="${c.saturation_o2||''}"></div>
        <div class="form-group"><label class="form-label">${t('consultations.weightShort')}</label><input class="form-control" id="f-poids" type="number" step=".1" name="poids" value="${c.poids||''}"></div>
        <div class="form-group"><label class="form-label">${t('consultations.heightShortC')}</label><input class="form-control" id="f-taille" type="number" step=".1" name="taille" value="${c.taille||''}"></div>
      </div>
      <div style="font-size:.84rem;color:var(--text-mid)">${t('consultations.bmiLabel')} <strong id="imc-val">${c.imc||'—'}</strong></div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-stethoscope"></i> ${t('consultations.secExamDiag')}</div>
      <div class="form-group"><label class="form-label">${t('consultations.observations')}</label><textarea class="form-control" name="observations" rows="3">${escapeHtml(c.observations||'')}</textarea></div>
      <div class="form-group"><label class="form-label">${t('consultations.diagnosis')}</label><textarea class="form-control" name="diagnostic" rows="2">${escapeHtml(c.diagnostic||'')}</textarea></div>
      <div class="form-group"><label class="form-label">${t('consultations.treatmentNote')}</label><textarea class="form-control" name="traitement_note" rows="2">${escapeHtml(c.traitement_note||'')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">${t('consultations.nextRdv')}</label><input class="form-control" type="date" name="prochain_rdv" value="${c.prochain_rdv||''}"></div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><i class="bi bi-file-earmark-medical-fill"></i> ${t('consultations.secOrdonnance')}</div>
      <div class="upload-zone" id="upload-zone">
        <input type="file" id="file-ord" accept=".pdf,image/*">
        <i class="bi bi-cloud-upload-fill"></i>
        <div style="font-weight:600;font-size:.9rem">${t('consultations.uploadDrag')}</div>
        <div style="font-size:.8rem;color:var(--text-light)">${t('consultations.uploadSizeNote')}</div>
      </div>
      <div id="upload-preview" data-path="${escapeHtml(c._ordonnance_path||'')}" style="${c.ordonnance_url?'':'display:none'}">
        ${c.ordonnance_url ? `<div class="upload-preview"><i class="bi bi-file-earmark-check-fill"></i><div><div style="font-weight:600;font-size:.88rem">${c.ordonnance_nom||t('consultations.colOrdonnance')}</div><a href="${c.ordonnance_url}" target="_blank" style="font-size:.78rem;color:var(--teal-light)">${t('consultations.seeCurrentFile')}</a></div></div>` : ''}
      </div>
      <div class="form-group" style="margin-top:.75rem">
        <label class="form-label">${t('common.notes')}</label>
        <textarea class="form-control" name="notes" rows="2">${escapeHtml(c.notes||'')}</textarea>
      </div>
    </div>
  </form>`;

  openModal(
    id ? `<i class="bi bi-pencil-fill"></i> ${t('consultations.formTitleEdit')}` : `<i class="bi bi-journal-plus"></i> ${t('consultations.formTitleNew')}`,
    body,
    [
      { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
      { label: id ? t('common.modify') : t('common.save'), cls:'btn btn-primary', action: () => _submitCons(id) }
    ], 'modal-xl'
  );

  // IMC live
  ['f-poids','f-taille'].forEach(fid => {
    document.getElementById(fid)?.addEventListener('input', () => {
      const p=+document.getElementById('f-poids')?.value;
      const t=+document.getElementById('f-taille')?.value;
      const el=document.getElementById('imc-val');
      if (el && p>0 && t>0) el.textContent=(p/Math.pow(t/100,2)).toFixed(1);
    });
  });

  // Auto-remplissage taille depuis le profil du résident
  const _fillTaille = async (resId) => {
    if (!resId) return;
    const tailleInput = document.getElementById('f-taille');
    if (!tailleInput || tailleInput.value) return;
    const { data } = await db.from('residents').select('taille').eq('id', resId).single();
    if (data?.taille) {
      tailleInput.value = data.taille;
      tailleInput.title = 'Auto-rempli depuis le profil du résident';
      tailleInput.dispatchEvent(new Event('input'));
    }
  };

  document.querySelector('select[name="resident_id"]')?.addEventListener('change', e => _fillTaille(e.target.value));
  if ((c.resident_id || prefillResidentId) && !c.taille) {
    _fillTaille(c.resident_id || prefillResidentId);
  }

  // Upload preview
  document.getElementById('file-ord')?.addEventListener('change', e => {
    const f=e.target.files[0];
    if (!f) return;
    if (f.size > 5*1024*1024) { toastError('Fichier trop lourd (max 5 Mo)'); return; }
    const prev=document.getElementById('upload-preview');
    prev.style.display='';
    prev.innerHTML=`<div class="upload-preview">
      <i class="bi bi-file-earmark-check-fill"></i>
      <div><div style="font-weight:600;font-size:.88rem">${f.name}</div>
      <div style="font-size:.78rem;color:var(--text-light)">${(f.size/1024).toFixed(0)} Ko</div>
    </div></div>`;
  });

  ['dragover','dragleave','drop'].forEach(ev => {
    document.getElementById('upload-zone')?.addEventListener(ev, e => {
      e.preventDefault();
      const z=document.getElementById('upload-zone');
      if (ev==='dragover') z?.classList.add('dragover');
      if (ev!=='drop') return z?.classList.remove('dragover');
      z?.classList.remove('dragover');
      const f=e.dataTransfer.files[0];
      if (f) { document.getElementById('file-ord').files=e.dataTransfer.files; document.getElementById('file-ord').dispatchEvent(new Event('change')); }
    });
  });
}

async function _submitCons(id) {
  const form=document.getElementById('form-cons');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  const fd=new FormData(form);
  const data=Object.fromEntries([...fd.entries()].filter(([,v])=>v!==''));

  const fileInput=document.getElementById('file-ord');
  const file=fileInput?.files[0];

  // Bucket privé : on stocke le CHEMIN (nom UUID), jamais d'URL.
  // L'ancien fichier est retiré du bucket en cas de remplacement.
  if (file) {
    try {
      data.ordonnance_url = await uploadOrdonnance(file);
      data.ordonnance_nom = file.name;
      const oldPath = document.getElementById('upload-preview')?.dataset.path;
      if (oldPath) removeOrdonnance(oldPath);
    } catch (upErr) { toastError('Erreur upload: '+upErr.message); return; }
  }

  const { error } = id
    ? await db.from('consultations').update(data).eq('id',id)
    : await db.from('consultations').insert(data);

  if (error) { toastError(error.message); return; }
  toastSuccess(id ? t('consultations.modified') : t('consultations.saved'));
  closeModal();
  _load();
}

async function _viewConsultation(id) {
  const { data: c } = await db.from('v_consultations_detail').select('*').eq('id',id).single();
  if (!c) return;
  await resolveOrdonnances(c);   // chemin -> URL signée (bucket privé)

  const body=`
    <div class="resident-profile-head">
      <div style="flex:1">
        <div style="font-size:1.1rem;font-weight:700">${fullName(c.resident_nom,c.resident_prenom)}</div>
        <div style="font-size:.83rem;opacity:.8">Ch. ${c.numero_chambre||'—'} &bull; ${formatDate(c.date_consultation,{time:true})}</div>
        <div style="font-size:.82rem;opacity:.7;margin-top:.2rem">${c.medecin_titre||''} ${c.medecin_nom||'—'}</div>
      </div>
      ${c.ordonnance_url ? `<a href="${c.ordonnance_url}" target="_blank" class="btn btn-secondary btn-sm" style="color:var(--white);border-color:rgba(255,255,255,.4)"><i class="bi bi-file-earmark-pdf-fill"></i> ${t('consultations.colOrdonnance')}</a>` : ''}
    </div>
    ${c.tension_arterielle||c.temperature||c.poids ? `
    <div class="vitals-grid" style="margin-bottom:1.25rem">
      ${c.tension_arterielle?`<div class="vital-box"><div class="vital-label">TA</div><div class="vital-value">${c.tension_arterielle}</div><div class="vital-unit">mmHg</div></div>`:''}
      ${c.temperature?`<div class="vital-box"><div class="vital-label">Temp.</div><div class="vital-value">${c.temperature}</div><div class="vital-unit">°C</div></div>`:''}
      ${c.pouls?`<div class="vital-box"><div class="vital-label">Pouls</div><div class="vital-value">${c.pouls}</div><div class="vital-unit">bpm</div></div>`:''}
      ${c.saturation_o2?`<div class="vital-box"><div class="vital-label">SpO₂</div><div class="vital-value">${c.saturation_o2}</div><div class="vital-unit">%</div></div>`:''}
      ${c.poids?`<div class="vital-box"><div class="vital-label">Poids</div><div class="vital-value">${c.poids}</div><div class="vital-unit">kg</div></div>`:''}
      ${c.imc?`<div class="vital-box"><div class="vital-label">IMC</div><div class="vital-value">${c.imc}</div><div class="vital-unit"></div></div>`:''}
    </div>` : ''}
    <table style="width:100%">
      ${_r(t('consultations.reason'), c.motif)} ${_r(t('consultations.observations'), escapeHtml(c.observations))}
      ${_r(t('consultations.diagnosis'), escapeHtml(c.diagnostic))} ${_r(t('consultations.treatmentNote'), escapeHtml(c.traitement_note))}
      ${_r(t('consultations.nextRdv'), c.prochain_rdv?formatDate(c.prochain_rdv):'')} ${_r(t('common.notes'), escapeHtml(c.notes))}
    </table>`;

  openModal(`<i class="bi bi-journal-medical"></i> ${t('consultations.viewTitle')}`, body, [
    { label: t('common.modify'), cls:'btn btn-secondary', action:()=>{ closeModal(); openFormConsultation(id,null); } },
    { label: t('common.close'),  cls:'btn btn-primary',   action: closeModal }
  ], 'modal-xl');
}

function _r(l,v) {
  if(!v) return '';
  return `<tr><td style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:var(--text-light);padding:.5rem 0;width:30%;vertical-align:top">${l}</td><td style="padding:.5rem 0;font-size:.9rem">${v}</td></tr>`;
}

async function _del(id) {
  openModal(`<i class="bi bi-exclamation-triangle-fill" style="color:#dc2626"></i> ${t('common.delete')}`,
    `<p>${t('consultations.deleteFullMsg')}</p>`,
    [
      { label: t('common.cancel'),  cls:'btn btn-secondary', action: closeModal },
      { label: t('common.delete'),  cls:'btn btn-danger',    action: async () => {
        const {error}=await db.from('consultations').delete().eq('id',id);
        if(error){toastError(error.message);return;}
        toastSuccess(t('consultations.deleted')); closeModal(); _load();
      }}
    ], 'modal-sm'
  );
}
