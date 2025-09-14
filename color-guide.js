// =================== Full Interactive Color Guide + Library ===================

// ======= Elements =======
const cgTitle = document.getElementById('cg-title');
const cgDescription = document.getElementById('cg-description');
const cgSwatches = document.getElementById('cg-swatches');
const cgGradientPreview = document.getElementById('cg-gradient-preview');
const cgUsageList = document.getElementById('cg-usage-list');
const cgColorTree = document.getElementById('cg-color-tree');
const cgPrev = document.getElementById('cg-prev');
const cgNext = document.getElementById('cg-next');
const decadeBtns = document.querySelectorAll('.cg-decade-btn');
const mainPalette = document.getElementById('palette'); // your main project palette
let currentIndex = 0;
let activePaletteIndex = null;

// ======= Utilities =======
const $ = (s, ctx=document)=>ctx.querySelector(s);
const $$ = (s, ctx=document)=>Array.from((ctx||document).querySelectorAll(s));

function toast(msg){
  const t=document.createElement('div');
  t.textContent=msg;
  Object.assign(t.style,{
    position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)',
    background:'#333', color:'#fff', padding:'8px 12px', borderRadius:'6px',
    opacity:'0', transition:'opacity 0.3s', zIndex:9999
  });
  document.body.appendChild(t);
  requestAnimationFrame(()=>t.style.opacity=1);
  setTimeout(()=>t.style.opacity=0,1800);
  setTimeout(()=>document.body.removeChild(t),2000);
}

function randomColor(){
  return '#'+Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0').toUpperCase();
}

// ======= Sample Data =======
const colorGuideData = [
  {title:"1990s",description:"Bright neon colors & bold contrasts.",swatches:["#ff007f","#00ffff","#ffcc00","#9900ff"],gradient:["#ff007f","#00ffff"],tree:["#ff007f","#ff66cc","#00ffff","#ccff00","#9900ff"],usage:["Backgrounds: neon panels","Text: minimal for readability","Buttons: bright accents"]},
  {title:"2000s",description:"Web-safe colors & glossy UI.",swatches:["#6699cc","#ff6600","#33cc33","#cc0033"],gradient:["#6699cc","#ff6600"],tree:["#6699cc","#99ccff","#ff6600","#ff9966","#33cc33"],usage:["Backgrounds: soft pastels","Text: clear black or white","Accents: buttons and icons"]},
  {title:"2010s",description:"Flat design with bold simple palettes.",swatches:["#03a9f4","#f441a5","#ffc107","#8bc34a"],gradient:["#03a9f4","#f441a5"],tree:["#03a9f4","#00bcd4","#f441a5","#e91e63","#ffc107"],usage:["Backgrounds: neutral with color pops","Text: high contrast","Buttons: solid colors"]},
  {title:"2020s",description:"Minimalism, muted tones & dynamic gradients.",swatches:["#f5a623","#50e3c2","#b8e986","#bd10e0"],gradient:["#f5a623","#50e3c2"],tree:["#f5a623","#f7c25b","#50e3c2","#3ad8b0","#bd10e0"],usage:["Backgrounds: muted soft colors","Text: clear legible","Accents: subtle highlights"]}
];

const seededPalettes=[
  {name:'Material UI - Primary',tags:['material','ui'],colors:['#F44336','#E91E63','#9C27B0','#3F51B5','#03A9F4']},
  {name:'Tailwind - Warm',tags:['tailwind','warm'],colors:['#f97316','#fb923c','#f59e0b','#ef4444','#dc2626']},
  {name:'Flat UI - Ocean',tags:['flat','ocean'],colors:['#3498db','#2ecc71','#e74c3c','#f1c40f','#9b59b6']},
  {name:'Pastels',tags:['pastel'],colors:['#f8c8dc','#dbeafe','#e9ffd8','#fff4cc','#e7d6ff']}
];

// ======= Interactive Helpers =======
function updateMainPalette(colors){
  if(!mainPalette) return;
  mainPalette.innerHTML='';
  colors.forEach(c=>{
    const sw=document.createElement('div');
    sw.className='color-box';
    sw.style.background=c;
    sw.dataset.hex=c;
    sw.addEventListener('click',()=> tweakColorInteractive(sw));
    mainPalette.appendChild(sw);
  });
  localStorage.setItem('mainPalette',JSON.stringify(colors));
}

function tweakColorInteractive(sw){
  const current = sw.dataset.hex;
  const newHex = prompt('Edit color (hex):',current);
  if(newHex){
    sw.style.background=newHex;
    sw.dataset.hex=newHex;
    const allColors=Array.from(mainPalette.querySelectorAll('.color-box')).map(b=>b.dataset.hex);
    localStorage.setItem('mainPalette',JSON.stringify(allColors));
    toast('Color updated to '+newHex);
  }
}

