/* =========================================================================
   Color World — Ultimate Unified script.js
   Includes: splash, navbar, palette, live preview, gradient, contrast,
   harmony, shades, color blindness, image extractor, contact form, help,
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

  /* ---------- Gradient ---------- */
  const gradColor1=$('#gradColor1'), gradColor2=$('#gradColor2'), gradAngle=$('#gradAngle'), angleVal=$('#angleVal'), gradPreview=$('#gradient-preview');
  const updateGradientPreview=()=>{ if(!gradPreview||!gradColor1||!gradColor2||!gradAngle||!angleVal) return; const a=gradColor1.value,b=gradColor2.value,ang=gradAngle.value; angleVal.textContent=`${ang}°`; gradPreview.style.background=`linear-gradient(${ang}deg, ${a}, ${b})`; };
  gradColor1?.addEventListener('input',updateGradientPreview); gradColor2?.addEventListener('input',updateGradientPreview); gradAngle?.addEventListener('input',updateGradientPreview);
  updateGradientPreview();

  $('#copyGradient')?.addEventListener('click',()=>{ if(!gradPreview)return toast('No gradient to copy'); const css=gradPreview.style.background; if(!css)return toast('No gradient to copy'); navigator.clipboard.writeText(`background: ${css};`).then(()=>{toast('Gradient CSS copied');playPop();}); });

  $('#export_grad_img')?.addEventListener('click',()=>{ if(!gradPreview||!gradColor1||!gradColor2||!gradAngle) return toast('No gradient to export'); const a=gradColor1.value,b=gradColor2.value,angle=parseFloat(gradAngle.value||'90'); if(!a||!b) return toast('No gradient to export'); const canvas=document.createElement('canvas'); canvas.width=1000; canvas.height=280; const ctx=canvas.getContext('2d'); const rad=angle*Math.PI/180; const x=Math.cos(rad),y=Math.sin(rad); const g=ctx.createLinearGradient(canvas.width/2-x*canvas.width/2,canvas.height/2-y*canvas.height/2,canvas.width/2+x*canvas.width/2,canvas.height/2+y*canvas.height/2); g.addColorStop(0,a); g.addColorStop(1,b); ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height); const link=Object.assign(document.createElement('a'),{href:canvas.toDataURL('image/png'),download:'gradient.png'}); link.click(); toast('Gradient saved as PNG'); });

/* ---------- Harmony ---------- */
const harmonyBase = $('#h_base');
const harmonyMode = $('#h_mode');
const harmonyGrid = $('#harmony_grid');
const harmonyGenerate = $('#h_generate');
const harmonyCopy = $('#h_copy');

function generateHarmonyColors(baseHex, mode){
  try {
    const [h,s,l] = hexToHsl(baseHex);
    if(mode === 'monochrome') return [hslToHex(h,s,Math.max(0,l-20)), baseHex, hslToHex(h,s,Math.min(100,l+20))];
    let angles = [];
    switch(mode){
      case 'complementary': angles = [0, 180]; break;
      case 'analogous': angles = [0, 30, 330]; break;
      case 'triadic': angles = [0, 120, 240]; break;
      case 'tetradic': angles = [0, 90, 180, 270]; break;
      default: angles = [0]; break;
    }
    return angles.map(a => hslToHex((h + a) % 360, s, l));
  } catch(e){
    return [baseHex];
  }
}

function renderHarmony(colors){
  if(!harmonyGrid) return;
  harmonyGrid.innerHTML = '';
  colors.forEach(c => {
    const d = document.createElement('div');
    d.className = 'shade-box';
    d.style.background = c;
    d.textContent = c;
    d.title = `Click to copy ${c}`;
    d.setAttribute('role','button');
    d.style.cursor = 'pointer';
    // hover glow
    d.addEventListener('mouseenter', () => {
      d.style.boxShadow = '0 0 14px rgba(0,0,0,0.18), 0 0 18px rgba(108,99,255,0.25)';
      d.style.transform = 'scale(1.03)';
      // live preview
      if($('#live-preview')) { $('#live-preview').style.backgroundColor = c; $('#live-preview').style.color = getReadableText(c); $('#live-preview').textContent = `Preview: ${c}`; }
    });
    d.addEventListener('mouseleave', () => {
      d.style.boxShadow = '';
      d.style.transform = '';
      if($('#live-preview')) { $('#live-preview').style.backgroundColor = ''; $('#live-preview').style.color = ''; $('#live-preview').textContent = 'Live Preview'; }
    });
    d.addEventListener('click', () => {
      navigator.clipboard.writeText(c).then(()=>{ toast('Copied ' + c); playPop(); d.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 200 }); }).catch(()=>{ toast('Copied ' + c); });
    });
    harmonyGrid.appendChild(d);
  });
}

