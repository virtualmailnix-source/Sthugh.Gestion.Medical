'use strict';

/* ── i18n (FR / EN) ──────────────────────────────────────── */
const MGR_T = {
  fr: {
    /* navigation / layout */
    logout: 'Déconnexion', navUsers: 'Utilisateurs', navJournal: "Journal d'activité", navAide: 'Aide',
    newUser: 'Nouvel utilisateur', addUser: 'Ajouter un utilisateur',
    refresh: 'Actualiser', filter: 'Filtrer', loadMore: 'Charger plus',
    save: 'Enregistrer', cancel: 'Annuler', loading: 'Chargement…',
    sectionUsers: 'Utilisateurs', sectionJournal: "Journal d'activité",
    /* login */
    adminPanel: "Panneau d'administration — Super Admin",
    emailLabel: 'Adresse email', passwordLabel: 'Mot de passe',
    loginBtn: 'Se connecter', signingIn: 'Connexion…',
    invalidCreds: 'Identifiants incorrects.',
    accessDenied: 'Accès refusé. Ce panneau est réservé aux super administrateurs.',
    backToApp: "Retour à l'application",
    /* users table */
    colNamePost: 'Nom / Poste', colEmail: 'Email', colPhone: 'Téléphone',
    colRole: 'Rôle', colStatus: 'Statut', colActions: 'Actions',
    /* journal */
    colDate: 'Date / Heure', colUser: 'Utilisateur', colAction: 'Action',
    colTable: 'Table', colSummary: 'Résumé',
    /* filters */
    filterUser: 'Utilisateur', filterTable: 'Table', filterAction: 'Action',
    allFilter: 'Tous', allTables: 'Toutes', allActions: 'Toutes',
    /* roles / status */
    roleSuper: 'Super Admin', roleAdmin: 'Admin',
    statusActive: 'Actif', statusInactive: 'Inactif',
    activate: 'Activer', deactivate: 'Désactiver',
    /* audit actions */
    actionCreate: 'Création', actionUpdate: 'Modification', actionDelete: 'Suppression',
    /* audit tables */
    allUsers: 'Tous les utilisateurs',
    tableResidents: 'Résidents', tableDoctors: 'Médecins', tableTreatments: 'Traitements',
    tableConsultations: 'Consultations', tableRdv: 'Rendez-vous',
    tablePlanning: 'Planification', tableUsers: 'Utilisateurs',
    noAudit: 'Aucune entrée dans le journal.',
    unknown: 'Inconnu',
    /* user form */
    newUserTitle: 'Nouvel utilisateur', editUserTitle: 'Modifier',
    formFirstname: 'Prénom', formLastname: 'Nom',
    formEmail: 'Email', formEmailNote: "L'email ne peut pas être modifié après création.",
    formPhone: 'Téléphone', formPost: 'Poste / Fonction',
    formPostPlaceholder: 'Infirmière, Responsable transport…',
    formRole: 'Rôle',
    formRoleAdmin: 'Admin (infirmière, responsable…)',
    formRoleSuper: 'Super Admin (accès complet)',
    formPassword: 'Mot de passe temporaire',
    formPasswordNote: "L'utilisateur peut le changer après sa première connexion. Si la confirmation email est activée dans Supabase, un lien sera envoyé.",
    /* validation / feedback */
    creating: 'Création du compte…', saving: 'Enregistrement…',
    allRequired: 'Veuillez remplir tous les champs obligatoires (*).',
    nameRequired: 'Nom et prénom sont requis.',
    passwordMin: 'Le mot de passe doit contenir au moins 8 caractères.',
    confirmDisable: 'Voulez-vous désactiver cet utilisateur ?',
    confirmEnable: 'Voulez-vous activer cet utilisateur ?',
    noUsers: 'Aucun utilisateur trouvé.',
  },
  en: {
    /* navigation / layout */
    logout: 'Log out', navUsers: 'Users', navJournal: 'Activity log', navAide: 'Help',
    newUser: 'New user', addUser: 'Add user',
    refresh: 'Refresh', filter: 'Filter', loadMore: 'Load more',
    save: 'Save', cancel: 'Cancel', loading: 'Loading…',
    sectionUsers: 'Users', sectionJournal: 'Activity log',
    /* login */
    adminPanel: 'Administration panel — Super Admin',
    emailLabel: 'Email address', passwordLabel: 'Password',
    loginBtn: 'Sign in', signingIn: 'Signing in…',
    invalidCreds: 'Invalid credentials.',
    accessDenied: 'Access denied. This panel is reserved for super administrators.',
    backToApp: 'Back to the application',
    /* users table */
    colNamePost: 'Name / Position', colEmail: 'Email', colPhone: 'Phone',
    colRole: 'Role', colStatus: 'Status', colActions: 'Actions',
    /* journal */
    colDate: 'Date / Time', colUser: 'User', colAction: 'Action',
    colTable: 'Table', colSummary: 'Summary',
    /* filters */
    filterUser: 'User', filterTable: 'Table', filterAction: 'Action',
    allFilter: 'All', allTables: 'All', allActions: 'All',
    /* roles / status */
    roleSuper: 'Super Admin', roleAdmin: 'Admin',
    statusActive: 'Active', statusInactive: 'Inactive',
    activate: 'Activate', deactivate: 'Deactivate',
    /* audit actions */
    actionCreate: 'Created', actionUpdate: 'Modified', actionDelete: 'Deleted',
    /* audit tables */
    allUsers: 'All users',
    tableResidents: 'Residents', tableDoctors: 'Doctors', tableTreatments: 'Treatments',
    tableConsultations: 'Consultations', tableRdv: 'Appointments',
    tablePlanning: 'Planning', tableUsers: 'Users',
    noAudit: 'No entries in the log.',
    unknown: 'Unknown',
    /* user form */
    newUserTitle: 'New user', editUserTitle: 'Edit',
    formFirstname: 'First name', formLastname: 'Last name',
    formEmail: 'Email', formEmailNote: 'Email cannot be changed after creation.',
    formPhone: 'Phone', formPost: 'Position / Role',
    formPostPlaceholder: 'Nurse, Transport manager…',
    formRole: 'Role',
    formRoleAdmin: 'Admin (nurse, manager…)',
    formRoleSuper: 'Super Admin (full access)',
    formPassword: 'Temporary password',
    formPasswordNote: 'The user can change it after first login. If email confirmation is enabled in Supabase, a confirmation link will be sent.',
    /* validation / feedback */
    creating: 'Creating account…', saving: 'Saving…',
    allRequired: 'Please fill in all required fields (*).',
    nameRequired: 'First name and last name are required.',
    passwordMin: 'Password must be at least 8 characters.',
    confirmDisable: 'Do you want to deactivate this user?',
    confirmEnable: 'Do you want to activate this user?',
    noUsers: 'No users found.',
  },
};

