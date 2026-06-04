import { db }                       from '../supabase.js';
import { toastSuccess, toastError } from '../toast.js';
import { initials, fullName }       from '../utils.js';
import { t, getLang }               from '../i18n.js';

export async function renderAnniversaires(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('anniversaires.title')}</h2>
        <span class="sub">${t('anniversaires.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-gen-bday">
          <i class="bi bi-balloon-heart-fill"></i> ${t('anniversaires.generateAlerts')}
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-chips">
        <button class="chip active" data-f="all">${t('anniversaires.filterAll')}</button>
        <button class="chip" data-f="today">${t('anniversaires.filterToday')}</button>
        <button class="chip" data-f="week">${t('anniversaires.filterWeek')}</button>
      </div>
    </div>

    <div id="bday-content"></div>`;

  document.getElementById('btn-gen-bday')?.addEventListener('click', _generateAlerts);

  let _filter = 'all';
  document.querySelectorAll('.chip[data-f]').forEach(c =>
    c.addEventListener('click', e => {
      document.querySelectorAll('.chip[data-f]').forEach(x => x.classList.remove('active'));
      e.target.classList.add('active');
      _filter = e.target.dataset.f;
      _render(_filter, _allData);
    })
  );

  await _load();
}

let _allData = [];

async function _load() {
  const wrap = document.getElementById('bday-content');
  if (!wrap) return;
  wrap.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-light)"><i class="bi bi-hourglass-split"></i> ${t('common.loading')}</div>`;

  const { data, error } = await db.from('residents')
    .select('id, nom, prenom, numero_chambre, date_naissance, photo_url, medecin_id')
    .eq('actif', true)
    .not('date_naissance', 'is', null)
    .order('nom');

  if (error) { toastError(t('anniversaires.loadError')); wrap.innerHTML = ''; return; }

  const now = new Date();
  _allData = (data || []).map(r => {
    const dob  = new Date(r.date_naissance);
    const yr   = now.getFullYear();
    let bday   = new Date(yr, dob.getMonth(), dob.getDate());
    const today = new Date(yr, now.getMonth(), now.getDate());
    if (bday < today) bday = new Date(yr + 1, dob.getMonth(), dob.getDate());
    const diffDays = Math.round((bday - today) / 86400000);
    const age      = bday.getFullYear() - dob.getFullYear();
    return { ...r, bday, diffDays, age, dobMonth: dob.getMonth(), dobDay: dob.getDate() };
  }).sort((a, b) => a.diffDays - b.diffDays);

  _render('all', _allData);
}

function _render(filter, data) {
  const wrap = document.getElementById('bday-content');
  if (!wrap) return;

  let list = data;
  if (filter === 'today') list = data.filter(r => r.diffDays === 0);
  if (filter === 'week')  list = data.filter(r => r.diffDays <= 7);

  if (!list.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-balloon-heart"></i><p>${t('anniversaires.noBirthday')}</p></div>`;
    return;
  }

  const todayList    = list.filter(r => r.diffDays === 0);
  const tomorrowList = list.filter(r => r.diffDays === 1);
  const weekList     = list.filter(r => r.diffDays > 1 && r.diffDays <= 7);
  const monthList    = list.filter(r => r.diffDays > 7 && r.diffDays <= 30);
  const laterList    = list.filter(r => r.diffDays > 30);

  let html = '';

  if (todayList.length) {
    html += `<div class="bday-section bday-section-today">
      <div class="bday-section-title">
        <i class="bi bi-stars"></i> ${t('anniversaires.todaySection')}
        <span class="bday-count">${todayList.length}</span>
      </div>
      <div class="bday-grid">${todayList.map(r => _cardHTML(r, 'today')).join('')}</div>
    </div>`;
  }

  if (tomorrowList.length && filter !== 'today') {
    html += `<div class="bday-section">
      <div class="bday-section-title">
        <i class="bi bi-alarm-fill"></i> ${t('anniversaires.tomorrowLabel')}
        <span class="bday-count">${tomorrowList.length}</span>
      </div>
      <div class="bday-grid">${tomorrowList.map(r => _cardHTML(r, 'tomorrow')).join('')}</div>
    </div>`;
  }

  if (weekList.length && filter !== 'today') {
    html += `<div class="bday-section">
      <div class="bday-section-title">
        <i class="bi bi-calendar-week-fill"></i> ${t('anniversaires.upcomingSection')}
        <span class="bday-count">${weekList.length}</span>
      </div>
      <div class="bday-grid">${weekList.map(r => _cardHTML(r, 'soon')).join('')}</div>
    </div>`;
  }

  if (monthList.length && filter === 'all') {
    html += `<div class="bday-section">
      <div class="bday-section-title">
        <i class="bi bi-calendar3"></i> ${t('anniversaires.monthSection')}
        <span class="bday-count">${monthList.length}</span>
      </div>
      <div class="bday-grid">${monthList.map(r => _cardHTML(r, 'month')).join('')}</div>
    </div>`;
  }

  if (laterList.length && filter === 'all') {
    html += `<div class="bday-section">
      <div class="bday-section-title">
        <i class="bi bi-calendar-range-fill"></i> ${t('anniversaires.allSection')}
        <span class="bday-count">${laterList.length}</span>
      </div>
      <div class="bday-grid">${laterList.map(r => _cardHTML(r, 'later')).join('')}</div>
    </div>`;
  }

  if (!html) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-balloon-heart"></i><p>${t('anniversaires.noBirthday')}</p></div>`;
    return;
  }

  wrap.innerHTML = html;
}

