// scenes-core.jsx — shared design system, helpers & chrome for the St Hugh's guide video
// Depends on animations.jsx globals: Sprite, TextSprite, Easing, clamp, useTime, interpolate

const C = {
  cream:'#f5f2e8', creamHi:'#fbf9f1', card:'#fffdf8', beige:'#e7e0cf',
  teal:'#1f5c52', tealMid:'#164a43', tealDeep:'#0e3531', tealAbyss:'#0a2926',
  gold:'#b8963e', goldSoft:'#d8bd76', goldHi:'#e6d29a',
  ink:'#21302b', mid:'#5a655f', faint:'#9aa39c',
  blue:'#2563eb', gray:'#6b7280', red:'#b3261e', green:'#159a55', orange:'#d97706',
  line:'#e4ddcc', lineDark:'rgba(255,255,255,0.10)',
};
const F = {
  disp:"'Plus Jakarta Sans', system-ui, sans-serif",
  body:"'Mulish', system-ui, sans-serif",
  mono:"'JetBrains Mono', ui-monospace, monospace",
};
const ILLO = (n)=> (window.__resources && window.__resources[n]) || `assets_video/${n}.png`;

// ── Icon (inline SVG set — the icon font won't paint in this sandbox) ──
const ICONS = {
  'heart-pulse-fill':'<path d="M12 20.5C6.2 17 2.5 13.2 2.5 8.9 2.5 6.1 4.6 4 7.1 4c1.8 0 3.5 1 4.4 2.6h.9"/><path d="M12 6.6C12.9 5 14.6 4 16.4 4c2.5 0 4.6 2.1 4.6 4.9 0 1.4-.4 2.7-1.1 3.9"/><path d="M9 13.5h2.4L13 11l2 4 1.4-2.2H20"/>',
  'list':'<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  'envelope-fill':'<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M4.2 7.2 12 13l7.8-5.8"/>',
  'arrow-repeat':'<path d="M4 11.5A8 8 0 0 1 17.5 6.4L20 8.5"/><path d="M20 3.8v4.7h-4.7"/><path d="M20 12.5A8 8 0 0 1 6.5 17.6L4 15.5"/><path d="M4 20.2v-4.7h4.7"/>',
  'shield-lock-fill':'<path d="M12 3.2 19 5.6v5.2c0 4.9-3.1 8.3-7 9.7-3.9-1.4-7-4.8-7-9.7V5.6z"/><rect x="9.4" y="11.2" width="5.2" height="4.4" rx="0.9"/><path d="M10.3 11.2v-1.3a1.7 1.7 0 0 1 3.4 0v1.3"/>',
  'grid-1x2-fill':'<rect x="3.5" y="3.5" width="7" height="17" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7.3" rx="1.6"/><rect x="13.5" y="13.2" width="7" height="7.3" rx="1.6"/>',
  'people-fill':'<circle cx="9" cy="8" r="3.3"/><path d="M2.7 20c0-3.5 2.8-5.7 6.3-5.7s6.3 2.2 6.3 5.7"/><path d="M16 5.2a3.3 3.3 0 0 1 0 6.3"/><path d="M17.2 14.5c2.6.5 4.3 2.5 4.3 5.5"/>',
  'person-badge-fill':'<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3"/><circle cx="12" cy="9.4" r="2.6"/><path d="M7.8 16.6c.8-1.7 2.3-2.5 4.2-2.5s3.4.8 4.2 2.5"/>',
  'capsule-pill':'<rect x="3.4" y="8.4" width="17.2" height="7.2" rx="3.6"/><path d="M12 8.4v7.2"/>',
  'capsule':'<rect x="3.4" y="8.4" width="17.2" height="7.2" rx="3.6"/><path d="M12 8.4v7.2"/>',
  'journal-medical':'<rect x="5.5" y="3.5" width="13" height="17" rx="2.2"/><path d="M9.2 3.5v17"/><path d="M14 10.2h-1.2V9h-1.3v1.2H10.3v1.3h1.2v1.2h1.3v-1.2H14z"/>',
  'journal-plus':'<rect x="5.5" y="3.5" width="13" height="17" rx="2.2"/><path d="M9.2 3.5v17"/><path d="M13.9 11.4h-1.3v1.3M12.6 11.4h-2.3M12.6 11.4V9.1"/>',
  'calendar3':'<rect x="3.6" y="5" width="16.8" height="15.4" rx="2.2"/><path d="M3.6 9.3h16.8"/><path d="M8 3.4v3.2M16 3.4v3.2"/>',
  'calendar-plus-fill':'<rect x="3.6" y="5" width="16.8" height="15.4" rx="2.2"/><path d="M3.6 9.3h16.8"/><path d="M8 3.4v3.2M16 3.4v3.2"/><path d="M12 12.2v5M9.5 14.7h5"/>',
  'list-ol':'<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4.4 4.8h1v3.8M4 8.6h2"/><path d="M4.2 13.3h1.9v1.1l-1.9 1.7v.6h2.1"/>',
  'person-walking':'<circle cx="13.2" cy="4.4" r="2"/><path d="M13 7.2 11 11.4l3 1.8 1 6.4"/><path d="M11 11.4 7.6 12.6 5.6 16.6"/><path d="M14 12.8l3.2 1.1"/>',
  'box-arrow-right':'<path d="M13.5 5.5H6.6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h6.9"/><path d="M11.5 12H21M17 8l4 4-4 4"/>',
  'bag-fill':'<path d="M6 8h12l-1 11.4a1.6 1.6 0 0 1-1.6 1.4H8.6A1.6 1.6 0 0 1 7 19.4z"/><path d="M9 8V6.6a3 3 0 0 1 6 0V8"/>',
  'balloon-heart-fill':'<path d="M12 12.8C8.2 11 6.2 8.7 6.2 6.4 6.2 4.7 7.5 3.4 9.2 3.4c1.1 0 2.1.6 2.8 1.7.7-1.1 1.7-1.7 2.8-1.7 1.7 0 3 1.3 3 3 0 2.3-2 4.6-5.8 6.4z"/><path d="M12 12.8v3.2M11 18.8a1 1 0 0 0 2 0c0-.8-1-1.3-1-2.8"/>',
  'bell-fill':'<path d="M5.8 16.2V11a6.2 6.2 0 0 1 12.4 0v5.2l1.6 2.2H4.2z"/><path d="M9.8 19.6a2.2 2.2 0 0 0 4.4 0"/>',
  'bar-chart-fill':'<rect x="4" y="12" width="3.6" height="8" rx="1"/><rect x="10.2" y="6.8" width="3.6" height="13.2" rx="1"/><rect x="16.4" y="9.5" width="3.6" height="10.5" rx="1"/>',
  'person-circle':'<circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="9.8" r="3.1"/><path d="M6.2 18.8c1-2.5 3.2-3.7 5.8-3.7s4.8 1.2 5.8 3.7"/>',
  'ui-checks-grid':'<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><path d="M5 14.6l1.6 1.6 3-3.1"/><path d="M14 6h6.5M14 9h4.5M14 15h6.5M14 18h4.5"/>',
  'phone':'<rect x="6.8" y="3" width="10.4" height="18" rx="2.6"/><path d="M10.6 18h2.8"/>',
  'telephone-fill':'<path d="M6.6 4.4 9.6 5l1 3-1.7 1.6c.9 2 2.4 3.5 4.4 4.4L15 16.3l3 1 .6 3c0 .8-.7 1.5-1.5 1.4C11.9 21 5 14.1 5 8.4 5 7.6 5.7 6.9 6.6 6.9z"/>',
  'vcard-fill':'<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.6" cy="11" r="2.2"/><path d="M5.4 16c.5-1.4 1.7-2.2 3.2-2.2s2.7.8 3.2 2.2"/><path d="M14 9.6h4M14 12.4h4M14 15.2h3"/>',
  'luggage-fill':'<rect x="6" y="7.5" width="12" height="12.5" rx="2"/><path d="M9.4 7.5V5.6A1.6 1.6 0 0 1 11 4h2a1.6 1.6 0 0 1 1.6 1.6v1.9"/><path d="M10 11v5M14 11v5"/>',
  'clock-history':'<circle cx="12" cy="12" r="8.4"/><path d="M12 7v5.2l3.4 2"/>',
  'arrow-right-short':'<path d="M5 12h12.5M12.5 6.8l5.2 5.2-5.2 5.2"/>',
  'door-open-fill':'<path d="M3.5 20.2h17"/><path d="M6.5 20.2V5.2l8-2v17"/><circle cx="11.6" cy="12" r="0.7" fill="currentColor" stroke="none"/>',
  'lock-fill':'<rect x="4.6" y="10" width="14.8" height="10" rx="2.2"/><path d="M7.6 10V7.6a4.4 4.4 0 0 1 8.8 0V10"/>',
  'person-lock':'<circle cx="9.6" cy="8" r="3.3"/><path d="M3.5 20c0-3.4 2.7-5.5 6.1-5.5.9 0 1.7.13 2.5.4"/><rect x="14.4" y="14" width="7" height="6" rx="1.2"/><path d="M16 14v-1.4a1.9 1.9 0 0 1 3.8 0V14"/>',
  'eye-slash-fill':'<path d="M3 12s3.6-6 9-6c1.6 0 3.1.5 4.3 1.3M21 12s-3.6 6-9 6c-1.6 0-3.1-.5-4.3-1.3"/><circle cx="12" cy="12" r="2.7"/><path d="M3.6 3.6 20.4 20.4"/>',
  'exclamation-triangle-fill':'<path d="M12 4 21 19.4H3z"/><path d="M12 10v4.2"/><circle cx="12" cy="16.8" r="0.6" fill="currentColor" stroke="none"/>',
  'file-earmark-medical-fill':'<path d="M6 3.5h7l5 5v12a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20.5V5A1.5 1.5 0 0 1 6 3.5z"/><path d="M13 3.5V8.5h5"/><path d="M12 12v5M9.5 14.5h5"/>',
  'archive-fill':'<rect x="3.5" y="4.5" width="17" height="4.2" rx="1.2"/><path d="M5.2 8.7v9.8a1.6 1.6 0 0 0 1.6 1.6h10.4a1.6 1.6 0 0 0 1.6-1.6V8.7"/><path d="M9.6 12.6h4.8"/>',
  'check-circle-fill':'<circle cx="12" cy="12" r="8.5"/><path d="M8 12.2l2.6 2.6 5.2-5.6"/>',
  'person-fill':'<circle cx="12" cy="8" r="3.9"/><path d="M4.5 20.5c0-4.2 3.4-6.7 7.5-6.7s7.5 2.5 7.5 6.7"/>',
  'question-circle-fill':'<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.7a2.5 2.5 0 0 1 4.6 1.4c0 1.6-2 2-2 3.4"/><circle cx="12" cy="16.6" r="0.6" fill="currentColor" stroke="none"/>',
  '_fallback':'<circle cx="12" cy="12" r="7"/>',
};
function Icon({name, size=24, color=C.teal, style={}}) {
  return <svg viewBox="0 0 24 24" width={size} height={size}
    style={{display:'inline-block', flexShrink:0, color, ...style}}
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    dangerouslySetInnerHTML={{__html: ICONS[name] || ICONS._fallback}} />;
}