function _getLang() { return localStorage.getItem('sthughs_lang') || 'fr'; }
function _mgrT(key) { return MGR_T[_getLang()]?.[key] ?? MGR_T.fr[key] ?? key; }

function _applyMgrLang() {
  const lang = _getLang();
  document.documentElement.lang = lang;

  /* boutons de langue */
  document.querySelectorAll('.mgr-lang-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.lang === lang)
  );

  /* éléments avec data-mgr-i18n */
  document.querySelectorAll('[data-mgr-i18n]').forEach(el => {
    const val = _mgrT(el.dataset.mgrI18n);
    if (val !== el.dataset.mgrI18n) el.textContent = val;
  });

  /* bouton Ajouter */
  const addBtn = document.getElementById('btn-add-user');
  if (addBtn) addBtn.innerHTML = `<i class="bi bi-person-plus-fill"></i> ${_mgrT('newUser')}`;

  /* boutons modal footer */
  const cancelBtn = document.getElementById('modal-cancel');
  const saveBtn   = document.getElementById('modal-save');
  if (cancelBtn) cancelBtn.textContent = _mgrT('cancel');
  if (saveBtn)   saveBtn.textContent   = _mgrT('save');

  /* filtres du journal — options */
  _rebuildFilterOptions();
}

function _rebuildFilterOptions() {
  /* filtre utilisateur — only option[value=""] */
  const selUser = document.getElementById('filter-user');
  if (selUser) {
    const emptyOpt = selUser.querySelector('option[value=""]');
    if (emptyOpt) emptyOpt.textContent = _mgrT('allUsers');
  }

  /* filtre table */
  const selTable = document.getElementById('filter-table');
  if (selTable) {
    const tableMap = {
      '': 'allTables', 'residents': 'tableResidents', 'doctors': 'tableDoctors',
      'traitements': 'tableTreatments', 'consultations': 'tableConsultations',
      'rendez_vous': 'tableRdv', 'planning_visites': 'tablePlanning', 'app_users': 'tableUsers'
    };
    selTable.querySelectorAll('option').forEach(opt => {
      const key = tableMap[opt.value];
      if (key) opt.textContent = _mgrT(key);
    });
  }

  /* filtre action */
  const selAction = document.getElementById('filter-action');
  if (selAction) {
    const actionMap = { '': 'allActions', 'INSERT': 'actionCreate', 'UPDATE': 'actionUpdate', 'DELETE': 'actionDelete' };
    selAction.querySelectorAll('option').forEach(opt => {
      const key = actionMap[opt.value];
      if (key) opt.textContent = _mgrT(key);
    });
  }
}

const SUPABASE_URL = 'https://wfngkkrnzoponrajgdqk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QnWfvohGoWFPTgOr5eEhaQ_l8qWIbEv';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, storageKey: 'sthughs_medical_v1' }
});

const sbCreate = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

/* ── Init ────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  _applyMgrLang();

  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    await _onLoggedIn(session.user);
  } else {
    document.getElementById('login-page').classList.remove('hidden');
  }

  document.getElementById('login-btn').addEventListener('click', _handleLogin);
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') _handleLogin();
  });
});

/* ── Auth ────────────────────────────────────────────────── */

async function _handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-err');
  const btn   = document.getElementById('login-btn');

  errEl.classList.add('hidden');
  btn.disabled = true;
  btn.innerHTML = `<span class="login-spin"></span> ${_mgrT('signingIn')}`;

  const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });

  if (error) {
    errEl.textContent = _mgrT('invalidCreds');
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = _mgrT('loginBtn');
    return;
  }

  await _onLoggedIn(data.user);
}