harmonyGenerate?.addEventListener('click', () => {
  const base = harmonyBase?.value || '#ff6600';
  const mode = harmonyMode?.value || 'complementary';
  const colors = generateHarmonyColors(base, mode);
  renderHarmony(colors);
});
harmonyCopy?.addEventListener('click', () => {
  if(!harmonyGrid) return toast('No harmony colors to copy');
  const colors = $$('.shade-box', harmonyGrid).map(d => d.textContent).filter(Boolean).join(', ');
  if(!colors) return toast('No harmony colors to copy');
  navigator.clipboard.writeText(colors).then(()=>{ toast('Copied Harmony Colors'); playPop(); });
});

/* ---------- Shades & Tints ---------- */
const shBase = $('#sh_base');
const shGenerate = $('#sh_generate');
const shGrid = $('#sh_grid');

function generateShadesTintsGrid(baseHex){
  if(!shGrid) return;
  shGrid.innerHTML = '';
  const [h,s,l] = hexToHsl(baseHex);
  for(let i=10;i<=90;i+=10){
    const tint = hslToHex(h,s,Math.min(100, l + i));
    const shade = hslToHex(h,s,Math.max(0, l - i));
    [tint, shade].forEach(c => {
      const d = document.createElement('div');
      d.className = 'shade-box';
      d.style.background = c;
      d.textContent = c;
      d.title = `Click to copy ${c}`;
      d.style.cursor = 'pointer';
      d.addEventListener('mouseenter', ()=>{ d.style.boxShadow='0 0 12px rgba(0,0,0,0.12)'; d.style.transform='scale(1.03)'; if($('#live-preview')){ $('#live-preview').style.backgroundColor=c; $('#live-preview').style.color=getReadableText(c); $('#live-preview').textContent=`Preview: ${c}`;} });
      d.addEventListener('mouseleave', ()=>{ d.style.boxShadow=''; d.style.transform=''; if($('#live-preview')){ $('#live-preview').style.backgroundColor=''; $('#live-preview').style.color=''; $('#live-preview').textContent='Live Preview'; } });
      d.addEventListener('click', ()=>{ navigator.clipboard.writeText(c).then(()=>{ toast('Copied ' + c); playPop(); d.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:200}); }); });
      shGrid.appendChild(d);
    });
  }
}

shGenerate?.addEventListener('click', ()=> {
  const base = shBase?.value || '#ff6600';
  generateShadesTintsGrid(base);
  toast('Tints & Shades generated');
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
// ----- Image Extractor: Top 10 Dominant Colors -----
const imgInput = document.getElementById('img_input');
const imgPreview = document.getElementById('img_preview');
const imgToggle = document.getElementById('img_toggle');
const extractedColors = document.getElementById('extracted_colors');
const copyBtn = document.getElementById('ex_copy');
const downloadBtn = document.getElementById('ex_download');
const canvas = document.getElementById('extract_canvas');
const ctx = canvas.getContext('2d');

let colors = [];

// Upload image & preview
imgInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        imgPreview.src = reader.result;
        imgPreview.style.display = 'block';
        imgToggle.style.display = 'inline-block';
        imgPreview.onload = () => extractColors(imgPreview);
    };
    reader.readAsDataURL(file);
});

// Toggle show/hide image
imgToggle.addEventListener('click', () => {
    if (imgPreview.style.display === 'none') {
        imgPreview.style.display = 'block';
        imgToggle.textContent = 'Hide Image';
    } else {
        imgPreview.style.display = 'none';
        imgToggle.textContent = 'Show Image';
    }
});

// Extract top 10 dominant colors
function extractColors(image) {
    // Downscale for performance
    const width = 100;
    const height = 100;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    const data = ctx.getImageData(0, 0, width, height).data;
    const colorMap = {};

    // Count pixel colors
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent pixels
        if (a < 128) continue;

        const hex = rgbToHex(r, g, b);
        colorMap[hex] = (colorMap[hex] || 0) + 1;
    }

    // Sort colors by frequency
    let sortedColors = Object.entries(colorMap)
        .map(([hex, count]) => ({ hex, count }))
        .sort((a, b) => b.count - a.count)
        .map(c => c.hex);

    // Pick top 10 visually distinct colors
    colors = pickDistinctColors(sortedColors, 10);

    displayColors();
}

