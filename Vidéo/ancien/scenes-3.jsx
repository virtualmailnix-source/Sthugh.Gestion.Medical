// scenes-3.jsx — Système de points (centerpiece), Export PDF & Droits, Outro
// globals from scenes-core + scenes-2 (Badge) + engine

// ════════ SCENE: SYSTÈME DE POINTS (84–104, teal) ════════
function FactorCard({letter, color, title, max, rows, x, start, end}) {
  return (
    <Reveal start={start} end={end} x={x} y={272} dur={0.6} dy={26}>
      <div style={{width:356, height:316, borderRadius:22, background:'rgba(255,255,255,0.055)',
        border:'1px solid rgba(255,255,255,0.12)', overflow:'hidden', backdropFilter:'blur(2px)'}}>
        <div style={{display:'flex', alignItems:'center', gap:13, padding:'18px 20px',
          borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{width:42, height:42, borderRadius:12, background:color, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F.disp, fontWeight:800,
            fontSize:22, color:'#fff'}}>{letter}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:F.disp, fontWeight:800, fontSize:18.5, color:C.creamHi, lineHeight:1.1}}>{title}</div>
          </div>
          <div style={{fontFamily:F.mono, fontWeight:700, fontSize:14, color:C.goldHi, whiteSpace:'nowrap'}}>{max}</div>
        </div>
        <div style={{padding:'14px 20px', display:'flex', flexDirection:'column', gap:11}}>
          {rows.map((r,i)=>(
            <div key={i} style={{display:'flex', alignItems:'center', gap:12}}>
              <div style={{minWidth:52, textAlign:'center', padding:'4px 0', borderRadius:8,
                background:r.pts==='0'?'rgba(255,255,255,0.08)':color+'33',
                border:`1px solid ${r.pts==='0'?'rgba(255,255,255,0.12)':color+'66'}`,
                fontFamily:F.mono, fontWeight:700, fontSize:15, color:r.pts==='0'?'rgba(245,242,232,0.6)':C.goldHi}}>{r.pts}</div>
              <div style={{fontFamily:F.body, fontSize:15.5, color:'rgba(245,242,232,0.9)', fontWeight:600, lineHeight:1.25}}>{r.txt}</div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function ExampleCalc({start, end}) {
  return (
    <Sprite start={start} end={end}>
      {({localTime, duration})=>{
        const exit=0.5, exitStart=duration-exit;
        let op=1, ty=0;
        if (localTime<0.6) { const t=Easing.easeOutCubic(clamp(localTime/0.6,0,1)); op=t; ty=(1-t)*30; }
        else if (localTime>exitStart) { const t=clamp((localTime-exitStart)/exit,0,1); op=1-t; ty=-t*14; }
        const cp = clamp((localTime-0.7)/2.0,0,1); // count progress
        const eased = Easing.easeOutCubic(cp);
        const sum = Math.round(eased*170);
        const barW = eased*100;
        return (
          <div style={{position:'absolute', left:280, top:262, width:720, opacity:op,
            transform:`translateY(${ty}px)`}}>
            <div style={{background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.14)',
              borderRadius:24, padding:'30px 36px'}}>
              <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:22}}>
                <div style={{width:56, height:56, borderRadius:'50%', background:'rgba(216,189,118,0.18)',
                  display:'flex', alignItems:'center', justifyContent:'center'}}><Icon name="person-fill" size={28} color={C.goldHi}/></div>
                <div>
                  <div style={{fontFamily:F.disp, fontWeight:800, fontSize:26, color:C.creamHi}}>Mme Dupont</div>
                  <div style={{fontFamily:F.body, fontSize:16, color:'rgba(245,242,232,0.7)', fontWeight:600}}>Cas prioritaire</div>
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:14, fontFamily:F.disp, fontWeight:800, fontSize:30, color:C.creamHi}}>
                <span style={{color:'#7fb3ff'}}>+80</span>
                <span style={{opacity:0.5, fontWeight:600}}>jamais vue</span>
                <span style={{opacity:0.4}}>+</span>
                <span style={{color:'#ff9a93'}}>+50</span>
                <span style={{opacity:0.5, fontWeight:600}}>méd. demain</span>
                <span style={{opacity:0.4}}>+</span>
                <span style={{color:C.goldHi}}>+40</span>
                <span style={{opacity:0.5, fontWeight:600}}>P1</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:20, marginTop:24}}>
                <div style={{fontFamily:F.disp, fontWeight:800, fontSize:64, color:'#ff7a72', lineHeight:1,
                  fontVariantNumeric:'tabular-nums', minWidth:170}}>{sum}<span style={{fontSize:26, color:'rgba(245,242,232,0.6)', fontWeight:700}}> pts</span></div>
                <div style={{flex:1}}>
                  <div style={{height:18, borderRadius:10, background:'rgba(255,255,255,0.1)', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${barW}%`, borderRadius:10,
                      background:'linear-gradient(90deg,#159a55,#d97706 50%,#dc2626)'}}/>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', marginTop:7,
                    fontFamily:F.mono, fontSize:13, color:'rgba(245,242,232,0.55)'}}>
                    <span>0</span><span style={{color:'#ff9a93', fontWeight:700}}>&gt; 60 = priorité</span></div>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

function SceneScore() {
  return (
    <Scene start={84} end={104} bg={C.tealDeep}>
      <TealBg/>
      {/* Beat A: question + formula */}
      <Reveal start={84.4} end={89} y={150} dur={0.6} center>
        <div style={{fontFamily:F.disp, fontWeight:700, fontSize:15, letterSpacing:'0.22em', textTransform:'uppercase', color:C.goldSoft, marginBottom:14}}>08 · Système de points</div>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:52, color:C.creamHi, letterSpacing:'-0.02em', lineHeight:1.1}}>Qui voit le médecin en premier ?</div>
      </Reveal>
      <Reveal start={85.6} end={89} y={360} dur={0.6} center>
        <div style={{display:'inline-flex', alignItems:'center', gap:18,
          fontFamily:F.disp, fontWeight:800, fontSize:40, color:C.creamHi}}>
          <span style={{color:'#7fb3ff'}}>A</span><span style={{opacity:0.5}}>+</span>
          <span style={{color:'#ff9a93'}}>B</span><span style={{opacity:0.5}}>+</span>
          <span style={{color:C.goldHi}}>C</span>
          <span style={{opacity:0.5, fontWeight:600, fontSize:30, marginLeft:8}}>= score de priorité</span>
        </div>
      </Reveal>
      <Reveal start={86.0} end={89} y={446} dur={0.6} center>
        <div style={{fontFamily:F.body, fontSize:21, color:'rgba(245,242,232,0.72)', fontWeight:500}}>Calculé automatiquement — trois facteurs additionnés</div>
      </Reveal>

      {/* Beat B: factor cards */}
      <Reveal start={89.4} end={99.2} y={150} dur={0.5} center>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:40, color:C.creamHi, letterSpacing:'-0.02em'}}>Trois facteurs, un score</div>
      </Reveal>
      <FactorCard letter="A" color="#2f6fe0" title="Jours sans consultation" max="max +80" x={88} start={89.8} end={99.2}
        rows={[{pts:'+80',txt:'Jamais vu depuis l\u2019entrée'},{pts:'+60',txt:'Plus de 30 jours'},{pts:'+35',txt:'Plus de 21 jours'},{pts:'+15',txt:'Plus de 14 jours'}]}/>
      <FactorCard letter="B" color="#dc2626" title="Médicaments urgents" max="max +50" x={462} start={90.2} end={99.2}
        rows={[{pts:'+50',txt:'Expire dans moins de 24 h'},{pts:'+25',txt:'Expire dans moins de 3 jours'},{pts:'0',txt:'Aucune urgence'}]}/>
      <FactorCard letter="C" color={C.gold} title="Priorité manuelle" max="max +40" x={836} start={90.6} end={99.2}
        rows={[{pts:'+40',txt:'P1 — Urgente'},{pts:'+20',txt:'P2 — Élevée'},{pts:'0',txt:'P3 — Normale'}]}/>
      {/* legend strip */}
      <Reveal start={95.5} end={99.2} y={618} dur={0.5} center>
        <div style={{display:'inline-flex', gap:26, padding:'12px 26px',
          background:'rgba(255,255,255,0.06)', borderRadius:14, border:'1px solid rgba(255,255,255,0.1)'}}>
          {[['#159a55','< 30 — normal'],['#d97706','30 à 60 — à surveiller'],['#dc2626','> 60 — priorité']].map(([c,t],i)=>(
            <div key={i} style={{display:'flex', alignItems:'center', gap:9, fontFamily:F.body, fontWeight:700, fontSize:17, color:'rgba(245,242,232,0.9)'}}>
              <span style={{width:13, height:13, borderRadius:'50%', background:c}}/>{t}
            </div>
          ))}
        </div>
      </Reveal>

      {/* Beat C: example */}
      <Reveal start={99.6} end={104} y={150} dur={0.5} center>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:40, color:C.creamHi, letterSpacing:'-0.02em'}}>Un exemple concret</div>
      </Reveal>
      <ExampleCalc start={99.8} end={104}/>
    </Scene>
  );
}

// ════════ SCENE: PDF & DROITS (104–113, cream) ════════
function ScenePdfDroits() {
  const pdfs = [
    {ic:'file-earmark-medical-fill', title:'Dossier médical', accent:C.teal, desc:'Résidents actifs · 5 dernières consultations', st:105.0},
    {ic:null, glyph:'✝', title:'Dossier de décès', accent:C.red, desc:'En-tête rouge · historique complet', st:105.5},
    {ic:'archive-fill', title:'Dossier archivé', accent:C.gray, desc:'En-tête gris · date de départ', st:106.0},
  ];
  const admin = ['Consultations & traitements','Médecins & rendez-vous','Visites, courses, vacances','Export PDF'];
  const sa = ['Ajouter / retirer un résident','Départ définitif & décès','Modifier les contacts famille','Comptes utilisateurs'];
  return (
    <Scene start={104} end={113} bg={C.cream}>
      <CreamBg/>
      <Eyebrow text="09 · Export PDF & Droits" x={90} y={140} start={104.3} end={113}/>
      <Reveal start={104.6} end={113} x={90} y={178} dur={0.6}>
        <div style={{fontFamily:F.disp, fontWeight:800, fontSize:48, color:C.ink, letterSpacing:'-0.02em'}}>Exporter & qui peut quoi</div>
      </Reveal>
      {/* PDF column */}
      {pdfs.map((p,i)=>(
        <Reveal key={i} start={p.st} end={113} x={80} y={284+i*102} dur={0.5} dy={16}>
          <div style={{display:'flex', alignItems:'center', gap:16, width:560, padding:'16px 20px',
            background:C.card, border:`1px solid ${C.line}`, borderLeft:`5px solid ${p.accent}`, borderRadius:16,
            boxShadow:'0 10px 26px -16px rgba(14,53,49,0.3)'}}>
            <div style={{width:48, height:48, borderRadius:12, background:p.accent+'18', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center'}}>
              {p.glyph ? <span style={{fontSize:24, color:p.accent}}>{p.glyph}</span> : <Icon name={p.ic} size={24} color={p.accent}/>}
            </div>
            <div>
              <div style={{fontFamily:F.disp, fontWeight:800, fontSize:21, color:C.ink}}>{p.title}</div>
              <div style={{fontFamily:F.body, fontSize:16, color:C.mid, fontWeight:600, marginTop:1}}>{p.desc}</div>
            </div>
          </div>
        </Reveal>
      ))}
      <Reveal start={107.2} end={113} x={80} y={596} dur={0.5}>
        <div style={{display:'flex', alignItems:'center', gap:10, width:560, fontFamily:F.body, fontSize:16, color:C.mid, fontWeight:700}}>
          <Icon name="person-fill" size={16} color={C.gold}/> Chaque page indique « Exporté par : Nom (email) »
        </div>
      </Reveal>
      {/* Rights column */}
      <Reveal start={106.4} end={113} x={680} y={282} dur={0.55} dy={18}>
        <div style={{width:520, background:C.card, border:`1px solid ${C.line}`, borderRadius:20, overflow:'hidden',
          boxShadow:'0 18px 44px -24px rgba(14,53,49,0.36)'}}>
          <div style={{display:'flex'}}>
            <div style={{flex:1, padding:'18px 20px', borderRight:`1px solid ${C.line}`}}>
              <div style={{fontFamily:F.disp, fontWeight:800, fontSize:15, color:C.teal, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14}}>✓ Admin</div>
              {admin.map((t,i)=>(<div key={i} style={{display:'flex', gap:9, marginBottom:11, fontFamily:F.body, fontSize:15.5, color:C.ink, fontWeight:600, lineHeight:1.25}}><Icon name="check-circle-fill" size={15} color={C.green} style={{marginTop:2, flexShrink:0}}/>{t}</div>))}
            </div>
            <div style={{flex:1, padding:'18px 20px', background:'rgba(179,38,30,0.03)'}}>
              <div style={{fontFamily:F.disp, fontWeight:800, fontSize:15, color:C.red, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14}}>★ Super Admin</div>
              {sa.map((t,i)=>(<div key={i} style={{display:'flex', gap:9, marginBottom:11, fontFamily:F.body, fontSize:15.5, color:C.ink, fontWeight:600, lineHeight:1.25}}><Icon name="person-lock" size={15} color={C.red} style={{marginTop:2, flexShrink:0}}/>{t}</div>))}
            </div>
          </div>
        </div>
      </Reveal>
    </Scene>
  );
}

// ════════ SCENE: OUTRO (113–118, teal) ════════
function SceneOutro() {
  return (
    <Scene start={113} end={118} bg={C.tealDeep} fade={0.5}>
      <TealBg/>
      <Pop start={113.4} end={118} y={216} dur={0.7} center>
        <div style={{width:88, height:88, borderRadius:26, background:'rgba(216,189,118,0.14)',
          border:'1px solid rgba(216,189,118,0.3)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Icon name="question-circle-fill" size={44} color={C.goldHi}/>
        </div>
      </Pop>
      <Reveal start={114.0} end={118} y={336} dur={0.6} center>
        <div style={{fontFamily:F.disp, fontWeight:800,
          fontSize:46, color:C.creamHi, letterSpacing:'-0.02em', lineHeight:1.1}}>Tout le guide est dans le menu Aide</div>
      </Reveal>
      <Reveal start={114.6} end={118} y={426} dur={0.6} center>
        <div style={{display:'inline-flex', alignItems:'center', gap:11,
          fontFamily:F.disp, fontWeight:700, fontSize:18, letterSpacing:'0.2em', textTransform:'uppercase', color:C.goldSoft}}>
          <Icon name="heart-pulse-fill" size={20} color={C.goldSoft}/> St Hugh's Anglican Home
        </div>
      </Reveal>
    </Scene>
  );
}

Object.assign(window, { SceneScore, ScenePdfDroits, SceneOutro });
