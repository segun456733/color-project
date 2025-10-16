/* =========================================================================
   Contrast Advanced — ColorWorld (cw- prefix)
   Full self-contained module with Text and Genshin/JSON reports
   ========================================================================= */
(function ContrastAdvancedCW(){
  'use strict';

  /* ---------- Tiny helpers ---------- */
  const $ = (s, ctx=document) => ctx.querySelector(s);
  const $$ = (s, ctx=document) => Array.from((ctx||document).querySelectorAll(s));
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const safeHex = h=>(h||'#000000').toString().trim();

  /* ---------- Color conversions ---------- */
  function hexToRgb(hex){ 
    if(!hex) return [0,0,0]; 
    hex = safeHex(hex).replace('#',''); 
    if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
    hex = hex.slice(0,6);
    return [parseInt(hex.slice(0,2),16)||0, parseInt(hex.slice(2,4),16)||0, parseInt(hex.slice(4,6),16)||0]; 
  }
  function rgbToHex(r,g,b){ return '#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join(''); }
  function hexToHsl(hex){
    const [r,g,b] = hexToRgb(hex).map(v=>v/255);
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h=0,s=0,l=(max+min)/2;
    if(max!==min){
      const d=max-min;
      s=l>0.5?d/(2-max-min):d/(max+min);
      switch(max){
        case r: h=(g-b)/d + (g<b?6:0); break;
        case g: h=(b-r)/d + 2; break;
        case b: h=(r-g)/d + 4; break;
      }
      h/=6;
    }
    return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
  }
  function hslToHex(h,s,l){
    s/=100; l/=100;
    const c=(1-Math.abs(2*l-1))*s;
    const x=c*(1-Math.abs((h/60)%2-1));
    const m=l-c/2;
    let [r,g,b]=[0,0,0];
    if(h<60)[r,g,b]=[c,x,0];
    else if(h<120)[r,g,b]=[x,c,0];
    else if(h<180)[r,g,b]=[0,c,x];
    else if(h<240)[r,g,b]=[0,x,c];
    else if(h<300)[r,g,b]=[x,0,c];
    else [r,g,b]=[c,0,x];
    return rgbToHex(Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255));
  }

  /* ---------- Luminance & contrast ---------- */
  function luminance(hex){
    const [r,g,b]=hexToRgb(hex).map(v=>v/255);
    const f=v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);
  }
  function contrastRatio(a,b){ return (Math.max(luminance(a),luminance(b))+0.05)/(Math.min(luminance(a),luminance(b))+0.05); }
  function formatRatio(r){ return Number.isFinite(r)?r.toFixed(2)+':1':'—'; }
  function assessRatio(r){ return { normal: r>=7?'AAA':r>=4.5?'AA':'Fail', large: r>=4.5?'AAA':r>=3?'AA':'Fail' }; }

  /* ---------- Container & HTML ---------- */
  let container=$('#cw-contrast-advanced');
  if(!container){
    container=document.createElement('section');
    container.id='cw-contrast-advanced';
    const anchor=$('#tools')||$('#generator')||$('#extra-tools')||document.body;
    anchor.parentNode.insertBefore(container, anchor.nextSibling);
  }
  container.innerHTML=`
    <div class="cw-sample" style="color: var(--card-text);
background: var(--card-bg)">
      <div class="cw-sample-box" id="cw-sample-box">Aa — Sample</div>
      <div class="cw-controls">
        <label>FG <input id="cw-color1" type="color" value="#000000"></label>
        <label>BG <input id="cw-color2" type="color" value="#ffffff"></label>
        <button id="cw-swap-btn" class="cw-btn prim">Swap FG/BG</button>
        <button id="cw-pilot-btn" class="cw-btn prim">Set from Pilot</button>
        <div class="cw-typography">
          <label>Size <select id="cw-font-size"><option value="12">12px</option><option value="16" selected>16px</option><option value="20">20px</option><option value="32">32px</option></select></label>
          <label>Weight <select id="cw-font-weight"><option value="300">300</option><option value="400" selected>400</option><option value="600">600</option><option value="700">700</option></select></label>
          <label>Text <input id="cw-sample-text" value="Contrast sample text"></label>
        </div>
      </div>
      <div class="cw-info" style="color: var(--card-text);
background: var(--card-bg)">
        <div class="cw-ratio" id="cw-ratio">Contrast: —</div>
        <div class="cw-wcag" id="cw-wcag">WCAG: —</div>
      </div>
      <div class="cw-heat" id="cw-heat"><div class="cw-pointer" id="cw-pointer"></div></div>
      <div class="cw-sim-wrap">
        <label>Simulate: <select id="cw-sim"><option value="none">None</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option><option value="tritanopia">Tritanopia</option><option value="grayscale">Grayscale</option></select></label>
        <button id="cw-demo">▶ Demo</button>
        <button id="cw-save-pair">★ Save Pair</button>
      </div>
      <div class="cw-fav" id="cw-fav-list"></div>
      <div class="cw-note">Tip: click a palette color to set FG/BG, press X to swap.</div>
    </div>
    <aside id="cw-suggestions-panel" style="color: var(--card-text);
background: var(--card-bg)">
      <h4>Suggestions & Actions</h4>
      <div id="cw-suggestions-container"></div>
      <div>
        <button id="cw-copy-css">Copy CSS snippet</button>
        <button id="cw-download-txt">Report Text</button>
        <button id="cw-download-json">Report Genshin</button>
               
      </div>
    </aside>
    <div class="cw-copy-toast" id="cw-copy-toast">Copied</div>
  `;
/* ---------- Elements ---------- */
const fgInput=$('#cw-color1'), bgInput=$('#cw-color2'), sampleBox=$('#cw-sample-box');
const ratioEl=$('#cw-ratio'), wcagEl=$('#cw-wcag'), pointerEl=$('#cw-pointer');
const simSelect=$('#cw-sim'), fontSizeSel=$('#cw-font-size'), fontWeightSel=$('#cw-font-weight');
const sampleTextInput=$('#cw-sample-text'), suggestionsContainer=$('#cw-suggestions-container');
const copyToast=$('#cw-copy-toast'), demoBtn=$('#cw-demo'), savePairBtn=$('#cw-save-pair'), favList=$('#cw-fav-list');
const copyCssBtn=$('#cw-copy-css'), dlTxtBtn=$('#cw-download-txt'), dlJsonBtn=$('#cw-download-json');
const swapBtn=$('#cw-swap-btn'), pilotBtn=$('#cw-pilot-btn');
const darkToggleBtn = $('#cw-dark-toggle');  // <-- ADD THIS LINE

  /* ---------- Palette click & Swap ---------- */
  document.addEventListener('click',ev=>{
    const box=ev.target.closest?.('.color-box'); if(!box) return;
    const hex=box.dataset.hex||box.dataset.color||box.style.backgroundColor; if(!hex) return;
    const sel=document.querySelector('input[name="contrastTarget"]:checked');
    if(sel?.value && document.getElementById(sel.value)) document.getElementById(sel.value).value=hex;
    else ev.shiftKey? bgInput.value=hex : fgInput.value=hex;
    run();
  });
  document.addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    if(e.key.toLowerCase()==='x'){ const tmp=fgInput.value; fgInput.value=bgInput.value; bgInput.value=tmp; run(); }
  });

  /* ---------- Swap FG/BG ---------- */
  swapBtn.addEventListener('click',()=>{ const tmp=fgInput.value; fgInput.value=bgInput.value; bgInput.value=tmp; run(); });

  /* ---------- Set from Pilot ---------- */
  let pilotActive=false;
  pilotBtn.addEventListener('click',()=>{ pilotActive=!pilotActive; pilotBtn.style.background=pilotActive?'#555':''; });

  document.addEventListener('click',ev=>{
    if(!pilotActive) return;
    const box=ev.target.closest?.('.pilot-color'); 
    if(!box) return;
    const hex=box.dataset.hex||box.style.backgroundColor;
    if(!hex) return;
    if(ev.shiftKey) bgInput.value=hex; else fgInput.value=hex;
    run();
  });

  /* ---------- Color blind simulation ---------- */
  function applySimulation(sim){
    sampleBox.style.filter='';
    switch(sim){
      case 'protanopia': sampleBox.style.filter='grayscale(0.15) contrast(1.02) saturate(0.9) hue-rotate(-10deg)'; break;
      case 'deuteranopia': sampleBox.style.filter='grayscale(0.12) saturate(0.88) hue-rotate(-20deg)'; break;
      case 'tritanopia': sampleBox.style.filter='grayscale(0.1) saturate(0.85) hue-rotate(25deg)'; break;
      case 'grayscale': sampleBox.style.filter='grayscale(1)'; break;
    }
  }
  simSelect.addEventListener('change',()=>applySimulation(simSelect.value));

  /* ---------- Favorites ---------- */
  const LS_KEY='cw_contrast_favs_v1';
  function loadFavs(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); } catch(e){ return []; } }
  function saveFavs(list){ try{ localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch(e){} }
  function renderFavs(){
    const list=loadFavs(); favList.innerHTML='';
    list.forEach((p,i)=>{
      const b=document.createElement('button'); b.className='cw-btn ghost';
      b.style.display='inline-flex'; b.style.alignItems='center'; b.style.gap='8px';
      b.title=`FG ${p.fg} BG ${p.bg}`;
      b.innerHTML=`<span style="width:20px;height:14px;border-radius:4px;background:${p.fg};border:1px solid #ddd"></span>
                    <span style="width:20px;height:14px;border-radius:4px;background:${p.bg};border:1px solid #ddd"></span>
                    <span style="font-size:0.85rem">${p.fg} / ${p.bg}</span>`;
      b.addEventListener('click',()=>{ fgInput.value=p.fg; bgInput.value=p.bg; run(); });
      const del=document.createElement('button'); del.className='cw-btn'; del.textContent='✕';
      del.addEventListener('click',e=>{ e.stopPropagation(); list.splice(i,1); saveFavs(list); renderFavs(); });
      const wrap=document.createElement('span'); wrap.style.display='inline-flex'; wrap.style.gap='6px'; wrap.appendChild(b); wrap.appendChild(del);
      favList.appendChild(wrap);
    });
  }
  savePairBtn.addEventListener('click',()=>{
    const list=loadFavs();
    const entry={ fg: fgInput.value, bg: bgInput.value, createdAt: new Date().toISOString() };
    if(!list.some(p=>p.fg===entry.fg && p.bg===entry.bg)){ list.unshift(entry); if(list.length>12) list.pop(); saveFavs(list); renderFavs(); showCopyToast('Saved'); }
    else showCopyToast('Already saved');
  });

  /* ---------- Toast ---------- */
  function showCopyToast(msg){ copyToast.textContent=msg||'Copied'; copyToast.style.opacity='1'; clearTimeout(showCopyToast._t);
    showCopyToast._t=setTimeout(()=>{ copyToast.style.opacity='0'; },1400);
  }

  /* ---------- Suggestions helpers ---------- */
  function suggestVariantsForForeground(fg,bg,target){ const [h,s,l]=hexToHsl(fg); const candidates=new Set();
    for(let d of [12,8,-12,-8,20,-20]){ const L=clamp(l+d,0,100); const hex=hslToHex(h,s,L); if(contrastRatio(hex,bg)>=target) candidates.add(hex); if(candidates.size>=3) break; }
    if(candidates.size<3){ for(let ds of [10,-10,20,-20]){ const S=clamp(s+ds,0,100); for(let L2=0;L2<=100;L2+=6){ const hex=hslToHex(h,S,L2); if(contrastRatio(hex,bg)>=target){ candidates.add(hex); if(candidates.size>=3) break; } } if(candidates.size>=3) break; } }
    return Array.from(candidates).slice(0,3);
  }
  function suggestVariantsForBackground(fg,bg,target){ const [h,s,l]=hexToHsl(bg); const candidates=new Set();
    for(let d of [12,8,-12,-8,20,-20]){ const L=clamp(l+d,0,100); const hex=hslToHex(h,s,L); if(contrastRatio(fg,hex)>=target) candidates.add(hex); if(candidates.size>=3) break; }
    if(candidates.size<3){ for(let ds of [10,-10,20,-20]){ const S=clamp(s+ds,0,100); for(let L2=0;L2<=100;L2+=6){ const hex=hslToHex(h,S,L2); if(contrastRatio(fg,hex)>=target){ candidates.add(hex); if(candidates.size>=3) break; } } if(candidates.size>=3) break; } }
    return Array.from(candidates).slice(0,3);
  }

  /* ---------- Render suggestions ---------- */
  function renderSuggestions({fg,bg,ratio}){
    suggestionsContainer.innerHTML='';
    const targets=[{key:'AA (normal)',v:4.5},{key:'AAA (normal)',v:7},{key:'AA (large)',v:3}];
    targets.forEach(t=>{
      const pass=contrastRatio(fg,bg)>=t.v;
      const row=document.createElement('div'); row.className='cw-suggestion'+(pass?' pass':'');
      const left=document.createElement('div'); left.className='cw-s-left';
      const badge=document.createElement('div'); badge.className='cw-badge'; badge.textContent=t.key;
      const info=document.createElement('div'); info.style.color='#444'; info.style.fontSize='0.92rem'; info.innerHTML=pass?`Meets ${t.v}:1`:`Fails ${t.v}:1`;
      left.appendChild(badge); left.appendChild(info);
      const actions=document.createElement('div'); actions.className='cw-actions';
      if(!pass){
        const fgs=suggestVariantsForForeground(fg,bg,t.v);
        const bgs=suggestVariantsForBackground(fg,bg,t.v);
        fgs.forEach(hex=>{ const sw=document.createElement('div'); sw.style.display='inline-flex'; sw.style.gap='6px'; sw.style.alignItems='center';
          const colorBox=document.createElement('div'); colorBox.style.width='36px'; colorBox.style.height='28px'; colorBox.style.borderRadius='6px'; colorBox.style.background=hex; colorBox.title=hex;
          const ccopy=document.createElement('button'); ccopy.className='cw-btn'; ccopy.textContent='Copy FG'; ccopy.addEventListener('click',()=>{ navigator.clipboard?.writeText(hex).then(()=>showCopyToast('Copied '+hex)); });
          const cap=document.createElement('button'); cap.className='cw-btn prim'; cap.textContent='Apply FG'; cap.addEventListener('click',()=>{ fgInput.value=hex; run(); });
          sw.appendChild(colorBox); sw.appendChild(ccopy); sw.appendChild(cap); actions.appendChild(sw);
        });
        bgs.forEach(hex=>{ const sw=document.createElement('div'); sw.style.display='inline-flex'; sw.style.gap='6px'; sw.style.alignItems='center';
          const colorBox=document.createElement('div'); colorBox.style.width='36px'; colorBox.style.height='28px'; colorBox.style.borderRadius='6px'; colorBox.style.background=hex; colorBox.title=hex;
          const ccopy=document.createElement('button'); ccopy.className='cw-btn'; ccopy.textContent='Copy BG'; ccopy.addEventListener('click',()=>{ navigator.clipboard?.writeText(hex).then(()=>showCopyToast('Copied '+hex)); });
          const cap=document.createElement('button'); cap.className='cw-btn prim'; cap.textContent='Apply BG'; cap.addEventListener('click',()=>{ bgInput.value=hex; run(); });
          sw.appendChild(colorBox); sw.appendChild(ccopy); sw.appendChild(cap); actions.appendChild(sw);
        });
      } else { const ok=document.createElement('div'); ok.style.color='#2d7a2d'; ok.style.fontWeight=700; ok.textContent='Good'; actions.appendChild(ok); }
      row.appendChild(left); row.appendChild(actions); suggestionsContainer.appendChild(row);
    });
  }

  /* ---------- Core run & Heat Pointer ---------- */
  function updateHeatPointer(ratio){
    if(!pointerEl) return;
    const maxContrast=21; 
    const pct=clamp(ratio/maxContrast,0,1);
    pointerEl.style.left=(pct*100)+'%';
  }

  function run(){
    const fg=fgInput.value, bg=bgInput.value;
    const ratio=contrastRatio(fg,bg);
    ratioEl.textContent='Contrast: '+formatRatio(ratio);
    const assess=assessRatio(ratio);
    wcagEl.textContent=`WCAG: normal ${assess.normal}, large ${assess.large}`;
    sampleBox.textContent=sampleTextInput.value;
    sampleBox.style.color=fg; sampleBox.style.backgroundColor=bg;
    sampleBox.style.fontSize=fontSizeSel.value+'px';
    sampleBox.style.fontWeight=fontWeightSel.value;
    renderSuggestions({fg,bg,ratio});
    updateHeatPointer(ratio);
  }

  fgInput.addEventListener('input',run);
  bgInput.addEventListener('input',run);
  fontSizeSel.addEventListener('change',run);
  fontWeightSel.addEventListener('change',run);
  sampleTextInput.addEventListener('input',run);

  /* ---------- Copy / Download ---------- */
  copyCssBtn.addEventListener('click',()=>{ 
    navigator.clipboard.writeText(`color:${fgInput.value}; background:${bgInput.value};`).then(()=>showCopyToast('CSS copied')); 
  });

  dlTxtBtn.addEventListener('click', () => {
    const ratio = contrastRatio(fgInput.value, bgInput.value);
    const assess = assessRatio(ratio);
    const txt = `COLOR CONTRAST REPORT
====================
Foreground: ${fgInput.value}
Background: ${bgInput.value}
Text: ${sampleTextInput.value}
Contrast Ratio: ${formatRatio(ratio)}
WCAG Assessment: Normal ${assess.normal}, Large ${assess.large}
Generated: ${new Date().toLocaleString()}
`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-contrast.txt';
    a.click();
    URL.revokeObjectURL(url);
  });

  dlJsonBtn.addEventListener('click', () => {
    const ratio = contrastRatio(fgInput.value, bgInput.value);
    const assess = assessRatio(ratio);
    // Match old Genshin report order and keys
    const json = {
      reportType: "Genshin",
      foreground: fgInput.value,
      background: bgInput.value,
      text: sampleTextInput.value,
      contrastRatio: formatRatio(ratio),
      wcagNormal: assess.normal,
      wcagLarge: assess.large,
      generatedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(json,null,2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-contrast-genshin.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  
  /* ---------- Demo ---------- */
  demoBtn.addEventListener('click',()=>{
    let step=0;
    const interval=setInterval(()=>{
      const h=(step*30)%360;
      fgInput.value=hslToHex(h,50,40);
      bgInput.value=hslToHex((h+180)%360,50,90);
      run();
      step++; if(step>12) clearInterval(interval);
    },300);
  });

  renderFavs();
  run();

})();