async function _onLoggedIn(authUser) {
  const { data: isAdmin } = await sb.rpc('fn_is_super_admin');

  if (!isAdmin) {
    // Session partagée avec l'app médicale : ne PAS signOut, cela
    // déconnecterait aussi l'application principale. Refus simple.
    document.getElementById('login-page').classList.remove('hidden');
    const errEl = document.getElementById('login-err');
    errEl.innerHTML = `${_mgrT('accessDenied')}<br>
      <a href="../index.html" style="color:inherit;text-decoration:underline">${_mgrT('backToApp')}</a>`;
    errEl.classList.remove('hidden');
    const btn = document.getElementById('login-btn');
    btn.disabled = false;
    btn.textContent = _mgrT('loginBtn');
    return;
  }

  const { data: appUser } = await sb.from('app_users')
    .select('*').eq('auth_user_id', authUser.id).single();

  document.getElementById('topbar-name').textContent = appUser
    ? `${appUser.prenom || ''} ${appUser.nom || ''}`.trim()
    : authUser.email;

  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  _applyMgrLang();
  _setupNav();
  _navigate('users');
}

function _setupNav() {
  document.querySelectorAll('.nav-tab').forEach(btn =>
    btn.addEventListener('click', () => _navigate(btn.dataset.page))
  );

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await sb.auth.signOut();
    location.reload();
  });

  document.getElementById('mgr-lang-switcher')?.addEventListener('click', e => {
    const btn = e.target.closest('.mgr-lang-btn');
    if (!btn || btn.dataset.lang === _getLang()) return;
    localStorage.setItem('sthughs_lang', btn.dataset.lang);
    _applyMgrLang();
    /* relancer la page active pour mettre à jour les tableaux dynamiques */
    const activePage = document.querySelector('.nav-tab.active')?.dataset.page;
    if (activePage) _navigate(activePage);
  });

  document.getElementById('btn-add-user').addEventListener('click', () => _openUserModal());
  document.getElementById('modal-close').addEventListener('click', _closeModal);
  document.getElementById('modal-cancel').addEventListener('click', _closeModal);
  document.getElementById('btn-apply-filters').addEventListener('click', () => _loadAuditLog(true));
  document.getElementById('btn-refresh-audit').addEventListener('click', () => _loadAuditLog(true));
  document.getElementById('btn-load-more').addEventListener('click', () => _loadAuditLog(false));
}

function _navigate(page) {
  document.querySelectorAll('.nav-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.page === page)
  );
  document.querySelectorAll('.page-section').forEach(s =>
    s.classList.toggle('hidden', s.dataset.page !== page)
  );

  if (page === 'users')   _loadUsers();
  if (page === 'journal') { _loadUserFilter(); _loadAuditLog(true); }
  if (page === 'aide')    _renderAide();
}

/* ── Gestion des utilisateurs ───────────────────────────── */