// Convert RGB to HEX
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Pick visually distinct colors from sorted array
function pickDistinctColors(colorArray, count) {
    const distinct = [];
    const distance = (c1, c2) => {
        const rgb1 = hexToRgb(c1);
        const rgb2 = hexToRgb(c2);
        return Math.sqrt(
            Math.pow(rgb1.r - rgb2.r, 2) +
            Math.pow(rgb1.g - rgb2.g, 2) +
            Math.pow(rgb1.b - rgb2.b, 2)
        );
    };

    for (let color of colorArray) {
        if (distinct.length === 0) {
            distinct.push(color);
            continue;
        }
        const isDistinct = distinct.every(c => distance(c, color) > 30); // tweak threshold
        if (isDistinct) distinct.push(color);
        if (distinct.length >= count) break;
    }

    // If less than desired count, fill with next most frequent colors
    let i = 0;
    while (distinct.length < count && i < colorArray.length) {
        if (!distinct.includes(colorArray[i])) distinct.push(colorArray[i]);
        i++;
    }

    return distinct;
}

// Convert HEX to RGB
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

// Display extracted colors
function displayColors() {
    extractedColors.innerHTML = '';
    colors.forEach((color, i) => {
        const box = document.createElement('div');
        box.className = 'shade-box';
        box.style.background = color;
        box.setAttribute('data-color', color);
        extractedColors.appendChild(box);

        // Animate fadeSlideUp
        setTimeout(() => {
            box.style.opacity = 1;
            box.style.transform = 'translateY(0)';
        }, i * 50);
    });
}

// Copy colors as text
copyBtn.addEventListener('click', () => {
    if (colors.length === 0) return;
    navigator.clipboard.writeText(colors.join(', '));
    showToast('Colors copied!');
});

// Download palette as PNG
downloadBtn.addEventListener('click', () => {
    if (colors.length === 0) return;
    const size = 100;
    canvas.width = size * colors.length;
    canvas.height = size;

    colors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(i * size, 0, size, size);
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'palette.png';
    link.click();
});

// Toast helper
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
}

/* ---------- Contact form (Formspree) ---------- */
(function contactFormHandler(){
  const contactForm = $('#contactForm');
  if(!contactForm) return;
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        toast('Your message was sent!');
        contactForm.reset();
      } else {
        toast('Failed to send message');
      }
    } catch (err) {
      console.error('Contact send error', err);
      toast('Failed to send message');
    }
  });
})();

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
    mockup.textContent = 'Live Mockup Preview';
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
   Advanced Palette Feature — Harmonies & Schemes
   ========================================================================= */
(() => {
  const harmonyBase = $('#h_base');
  const harmonyMode = $('#h_mode');
  const harmonyGrid = $('#harmony_grid');
  const harmonyGenerate = $('#h_generate');
  const harmonyCopy = $('#h_copy');

  // Generate harmony colors based on mode
  function generateHarmony(baseHex, mode) {
    const [h, s, l] = hexToHsl(baseHex);
    let angles = [];

    switch(mode) {
      case 'complementary': angles = [0, 180]; break;
      case 'analogous': angles = [0, 30, 330]; break;
      case 'triadic': angles = [0, 120, 240]; break;
      case 'tetradic': angles = [0, 90, 180, 270]; break;
      case 'monochrome': return [hslToHex(h,s,Math.max(0,l-20)), baseHex, hslToHex(h,s,Math.min(100,l+20))];
      default: angles = [0]; break;
    }

    return angles.map(a => hslToHex((h + a) % 360, s, l));
  }

  function renderHarmony(colors) {
    if (!harmonyGrid) return;
    harmonyGrid.innerHTML = '';
    colors.forEach(c => {
      const box = document.createElement('div');
      box.className = 'shade-box';
      box.style.background = c;
      box.textContent = c;
      box.title = `Click to copy ${c}`;
      box.addEventListener('click', () => {
        navigator.clipboard.writeText(c).then(() => { 
          toast('Copied ' + c); 
          playPop(); 
        });
      });
      harmonyGrid.appendChild(box);
    });
  }

  harmonyGenerate?.addEventListener('click', () => {
    const base = harmonyBase?.value || '#ff6600';
    const mode = harmonyMode?.value || 'complementary';
    const colors = generateHarmony(base, mode);
    renderHarmony(colors);
  });

  harmonyCopy?.addEventListener('click', () => {
    if (!harmonyGrid) return toast('No harmony colors to copy');
    const colors = $$('.shade-box', harmonyGrid).map(d => d.textContent).filter(Boolean).join(', ');
    if (!colors) return toast('No harmony colors to copy');
    navigator.clipboard.writeText(colors).then(() => { 
      toast('Copied Harmony Colors'); 
      playPop(); 
    });
  });
})();
/* =========================================================================
   Advanced Palette Feature — Harmonies & Schemes with Live Preview
   ========================================================================= */
