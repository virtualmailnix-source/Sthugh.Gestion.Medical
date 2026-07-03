// scenes-2.jsx — Actions médicales, Visites & Courses, Sorties & Décès, Anniversaires & Alertes
// globals from scenes-core + engine

function Badge({label, bg, fg, icon}) {
  return (
    <div style={{display:'inline-flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:999,
      background:bg, color:fg, fontFamily:F.disp, fontWeight:800, fontSize:16, whiteSpace:'nowrap'}}>
      {icon && <Icon name={icon} size={14} color={fg}/>}{label}
    </div>
  );
}

// ════════ SCENE: ACTIONS MÉDICALES (40–51, cream) ════════
function SceneActions() {
  const cards = [
    ['journal-plus','Consultation','Taille pré-remplie · joignez l\u2019ordonnance (PDF/JPG, 5 Mo)', 41.0],
    ['capsule-pill','Traitement','Alerte automatique 24 h avant la fin du traitement', 42.0],
    ['calendar-plus-fill','Rendez-vous','Cochez « Urgence » → le RDV s\u2019affiche en rouge', 43.0],
  ];
  return (
    <Scene start={40} end={51} bg={C.cream}>
      <CreamBg/>
      <Eyebrow text="04 · Consultations · Traitements · RDV" x={90} y={150} start={40.3} end={51}/>
      <Reveal start={40.6} end={51} x={90} y={188} dur={0.6}>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:50, color:C.ink, letterSpacing:'-0.02em', width:600, lineHeight:1.05}}>Le geste médical au quotidien</div>
      </Reveal>
      {cards.map(([ic,title,desc,st],i)=>(
        <Reveal key={i} start={st} end={51} x={90} y={296+i*106} dur={0.5} dy={16}>
          <div style={{display:'flex', alignItems:'center', gap:18, width:600, padding:'18px 22px',
            background:C.card, border:`1px solid ${C.line}`, borderRadius:18,
            boxShadow:'0 12px 30px -18px rgba(14,53,49,0.32)'}}>
            <div style={{width:56, height:56, borderRadius:15, background:C.teal, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center'}}><Icon name={ic} size={26} color={C.creamHi}/></div>
            <div>
              <div style={{fontFamily:F.disp, fontWeight:800, fontSize:23, color:C.ink}}>{title}</div>
              <div style={{fontFamily:F.body, fontSize:17.5, color:C.mid, fontWeight:600, marginTop:2, width:480}}>{desc}</div>
            </div>
          </div>
        </Reveal>
      ))}
      <Illo src={ILLO('12-consultations')} x={740} y={210} w={456} h={372} start={40.6} end={51}/>
    </Scene>
  );
}