function loadSwatch(color){
  if(!mainPalette) return;
  const emptyBox = mainPalette.querySelector('.color-box') || null;
  if(emptyBox){ emptyBox.style.background=color; emptyBox.dataset.hex=color; }
  else{
    const sw=document.createElement('div');
    sw.className='color-box';
    sw.style.background=color;
    sw.dataset.hex=color;
    sw.addEventListener('click',()=> tweakColorInteractive(sw));
    mainPalette.appendChild(sw);
  }
  const allColors=Array.from(mainPalette.querySelectorAll('.color-box')).map(b=>b.dataset.hex);
  localStorage.setItem('mainPalette',JSON.stringify(allColors));
}

// ======= Render Color Guide =======
function renderColorGuide(index){
  const data=colorGuideData[index];
  cgTitle.textContent=data.title;
  cgDescription.textContent=data.description;

  cgSwatches.innerHTML='';
  data.swatches.forEach(c=>{
    const sw=document.createElement('div');
    sw.className='cg-swatch';
    sw.style.background=c;
    sw.dataset.hex=c;
    sw.title=c;
    sw.addEventListener('click',()=> loadSwatch(c));
    cgSwatches.appendChild(sw);
  });

  cgGradientPreview.style.background=`linear-gradient(to right, ${data.gradient[0]}, ${data.gradient[1]})`;

  cgColorTree.innerHTML='';
  data.tree.forEach(c=>{
    const node=document.createElement('div');
    node.className='cg-tree-node';
    node.style.background=c;
    node.dataset.hex=c;
    node.title=c;
    node.addEventListener('click',()=> loadSwatch(c));
    cgColorTree.appendChild(node);
  });

  cgUsageList.innerHTML='';
  data.usage.forEach(u=>{
    const li=document.createElement('li'); li.textContent=u; cgUsageList.appendChild(li);
  });

  decadeBtns.forEach(b=>b.classList.remove('active'));
  decadeBtns[index]?.classList.add('active');
  cgPrev.disabled=index===0; cgNext.disabled=index===colorGuideData.length-1;
}

// ======= Navigation =======
cgPrev.addEventListener('click',()=>{if(currentIndex>0)currentIndex--;renderColorGuide(currentIndex);});
cgNext.addEventListener('click',()=>{if(currentIndex<colorGuideData.length-1)currentIndex++;renderColorGuide(currentIndex);});
decadeBtns.forEach(btn=>btn.addEventListener('click',()=>{currentIndex=parseInt(btn.dataset.index);renderColorGuide(currentIndex);}));
document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')cgPrev.click();if(e.key==='ArrowRight')cgNext.click();});