(() => {
  const harmonyBase = $('#h_base');
  const harmonyMode = $('#h_mode');
  const harmonyGrid = $('#harmony_grid');
  const harmonyGenerate = $('#h_generate');
  const harmonyCopy = $('#h_copy');
  const livePreview = $('#live-preview'); // reuse your existing live preview

  // Generate harmony colors based on mode
  function generateHarmony(baseHex, mode) {
    const [h, s, l] = hexToHsl(baseHex);
    let angles = [];

    switch(mode) {
      case 'complementary': angles = [0, 180]; break;
      case 'analogous': angles = [0, 30, 330]; break;
      case 'triadic': angles = [0, 120, 240]; break;
      case 'tetradic': angles = [0, 90, 180, 270]; break;
      case 'monochrome': return [hslToHex(h,s,Math.max(0,l-20)), baseHex, hslToHex(h,s,Math.min(100,l+20))];
      default: angles = [0]; break;
    }

    return angles.map(a => hslToHex((h + a) % 360, s, l));
  }

  function renderHarmony(colors) {
    if (!harmonyGrid) return;
    harmonyGrid.innerHTML = '';
    colors.forEach(c => {
      const box = document.createElement('div');
      box.className = 'shade-box';
      box.style.background = c;
      box.textContent = c;
      box.title = `Click to copy ${c}`;
      
      // Click to copy
      box.addEventListener('click', () => {
        navigator.clipboard.writeText(c).then(() => { 
          toast('Copied ' + c); 
          playPop(); 
        });
      });

      // Hover live preview
      box.addEventListener('mouseover', () => {
        if (livePreview) {
          livePreview.style.backgroundColor = c;
          livePreview.style.color = getReadableText(c);
          livePreview.textContent = `Preview: ${c}`;
        }
      });

      box.addEventListener('mouseleave', () => {
        if (livePreview) {
          livePreview.style.backgroundColor = '';
          livePreview.style.color = '';
          livePreview.textContent = 'Live Preview';
        }
      });

      harmonyGrid.appendChild(box);
    });
  }

  harmonyGenerate?.addEventListener('click', () => {
    const base = harmonyBase?.value || '#ff6600';
    const mode = harmonyMode?.value || 'complementary';
    const colors = generateHarmony(base, mode);
    renderHarmony(colors);
  });

  harmonyCopy?.addEventListener('click', () => {
    if (!harmonyGrid) return toast('No harmony colors to copy');
    const colors = $$('.shade-box', harmonyGrid).map(d => d.textContent).filter(Boolean).join(', ');
    if (!colors) return toast('No harmony colors to copy');
    navigator.clipboard.writeText(colors).then(() => { 
      toast('Copied Harmony Colors'); 
      playPop(); 
    });
  });
})();
/* ---------- Harmony Keyboard Shortcuts ---------- */
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  const generateHarmonyBtn = $('#h_generate');
  const copyHarmonyBtn = $('#h_copy');

  if (e.key.toLowerCase() === 'h') { // Press H to generate Harmony
    e.preventDefault();
    generateHarmonyBtn?.click();
    toast('Harmony generated');
  }

  if (e.key.toLowerCase() === 'c') { // Press C to copy Harmony colors
    e.preventDefault();
    copyHarmonyBtn?.click();
  }
});
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

// Animated color preview on hover
const previewBox = $('#animated-preview'); // a sample element to show live color
if(previewBox){
  $$('.color-box', palette).forEach(box => {
    box.addEventListener('mouseenter', () => {
      const hex = box.dataset.hex;
      previewBox.style.transition = 'background-color 0.4s, color 0.4s';
      previewBox.style.backgroundColor = hex;
      previewBox.style.color = getReadableText(hex);
      previewBox.textContent = `Preview: ${hex}`;
    });
    box.addEventListener('mouseleave', () => {
      previewBox.style.backgroundColor = '';
      previewBox.style.color = '';
      previewBox.textContent = 'Live Preview';
    });
  });
}

// Tooltip guidance for buttons & tools
const tooltipElements = $$('[data-tooltip]');
tooltipElements.forEach(el => {
  const tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.textContent = el.dataset.tooltip;
  Object.assign(tip.style, {
    position: 'absolute',
    background: '#111',
    color: '#fff',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 0.2s'
  });
  document.body.appendChild(tip);

  el.addEventListener('mouseenter', () => {
    const rect = el.getBoundingClientRect();
    tip.style.top = `${rect.top - 30 + window.scrollY}px`;
    tip.style.left = `${rect.left + rect.width/2 - tip.offsetWidth/2}px`;
    tip.style.opacity = 1;
  });
  el.addEventListener('mouseleave', () => { tip.style.opacity = 0; });
});

// Live “Apply to Mockup” view
const mockupCards = $$('.mockup-card'); // some sample UI cards/buttons
const applyToMockup = (hex) => {
  mockupCards.forEach(card => {
    card.style.transition = 'background-color 0.3s, color 0.3s';
    card.style.backgroundColor = hex;
    card.style.color = getReadableText(hex);
  });
};