// ── Reveal: place a block at (x,y) with slide+fade entry/exit, global timing ──
function Reveal({start, end, x, y, dy=20, dur=0.55, exit=0.4, origin='top left', center=false, children, style={}}) {
  return (
    <Sprite start={start} end={end}>
      {({localTime, duration})=>{
        const exitStart = duration - exit;
        let op=1, ty=0, sc=1;
        if (localTime < dur) {
          const t = Easing.easeOutCubic(clamp(localTime/dur,0,1));
          op=t; ty=(1-t)*dy; sc=0.985+0.015*t;
        } else if (localTime > exitStart) {
          const t = Easing.easeInQuad(clamp((localTime-exitStart)/exit,0,1));
          op=1-t; ty=-t*12;
        }
        const pos = center ? {left:0, right:0, textAlign:'center'} : {left:x};
        return (
          <div style={{position:'absolute', top:y, opacity:op,
            transform:`translateY(${ty}px) scale(${sc})`, transformOrigin:center?'top center':origin,
            willChange:'transform,opacity', ...pos, ...style}}>
            {children}
          </div>
        );
      }}
    </Sprite>
  );
}

// ── Pop: scale-in chip/badge with slight overshoot ──────────
function Pop({start, end, x, y, dur=0.5, exit=0.35, center=false, children, style={}}) {
  return (
    <Sprite start={start} end={end}>
      {({localTime, duration})=>{
        const exitStart = duration - exit;
        let op=1, sc=1;
        if (localTime < dur) {
          const t = clamp(localTime/dur,0,1);
          op=Easing.easeOutQuad(t); sc=Easing.easeOutBack(t)*0.4+0.6;
        } else if (localTime > exitStart) {
          const t = clamp((localTime-exitStart)/exit,0,1);
          op=1-Easing.easeInQuad(t); sc=1-0.1*t;
        }
        if (center) {
          return <div style={{position:'absolute', left:0, right:0, top:y, opacity:op,
            display:'flex', justifyContent:'center', willChange:'transform,opacity'}}>
            <div style={{transform:`scale(${sc})`, transformOrigin:'center', ...style}}>{children}</div></div>;
        }
        return <div style={{position:'absolute', left:x, top:y, opacity:op,
          transform:`scale(${sc})`, transformOrigin:'center', willChange:'transform,opacity', ...style}}>{children}</div>;
      }}
    </Sprite>
  );
}

