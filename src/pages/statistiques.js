import { db }          from '../supabase.js';
import { formatCurrency, locale } from '../utils.js';
import { toastError }    from '../toast.js';
import { t } from '../i18n.js';

let _charts = {};

export async function renderStatistiques(container) {
  Object.values(_charts).forEach(c => c?.destroy());
  _charts = {};

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('statistics.title')}</h2>
        <span class="sub">${t('statistics.subtitle')}</span>
      </div>
    </div>

    <div id="glob-stats" class="stats-grid" style="margin-bottom:1.75rem"></div>

    <div class="stats-charts-grid" style="display:grid;grid-template-columns:2fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="bi bi-bar-chart-fill"></i> ${t('statistics.consultations30')}</div></div>
        <div class="card-body"><div class="chart-container"><canvas id="chart-cons"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="bi bi-pie-chart-fill"></i> ${t('statistics.byPriority')}</div></div>
        <div class="card-body"><div class="chart-container"><canvas id="chart-prio"></canvas></div></div>
      </div>
    </div>

    <div class="stats-charts-grid2" style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="bi bi-capsule-pill"></i> Médicaments - état des traitements</div></div>
        <div class="card-body"><div class="chart-container"><canvas id="chart-meds"></canvas></div></div>
      </div>
      <div class="card" style="overflow:hidden">
        <div class="card-header"><div class="card-title"><i class="bi bi-clock-history"></i> Résidents sans visite récente</div></div>
        <div class="card-body" style="padding:0" id="tab-overdue"></div>
      </div>
    </div>

    <div class="stats-charts-grid3" style="display:grid;grid-template-columns:1fr 2fr;gap:1.25rem">
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="bi bi-gender-ambiguous"></i> ${t('statistics.byGender')}</div></div>
        <div class="card-body"><div class="chart-container"><canvas id="chart-gender"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="bi bi-bar-chart-steps"></i> ${t('statistics.byAge')}</div></div>
        <div class="card-body"><div class="chart-container"><canvas id="chart-age"></canvas></div></div>
      </div>
    </div>`;

  _loadAll();
}

async function _loadAll() {
  const [statsRes, joursRes, prioRes, medsRes, overdueRes, demoRes] = await Promise.all([
    db.rpc('fn_dashboard_stats'),
    db.rpc('fn_stats_30_jours'),
    db.from('residents').select('niveau_priorite').eq('actif',true).is('statut_depart',null),
    db.from('v_traitements_actifs').select('statut_alerte'),
    db.from('v_residents_priorite').select('nom,prenom,numero_chambre,jours_sans_consultation,derniere_consultation')
        .eq('actif',true).is('statut_depart',null)
        .or('jours_sans_consultation.gt.20,derniere_consultation.is.null')
        .order('jours_sans_consultation',{ascending:false,nullsFirst:true})
        .limit(10),
    db.from('residents').select('sexe,date_naissance').eq('actif',true).is('statut_depart',null),
  ]);

  if (statsRes.error) { toastError('Erreur stats'); return; }
  const s = statsRes.data || {};

  _renderGlobal(s);
  _chartConsult(joursRes.data||[]);
  _chartPrio(prioRes.data||[]);
  _chartMeds(medsRes.data||[]);
  _tableOverdue(overdueRes.data||[]);
  _chartGender(demoRes.data||[]);
  _chartAge(demoRes.data||[]);
}

function _renderGlobal(s) {
  const el = document.getElementById('glob-stats');
  if (!el) return;
  el.innerHTML = [
    { icon:'bi-people-fill',     label:'Résidents actifs',      val: s.total_residents??0 },
    { icon:'bi-journal-medical', label:'Consultations ce mois',  val: s.consultations_month??0 },
    { icon:'bi-person-x-fill',   label:'Pas vus 30j+',          val: s.pas_vu_30j??0,           color: (s.pas_vu_30j??0)>0?'#dc2626':null },
    { icon:'bi-capsule-pill',    label:'Médicaments urgents',   val: s.medicaments_urgents??0,  color:(s.medicaments_urgents??0)>0?'#dc2626':null },
  ].map(c=>`<div class="stat-card" style="border-left-color:${c.color||'var(--gold)'}">
    <div class="stat-card-label"><i class="bi ${c.icon}"></i> ${c.label}</div>
    <div class="stat-card-value" ${c.color?'style="color:'+c.color+'"':''}>${c.val}</div>
  </div>`).join('');
}

function _chartConsult(rows) {
  const canvas = document.getElementById('chart-cons');
  if (!canvas || !window.Chart) return;
  _charts.cons = new window.Chart(canvas, {
    type:'bar',
    data: {
      labels: rows.map(r=>{ const d=new Date(r.jour+'T12:00:00'); return d.getDate()+'/'+(d.getMonth()+1); }),
      datasets:[{ label:'Consultations', data:rows.map(r=>+r.total), backgroundColor:'rgba(18,72,72,.7)', borderColor:'#124848', borderWidth:1, borderRadius:4 }]
    },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{stepSize:1}},x:{ticks:{maxRotation:45},grid:{display:false}}} }
  });
}

function _chartPrio(rows) {
  const canvas = document.getElementById('chart-prio');
  if (!canvas || !window.Chart) return;
  const p1=(rows.filter(r=>r.niveau_priorite===1)).length;
  const p2=(rows.filter(r=>r.niveau_priorite===2)).length;
  const p3=(rows.filter(r=>r.niveau_priorite===3)).length;
  _charts.prio = new window.Chart(canvas, {
    type:'doughnut',
    data:{
      labels:['P1 Urgent','P2 Élevé','P3 Normal'],
      datasets:[{ data:[p1,p2,p3], backgroundColor:['#dc2626','#d97706','#16a34a'], borderWidth:2, borderColor:'#fff' }]
    },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{font:{size:11}}}} }
  });
}

function _chartMeds(rows) {
  const canvas = document.getElementById('chart-meds');
  if (!canvas || !window.Chart) return;
  const counts = { 'alerte_24h':0, 'alerte_3j':0, 'alerte_7j':0, 'ok':0, 'chronique':0, 'expire':0 };
  rows.forEach(r => { if(counts[r.statut_alerte]!==undefined) counts[r.statut_alerte]++; });
  _charts.meds = new window.Chart(canvas, {
    type:'bar',
    data:{
      labels:['24h','3 jours','7 jours','OK','Chronique','Expiré'],
      datasets:[{ data:Object.values(counts), backgroundColor:['#dc2626','#f97316','#fbbf24','#16a34a','#2563eb','#6b7280'], borderRadius:4 }]
    },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{stepSize:1}}} }
  });
}

function _chartGender(rows) {
  const canvas = document.getElementById('chart-gender');
  if (!canvas || !window.Chart) return;
  const m = rows.filter(r => r.sexe === 'Masculin').length;
  const f = rows.filter(r => r.sexe === 'Féminin').length;
  _charts.gender = new window.Chart(canvas, {
    type:'doughnut',
    data:{
      labels:[t('statistics.male'), t('statistics.female')],
      datasets:[{ data:[m,f], backgroundColor:['#2563eb','#ec4899'], borderWidth:2, borderColor:'#fff' }]
    },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ font:{ size:12 } } } } }
  });
}

function _chartAge(rows) {
  const canvas = document.getElementById('chart-age');
  if (!canvas || !window.Chart) return;
  const now  = new Date();
  const ages = rows
    .filter(r => r.date_naissance)
    .map(r => Math.floor((now - new Date(r.date_naissance)) / 31557600000));
  const maxAge = ages.length ? Math.max(...ages) : 0;

  // Tranches de 5 ans : 50–55, 56–60, … 86–90, puis 91+.
  // Générées dynamiquement : on s'arrête à la tranche contenant l'âge max.
  const brackets = [{ lo: 50, hi: 55 }];
  for (let lo = 56; lo <= 86; lo += 5) brackets.push({ lo, hi: lo + 4 });
  const visible = brackets.filter((b, i) => i === 0 || b.lo <= maxAge);

  const labels = [];
  const data   = [];
  const under50 = ages.filter(a => a < 50).length;
  if (under50) { labels.push(t('statistics.ageUnder50')); data.push(under50); }
  visible.forEach(b => {
    labels.push(`${b.lo}–${b.hi}`);
    data.push(ages.filter(a => a >= b.lo && a <= b.hi).length);
  });
  if (maxAge >= 91) {
    labels.push('91+');
    data.push(ages.filter(a => a >= 91).length);
  }

  const PALETTE = ['#a78bfa','#60a5fa','#34d399','#f59e0b','#f87171',
                   '#2a9090','#c8a44e','#ec4899','#6366f1','#14b8a6','#d97706'];
  _charts.age = new window.Chart(canvas, {
    type:'bar',
    data:{
      labels,
      datasets:[{
        label: t('statistics.byAge'),
        data,
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderRadius:6
      }]
    },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } }, x:{ grid:{ display:false } } }
    }
  });
}

function _tableOverdue(rows) {
  const el = document.getElementById('tab-overdue');
  if (!el) return;
  if (!rows.length) { el.innerHTML=`<div class="empty-state"><i class="bi bi-check2-circle"></i><p>Tous les résidents ont été vus récemment</p></div>`; return; }
  el.innerHTML=`<div class="table-wrap"><table class="table">
    <thead><tr><th>Résident</th><th>Chambre</th><th>Dernière visite</th><th>Jours</th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td style="font-weight:600">${r.prenom} ${r.nom}</td>
      <td><span class="badge badge-teal">${r.numero_chambre||'—'}</span></td>
      <td style="font-size:.83rem">${r.derniere_consultation?new Date(r.derniere_consultation).toLocaleDateString(locale()):'Jamais'}</td>
      <td><span class="badge ${(r.jours_sans_consultation||999)>30?'badge-expire':'badge-alerte-7j'}">${r.jours_sans_consultation||'—'}j</span></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}