// When clicking a color box, apply to mockups
palette?.addEventListener('click', ev => {
  const box = ev.target.closest('.color-box');
  if(!box || !box.dataset.hex) return;
  applyToMockup(box.dataset.hex);
});
/* =========================================================================
   Color World — Safe Enhancement Loader
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {

  // --- Harmony grid setup (if not already populated) ---
  const grid = $('#harmony_grid');
  if(grid && !grid.hasChildNodes() && typeof genHarmony === 'function'){
    const base = $('#h_base')?.value || '#ff6600';
    const mode = $('#h_mode')?.value || 'complementary';
    const colors = genHarmony(base, mode);
    grid.innerHTML = '';
    colors.forEach(c => {
      const d = document.createElement('div');
      d.className = 'shade-box';
      d.style.background = c;
      d.textContent = c;
      d.addEventListener('click', () => {
        navigator.clipboard.writeText(c).then(()=>{ toast('Copied ' + c); playPop(); });
      });
      grid.appendChild(d);
    });
  }

  // --- Tints & Shades grid setup (if empty) ---
  const shGrid = $('#sh_grid');
  if(shGrid && !shGrid.hasChildNodes()){
    const base = $('#sh_base')?.value || '#ff6600';
    if(typeof $('#sh_generate')?.click === 'function'){
      $('#sh_generate').click();
    }
  }

  // --- Keyboard shortcuts for Harmony only ---
  document.addEventListener('keydown', e => {
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    if(e.key.toLowerCase() === 'h'){ $('#h_generate')?.click(); toast('Harmony generated'); }
    if(e.key.toLowerCase() === 'c'){ $('#h_copy')?.click(); toast('Harmony copied'); }
  });

});
document.addEventListener('DOMContentLoaded', () => {
  const openHelpBtn = document.getElementById('open-help');
  const helpOverlay = document.getElementById('help-overlay');
  const closeHelpBtn = document.getElementById('close-help');
  const helpTitle = document.getElementById('help-title');
  const helpText = document.getElementById('help-text');
  const helpIcon = document.getElementById('help-icon');
  const prevStepBtn = document.getElementById('prev-step');
  const nextStepBtn = document.getElementById('next-step');

  // Full walkthrough steps
  const helpSteps = [
    { icon: '🎨', title: "Welcome", text: "Welcome to Color World! Explore palettes, gradients, and contrast tools." },
    { icon: '🖌️', title: "Palette Generator", text: "Click 'Generate Palette' or press Spacebar to quickly create new color palettes. Click a color to copy it." },
    { icon: '👓', title: "Contrast Checker", text: "Check the contrast between two colors to ensure your designs are accessible. Use the color pickers or set from the palette." },
    { icon: '🌈', title: "Gradient Generator", text: "Create gradients by selecting two colors and adjusting the angle. Copy the CSS code for use in your projects." },
    { icon: '🎼', title: "Color Harmony", text: "Select a base color and a harmony mode (complementary, analogous, triadic, etc.) to generate harmonious palettes." },
    { icon: '🖼️', title: "Image Color Extractor", text: "Upload an image to extract the main colors. Toggle the image preview and copy or download your palette." },
    { icon: '🌗', title: "Shades & Tints Generator", text: "Generate lighter and darker versions of a color to build a complete palette with shades and tints." },
    { icon: '💾', title: "Export Options", text: "Export your current palette or gradient as a text file, JSON, or PNG gradient image." },
    { icon: '💻', title: "Developer Tools Links", text: "Quick links to useful tools like Figma, VS Code, GitHub, React, MDN, WCAG guidelines, Tailwind, and more." },
    { icon: '📩', title: "Feedback & Contact", text: "Use the contact form to send feedback or report issues directly to us via email." }
  ];

  let currentStep = 0;

  function updateHelpContent() {
    const step = helpSteps[currentStep];
    helpTitle.textContent = step.title;
    helpText.textContent = step.text;
    helpIcon.textContent = step.icon;

    prevStepBtn.disabled = currentStep === 0;
    nextStepBtn.disabled = currentStep === helpSteps.length - 1;
  }

  // Open Help Overlay
  openHelpBtn.addEventListener('click', () => {
    helpOverlay.style.display = 'flex';
    updateHelpContent();
  });

  // Close Help Overlay
  closeHelpBtn.addEventListener('click', () => {
    helpOverlay.style.display = 'none';
  });

  // Previous Step
  prevStepBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      updateHelpContent();
    }
  });

  // Next Step
  nextStepBtn.addEventListener('click', () => {
    if (currentStep < helpSteps.length - 1) {
      currentStep++;
      updateHelpContent();
    }
  });
});
/* =========================================================================
   Background Remover - Complete JS
   Features:
   - Shared #img_input with Image Extractor
   - API remove.bg background removal
   - Draggable circular eraser (smooth follow)
   - Undo / Redo
   - Download
   - Adjustable eraser size
   - Notifications integrated with showNotification()
   ========================================================================= */

