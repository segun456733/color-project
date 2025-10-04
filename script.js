/* =========================================================================
   Color World — Ultimate Unified script.js
   Includes: splash, navbar,, live preview, gradient, contrast,
   , shades, color blindness,, contact form, help,
   drag & drop, keyboard shortcuts, export, pulse/glow hover effects
   ========================================================================= */

/* ---------- Tiny helpers ---------- */
const $  = (sel, ctx = document) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

/* ---------- Toast notifications ---------- */
const toast = (txt, ms = 1600) => {
  const t = $('#toast');
  if (!t) { console.log('TOAST:', txt); return; }
  t.textContent = txt;
  t.classList.add('show');
  clearTimeout(toast._t);
  t.style.opacity = '1';
  toast._t = setTimeout(() => {
    if (t) { t.style.opacity = '0'; t.classList.remove('show'); }
  }, ms);
};

/* ---------- Pop sound ---------- */
const popSound = new Audio('https://assets.codepen.io/3/pop.mp3');
const playPop = () => { try { popSound.currentTime = 0; popSound.play(); } catch(_){} };

/* ---------- Color utilities ---------- */
const randomColor = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6,'0');
const hexToRgb = hex => { hex = String(hex).replace('#','').slice(0,6); return [0,2,4].map(i=>parseInt(hex.substr(i,2),16)||0); };
const luminance = hex => { const [r,g,b] = hexToRgb(hex).map(v=>v/255); const f = v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const contrastRatio = (a,b) => { try { const L1=luminance(a),L2=luminance(b); return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05); } catch(e){ return 1; } };
const hexToHsl = hex => { const [r,g,b]=hexToRgb(hex).map(v=>v/255); const max=Math.max(r,g,b),min=Math.min(r,g,b); let h=0,s=0,l=(max+min)/2; if(max!==min){const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min); switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;} return [Math.round(h*360),Math.round(s*100),Math.round(l*100)]; };
const hslToHex = (h,s,l) => { s/=100;l/=100; const c=(1-Math.abs(2*l-1))*s; const x=c*(1-Math.abs((h/60)%2-1)); const m=l-c/2; let [r,g,b]=[0,0,0]; if(h<60)[r,g,b]=[c,x,0]; else if(h<120)[r,g,b]=[x,c,0]; else if(h<180)[r,g,b]=[0,c,x]; else if(h<240)[r,g,b]=[0,x,c]; else if(h<300)[r,g,b]=[x,0,c]; else [r,g,b]=[c,0,x]; return '#'+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join(''); };
const getReadableText = bgHex => { try { return luminance(bgHex)>0.5?'#000000':'#FFFFFF'; } catch(e){return '#000000';} };

/* =========================================================================
   Splash & load-safe boot
   ========================================================================= */
(function splashBoot(){
  const safeHide=()=>{$('#splash')&&( $('#splash').style.display='none');};
  window.addEventListener('load',()=>{ setTimeout(()=>{safeHide();$('#home')?.scrollIntoView?.({behavior:'smooth'});},1500); });
  setTimeout(()=>safeHide(),5000);
})();

/* =========================================================================
   DOM ready
   ========================================================================= */
