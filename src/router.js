import { renderDashboard }     from './pages/dashboard.js';
import { renderResidents }     from './pages/residents.js';
import { renderMedecins }      from './pages/medecins.js';
import { renderTraitements }   from './pages/traitements.js';
import { renderConsultations } from './pages/consultations.js';
import { renderRendezVous }    from './pages/rendez-vous.js';
import { renderPlanification } from './pages/planification.js';
import { renderAlertes }       from './pages/alertes.js';
import { renderStatistiques }  from './pages/statistiques.js';
import { renderParametres }    from './pages/parametres.js';
import { renderAide }          from './pages/aide.js';
import { renderAnniversaires } from './pages/anniversaires.js';
import { renderVisites }       from './pages/visites.js';
import { renderDeparts }       from './pages/departs.js';
import { renderCourses }       from './pages/courses.js';
import { renderMonProfil }     from './pages/monprofil.js';
import { setState }            from './store.js';
import { t }                   from './i18n.js';

const ROUTES = {
  'dashboard':     { render: renderDashboard,     titleKey: 'routes.dashboard' },
  'residents':     { render: renderResidents,     titleKey: 'routes.residents' },
  'medecins':      { render: renderMedecins,      titleKey: 'routes.medecins' },
  'traitements':   { render: renderTraitements,   titleKey: 'routes.traitements' },
  'consultations': { render: renderConsultations, titleKey: 'routes.consultations' },
  'rendez-vous':   { render: renderRendezVous,    titleKey: 'routes.rendez-vous' },
  'planification': { render: renderPlanification, titleKey: 'routes.planification' },
  'alertes':       { render: renderAlertes,       titleKey: 'routes.alertes' },
  'statistiques':  { render: renderStatistiques,  titleKey: 'routes.statistiques' },
  'parametres':    { render: renderParametres,    titleKey: 'routes.parametres' },
  'aide':          { render: renderAide,          titleKey: 'routes.aide' },
  'anniversaires': { render: renderAnniversaires, titleKey: 'routes.anniversaires' },
  'visites':       { render: renderVisites,       titleKey: 'routes.visites' },
  'departs':       { render: renderDeparts,       titleKey: 'routes.departs' },
  'courses':       { render: renderCourses,       titleKey: 'routes.courses' },
  'monprofil':     { render: renderMonProfil,     titleKey: 'routes.monprofil' },
};

export function navigate(page) { window.location.hash = '#' + page; }
window.navigate = navigate;

export function initRouter() {
  window.addEventListener('hashchange', _route);
  _route();
}

function _route() {
  const hash  = window.location.hash.replace('#','') || 'dashboard';
  const route = ROUTES[hash] || ROUTES['dashboard'];
  const page  = ROUTES[hash] ? hash : 'dashboard';

  setState({ page });

  document.querySelectorAll('.nav-link').forEach(a =>
    a.classList.toggle('active', a.dataset.page === page)
  );

  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = t(route.titleKey);

  const sidebar = document.getElementById('sidebar');
  if (sidebar?.classList.contains('mobile-open')) {
    sidebar.classList.remove('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.add('hidden');
  }

  const content = document.getElementById('page-content');
  if (!content) return;
  content.innerHTML = '';
  route.render(content);
}