async function _loadUsers() {
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = `<tr><td colspan="7" class="table-loading"><i class="bi bi-hourglass-split"></i> ${_mgrT('loading')}</td></tr>`;

  const { data, error } = await sb.from('app_users').select('*').order('created_at');

  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-loading" style="color:red">${_mgrT('loading')} ${_esc(error.message)}</td></tr>`;
    return;
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-loading">${_mgrT('noUsers')}</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(u => `
    <tr>
      <td><div class="user-avatar">${_initials(u.nom, u.prenom)}</div></td>
      <td>
        <div style="font-weight:600">${_esc(u.prenom || '')} ${_esc(u.nom || '')}</div>
        <div style="font-size:.78rem;color:var(--text-light)">${_esc(u.poste || '')}</div>
      </td>
      <td style="font-size:.85rem">${_esc(u.email || '—')}</td>
      <td style="font-size:.85rem">${_esc(u.telephone || '—')}</td>
      <td><span class="role-badge role-${u.role}">${u.role === 'super_admin' ? _mgrT('roleSuper') : _mgrT('roleAdmin')}</span></td>
      <td><span class="status-badge ${u.actif ? 'status-actif' : 'status-inactif'}">${u.actif ? _mgrT('statusActive') : _mgrT('statusInactive')}</span></td>
      <td style="white-space:nowrap;display:flex;gap:.3rem;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="editUser('${u.id}')" title="${_mgrT('editUserTitle')}">
          <i class="bi bi-pencil-fill"></i>
        </button>
        <button class="btn btn-sm ${u.actif ? 'btn-warning' : 'btn-success'}" onclick="toggleUser('${u.id}', ${u.actif})">
          <i class="bi bi-${u.actif ? 'pause-circle' : 'play-circle'}-fill"></i>
          ${u.actif ? _mgrT('deactivate') : _mgrT('activate')}
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}', '${_esc(u.prenom)} ${_esc(u.nom)}')" title="${_mgrT('colActions')}">
          <i class="bi bi-trash-fill"></i>
        </button>
      </td>
    </tr>`).join('');
}

window.editUser = async function(id) {
  const { data: u, error } = await sb.from('app_users').select('*').eq('id', id).single();
  if (error || !u) { alert(_mgrT('loading') + '…'); return; }
  _openUserModal(u);
};

window.toggleUser = async function(id, currentActif) {
  if (!confirm(currentActif ? _mgrT('confirmDisable') : _mgrT('confirmEnable'))) return;
  const { error } = await sb.from('app_users').update({ actif: !currentActif }).eq('id', id);
  if (error) { alert(error.message); return; }
  _loadUsers();
};

window.deleteUser = async function(id, name) {
  const lang = _getLang();
  const msg = lang === 'en'
    ? `Permanently delete "${name}"?\n\nThis cannot be undone. The account will be removed from the app but the Supabase Auth account remains active (deactivating is enough to block access).`
    : `Supprimer définitivement "${name}" ?\n\nCette action est irréversible. Le compte sera retiré de l'application mais le compte Supabase Auth reste actif (le désactiver suffit pour bloquer l'accès).`;
  if (!confirm(msg)) return;

  const { error } = await sb.from('app_users').delete().eq('id', id);
  if (error) { alert(error.message); return; }
  _loadUsers();
};

function _openUserModal(user = null) {
  const isNew = !user;

  document.getElementById('modal-title').textContent = isNew
    ? _mgrT('newUserTitle')
    : `${_mgrT('editUserTitle')} — ${user.prenom} ${user.nom}`;

  document.getElementById('modal-body').innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">${_mgrT('formFirstname')} *</label>
        <input type="text" id="f-prenom" class="form-control" value="${_esc(user?.prenom || '')}" placeholder="Sophie">
      </div>
      <div class="form-group">
        <label class="form-label">${_mgrT('formLastname')} *</label>
        <input type="text" id="f-nom" class="form-control" value="${_esc(user?.nom || '')}" placeholder="Martin">
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">${_mgrT('formEmail')} *</label>
        <input type="email" id="f-email" class="form-control"
          value="${_esc(user?.email || '')}" placeholder="sophie@sthughs.mu"
          ${!isNew ? 'readonly' : ''}>
        ${!isNew ? `<small style="color:var(--text-light);font-size:.78rem">${_mgrT('formEmailNote')}</small>` : ''}
      </div>
      <div class="form-group">
        <label class="form-label">${_mgrT('formPhone')}</label>
        <input type="text" id="f-telephone" class="form-control" value="${_esc(user?.telephone || '')}" placeholder="+230 5XXX XXXX">
      </div>
      <div class="form-group">
        <label class="form-label">${_mgrT('formPost')}</label>
        <input type="text" id="f-poste" class="form-control" value="${_esc(user?.poste || '')}" placeholder="${_mgrT('formPostPlaceholder')}">
      </div>
      <div class="form-group form-group-full">
        <label class="form-label">${_mgrT('formRole')} *</label>
        <select id="f-role" class="form-control">
          <option value="admin" ${!isNew && user?.role === 'admin' ? 'selected' : ''}>${_mgrT('formRoleAdmin')}</option>
          <option value="super_admin" ${!isNew && user?.role === 'super_admin' ? 'selected' : ''}>${_mgrT('formRoleSuper')}</option>
        </select>
      </div>
      ${isNew ? `
      <div class="form-group form-group-full">
        <label class="form-label">${_mgrT('formPassword')} *</label>
        <input type="password" id="f-password" class="form-control" placeholder="${_getLang()==='en'?'Minimum 8 characters':'Minimum 8 caractères'}">
        <small style="color:var(--text-light);font-size:.78rem">${_mgrT('formPasswordNote')}</small>
      </div>` : `<input type="hidden" id="f-user-id" value="${user.id}">`}
    </div>`;

  /* update footer buttons text */
  const saveBtn   = document.getElementById('modal-save');
  const cancelBtn = document.getElementById('modal-cancel');
  if (saveBtn)   saveBtn.textContent   = _mgrT('save');
  if (cancelBtn) cancelBtn.textContent = _mgrT('cancel');

  document.getElementById('modal-save').onclick = isNew ? _saveNewUser : () => _updateUser(user.id);
  document.getElementById('modal-overlay').classList.remove('hidden');
}

async function _saveNewUser() {
  const prenom    = document.getElementById('f-prenom').value.trim();
  const nom       = document.getElementById('f-nom').value.trim();
  const email     = document.getElementById('f-email').value.trim();
  const telephone = document.getElementById('f-telephone').value.trim();
  const poste     = document.getElementById('f-poste').value.trim();
  const role      = document.getElementById('f-role').value;
  const password  = document.getElementById('f-password').value;

  if (!prenom || !nom || !email || !password) { alert(_mgrT('allRequired')); return; }
  if (password.length < 8) { alert(_mgrT('passwordMin')); return; }

  const saveBtn = document.getElementById('modal-save');
  saveBtn.disabled = true;
  saveBtn.textContent = _mgrT('creating');

  const { data: authData, error: authError } = await sbCreate.auth.signUp({
    email, password,
    options: { data: { nom, prenom } }
  });

  if (authError) {
    alert(authError.message);
    saveBtn.disabled = false;
    saveBtn.textContent = _mgrT('save');
    return;
  }

  const authUserId = authData.user?.id;
  if (!authUserId) {
    alert(_getLang() === 'en'
      ? 'Error: could not retrieve new account ID.'
      : "Erreur : impossible de récupérer l'identifiant du nouveau compte.");
    saveBtn.disabled = false;
    saveBtn.textContent = _mgrT('save');
    return;
  }

  const { error: dbError } = await sb.from('app_users').insert({
    auth_user_id: authUserId, role, nom, prenom, email,
    telephone: telephone || null, poste: poste || null, actif: true
  });

  if (dbError) {
    const msg = _getLang() === 'en'
      ? `Auth account created (UUID: ${authUserId}) but database error:\n${dbError.message}`
      : `Compte auth créé (UUID: ${authUserId}) mais erreur base de données:\n${dbError.message}`;
    alert(msg);
    saveBtn.disabled = false;
    saveBtn.textContent = _mgrT('save');
    return;
  }

  _closeModal();
  _loadUsers();

  const confirmMsg = authData.session
    ? (_getLang() === 'en'
        ? `User "${prenom} ${nom}" created. They can sign in immediately with the provided password.`
        : `Utilisateur "${prenom} ${nom}" créé. Il peut se connecter immédiatement avec le mot de passe fourni.`)
    : (_getLang() === 'en'
        ? `User "${prenom} ${nom}" created. A confirmation email was sent to ${email}.`
        : `Utilisateur "${prenom} ${nom}" créé. Un email de confirmation a été envoyé à ${email}.`);

  alert(confirmMsg);
}

