import { currentUserInfo, logout } from '../auth.js';
import { db }                      from '../supabase.js';
import { setState }                from '../store.js';
import { t }                       from '../i18n.js';
import { initials }                from '../utils.js';
import { toastSuccess, toastError } from '../toast.js';
import { resolvePhotos, uploadPhoto, removePhoto } from '../storage.js';
import { syncTopbarAvatar }        from '../../script.js';

export async function renderMonProfil(container) {
  const u = currentUserInfo();
  if (!u) { container.innerHTML = ''; return; }

  const roleLabel = u.role === 'super_admin' ? t('ui.superAdminFull')
    : u.role === 'receptionniste' ? t('ui.receptionistFull')
    : t('ui.adminFull');
  const roleCls   = u.role === 'super_admin' ? 'role-super' : 'role-admin';
  const ini       = initials(u.nom, u.prenom);

  // Photo de profil : chemin en base -> URL signée (bucket privé)
  const me = { photo_url: u.photo_url || null };
  await resolvePhotos(me);

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
          font-size:1.8rem;font-weight:700;margin:0 auto 1rem;position:relative;overflow:hidden">
          ${ini}
          ${me.photo_url ? `<img src="${me.photo_url}" alt="" onerror="this.remove()" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : ''}
        </div>
        <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-bottom:1rem">
          <label class="btn btn-secondary btn-sm" style="cursor:pointer">
            <i class="bi bi-camera-fill"></i> ${me._photo_path ? t('monprofil.photoChange') : t('monprofil.photoAdd')}
            <input type="file" id="profil-photo-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          </label>
          ${me._photo_path ? `<button type="button" id="btn-rm-avatar" class="btn btn-secondary btn-sm" style="color:#dc2626;border-color:#dc2626"><i class="bi bi-trash3-fill"></i> ${t('monprofil.photoRemove')}</button>` : ''}
        </div>
        <div style="font-size:.75rem;color:var(--text-light);margin-bottom:1rem">${t('monprofil.photoNote')}</div>
        <div style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin-bottom:.35rem">
          ${(u.prenom || '')} ${(u.nom || '')}
        </div>
        <span class="topbar-role-badge ${roleCls}" style="font-size:.85rem;padding:.3rem .8rem">${roleLabel}</span>
      </div>

      <div class="card" style="padding:0;margin-bottom:1.5rem;overflow:hidden">
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

      <button id="btn-profile-logout" class="btn btn-danger" style="width:100%;padding:.75rem">
        <i class="bi bi-box-arrow-right"></i> ${t('monprofil.logout')}
      </button>
    </div>`;

  document.getElementById('profil-photo-input')?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toastError(t('monprofil.photoTooLarge')); e.target.value = ''; return; }
    await _updatePhoto(container, u, file, u.photo_url || null);
  });

  document.getElementById('btn-rm-avatar')?.addEventListener('click', async () => {
    await _updatePhoto(container, u, null, u.photo_url || null);
  });

  document.getElementById('btn-profile-logout').addEventListener('click', async () => {
    // Journaliser avant signOut : la session est encore valide
    try { await db.rpc('fn_log_evenement', { p_action: 'LOGOUT', p_details: {} }); } catch (_) {}
    await logout();
    location.reload();
  });
}

// Envoi ou retrait de SA photo : upload dans users/ puis fn_update_my_photo
// (la RLS d'app_users reste réservée au super admin, la RPC ne touche que
// photo_url de sa propre ligne). L'ancien fichier est retiré du bucket.
async function _updatePhoto(container, u, file, oldPath) {
  let newPath = null;
  try {
    if (file) newPath = await uploadPhoto(file, 'users');
  } catch (err) {
    toastError(t('monprofil.photoErr') + ' - ' + err.message);
    return;
  }

  const { error } = await db.rpc('fn_update_my_photo', { p_path: newPath });
  if (error) {
    toastError(t('monprofil.photoErr') + ' - ' + error.message);
    if (newPath) removePhoto(newPath);   // ne pas laisser un fichier orphelin
    return;
  }

  if (oldPath && oldPath !== newPath) removePhoto(oldPath);
  setState({ currentUser: { ...u, photo_url: newPath } });
  toastSuccess(file ? t('monprofil.photoSaved') : t('monprofil.photoRemoved'));
  syncTopbarAvatar();
  renderMonProfil(container);
}
