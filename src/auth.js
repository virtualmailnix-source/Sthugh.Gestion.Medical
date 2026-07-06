import { db }             from './supabase.js';
import { setState, getState } from './store.js';

export async function initAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return null;
  return _loadAppUser(session.user.id);
}

export async function login(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(
      error.message.toLowerCase().includes('credentials')
        ? 'Identifiants incorrects. Veuillez réessayer.'
        : error.message
    );
  }
  const user = await _loadAppUser(data.user.id);
  if (!user) throw new Error('Accès refusé. Ce compte n\'est pas autorisé dans le système.');
  return user;
}

export async function logout() {
  await db.auth.signOut();
  setState({ currentUser: null, userRole: null });
}

async function _loadAppUser(authUserId) {
  const [appRes, authRes] = await Promise.all([
    db.from('app_users').select('id,role,nom,prenom,photo_url').eq('auth_user_id', authUserId).eq('actif', true).single(),
    db.auth.getUser(),
  ]);
  const data = appRes.data;
  if (!data) return null;
  const userData = { ...data, email: authRes.data?.user?.email || '' };
  setState({ currentUser: userData, userRole: data.role });
  return userData;
}

export function isSuperAdmin() {
  return getState().userRole === 'super_admin';
}

export function isReceptionist() {
  return getState().userRole === 'receptionniste';
}

// Staff médical = super_admin + admin (accès au volet médical)
export function isMedicalStaff() {
  return ['super_admin', 'admin'].includes(getState().userRole);
}

export function currentUserInfo() {
  return getState().currentUser;
}
