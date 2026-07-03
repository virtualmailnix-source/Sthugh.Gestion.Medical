import { db }         from '../supabase.js';
import { openModal, closeModal } from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatDate, formatTime, fullName, escapeHtml, JOURS_FR, MOIS_FR } from '../utils.js';
import { t } from '../i18n.js';

let _selectedDate = new Date().toISOString().slice(0,10);

export async function renderRendezVous(container) {
  _selectedDate = new Date().toISOString().slice(0,10);
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('appointments.title')}</h2>
        <span class="sub">${t('appointments.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-danger btn-sm" id="btn-urgence">
          <i class="bi bi-exclamation-triangle-fill"></i> ${t('appointments.urgentRdv')}
        </button>
        <button class="btn btn-primary" id="btn-new-rdv">
          <i class="bi bi-calendar-plus-fill"></i> ${t('appointments.newRdv')}
        </button>
      </div>
    </div>
    <div class="rdv-layout">
      <div>
        <div class="card" style="margin-bottom:1.25rem">
          <div class="card-header"><div class="card-title"><i class="bi bi-calendar3"></i> ${t('appointments.calendarTitle')}</div></div>
          <div class="card-body" id="mini-cal"></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title"><i class="bi bi-clock-history"></i> ${t('appointments.upcomingTitle')}</div></div>
          <div class="card-body" id="upcoming-rdv" style="padding:.75rem"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title" id="rdv-day-title"><i class="bi bi-calendar-day"></i></div>
          <div style="display:flex;gap:.5rem">
            <button class="btn-icon" id="prev-day"><i class="bi bi-chevron-left"></i></button>
            <button class="btn btn-secondary btn-sm" id="today-btn">${t('appointments.today')}</button>
            <button class="btn-icon" id="next-day"><i class="bi bi-chevron-right"></i></button>
          </div>
        </div>
        <div class="card-body" id="day-rdv-list"></div>
      </div>
    </div>`;

  document.getElementById('btn-new-rdv').addEventListener('click', () => openFormRdv(null));
  document.getElementById('btn-urgence').addEventListener('click', () => openFormRdv(null, null, true));
  document.getElementById('prev-day').addEventListener('click', () => _changeDay(-1));
  document.getElementById('next-day').addEventListener('click', () => _changeDay(1));
  document.getElementById('today-btn').addEventListener('click', () => {
    _selectedDate = new Date().toISOString().slice(0,10); _refresh();
  });
  _refresh();
}

function _changeDay(d) {
  const dt=new Date(_selectedDate+'T12:00:00'); dt.setDate(dt.getDate()+d);
  _selectedDate=dt.toISOString().slice(0,10); _refresh();
}

async function _refresh() { _renderCal(); _loadDay(); _loadUpcoming(); }

function _renderCal() {
  const wrap=document.getElementById('mini-cal'); if(!wrap) return;
  const sel=new Date(_selectedDate+'T12:00:00');
  const year=sel.getFullYear(), mon=sel.getMonth();
  const today=new Date().toISOString().slice(0,10);
  const first=new Date(year,mon,1).getDay(), days=new Date(year,mon+1,0).getDate();

  let html=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem">
    <button class="btn-icon" id="cal-prev"><i class="bi bi-chevron-left"></i></button>
    <strong style="font-size:.9rem">${MOIS_FR[mon]} ${year}</strong>
    <button class="btn-icon" id="cal-next"><i class="bi bi-chevron-right"></i></button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:.78rem">
    ${JOURS_FR.map(d=>`<div style="font-weight:700;color:var(--text-light);padding:.25rem">${d}</div>`).join('')}`;

  for(let i=0;i<first;i++) html+=`<div></div>`;
  for(let d=1;d<=days;d++) {
    const ds=year+'-'+String(mon+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const isSel=ds===_selectedDate, isToday=ds===today;
    html+=`<button class="cal-day" data-date="${ds}" style="
      padding:.3rem .1rem;border-radius:50%;font-size:.82rem;cursor:pointer;
      background:${isSel?'var(--mission)':'transparent'};
      color:${isSel?'var(--gold-light)':isToday?'var(--teal-dark)':'var(--text-dark)'};
      font-weight:${isSel||isToday?'700':'400'};
      border:${isToday&&!isSel?'1.5px solid var(--teal-light)':'1.5px solid transparent'};
    ">${d}</button>`;
  }
  html+='</div>';
  wrap.innerHTML=html;

  wrap.querySelectorAll('.cal-day').forEach(btn=>
    btn.addEventListener('click', e=>{ _selectedDate=e.currentTarget.dataset.date; _refresh(); })
  );
  document.getElementById('cal-prev')?.addEventListener('click',()=>{
    const d=new Date(year,mon-1,1); _selectedDate=d.toISOString().slice(0,10); _renderCal();
  });
  document.getElementById('cal-next')?.addEventListener('click',()=>{
    const d=new Date(year,mon+1,1); _selectedDate=d.toISOString().slice(0,10); _renderCal();
  });
}

async function _loadDay() {
  const wrap=document.getElementById('day-rdv-list');
  const title=document.getElementById('rdv-day-title');
  if(!wrap) return;
  const d=new Date(_selectedDate+'T12:00:00');
  if(title) title.innerHTML=`<i class="bi bi-calendar-day"></i> ${formatDate(d,{full:true})}`;

  const {data,error}=await db.from('v_rdv_detail').select('*')
    .gte('date_rdv',_selectedDate+'T00:00:00')
    .lte('date_rdv',_selectedDate+'T23:59:59')
    .order('date_rdv');

  if(error){toastError('Erreur');return;}
  const rows=data||[];
  if(!rows.length){wrap.innerHTML=`<div class="empty-state"><i class="bi bi-calendar-x"></i><p>${t('appointments.noRdvDay')}</p></div>`;return;}

  wrap.innerHTML=rows.map(r=>`
    <div class="rdv-item ${r.est_urgence?'style="border-left:3px solid #dc2626"':''}">
      <div class="rdv-time">${formatTime(r.date_rdv)}</div>
      <div class="rdv-info">
        <div class="rdv-patient" style="display:flex;align-items:center;gap:.4rem">
          ${r.est_urgence?`<span class="badge badge-alerte-24h" style="font-size:.7rem">${t('appointments.urgentBadge')}</span>`:''}
          ${fullName(r.resident_nom,r.resident_prenom)}
          <span style="font-size:.77rem;color:var(--text-light)">Ch. ${r.numero_chambre||'—'}</span>
        </div>
        <div class="rdv-motif">${r.motif||'Consultation'} &bull; ${r.medecin_titre||''} ${r.medecin_nom||'—'}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.4rem">
        <span class="badge ${_statCls(r.statut)}">${_statLabel(r.statut)}</span>
        <div style="display:flex;gap:.3rem;flex-wrap:wrap;justify-content:flex-end">
          ${(r.statut === 'planifie' || r.statut === 'confirme') ? `
            <button class="btn btn-success btn-sm" data-action="confirm" data-id="${r.id}"
              title="${t('appointments.confirmPresence')}">
              <i class="bi bi-check2-circle"></i>
            </button>
            <button class="btn btn-secondary btn-sm" data-action="report" data-id="${r.id}"
              data-date="${r.date_rdv}" title="${t('appointments.reschedule')}">
              <i class="bi bi-calendar-event-fill"></i>
            </button>
            <button class="btn btn-secondary btn-sm" data-action="absent" data-id="${r.id}"
              style="color:#d97706;border-color:#d97706" title="${t('appointments.markAbsent')}">
              <i class="bi bi-person-x-fill"></i>
            </button>` : ''}
          <button class="btn-icon" data-action="edit"   data-id="${r.id}" title="${t('common.modify')}"><i class="bi bi-pencil-fill"></i></button>
          <button class="btn-icon" data-action="delete" data-id="${r.id}" style="color:#dc2626" title="${t('common.delete')}"><i class="bi bi-trash3-fill"></i></button>
        </div>
      </div>
    </div>`).join('');

  // onclick : _loadDay est rappelée sur le même élément, addEventListener empilerait
  wrap.onclick = e=>{
    const btn=e.target.closest('button[data-action]'); if(!btn) return;
    if(btn.dataset.action==='edit')    openFormRdv(btn.dataset.id);
    if(btn.dataset.action==='confirm') _confirmPresence(btn.dataset.id);
    if(btn.dataset.action==='report')  _reporterRdv(btn.dataset.id, btn.dataset.date);
    if(btn.dataset.action==='absent')  _markAbsent(btn.dataset.id);
    if(btn.dataset.action==='delete')  _del(btn.dataset.id);
  };
}

function _statCls(s) {
  return {planifie:'badge-planifie',confirme:'badge-confirme',effectue:'badge-effectue',annule:'badge-annule',absent:'badge-absent'}[s]||'badge-teal';
}

function _statLabel(s) {
  return {
    planifie: t('status.planifie'),
    confirme: t('status.confirme'),
    effectue: t('status.effectue'),
    annule:   t('status.annule'),
    absent:   t('status.absent'),
  }[s] || s;
}

async function _loadUpcoming() {
  const wrap=document.getElementById('upcoming-rdv'); if(!wrap) return;
  const {data}=await db.from('v_rdv_detail').select('*')
    .gt('date_rdv',new Date().toISOString())
    .in('statut',['planifie','confirme'])
    .order('date_rdv').limit(8);

  const rows=data||[];
  if(!rows.length){wrap.innerHTML=`<div class="empty-state"><i class="bi bi-calendar-check"></i><p>${t('appointments.noUpcoming')}</p></div>`;return;}
  wrap.innerHTML=rows.map(r=>`
    <div style="display:flex;align-items:center;gap:.75rem;padding:.5rem 0;border-bottom:1px solid var(--card-border)">
      <div style="min-width:44px;text-align:center">
        <div style="font-size:.68rem;font-weight:700;color:var(--text-light);text-transform:uppercase">${MOIS_FR[new Date(r.date_rdv).getMonth()].slice(0,3)}</div>
        <div style="font-family:Georgia,serif;font-size:1.2rem;font-weight:700;color:var(--teal-dark);line-height:1">${new Date(r.date_rdv).getDate()}</div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:.87rem">${fullName(r.resident_nom,r.resident_prenom)}</div>
        <div style="font-size:.75rem;color:var(--text-light)">${formatTime(r.date_rdv)} &bull; ${r.motif||'Consultation'}</div>
      </div>
      ${r.est_urgence?`<span class="badge badge-alerte-24h" style="font-size:.68rem">${t('appointments.urgentBadge')}</span>`:''}
    </div>`).join('');
}

export async function openFormRdv(id, prefillResidentId, isUrgence=false) {
  let rdv=null;
  if(id){const{data}=await db.from('rendez_vous').select('*').eq('id',id).single();rdv=data;}
  const r=rdv||{};

  const [{data:ress},{data:docs}]=await Promise.all([
    db.from('residents').select('id,nom,prenom,numero_chambre,niveau_priorite').eq('actif',true).order('nom').limit(200),
    db.from('doctors').select('id,titre,nom,prenom').eq('actif',true).order('nom'),
  ]);

  const resOpts=(ress||[]).map(p=>`<option value="${p.id}" ${(r.resident_id||prefillResidentId)===p.id?'selected':''}>${p.prenom} ${p.nom} — Ch.${p.numero_chambre||'—'}${p.niveau_priorite===1?' (P1)':''}</option>`).join('');
  const docOpts=(docs||[]).map(d=>`<option value="${d.id}" ${r.medecin_id===d.id?'selected':''}>${d.titre||'Dr.'} ${d.prenom} ${d.nom}</option>`).join('');
  const defDate=_selectedDate+'T'+(new Date().getHours()<16?'09':'08')+':00';
  const rdvDate=r.date_rdv?new Date(r.date_rdv).toISOString().slice(0,16):defDate;
  const urgence=isUrgence||r.est_urgence;

  const body=`<form id="form-rdv">
    ${urgence?`<div style="background:var(--tint-red-bg);border:1px solid var(--tint-red-border);border-radius:var(--radius);padding:.75rem 1rem;margin-bottom:1rem;color:var(--tint-red-fg);font-weight:600;font-size:.9rem"><i class="bi bi-exclamation-triangle-fill"></i> ${t('appointments.urgentBanner')}</div>`:''}
    <div class="form-group">
      <label class="form-label">Résident <span class="required">*</span></label>
      <select class="form-control" name="resident_id" required><option value="">—</option>${resOpts}</select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date & Heure <span class="required">*</span></label>
        <input class="form-control" type="datetime-local" name="date_rdv" value="${rdvDate}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Durée</label>
        <select class="form-control" name="duree_minutes">
          ${[15,20,30,45,60,90].map(d=>`<option value="${d}" ${(r.duree_minutes||30)===d?'selected':''}>${d} min</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Médecin</label>
        <select class="form-control" name="medecin_id"><option value="">—</option>${docOpts}</select>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Motif</label><input class="form-control" name="motif" value="${escapeHtml(r.motif||'')}"></div>
    ${id?`<div class="form-group"><label class="form-label">Statut</label>
      <select class="form-control" name="statut">
        ${[['planifie','Planifié'],['confirme','Confirmé'],['effectue','Effectué'],['annule','Annulé'],['absent','Absent']]
          .map(([v,l])=>`<option value="${v}" ${(r.statut||'planifie')===v?'selected':''}>${l}</option>`).join('')}
      </select></div>`:''}
    <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" name="notes" rows="2">${escapeHtml(r.notes||'')}</textarea></div>
    <input type="hidden" name="est_urgence" value="${urgence?'true':'false'}">
  </form>`;

  openModal(
    urgence ? `<i class="bi bi-exclamation-triangle-fill" style="color:#dc2626"></i> ${t('appointments.formTitleUrgent')}`
            : (id ? `<i class="bi bi-pencil-fill"></i> ${t('appointments.formTitleEdit')}` : `<i class="bi bi-calendar-plus-fill"></i> ${t('appointments.formTitleNew')}`),
    body,
    [
      { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
      { label: id ? t('common.modify') : t('common.save'), cls:`btn ${urgence?'btn-danger':'btn-primary'}`, action: ()=>_submit(id) }
    ]
  );
}

async function _submit(id) {
  const form=document.getElementById('form-rdv');
  if(!form.checkValidity()){form.reportValidity();return;}
  const fd=new FormData(form);
  const data=Object.fromEntries([...fd.entries()].filter(([,v])=>v!==''));
  data.est_urgence=data.est_urgence==='true';
  if(!id) data.statut='planifie';

  const{error}=id?await db.from('rendez_vous').update(data).eq('id',id):await db.from('rendez_vous').insert(data);
  if(error){toastError(error.message);return;}
  toastSuccess(id ? t('appointments.modified') : t('appointments.created'));
  closeModal(); _refresh();
}

// ── Actions rapides sur un RDV ────────────────────────────

async function _confirmPresence(id) {
  openModal(
    `<i class="bi bi-check2-circle" style="color:#16a34a"></i> ${t('appointments.confirmTitle')}`,
    `<p>${t('appointments.confirmPresence')} ?</p>`,
    [
      { label: t('common.cancel'),                 cls:'btn btn-secondary', action: closeModal },
      { label: `<i class="bi bi-check2-circle"></i> ${t('appointments.confirmPresence')}`,
        cls:'btn btn-success',
        action: async () => {
          const { error } = await db.from('rendez_vous').update({ statut:'effectue' }).eq('id', id);
          if (error) { toastError(error.message); return; }
          toastSuccess(t('appointments.confirmed'));
          closeModal(); _refresh();
        }
      }
    ], 'modal-sm'
  );
}

async function _markAbsent(id) {
  openModal(
    `<i class="bi bi-person-x-fill" style="color:#d97706"></i> ${t('appointments.markAbsent')}`,
    `<p>${t('appointments.markAbsent')} ?</p>`,
    [
      { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
      { label: `<i class="bi bi-person-x-fill"></i> ${t('appointments.markAbsent')}`,
        cls:'btn btn-secondary', style:'color:#d97706',
        action: async () => {
          const { error } = await db.from('rendez_vous').update({ statut:'absent' }).eq('id', id);
          if (error) { toastError(error.message); return; }
          toastSuccess(t('appointments.markedAbsent'));
          closeModal(); _refresh();
        }
      }
    ], 'modal-sm'
  );
}

async function _reporterRdv(id, currentDate) {
  const currentVal = currentDate ? new Date(currentDate).toISOString().slice(0,16) : '';

  openModal(
    `<i class="bi bi-calendar-event-fill" style="color:var(--teal-dark)"></i> ${t('appointments.rescheduleTitle')}`,
    `<div class="form-group" style="margin-bottom:.5rem">
      <label class="form-label">${t('appointments.newDate')} <span class="required">*</span></label>
      <input class="form-control" type="datetime-local" id="new-rdv-date" value="${currentVal}" required>
    </div>
    <div class="form-group">
      <label class="form-label">${t('common.notes')}</label>
      <input class="form-control" id="new-rdv-note" placeholder="${t('appointments.reschedule')}…">
    </div>`,
    [
      { label: t('common.cancel'), cls:'btn btn-secondary', action: closeModal },
      { label: `<i class="bi bi-calendar-check-fill"></i> ${t('appointments.reschedule')}`,
        cls:'btn btn-primary',
        action: async () => {
          const newDate = document.getElementById('new-rdv-date')?.value;
          const note    = document.getElementById('new-rdv-note')?.value;
          if (!newDate) { toastError(t('common.error')); return; }

          // Récupérer les notes existantes
          const { data: rdv } = await db.from('rendez_vous').select('notes').eq('id', id).single();
          const prevNotes = rdv?.notes || '';
          const updatedNotes = note
            ? (prevNotes ? prevNotes + '\n' + note : note)
            : prevNotes;

          const { error } = await db.from('rendez_vous').update({
            date_rdv: new Date(newDate).toISOString(),
            statut:   'planifie',
            notes:    updatedNotes || null,
          }).eq('id', id);

          if (error) { toastError(error.message); return; }
          toastSuccess(t('appointments.rescheduled'));
          closeModal(); _refresh();
        }
      }
    ], 'modal-sm'
  );
}

async function _changeStatus(id) {
  const{data}=await db.from('rendez_vous').select('statut').eq('id',id).single();
  const curr=data?.statut||'planifie';
  const next={planifie:'confirme',confirme:'effectue',effectue:'planifie'};

  openModal(`<i class="bi bi-arrow-repeat"></i> ${t('appointments.changeStatus')}`,
    `<div class="form-group"><label class="form-label">Statut</label>
    <select class="form-control" id="new-stat">
      ${[['planifie','Planifié'],['confirme','Confirmé'],['effectue','Effectué'],['annule','Annulé'],['absent','Absent']]
        .map(([v,l])=>`<option value="${v}" ${(next[curr]||curr)===v?'selected':''}>${l}</option>`).join('')}
    </select></div>`,
    [
      {label: t('common.cancel'),              cls:'btn btn-secondary',action:closeModal},
      {label: t('appointments.applyStatus'),  cls:'btn btn-primary',  action:async()=>{
        const s=document.getElementById('new-stat')?.value;
        const{error}=await db.from('rendez_vous').update({statut:s}).eq('id',id);
        if(error){toastError(error.message);return;}
        toastSuccess(t('appointments.statusUpdated')); closeModal(); _refresh();
      }}
    ], 'modal-sm'
  );
}

async function _del(id) {
  openModal(`<i class="bi bi-exclamation-triangle-fill" style="color:#dc2626"></i> ${t('common.delete')}`,
    `<p>${t('appointments.deleteConfirm')}</p>`,
    [
      {label: t('common.cancel'),  cls:'btn btn-secondary', action:closeModal},
      {label: t('common.delete'),  cls:'btn btn-danger',    action:async()=>{
        const{error}=await db.from('rendez_vous').delete().eq('id',id);
        if(error){toastError(error.message);return;}
        toastSuccess(t('appointments.deleted')); closeModal(); _refresh();
      }}
    ], 'modal-sm'
  );
}