// ── Illo: rounded illustration card with ken-burns + entry ──
function Illo({src, x, y, w, h, start, end, radius=24, kb=true, entry=0.65, exit=0.5, rotate=0, style={}}) {
  return (
    <Sprite start={start} end={end}>
      {({localTime, duration})=>{
        const exitStart = duration - exit;
        let op=1, sc=1, ty=0;
        if (localTime < entry) { const t=Easing.easeOutCubic(clamp(localTime/entry,0,1)); op=t; sc=0.92+0.08*t; ty=(1-t)*26; }
        else if (localTime > exitStart) { const t=Easing.easeInCubic(clamp((localTime-exitStart)/exit,0,1)); op=1-t; ty=-t*16; sc=1+0.02*t; }
        const holdSpan=Math.max(0.01, exitStart-entry);
        const holdT=clamp((localTime-entry)/holdSpan,0,1);
        const kbScale = kb ? 1+0.055*holdT : 1;
        return (
          <div style={{position:'absolute', left:x, top:y, width:w, height:h, opacity:op,
            transform:`translateY(${ty}px) rotate(${rotate}deg) scale(${sc})`, transformOrigin:'center',
            borderRadius:radius, overflow:'hidden', background:C.card,
            boxShadow:'0 30px 70px -24px rgba(14,53,49,0.5), 0 2px 8px rgba(14,53,49,0.12)',
            border:`1px solid ${C.line}`, willChange:'transform,opacity', ...style}}>
            <div style={{width:'100%', height:'100%', transform:`scale(${kbScale})`, transformOrigin:'center'}}>
              <img src={src} alt="" style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ── Scene: full-bleed background with edge fade + slow drift ─
function Scene({start, end, bg, fade=0.45, drift=true, children}) {
  return (
    <Sprite start={start} end={end}>
      {({localTime, duration})=>{
        const exitStart = duration - fade;
        let op=1;
        if (localTime < fade) op = Easing.easeOutQuad(clamp(localTime/fade,0,1));
        else if (localTime > exitStart) op = 1-Easing.easeInQuad(clamp((localTime-exitStart)/fade,0,1));
        const dprog = duration>0 ? localTime/duration : 0;
        const sc = drift ? 1+0.012*dprog : 1;
        return (
          <div style={{position:'absolute', inset:0, opacity:op, background:bg, overflow:'hidden'}}>
            <div style={{position:'absolute', inset:0, transform:`scale(${sc})`, transformOrigin:'center'}}>
              {children}
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ── Soft decorative blobs for cream scenes ──────────────────
function CreamBg({tone='cream'}) {
  return (
    <div style={{position:'absolute', inset:0, overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, background:
        tone==='cream'
          ? `radial-gradient(1100px 700px at 82% -8%, ${C.creamHi}, transparent 60%), ${C.cream}`
          : C.cream}}/>
      <div style={{position:'absolute', right:-120, top:-120, width:420, height:420, borderRadius:'50%',
        background:'rgba(184,150,62,0.06)'}}/>
      <div style={{position:'absolute', left:-160, bottom:-160, width:520, height:520, borderRadius:'50%',
        background:'rgba(31,92,82,0.05)'}}/>
    </div>
  );
}
function TealBg() {
  return (
    <div style={{position:'absolute', inset:0, overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, background:
        `radial-gradient(1200px 800px at 78% -10%, ${C.tealMid}, ${C.tealDeep} 55%, ${C.tealAbyss})`}}/>
      <div style={{position:'absolute', right:-140, top:-100, width:480, height:480, borderRadius:'50%',
        background:'rgba(184,150,62,0.10)', filter:'blur(8px)'}}/>
      <div style={{position:'absolute', left:-180, bottom:-180, width:560, height:560, borderRadius:'50%',
        background:'rgba(216,189,118,0.06)'}}/>
    </div>
  );
}

// ── Eyebrow label (small caps) ──────────────────────────────
function Eyebrow({text, color=C.gold, x, y, start, end}) {
  return (
    <Reveal start={start} end={end} x={x} y={y} dur={0.5}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <div style={{width:26, height:2, background:color, borderRadius:2}}/>
        <span style={{fontFamily:F.disp, fontWeight:700, fontSize:15, letterSpacing:'0.22em',
          textTransform:'uppercase', color}}>{text}</span>
      </div>
    </Reveal>
  );
}

// ── Persistent top progress line (whole video) ──────────────
function ProgressLine({duration}) {
  const t = useTime();
  const pct = clamp(t/duration,0,1)*100;
  return (
    <div style={{position:'absolute', top:0, left:0, right:0, height:4, background:'rgba(0,0,0,0.06)', zIndex:50}}>
      <div style={{height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${C.gold}, ${C.goldSoft})`}}/>
    </div>
  );
}

// ── Persistent chapter HUD (8s..hudEnd) ─────────────────────
function ChapterHUD({chapters, hudStart, hudEnd, total}) {
  const t = useTime();
  if (t < hudStart || t > hudEnd) return null;
  let cur = chapters[0];
  for (const c of chapters) if (t >= c.s) cur = c;
  // dark-bg ranges where text must be light
  const dark = (t>=84 && t<104);
  const fg = dark ? C.creamHi : C.ink;
  const sub = dark ? 'rgba(245,242,232,0.6)' : C.mid;
  // fade in/out at hud boundaries
  let op=1;
  if (t<hudStart+0.5) op=clamp((t-hudStart)/0.5,0,1);
  else if (t>hudEnd-0.5) op=clamp((hudEnd-t)/0.5,0,1);
  return (
    <div style={{position:'absolute', top:0, left:0, right:0, height:62, zIndex:40, opacity:op,
      display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px',
      fontFamily:F.disp}}>
      <div style={{display:'flex', alignItems:'center', gap:11}}>
        <div style={{width:30, height:30, borderRadius:9, background:dark?'rgba(216,189,118,0.16)':C.teal,
          display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Icon name="heart-pulse-fill" size={16} color={dark?C.goldHi:C.creamHi}/>
        </div>
        <span style={{fontWeight:800, fontSize:16, color:fg, letterSpacing:'-0.01em'}}>St&nbsp;Hugh's</span>
        <span style={{fontWeight:600, fontSize:13, color:sub, letterSpacing:'0.04em'}}>· Guide</span>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:10, whiteSpace:'nowrap'}}>
        <span style={{fontFamily:F.mono, fontSize:12, fontWeight:600, color:C.gold, letterSpacing:'0.05em'}}>{cur.i}/09</span>
        <span style={{fontWeight:700, fontSize:14, color:fg}}>{cur.name}</span>
      </div>
    </div>
  );
}

Object.assign(window, { C, F, ILLO, Icon, Reveal, Pop, Illo, Scene, CreamBg, TealBg, Eyebrow, ProgressLine, ChapterHUD });