document.addEventListener('DOMContentLoaded',()=>{

  /* ---------- Navbar ---------- */
  const menuBtn = $('#menuToggle');
  const nav     = $('#navLinks');
  const overlay = $('#navOverlay');
  const openNav  = () => { nav?.classList.add('show'); overlay?.classList.add('show'); };
  const closeNav = () => { nav?.classList.remove('show'); overlay?.classList.remove('show'); };
  menuBtn?.addEventListener('click',()=>{nav?.classList.contains('show')?closeNav():openNav();});
  overlay?.addEventListener('click', closeNav);
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click', closeNav));

  /* ---------- Palette ---------- */
  const palette = $('#palette');
  const generateBtn = $('#generate-btn');
  const livePreview = $('#live-preview');
  const color1 = $('#color1'), color2 = $('#color2');
  let lockedPreviewHex = null;

  const ensureButtons = box=>{
    if(!box) return;
    if(!box.querySelector('.lock-toggle')){ const l=document.createElement('div'); l.className='lock-toggle'; l.textContent='🔓'; Object.assign(l.style,{position:'absolute',top:'6px',right:'6px',cursor:'pointer',userSelect:'none',fontSize:'14px'}); box.appendChild(l);}
    if(!box.querySelector('.delete-btn')){ const d=document.createElement('button'); d.className='delete-btn'; d.type='button'; d.title='Replace color'; d.textContent='×'; Object.assign(d.style,{position:'absolute',top:'6px',left:'6px',cursor:'pointer',userSelect:'none',fontSize:'14px'}); box.appendChild(d);}
  };

  const initPaletteBoxes = ()=>{
    if(!palette) return;
    $$('.color-box',palette).forEach(box=>{
      const label = box.querySelector('.copy');
      let hex = (label?.textContent||'').trim();
      if(!(/^#?[0-9a-f]{6}$/i.test(hex))) hex=randomColor();
      if(!hex.startsWith('#')) hex='#'+hex;
      box.style.background=hex; box.dataset.hex=hex.toUpperCase();
      if(label) label.textContent=hex.toUpperCase();
      box.setAttribute('draggable','true'); box.setAttribute('role','button'); box.setAttribute('tabindex','0'); box.title=`Color ${hex.toUpperCase()}`;
      box.style.transition='all 0.25s ease'; // smooth hover
      ensureButtons(box);
    });
  };

  const resetLivePreview=()=>{ if(!livePreview) return; livePreview.style.backgroundColor=''; livePreview.style.color=''; livePreview.textContent='Live Preview'; };
  const updateLivePreview=hex=>{ if(!livePreview) return; livePreview.style.backgroundColor=hex; livePreview.style.color=getReadableText(hex); livePreview.textContent=`Preview: ${hex.toUpperCase()}`; };
  const setFromPalette=hex=>{
    if(!hex) return;
    const contrastTarget = $('input[name="contrastTarget"]:checked')?.value;
    if(contrastTarget){ const el=$('#'+contrastTarget); if(el) el.value=hex; typeof updateContrastMain==='function' && updateContrastMain(); }
    const gradientTarget = $('input[name="gradientTarget"]:checked')?.value;
    if(gradientTarget){ const el=$('#'+gradientTarget); if(el) el.value=hex; typeof updateGradientPreview==='function' && updateGradientPreview(); }
    const shBase = $('#sh_base'); if(shBase) shBase.value=hex;
  };

  function replaceColor(box){ if(!box) return; if(box.classList.contains('locked')){toast('This color is locked — unlock first to replace'); return;} const newHex=randomColor().toUpperCase(); box.style.background=newHex; box.dataset.hex=newHex; const label=box.querySelector('.copy'); if(label) label.textContent=newHex; toast('Color replaced: '+newHex);}
  function toggleLock(box){ const lockBtn=box?.querySelector('.lock-toggle'); if(!box.classList.contains('locked')){box.classList.add('locked');if(lockBtn)lockBtn.textContent='🔒';toast('Color locked');}else{box.classList.remove('locked');if(lockBtn)lockBtn.textContent='🔓';toast('Color unlocked');}}
  const generatePalette=()=>{ if(!palette) return; $$('.color-box',palette).forEach(box=>{ if(box.classList.contains('locked')) return; const hex=randomColor().toUpperCase(); box.style.background=hex; box.dataset.hex=hex; const label=box.querySelector('.copy'); if(label) label.textContent=hex;}); lockedPreviewHex=null; resetLivePreview(); toast('New palette generated');};
generateBtn?.addEventListener('click', generatePalette);

  if(palette){
    palette.addEventListener('click',ev=>{
      if(ev.target.classList.contains('delete-btn')){ ev.stopPropagation(); replaceColor(ev.target.closest('.color-box')); return; }
      if(ev.target.classList.contains('lock-toggle')){ ev.stopPropagation(); toggleLock(ev.target.closest('.color-box')); return; }
      const box=ev.target.closest('.color-box'); if(!box||!box.dataset.hex) return; const hex=box.dataset.hex.toUpperCase();
      try{ navigator.clipboard.writeText(hex).then(()=>{ toast('Copied: '+hex); playPop(); }).catch(()=>{ toast('Copied: '+hex); }); } catch(e){ toast('Copied: '+hex); }
      setFromPalette(hex); lockedPreviewHex=hex; updateLivePreview(hex); 
      box.classList.add('popped'); 
      setTimeout(()=>box.classList.remove('popped'),220);
    });
    palette.addEventListener('mouseover',ev=>{ const box=ev.target.closest('.color-box'); if(!box) return; const hex=box.dataset.hex; if(hex&&!lockedPreviewHex) updateLivePreview(hex); box.style.boxShadow='0 0 10px rgba(108,99,255,0.8)'; box.style.transform='scale(1.05)'; });
    palette.addEventListener('mouseleave',ev=>{ const box=ev.target.closest('.color-box'); if(!box) return; if(!lockedPreviewHex) resetLivePreview(); box.style.boxShadow=''; box.style.transform=''; });
    palette.addEventListener('dblclick',ev=>{ const box=ev.target.closest('.color-box'); if(box) toggleLock(box); });
    palette.addEventListener('keydown',ev=>{ if(ev.key==='Enter'||ev.key===' '){ const target=ev.target.closest?.('.color-box')||ev.target; target?.classList.contains('color-box') && target.click(); }});
  }

  /* ---------- Drag & drop ---------- */
  let dragged=null;
  if(palette){
    palette.addEventListener('dragstart',e=>{ const box=e.target.closest('.color-box'); if(!box) return; dragged=box; box.classList.add('dragging'); try{ e.dataTransfer.setData('text/plain',box.dataset.hex||''); }catch(_){}}); 
    palette.addEventListener('dragend',()=>{ dragged?.classList.remove('dragging'); dragged=null; });
    const getDragAfterElement=(container,x)=>{ const els=[...container.querySelectorAll('.color-box:not(.dragging)')]; return els.reduce((closest,child)=>{ const rect=child.getBoundingClientRect(); const offset=x-rect.left-rect.width/2; if(offset<0&&offset>closest.offset) return {offset,element:child}; return closest;},{offset:Number.NEGATIVE_INFINITY}).element||null; };
    palette.addEventListener('dragover',e=>{ e.preventDefault(); if(!dragged) return; const after=getDragAfterElement(palette,e.clientX); if(after==null) palette.appendChild(dragged); else palette.insertBefore(dragged,after); });
  }

  /* ---------- Keyboard shortcuts ---------- */
  document.addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    if(e.code==='Space'){ e.preventDefault(); generateBtn?.click(); }
    if(e.key.toLowerCase()==='g'){ generateBtn?.click(); toast('Generated new palette'); }
    if(e.key.toLowerCase()==='c'){ if(livePreview?.textContent?.includes('#')){ const m=livePreview.textContent.match(/#([0-9a-f]{6})/i); const hex=m?('#'+m[1].toUpperCase()):null; if(hex){ navigator.clipboard.writeText(hex).then(()=>{ toast('Copied preview: '+hex); playPop(); }); } } }
  });

  initPaletteBoxes();
  // ==================== Restore Palette from Color Guide ====================
function restoreFromColorGuide() {
  const palette = document.querySelector('#palette');
  if (!palette) return;

  const stored = localStorage.getItem('mainPalette');
  if (!stored) return;

  try {
    const hexArray = JSON.parse(stored);
    const boxes = palette.querySelectorAll('.color-box');

    // if palette has fewer boxes than saved, create extra boxes
    while(boxes.length < hexArray.length){
      const box = document.createElement('div');
      box.className = 'color-box';
      const label = document.createElement('span');
      label.className = 'copy';
      box.appendChild(label);
      palette.appendChild(box);
    }

    const allBoxes = palette.querySelectorAll('.color-box');
    allBoxes.forEach((box, i) => {
      const hex = hexArray[i] || '#'+Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0');
      box.style.background = hex;
      box.dataset.hex = hex;
      const label = box.querySelector('.copy');
      if(label) label.textContent = hex.toUpperCase();
    });

    if(typeof toast === 'function') toast('Palette restored from Color Guide!');
  } catch(e) {
    console.warn('Failed to restore palette from Color Guide:', e);
  }
}

// Call after palette boxes are initialized
document.addEventListener('DOMContentLoaded', restoreFromColorGuide);


  /* ---------- Gradient ---------- */
  const gradColor1=$('#gradColor1'), gradColor2=$('#gradColor2'), gradAngle=$('#gradAngle'), angleVal=$('#angleVal'), gradPreview=$('#gradient-preview');
  const updateGradientPreview=()=>{ if(!gradPreview||!gradColor1||!gradColor2||!gradAngle||!angleVal) return; const a=gradColor1.value,b=gradColor2.value,ang=gradAngle.value; angleVal.textContent=`${ang}°`; gradPreview.style.background=`linear-gradient(${ang}deg, ${a}, ${b})`; };
  gradColor1?.addEventListener('input',updateGradientPreview); gradColor2?.addEventListener('input',updateGradientPreview); gradAngle?.addEventListener('input',updateGradientPreview);
  updateGradientPreview();

  $('#copyGradient')?.addEventListener('click',()=>{ if(!gradPreview)return toast('No gradient to copy'); const css=gradPreview.style.background; if(!css)return toast('No gradient to copy'); navigator.clipboard.writeText(`background: ${css};`).then(()=>{toast('Gradient CSS copied');playPop();}); });

  $('#export_grad_img')?.addEventListener('click',()=>{ if(!gradPreview||!gradColor1||!gradColor2||!gradAngle) return toast('No gradient to export'); const a=gradColor1.value,b=gradColor2.value,angle=parseFloat(gradAngle.value||'90'); if(!a||!b) return toast('No gradient to export'); const canvas=document.createElement('canvas'); canvas.width=1000; canvas.height=280; const ctx=canvas.getContext('2d'); const rad=angle*Math.PI/180; const x=Math.cos(rad),y=Math.sin(rad); const g=ctx.createLinearGradient(canvas.width/2-x*canvas.width/2,canvas.height/2-y*canvas.height/2,canvas.width/2+x*canvas.width/2,canvas.height/2+y*canvas.height/2); g.addColorStop(0,a); g.addColorStop(1,b); ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height); const link=Object.assign(document.createElement('a'),{href:canvas.toDataURL('image/png'),download:'gradient.png'}); link.click(); toast('Gradient saved as PNG'); });
/* =========================================================================
   Advanced Harmony & Shades Generator — with chroma.js
   ========================================================================= */

// Generate harmony colors based on base color + mode
function generateHarmony(baseHex, mode = "complementary") {
  if (!chroma.valid(baseHex)) {
    console.warn("Invalid base color:", baseHex);
    return [];
  }

  switch (mode) {
    case "complementary":
      return [baseHex, chroma(baseHex).set("hsl.h", "+180").hex()];

    case "analogous":
      return chroma
        .scale([
          chroma(baseHex).set("hsl.h", "-30"),
          baseHex,
          chroma(baseHex).set("hsl.h", "+30"),
        ])
        .mode("lch")
        .colors(5);

    case "triadic":
      return [
        baseHex,
        chroma(baseHex).set("hsl.h", "+120").hex(),
        chroma(baseHex).set("hsl.h", "+240").hex(),
      ];

    case "split-complementary":
      return [
        baseHex,
        chroma(baseHex).set("hsl.h", "+150").hex(),
        chroma(baseHex).set("hsl.h", "+210").hex(),
      ];

    case "tetradic":
      return [
        baseHex,
        chroma(baseHex).set("hsl.h", "+90").hex(),
        chroma(baseHex).set("hsl.h", "+180").hex(),
        chroma(baseHex).set("hsl.h", "+270").hex(),
      ];

    case "monochrome":
    case "monochromatic": // alias
      return chroma
        .scale([chroma(baseHex).brighten(2), baseHex, chroma(baseHex).darken(2)])
        .mode("lab")
        .colors(5);

    default:
      return [baseHex];
  }
}

// Generate shades (light → dark)
function generateShades(baseHex, steps = 7) {
  if (!chroma.valid(baseHex)) return [];
  return chroma
    .scale([chroma(baseHex).brighten(2), baseHex, chroma(baseHex).darken(2)])
    .mode("lab")
    .colors(steps);
}

// Render swatches into grid
function renderColors(colors = [], gridSelector) {
  const grid = document.querySelector(gridSelector);
  if (!grid) return;

  grid.innerHTML = ""; // clear old swatches

  colors.forEach((hex) => {
    const swatch = document.createElement("div");
    swatch.className = "cg-swatch";
    swatch.style.background = hex;
    swatch.title = hex;
    swatch.style.position = "relative";

    const label = document.createElement("span");
    label.textContent = hex;
    Object.assign(label.style, {
      position: "absolute",
      bottom: "-18px",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "12px",
      color: "#333",
      background: "#fff",
      padding: "2px 4px",
      borderRadius: "4px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      whiteSpace: "nowrap",
    });

    swatch.appendChild(label);

    // click-to-copy
    swatch.addEventListener("click", () => {
      navigator.clipboard.writeText(hex).then(() => showToast(`${hex} copied!`));
    });

    grid.appendChild(swatch);
  });
}

// Toast helper for feedback
function showToast(msg) {
  let toast = document.querySelector(".cw-copy-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "cw-copy-toast";
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#333",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "6px",
      opacity: "0",
      transition: "opacity 0.3s",
      zIndex: 9999,
    });
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => (toast.style.opacity = "0"), 1800);
}

// Initialize harmony generator
document.addEventListener("DOMContentLoaded", () => {
  const harmonyBase = document.querySelector("#h_base");
  const harmonyMode = document.querySelector("#h_mode");
  const harmonyGenerate = document.querySelector("#h_generate");
  const harmonyCopy = document.querySelector("#h_copy");
  const harmonyAdd = document.querySelector("#h_add");
  const shadesAdd = document.querySelector("#sh_add");

  let lastHarmony = [];
  let lastShades = [];

  // Generate harmony
  function doGenerateHarmony() {
    const baseHex = harmonyBase?.value || "#03a9f4";
    let mode = harmonyMode?.value || "complementary";
    if (mode === "monochromatic") mode = "monochrome"; // normalize
    lastHarmony = generateHarmony(baseHex, mode);
    renderColors(lastHarmony, "#harmony_grid");

    // auto-generate shades when harmony is generated
    lastShades = generateShades(baseHex, 7);
    renderColors(lastShades, "#shades_grid");
  }

  // Generate button
  harmonyGenerate?.addEventListener("click", doGenerateHarmony);

  // Copy all button (only copies harmony colors, not shades)
  harmonyCopy?.addEventListener("click", () => {
    const hexes = [...document.querySelectorAll("#harmony_grid .cg-swatch")]
      .map((s) => s.title)
      .join(", ");
    if (hexes) {
      navigator.clipboard.writeText(hexes).then(() =>
        showToast("Harmony colors copied!")
      );
    }
  });

  // Add Harmony to Palette
  harmonyAdd?.addEventListener("click", () => {
    if (typeof addColor === "function" && lastHarmony.length) {
      lastHarmony.forEach((c) => addColor(c));
      showToast("Harmony added to palette!");
    }
  });

  // Add Shades to Palette
  shadesAdd?.addEventListener("click", () => {
    if (typeof addColor === "function" && lastShades.length) {
      lastShades.forEach((c) => addColor(c));
      showToast("Shades added to palette!");
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName))
      return;

    const key = e.key.toLowerCase();

    if (key === "h") {
      e.preventDefault();
      doGenerateHarmony();
      showToast("Harmony + Shades generated");
    }

    if (key === "c") {
      e.preventDefault();
      harmonyCopy?.click();
    }

    if (["1", "2", "3", "4", "5", "6"].includes(key)) {
      e.preventDefault();
      const modes = {
        "1": "complementary",
        "2": "analogous",
        "3": "triadic",
        "4": "split-complementary",
        "5": "tetradic",
        "6": "monochrome",
      };
      if (harmonyMode) harmonyMode.value = modes[key];
      doGenerateHarmony();
      showToast(`${modes[key]} mode`);
    }
  });

  // Auto-generate on load
  doGenerateHarmony();
});




/* ---------- Color Blindness Simulator ---------- */
const cbText = $('#cb_text'), cbBg = $('#cb_bg'), cbGrid = $('#cb_grid'), cbRatio = $('#cb_ratio');

const cbFilters = {
  protanopia: 'protanopia',
  deuteranopia: 'deuteranopia',
  tritanopia: 'tritanopia',
  achromatopsia: 'achromatopsia'
};

// Simplified simulation: show color blocks with CSS filter or fallback
function updateBlindness(){
  if(!cbText || !cbBg || !cbGrid) return;
  const fg = cbText.value || '#000000';
  const bg = cbBg.value || '#ffffff';
  const ratio = contrastRatio(fg, bg);
  if(cbRatio) cbRatio.textContent = `Contrast Ratio: ${ratio.toFixed(2)}:1`;
  cbGrid.innerHTML = '';
  Object.keys(cbFilters).forEach(k => {
    const d = document.createElement('div');
    d.className = 'preview-box';
    d.style.background = bg;
    d.style.color = fg;
    d.style.filter = (k === 'achromatopsia') ? 'grayscale(100%)' : '';
    d.textContent = k;
    d.style.padding = '8px';
    d.style.borderRadius = '6px';
    cbGrid.appendChild(d);
  });
}
$('#cb_text')?.addEventListener('input', updateBlindness);
$('#cb_bg')?.addEventListener('input', updateBlindness);
updateBlindness();


// Toast helper
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
}


