import { db, SUPABASE_URL, SUPABASE_KEY } from '../supabase.js';
import { openModal, closeModal }          from '../../script.js';
import { toastSuccess, toastError }       from '../toast.js';
import { escapeHtml, initials, fullName } from '../utils.js';
import { isSuperAdmin, currentUserInfo }  from '../auth.js';
import { t, getLang }                     from '../i18n.js';

// ── Panel d'administration (ex-manager/, fusionné dans l'app) ──
// Réservé au super admin : gestion des comptes + journal d'activité.
// La restriction est aussi appliquée côté serveur (RLS app_users,
// v_audit_log, fn_is_super_admin) : l'UI n'est qu'une commodité.

// Client secondaire SANS persistance : créer un compte via signUp
// sans écraser la session du super admin connecté.
let _sbCreate = null;
function _sbc() {
  if (!_sbCreate) {
    _sbCreate = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return _sbCreate;
}

const AUDIT_LIMIT = 50;
let _auditOffset = 0;
let _auditRows   = [];
let _journalInit = false;

export function renderPanelAdmin(container) {
  // Double garde : le routeur filtre déjà, on ne rend rien pour les autres rôles
  if (!isSuperAdmin()) {
    container.innerHTML = `<div class="empty-state"><i class="bi bi-shield-lock-fill"></i><p>${t('panel.denied')}</p></div>`;
    return;
  }
  _journalInit = false;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('panel.title')}</h2>
        <span class="sub">${t('panel.subtitle')}</span>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-panel-add">
          <i class="bi bi-person-plus-fill"></i> ${t('panel.newUser')}
        </button>
      </div>
    </div>

    <div class="tabs" id="panel-tabs">
      <button class="tab-btn active" data-tab="users"><i class="bi bi-people-fill"></i> ${t('panel.tabUsers')}</button>
      <button class="tab-btn" data-tab="journal"><i class="bi bi-journal-text"></i> ${t('panel.tabJournal')}</button>
    </div>

    <div id="panel-pane-users">
      <div class="card"><div id="panel-users-wrap"></div></div>
    </div>

    <div id="panel-pane-journal" style="display:none">
      <div class="card" style="margin-bottom:1rem;padding:1rem">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.75rem;align-items:end">
          <div class="form-group" style="margin:0">
            <label class="form-label">${t('panel.filterUser')}</label>
            <select id="pj-user" class="form-control"><option value="">${t('panel.allUsers')}</option></select>
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label">${t('panel.filterTable')}</label>
            <select id="pj-table" class="form-control"><option value="">${t('panel.allTables')}</option></select>
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label">${t('panel.filterAction')}</label>
            <select id="pj-action" class="form-control">
              <option value="">${t('panel.allActions')}</option>
              <option value="INSERT">${t('panel.actionCreate')}</option>
              <option value="UPDATE">${t('panel.actionUpdate')}</option>
              <option value="DELETE">${t('panel.actionDelete')}</option>
              <option value="LOGIN">${t('panel.actionLogin')}</option>
              <option value="LOGIN_FAILED">${t('panel.actionLoginFailed')}</option>
              <option value="LOGOUT">${t('panel.actionLogout')}</option>
              <option value="EXPORT_PDF">${t('panel.actionExportPdf')}</option>
              <option value="EXPORT_CSV">${t('panel.actionExportCsv')}</option>
            </select>
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label">${t('panel.filterFrom')}</label>
            <input type="date" id="pj-from" class="form-control">
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label">${t('panel.filterTo')}</label>
            <input type="date" id="pj-to" class="form-control">
          </div>
          <div style="display:flex;gap:.5rem">
            <button class="btn btn-primary" id="pj-apply"><i class="bi bi-funnel-fill"></i> ${t('panel.filter')}</button>
            <button class="btn btn-secondary" id="pj-csv" title="${t('panel.exportCsv')}"><i class="bi bi-filetype-csv"></i></button>
          </div>
        </div>
      </div>
      <div class="card">
        <div id="panel-audit-wrap"></div>
        <div style="text-align:center;padding:1rem">
          <button id="pj-more" class="btn btn-secondary btn-sm" style="display:none">
            <i class="bi bi-chevron-down"></i> ${t('panel.loadMore')}
          </button>
        </div>
      </div>
    </div>`;

  document.getElementById('panel-tabs').onclick = e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('#panel-tabs .tab-btn').forEach(b =>
      b.classList.toggle('active', b === btn));
    const journal = btn.dataset.tab === 'journal';
    document.getElementById('panel-pane-users').style.display   = journal ? 'none' : '';
    document.getElementById('panel-pane-journal').style.display = journal ? '' : 'none';
    if (journal && !_journalInit) {
      _journalInit = true;
      _loadJournalFilters();
      _loadAudit(true);
    }
  };

  document.getElementById('btn-panel-add').onclick = () => _openUserForm(null);
  document.getElementById('pj-apply').onclick = () => _loadAudit(true);
  document.getElementById('pj-more').onclick  = () => _loadAudit(false);
  document.getElementById('pj-csv').onclick   = _exportCsv;

  _loadUsers();
}

/* ── Utilisateurs ─────────────────────────────────────────── */

async function _loadUsers() {
  const wrap = document.getElementById('panel-users-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-light)"><i class="bi bi-hourglass-split"></i> ${t('common.loading')}</div>`;

  const [usersRes, actRes] = await Promise.all([
    db.from('app_users').select('*').order('nom'),
    db.rpc('fn_last_activity'),
  ]);

  if (usersRes.error) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>${escapeHtml(usersRes.error.message)}</p></div>`;
    return;
  }
  const users = usersRes.data || [];
  if (!users.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-people"></i><p>${t('panel.noUsers')}</p></div>`;
    return;
  }

  const lastAct = {};
  (actRes.data || []).forEach(a => { lastAct[a.auth_user_id] = a.last_at; });
  const meId = currentUserInfo()?.id;

  wrap.innerHTML = `<div class="table-wrap"><table class="table">
    <thead><tr>
      <th>${t('panel.colUser')}</th><th>${t('panel.colEmail')}</th><th>${t('panel.colPhone')}</th>
      <th>${t('panel.colRole')}</th><th>${t('panel.colLastActivity')}</th><th>${t('panel.colStatus')}</th>
      <th style="text-align:right">${t('panel.colActions')}</th>
    </tr></thead>
    <tbody>
      ${users.map(u => `<tr data-id="${u.id}">
        <td>
          <div style="display:flex;align-items:center;gap:.6rem">
            <div class="patient-avatar">${initials(u.nom, u.prenom)}</div>
            <div>
              <div style="font-weight:600">${escapeHtml(fullName(u.nom, u.prenom))}${u.id === meId ? ` <span style="font-size:.72rem;color:var(--text-light)">(${t('panel.you')})</span>` : ''}</div>
              <div style="font-size:.75rem;color:var(--text-light)">${escapeHtml(u.poste || '')}</div>
            </div>
          </div>
        </td>
        <td style="font-size:.85rem">${escapeHtml(u.email || '—')}</td>
        <td style="font-size:.85rem">${escapeHtml(u.telephone || '—')}</td>
        <td>${_roleBadge(u.role)}</td>
        <td style="font-size:.82rem;color:var(--text-light)">${_lastActivity(lastAct[u.auth_user_id])}</td>
        <td><span class="badge ${u.actif ? 'badge-actif' : 'badge-annule'}">${u.actif ? t('panel.active') : t('panel.inactive')}</span></td>
        <td><div class="table-actions">
          <button class="btn-icon" data-action="edit" title="${t('common.modify')}"><i class="bi bi-pencil-fill"></i></button>
          ${u.id !== meId ? `
            <button class="btn-icon" data-action="toggle" title="${u.actif ? t('panel.deactivate') : t('panel.activate')}"><i class="bi bi-${u.actif ? 'pause' : 'play'}-circle-fill"></i></button>
            <button class="btn-icon" data-action="delete" title="${t('common.delete')}" style="color:#dc2626"><i class="bi bi-trash3-fill"></i></button>
          ` : ''}
        </div></td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;

  // onclick (jamais addEventListener ici : _loadUsers est rappelée sur le même élément)
  wrap.onclick = e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = e.target.closest('tr[data-id]')?.dataset.id;
    const u  = users.find(x => x.id === id);
    if (!u) return;
    if (btn.dataset.action === 'edit')   _openUserForm(u);
    if (btn.dataset.action === 'toggle') _confirmToggle(u);
    if (btn.dataset.action === 'delete') _confirmDelete(u);
  };
}