const REMOVE_BG_API_KEY = ""; // <-- Paste your remove.bg API key here

// DOM Elements
const imgInput = document.getElementById("img_input");
const bgCanvas = document.getElementById("bg_canvas");
const ctx = bgCanvas.getContext("2d");

const removeBgBtn = document.getElementById("remove_bg_btn");
const eraserToggleBtn = document.getElementById("eraser_btn"); 
const undoBtn = document.getElementById("undo_btn");
const redoBtn = document.getElementById("redo_btn");
const downloadBtn = document.getElementById("download_bg_removed");
const eraserSizeInput = document.getElementById("eraser_size");

// State
let currentFile = null;
let originalImg = null;
let drawing = false;
let eraserActive = false;
let eraserSize = parseInt(eraserSizeInput.value, 10);
let mousePos = { x: 0, y: 0 };
let history = [];
let redoStack = [];

/* -------------------- Checkerboard Background -------------------- */
function drawCheckerboard() {
  const size = 20;
  for (let y = 0; y < bgCanvas.height; y += size) {
    for (let x = 0; x < bgCanvas.width; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "#eee" : "#ccc";
      ctx.fillRect(x, y, size, size);
    }
  }
}

/* -------------------- Save / Load State -------------------- */
function saveState() {
  history.push(bgCanvas.toDataURL());
  redoStack = [];
}

function loadState(dataUrl) {
  const img = new Image();
  img.onload = () => {
    drawCheckerboard();
    ctx.drawImage(img, 0, 0);
  };
  img.src = dataUrl;
}

/* -------------------- Load Image -------------------- */
function loadImageToCanvas(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      bgCanvas.width = img.width;
      bgCanvas.height = img.height;
      drawCheckerboard();
      ctx.drawImage(img, 0, 0);
      originalImg = img;
      saveState();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* -------------------- Background Removal API -------------------- */
let bgOverlay = document.createElement("div");
bgOverlay.id = "bg_processing_overlay";
bgOverlay.style.position = "absolute";
bgOverlay.style.background = "rgba(0,0,0,0.4)";
bgOverlay.style.display = "none";
bgOverlay.style.zIndex = "999";
bgOverlay.style.pointerEvents = "none";
bgOverlay.style.color = "white";
bgOverlay.style.fontSize = "20px";
bgOverlay.style.fontWeight = "bold";
bgOverlay.style.justifyContent = "center";
bgOverlay.style.alignItems = "center";
bgOverlay.style.display = "flex";
bgOverlay.textContent = "⏳ Processing...";
document.body.appendChild(bgOverlay);

function updateOverlaySize() {
  const rect = bgCanvas.getBoundingClientRect();
  bgOverlay.style.width = rect.width + "px";
  bgOverlay.style.height = rect.height + "px";
  bgOverlay.style.left = rect.left + "px";
  bgOverlay.style.top = rect.top + "px";
}

function showBgOverlay() {
  updateOverlaySize();
  bgOverlay.style.display = "flex";
}

function hideBgOverlay() {
  bgOverlay.style.display = "none";
}

async function tryApiRemoveBg(file) {
  if (!REMOVE_BG_API_KEY) {
    showNotification("⚠️ API key not set");
    return false;
  }

  showBgOverlay();
  showNotification("⏳ Removing background...");

  try {
    const formData = new FormData();
    formData.append("image_file", file);

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": REMOVE_BG_API_KEY },
      body: formData,
    });

    if (!response.ok) throw new Error("API failed");

    const blob = await response.blob();
    const img = new Image();
    img.onload = () => {
      bgCanvas.width = img.width;
      bgCanvas.height = img.height;
      drawCheckerboard();
      ctx.drawImage(img, 0, 0);
      saveState();
      hideBgOverlay();
      showNotification("✅ Background removed!");
    };
    img.src = URL.createObjectURL(blob);

    return true;
  } catch (err) {
    hideBgOverlay();
    showNotification("❌ Background removal failed");
    console.warn("API error:", err);
    return false;
  }
}

/* -------------------- Eraser -------------------- */
function toggleEraser() {
  eraserActive = !eraserActive;
  if (eraserActive) {
    eraserToggleBtn.textContent = "Stop Erasing";
    bgCanvas.style.cursor = "none";
    bgCanvas.addEventListener("mousedown", startDrawing);
    bgCanvas.addEventListener("mousemove", updateMouse);
    bgCanvas.addEventListener("mousemove", drawPreview);
    bgCanvas.addEventListener("mouseup", stopDrawing);
    bgCanvas.addEventListener("mouseleave", stopDrawing);
  } else {
    eraserToggleBtn.textContent = "Start Erasing";
    bgCanvas.style.cursor = "default";
    bgCanvas.removeEventListener("mousedown", startDrawing);
    bgCanvas.removeEventListener("mousemove", updateMouse);
    bgCanvas.removeEventListener("mousemove", drawPreview);
    bgCanvas.removeEventListener("mouseup", stopDrawing);
    bgCanvas.removeEventListener("mouseleave", stopDrawing);
    redrawCanvas();
  }
}