/* ---------- Help overlay & highlight ---------- */
(function helpOverlayModule(){
  const helpOverlay = $('#help-overlay');
  const openHelpBtn = $('#open-help');
  const closeHelpBtn = $('#close-help');
  const nextBtn = $('#next-step');
  const prevBtn = $('#prev-step');
  const steps = $$('.help-step');

  const stepsData = [
    { text: 'Click here to generate a palette.', selector: '#generate-btn' },
    { text: 'Your generated colors will appear here.', selector: '#palette' },
    { text: 'Check color contrast for accessibility.', selector: '#color1' },
    { text: 'Use Tab to navigate inputs and Enter/Space to generate.', selector: '#startBtn' },
    { text: 'Use extra tools to export or save palettes.', selector: '#extra-tools' }
  ];

  let currentStep = 0;
  let currentHighlight = [];

  function highlightElement(selector, message){
    const el = document.querySelector(selector);
    if(!el) return [];
    const rect = el.getBoundingClientRect();
    const overlayEl = document.createElement('div');
    overlayEl.className = 'highlight-overlay';
    Object.assign(overlayEl.style, {
      position: 'absolute',
      top: `${rect.top + window.scrollY - 6}px`,
      left: `${rect.left - 6}px`,
      width: `${rect.width + 12}px`,
      height: `${rect.height + 12}px`,
      border: '3px solid rgba(108,99,255,0.95)',
      borderRadius: '10px',
      pointerEvents: 'none',
      zIndex: 9999
    });
    const tip = document.createElement('div');
    tip.className = 'highlight-tooltip';
    tip.textContent = message;
    Object.assign(tip.style, {
      position: 'absolute',
      top: `${rect.top + window.scrollY - 40}px`,
      left: `${rect.left}px`,
      background: '#111',
      color: '#fff',
      padding: '6px 10px',
      borderRadius: '8px',
      zIndex: 10000,
      pointerEvents: 'none'
    });
    document.body.appendChild(overlayEl);
    document.body.appendChild(tip);
    return [overlayEl, tip];
  }

  function removeHighlight(h, t){ h?.remove(); t?.remove(); }

  function showStep(i){
    steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
    if(prevBtn) prevBtn.disabled = (i === 0);
    if(nextBtn) nextBtn.disabled = (i === steps.length - 1);
    if(currentHighlight.length) removeHighlight(...currentHighlight);
    const data = stepsData[i];
    if(data?.selector) currentHighlight = highlightElement(data.selector, data.text);
  }

  openHelpBtn?.addEventListener('click', ()=>{ helpOverlay?.classList.remove('hidden'); showStep(currentStep = 0); });
  closeHelpBtn?.addEventListener('click', ()=>{ helpOverlay?.classList.add('hidden'); if(currentHighlight.length) removeHighlight(...currentHighlight); });
  nextBtn?.addEventListener('click', ()=>{ if(currentStep < steps.length - 1) currentStep++; showStep(currentStep); });
  prevBtn?.addEventListener('click', ()=>{ if(currentStep > 0) currentStep--; showStep(currentStep); });

})();

/* ---------- Small demo animation for contrast sample ---------- */
(function demoContrastAnimation(){
  const contrastBox = document.querySelector('.contrast-animation .text-sample');
  if(!contrastBox) return;
  const demo = [{bg:'#fff', text:'#000'},{bg:'#000', text:'#fff'},{bg:'#3498db', text:'#fff'},{bg:'#f1c40f', text:'#000'}];
  let idx = 0;
  setInterval(()=>{ contrastBox.style.backgroundColor = demo[idx].bg; contrastBox.style.color = demo[idx].text; idx = (idx+1) % demo.length; }, 2000);
})();

/* ---------- Extra keyboard shortcuts & integrations ---------- */
document.addEventListener('keydown', (e) => {
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;

  const key = e.key.toLowerCase();

  // Harmony generate / copy
  if(key === 'h'){
    e.preventDefault();
    $('#h_generate')?.click();
    toast('Harmony generated');
  }
  if(key === 'y'){ // copy first shade/tint
    e.preventDefault();
    const first = $('#sh_grid')?.querySelector('.shade-box');
    if(first) navigator.clipboard.writeText(first.textContent).then(()=>{ toast('Copied: ' + first.textContent); playPop(); });
  }
  if(key === 'e'){ // export gradient image
    e.preventDefault();
    $('#export_grad_img')?.click();
  }
  if(key === 'v'){ // export css variables
    e.preventDefault();
    exportCssVariables();
  }
  if(key === 's'){ // save palette
    e.preventDefault();
    saveCurrentPalette();
    toast('Palette saved');
  }
});

/* ---------- Final safety / init calls ---------- */
try {
  // Ensure some UI pieces are populated on load
  if($('#h_generate')) $('#h_generate').dispatchEvent(new Event('click'));
  if($('#sh_generate')) $('#sh_generate').dispatchEvent(new Event('click'));
} catch(e){ /* ignore */ }
});


/* ==============================
   UX Enhancements — Smooth Hover, Copy Formats, Drag Animation
   ============================== */