// ════════ SCENE: VISITES & COURSES (51–63, cream) ════════
function FlowChips({chips, x, y, baseStart, end}) {
  return (
    <div style={{position:'absolute', left:x, top:y, display:'flex', alignItems:'center', gap:9}}>
      {chips.map((c,i)=>(
        <React.Fragment key={i}>
          <Pop start={baseStart+i*0.5} end={end} x={0} y={0} dur={0.45} style={{position:'relative'}}>
            <Badge label={c.label} bg={c.bg} fg={c.fg}/>
          </Pop>
          {i<chips.length-1 && (
            <Reveal start={baseStart+i*0.5+0.25} end={end} x={0} y={0} dur={0.35} style={{position:'relative'}}>
              <Icon name="arrow-right-short" size={26} color={C.faint}/>
            </Reveal>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
function Panel({x, y, w, h, start, end, children}) {
  return (
    <Reveal start={start} end={end} x={x} y={y} dur={0.6} dy={18}>
      <div style={{width:w, height:h, background:C.card, border:`1px solid ${C.line}`, borderRadius:22,
        boxShadow:'0 20px 50px -26px rgba(14,53,49,0.4)', overflow:'hidden'}}>{children}</div>
    </Reveal>
  );
}
function PanelHead({illo, ic, title, sub}) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:16, padding:'18px 22px', borderBottom:`1px solid ${C.line}`}}>
      <div style={{width:64, height:64, borderRadius:16, overflow:'hidden', flexShrink:0, border:`1px solid ${C.line}`}}>
        <img src={illo} alt="" style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}}/>
      </div>
      <div>
        <div style={{display:'flex', alignItems:'center', gap:9}}>
          <Icon name={ic} size={20}/><span style={{fontFamily:F.disp, fontWeight:800, fontSize:24, color:C.ink}}>{title}</span>
        </div>
        <div style={{fontFamily:F.body, fontSize:16, color:C.mid, fontWeight:600, marginTop:1}}>{sub}</div>
      </div>
    </div>
  );
}
function SceneVisitesCourses() {
  return (
    <Scene start={51} end={63} bg={C.cream}>
      <CreamBg/>
      <Eyebrow text="05 · Visites & Courses" x={90} y={146} start={51.3} end={63}/>
      <Reveal start={51.6} end={63} x={90} y={184} dur={0.6}>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:50, color:C.ink, letterSpacing:'-0.02em'}}>Qui entre, qui sort — tracé</div>
      </Reveal>
      {/* Visites panel */}
      <Panel x={80} y={300} w={540} h={300} start={51.8} end={63}>
        <PanelHead illo={ILLO('08-visites-familles')} ic="person-walking" title="Visites" sub="Familles & proches — badge du jour"/>
        <div style={{padding:'22px'}}>
          <div style={{fontFamily:F.body, fontSize:18, color:C.ink, fontWeight:600, marginBottom:18, lineHeight:1.4}}>
            Visiteur, résident, nombre de personnes — un seul numéro suffit.</div>
        </div>
      </Panel>
      <FlowChips x={102} y={520} baseStart={53.2} end={63} chips={[
        {label:'Planifiée', bg:'#dbeafe', fg:'#1d4ed8'},
        {label:'En cours', bg:'#dcfce7', fg:'#166534'},
        {label:'Terminée', bg:'rgba(184,150,62,0.18)', fg:'#8a6d1f'},
      ]}/>
      {/* Courses panel */}
      <Panel x={660} y={300} w={540} h={300} start={52.2} end={63}>
        <PanelHead illo={ILLO('04-courses-commissions')} ic="bag-fill" title="Courses" sub="Résidents autonomes uniquement"/>
        <div style={{padding:'22px'}}>
          <div style={{fontFamily:F.body, fontSize:18, color:C.ink, fontWeight:600, marginBottom:18, lineHeight:1.4}}>
            Sortie commissions : heure de départ, articles, puis retour.</div>
        </div>
      </Panel>
      <FlowChips x={682} y={520} baseStart={54.4} end={63} chips={[
        {label:'Planifiée', bg:'#dbeafe', fg:'#1d4ed8'},
        {label:'Dehors', bg:'#fef3c7', fg:'#92400e'},
        {label:'Rentré(e)', bg:'#dcfce7', fg:'#15803d'},
      ]}/>
      <Reveal start={57} end={63} y={636} dur={0.5} center>
        <div style={{display:'inline-flex', alignItems:'center', gap:10,
          fontFamily:F.body, fontSize:18, color:C.mid, fontWeight:700}}>
          <Icon name="clock-history" size={18} color={C.gold}/> Tout l'historique reste dans le dossier du résident
        </div>
      </Reveal>
    </Scene>
  );
}

// ════════ SCENE: SORTIES & DÉCÈS (63–74, cream) ════════
function SceneSorties() {
  const cards = [
    {ic:'luggage-fill', glyph:false, title:'Vacances', sub:'Sortie temporaire', accent:C.blue, tint:'rgba(37,99,235,0.07)',
     desc:'Reste actif, badge « En vacances ». Bouton Retour au foyer.', role:'Tous les rôles', roleC:C.teal, st:64.4},
    {ic:'door-open-fill', glyph:false, title:'Départ définitif', sub:'La famille reprend', accent:C.gray, tint:'rgba(107,114,128,0.08)',
     desc:'Passe en archivé — visible dans le filtre « Partis ».', role:'Super Admin', roleC:C.red, st:65.0},
    {ic:null, glyph:'✝', title:'Décès', sub:'Données conservées', accent:C.red, tint:'rgba(179,38,30,0.06)',
     desc:'Archivé dans « Décédés ». Cause facultative.', role:'Super Admin', roleC:C.red, st:65.6},
  ];
  return (
    <Scene start={63} end={74} bg={C.cream}>
      <CreamBg/>
      <Eyebrow text="06 · Sorties & Décès" x={90} y={146} start={63.3} end={74}/>
      <Reveal start={63.6} end={74} x={90} y={184} dur={0.6}>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:50, color:C.ink, letterSpacing:'-0.02em'}}>Trois façons de quitter le foyer</div>
      </Reveal>
      {cards.map((c,i)=>(
        <Reveal key={i} start={c.st} end={74} x={80+i*375} y={288} dur={0.55} dy={22}>
          <div style={{width:350, height:300, background:C.card, borderRadius:22, overflow:'hidden',
            border:`1px solid ${C.line}`, boxShadow:'0 20px 50px -26px rgba(14,53,49,0.4)'}}>
            <div style={{height:6, background:c.accent}}/>
            <div style={{padding:'24px 24px 0'}}>
              <div style={{width:60, height:60, borderRadius:16, background:c.tint, display:'flex',
                alignItems:'center', justifyContent:'center', marginBottom:16}}>
                {c.glyph ? <span style={{fontSize:32, color:c.accent, lineHeight:1}}>{c.glyph}</span>
                         : <Icon name={c.ic} size={30} color={c.accent}/>}
              </div>
              <div style={{fontFamily:F.disp, fontWeight:800, fontSize:26, color:C.ink}}>{c.title}</div>
              <div style={{fontFamily:F.body, fontSize:16, color:c.accent, fontWeight:800, marginTop:1}}>{c.sub}</div>
              <div style={{fontFamily:F.body, fontSize:17, color:C.mid, fontWeight:600, marginTop:12, lineHeight:1.4}}>{c.desc}</div>
              <div style={{marginTop:16, display:'inline-flex', alignItems:'center', gap:7, padding:'6px 12px', whiteSpace:'nowrap',
                borderRadius:999, background:'rgba(0,0,0,0.04)', fontFamily:F.disp, fontWeight:800, fontSize:14, color:c.roleC}}>
                <Icon name={c.role==='Super Admin'?'person-lock':'people-fill'} size={13} color={c.roleC}/>{c.role}
              </div>
            </div>
          </div>
        </Reveal>
      ))}
      <Reveal start={68.5} end={74} y={624} dur={0.5} center>
        <div style={{display:'inline-flex', alignItems:'center', gap:10, padding:'12px 22px', whiteSpace:'nowrap',
          background:'rgba(31,92,82,0.08)', borderRadius:14, fontFamily:F.body, fontSize:18, color:C.ink, fontWeight:700}}>
          <Icon name="lock-fill" size={18} color={C.teal}/> Profil archivé = dossier en lecture seule
        </div>
      </Reveal>
    </Scene>
  );
}

