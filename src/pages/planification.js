import { db }         from '../supabase.js';
import { openModal, closeModal } from '../../script.js';
import { toastSuccess, toastError } from '../toast.js';
import { formatDate, fullName, escapeHtml } from '../utils.js';
import { t } from '../i18n.js';

export async function renderPlanification(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('planning.title')}</h2>
        <span class="sub">${t('planning.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-slot">
          <i class="bi bi-calendar-plus-fill"></i> ${t('planning.newSlot')}
        </button>
      </div>
    </div>

    <div class="plan-layout">
      <!-- Liste prioritaire pour planification -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="bi bi-list-ol"></i> ${t('planning.priorityList')}</div>
          <span style="font-size:.8rem;color:var(--text-light)">${t('planning.prioritySorted')}</span>
        </div>
        <div id="priority-list" style="max-height:500px;overflow-y:auto"></div>
      </div>

      <!-- Slots planifiés -->
      <div>
        <div class="card" style="margin-bottom:1.25rem">
          <div class="card-header">
            <div class="card-title"><i class="bi bi-calendar3"></i> ${t('planning.nextSlots')}</div>
            <button class="btn btn-secondary btn-sm" id="btn-refresh-slots">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
          <div id="slots-list" style="padding:.5rem"></div>
        </div>
      </div>
    </div>`;

  document.getElementById('btn-new-slot')?.addEventListener('click', () => _openFormSlot());
  document.getElementById('btn-refresh-slots')?.addEventListener('click', () => { _loadPriority(); _loadSlots(); });

  _loadPriority();
  _loadSlots();
}

async function _loadPriority() {
  const wrap = document.getElementById('priority-list');
  if (!wrap) return;

  const { data, error } = await db.rpc('fn_residents_a_planifier', { p_limit: 25 });
  if (error) { toastError('Erreur chargement liste priorité'); return; }
  const rows = data || [];

  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-check2-circle"></i><p>${t('planning.allPlanned')}</p></div>`;
    return;
  }

  wrap.innerHTML = rows.map((r, i) => `
    <div class="resident-row" data-rid="${r.resident_id}">
      <div style="font-size:.75rem;font-weight:700;color:var(--text-light);min-width:22px;text-align:center">${i+1}</div>
      <div class="score-dot ${r.score_priorite>=60?'score-high':r.score_priorite>=30?'score-medium':'score-low'}"></div>
      <div class="patient-avatar" style="width:32px;height:32px;font-size:.8rem">${(r.nom[0]||'')+(r.prenom[0]||'')}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:.88rem">${fullName(r.nom,r.prenom)}</div>
        <div style="font-size:.74rem;color:var(--text-light)">
          Ch. ${r.numero_chambre||'—'}
          ${r.jours_sans_consultation ? ` &bull; ${r.jours_sans_consultation}${t('planning.daysWithoutVisit')}` : ` &bull; ${t('planning.neverSeen')}`}
          ${r.traitements_urgents > 0 ? ` <span style="color:#dc2626">&bull; ${r.traitements_urgents} ${t('planning.urgMed')}</span>` : ''}
        </div>
      </div>
      <div style="font-size:.75rem;font-weight:700;color:${r.score_priorite>=60?'#dc2626':r.score_priorite>=30?'#d97706':'var(--text-light)'};min-width:40px;text-align:right">
        ${r.score_priorite}pts
      </div>
    </div>`).join('');

  // Drag-and-drop via clic vers un slot serait géré ici
}

