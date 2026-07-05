import { db }         from '../supabase.js';
import { formatDate, formatTime, fullName } from '../utils.js';
import { navigate }  from '../router.js';
import { t }         from '../i18n.js';

export async function renderDashboard(container) {
  container.innerHTML = _sk();

  let statsRes, urgentsRes, rdvRes, alertesRes, medTraitRes, stockRes;
  try {
    [statsRes, urgentsRes, rdvRes, alertesRes, medTraitRes, stockRes] = await Promise.all([
      db.rpc('fn_dashboard_stats'),
      // Liste priorité : résidents présents uniquement (jamais les décédés/partis)
      db.from('v_residents_priorite').select('*').eq('actif', true)
          .or('statut_depart.is.null,statut_depart.neq.deces')
          .gte('score_priorite', 30).limit(8),
      db.from('v_rdv_detail').select('*')
          .gte('date_rdv', new Date().toISOString().slice(0,10)+'T00:00:00')
          .lte('date_rdv', new Date().toISOString().slice(0,10)+'T23:59:59')
          .in('statut',['planifie','confirme']).order('date_rdv').limit(10),
      db.from('alertes').select('*,residents(nom,prenom,numero_chambre)')
          .eq('lue',false).eq('traitee',false).order('created_at',{ascending:false}).limit(6),
      db.from('v_traitements_actifs').select('*')
          .in('statut_alerte',['alerte_24h','expire','expire_aujourd_hui']).limit(6),
      db.from('v_traitements_actifs').select('*')
          .eq('actif', true).in('statut_stock',['rouge','orange'])
          .order('autonomie_jours', { ascending: true, nullsFirst: false }).limit(8),
    ]);
  } catch (err) {
    container.innerHTML = `
      <div class="card" style="padding:3rem;text-align:center;max-width:520px;margin:4rem auto">
        <i class="bi bi-exclamation-triangle-fill" style="font-size:3rem;color:#dc2626;display:block;margin-bottom:1rem"></i>
        <h3 style="font-family:Georgia,serif;margin-bottom:.5rem">${t('dashboard.loadError')}</h3>
        <p style="color:var(--text-light);margin-bottom:1.5rem">${err.message || t('dashboard.loadErrorMsg')}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          <i class="bi bi-arrow-clockwise"></i> ${t('common.retry')}
        </button>
      </div>`;
    return;
  }

  [statsRes, urgentsRes, rdvRes, alertesRes, medTraitRes, stockRes].forEach(r => {
    if (r.error) console.warn('Dashboard query error:', r.error);
  });

  const stats   = statsRes.data   || {};
  const urgents = urgentsRes.data || [];
  const rdvs    = rdvRes.data     || [];
  const alertes = alertesRes.data || [];
  const meds    = medTraitRes.data || [];
  const aRacheter = stockRes.data || [];

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('dashboard.title')}</h2>
        <span class="sub">${t('dashboard.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="window.navigate('rendez-vous')">
          <i class="bi bi-calendar-plus-fill"></i> ${t('dashboard.newRdv')}
        </button>
        <button class="btn btn-secondary" onclick="window.navigate('consultations')">
          <i class="bi bi-journal-plus"></i> ${t('dashboard.newConsult')}
        </button>
      </div>
    </div>

    <div class="stats-grid">
      ${_stat('bi-people-fill',        t('dashboard.activeResidents'),  stats.total_residents     ?? 0, null)}
      ${_stat('bi-bell-fill',          t('dashboard.unreadAlerts'),     stats.alertes_non_lues    ?? 0, stats.alertes_non_lues > 0 ? '#dc2626' : null)}
      ${_stat('bi-capsule-pill',       t('dashboard.urgentMeds'),       stats.medicaments_urgents ?? 0, stats.medicaments_urgents > 0 ? '#dc2626' : null)}
      ${_stat('bi-clock-history',      t('dashboard.notSeen30'),        stats.pas_vu_30j          ?? 0, stats.pas_vu_30j > 0 ? '#d97706' : null)}
      ${_stat('bi-calendar3',          t('dashboard.rdvToday'),         stats.rdv_today           ?? 0, null)}
      ${_stat('bi-journal-medical',    t('dashboard.consultToday'),     stats.consultations_today ?? 0, null)}
      ${_stat('bi-person-exclamation', t('dashboard.urgentP1'),         stats.residents_urgents   ?? 0, stats.residents_urgents > 0 ? '#dc2626' : null)}
      ${_stat('bi-person-badge-fill',  t('dashboard.activeDoctors'),    stats.total_doctors       ?? 0, null)}
    </div>

    ${aRacheter.length ? `
    <div class="card" style="border-top:3px solid #d97706;margin-bottom:1.5rem">
      <div class="card-header">
        <div class="card-title" style="color:#d97706">
          <i class="bi bi-cart-plus-fill"></i> ${t('dashboard.toBuy')}
          <span style="background:#d97706;color:#fff;border-radius:9px;font-size:.72rem;font-weight:700;padding:.05rem .45rem;margin-left:.35rem">${aRacheter.length}</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.navigate('traitements')">${t('common.seeAll')}</button>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrap"><table class="table">
          <thead><tr><th>${t('dashboard.resident')}</th><th>${t('common.room')}</th><th>${t('dashboard.medication')}</th><th>${t('dashboard.stockLeft')}</th><th>${t('dashboard.autonomy')}</th><th>${t('dashboard.status')}</th></tr></thead>
          <tbody>
            ${aRacheter.map(m=>`<tr>
              <td style="font-weight:600">${fullName(m.resident_nom,m.resident_prenom)}</td>
              <td><span class="badge badge-teal">${m.numero_chambre||'—'}</span></td>
              <td>${m.nom_medicament}${m.dosage?' - '+m.dosage:''}</td>
              <td>${m.stock_restant !== null ? Math.round(m.stock_restant)+' '+(m.unite||'') : '—'}</td>
              <td>${m.autonomie_jours !== null ? m.autonomie_jours+' '+t('common.days') : (m.date_epuisement ? formatDate(m.date_epuisement) : '—')}</td>
              <td>${m.statut_stock === 'rouge'
                ? `<span class="badge badge-expire"><i class="bi bi-exclamation-triangle-fill"></i> ${t('dashboard.stockCritical')}</span>`
                : `<span class="badge badge-alerte-3j"><i class="bi bi-cart-plus"></i> ${t('dashboard.stockToBuy')}</span>`}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>` : ''}

    ${meds.length ? `
    <div class="card" style="border-top:3px solid #dc2626;margin-bottom:1.5rem">
      <div class="card-header">
        <div class="card-title" style="color:#dc2626"><i class="bi bi-exclamation-triangle-fill"></i> ${t('dashboard.renewNow')}</div>
        <button class="btn btn-secondary btn-sm" onclick="window.navigate('traitements')">${t('common.seeAll')}</button>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrap"><table class="table">
          <thead><tr><th>${t('dashboard.resident')}</th><th>${t('common.room')}</th><th>${t('dashboard.medication')}</th><th>${t('dashboard.endDate')}</th><th>${t('dashboard.status')}</th></tr></thead>
          <tbody>
            ${meds.map(m=>`<tr>
              <td style="font-weight:600">${fullName(m.resident_nom,m.resident_prenom)}</td>
              <td><span class="badge badge-teal">${m.numero_chambre||'—'}</span></td>
              <td>${m.nom_medicament}${m.dosage?' - '+m.dosage:''}</td>
              <td>${formatDate(m.date_fin)}</td>
              <td>${_alerteBadge(m.statut_alerte)}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>` : ''}

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="bi bi-list-ol"></i> ${t('dashboard.priorityList')}</div>
          <button class="btn btn-secondary btn-sm" onclick="window.navigate('planification')">${t('common.plan')}</button>
        </div>
        <div class="card-body" style="padding:0">
          ${urgents.length ? urgents.map(r=>`
            <div class="resident-row" onclick="window.navigate('residents')">
              <div class="score-dot ${r.score_priorite>=60?'score-high':r.score_priorite>=30?'score-medium':'score-low'}"></div>
              <div class="patient-avatar">${((r.nom||'')[0]||'').toUpperCase()+((r.prenom||'')[0]||'').toUpperCase()}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:.9rem">${fullName(r.nom,r.prenom)}</div>
                <div style="font-size:.77rem;color:var(--text-light)">
                  ${t('common.room')} ${r.numero_chambre||'—'}
                  ${r.jours_sans_consultation ? ` &bull; ${r.jours_sans_consultation}${t('residents.daysAgo')} sans visite` : ` &bull; ${t('dashboard.neverSeen')}`}
                  ${r.traitements_urgents > 0 ? ` &bull; <span style="color:#dc2626">${r.traitements_urgents} ${t('dashboard.urgMed')}</span>` : ''}
                </div>
              </div>
              <div style="text-align:right">
                ${_prioriteBadge(r.niveau_priorite)}
                <div style="font-size:.72rem;color:var(--text-light);margin-top:.2rem">${t('dashboard.score')}: ${r.score_priorite}</div>
              </div>
            </div>`).join('')
          : `<div class="empty-state"><i class="bi bi-check2-circle"></i><p>${t('dashboard.allUpToDate')}</p></div>`}
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:1.25rem">
          <div class="card-header">
            <div class="card-title"><i class="bi bi-calendar3"></i> ${t('dashboard.todayRdv')}</div>
            <button class="btn btn-secondary btn-sm" onclick="window.navigate('rendez-vous')">${t('common.view')}</button>
          </div>
          <div class="card-body" style="padding:.5rem">
            ${rdvs.length ? rdvs.map(r=>`
              <div class="rdv-item">
                <div class="rdv-time">${formatTime(r.date_rdv)}</div>
                <div class="rdv-info">
                  <div class="rdv-patient">${fullName(r.resident_nom,r.resident_prenom)}</div>
                  <div class="rdv-motif">${r.motif||'Consultation'}</div>
                </div>
                ${r.est_urgence ? `<span class="badge badge-alerte-24h">${t('common.emergency')}</span>` : ''}
              </div>`).join('')
            : `<div class="empty-state" style="padding:1.5rem"><i class="bi bi-calendar-x"></i><p>${t('dashboard.noRdv')}</p></div>`}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="bi bi-bell-fill"></i> ${t('dashboard.recentAlerts')}</div>
            <button class="btn btn-secondary btn-sm" onclick="window.navigate('alertes')">${t('common.seeAll')}</button>
          </div>
          <div class="card-body" style="padding:.5rem">
            ${alertes.length ? alertes.map(a=>`
              <div class="alert-card alert-p${a.priorite} ${a.lue?'lue':''}">
                <i class="bi ${_alerteIcon(a.type)} alert-icon"></i>
                <div class="alert-content">
                  <div class="alert-title">${a.titre}</div>
                  ${a.residents ? `<div class="alert-msg">${a.residents.prenom} ${a.residents.nom} - ${t('common.room')} ${a.residents.numero_chambre||'—'}</div>` : ''}
                  <div class="alert-time">${formatDate(a.created_at,{time:true})}</div>
                </div>
              </div>`).join('')
            : `<div class="empty-state" style="padding:1.5rem"><i class="bi bi-bell-slash"></i><p>${t('dashboard.noAlerts')}</p></div>`}
          </div>
        </div>
      </div>
    </div>`;

}

function _stat(icon, label, val, color) {
  const accent = color || 'var(--gold)';
  return `<div class="stat-card" style="border-left-color:${accent}">
    <div class="stat-card-label"><i class="bi ${icon}"></i> ${label}</div>
    <div class="stat-card-value" ${color?'style="color:'+color+'"':''}>${val}</div>
  </div>`;
}

function _prioriteBadge(n) {
  const map = {
    1:`<span class="badge badge-priorite-1">${t('priority.p1')}</span>`,
    2:`<span class="badge badge-priorite-2">${t('priority.p2')}</span>`,
    3:`<span class="badge badge-priorite-3">${t('priority.p3')}</span>`
  };
  return map[n] || map[3];
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
  return map[s] || s;
}

function _alerteIcon(type) {
  const map = {
    'medicament_24h':'bi-capsule-pill',
    'medicament_epuise':'bi-capsule-pill',
    'visite_requise':'bi-calendar-check',
    'rdv_manque':'bi-calendar-x',
    'pas_vu_30j':'bi-person-x-fill',
    'urgence':'bi-exclamation-octagon-fill',
    'autre':'bi-info-circle-fill',
  };
  return map[type] || 'bi-bell-fill';
}

function _sk() {
  return `<div class="stats-grid">${Array(8).fill(0).map(()=>
    `<div class="card" style="padding:1.5rem"><div class="skeleton skeleton-title"></div><div class="skeleton" style="height:50px"></div></div>`
  ).join('')}</div>`;
}