async function _updateUser(id) {
  const prenom    = document.getElementById('f-prenom').value.trim();
  const nom       = document.getElementById('f-nom').value.trim();
  const telephone = document.getElementById('f-telephone').value.trim();
  const poste     = document.getElementById('f-poste').value.trim();
  const role      = document.getElementById('f-role').value;

  if (!prenom || !nom) { alert(_mgrT('nameRequired')); return; }

  const saveBtn = document.getElementById('modal-save');
  saveBtn.disabled = true;
  saveBtn.textContent = _mgrT('saving');

  const { error } = await sb.from('app_users').update({
    prenom, nom, telephone: telephone || null, poste: poste || null, role
  }).eq('id', id);

  if (error) {
    alert(error.message);
    saveBtn.disabled = false;
    saveBtn.textContent = _mgrT('save');
    return;
  }

  _closeModal();
  _loadUsers();
}

function _closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  const saveBtn = document.getElementById('modal-save');
  saveBtn.disabled = false;
  saveBtn.textContent = _mgrT('save');
}

/* ── Journal d'audit ─────────────────────────────────────── */

let _auditOffset = 0;
const AUDIT_LIMIT = 50;

async function _loadUserFilter() {
  const { data } = await sb.from('app_users').select('auth_user_id, nom, prenom').order('nom');
  const sel = document.getElementById('filter-user');
  sel.innerHTML = `<option value="">${_mgrT('allUsers')}</option>` +
    (data || []).map(u =>
      `<option value="${u.auth_user_id}">${_esc(u.prenom || '')} ${_esc(u.nom || '')}</option>`
    ).join('');
}

async function _loadAuditLog(reset = true) {
  if (reset) {
    _auditOffset = 0;
    document.getElementById('audit-body').innerHTML = '';
  }

  const userFilter   = document.getElementById('filter-user').value;
  const tableFilter  = document.getElementById('filter-table').value;
  const actionFilter = document.getElementById('filter-action').value;

  let query = sb.from('v_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .range(_auditOffset, _auditOffset + AUDIT_LIMIT - 1);

  if (userFilter)   query = query.eq('auth_user_id', userFilter);
  if (tableFilter)  query = query.eq('table_name', tableFilter);
  if (actionFilter) query = query.eq('action', actionFilter);

  const { data, error } = await query;
  const tbody = document.getElementById('audit-body');

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-loading" style="color:red">${_esc(error.message)}</td></tr>`;
    return;
  }

  if (!data.length && reset) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-loading">${_mgrT('noAudit')}</td></tr>`;
    document.getElementById('btn-load-more').classList.add('hidden');
    return;
  }

  const locale = _getLang() === 'en' ? 'en-MU' : 'fr-MU';
  const rows = data.map(a => {
    const date = new Date(a.created_at).toLocaleString(locale, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const userName = a.user_prenom || a.user_nom
      ? `${_esc(a.user_prenom || '')} ${_esc(a.user_nom || '')}`.trim()
      : `<span style="color:var(--text-light)">${_mgrT('unknown')}</span>`;
    const userRole = a.user_role === 'super_admin' ? _mgrT('roleSuper') : _mgrT('roleAdmin');
    return `
      <tr>
        <td style="font-size:.8rem;white-space:nowrap;color:var(--text-light)">${date}</td>
        <td>
          <div style="font-weight:600">${userName}</div>
          <div style="font-size:.75rem;color:var(--text-light)">${userRole}</div>
        </td>
        <td><span class="action-badge action-${a.action.toLowerCase()}">${_actionLabel(a.action)}</span></td>
        <td style="font-size:.85rem">${_tableLabel(a.table_name)}</td>
        <td style="font-size:.82rem;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${_auditSummary(a, locale)}
        </td>
      </tr>`;
  }).join('');

  tbody.innerHTML += rows;
  _auditOffset += data.length;

  const loadMore = document.getElementById('btn-load-more');
  if (data.length < AUDIT_LIMIT) {
    loadMore.classList.add('hidden');
  } else {
    loadMore.classList.remove('hidden');
    loadMore.innerHTML = `<i class="bi bi-chevron-down"></i> ${_mgrT('loadMore')}`;
  }
}

/* ── Page Aide ───────────────────────────────────────────── */

function _renderAide() {
  const wrap = document.getElementById('mgr-aide-content');
  if (!wrap) return;
  const lang = _getLang();
  wrap.innerHTML = lang === 'en' ? _aideEN() : _aideFR();
}