function _roleBadge(role) {
  if (role === 'super_admin')
    return `<span class="badge badge-teal"><i class="bi bi-shield-fill"></i> ${t('panel.roleSuper')}</span>`;
  if (role === 'receptionniste')
    return `<span class="badge badge-attente">${t('panel.roleReception')}</span>`;
  return `<span class="badge badge-planifie">${t('panel.roleAdmin')}</span>`;
}

function _lastActivity(ts) {
  if (!ts) return `<span style="color:var(--text-light)">${t('panel.never')}</span>`;
  const locale = getLang() === 'en' ? 'en-MU' : 'fr-MU';
  return new Date(ts).toLocaleString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

/* ── Formulaire utilisateur (création / édition) ──────────── */

function _openUserForm(user) {
  const isNew = !user;
  const u = user || {};

  const body = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('panel.formFirstname')} <span class="required">*</span></label>
        <input type="text" id="pu-prenom" class="form-control" value="${escapeHtml(u.prenom || '')}" placeholder="Sophie">
      </div>
      <div class="form-group">
        <label class="form-label">${t('panel.formLastname')} <span class="required">*</span></label>
        <input type="text" id="pu-nom" class="form-control" value="${escapeHtml(u.nom || '')}" placeholder="Martin">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('panel.formEmail')} ${isNew ? '<span class="required">*</span>' : ''}</label>
      <input type="email" id="pu-email" class="form-control" value="${escapeHtml(u.email || '')}"
        placeholder="sophie@sthughs.mu" ${!isNew ? 'readonly style="opacity:.65"' : ''}>
      ${!isNew ? `<div style="font-size:.75rem;color:var(--text-light);margin-top:.25rem">${t('panel.formEmailNote')}</div>` : ''}
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">${t('panel.formPhone')}</label>
        <input type="text" id="pu-tel" class="form-control" value="${escapeHtml(u.telephone || '')}" placeholder="+230 5XXX XXXX">
      </div>
      <div class="form-group">
        <label class="form-label">${t('panel.formPost')}</label>
        <input type="text" id="pu-poste" class="form-control" value="${escapeHtml(u.poste || '')}" placeholder="${t('panel.formPostPh')}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('panel.formRole')} <span class="required">*</span></label>
      <select id="pu-role" class="form-control">
        <option value="admin" ${u.role === 'admin' || isNew ? 'selected' : ''}>${t('panel.formRoleAdmin')}</option>
        <option value="receptionniste" ${u.role === 'receptionniste' ? 'selected' : ''}>${t('panel.formRoleReception')}</option>
        <option value="super_admin" ${u.role === 'super_admin' ? 'selected' : ''}>${t('panel.formRoleSuper')}</option>
      </select>
    </div>
    ${isNew ? `
    <div class="form-group">
      <label class="form-label">${t('panel.formPassword')} <span class="required">*</span></label>
      <input type="password" id="pu-password" class="form-control" placeholder="${getLang() === 'en' ? 'Minimum 8 characters' : 'Minimum 8 caractères'}" autocomplete="new-password">
      <div style="font-size:.75rem;color:var(--text-light);margin-top:.25rem">${t('panel.formPasswordNote')}</div>
    </div>` : ''}`;

  openModal(
    isNew ? `<i class="bi bi-person-plus-fill"></i> ${t('panel.formTitleNew')}`
          : `<i class="bi bi-pencil-fill"></i> ${t('panel.formTitleEdit')} - ${escapeHtml(fullName(u.nom, u.prenom))}`,
    body,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary btn-sm', action: closeModal },
      { label: `<i class="bi bi-check-lg"></i> ${t('common.save')}`, cls: 'btn btn-primary btn-sm',
        action: () => isNew ? _saveNewUser() : _saveUser(u.id) },
    ]
  );
}

async function _saveNewUser() {
  const prenom   = document.getElementById('pu-prenom').value.trim();
  const nom      = document.getElementById('pu-nom').value.trim();
  const email    = document.getElementById('pu-email').value.trim();
  const tel      = document.getElementById('pu-tel').value.trim();
  const poste    = document.getElementById('pu-poste').value.trim();
  const role     = document.getElementById('pu-role').value;
  const password = document.getElementById('pu-password').value;

  if (!prenom || !nom || !email || !password) { toastError(t('panel.allRequired')); return; }
  if (password.length < 8) { toastError(t('panel.passwordMin')); return; }

  const { data: authData, error: authError } = await _sbc().auth.signUp({
    email, password,
    options: { data: { nom, prenom } }
  });
  if (authError) { toastError(authError.message); return; }

  const authUserId = authData.user?.id;
  if (!authUserId) { toastError(t('panel.createdNoId')); return; }

  const { error: dbError } = await db.from('app_users').insert({
    auth_user_id: authUserId, role, nom, prenom, email,
    telephone: tel || null, poste: poste || null, actif: true
  });
  if (dbError) {
    toastError(t('panel.createdDbErr').replace('{uuid}', authUserId) + dbError.message);
    return;
  }

  closeModal();
  toastSuccess(authData.session ? t('panel.createdOk') : t('panel.createdConfirm'));
  _loadUsers();
}

async function _saveUser(id) {
  const prenom = document.getElementById('pu-prenom').value.trim();
  const nom    = document.getElementById('pu-nom').value.trim();
  const tel    = document.getElementById('pu-tel').value.trim();
  const poste  = document.getElementById('pu-poste').value.trim();
  const role   = document.getElementById('pu-role').value;

  if (!prenom || !nom) { toastError(t('panel.allRequired')); return; }

  const { error } = await db.from('app_users').update({
    prenom, nom, telephone: tel || null, poste: poste || null, role
  }).eq('id', id);
  if (error) { toastError(error.message); return; }

  closeModal();
  toastSuccess(t('panel.savedOk'));
  _loadUsers();
}

function _confirmToggle(u) {
  if (u.id === currentUserInfo()?.id) { toastError(t('panel.selfGuard')); return; }
  const name = fullName(u.nom, u.prenom);
  openModal(
    u.actif ? `<i class="bi bi-pause-circle-fill"></i> ${t('panel.confirmDisableTitle')}`
            : `<i class="bi bi-play-circle-fill"></i> ${t('panel.confirmEnableTitle')}`,
    `<p>${(u.actif ? t('panel.confirmDisable') : t('panel.confirmEnable')).replace('{name}', `<strong>${escapeHtml(name)}</strong>`)}</p>`,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary btn-sm', action: closeModal },
      { label: u.actif ? t('panel.deactivate') : t('panel.activate'),
        cls: `btn ${u.actif ? 'btn-secondary' : 'btn-primary'} btn-sm`,
        action: async () => {
          const { error } = await db.from('app_users').update({ actif: !u.actif }).eq('id', u.id);
          if (error) { toastError(error.message); return; }
          closeModal();
          toastSuccess(t('panel.savedOk'));
          _loadUsers();
        } },
    ]
  );
}

function _confirmDelete(u) {
  if (u.id === currentUserInfo()?.id) { toastError(t('panel.selfGuard')); return; }
  const name = fullName(u.nom, u.prenom);
  openModal(
    `<i class="bi bi-trash3-fill"></i> ${t('panel.confirmDeleteTitle')}`,
    `<p>${t('panel.confirmDelete').replace('{name}', `<strong>${escapeHtml(name)}</strong>`)}</p>
     <div style="background:var(--bg-alt);border-radius:var(--radius-sm);padding:.6rem .9rem;font-size:.82rem;color:var(--text-light)">
       <i class="bi bi-info-circle-fill"></i> ${t('panel.deleteNote')}
     </div>`,
    [
      { label: t('common.cancel'), cls: 'btn btn-secondary btn-sm', action: closeModal },
      { label: `<i class="bi bi-trash3-fill"></i> ${t('common.delete')}`, cls: 'btn btn-danger btn-sm',
        action: async () => {
          const { error } = await db.from('app_users').delete().eq('id', u.id);
          if (error) { toastError(error.message); return; }
          closeModal();
          toastSuccess(t('panel.deletedOk'));
          _loadUsers();
        } },
    ]
  );
}

/* ── Journal d'activité ───────────────────────────────────── */

async function _loadJournalFilters() {
  const [usersRes, tablesRes] = await Promise.all([
    db.from('app_users').select('auth_user_id, nom, prenom').order('nom'),
    db.rpc('fn_audit_tables'),
  ]);
  const selUser = document.getElementById('pj-user');
  if (selUser) {
    selUser.innerHTML = `<option value="">${t('panel.allUsers')}</option>` +
      (usersRes.data || []).map(u =>
        `<option value="${u.auth_user_id}">${escapeHtml(fullName(u.nom, u.prenom))}</option>`).join('');
  }
  const selTable = document.getElementById('pj-table');
  if (selTable) {
    selTable.innerHTML = `<option value="">${t('panel.allTables')}</option>` +
      (tablesRes.data || []).map(r =>
        `<option value="${escapeHtml(r.table_name)}">${escapeHtml(_tableLabel(r.table_name))}</option>`).join('');
  }
}

function _auditQuery() {
  let q = db.from('v_audit_log').select('*').order('created_at', { ascending: false });
  const user   = document.getElementById('pj-user')?.value;
  const table  = document.getElementById('pj-table')?.value;
  const action = document.getElementById('pj-action')?.value;
  const from   = document.getElementById('pj-from')?.value;
  const to     = document.getElementById('pj-to')?.value;
  if (user)   q = q.eq('auth_user_id', user);
  if (table)  q = q.eq('table_name', table);
  if (action) q = q.eq('action', action);
  if (from)   q = q.gte('created_at', from + 'T00:00:00');
  if (to)     q = q.lte('created_at', to + 'T23:59:59');
  return q;
}

async function _loadAudit(reset) {
  const wrap = document.getElementById('panel-audit-wrap');
  if (!wrap) return;
  if (reset) {
    _auditOffset = 0;
    _auditRows = [];
    wrap.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-light)"><i class="bi bi-hourglass-split"></i> ${t('common.loading')}</div>`;
  }

  const { data, error } = await _auditQuery().range(_auditOffset, _auditOffset + AUDIT_LIMIT - 1);
  if (error) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-triangle"></i><p>${escapeHtml(error.message)}</p></div>`;
    return;
  }

  _auditRows = _auditRows.concat(data || []);
  _auditOffset = _auditRows.length;

  if (!_auditRows.length) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-journal-x"></i><p>${t('panel.noAudit')}</p></div>`;
    document.getElementById('pj-more').style.display = 'none';
    return;
  }

  const locale = getLang() === 'en' ? 'en-MU' : 'fr-MU';
  wrap.innerHTML = `<div class="table-wrap"><table class="table">
    <thead><tr>
      <th style="width:150px">${t('panel.colDate')}</th>
      <th>${t('panel.filterUser')}</th>
      <th style="width:120px">${t('panel.filterAction')}</th>
      <th style="width:140px">${t('panel.filterTable')}</th>
      <th>${t('panel.colSummary')}</th>
    </tr></thead>
    <tbody>
      ${_auditRows.map((a, i) => `<tr data-idx="${i}" style="cursor:pointer" title="${t('panel.clickDetail')}">
        <td style="font-size:.8rem;white-space:nowrap;color:var(--text-light)">
          ${new Date(a.created_at).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </td>
        <td>
          <div style="font-weight:600">${a.user_prenom || a.user_nom ? escapeHtml(fullName(a.user_nom, a.user_prenom)) : `<span style="color:var(--text-light)">${t('panel.unknown')}</span>`}</div>
          <div style="font-size:.73rem;color:var(--text-light)">${_roleLabel(a.user_role)}</div>
        </td>
        <td>${_actionBadge(a.action)}</td>
        <td style="font-size:.85rem">${escapeHtml(_tableLabel(a.table_name))}</td>
        <td style="font-size:.82rem;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_auditSummary(a, locale)}</td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;

  wrap.onclick = e => {
    const tr = e.target.closest('tr[data-idx]');
    if (tr) _openAuditDetail(_auditRows[+tr.dataset.idx]);
  };

  document.getElementById('pj-more').style.display =
    (data || []).length < AUDIT_LIMIT ? 'none' : '';
}