function _cardHTML(r, type) {
  const locale = getLang() === 'en' ? 'en-MU' : 'fr-MU';
  const bdayStr = new Date(new Date().getFullYear(), r.dobMonth, r.dobDay)
    .toLocaleDateString(locale, { day: 'numeric', month: 'long' });

  let badge = '';
  if (type === 'today') {
    badge = `<span class="bday-badge bday-badge-today"><i class="bi bi-stars"></i> ${t('anniversaires.todayLabel')}</span>`;
  } else if (type === 'tomorrow') {
    badge = `<span class="bday-badge bday-badge-tomorrow"><i class="bi bi-alarm-fill"></i> ${t('anniversaires.tomorrowLabel')}</span>`;
  } else {
    badge = `<span class="bday-badge bday-badge-soon"><i class="bi bi-clock"></i> ${t('anniversaires.inDays')} ${r.diffDays} ${t('anniversaires.days')}</span>`;
  }

  const avatar = r.photo_url
    ? `<img src="${r.photo_url}" class="bday-avatar-img" alt="">`
    : `<div class="bday-avatar-initials ${type === 'today' ? 'bday-avatar-today' : ''}">${initials(r.nom, r.prenom)}</div>`;

  return `<div class="bday-card ${type === 'today' ? 'bday-card-today' : ''}" data-id="${r.id}">
    <div class="bday-card-top">
      <div class="bday-avatar-wrap">${avatar}</div>
      <div class="bday-card-info">
        <div class="bday-name">${fullName(r.nom, r.prenom)}</div>
        <div class="bday-meta">
          <span><i class="bi bi-door-open-fill"></i> ${t('anniversaires.room')} ${r.numero_chambre || '—'}</span>
          <span><i class="bi bi-calendar-heart-fill"></i> ${bdayStr}</span>
        </div>
        <div class="bday-age">${r.age} ${t('anniversaires.yearsOld')}</div>
      </div>
    </div>
    <div class="bday-card-foot">
      ${badge}
      ${type === 'today' ? `<div class="bday-congrats">${t('anniversaires.congratulations')} ! 🎂</div>` : ''}
    </div>
  </div>`;
}

async function _generateAlerts() {
  const btn = document.getElementById('btn-gen-bday');
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="login-spin"></span>`; }

  try {
    const now  = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Résidents avec anniversaire aujourd'hui ou demain
    const toAlert = _allData.filter(r => r.diffDays === 0 || r.diffDays === 1);

    if (!toAlert.length) {
      toastSuccess(getLang() === 'en' ? 'No birthdays today or tomorrow' : 'Aucun anniversaire aujourd\'hui ni demain');
      return;
    }

    const inserts = toAlert.map(r => ({
      type:        'anniversaire',
      resident_id: r.id,
      titre:       r.diffDays === 0
        ? `${getLang()==='en'?'Birthday today':'Anniversaire aujourd\'hui'} — ${fullName(r.nom, r.prenom)}`
        : `${getLang()==='en'?'Birthday tomorrow':'Anniversaire demain'} — ${fullName(r.nom, r.prenom)}`,
      message:     r.diffDays === 0
        ? `${fullName(r.nom, r.prenom)} ${getLang()==='en'?'turns':'fête ses'} ${r.age} ${t('anniversaires.yearsOld')} ${getLang()==='en'?'today':'aujourd\'hui'} !`
        : `${fullName(r.nom, r.prenom)} ${getLang()==='en'?'will turn':'fêtera ses'} ${r.age} ${t('anniversaires.yearsOld')} ${getLang()==='en'?'tomorrow':'demain'}.`,
      priorite:    r.diffDays === 0 ? 1 : 2,
      lue:         false,
      traitee:     false,
    }));

    const { error } = await db.from('alertes').insert(inserts);
    if (error) throw error;

    toastSuccess(t('anniversaires.alertGenerated'));
  } catch (e) {
    toastError(t('anniversaires.alertError') + ': ' + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-balloon-heart-fill"></i> ${t('anniversaires.generateAlerts')}`;
    }
  }
}
