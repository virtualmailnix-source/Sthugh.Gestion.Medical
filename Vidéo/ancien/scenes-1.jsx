// scenes-1.jsx — Intro, Connexion, Navigation, Dossier
// globals: C,F,ILLO,Icon,Reveal,Pop,Illo,Scene,CreamBg,TealBg,Eyebrow + animation engine

// ════════ SCENE: INTRO (0–8, teal) ════════
function SceneIntro() {
  return (
    <Scene start={0} end={8} bg={C.tealDeep}>
      <TealBg/>
      {/* brand mark */}
      <Pop start={0.4} end={8} y={188} dur={0.7} center>
        <div style={{width:96, height:96, borderRadius:28, background:'rgba(216,189,118,0.14)',
          border:'1px solid rgba(216,189,118,0.3)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Icon name="heart-pulse-fill" size={50} color={C.goldHi}/>
        </div>
      </Pop>
      <Reveal start={1.1} end={8} y={312} dur={0.6} center>
        <div style={{fontFamily:F.disp, fontWeight:700, fontSize:17, letterSpacing:'0.34em',
          textTransform:'uppercase', color:C.goldSoft}}>St Hugh's Anglican Home</div>
      </Reveal>
      <Reveal start={1.5} end={8} y={350} dur={0.7} center>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:62, color:C.creamHi,
          letterSpacing:'-0.02em', lineHeight:1.04, whiteSpace:'nowrap'}}>Système de Gestion Médicale</div>
      </Reveal>
      <Reveal start={2.2} end={8} y={446} dur={0.6} center>
        <div style={{display:'inline-block', width:130, height:3, background:C.gold, borderRadius:2}}/>
      </Reveal>
      <Reveal start={2.6} end={8} y={480} dur={0.6} center>
        <div style={{fontFamily:F.body, fontWeight:500, fontSize:25, color:'rgba(245,242,232,0.82)'}}>Le guide essentiel — en deux minutes</div>
      </Reveal>
    </Scene>
  );
}

