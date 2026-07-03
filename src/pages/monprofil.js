import { currentUserInfo, logout } from '../auth.js';
import { db }                     from '../supabase.js';
import { t, getLang }             from '../i18n.js';
import { initials }               from '../utils.js';

export function renderMonProfil(container) {
  const u = currentUserInfo();
  if (!u) { container.innerHTML = ''; return; }

  const roleLabel = u.role === 'super_admin' ? t('ui.superAdminFull')
    : u.role === 'receptionniste' ? t('ui.receptionistFull')
    : t('ui.adminFull');
  const roleCls   = u.role === 'super_admin' ? 'role-super' : 'role-admin';
  const ini       = initials(u.nom, u.prenom);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>${t('monprofil.title')}</h2>
        <span class="sub">${t('monprofil.subtitle')}</span>
      </div>
    </div>

    <div style="max-width:480px;margin:0 auto">
      <div class="card" style="padding:2rem;text-align:center;margin-bottom:1.25rem">
        <div style="width:80px;height:80px;border-radius:50%;background:var(--teal-mid);
          color:#fff;display:flex;align-items:center;justify-content:center;
          font-size:1.8rem;font-weight:700;margin:0 auto 1rem">
          ${ini}
        </div>
        <div style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin-bottom:.35rem">
          ${(u.prenom || '')} ${(u.nom || '')}
        </div>
        <span class="topbar-role-badge ${roleCls}" style="font-size:.85rem;padding:.3rem .8rem">${roleLabel}</span>
      </div>

      <div class="card" style="padding:0;margin-bottom:1.25rem;overflow:hidden">
        <div style="padding:.85rem 1.25rem;border-bottom:1px solid var(--card-border);display:flex;align-items:center;gap:1rem">
          <i class="bi bi-person-fill" style="font-size:1.1rem;color:var(--teal-mid);width:20px;text-align:center"></i>
          <div>
            <div style="font-size:.75rem;color:var(--text-light);margin-bottom:.1rem">${t('monprofil.labelNom')}</div>
            <div style="font-weight:600">${(u.prenom || '')} ${(u.nom || '')}</div>
          </div>
        </div>
        <div style="padding:.85rem 1.25rem;border-bottom:1px solid var(--card-border);display:flex;align-items:center;gap:1rem">
          <i class="bi bi-envelope-fill" style="font-size:1.1rem;color:var(--teal-mid);width:20px;text-align:center"></i>
          <div>
            <div style="font-size:.75rem;color:var(--text-light);margin-bottom:.1rem">${t('monprofil.labelEmail')}</div>
            <div style="font-weight:600">${u.email || '—'}</div>
          </div>
        </div>
        <div style="padding:.85rem 1.25rem;display:flex;align-items:center;gap:1rem">
          <i class="bi bi-shield-fill" style="font-size:1.1rem;color:var(--teal-mid);width:20px;text-align:center"></i>
          <div>
            <div style="font-size:.75rem;color:var(--text-light);margin-bottom:.1rem">${t('monprofil.labelRole')}</div>
            <div style="font-weight:600">${roleLabel}</div>
          </div>
        </div>
      </div>

      <div style="background:var(--tint-amber-bg);border:1px solid var(--tint-amber-border);border-radius:var(--radius-sm);
        padding:.65rem 1rem;margin-bottom:1.5rem;font-size:.82rem;color:var(--tint-amber-fg);display:flex;gap:.5rem">
        <i class="bi bi-info-circle-fill" style="color:#d97706;flex-shrink:0;margin-top:.05rem"></i>
        <span>${t('monprofil.readOnly')}</span>
      </div>

      <button id="btn-profile-logout" class="btn btn-danger" style="width:100%;padding:.75rem">
        <i class="bi bi-box-arrow-right"></i> ${t('monprofil.logout')}
      </button>
    </div>`;

  document.getElementById('btn-profile-logout').addEventListener('click', async () => {
    // Journaliser avant signOut : la session est encore valide
    try { await db.rpc('fn_log_evenement', { p_action: 'LOGOUT', p_details: {} }); } catch (_) {}
    await logout();
    location.reload();
  });
}
