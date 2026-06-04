import { initRouter }                     from './src/router.js';
import { db }                            from './src/supabase.js';
import { initAuth, login, logout }       from './src/auth.js';
import { getLang, setLang, applyLang, t } from './src/i18n.js';

// ── PWA Service Worker ─────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW:', err));
  });
}

// ── Modal API (partagée avec toutes les pages) ─────────────
export function openModal(title, body, actions = [], size = '') {
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modal-box');
  document.getElementById('modal-title').innerHTML = title;
  document.getElementById('modal-body').innerHTML  = body;
  box.className = 'modal-box' + (size ? ' ' + size : '');

  const foot = document.getElementById('modal-foot');
  if (actions.length) {
    foot.classList.remove('hidden');
    foot.innerHTML = actions.map(a =>
      `<button class="btn-modal-action ${a.cls||''}">${a.label}</button>`
    ).join('');
    foot.querySelectorAll('.btn-modal-action').forEach((btn, i) =>
      btn.addEventListener('click', actions[i].action)
    );
  } else {
    foot.classList.add('hidden');
    foot.innerHTML = '';
  }

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  document.getElementById('modal-overlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  _syncTheme(theme === 'dark');
  applyLang();

  const user = await initAuth();
  if (!user) {
    _showLogin();
    return;
  }
  _startApp(user);
}

function _showLogin() {
  document.getElementById('splash')?.remove();
  document.getElementById('login-page')?.classList.remove('hidden');
}

function _showWelcome(user) {
  const screen = document.getElementById('welcome-screen');
  if (!screen) return;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('ui.goodMorning') : hour < 18 ? t('ui.goodAfternoon') : t('ui.goodEvening');

  document.getElementById('welcome-greeting').textContent = greeting + ',';
  document.getElementById('welcome-name').textContent = user.prenom + ' ' + user.nom;
  document.getElementById('welcome-role').textContent =
    user.role === 'super_admin' ? t('ui.superAdminFull') : t('ui.adminFull');

  screen.classList.remove('hidden');

  setTimeout(() => {
    screen.classList.add('fade-out');
    setTimeout(() => screen.classList.add('hidden'), 600);
  }, 3000);
}

async function _handleLogin() {
  const email = document.getElementById('login-email')?.value?.trim();
  const pass  = document.getElementById('login-password')?.value;
  const btn   = document.getElementById('login-btn');
  const err   = document.getElementById('login-err');

  if (!email || !pass) {
    _loginErr(t('ui.loginRequired')); return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="login-spin"></span> ${t('ui.loginLoading')}`;
  if (err) err.style.display = 'none';

  try {
    const user = await login(email, pass);
    document.getElementById('login-page')?.classList.add('hidden');
    _showWelcome(user);
    setTimeout(() => _startApp(user), 3800);
  } catch (e) {
    _loginErr(e.message);
    btn.disabled = false;
    btn.innerHTML = t('ui.loginBtn');
  }
}

function _loginErr(msg) {
  const err = document.getElementById('login-err');
  if (err) { err.textContent = msg; err.style.display = 'block'; }
}

function _startApp(user) {
  // Topbar user info
  const nameEl = document.getElementById('topbar-user-name');
  if (nameEl) nameEl.textContent = `${user.prenom} ${user.nom}`;

  const roleEl = document.getElementById('topbar-user-role');
  if (roleEl) {
    roleEl.textContent = user.role === 'super_admin' ? 'Super Admin' : 'Admin';
    roleEl.className   = 'topbar-role-badge ' + (user.role === 'super_admin' ? 'role-super' : 'role-admin');
  }

  // Date
  _updateDate();
  setInterval(_updateDate, 60_000);

  // Réseau
  _updateNet();
  window.addEventListener('online',  _updateNet);
  window.addEventListener('offline', _updateNet);

  // Sidebar — collapse/expand desktop
  document.getElementById('btn-sidebar-collapse')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('collapsed');
    _syncCollapseIcon();
  });

  // Logo coeur cliquable pour déplier quand collapsed
  document.querySelector('.logo-icon')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar?.classList.contains('collapsed')) {
      sidebar.classList.remove('collapsed');
      _syncCollapseIcon();
    }
  });

  // Sidebar — mobile
  document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.add('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.add('hidden');
    document.body.style.overflow = '';
  });

  // Thème
  document.getElementById('btn-theme')?.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    _syncTheme(dark);
  });

  // Langue
  document.getElementById('lang-switcher')?.addEventListener('click', e => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const lang = btn.dataset.lang;
    if (lang === getLang()) return;
    setLang(lang);
    applyLang();
    // Re-rendre la page courante pour appliquer la nouvelle langue
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = t('routes.' + hash);
    // Forcer le rechargement de la page aide si active
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  // Profil utilisateur (topbar)
  document.getElementById('btn-my-profile')?.addEventListener('click', () => {
    navigate('monprofil');
  });

  // Modal
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Badges
  _loadBadges();
  setInterval(_loadBadges, 60_000);

  // Routeur
  initRouter();

  // Splash → App
  setTimeout(() => {
    document.getElementById('splash')?.classList.add('fade-out');
    document.getElementById('app')?.classList.remove('hidden');
    setTimeout(() => document.getElementById('splash')?.remove(), 500);
  }, 1200);
}

async function _loadBadges() {
  try {
    const { count } = await db.from('alertes').select('id', { count: 'exact' })
      .eq('lue', false).eq('traitee', false);
    const ba = document.getElementById('badge-alertes');
    if (ba) {
      ba.textContent = count || 0;
      ba.style.display = (count || 0) > 0 ? 'flex' : 'none';
    }

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { count: tc } = await db.from('traitements').select('id', { count: 'exact' })
      .eq('actif', true).eq('traitement_chronique', false)
      .not('date_fin', 'is', null).lte('date_fin', tomorrow);
    const bt = document.getElementById('badge-traitements');
    if (bt) {
      bt.textContent = '!';
      bt.style.display = (tc || 0) > 0 ? 'flex' : 'none';
    }

    // Badge visites planifiées aujourd'hui
    const { count: vc } = await db.from('visites').select('id', { count: 'exact' })
      .eq('date_visite', new Date().toISOString().slice(0, 10))
      .in('statut', ['planifiee', 'en_cours']);
    const bv = document.getElementById('badge-visites');
    if (bv) { bv.textContent = vc || 0; bv.style.display = (vc || 0) > 0 ? 'flex' : 'none'; }

    // Badge anniversaires (aujourd'hui + demain)
    const { data: residents } = await db.from('residents')
      .select('date_naissance').eq('actif', true).not('date_naissance', 'is', null);
    const now = new Date();
    const bdayCount = (residents || []).filter(r => {
      const d = new Date(r.date_naissance);
      const diff = _bdayDiff(d, now);
      return diff === 0 || diff === 1;
    }).length;
    const bb = document.getElementById('badge-anniversaires');
    if (bb) {
      bb.textContent = bdayCount;
      bb.style.display = bdayCount > 0 ? 'flex' : 'none';
    }
  } catch (_) {}
}

function _bdayDiff(dob, now) {
  const yr = now.getFullYear();
  let bday = new Date(yr, dob.getMonth(), dob.getDate());
  if (bday < new Date(yr, now.getMonth(), now.getDate())) {
    bday = new Date(yr + 1, dob.getMonth(), dob.getDate());
  }
  const today = new Date(yr, now.getMonth(), now.getDate());
  return Math.round((bday - today) / 86400000);
}

function _updateDate() {
  const el = document.getElementById('topbar-date');
  const locale = getLang() === 'en' ? 'en-MU' : 'fr-MU';
  if (el) el.textContent = new Date().toLocaleDateString(locale, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

function _syncCollapseIcon() {
  const sidebar = document.getElementById('sidebar');
  const icon    = document.querySelector('#btn-sidebar-collapse i');
  if (!icon) return;
  const collapsed = sidebar?.classList.contains('collapsed');
  icon.className  = collapsed ? 'bi bi-layout-sidebar' : 'bi bi-layout-sidebar-reverse';
}

function _updateNet() {
  const el = document.getElementById('net-status');
  if (!el) return;
  if (navigator.onLine) {
    el.className = 'badge-net online';
    el.innerHTML = `<i class="bi bi-wifi"></i><span>${t('ui.online')}</span>`;
  } else {
    el.className = 'badge-net offline';
    el.innerHTML = `<i class="bi bi-wifi-off"></i><span>${t('ui.offline')}</span>`;
  }
}

function _syncTheme(dark) {
  const icon  = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (icon)  icon.className    = dark ? 'bi bi-sun-fill'  : 'bi bi-moon-fill';
  if (label) label.textContent = dark ? t('ui.lightMode') : t('ui.darkMode');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn')?.addEventListener('click', _handleLogin);
  document.getElementById('login-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') _handleLogin();
  });
  init();
});