// ════════ SCENE: CONNEXION (8–16, cream) ════════
function SceneConnexion() {
  return (
    <Scene start={8} end={16} bg={C.cream}>
      <CreamBg/>
      <Eyebrow text="01 · Connexion" x={90} y={150} start={8.3} end={16}/>
      <Reveal start={8.6} end={16} x={90} y={188} dur={0.6}>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:58, color:C.ink, letterSpacing:'-0.02em'}}>Connectez-vous</div>
      </Reveal>
      <Reveal start={9.2} end={16} x={92} y={296} dur={0.55}>
        <div style={{display:'flex', alignItems:'center', gap:14, width:520}}>
          <div style={{width:42, height:42, borderRadius:12, background:'rgba(31,92,82,0.1)', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center'}}><Icon name="envelope-fill" size={20}/></div>
          <div style={{fontFamily:F.body, fontSize:22, color:C.ink, lineHeight:1.35}}>
            <b style={{fontWeight:800}}>Email</b> et <b style={{fontWeight:800}}>mot de passe</b> fournis par votre administrateur.</div>
        </div>
      </Reveal>
      <Reveal start={9.9} end={16} x={92} y={372} dur={0.55}>
        <div style={{display:'flex', alignItems:'center', gap:14, width:520}}>
          <div style={{width:42, height:42, borderRadius:12, background:'rgba(31,92,82,0.1)', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center'}}><Icon name="arrow-repeat" size={20}/></div>
          <div style={{fontFamily:F.body, fontSize:22, color:C.ink, lineHeight:1.35}}>
            Votre session reste active après fermeture de l'onglet.</div>
        </div>
      </Reveal>
      <Reveal start={10.8} end={16} x={90} y={452} dur={0.55}>
        <div style={{display:'flex', alignItems:'flex-start', gap:13, width:540, padding:'16px 20px',
          background:'rgba(184,150,62,0.1)', border:`1px solid rgba(184,150,62,0.3)`, borderRadius:16}}>
          <Icon name="shield-lock-fill" size={22} color={C.gold} style={{marginTop:2}}/>
          <div style={{fontFamily:F.body, fontSize:20, color:C.ink, lineHeight:1.4, fontWeight:600}}>
            Déconnectez-vous toujours sur un poste partagé.</div>
        </div>
      </Reveal>
      <Illo src={ILLO('01-connexion')} x={748} y={150} w={448} h={430} start={8.5} end={16}/>
    </Scene>
  );
}

// ════════ SCENE: NAVIGATION (16–29, cream) ════════
const NAV_ITEMS = [
  ['grid-1x2-fill','Tableau de bord'], ['people-fill','Résidents'], ['person-badge-fill','Médecins'],
  ['capsule-pill','Traitements'], ['journal-medical','Consultations'], ['calendar3','Rendez-vous'],
  ['list-ol','Planification'], ['person-walking','Visites'], ['box-arrow-right','Sorties & Décès'],
  ['bag-fill','Courses'], ['balloon-heart-fill','Anniversaires'], ['bell-fill','Alertes'],
  ['bar-chart-fill','Statistiques'], ['person-circle','Mon profil'],
];
function SceneNavigation() {
  const sx=78, sy=96, sw=406, rowH=33, listTop=sy+74;
  return (
    <Scene start={16} end={29} bg={C.cream}>
      <CreamBg/>
      {/* sidebar panel */}
      <Reveal start={16.2} end={29} x={sx} y={sy} dur={0.6} dy={0} origin="left center">
        <div style={{width:sw, height:548, borderRadius:24, overflow:'hidden',
          background:`linear-gradient(180deg, ${C.tealMid}, ${C.tealDeep})`,
          boxShadow:'0 30px 70px -24px rgba(14,53,49,0.5)', border:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex', alignItems:'center', gap:11, padding:'20px 22px 16px'}}>
            <Icon name="list" size={22} color={C.goldHi}/>
            <span style={{fontFamily:F.disp, fontWeight:800, fontSize:19, color:C.creamHi, letterSpacing:'-0.01em'}}>St Hugh's</span>
          </div>
          <div style={{height:1, background:'rgba(255,255,255,0.08)', margin:'0 18px'}}/>
        </div>
      </Reveal>
      {/* nav rows revealing */}
      {NAV_ITEMS.map(([ic,label],i)=>{
        const start = 16.8 + i*0.36;
        const active = i===0;
        return (
          <Reveal key={i} start={start} end={29} x={sx+14} y={listTop+i*rowH} dur={0.4} dy={6}>
            <div style={{display:'flex', alignItems:'center', gap:13, width:sw-28, height:rowH-5, padding:'0 12px',
              borderRadius:10, background:active?'rgba(216,189,118,0.16)':'transparent'}}>
              {active && <div style={{position:'absolute', left:-12, top:6, width:3, height:rowH-17, background:C.goldHi, borderRadius:2}}/>}
              <Icon name={ic} size={16} color={active?C.goldHi:'rgba(245,242,232,0.7)'}/>
              <span style={{fontFamily:F.body, fontSize:15, fontWeight:active?800:600, whiteSpace:'nowrap',
                color:active?C.creamHi:'rgba(245,242,232,0.82)'}}>{label}</span>
            </div>
          </Reveal>
        );
      })}
      {/* right column */}
      <Eyebrow text="02 · Navigation" x={560} y={150} start={16.5} end={29}/>
      <Reveal start={16.8} end={29} x={560} y={188} dur={0.6}>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:54, color:C.ink, letterSpacing:'-0.02em', lineHeight:1.05, width:600}}>Tout part du menu</div>
      </Reveal>
      {[
        ['ui-checks-grid','14 sections, une seule barre latérale', 18.6],
        ['bell-fill','Des badges en temps réel : visites, alertes, anniversaires', 19.4],
        ['phone','Sur mobile, touchez l\u2019icône ☰ en haut à gauche', 20.2],
      ].map(([ic,txt,st],i)=>(
        <Reveal key={i} start={st} end={29} x={562} y={306+i*78} dur={0.5}>
          <div style={{display:'flex', alignItems:'center', gap:14, width:610}}>
            <div style={{width:44, height:44, borderRadius:12, background:'rgba(31,92,82,0.1)', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center'}}><Icon name={ic} size={20}/></div>
            <div style={{fontFamily:F.body, fontSize:22, color:C.ink, fontWeight:600, lineHeight:1.3}}>{txt}</div>
          </div>
        </Reveal>
      ))}
    </Scene>
  );
}

// ════════ SCENE: DOSSIER (29–40, cream) ════════
const TABS = [
  ['Infos','vcard-fill','Médecin traitant, allergies, mobilité, antécédents'],
  ['Contacts','telephone-fill','Famille à prévenir — contact principal indiqué'],
  ['Traitements','capsule-pill','Médicaments actifs, jours restants, alertes couleur'],
  ['Consultations','journal-medical','Historique des visites + ordonnances jointes'],
  ['RDV','calendar3','Rendez-vous passés et à venir du résident'],
];
function SceneDossier() {
  return (
    <Scene start={29} end={40} bg={C.cream}>
      <CreamBg/>
      <Eyebrow text="03 · Dossier d'un résident" x={90} y={150} start={29.3} end={40}/>
      <Reveal start={29.6} end={40} x={90} y={188} dur={0.6}>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:54, color:C.ink, letterSpacing:'-0.02em'}}>5 onglets, tout le suivi</div>
      </Reveal>
      {/* file mock list */}
      {TABS.map(([name,ic,desc],i)=>{
        const start = 30.1 + i*0.82;
        return (
          <Reveal key={i} start={start} end={40} x={90} y={290+i*72} dur={0.5} dy={14}>
            <div style={{display:'flex', alignItems:'center', gap:16, width:600, padding:'12px 18px',
              background:C.card, border:`1px solid ${C.line}`, borderRadius:16,
              boxShadow:'0 10px 26px -16px rgba(14,53,49,0.3)'}}>
              <div style={{width:46, height:46, borderRadius:12, background:'rgba(31,92,82,0.1)', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center'}}><Icon name={ic} size={22}/></div>
              <div>
                <div style={{fontFamily:F.disp, fontWeight:800, fontSize:20, color:C.teal}}>{name}</div>
                <div style={{fontFamily:F.body, fontSize:16.5, color:C.mid, fontWeight:600, marginTop:1}}>{desc}</div>
              </div>
            </div>
          </Reveal>
        );
      })}
      <Illo src={ILLO('03-dossier-resident')} x={740} y={188} w={456} h={392} start={29.6} end={40}/>
      <Reveal start={34.5} end={40} x={740} y={596} dur={0.5}>
        <div style={{display:'flex', alignItems:'center', gap:11, width:456, justifyContent:'center',
          fontFamily:F.body, fontSize:18, color:C.mid, fontWeight:600}}>
          <Icon name="luggage-fill" size={18} color={C.gold}/> Historique vacances & courses inclus
        </div>
      </Reveal>
    </Scene>
  );
}

Object.assign(window, { SceneIntro, SceneConnexion, SceneNavigation, SceneDossier });