function _roleLabel(role) {
  if (role === 'super_admin')    return t('panel.roleSuper');
  if (role === 'receptionniste') return t('panel.roleReception');
  if (role === 'admin')          return t('panel.roleAdmin');
  return '';
}

function _actionBadge(action) {
  const map = {
    INSERT:       ['badge-actif',    'actionCreate'],
    UPDATE:       ['badge-attente',  'actionUpdate'],
    DELETE:       ['badge-annule',   'actionDelete'],
    LOGIN:        ['badge-teal',     'actionLogin'],
    LOGIN_FAILED: ['badge-expire',   'actionLoginFailed'],
    LOGOUT:       ['badge-gratuit',  'actionLogout'],
    EXPORT_PDF:   ['badge-planifie', 'actionExportPdf'],
    EXPORT_CSV:   ['badge-planifie', 'actionExportCsv'],
  };
  const [cls, key] = map[action] || ['badge-teal', null];
  return `<span class="badge ${cls}">${key ? t('panel.' + key) : escapeHtml(action)}</span>`;
}

function _tableLabel(tbl) {
  const map = {
    residents: t('nav.residents'), doctors: t('nav.medecins'),
    traitements: t('nav.traitements'), consultations: t('nav.consultations'),
    rendez_vous: t('nav.rdv'), planning_visites: t('nav.planification'),
    visites: t('nav.visites'), courses: t('nav.courses'),
    alertes: t('nav.alertes'), app_users: t('panel.tabUsers'),
    demandes_visite: t('demandes.tab'), _evenements: t('panel.tableEvents'),
  };
  return map[tbl] || tbl;
}