function _aideFR() { return `
<div style="max-width:960px;margin:0 auto;padding:1.5rem 1rem">

  <div style="display:flex;align-items:center;gap:1rem;background:linear-gradient(135deg,var(--teal-dark,#124848),var(--teal-mid,#1b6b6b));color:#fff;border-radius:10px;padding:1.5rem 2rem;margin-bottom:2rem">
    <i class="bi bi-shield-check-fill" style="font-size:2.5rem;opacity:.9"></i>
    <div>
      <h2 style="margin:0;font-size:1.3rem;font-family:Georgia,serif">Guide d'administration</h2>
      <p style="margin:.3rem 0 0;font-size:.88rem;opacity:.85">St Hugh's Manager, Panneau Super Admin</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">

    <!-- CONNEXION -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-shield-lock-fill"></i> Connexion
      </div>
      <p style="font-size:.88rem;margin:0 0 .6rem">Ce panneau est <strong>exclusivement réservé aux Super Admins</strong>. Un compte Admin ordinaire sera rejeté.</p>
      <ul style="font-size:.85rem;padding-left:1.2rem;margin:0;line-height:1.7">
        <li>Email et mot de passe fournis lors de la création du compte</li>
        <li>Si connexion rejetée : vérifiez votre rôle dans la table <code>app_users</code></li>
        <li>Déconnectez-vous toujours sur un ordinateur partagé</li>
      </ul>
    </div>

    <!-- DEUX APPLICATIONS -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-grid-fill"></i> Deux applications séparées
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;font-size:.83rem">
        <div style="background:#f0fafa;border-radius:6px;padding:.6rem .8rem;border-top:3px solid #124848">
          <div style="font-weight:700;margin-bottom:.2rem">St Hugh's Manager</div>
          <div style="color:#374151">:8081, <strong>ce panneau</strong><br>Gestion des accès uniquement</div>
        </div>
        <div style="background:#f8fafc;border-radius:6px;padding:.6rem .8rem;border-top:3px solid #1b6b6b">
          <div style="font-weight:700;margin-bottom:.2rem">St Hugh's Medical</div>
          <div style="color:#374151">:8080, <strong>application principale</strong><br>Gestion médicale des résidents</div>
        </div>
      </div>
      <p style="font-size:.78rem;color:#6b7280;margin:.6rem 0 0">Les deux partagent la même base Supabase et le même compte Super Admin.</p>
    </div>

    <!-- GESTION UTILISATEURS -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem;grid-column:1/-1">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-people-fill"></i> Gestion des utilisateurs
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-bottom:.9rem">
        <div style="background:#f0fdf4;border-radius:6px;padding:.7rem;border-left:3px solid #16a34a">
          <div style="font-weight:700;font-size:.85rem;color:#15803d;margin-bottom:.3rem"><i class="bi bi-person-plus-fill"></i> Créer un compte</div>
          <ol style="font-size:.8rem;padding-left:1rem;margin:0;line-height:1.6">
            <li>Cliquer <strong>Nouvel utilisateur</strong></li>
            <li>Remplir : prénom, nom, email, téléphone, poste</li>
            <li>Choisir le rôle : Admin ou Super Admin</li>
            <li>Définir un mot de passe temporaire (min. 8 caractères)</li>
            <li>Enregistrer : l'utilisateur peut se connecter immédiatement</li>
          </ol>
        </div>
        <div style="background:#fef9f0;border-radius:6px;padding:.7rem;border-left:3px solid #d97706">
          <div style="font-weight:700;font-size:.85rem;color:#b45309;margin-bottom:.3rem"><i class="bi bi-pencil-fill"></i> Modifier un compte</div>
          <ul style="font-size:.8rem;padding-left:1rem;margin:0;line-height:1.6">
            <li>Bouton crayon sur la ligne de l'utilisateur</li>
            <li>Modifiable : prénom, nom, téléphone, poste, <strong>rôle</strong></li>
            <li><strong>Email non modifiable</strong> après création</li>
            <li>Changer Admin → Super Admin élève les droits immédiatement</li>
          </ul>
        </div>
        <div style="background:#fef2f2;border-radius:6px;padding:.7rem;border-left:3px solid #dc2626">
          <div style="font-weight:700;font-size:.85rem;color:#991b1b;margin-bottom:.3rem"><i class="bi bi-pause-circle-fill"></i> Désactiver / Supprimer</div>
          <ul style="font-size:.8rem;padding-left:1rem;margin:0;line-height:1.6">
            <li><strong>Désactiver</strong> (recommandé) : bloque l'accès sans supprimer les données. Réactivable.</li>
            <li><strong>Supprimer</strong> : retire l'entrée de <code>app_users</code> mais le compte Supabase Auth reste. Désactiver suffit dans 99% des cas</li>
          </ul>
        </div>
      </div>
      <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:6px;padding:.6rem .9rem;font-size:.82rem;color:#92400e">
        <i class="bi bi-info-circle-fill" style="color:#d97706"></i> <strong>Rôles :</strong>
        <strong>Admin</strong> = infirmières, personnel soignant, transport : accès médical complet sans gestion des comptes.
        <strong>Super Admin</strong> = direction, responsable informatique : accès total + ce panneau.
      </div>
    </div>

    <!-- JOURNAL D'AUDIT -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem;grid-column:1/-1">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-journal-text"></i> Journal d'activité
      </div>
      <p style="font-size:.88rem;margin:0 0 .75rem">Le journal enregistre automatiquement chaque action effectuée dans l'application : création, modification, suppression de données.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
        <div>
          <div style="font-size:.82rem;font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.4rem">Ce qui est tracé :</div>
          <ul style="font-size:.83rem;padding-left:1.2rem;margin:0;line-height:1.7">
            <li>Résidents (créations, modifications)</li>
            <li>Médecins (ajouts, modifications)</li>
            <li>Traitements (prescriptions, arrêts)</li>
            <li>Consultations (saisies)</li>
            <li>Rendez-vous (créations, modifications)</li>
            <li>Planification des visites</li>
            <li>Comptes utilisateurs (créations, rôles)</li>
          </ul>
        </div>
        <div>
          <div style="font-size:.82rem;font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.4rem">Filtrer le journal :</div>
          <ul style="font-size:.83rem;padding-left:1.2rem;margin:0;line-height:1.7">
            <li><strong>Par utilisateur</strong> : voir les actions d'une personne spécifique</li>
            <li><strong>Par table</strong> : filtrer par type de données</li>
            <li><strong>Par action</strong> : Création / Modification / Suppression</li>
            <li>Cliquer <strong>Filtrer</strong> pour appliquer</li>
            <li><strong>Charger plus</strong> pour voir les 50 suivants (chargement paginé)</li>
          </ul>
        </div>
      </div>
      <div style="background:#f0f9ff;border-radius:6px;padding:.6rem .9rem;font-size:.82rem;color:#075985;margin-top:.75rem">
        <i class="bi bi-lightbulb-fill" style="color:#0284c7"></i> Le journal ne peut pas être effacé depuis l'interface. Il est géré par des triggers PostgreSQL directement dans Supabase.
      </div>
    </div>

    <!-- LANGUE -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-translate"></i> Langue
      </div>
      <p style="font-size:.88rem;margin:0">Les boutons <strong>FR</strong> / <strong>EN</strong> dans la barre du haut changent la langue de ce panneau. Le choix est partagé avec l'application principale St Hugh's Medical.</p>
    </div>

    <!-- INFORMATIONS TECHNIQUES -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-gear-fill"></i> Informations techniques
      </div>
      <ul style="font-size:.83rem;padding-left:1.2rem;margin:0;line-height:1.8">
        <li>Base : Supabase (PostgreSQL + RLS)</li>
        <li>Auth : Supabase Auth (JWT)</li>
        <li>Accès : Super Admin vérifié par <code>fn_is_super_admin()</code></li>
        <li>Session : <code>localStorage: sthughs_manager_v1</code></li>
      </ul>
    </div>

  </div>
</div>`; }