function updateMouse(e) {
  const rect = bgCanvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
}

function startDrawing(e) {
  drawing = true;
  drawEraser();
}

function drawEraser() {
  if (!drawing) return;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(mousePos.x, mousePos.y, eraserSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  requestAnimationFrame(drawEraser); // smooth continuous erasing
}

function stopDrawing() {
  if (drawing) {
    drawing = false;
    saveState();
  }
}

function drawPreview() {
  if (!eraserActive || drawing || !history.length) return;
  redrawCanvas();
  ctx.save();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(mousePos.x, mousePos.y, eraserSize / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function redrawCanvas() {
  if (history.length) loadState(history[history.length - 1]);
}

/* -------------------- Undo / Redo -------------------- */
function undo() {
  if (history.length > 1) {
    redoStack.push(history.pop());
    loadState(history[history.length - 1]);
  }
}

function redo() {
  if (redoStack.length > 0) {
    const data = redoStack.pop();
    history.push(data);
    loadState(data);
  }
}

/* -------------------- Download -------------------- */
function downloadImage() {
  const link = document.createElement("a");
  link.download = "bg_removed.png";
  link.href = bgCanvas.toDataURL("image/png");
  link.click();
}

/* -------------------- Event Listeners -------------------- */
eraserToggleBtn.addEventListener("click", toggleEraser);
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);
downloadBtn.addEventListener("click", downloadImage);
eraserSizeInput.addEventListener("input", (e) => {
  eraserSize = parseInt(e.target.value, 10);
});

removeBgBtn.addEventListener("click", async () => {
  if (!currentFile) return showNotification("⚠️ Upload an image first");
  await tryApiRemoveBg(currentFile);
});

imgInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  currentFile = file;
  loadImageToCanvas(file);
});

/* -------------------- Window resize for overlay -------------------- */
window.addEventListener("resize", () => {
  if (bgOverlay.style.display === "flex") {
    updateOverlaySize();
  }
});

/* ==================================
   Export Functions (Palette + Gradient)
   ================================== */

/**
 * Helper: Trigger download from Blob
 */
function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Helper: Get palette colors
 * - Looks for .color-box elements
 * - Uses data-color if available, otherwise style.backgroundColor
 */
function getPaletteColors() {
  return Array.from(document.querySelectorAll(".color-box"))
    .map(box => box.dataset.color || box.style.backgroundColor)
    .filter(color => !!color); // remove empty
}