function _auditSummary(a, locale) {
  try {
    if (a.table_name === '_evenements') {
      const d = a.details || {};
      return escapeHtml([d.email, d.resident, d.type, d.source, d.lignes]
        .filter(Boolean).join(' - ')) || '—';
    }
    const row   = a.details?.new || a.details?.old || {};
    const parts = [];
    if (row.nom && row.prenom)   parts.push(`${row.prenom} ${row.nom}`);
    else if (row.nom)            parts.push(row.nom);
    if (row.nom_medicament)      parts.push(row.nom_medicament);
    if (row.diagnostic)          parts.push(row.diagnostic);
    else if (row.motif)          parts.push(row.motif);
    if (row.date_consultation)   parts.push(new Date(row.date_consultation).toLocaleDateString(locale));
    if (row.date_rdv)            parts.push(new Date(row.date_rdv).toLocaleDateString(locale));
    if (row.email && a.table_name === 'app_users') parts.push(row.email);
    if (row.numero_chambre)      parts.push(`${getLang() === 'en' ? 'Rm.' : 'Ch.'} ${row.numero_chambre}`);
    return escapeHtml(parts.slice(0, 3).join(' - ')) || '—';
  } catch { return '—'; }
}

function _openAuditDetail(a) {
  if (!a) return;
  const locale = getLang() === 'en' ? 'en-MU' : 'fr-MU';
  const date = new Date(a.created_at).toLocaleString(locale, {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const userName = fullName(a.user_nom, a.user_prenom);

  const fmtVal = v => {
    if (v === null || v === undefined) return `<span style="color:var(--text-light)">∅</span>`;
    if (typeof v === 'object') return `<code style="font-size:.75rem">${escapeHtml(JSON.stringify(v))}</code>`;
    return escapeHtml(String(v));
  };

  const oldData = a.details?.old || null;
  const newData = a.details?.new || null;
  let body = `
    <table style="width:100%;font-size:.85rem;margin-bottom:1rem">
      <tr><td style="font-weight:600;padding:.25rem 0;width:130px">${t('panel.colDate')}</td><td>${date}</td></tr>
      <tr><td style="font-weight:600;padding:.25rem 0">${t('panel.filterUser')}</td><td>${escapeHtml(userName)}${a.user_email ? ` (${escapeHtml(a.user_email)})` : ''}</td></tr>
      <tr><td style="font-weight:600;padding:.25rem 0">${t('panel.filterAction')}</td><td>${_actionBadge(a.action)}</td></tr>
      <tr><td style="font-weight:600;padding:.25rem 0">${t('panel.filterTable')}</td><td>${escapeHtml(_tableLabel(a.table_name))}</td></tr>
      ${a.record_id ? `<tr><td style="font-weight:600;padding:.25rem 0">ID</td><td><code style="font-size:.75rem">${escapeHtml(a.record_id)}</code></td></tr>` : ''}
    </table>`;

  if (a.action === 'UPDATE' && oldData && newData) {
    const keys = Object.keys(newData);
    body += keys.length ? `
      <div style="font-weight:700;margin-bottom:.5rem">${t('panel.changedFields')} (${keys.length})</div>
      <div class="table-wrap"><table class="table" style="font-size:.82rem">
        <thead><tr><th>${t('panel.fieldCol')}</th><th>${t('panel.beforeCol')}</th><th>${t('panel.afterCol')}</th></tr></thead>
        <tbody>
          ${keys.map(k => `<tr>
            <td style="font-weight:600">${escapeHtml(k)}</td>
            <td style="color:#b91c1c">${fmtVal(oldData[k])}</td>
            <td style="color:#15803d">${fmtVal(newData[k])}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : `<div style="color:var(--text-light)">${t('panel.noChanges')}</div>`;
  } else {
    const snap = newData || oldData || a.details || {};
    const keys = Object.keys(snap);
    body += keys.length ? `
      <div style="font-weight:700;margin-bottom:.5rem">${a.action === 'DELETE' ? t('panel.deletedData') : t('panel.recordedData')}</div>
      <div class="table-wrap"><table class="table" style="font-size:.82rem">
        <thead><tr><th>${t('panel.fieldCol')}</th><th>${t('panel.valueCol')}</th></tr></thead>
        <tbody>
          ${keys.map(k => `<tr>
            <td style="font-weight:600">${escapeHtml(k)}</td>
            <td>${fmtVal(snap[k])}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : `<div style="color:var(--text-light)">${t('panel.noChanges')}</div>`;
  }

  openModal(`<i class="bi bi-journal-text"></i> ${t('panel.detailTitle')}`, body, [
    { label: t('common.close'), cls: 'btn btn-secondary btn-sm', action: closeModal },
  ]);
}

/* ── Export CSV du journal (filtres courants, 2000 max) ───── */

async function _exportCsv() {
  const { data, error } = await _auditQuery().limit(2000);
  if (error) { toastError(error.message); return; }
  const rows = data || [];
  if (!rows.length) { toastError(t('panel.noAudit')); return; }

  const locale = getLang() === 'en' ? 'en-MU' : 'fr-MU';
  const head = [t('panel.colDate'), t('panel.filterUser'), t('panel.colRole'),
                t('panel.filterAction'), t('panel.filterTable'), t('panel.colSummary')];
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const tmp = document.createElement('div');
  const noHtml = s => { tmp.innerHTML = s; return tmp.textContent; };

  const lines = rows.map(a => [
    new Date(a.created_at).toLocaleString(locale),
    fullName(a.user_nom, a.user_prenom),
    _roleLabel(a.user_role),
    a.action,
    a.table_name,
    noHtml(_auditSummary(a, locale)),
  ].map(esc).join(';'));

  // BOM UTF-8 : accents corrects à l'ouverture dans Excel
  const csv  = '\ufeff' + head.map(esc).join(';') + '\n' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `journal_sthughs_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  db.rpc('fn_log_evenement', { p_action: 'EXPORT_CSV', p_details: { lignes: rows.length } }).then(() => {}, () => {});
  toastSuccess(t('panel.csvOk').replace('{n}', rows.length));
}