function _aideEN() { return `
<div style="max-width:960px;margin:0 auto;padding:1.5rem 1rem">

  <div style="display:flex;align-items:center;gap:1rem;background:linear-gradient(135deg,var(--teal-dark,#124848),var(--teal-mid,#1b6b6b));color:#fff;border-radius:10px;padding:1.5rem 2rem;margin-bottom:2rem">
    <i class="bi bi-shield-check-fill" style="font-size:2.5rem;opacity:.9"></i>
    <div>
      <h2 style="margin:0;font-size:1.3rem;font-family:Georgia,serif">Administration Guide</h2>
      <p style="margin:.3rem 0 0;font-size:.88rem;opacity:.85">St Hugh's Manager, Super Admin Panel</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">

    <!-- LOGIN -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-shield-lock-fill"></i> Login
      </div>
      <p style="font-size:.88rem;margin:0 0 .6rem">This panel is <strong>exclusively for Super Admins</strong>. A regular Admin account will be rejected.</p>
      <ul style="font-size:.85rem;padding-left:1.2rem;margin:0;line-height:1.7">
        <li>Email and password provided when the account was created</li>
        <li>If login is rejected: check your role in the <code>app_users</code> table</li>
        <li>Always log out on shared computers</li>
      </ul>
    </div>

    <!-- TWO APPS -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-grid-fill"></i> Two separate applications
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;font-size:.83rem">
        <div style="background:#f0fafa;border-radius:6px;padding:.6rem .8rem;border-top:3px solid #124848">
          <div style="font-weight:700;margin-bottom:.2rem">St Hugh's Manager</div>
          <div style="color:#374151">:8081, <strong>this panel</strong><br>Access management only</div>
        </div>
        <div style="background:#f8fafc;border-radius:6px;padding:.6rem .8rem;border-top:3px solid #1b6b6b">
          <div style="font-weight:700;margin-bottom:.2rem">St Hugh's Medical</div>
          <div style="color:#374151">:8080, <strong>main app</strong><br>Resident medical management</div>
        </div>
      </div>
      <p style="font-size:.78rem;color:#6b7280;margin:.6rem 0 0">Both share the same Supabase database and the same Super Admin account.</p>
    </div>

    <!-- USER MANAGEMENT -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem;grid-column:1/-1">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-people-fill"></i> User management
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-bottom:.9rem">
        <div style="background:#f0fdf4;border-radius:6px;padding:.7rem;border-left:3px solid #16a34a">
          <div style="font-weight:700;font-size:.85rem;color:#15803d;margin-bottom:.3rem"><i class="bi bi-person-plus-fill"></i> Create an account</div>
          <ol style="font-size:.8rem;padding-left:1rem;margin:0;line-height:1.6">
            <li>Click <strong>New user</strong></li>
            <li>Fill in: first name, last name, email, phone, position</li>
            <li>Choose role: Admin or Super Admin</li>
            <li>Set a temporary password (min. 8 characters)</li>
            <li>Save: the user can sign in immediately</li>
          </ol>
        </div>
        <div style="background:#fef9f0;border-radius:6px;padding:.7rem;border-left:3px solid #d97706">
          <div style="font-weight:700;font-size:.85rem;color:#b45309;margin-bottom:.3rem"><i class="bi bi-pencil-fill"></i> Edit an account</div>
          <ul style="font-size:.8rem;padding-left:1rem;margin:0;line-height:1.6">
            <li>Click the pencil icon on the user row</li>
            <li>Editable: first name, last name, phone, position, <strong>role</strong></li>
            <li><strong>Email cannot be changed</strong> after creation</li>
            <li>Changing Admin → Super Admin takes effect immediately</li>
          </ul>
        </div>
        <div style="background:#fef2f2;border-radius:6px;padding:.7rem;border-left:3px solid #dc2626">
          <div style="font-weight:700;font-size:.85rem;color:#991b1b;margin-bottom:.3rem"><i class="bi bi-pause-circle-fill"></i> Deactivate / Delete</div>
          <ul style="font-size:.8rem;padding-left:1rem;margin:0;line-height:1.6">
            <li><strong>Deactivate</strong> (recommended): blocks access without deleting data. Can be re-activated.</li>
            <li><strong>Delete</strong>: removes the <code>app_users</code> entry but the Supabase Auth account remains. Deactivating is enough in 99% of cases</li>
          </ul>
        </div>
      </div>
      <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:6px;padding:.6rem .9rem;font-size:.82rem;color:#92400e">
        <i class="bi bi-info-circle-fill" style="color:#d97706"></i> <strong>Roles:</strong>
        <strong>Admin</strong> = nurses, care staff, transport: full medical access without account management.
        <strong>Super Admin</strong> = management, IT: full access + this panel.
      </div>
    </div>

    <!-- AUDIT LOG -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem;grid-column:1/-1">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-journal-text"></i> Activity log
      </div>
      <p style="font-size:.88rem;margin:0 0 .75rem">The log automatically records every action taken in the application: creations, edits and deletions.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
        <div>
          <div style="font-size:.82rem;font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.4rem">What is tracked:</div>
          <ul style="font-size:.83rem;padding-left:1.2rem;margin:0;line-height:1.7">
            <li>Residents (creations, edits)</li>
            <li>Doctors (additions, edits)</li>
            <li>Treatments (prescriptions, stops)</li>
            <li>Consultations (entries)</li>
            <li>Appointments (creations, edits)</li>
            <li>Visit planning</li>
            <li>User accounts (creations, role changes)</li>
          </ul>
        </div>
        <div>
          <div style="font-size:.82rem;font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.4rem">Filtering the log:</div>
          <ul style="font-size:.83rem;padding-left:1.2rem;margin:0;line-height:1.7">
            <li><strong>By user</strong>: see actions by a specific person</li>
            <li><strong>By table</strong>: filter by data type</li>
            <li><strong>By action</strong>: Created / Modified / Deleted</li>
            <li>Click <strong>Filter</strong> to apply</li>
            <li><strong>Load more</strong> for the next 50 entries (paginated)</li>
          </ul>
        </div>
      </div>
      <div style="background:#f0f9ff;border-radius:6px;padding:.6rem .9rem;font-size:.82rem;color:#075985;margin-top:.75rem">
        <i class="bi bi-lightbulb-fill" style="color:#0284c7"></i> The log cannot be cleared from the interface. It is managed by PostgreSQL triggers directly in Supabase.
      </div>
    </div>

    <!-- LANGUAGE -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-translate"></i> Language
      </div>
      <p style="font-size:.88rem;margin:0">The <strong>FR</strong> / <strong>EN</strong> buttons in the top bar switch the language of this panel. The choice is shared with the main St Hugh's Medical application.</p>
    </div>

    <!-- TECHNICAL INFO -->
    <div style="background:var(--card-bg,#fff);border:1px solid var(--card-border,#e5e7eb);border-radius:8px;padding:1.25rem">
      <div style="font-weight:700;color:var(--teal-dark,#124848);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem">
        <i class="bi bi-gear-fill"></i> Technical information
      </div>
      <ul style="font-size:.83rem;padding-left:1.2rem;margin:0;line-height:1.8">
        <li>Database: Supabase (PostgreSQL + RLS)</li>
        <li>Auth: Supabase Auth (JWT)</li>
        <li>Access: Super Admin verified by <code>fn_is_super_admin()</code></li>
        <li>Session: <code>localStorage: sthughs_manager_v1</code></li>
      </ul>
    </div>

  </div>
</div>`; }

/* ── Helpers ─────────────────────────────────────────────── */

function _initials(nom, prenom) {
  return ((prenom || '')[0] || '').toUpperCase() + ((nom || '')[0] || '').toUpperCase() || '?';
}

function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _actionLabel(action) {
  const map = { INSERT: 'actionCreate', UPDATE: 'actionUpdate', DELETE: 'actionDelete' };
  return _mgrT(map[action] || action);
}

function _tableLabel(tbl) {
  const map = {
    residents: 'tableResidents', doctors: 'tableDoctors',
    traitements: 'tableTreatments', consultations: 'tableConsultations',
    rendez_vous: 'tableRdv', planning_visites: 'tablePlanning', app_users: 'tableUsers'
  };
  return _mgrT(map[tbl] || tbl);
}

function _auditSummary(a, locale) {
  try {
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
    if (row.numero_chambre)      parts.push(`${_getLang()==='en'?'Rm.':'Ch.'} ${row.numero_chambre}`);
    return _esc(parts.slice(0, 3).join(' — ')) || '—';
  } catch { return '—'; }
}
