export const SUPABASE_URL = 'https://wfngkkrnzoponrajgdqk.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_QnWfvohGoWFPTgOr5eEhaQ_l8qWIbEv';

export const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, storageKey: 'sthughs_medical_v1' }
});