async function _loadSlots() {
  const wrap = document.getElementById('slots-list');
  if (!wrap) return;

  const { data, error } = await db.from('v_planning_detail')
    .select('*')
    .gte('date_visite', new Date().toISOString().slice(0,10))
    .order('date_visite')
    .limit(10);

  if (error) { toastError('Erreur chargement slots'); return; }
  const rows = data || [];

  if (!rows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><p>${t('planning.noSlots')}</p></div>`;
    return;
  }

  wrap.innerHTML = rows.map(s => `
    <div class="card" style="margin-bottom:.75rem;border-left:3px solid ${s.statut==='termine'?'#16a34a':s.statut==='en_cours'?'#d97706':'var(--teal-dark)'}">
      <div class="card-body" style="padding:1rem">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-family:Georgia,serif;font-weight:700;font-size:1rem">${formatDate(s.date_visite,{full:true})}</div>
            <div style="font-size:.82rem;color:var(--text-light)">
              ${s.heure_debut} — ${s.heure_fin}
              &bull; ${s.medecin_titre||'Dr.'} ${s.medecin_prenom||''} ${s.medecin_nom||'—'}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.2rem;font-weight:700;color:var(--teal-dark)">${s.nb_residents_planifies}/${s.nb_max}</div>
            <div style="font-size:.72rem;color:var(--text-light)">résidents</div>
          </div>
        </div>
        <div style="margin-top:.75rem;display:flex;align-items:center;gap:.5rem">
          <div class="priority-bar" style="flex:1">
            <div class="priority-bar-fill" style="width:${Math.round(s.nb_residents_planifies/s.nb_max*100)}%;background:var(--teal-light)"></div>
          </div>
          <button class="btn btn-secondary btn-sm" data-action="open" data-id="${s.id}">
            <i class="bi bi-people-fill"></i> ${t('planning.manage')}
          </button>
        </div>
      </div>
    </div>`).join('');

  wrap.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'open') _openSlotDetail(btn.dataset.id);
  });
}

async function _openSlotDetail(slotId) {
  const [slotRes, prRes, priRes] = await Promise.all([
    db.from('planning_visites').select('*,doctors(*)').eq('id',slotId).single(),
    db.from('planning_residents').select('*,residents(nom,prenom,numero_chambre,niveau_priorite)').eq('planning_id',slotId).order('ordre'),
    db.rpc('fn_residents_a_planifier',{p_limit:30})
  ]);

  const slot = slotRes.data;
  const residents = prRes.data||[];
  const toAdd = priRes.data||[];

  const body = `
    <div class="slot-detail-layout">
      <div>
        <div class="form-section-title"><i class="bi bi-people-fill"></i> ${t('planning.planned')} (${residents.length}/${slot.nb_max})</div>
        <div id="slot-residents" style="max-height:320px;overflow-y:auto">
          ${residents.length ? residents.map(pr=>`
            <div class="resident-row" data-prid="${pr.id}" style="background:${pr.statut==='effectue'?'rgba(22,163,74,.06)':''};border-radius:var(--radius-sm)">
              <div class="patient-avatar" style="width:30px;height:30px;font-size:.75rem">${(pr.residents.nom[0]||'')+(pr.residents.prenom[0]||'')}</div>
              <div style="flex:1;font-size:.85rem">
                <strong>${fullName(pr.residents.nom,pr.residents.prenom)}</strong>
                <div style="font-size:.75rem;color:var(--text-light)">Ch. ${pr.residents.numero_chambre||'—'}</div>
              </div>
              <span class="badge ${pr.statut==='effectue'?'badge-paye':'badge-planifie'}">${pr.statut}</span>
              <button class="btn-icon" data-action="remove-pr" data-id="${pr.id}" title="Retirer" style="color:#dc2626"><i class="bi bi-x-lg"></i></button>
            </div>`).join('')
          : `<div class="empty-state" style="padding:1rem"><p>Aucun résident</p></div>`}
        </div>
      </div>
      <div>
        <div class="form-section-title"><i class="bi bi-list-ol"></i> Ajouter depuis la liste prioritaire</div>
        <div style="max-height:320px;overflow-y:auto">
          ${toAdd.map(r=>`
            <div class="resident-row">
              <div class="score-dot ${r.score_priorite>=60?'score-high':r.score_priorite>=30?'score-medium':'score-low'}"></div>
              <div style="flex:1;font-size:.85rem">
                <strong>${fullName(r.nom,r.prenom)}</strong>
                <div style="font-size:.75rem;color:var(--text-light)">Ch. ${r.numero_chambre||'—'} &bull; ${r.score_priorite}pts</div>
              </div>
              <button class="btn btn-secondary btn-sm" data-action="add-pr" data-rid="${r.resident_id}" data-slot="${slotId}">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  openModal(
    `<i class="bi bi-calendar3"></i> Slot — ${formatDate(slot.date_visite,{full:true})}`,
    body,
    [{ label:'Fermer', cls:'btn btn-primary', action: closeModal }],
    'modal-xl'
  );

  document.getElementById('modal-body').addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action==='remove-pr') {
      await db.from('planning_residents').delete().eq('id',btn.dataset.id);
      toastSuccess('Résident retiré');
      _openSlotDetail(slotId);
    }
    if (btn.dataset.action==='add-pr') {
      const cnt = document.querySelectorAll('#slot-residents .resident-row').length;
      if (cnt >= slot.nb_max) { toastError('Slot complet ('+slot.nb_max+' résidents max)'); return; }
      const { error } = await db.from('planning_residents').insert({
        planning_id: slotId,
        resident_id: btn.dataset.rid,
        ordre: cnt+1,
        statut: 'planifie'
      });
      if (error && error.code==='23505') { toastError(t('planning.alreadyInSlot')); return; }
      if (error) { toastError(error.message); return; }
      toastSuccess(t('planning.addedToSlot'));
      _openSlotDetail(slotId);
    }
  });
}

async function _openFormSlot() {
  const { data: docs } = await db.from('doctors').select('id,titre,nom,prenom').eq('actif',true).order('nom');

  const body = `<form id="form-slot">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date de visite <span class="required">*</span></label>
        <input class="form-control" type="date" name="date_visite" min="${new Date().toISOString().slice(0,10)}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Médecin</label>
        <select class="form-control" name="medecin_id">
          <option value="">—</option>
          ${(docs||[]).map(d=>`<option value="${d.id}">${d.titre||'Dr.'} ${d.prenom} ${d.nom}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Heure début</label>
        <input class="form-control" type="time" name="heure_debut" value="08:00">
      </div>
      <div class="form-group">
        <label class="form-label">Heure fin</label>
        <input class="form-control" type="time" name="heure_fin" value="12:00">
      </div>
      <div class="form-group">
        <label class="form-label">Nb max résidents</label>
        <input class="form-control" type="number" name="nb_max" value="12" min="1" max="64">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-control" name="notes" rows="2"></textarea>
    </div>
  </form>`;

  openModal('<i class="bi bi-calendar-plus-fill"></i> Nouveau slot de visite', body, [
    { label:'Annuler',    cls:'btn btn-secondary', action: closeModal },
    { label:'Créer le slot', cls:'btn btn-primary', action: async () => {
      const form = document.getElementById('form-slot');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const fd = new FormData(form);
      const data = Object.fromEntries([...fd.entries()].filter(([,v])=>v!==''));
      const { error } = await db.from('planning_visites').insert(data);
      if (error) { toastError(error.message); return; }
      toastSuccess('Slot créé');
      closeModal();
      _loadSlots();
    }}
  ]);
}