document.addEventListener('DOMContentLoaded', () => {

  const palette = document.getElementById('palette');
  if (!palette) return;

  // Smooth live preview transition
  const livePreview = document.getElementById('live-preview');
  if (livePreview) {
    livePreview.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }

  // Copy HEX, RGB, HSL on click
  palette.addEventListener('click', (ev) => {
    const box = ev.target.closest('.color-box');
    if (!box || !box.dataset.hex) return;
    const hex = box.dataset.hex;
    const [r, g, b] = hexToRgb(hex);
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const [h, s, l] = hexToHsl(hex);
    const hsl = `hsl(${h}, ${s}%, ${l}%)`;
    const formats = [hex, rgb, hsl];

    navigator.clipboard.writeText(formats.join('\n'))
      .then(() => { toast(`Copied:\n${formats.join('\n')}`); playPop(); })
      .catch(() => { toast('Copied to clipboard'); });
  });

  // Drag & drop smooth animation
  let dragged = null;
  palette.addEventListener('dragstart', e => {
    const box = e.target.closest('.color-box');
    if (!box) return;
    dragged = box;
    box.style.opacity = '0.6';
    try { e.dataTransfer.setData('text/plain', box.dataset.hex || ''); } catch (_) {}
  });

  palette.addEventListener('dragend', () => {
    if (dragged) dragged.style.opacity = '1';
    dragged = null;
  });

  const getDragAfterElement = (container, x) => {
    const boxes = [...container.querySelectorAll('.color-box:not(.dragging)')];
    return boxes.reduce((closest, child) => {
      const rect = child.getBoundingClientRect();
      const offset = x - rect.left - rect.width / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element || null;
  };

  palette.addEventListener('dragover', e => {
    e.preventDefault();
    if (!dragged) return;
    const after = getDragAfterElement(palette, e.clientX);
    if (!after) palette.appendChild(dragged);
    else palette.insertBefore(dragged, after);
  });

});
/* ==============================
   Keyboard Shortcuts & Live Mockup
   ============================== */
document.addEventListener('DOMContentLoaded', () => {

  const palette = document.getElementById('palette');
  if (!palette) return;

  const livePreview = document.getElementById('live-preview');

  // Mockup element to apply palette colors
  let mockup = document.getElementById('mockup-preview');
  if (!mockup) {
    mockup = document.createElement('div');
    mockup.id = 'mockup-preview';
    Object.assign(mockup.style, {
      marginTop: '20px',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      minHeight: '60px',
      textAlign: 'center',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    });
    mockup.textContent = ' selected live color preview ';
    palette.parentNode.insertBefore(mockup, palette.nextSibling);
  }

  // Apply hovered color to mockup
  palette.addEventListener('mouseover', ev => {
    const box = ev.target.closest('.color-box');
    if (!box || !box.dataset.hex) return;
    const hex = box.dataset.hex;
    if (livePreview && livePreview.textContent.includes(hex)) return; // locked preview
    mockup.style.backgroundColor = hex;
    mockup.style.color = getReadableText(hex);
  });

  palette.addEventListener('mouseleave', () => {
    mockup.style.backgroundColor = '';
    mockup.style.color = '';
    mockup.textContent = 'Live Mockup Preview';
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;

    const generateBtn = document.getElementById('generate-btn');

    switch(e.key.toLowerCase()) {
      case 'g': // Generate palette
        e.preventDefault();
        generateBtn?.click();
        toast('Generated new palette');
        break;
      case 'c': // Copy live preview color
        e.preventDefault();
        if (livePreview?.textContent?.includes('#')) {
          const m = livePreview.textContent.match(/#([0-9a-f]{6})/i);
          const hex = m ? ('#' + m[1].toUpperCase()) : null;
          if (hex) navigator.clipboard.writeText(hex).then(() => { toast(`Copied: ${hex}`); playPop(); });
        }
        break;
      case 'm': // Toggle mockup visibility
        e.preventDefault();
        if (mockup) mockup.style.display = mockup.style.display === 'none' ? 'block' : 'none';
        break;
    }
  });

});
/* =========================================================================
   Accessibility Enhancements: Contrast & Color Blind Simulation
   ========================================================================= */

// Contrast suggestion helper
function suggestContrast(fgHex, bgHex) {
  const ratio = contrastRatio(fgHex, bgHex);
  let suggestion = '';
  if (ratio < 4.5) { // below WCAG AA for normal text
    suggestion = '⚠ Low contrast! Consider using ';
    suggestion += luminance(bgHex) > luminance(fgHex) ? '#000000' : '#FFFFFF';
    suggestion += ' for better readability.';
  }
  return suggestion;
}

// Color blind simulation filters
const colorBlindFilters = {
  protanopia: 'url(#protanopia)',
  deuteranopia: 'url(#deuteranopia)',
  tritanopia: 'url(#tritanopia)',
  achromatopsia: 'grayscale(100%)'
};

// Create live preview for contrast and color-blind mode
const createAccessibilityPreview = () => {
  if ($('#accessibility-preview')) return; // already exists
  const container = document.createElement('div');
  container.id = 'accessibility-preview';
  container.style.display = 'flex';
  container.style.gap = '10px';
  container.style.marginTop = '12px';
  document.body.appendChild(container);
  Object.keys(colorBlindFilters).forEach(type => {
    const box = document.createElement('div');
    box.className = 'cb-preview';
    box.style.padding = '10px';
    box.style.minWidth = '80px';
    box.style.textAlign = 'center';
    box.style.border = '1px solid #ccc';
    box.style.borderRadius = '6px';
    box.textContent = type;
    box.style.filter = colorBlindFilters[type];
    container.appendChild(box);
  });
};

createAccessibilityPreview();

// Update contrast & color blind previews when hovering colors
palette?.addEventListener('mouseover', ev => {
  const box = ev.target.closest('.color-box');
  if (!box || !box.dataset.hex) return;
  const fg = box.dataset.hex;
  const bg = '#ffffff'; // assume white background for preview, can be dynamic
  const msg = suggestContrast(fg, bg);
  $('#contrast-message')?.remove();
  if (msg) {
    const el = document.createElement('div');
    el.id = 'contrast-message';
    el.style.color = '#ff3333';
    el.style.marginTop = '6px';
    el.textContent = msg;
    palette.parentNode.insertBefore(el, palette.nextSibling);
  }

  // Update color-blind previews
  const cbBoxes = $$('.cb-preview');
  cbBoxes.forEach(cb => {
    cb.style.backgroundColor = bg;
    cb.style.color = fg;
  });
});

// Remove contrast message when leaving palette
palette?.addEventListener('mouseleave', () => {
  $('#contrast-message')?.remove();
  const cbBoxes = $$('.cb-preview');
  cbBoxes.forEach(cb => {
    cb.style.backgroundColor = '#ffffff';
    cb.style.color = '#000000';
  });
});
/* =========================================================================
   Accessibility Enhancements: Font Pairing Suggestions
   ========================================================================= */

// Basic font recommendation logic
const fontPairs = [
  { name: 'Sans-serif', fonts: ['Arial', 'Helvetica', 'Verdana', 'Roboto'] },
  { name: 'Serif', fonts: ['Georgia', 'Times New Roman', 'Merriweather'] },
  { name: 'Monospace', fonts: ['Courier New', 'Lucida Console', 'Fira Code'] },
  { name: 'Display', fonts: ['Oswald', 'Montserrat', 'Poppins'] }
];

// Create font suggestion container if not exists
const createFontPreview = () => {
  if ($('#font-preview-container')) return;
  const container = document.createElement('div');
  container.id = 'font-preview-container';
  container.style.marginTop = '12px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '6px';
  document.body.appendChild(container);

  fontPairs.forEach(pair => {
    const el = document.createElement('div');
    el.className = 'font-pair';
    el.textContent = `${pair.name}: ${pair.fonts.join(', ')}`;
    el.style.fontFamily = pair.fonts.join(', ');
    el.style.border = '1px dashed #ccc';
    el.style.padding = '6px 10px';
    el.style.borderRadius = '6px';
    container.appendChild(el);
  });
};

createFontPreview();

// Update font preview dynamically based on palette color
palette?.addEventListener('mouseover', ev => {
  const box = ev.target.closest('.color-box');
  if (!box || !box.dataset.hex) return;
  const fg = box.dataset.hex;

  $$('.font-pair').forEach(el => {
    el.style.backgroundColor = '#ffffff';  // optional: or dynamic bg
    el.style.color = fg;
  });
});

// Reset font preview colors on mouse leave
palette?.addEventListener('mouseleave', () => {
  $$('.font-pair').forEach(el => {
    el.style.color = '#000000';
    el.style.backgroundColor = '#ffffff';
  });
});
/* =========================================================================
   Advanced Palette Features: Gradient Creation & Tints/Shades Generator
   ========================================================================= */

// --------- Gradient Preview & Export ---------
const gradientContainer = document.createElement('div');
gradientContainer.id = 'gradient-container';
gradientContainer.style.marginTop = '12px';
gradientContainer.style.display = 'flex';
gradientContainer.style.flexDirection = 'column';
gradientContainer.style.gap = '6px';
document.body.appendChild(gradientContainer);

const gradientPreview = document.createElement('div');
gradientPreview.id = 'gradient-preview';
gradientPreview.style.height = '60px';
gradientPreview.style.borderRadius = '6px';
gradientPreview.style.border = '1px solid #ccc';
gradientPreview.style.transition = 'background 0.5s ease';
gradientContainer.appendChild(gradientPreview);

const gradientText = document.createElement('div');
gradientText.textContent = 'Hover over 2 colors to create gradient';
gradientText.style.fontSize = '12px';
gradientContainer.appendChild(gradientText);

let gradientColors = [];
palette?.addEventListener('mouseover', ev => {
  const box = ev.target.closest('.color-box');
  if (!box || !box.dataset.hex) return;
  const hex = box.dataset.hex;

  if (!gradientColors.includes(hex)) {
    gradientColors.push(hex);
    if (gradientColors.length > 2) gradientColors.shift();
  }

  if (gradientColors.length === 2) {
    gradientPreview.style.background = `linear-gradient(90deg, ${gradientColors[0]}, ${gradientColors[1]})`;
    gradientText.textContent = `Gradient: ${gradientColors[0]} → ${gradientColors[1]}`;
  }
});

// Reset gradient on mouse leave
palette?.addEventListener('mouseleave', () => {
  gradientColors = [];
  gradientPreview.style.background = '';
  gradientText.textContent = 'Hover over 2 colors to create gradient';
});

// Export gradient CSS
const exportGradientBtn = document.createElement('button');
exportGradientBtn.textContent = 'Copy Gradient CSS';
exportGradientBtn.style.marginTop = '6px';
exportGradientBtn.type = 'button';
gradientContainer.appendChild(exportGradientBtn);

exportGradientBtn.addEventListener('click', () => {
  if (gradientColors.length !== 2) return toast('Hover over 2 colors first');
  const css = `background: linear-gradient(90deg, ${gradientColors[0]}, ${gradientColors[1]});`;
  navigator.clipboard.writeText(css).then(() => toast('Gradient CSS copied'), () => toast('Copy failed'));
});


// --------- Tints & Shades Generator ---------
const shadeContainer = document.createElement('div');
shadeContainer.id = 'shade-container';
shadeContainer.style.marginTop = '12px';
shadeContainer.style.display = 'flex';
shadeContainer.style.flexWrap = 'wrap';
shadeContainer.style.gap = '6px';
document.body.appendChild(shadeContainer);

const generateTintsShades = (baseHex) => {
  shadeContainer.innerHTML = '';
  const [h, s, l] = hexToHsl(baseHex);
  for (let i = 10; i <= 90; i += 10) {
    const tint = hslToHex(h, s, i);
    const shade = hslToHex(h, s, 100 - i);

    [tint, shade].forEach(c => {
      const box = document.createElement('div');
      box.className = 'shade-box';
      box.style.background = c;
      box.textContent = c;
      box.style.padding = '6px';
      box.style.borderRadius = '4px';
      box.style.cursor = 'pointer';
      box.addEventListener('click', () => {
        navigator.clipboard.writeText(c).then(()=>toast('Copied ' + c));
      });
      shadeContainer.appendChild(box);
    });
  }
};

// Trigger tints/shades generation on palette hover
palette?.addEventListener('mouseover', ev => {
  const box = ev.target.closest('.color-box');
  if (!box || !box.dataset.hex) return;
  generateTintsShades(box.dataset.hex);
});
/* =========================================================================
   Advanced Harmony + Shade Generator (Unified)
   ========================================================================= */

(() => {
  const harmonyBase = $('#h_base');
  const harmonyMode = $('#h_mode');
  const harmonyGrid = $('#harmony_grid');
  const harmonyGenerate = $('#h_generate');
  const harmonyCopy = $('#h_copy');
  const harmonyAdd = $('#h_add'); // Add Harmony to Palette

  const shadeBase = $('#sh_base');
  const shadeGrid = $('#sh_grid');
  const shadeGenerate = $('#sh_generate');
  const shadeCopy = $('#sh_copy');
  const shadeAdd = $('#sh_add'); // Add Shades to Palette

  /* ---------------- Color Helpers ---------------- */
  function hexToHsl(H) {
    let r = 0, g = 0, b = 0;
    if (H.length === 4) {
      r = "0x" + H[1] + H[1];
      g = "0x" + H[2] + H[2];
      b = "0x" + H[3] + H[3];
    } else if (H.length === 7) {
      r = "0x" + H[1] + H[2];
      g = "0x" + H[3] + H[4];
      b = "0x" + H[5] + H[6];
    }
    r /= 255; g /= 255; b /= 255;
    const cmin = Math.min(r, g, b);
    const cmax = Math.max(r, g, b);
    const delta = cmax - cmin;
    let h = 0, s = 0, l = (cmax + cmin) / 2;
    if (delta !== 0) {
      switch (cmax) {
        case r: h = ((g - b) / delta) % 6; break;
        case g: h = (b - r) / delta + 2; break;
        case b: h = (r - g) / delta + 4; break;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    return [h, s, l];
  }

  function hslToHex(h, s, l) {
    l = Math.min(1, Math.max(0, l));
    s = Math.min(1, Math.max(0, s));
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  /* ---------------- Harmony Generator ---------------- */
  function generateHarmony(baseHex, mode = "complementary") {
    if (!baseHex) return [];

    // Use chroma.js if available
    if (typeof chroma !== "undefined" && chroma.valid(baseHex)) {
      switch (mode) {
        case "complementary":
          return [baseHex, chroma(baseHex).set("hsl.h", "+180").hex()];
        case "analogous":
          return chroma.scale([
            chroma(baseHex).set("hsl.h", "-30"),
            baseHex,
            chroma(baseHex).set("hsl.h", "+30"),
          ]).mode("lch").colors(5);
        case "triadic":
          return [
            baseHex,
            chroma(baseHex).set("hsl.h", "+120").hex(),
            chroma(baseHex).set("hsl.h", "+240").hex(),
          ];
        case "split-complementary":
          return [
            baseHex,
            chroma(baseHex).set("hsl.h", "+150").hex(),
            chroma(baseHex).set("hsl.h", "+210").hex(),
          ];
        case "tetradic":
          return [
            baseHex,
            chroma(baseHex).set("hsl.h", "+90").hex(),
            chroma(baseHex).set("hsl.h", "+180").hex(),
            chroma(baseHex).set("hsl.h", "+270").hex(),
          ];
        case "monochrome":
        case "monochromatic":
          return chroma.scale([
            chroma(baseHex).brighten(2),
            baseHex,
            chroma(baseHex).darken(2),
          ]).mode("lab").colors(5);
      }
    }

    // Fallback manual HSL
    const [h, s, l] = hexToHsl(baseHex);
    switch (mode) {
      case "complementary":
        return [baseHex, hslToHex((h + 180) % 360, s, l)];
      case "analogous":
        return [
          hslToHex((h - 30 + 360) % 360, s, l),
          baseHex,
          hslToHex((h + 30) % 360, s, l),
        ];
      case "triadic":
        return [
          baseHex,
          hslToHex((h + 120) % 360, s, l),
          hslToHex((h + 240) % 360, s, l),
        ];
      case "split-complementary":
        return [
          baseHex,
          hslToHex((h + 150) % 360, s, l),
          hslToHex((h + 210) % 360, s, l),
        ];
      case "tetradic":
        return [
          baseHex,
          hslToHex((h + 90) % 360, s, l),
          hslToHex((h + 180) % 360, s, l),
          hslToHex((h + 270) % 360, s, l),
        ];
      case "monochrome":
        return [
          hslToHex(h, s, Math.max(0, l - 0.25)),
          hslToHex(h, s, Math.max(0, l - 0.1)),
          baseHex,
          hslToHex(h, s, Math.min(1, l + 0.1)),
          hslToHex(h, s, Math.min(1, l + 0.25)),
        ];
    }
    return [baseHex];
  }

  function renderHarmony(colors = []) {
    if (!harmonyGrid) return;
    harmonyGrid.innerHTML = "";
    colors.forEach(hex => {
      const swatch = document.createElement("div");
      swatch.className = "cg-swatch";
      swatch.style.background = hex;
      swatch.title = hex;

      const label = document.createElement("span");
      label.textContent = hex;
      label.className = "swatch-label";
      swatch.appendChild(label);

      swatch.addEventListener("click", () => {
        navigator.clipboard.writeText(hex).then(() => {
          toast(`${hex} copied`);
          playPop();
        });
      });
      harmonyGrid.appendChild(swatch);
    });
  }

  function doGenerateHarmony() {
    const baseHex = harmonyBase?.value || "#03a9f4";
    let mode = harmonyMode?.value || "complementary";
    if (mode === "monochromatic") mode = "monochrome";
    const result = generateHarmony(baseHex, mode);
    renderHarmony(result);
    return result;
  }

  /* ---------------- Shade Generator ---------------- */
  function generateShades(baseHex, steps = 7) {
    if (!baseHex) return [];
    if (typeof chroma !== "undefined" && chroma.valid(baseHex)) {
      return chroma.scale([chroma(baseHex).brighten(2), baseHex, chroma(baseHex).darken(2)])
        .mode("lab")
        .colors(steps);
    }
    const [h, s, l] = hexToHsl(baseHex);
    let shades = [];
    for (let i = -Math.floor(steps / 2); i <= Math.floor(steps / 2); i++) {
      const adj = Math.min(1, Math.max(0, l + i * 0.1));
      shades.push(hslToHex(h, s, adj));
    }
    return shades;
  }

  function renderShades(colors = []) {
    if (!shadeGrid) return;
    shadeGrid.innerHTML = "";
    colors.forEach(hex => {
      const swatch = document.createElement("div");
      swatch.className = "shade-box";
      swatch.style.background = hex;
      swatch.textContent = hex;

      swatch.addEventListener("click", () => {
        navigator.clipboard.writeText(hex).then(() => {
          toast(`${hex} copied`);
          playPop();
        });
      });
      shadeGrid.appendChild(swatch);
    });
  }

  function doGenerateShades() {
    const baseHex = shadeBase?.value || "#03a9f4";
    const result = generateShades(baseHex, 7);
    renderShades(result);
    return result;
  }

  /* ---------------- Event Bindings ---------------- */
  harmonyGenerate?.addEventListener("click", doGenerateHarmony);
  harmonyCopy?.addEventListener("click", () => {
    const hexes = [...harmonyGrid.querySelectorAll(".cg-swatch")].map(s => s.title).join(", ");
    navigator.clipboard.writeText(hexes).then(() => toast("All harmony colors copied!"));
  });
  harmonyAdd?.addEventListener("click", () => {
    const colors = doGenerateHarmony();
    colors.forEach(c => addColor(c));
    toast("Harmony added to palette");
  });

  shadeGenerate?.addEventListener("click", doGenerateShades);
  shadeCopy?.addEventListener("click", () => {
    const hexes = [...shadeGrid.querySelectorAll(".shade-box")].map(s => s.textContent).join(", ");
    navigator.clipboard.writeText(hexes).then(() => toast("All shades copied!"));
  });
  shadeAdd?.addEventListener("click", () => {
    const colors = doGenerateShades();
    colors.forEach(c => addColor(c));
    toast("Shades added to palette");
  });

  /* ---------------- Keyboard Shortcuts ---------------- */
  document.addEventListener("keydown", e => {
    if (["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) return;
    const key = e.key.toLowerCase();

    if (key === "h") { doGenerateHarmony(); toast("Harmony generated"); }
    if (key === "c") { harmonyCopy?.click(); }
    if (key === "a") { harmonyAdd?.click(); }
    if (key === "s") { doGenerateShades(); toast("Shades generated"); }
    if (key === "d") { shadeAdd?.click(); }
    if (e.shiftKey && key === "a") {
      const all = [...doGenerateHarmony(), ...doGenerateShades()];
      all.forEach(c => addColor(c));
      toast("Harmony + Shades added to palette");
    }
    if (["1","2","3","4","5","6"].includes(key)) {
      const modes = {
        "1": "complementary",
        "2": "analogous",
        "3": "triadic",
        "4": "split-complementary",
        "5": "tetradic",
        "6": "monochrome",
      };
      harmonyMode.value = modes[key];
      doGenerateHarmony();
      toast(`${modes[key]} mode`);
    }
  });

  /* ---------------- Auto-generate on Load ---------------- */
  doGenerateHarmony();
  doGenerateShades();
})();

/* ---------- Tints & Shades Generator ---------- */
$('#sh_generate')?.addEventListener('click', () => {
  const base = $('#sh_base')?.value || '#ff6600';
  const [h, s, l] = hexToHsl(base);
  const grid = $('#sh_grid'); 
  if (!grid) return;

  grid.innerHTML = '';
  for (let i = 10; i <= 90; i += 10) {
    const tint = hslToHex(h, s, Math.min(100, l + i));   // lighter
    const shade = hslToHex(h, s, Math.max(0, l - i));    // darker
    [tint, shade].forEach(c => {
      const d = document.createElement('div');
      d.className = 'shade-box';
      d.style.background = c;
      d.textContent = c;
      d.addEventListener('click', () => {
        navigator.clipboard.writeText(c).then(() => {
          toast('Copied ' + c);
          playPop();
        });
      });
      d.addEventListener('mouseover', () => updateLivePreview(c));
      d.addEventListener('mouseleave', () => resetLivePreview());
      grid.appendChild(d);
    });
  }
});

/* ---------- Tints & Shades Keyboard Shortcuts ---------- */
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  const generateShadesBtn = $('#sh_generate');

  if (e.key.toLowerCase() === 't') { // Press T to generate tints & shades
    e.preventDefault();
    generateShadesBtn?.click();
    toast('Tints & Shades generated');
  }
});
/* ---------- Gradient Generator & Export ---------- */
(function(){
  const gradColor1 = $('#gradColor1');
  const gradColor2 = $('#gradColor2');
  const gradAngle = $('#gradAngle');
  const gradPreview = $('#gradient-preview');
  const angleVal = $('#angleVal');

  const updateGradient = () => {
    if (!gradPreview || !gradColor1 || !gradColor2 || !gradAngle || !angleVal) return;
    const c1 = gradColor1.value;
    const c2 = gradColor2.value;
    const angle = gradAngle.value;
    angleVal.textContent = `${angle}°`;
    gradPreview.style.background = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
  };

  gradColor1?.addEventListener('input', updateGradient);
  gradColor2?.addEventListener('input', updateGradient);
  gradAngle?.addEventListener('input', updateGradient);
  updateGradient();

  // Copy gradient CSS to clipboard
  $('#copyGradient')?.addEventListener('click', () => {
    if (!gradPreview) return toast('No gradient to copy');
    const css = gradPreview.style.background;
    if (!css) return toast('No gradient to copy');
    navigator.clipboard.writeText(`background: ${css};`).then(() => {
      toast('Gradient CSS copied'); 
      playPop();
    });
  });

  // Export gradient as PNG
  $('#export_grad_img')?.addEventListener('click', () => {
    if (!gradPreview || !gradColor1 || !gradColor2 || !gradAngle) return toast('No gradient to export');
    const c1 = gradColor1.value, c2 = gradColor2.value;
    const angle = parseFloat(gradAngle.value || '90');
    if (!c1 || !c2) return toast('No gradient to export');

    const canvas = document.createElement('canvas');
    canvas.width = 1000; 
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    const rad = angle * Math.PI / 180;
    const x = Math.cos(rad), y = Math.sin(rad);
    const g = ctx.createLinearGradient(
      canvas.width/2 - x*canvas.width/2,
      canvas.height/2 - y*canvas.height/2,
      canvas.width/2 + x*canvas.width/2,
      canvas.height/2 + y*canvas.height/2
    );
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const link = Object.assign(document.createElement('a'), {
      href: canvas.toDataURL('image/png'),
      download: 'gradient.png'
    });
    link.click();
    toast('Gradient saved as PNG');
  });
})();
/* ---------- Gradient Keyboard Shortcuts ---------- */
document.addEventListener('keydown', e => {
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;

  const gradBtnCopy = $('#copyGradient');
  const gradBtnExport = $('#export_grad_img');

  if(e.key.toLowerCase() === 'g') { 
    // Update preview instantly
    const update = document.querySelector('#gradColor1') && document.querySelector('#gradColor2') && document.querySelector('#gradAngle');
    if(update) { 
      const evt = new Event('input'); 
      document.querySelector('#gradColor1').dispatchEvent(evt);
      document.querySelector('#gradColor2').dispatchEvent(evt);
      document.querySelector('#gradAngle').dispatchEvent(evt);
      toast('Gradient preview updated'); 
    }
  }

  if(e.key.toLowerCase() === 'c') {
    gradBtnCopy?.click(); // Copy gradient CSS
  }

  if(e.key.toLowerCase() === 'e') {
    gradBtnExport?.click(); // Export gradient as PNG
  }
});
/* ---------- Tints & Shades Generator ---------- */
const shBaseInput = $('#sh_base');
const shGrid = $('#sh_grid');
const shGenerateBtn = $('#sh_generate');

const generateShadesTints = (baseHex) => {
  if(!shGrid) return;
  shGrid.innerHTML = '';
  const [h,s,l] = hexToHsl(baseHex);
  for(let i = 10; i <= 90; i+=10){
    const tint = hslToHex(h, s, i);        // lighter
    const shade = hslToHex(h, s, 100-i);   // darker
    [tint, shade].forEach(color => {
      const box = document.createElement('div');
      box.className = 'shade-box';
      box.style.background = color;
      box.textContent = color;
      box.addEventListener('click', () => {
        navigator.clipboard.writeText(color).then(() => { toast('Copied: '+color); playPop(); });
      });
      shGrid.appendChild(box);
    });
  }
};

shGenerateBtn?.addEventListener('click', () => {
  const base = shBaseInput?.value || '#ff6600';
  generateShadesTints(base);
  toast('Tints & Shades generated');
});

/* ---------- Tints & Shades Keyboard Shortcuts ---------- */
document.addEventListener('keydown', e => {
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
  
  if(e.key.toLowerCase() === 't') { // T for Tints & Shades
    shGenerateBtn?.click();
  }
  if(e.key.toLowerCase() === 'y') { // Y to copy first shade/tint
    const first = shGrid?.querySelector('.shade-box');
    if(first){
      navigator.clipboard.writeText(first.textContent).then(() => { toast('Copied: '+first.textContent); playPop(); });
    }
  }
});
/* ---------- Workflow & Integration Enhancements ---------- */
const recentPalettesKey = 'cw_recent_palettes';
const maxRecent = 10;
const exportCssBtn = $('#export_css');
const savePaletteBtn = $('#save_palette');
const recentGrid = $('#recent_palettes');

// Save current palette to localStorage
const saveCurrentPalette = () => {
  if(!palette) return toast('No palette to save');
  const colors = $$('.color-box', palette).map(b => b.dataset.hex).filter(Boolean);
  if(!colors.length) return toast('No colors to save');

  let recents = JSON.parse(localStorage.getItem(recentPalettesKey) || '[]');
  recents = [colors, ...recents.filter(p => JSON.stringify(p) !== JSON.stringify(colors))];
  if(recents.length > maxRecent) recents = recents.slice(0, maxRecent);
  localStorage.setItem(recentPalettesKey, JSON.stringify(recents));
  toast('Palette saved locally');
  renderRecentPalettes();
};

// Render recent palettes
const renderRecentPalettes = () => {
  if(!recentGrid) return;
  recentGrid.innerHTML = '';
  const recents = JSON.parse(localStorage.getItem(recentPalettesKey) || '[]');
  recents.forEach((colors, idx) => {
    const div = document.createElement('div');
    div.className = 'recent-palette';
    colors.forEach(c => {
      const box = document.createElement('div');
      box.className = 'shade-box';
      box.style.background = c;
      box.title = c;
      box.addEventListener('click', () => {
        navigator.clipboard.writeText(c).then(()=>{ toast('Copied: '+c); playPop(); });
      });
      div.appendChild(box);
    });
    div.addEventListener('click', () => {
      // Load this palette back into main palette
      $$('.color-box', palette).forEach((b, i) => {
        if(colors[i]) { b.style.background = colors[i]; b.dataset.hex = colors[i]; b.querySelector('.copy').textContent = colors[i]; }
      });
      toast('Palette loaded');
    });
    recentGrid.appendChild(div);
  });
};

// Export palette as CSS variables
const exportCssVariables = () => {
  if(!palette) return toast('No colors to export');
  const colors = $$('.color-box', palette).map((b,i) => `--color${i+1}: ${b.dataset.hex};`).join('\n');
  navigator.clipboard.writeText(`:root {\n${colors}\n}`).then(()=>{ toast('CSS variables copied'); playPop(); });
};

// Event bindings
savePaletteBtn?.addEventListener('click', saveCurrentPalette);
exportCssBtn?.addEventListener('click', exportCssVariables);

// Initialize recent palettes on load
renderRecentPalettes();

/* ---------- Keyboard Shortcuts ---------- */
document.addEventListener('keydown', e => {
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;

  if(e.key.toLowerCase() === 's') { // S to save palette
    saveCurrentPalette();
  }
  if(e.key.toLowerCase() === 'v') { // V to export CSS variables
    exportCssVariables();
  }
});
/* ---------- Visual & Interactive Enhancements ---------- */
/* Color World — Unified app script
   - Palette manager (add/apply/delete/select/drag/persist)
   - Exports (PNG / JSON / CSS / gradient)
   - Coloris init
   - Advanced Harmony (chroma.js optional)
   - Preview & tooltips & help overlay
   Drop this in as one script (replace your old script files).
*/
(() => {
  'use strict';

  // ---------- Helpers ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

  // Toast: uses #toast if present else alert fallback
  const toastEl = $('#toast');
  function showToast(msg, ms = 1600) {
    if (toastEl) {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => toastEl.classList.remove('show'), ms);
    } else {
      // fallback to console + alert to be safe (non-blocking)
      console.log('[toast]', msg);
      // don't alert in production automatically to avoid annoyance, only when no UI toast
      //alert(msg);
    }
  }

  // Normalize color to #RRGGBB (uppercase) or return null
  function normalizeColor(input) {
    if (!input && input !== '') return null;
    const s = input.trim();
    if (!s) return null;

    // direct hex (#RGB or #RRGGBB)
    const hex3 = /^#?([0-9a-f]{3})$/i;
    const hex6 = /^#?([0-9a-f]{6})$/i;
    if (hex6.test(s)) {
      const m = s.match(hex6)[1];
      return '#' + m.toUpperCase();
    }
    if (hex3.test(s)) {
      const m = s.match(hex3)[1];
      return '#' + (m.split('').map(c => c + c).join('')).toUpperCase();
    }

    // if chroma.js is available, use it (accepts names / rgb / hsl / css)
    try {
      if (typeof chroma !== 'undefined' && chroma.valid(s)) {
        return chroma(s).hex().toUpperCase();
      }
    } catch (e) {
      // continue to fallback
    }

    // fallback: use browser CSS parsing, then convert rgb(...) to hex
    try {
      const test = new Option().style;
      test.color = '';
      test.color = s;
      if (!test.color) return null; // invalid
      // computed color will be like "rgb(12, 34, 56)" or "rgba(...)"
      const computed = test.color;
      return rgbStringToHex(computed);
    } catch (e) {
      return null;
    }
  }

  // Accepts "rgb(...)" or "rgba(...)" or hex -> returns uppercase #RRGGBB or null
  function rgbStringToHex(rgb) {
    if (!rgb) return null;
    const m = rgb.match(/\d+/g);
    if (!m || m.length < 3) return null;
    const r = parseInt(m[0], 10), g = parseInt(m[1], 10), b = parseInt(m[2], 10);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function isValidHex(s) {
    return /^#([0-9A-F]{6})$/i.test((s || '').trim());
  }

  function isValidColor(s) {
    return Boolean(normalizeColor(s));
  }

  function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
  }

  // Readable text contrast: returns '#000' or '#fff'
  function getReadableText(hex) {
    if (!hex) return '#000';
    let lum = 0;
    try {
      if (typeof chroma !== 'undefined' && chroma.valid(hex)) {
        lum = chroma(hex).luminance();
      } else {
        // approximate luminance from rgb
        const [r, g, b] = hexToRgb(hex).map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
    } catch (e) {
      lum = 1;
    }
    return lum > 0.45 ? '#000' : '#fff';
  }

  function hexToRgb(hex) {
    if (!hex) return [0, 0, 0];
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  // Downloads a blob
  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---------- DOM ready single init ----------
  document.addEventListener('DOMContentLoaded', () => {
    // Elements (may not exist; check)
    const paletteEl = $('#palette');
    const hexInput = $('#hex-input');
    const applyHexBtn = $('#applyHex');
    const addSwatchBtn = $('#addSwatch');
    const clearPaletteBtn = $('#clearPalette');

    // If palette area missing, we still continue but many features will be quiet
    if (!paletteEl) {
      console.warn('Palette container (#palette) not found — palette features disabled');
    }

    // Init Coloris safely if available
    try {
      if (typeof Coloris !== 'undefined') {
        Coloris({
          el: 'input[type="color"]',
          theme: 'large',
          wrap: true
        });
      }
    } catch (e) {
      console.warn('Coloris init failed', e);
    }

    // ---------- Palette manager ----------
    const STORAGE_KEY = 'cw_current_palette';

    function persistPalette() {
      if (!paletteEl) return;
      const colors = Array.from(paletteEl.querySelectorAll('.color-box')).map(b => b.dataset.hex);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    }

    function loadPersistedPalette() {
      if (!paletteEl) return;
      paletteEl.innerHTML = '';
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      } catch { saved = null; }
      if (Array.isArray(saved) && saved.length) {
        saved.forEach(hex => paletteEl.appendChild(createColorBox(hex)));
      } else {
        // fallback defaults (keeps your original defaults)
        ['#e2ab21', '#84b96a', '#fa5822', '#6dee23', '#6c63ff', '#03a9f4'].forEach(h => paletteEl.appendChild(createColorBox(h)));
        persistPalette();
      }
    }

    // create UI swatch element
    function createColorBox(hex) {
      const norm = normalizeColor(hex) || randomColor();
      const box = document.createElement('div');
      box.className = 'color-box';
      box.tabIndex = 0;
      box.draggable = true;
      box.dataset.hex = norm;
      box.style.background = norm;
      // structure: copy label + delete + lock (left delete, right lock)
      box.innerHTML = `
        <span class="copy">${norm}</span>
        <button class="delete-btn" title="Remove">&times;</button>
        <div class="lock-toggle" title="Lock / unlock">🔓</div>
      `;
      return box;
    }

   
    // ---------- Export module ----------
    function getPaletteColors() {
      if (!paletteEl) return [];
      return Array.from(paletteEl.querySelectorAll('.color-box')).map(b => b.dataset.hex || rgbStringToHex(window.getComputedStyle(b).backgroundColor)).filter(Boolean);
    }

    // Palette PNG (requires html2canvas)
    $('#export-palette-png')?.addEventListener('click', async () => {
      const el = $('#palette');
      if (!el) return showToast('Palette element not found');
      if (typeof html2canvas === 'undefined') return showToast('html2canvas required for PNG export');
      try {
        const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
        const link = document.createElement('a');
        link.download = 'palette.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Palette PNG downloaded');
      } catch (err) {
        console.error(err); showToast('Failed to export PNG');
      }
    });

    // Palette JSON
    $('#export-palette-json')?.addEventListener('click', () => {
      const colors = getPaletteColors();
      if (!colors.length) return showToast('No colors to export');
      downloadBlob(JSON.stringify(colors, null, 2), 'palette.json', 'application/json');
      showToast('Palette JSON downloaded');
    });

    // Palette CSS variables
    $('#export-palette-css')?.addEventListener('click', () => {
      const colors = getPaletteColors();
      if (!colors.length) return showToast('No colors to export');
      const css = `:root {\n${colors.map((c, i) => `  --color-${i+1}: ${c};`).join('\n')}\n}\n`;
      downloadBlob(css, 'palette.css', 'text/css');
      showToast('Palette CSS downloaded');
    });

    // Gradient export (PNG + CSS)
    $('#export-gradient')?.addEventListener('click', async () => {
      const gradientEl = $('#gradient-preview') || $('.gradient-preview');
      if (!gradientEl) return showToast('Gradient preview element not found');
      if (typeof html2canvas === 'undefined') return showToast('html2canvas required for PNG export');
      try {
        const canvas = await html2canvas(gradientEl, { backgroundColor: null, scale: 2 });
        const link = document.createElement('a');
        link.download = 'gradient.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Gradient PNG downloaded');
      } catch (err) { console.error(err); showToast('Failed to export gradient PNG'); }

      const computed = window.getComputedStyle(gradientEl).backgroundImage;
      let cssGradient = '';
      if (computed && computed.toLowerCase().includes('gradient')) {
        cssGradient = computed;
      } else {
        const c1 = $('#gradColor1')?.value, c2 = $('#gradColor2')?.value, angle = $('#gradAngle')?.value || 90;
        if (c1 && c2) cssGradient = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
      }
      if (cssGradient) {
        downloadBlob(`.gradient-preview { background: ${cssGradient}; }`, 'gradient.css', 'text/css');
        showToast('Gradient CSS downloaded');
      } else showToast('Unable to determine CSS gradient');
    });

    // small HSL helpers for fallback
    function hexToHsl(hex) {
      const [r, g, b] = hexToRgb(hex).map(v => v / 255);
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }
    function hslToHex(h, s, l) {
      s /= 100; l /= 100;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c / 2;
      let [r, g, b] = [0,0,0];
      if (h < 60) [r,g,b] = [c,x,0];
      else if (h < 120) [r,g,b] = [x,c,0];
      else if (h < 180) [r,g,b] = [0,c,x];
      else if (h < 240) [r,g,b] = [0,x,c];
      else if (h < 300) [r,g,b] = [x,0,c];
      else [r,g,b] = [c,0,x];
      return '#' + [r,g,b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
    }


    // ---------- Help overlay / walkthrough ----------
    const openHelpBtn = $('#open-help'), helpOverlay = $('#help-overlay'), closeHelpBtn = $('#close-help');
    const prevStepBtn = $('#prev-step'), nextStepBtn = $('#next-step');
    if (openHelpBtn && helpOverlay) {
      const helpSteps = [
        { icon: '🎨', title: "Welcome", text: "Welcome to Color World! Explore palettes, gradients, and contrast tools." },
        { icon: '🖌️', title: "Palette", text: "Generate or add colors. Click to select multiple. Apply colors to selected swatches." },
        { icon: '🌈', title: "Gradient", text: "Adjust gradient stops and export as PNG/CSS." },
        { icon: '🎼', title: "Harmony", text: "Generate harmonies from base color using the Harmony tool." },
        { icon: '🖼️', title: "Image extractor", text: "Upload images and extract palette (in the Image Extractor tab)." }
      ];
      let stepIdx = 0;
      const helpTitle = $('#help-title'), helpText = $('#help-text'), helpIcon = $('#help-icon');
      function updateHelp() {
        const s = helpSteps[stepIdx];
        if (helpTitle) helpTitle.textContent = s.title;
        if (helpText) helpText.textContent = s.text;
        if (helpIcon) helpIcon.textContent = s.icon;
        if (prevStepBtn) prevStepBtn.disabled = stepIdx === 0;
        if (nextStepBtn) nextStepBtn.disabled = stepIdx === helpSteps.length - 1;
      }
      openHelpBtn.addEventListener('click', () => { helpOverlay.style.display = 'flex'; stepIdx = 0; updateHelp(); });
      closeHelpBtn?.addEventListener('click', ()=> helpOverlay.style.display = 'none');
      prevStepBtn?.addEventListener('click', ()=> { if(stepIdx>0){ stepIdx--; updateHelp(); } });
      nextStepBtn?.addEventListener('click', ()=> { if(stepIdx<helpSteps.length-1){ stepIdx++; updateHelp(); } });
    }

    // ---------- Safety: expose some helpers if you want in devtools ----------
    window.CW = window.CW || {};
    Object.assign(window.CW, {
      normalizeColor, randomColor, getPaletteColors, persistPalette, loadPersistedPalette, generateHarmony, renderHarmony
    });

    // Done DOMContentLoaded
  }); // end DOMContentLoaded

})(); // end IIFE
(() => {
  'use strict';

  // ---------- Helpers ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

  // Toast
  const toastEl = $('#toast');
  function showToast(msg, ms = 1600) {
    if (toastEl) {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => toastEl.classList.remove('show'), ms);
    } else {
      console.log('[toast]', msg);
    }
  }

  // Color helpers
  function normalizeColor(input) {
    if (!input && input !== '') return null;
    const s = input.trim();
    if (!s) return null;

    const hex3 = /^#?([0-9a-f]{3})$/i;
    const hex6 = /^#?([0-9a-f]{6})$/i;
    if (hex6.test(s)) return '#' + s.match(hex6)[1].toUpperCase();
    if (hex3.test(s)) return '#' + s.match(hex3)[1].split('').map(c => c + c).join('').toUpperCase();

    try { if (typeof chroma !== 'undefined' && chroma.valid(s)) return chroma(s).hex().toUpperCase(); } catch {}

    try {
      const test = new Option().style;
      test.color = s;
      if (!test.color) return null;
      return rgbStringToHex(test.color);
    } catch { return null; }
  }

  function rgbStringToHex(rgb) {
    if (!rgb) return null;
    const m = rgb.match(/\d+/g);
    if (!m || m.length < 3) return null;
    return '#' + [0,1,2].map(i => parseInt(m[i],10).toString(16).padStart(2,'0')).join('').toUpperCase();
  }

  function isValidColor(str) {
    return Boolean(normalizeColor(str));
  }

  function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
  }

  function hexToRgb(hex) {
    if (!hex) return [0,0,0];
    let h = hex.replace('#','');
    if (h.length === 3) h = h.split('').map(c=>c+c).join('');
    return [0,1,2].map(i => parseInt(h.slice(i*2,i*2+2),16));
  }

  function getReadableText(hex) {
    if (!hex) return '#000';
    let lum = 0;
    try {
      if (typeof chroma !== 'undefined' && chroma.valid(hex)) lum = chroma(hex).luminance();
      else {
        const [r,g,b] = hexToRgb(hex).map(v => v/255);
        lum = 0.2126*r + 0.7152*g + 0.0722*b;
      }
    } catch { lum = 1; }
    return lum>0.45 ? '#000':'#fff';
  }

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], {type});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---------- DOM ready ----------
  document.addEventListener('DOMContentLoaded', () => {

    const paletteEl = $('#palette');
    const hexInput = $('#hex-input');
    const applyBtn = $('#applyHex');
    const addBtn = $('#addSwatch');
    const clearBtn = $('#clearPalette');

    if (!paletteEl) {
      console.warn('Palette container not found');
    }

    try { if (typeof Coloris !== 'undefined') Coloris({ el:'input[type="color"]', theme:'large', wrap:true }); } catch {}

    const STORAGE_KEY = 'cw_current_palette';

    function persistPalette() {
      if (!paletteEl) return;
      const colors = Array.from(paletteEl.querySelectorAll('.color-box')).map(b => b.dataset.hex);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    }

    function loadPersistedPalette() {
      if (!paletteEl) return;
      paletteEl.innerHTML = '';
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); } catch { saved = null; }
      const defaults = ['#e2ab21','#84b96a','#fa5822','#6dee23','#6c63ff','#03a9f4'];
      (Array.isArray(saved)&&saved.length ? saved : defaults).forEach(h => paletteEl.appendChild(createColorBox(h)));
      persistPalette();
    }

    function createColorBox(hex) {
      const norm = normalizeColor(hex) || randomColor();
      const box = document.createElement('div');
      box.className = 'color-box';
      box.tabIndex = 0;
      box.draggable = true;
      box.dataset.hex = norm;
      box.style.background = norm;
      box.innerHTML = `<span class="copy">${norm}</span><button class="delete-btn" title="Remove">&times;</button><div class="lock-toggle" title="Lock/Unlock">🔓</div>`;
      return box;
    }

    function toggleLock(box) {
      if (!box) return;
      box.classList.toggle('locked');
      const lock = box.querySelector('.lock-toggle');
      if (lock) lock.textContent = box.classList.contains('locked') ? '🔒' : '🔓';
    }

    // ---------------- Palette events ----------------
    if (paletteEl) {
      // click handler
      paletteEl.addEventListener('click', ev => {
        const del = ev.target.closest('.delete-btn');
        if (del) {
          const box = del.closest('.color-box');
          if (box && confirm('Remove this swatch?')) { box.remove(); persistPalette(); showToast('Removed'); }
          return;
        }

        const lockBtn = ev.target.closest('.lock-toggle');
        if (lockBtn) { toggleLock(lockBtn.closest('.color-box')); persistPalette(); return; }

        const box = ev.target.closest('.color-box');
        if (!box) return;

        // immediately apply input color
        const raw = hexInput?.value.trim();
        if (raw && isValidColor(raw) && !box.classList.contains('locked')) {
          let color = raw;
          try { if (typeof chroma !== 'undefined') color = chroma(raw).hex().toUpperCase(); } catch {}
          box.dataset.hex = color;
          box.style.background = color;
          const label = box.querySelector('.copy');
          if (label) label.textContent = color;
          persistPalette();
          showToast(`Applied ${color}`);
        }

        // toggle selection
        box.classList.toggle('selected');
      });

      // dblclick -> random
      paletteEl.addEventListener('dblclick', ev => {
        const box = ev.target.closest('.color-box');
        if (!box || box.classList.contains('locked')) return;
        const newHex = randomColor();
        box.dataset.hex = newHex;
        box.style.background = newHex;
        const span = box.querySelector('.copy');
        if (span) span.textContent = newHex;
        persistPalette();
        showToast('Replaced with ' + newHex);
      });

      // drag & drop
      let draggedBox = null;
      paletteEl.addEventListener('dragstart', ev => { draggedBox = ev.target.closest('.color-box'); if(draggedBox) draggedBox.classList.add('dragging'); });
      paletteEl.addEventListener('dragend', ev => { if(draggedBox) draggedBox.classList.remove('dragging'); draggedBox=null; persistPalette(); });
      paletteEl.addEventListener('dragover', ev => { ev.preventDefault(); if(!draggedBox) return;
        const after = [...paletteEl.querySelectorAll('.color-box:not(.dragging)')].reduce((closest,child)=>{
          const boxRect = child.getBoundingClientRect();
          const offset = ev.clientX-(boxRect.left+boxRect.width/2);
          if(offset<0 && offset>(closest.offset||-Infinity)) return {offset,element:child};
          return closest;
        },{offset:-Infinity}).element||null;
        if(!after) paletteEl.appendChild(draggedBox);
        else paletteEl.insertBefore(draggedBox,after);
      });
    }

    // ---------------- Apply button ----------------
    function setupApplyButton() {
      if(!applyBtn || !hexInput || !paletteEl) return;
      applyBtn.addEventListener('click', () => {
        const raw = hexInput.value.trim();
        if (!raw) return showToast('Enter a color');
        if (!isValidColor(raw)) return showToast('Invalid color');
        let color = raw;
        try { if (typeof chroma !== 'undefined') color = chroma(raw).hex().toUpperCase(); } catch {}
        const selectedBoxes = paletteEl.querySelectorAll('.color-box.selected');
        if(!selectedBoxes.length) return showToast('No swatch selected');
        selectedBoxes.forEach(box => { if(!box.classList.contains('locked')) { box.dataset.hex=color; box.style.background=color; const l=box.querySelector('.copy'); if(l) l.textContent=color; } });
        persistPalette();
        showToast(`Applied ${color} to ${selectedBoxes.length} swatch(es)`);
      });
    }

    // ---------------- Add button ----------------
    function setupAddButton() {
      if(!addBtn || !hexInput || !paletteEl) return;
      addBtn.addEventListener('click', () => {
        const raw = hexInput.value.trim();
        const color = normalizeColor(raw) || randomColor();
        const box = createColorBox(color);
        box.classList.add('selected'); // auto select
        paletteEl.appendChild(box);
        persistPalette();
        showToast('Added ' + color);
      });
    }

    // ---------------- Clear ----------------
    clearBtn?.addEventListener('click', () => {
      if(!paletteEl || !confirm('Clear palette?')) return;
      paletteEl.innerHTML='';
      ['#e2ab21','#84b96a','#fa5822','#6dee23','#6c63ff','#03a9f4'].forEach(h=>paletteEl.appendChild(createColorBox(h)));
      persistPalette();
      showToast('Palette reset');
    });

    // ---------------- Init ----------------
    loadPersistedPalette();
    setupApplyButton();
    setupAddButton();

  }); // DOMContentLoaded

})(); // IIFE
// ✅ Initialize EmailJS with your Public Key
(function() {
  emailjs.init("baLHDUxSd2Ur3YXFe"); 
})();

// ✅ Handle Feedback Form submission
document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("contactForm");

  form.addEventListener("submit", function(event) {
    event.preventDefault();

    // EmailJS IDs
    const serviceID = "service_lf21vws";     // Your Gmail Service
    const templateID = "template_ezamrce";   // Your Template

    // Send the form data
    emailjs.sendForm(serviceID, templateID, this)
      .then(() => {
        showToast("✅ Message sent successfully!");
        form.reset();
      })
      .catch((err) => {
        console.error("❌ Failed:", err);
        showToast("❌ Failed to send message. Check console.");
      });
  });

  // ✅ Toast Notification
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }
});
