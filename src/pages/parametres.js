import { db }   from '../supabase.js';
import { toastSuccess, toastError } from '../toast.js';
import { escapeHtml } from '../utils.js';

export async function renderParametres(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Paramètres</h2>
        <span class="sub">Configuration de St Hugh's Anglican Home</span>
      </div>
    </div>
    <div style="max-width:720px;margin:0 auto">
      <div class="skeleton skeleton-card" style="margin-bottom:1rem"></div>
    </div>`;

  const { data } = await db.from('cabinet').select('*').limit(1).maybeSingle();
  const c = data || {};

  document.querySelector('[style*="max-width"]').innerHTML = `
    <form id="form-params">
      <div class="card" style="margin-bottom:1.5rem">
        <div class="card-header"><div class="card-title"><i class="bi bi-building-fill"></i> St Hugh's Anglican Home</div></div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Nom de l'établissement</label>
            <input class="form-control" name="nom" value="${escapeHtml(c.nom||'St Hugh\'s Anglican Home')}">
          </div>
          <div class="form-group">
            <label class="form-label">Adresse</label>
            <textarea class="form-control" name="adresse" rows="2">${escapeHtml(c.adresse||'')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Téléphone</label>
              <input class="form-control" name="telephone" value="${escapeHtml(c.telephone||'')}">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-control" type="email" name="email" value="${escapeHtml(c.email||'')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Responsable médical</label>
              <input class="form-control" name="responsable_medical" value="${escapeHtml(c.responsable_medical||'')}">
            </div>
            <div class="form-group">
              <label class="form-label">Jours de visites médicales</label>
              <input class="form-control" name="jours_visites" placeholder="Mardi, Vendredi" value="${escapeHtml(c.jours_visites||'Mardi, Vendredi')}">
              <div class="form-hint">Jours où les médecins viennent au cabinet</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:1.5rem">
        <div class="card-header"><div class="card-title"><i class="bi bi-file-earmark-medical-fill"></i> En-tête ordonnance</div></div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">En-tête</label>
            <textarea class="form-control" name="entete_ordonnance" id="entete-inp" rows="4">${escapeHtml(c.entete_ordonnance||'')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Pied de page</label>
            <textarea class="form-control" name="pied_ordonnance" rows="2">${escapeHtml(c.pied_ordonnance||'')}</textarea>
          </div>
          <div style="background:var(--bg-alt);border-radius:var(--radius);padding:1rem;border-left:3px solid var(--gold)">
            <div style="font-size:.78rem;font-weight:700;color:var(--teal-dark);margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.5px">
              <i class="bi bi-eye"></i> Aperçu
            </div>
            <div id="entete-prev" style="font-size:.88rem;white-space:pre-line">${escapeHtml(c.entete_ordonnance||'—')}</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:1.5rem">
        <div class="card-header"><div class="card-title"><i class="bi bi-palette-fill"></i> Apparence</div></div>
        <div class="card-body">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:.75rem;background:var(--bg-alt);border-radius:var(--radius)">
            <div>
              <div style="font-weight:600;font-size:.92rem">Mode sombre</div>
              <div style="font-size:.8rem;color:var(--text-light)">Basculer entre thème clair et sombre</div>
            </div>
            <div class="toggle ${document.documentElement.getAttribute('data-theme')==='dark'?'on':''}" id="theme-toggle-p"></div>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end">
        <button type="submit" class="btn btn-primary btn-lg">
          <i class="bi bi-check2-circle"></i> Sauvegarder les paramètres
        </button>
      </div>
    </form>`;

  document.getElementById('entete-inp')?.addEventListener('input', e => {
    const p=document.getElementById('entete-prev');
    if(p) p.textContent=e.target.value||'—';
  });

  const tog=document.getElementById('theme-toggle-p');
  tog?.addEventListener('click', () => {
    tog.classList.toggle('on');
    const dark=tog.classList.contains('on');
    document.documentElement.setAttribute('data-theme',dark?'dark':'light');
    localStorage.setItem('theme',dark?'dark':'light');
    const icon=document.getElementById('theme-icon');
    const lbl =document.getElementById('theme-label');
    if(icon) icon.className=dark?'bi bi-sun-fill':'bi bi-moon-fill';
    if(lbl)  lbl.textContent=dark?'Mode clair':'Mode sombre';
  });

  document.getElementById('form-params')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd=new FormData(e.target);
    const data=Object.fromEntries([...fd.entries()].filter(([,v])=>v!==''));
    let res;
    if (c.id) res=await db.from('cabinet').update(data).eq('id',c.id);
    else       res=await db.from('cabinet').insert(data);
    if(res.error){toastError(res.error.message);return;}
    toastSuccess('Paramètres sauvegardés');
  });
}