/* ----------------------------
   Export Palette as PNG
---------------------------- */
document.getElementById("export-palette-png")?.addEventListener("click", () => {
  const paletteDiv = document.getElementById("palette-preview");
  if (!paletteDiv) {
    alert("Palette preview not found.");
    return;
  }

  html2canvas(paletteDiv).then(canvas => {
    const link = document.createElement("a");
    link.download = "palette.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
});

/* ----------------------------
   Export Palette as JSON
---------------------------- */
document.getElementById("export-palette-json")?.addEventListener("click", () => {
  const colors = getPaletteColors();
  if (!colors.length) {
    alert("No colors found in palette.");
    return;
  }
  const jsonContent = JSON.stringify(colors, null, 2);
  downloadBlob(jsonContent, "palette.json", "application/json");
});

/* ----------------------------
   Export Palette as CSS Variables
---------------------------- */
document.getElementById("export-palette-css")?.addEventListener("click", () => {
  const colors = getPaletteColors();
  if (!colors.length) {
    alert("No colors found in palette.");
    return;
  }
  const cssLines = colors.map((c, i) => `  --color-${i + 1}: ${c};`);
  const cssText = `:root {\n${cssLines.join("\n")}\n}`;
  downloadBlob(cssText, "palette.css", "text/css");
});
/* ========== Export Module JS ========== */
/* Put this file after your main script or append to script.js (must run after DOM ready). */

(() => {
  // small helper: prefer your existing toast() if present, otherwise fallback to alert()
  const notify = (msg) => { if (typeof toast === 'function') toast(msg); else alert(msg); };

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Read palette colors from #palette .color-box
  function getPaletteColors() {
    const boxes = Array.from(document.querySelectorAll('#palette .color-box'));
    const colors = boxes.map(box => {
      // prefer dataset.hex or data-hex or data-color if set by your main script
      const ds = box.dataset;
      const hex = ds.hex || ds.color || ds.value || ds.hexcode || ds.hexCode || null;
      if (hex) return hex;
      // otherwise get computed background color and convert to hex if needed
      const bg = window.getComputedStyle(box).backgroundColor;
      return rgbStringToHex(bg);
    }).filter(Boolean);
    return colors;
  }

  // convert "rgb(12,34,56)" or "rgba(...)" to "#0c2238"
  function rgbStringToHex(rgb) {
    if (!rgb) return null;
    // already hex?
    if (/^#/.test(rgb.trim())) return rgb.trim();
    const m = rgb.match(/\d+/g);
    if (!m || m.length < 3) return null;
    const r = parseInt(m[0], 10), g = parseInt(m[1], 10), b = parseInt(m[2], 10);
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
  }

  // --- Export Palette PNG (screenshot of #palette) ---
  const btnPalettePNG = document.getElementById('export-palette-png');
  if (btnPalettePNG) {
    btnPalettePNG.addEventListener('click', () => {
      const paletteEl = document.getElementById('palette');
      if (!paletteEl) return notify('Palette element not found (#palette).');

      if (typeof html2canvas === 'undefined') {
        notify('html2canvas is required to export PNG. Include the library.');
        return;
      }

      html2canvas(paletteEl, { backgroundColor: null, scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'palette.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        notify('Palette PNG downloaded.');
      }).catch(err => {
        console.error(err);
        notify('Failed to export palette PNG.');
      });
    });
  }

  // --- Export Palette JSON ---
  const btnPaletteJSON = document.getElementById('export-palette-json');
  if (btnPaletteJSON) {
    btnPaletteJSON.addEventListener('click', () => {
      const colors = getPaletteColors();
      if (!colors.length) return notify('No colors found to export.');
      downloadBlob(JSON.stringify(colors, null, 2), 'palette.json', 'application/json');
      notify('Palette JSON downloaded.');
    });
  }

  // --- Export Palette CSS Variables ---
  const btnPaletteCSS = document.getElementById('export-palette-css');
  if (btnPaletteCSS) {
    btnPaletteCSS.addEventListener('click', () => {
      const colors = getPaletteColors();
      if (!colors.length) return notify('No colors found to export.');
      const lines = colors.map((c, i) => `  --color-${i+1}: ${c};`);
      const css = `:root {\n${lines.join('\n')}\n}\n`;
      downloadBlob(css, 'palette.css', 'text/css');
      notify('Palette CSS downloaded.');
    });
  }

  // --- Export Gradient: PNG screenshot (from generator) + CSS file ---
  const btnGradient = document.getElementById('export-gradient');
  if (btnGradient) {
    btnGradient.addEventListener('click', async () => {
      // 1) find the gradient preview used by the generator
      let gradientEl = document.querySelector('#gradient-preview'); // your generator uses this id
      // If there are multiple, prefer the one inside the tools/generator section (heuristic)
      if (document.querySelector('#tools #gradient-preview')) {
        gradientEl = document.querySelector('#tools #gradient-preview');
      }

      if (!gradientEl) {
        notify('Gradient preview element not found (#gradient-preview).');
        return;
      }

      if (typeof html2canvas === 'undefined') {
        notify('html2canvas is required to export PNG. Include the library.');
        return;
      }

      try {
        // Screenshot PNG
        const canvas = await html2canvas(gradientEl, { backgroundColor: null, scale: 2 });
        const link = document.createElement('a');
        link.download = 'gradient.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        notify('Gradient PNG downloaded.');
      } catch (err) {
        console.error('Gradient PNG export failed:', err);
        notify('Failed to export gradient PNG.');
      }

      // Now build CSS for the gradient
      // Prefer computed style background-image; fallback to generator inputs if computed style is plain color
      const computed = window.getComputedStyle(gradientEl).backgroundImage;

      let cssGradient = '';

      if (computed && computed !== 'none' && computed.includes('gradient')) {
        // use computed background (this will typically be like 'linear-gradient(...)')
        cssGradient = computed;
      } else {
        // fallback: build from generator inputs
        const c1 = (document.getElementById('gradColor1') && document.getElementById('gradColor1').value) || null;
        const c2 = (document.getElementById('gradColor2') && document.getElementById('gradColor2').value) || null;
        const angle = (document.getElementById('gradAngle') && document.getElementById('gradAngle').value) || '90';
        if (c1 && c2) {
          cssGradient = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
        }
      }

      if (cssGradient) {
        const cssContent = `.gradient-preview {\n  background: ${cssGradient};\n}\n`;
        downloadBlob(cssContent, 'gradient.css', 'text/css');
        notify('Gradient CSS downloaded.');
      } else {
        notify('Unable to determine gradient CSS to export.');
      }
    });
  }

})();