// ======= Advanced Library =======
function renderPaletteLibrary(containerId='palette-library'){
  let root=document.getElementById(containerId);
  if(!root){root=document.createElement('div');root.id=containerId;document.querySelector('.cg-container')?.appendChild(root);}
  root.innerHTML=`
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <input id="lib-search" placeholder="Search palettes..." style="padding:8px;border-radius:8px;border:1px solid #ddd;flex:1;">
      <select id="lib-filter">
        <option value="">All</option>
        <option value="material">Material</option>
        <option value="tailwind">Tailwind</option>
        <option value="pastel">Pastel</option>
        <option value="flat">Flat</option>
      </select>
    </div>
    <div id="lib-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px"></div>
  `;
  const grid=$('#lib-grid');

  function renderList(list){
    grid.innerHTML='';
    list.forEach((p,idx)=>{
      const card=document.createElement('div');
      card.className='palette-card';
      card.style.padding='10px'; card.style.borderRadius='10px'; card.style.background='#fff'; card.style.boxShadow='0 6px 20px rgba(0,0,0,0.04)';
      card.dataset.idx=idx; if(idx===activePaletteIndex)card.style.border='3px solid #4CAF50';
      card.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>${p.name}</strong>
          <div>
            <button class="load-lib-btn" data-idx="${idx}">Load</button>
            <button class="copy-lib-btn" data-idx="${idx}">Copy</button>
          </div>
        </div>
        <div style="display:flex;gap:6px;">
          ${p.colors.map(c=>`<div style="width:36px;height:36px;border-radius:6px;background:${c};border:1px solid #eee"></div>`).join('')}
        </div>
      `;
      grid.appendChild(card);
    });

    $$('.load-lib-btn',grid).forEach(btn=>{
      btn.addEventListener('click',e=>{
        const idx=+e.target.dataset.idx; const p=list[idx];
        updateMainPalette(p.colors);
        activePaletteIndex=idx;
        renderList(list);
        toast('Loaded palette: '+p.name);
      });
    });

    $$('.copy-lib-btn',grid).forEach(btn=>{
      btn.addEventListener('click',e=>{
        const idx=+e.target.dataset.idx; const p=list[idx];
        navigator.clipboard.writeText(p.colors.join(','));
        toast('Copied '+p.name);
      });
    });
  }

  renderList(seededPalettes);

  $('#lib-search').addEventListener('input',e=>{
    const q=e.target.value.toLowerCase();
    const filtered=seededPalettes.filter(p=>p.name.toLowerCase().includes(q)||p.tags.join(' ').includes(q));
    renderList(filtered);
  });

  $('#lib-filter').addEventListener('change',e=>{
    const val=e.target.value;
    const filtered=val?seededPalettes.filter(p=>p.tags.includes(val)):seededPalettes;
    renderList(filtered);
  });
}

// ======= Restore Palette on Load =======
document.addEventListener('DOMContentLoaded',()=>{
  const saved=localStorage.getItem('mainPalette');
  if(saved) updateMainPalette(JSON.parse(saved));
  renderColorGuide(currentIndex);
  renderPaletteLibrary();
});
// =================== Advanced Interactive Suggestions ===================

// Helper: calculate luminance
function luminance(hex){
  const c=parseInt(hex.slice(1),16);
  const r=((c>>16)&255)/255;
  const g=((c>>8)&255)/255;
  const b=(c&255)/255;
  const a=[r,g,b].map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));
  return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];
}

// Helper: contrast ratio
function contrastRatio(hex1,hex2){
  const l1=luminance(hex1), l2=luminance(hex2);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}

// Suggest WCAG-safe color (simple adjustment)
function suggestSafeColor(hex,bg='#ffffff',minRatio=4.5){
  if(contrastRatio(hex,bg)>=minRatio) return hex;
  // adjust lightness
  let hsl=hexToHsl(hex);
  let [,s,l]=hsl;
  if(l<50) l=70; else l=30;
  return hslToHex([hsl[0],s,l]);
}

// Simple HSL conversion helpers
function hexToHsl(H){
  let r=parseInt(H.substring(1,3),16)/255;
  let g=parseInt(H.substring(3,5),16)/255;
  let b=parseInt(H.substring(5,7),16)/255;
  let cMax=Math.max(r,g,b), cMin=Math.min(r,g,b), delta=cMax-cMin;
  let h=0, s=0, l=(cMax+cMin)/2;
  if(delta!==0){
    h= cMax===r ? ((g-b)/delta)%6 : cMax===g ? ((b-r)/delta)+2 : ((r-g)/delta)+4;
    h=Math.round(h*60); if(h<0) h+=360;
    s= delta/(1-Math.abs(2*l-1));
  }
  return [h,s*100,l*100];
}
function hslToHex([h,s,l]){
  s/=100;l/=100;
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
  r=Math.round((r+m)*255); g=Math.round((g+m)*255); b=Math.round((b+m)*255);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1).toUpperCase();
}

// ======= Add Text Preview & Suggestion Box =======
function addSuggestionBox(color){
  let container=document.getElementById('color-suggestions');
  if(!container){
    container=document.createElement('div'); container.id='color-suggestions';
    container.style.marginTop='10px'; container.style.padding='10px'; container.style.border='1px solid #ddd'; container.style.borderRadius='6px';
    document.querySelector('.cg-container')?.appendChild(container);
  }
  container.innerHTML='';

  // Live text preview
  const textSample=document.createElement('div');
  textSample.textContent='AaBbCc 123';
  textSample.style.background=color; textSample.style.color=suggestSafeColor('#000',color);
  textSample.style.padding='8px'; textSample.style.borderRadius='4px'; textSample.style.marginBottom='8px';
  container.appendChild(textSample);

  // Suggested WCAG-safe colors
  const safeColor=suggestSafeColor('#000',color);
  const safeBox=document.createElement('div'); safeBox.textContent='Suggested Text Color: '+safeColor;
  safeBox.style.background=color; safeBox.style.color=safeColor; safeBox.style.padding='6px'; safeBox.style.borderRadius='4px';
  container.appendChild(safeBox);

  // Gradient suggestions (analogous)
  const hsl=hexToHsl(color);
  const analogous1=hslToHex([(hsl[0]+30)%360,hsl[1],hsl[2]]);
  const analogous2=hslToHex([(hsl[0]-30+360)%360,hsl[1],hsl[2]]);
  const gradSample=document.createElement('div'); gradSample.style.background=`linear-gradient(to right, ${color}, ${analogous1}, ${analogous2})`; gradSample.style.height='40px'; gradSample.style.borderRadius='4px'; gradSample.style.marginTop='8px';
  container.appendChild(gradSample);

  toast('Interactive suggestions updated!');
}

// ======= Hook into Swatches =======
function attachInteractiveSuggestions(){
  const allSwatches=$$('.cg-swatch, .color-box');
  allSwatches.forEach(sw=>{
    sw.addEventListener('click',()=>{
      addSuggestionBox(sw.dataset.hex);
    });
  });
}

// Run after guide and library are rendered
document.addEventListener('DOMContentLoaded',()=>{
  attachInteractiveSuggestions();
});