// ════════ SCENE: ANNIVERSAIRES & ALERTES (74–84, cream) ════════
function SceneAnnivAlertes() {
  const anniv = [
    {label:'Aujourd\u2019hui', bg:C.gold, fg:'#fff', desc:'carte dorée + badge menu', st:75.0},
    {label:'Demain', bg:'#fde9c8', fg:'#92400e', desc:'préavis 24 h', st:75.6},
    {label:'Dans X jours', bg:C.beige, fg:C.mid, desc:'à venir cette semaine', st:76.2},
  ];
  const alerts = [
    {label:'Médicament < 24h', bg:'#fde0de', fg:C.red, ic:'capsule', st:76.6},
    {label:'Médicament < 3j', bg:'#fef0d4', fg:'#b45309', ic:'capsule', st:77.1},
    {label:'Non vu 30j +', bg:'#fef0d4', fg:'#b45309', ic:'eye-slash-fill', st:77.6},
    {label:'Anniversaire', bg:'rgba(184,150,62,0.18)', fg:'#8a6d1f', ic:'balloon-heart-fill', st:78.1},
    {label:'Urgence', bg:'#fde0de', fg:C.red, ic:'exclamation-triangle-fill', st:78.6},
  ];
  return (
    <Scene start={74} end={84} bg={C.cream}>
      <CreamBg/>
      <Eyebrow text="07 · Anniversaires & Alertes" x={90} y={142} start={74.3} end={84}/>
      <Reveal start={74.6} end={84} x={90} y={180} dur={0.6}>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:50, color:C.ink, letterSpacing:'-0.02em'}}>Rien ne vous échappe</div>
      </Reveal>
      {/* Anniversaires panel */}
      <Panel x={80} y={290} w={540} h={320} start={74.8} end={84}>
        <PanelHead illo={ILLO('06-anniversaires')} ic="balloon-heart-fill" title="Anniversaires" sub="Classés par urgence"/>
        <div style={{padding:'18px 22px', display:'flex', flexDirection:'column', gap:13}}>
          {anniv.map((a,i)=>(
            <Reveal key={i} start={a.st} end={84} x={0} y={0} dur={0.4} dy={8} style={{position:'relative'}}>
              <div style={{display:'flex', alignItems:'center', gap:14}}>
                <Badge label={a.label} bg={a.bg} fg={a.fg}/>
                <span style={{fontFamily:F.body, fontSize:17, color:C.mid, fontWeight:600}}>{a.desc}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Panel>
      {/* Alertes panel */}
      <Panel x={660} y={290} w={540} h={320} start={75.2} end={84}>
        <PanelHead illo={ILLO('05-alertes-medicaments')} ic="bell-fill" title="Alertes" sub="Générer chaque matin · maj 60 s"/>
        <div style={{padding:'16px 22px', display:'flex', flexWrap:'wrap', gap:10}}>
          {alerts.map((a,i)=>(
            <Pop key={i} start={a.st} end={84} x={0} y={0} dur={0.4} style={{position:'relative'}}>
              <Badge label={a.label} bg={a.bg} fg={a.fg} icon={a.ic}/>
            </Pop>
          ))}
        </div>
      </Panel>
    </Scene>
  );
}

Object.assign(window, { Badge, SceneActions, SceneVisitesCourses, SceneSorties, SceneAnnivAlertes });
