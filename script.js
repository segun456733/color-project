/* =========================================================================
   Complete Unified Script for Color World
   ========================================================================= */

/* ---------- utilities ---------- */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const toast = (txt, ms=1400) => {
  const t = $('#toast');
  t.textContent = txt;
  t.classList.add('show');
  clearTimeout(toast._t);
  t.style.opacity = '1';
  toast._t = setTimeout(()=>{ 
    t.style.opacity = '0'; 
    t.classList.remove('show'); 
  }, ms);
};

/* ---------- Splash / slider ---------- */
window.addEventListener('load', () => {
  const splash = $('#splash');
  const track = $('#sliderTrack');
  if (track) track.innerHTML += track.innerHTML; // duplicate for loop
  setTimeout(() => {
    if (splash) splash.style.display = 'none';
    $('#home')?.scrollIntoView({behavior:'smooth'});
  }, 1500);
});
$('#splash-enter')?.addEventListener('click', () => {
  $('#generator')?.scrollIntoView({behavior:'smooth'});
  $('#splash').style.display = 'none';
});

/* ---------- Palette Generator ---------- */
const paletteBoxes = $$('.color-box');
const generateBtn = $('#generate-btn');
function randomColor() {
  return '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
}
function initPalette() {
  paletteBoxes.forEach(b=>{
    const label = b.querySelector('.copy');
    let hex = label ? label.textContent.trim() : randomColor();
    if (!hex.startsWith('#')) hex = '#'+hex;
    b.style.background = hex;
    b.dataset.hex = hex;
    if (label) label.textContent = hex;
  });
}
initPalette();
function setFromPalette(color) {
  const contrastTarget = $('input[name="contrastTarget"]:checked')?.value;
  const gradientTarget = $('input[name="gradientTarget"]:checked')?.value;
  if (contrastTarget && $('#'+contrastTarget)) {
    $('#'+contrastTarget).value = color;
    updateContrastMain();
  }
  if (gradientTarget && $('#'+gradientTarget)) {
    $('#'+gradientTarget).value = color;
    updateGradientPreview();
  }
  const shBase = $('#sh_base');
  if (shBase) shBase.value = color;
}
function generatePalette() {
  paletteBoxes.forEach(b=>{
    const hex = randomColor();
    b.style.background = hex;
    b.dataset.hex = hex;
    const label = b.querySelector('.copy');
    if (label) label.textContent = hex;
  });
  toast('New palette generated');
}
generateBtn?.addEventListener('click', generatePalette);
document.body.addEventListener('keydown', e=>{
  if (e.code==='Space' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
    e.preventDefault(); generatePalette();
  }
});
paletteBoxes.forEach(b=>{
  b.addEventListener('click', ()=>{
    const hex = b.dataset.hex;
    if (!hex) return;
    navigator.clipboard.writeText(hex).then(()=>toast('Copied: '+hex));
    setFromPalette(hex);
    b.classList.add('popped');
    setTimeout(()=>b.classList.remove('popped'),220);
  });
});

/* ---------- Gradient Generator ---------- */
function updateGradientPreview(){
  const a = $('#gradColor1').value, b = $('#gradColor2').value, ang = $('#gradAngle').value;
  $('#angleVal').textContent = ang+'°';
  $('#gradient-preview').style.background = `linear-gradient(${ang}deg, ${a}, ${b})`;
}
$('#gradColor1')?.addEventListener('input', updateGradientPreview);
$('#gradColor2')?.addEventListener('input', updateGradientPreview);
$('#gradAngle')?.addEventListener('input', updateGradientPreview);
updateGradientPreview();
$('#copyGradient')?.addEventListener('click', ()=>{
  const grad = $('#gradient-preview').style.background;
  navigator.clipboard.writeText(`background: ${grad};`).then(()=>toast('Gradient CSS copied'));
});

/* ---------- Contrast Checker (main) ---------- */
function hexToRgb(hex){ hex=hex.replace('#',''); return [0,2,4].map(i=>parseInt(hex.substr(i,2),16)); }
function luminance(hex){ const [r,g,b]=hexToRgb(hex).map(v=>v/255); const f=v=>(v<=.03928)?v/12.92:Math.pow((v+.055)/1.055,2.4); return .2126*f(r)+.7152*f(g)+.0722*f(b); }
function contrastRatio(a,b){ const L1=luminance(a),L2=luminance(b); return (Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05); }
const color1=$('#color1'), color2=$('#color2');
function updateContrastMain(){
  if (!color1||!color2) return;
  const ratio=contrastRatio(color1.value,color2.value);
  $('#contrast-result').textContent=`Contrast Ratio: ${ratio.toFixed(2)}:1`;
  let rating='Fail';
  if (ratio>=7) rating='AAA (Normal)';
  else if (ratio>=4.5) rating='AA (Normal)';
  else if (ratio>=3) rating='AA (Large)';
  $('#contrast-rating').textContent=`WCAG: ${rating}`;
}
color1?.addEventListener('input', updateContrastMain);
color2?.addEventListener('input', updateContrastMain);
updateContrastMain();

/* ---------- Tabs ---------- */
const tabBtns=$$('.tab-btn'), tabPanels=$$('.tab-panel');
tabBtns.forEach(btn=>{
  btn.addEventListener('click',()=>{
    tabBtns.forEach(b=>b.classList.remove('active'));
    tabPanels.forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    $('#'+btn.dataset.tab).classList.add('active');
  });
});

/* ---------- Extra Contrast ---------- */
const extraA=$('#extra_color_a'), extraB=$('#extra_color_b');
function updateExtraContrast(){
  const a=extraA.value, b=extraB.value, ratio=contrastRatio(a,b);
  $('#extra_contrast_result').textContent=`Contrast Ratio: ${ratio.toFixed(2)}:1`;
  $('#extra_preview_a').style.background=b; $('#extra_preview_a').style.color=a;
  $('#extra_preview_b').style.background=a; $('#extra_preview_b').style.color=b;
}
extraA?.addEventListener('input', updateExtraContrast);
extraB?.addEventListener('input', updateExtraContrast);
updateExtraContrast();

/* ---------- Color Harmony ---------- */
function hexToHsl(hex) {
  const [r,g,b] = hexToRgb(hex).map(v=>v/255);
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){
    const d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
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
  if(h<60) [r,g,b]=[c,x,0];
  else if(h<120) [r,g,b]=[x,c,0];
  else if(h<180) [r,g,b]=[0,c,x];
  else if(h<240) [r,g,b]=[0,x,c];
  else if(h<300) [r,g,b]=[x,0,c];
  else [r,g,b]=[c,0,x];
  return "#"+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');
}
function genHarmony(baseHex, mode){
  const [h,s,l]=hexToHsl(baseHex);
  let hs=[];
  if(mode==="complementary") hs=[h,(h+180)%360];
  else if(mode==="analogous") hs=[h,(h+30)%360,(h+330)%360];
  else if(mode==="triadic") hs=[h,(h+120)%360,(h+240)%360];
  else if(mode==="tetradic") hs=[h,(h+90)%360,(h+180)%360,(h+270)%360];
  else if(mode==="monochrome") return [hslToHex(h,s,l-20), baseHex, hslToHex(h,s,l+20)];
  return hs.map(H=>hslToHex(H,s,l));
}
$('#h_generate')?.addEventListener('click', ()=>{
  const base=$('#h_base').value, mode=$('#h_mode').value;
  const colors=genHarmony(base,mode);
  const grid=$('#harmony_grid'); grid.innerHTML='';
  colors.forEach(c=>{
    const div=document.createElement('div');
    div.className='shade-box'; div.style.background=c; div.textContent=c;
    div.addEventListener('click',()=>navigator.clipboard.writeText(c).then(()=>toast('Copied '+c)));
    grid.appendChild(div);
  });
});
$('#h_copy')?.addEventListener('click', ()=>{
  const cols=$$('#harmony_grid .shade-box').map(d=>d.textContent).join(', ');
  if(cols) navigator.clipboard.writeText(cols).then(()=>toast('Copied Harmony Colors'));
});

/* ---------- Shades & Tints ---------- */
$('#sh_generate')?.addEventListener('click', ()=>{
  const base=$('#sh_base').value;
  const [h,s,l]=hexToHsl(base);
  const grid=$('#sh_grid'); grid.innerHTML='';
  for(let i=10;i<=90;i+=10){
    const tint=hslToHex(h,s,i);
    const shade=hslToHex(h,s,100-i);
    [tint,shade].forEach(c=>{
      const div=document.createElement('div');
      div.className='shade-box'; div.style.background=c; div.textContent=c;
      div.addEventListener('click',()=>navigator.clipboard.writeText(c).then(()=>toast('Copied '+c)));
      grid.appendChild(div);
    });
  }
});

/* ---------- Color Blindness Simulator ---------- */
const blindnessFilters={
  protanopia:'url(#protanopia)',
  deuteranopia:'url(#deuteranopia)',
  tritanopia:'url(#tritanopia)',
  achromatopsia:'grayscale(100%)'
};
$('#cb_text')?.addEventListener('input', updateBlindness);
$('#cb_bg')?.addEventListener('input', updateBlindness);
function updateBlindness(){
  const fg=$('#cb_text').value, bg=$('#cb_bg').value;
  const ratio=contrastRatio(fg,bg);
  $('#cb_ratio').textContent=`Contrast Ratio: ${ratio.toFixed(2)}:1`;
  const grid=$('#cb_grid'); grid.innerHTML='';
  Object.entries(blindnessFilters).forEach(([type,filter])=>{
    const div=document.createElement('div');
    div.className='preview-box';
    div.style.background=bg; div.style.color=fg;
    div.style.filter=filter;
    div.textContent=type;
    grid.appendChild(div);
  });
}
updateBlindness();

/* ---------- Image Extractor ---------- */
$('#img_input')?.addEventListener('change', e=>{
  const file=e.target.files[0]; if(!file) return;
  const img=new Image();
  img.onload=function(){
    const canvas=$('#extract_canvas'), ctx=canvas.getContext('2d');
    canvas.width=this.width; canvas.height=this.height;
    ctx.drawImage(this,0,0);
    const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    const colors={};
    for(let i=0;i<data.length;i+=40){
      const r=data[i],g=data[i+1],b=data[i+2];
      const hex="#"+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
      colors[hex]=(colors[hex]||0)+1;
    }
    const sorted=Object.entries(colors).sort((a,b)=>b[1]-a[1]).slice(0,8).map(c=>c[0]);
    const grid=$('#extracted_colors'); grid.innerHTML='';
    sorted.forEach(c=>{
      const div=document.createElement('div');
      div.className='shade-box'; div.style.background=c; div.textContent=c;
      grid.appendChild(div);
    });
  };
  img.src=URL.createObjectURL(file);
});
$('#ex_copy')?.addEventListener('click', ()=>{
  const cols=$$('#extracted_colors .shade-box').map(d=>d.textContent).join(', ');
  if(cols) navigator.clipboard.writeText(cols).then(()=>toast('Copied extracted colors'));
});
$('#ex_download')?.addEventListener('click', ()=>{
  const cols=$$('#extracted_colors .shade-box').map(d=>d.textContent).join('\n');
  if(!cols) return toast('No colors to download');
  const blob=new Blob([cols], {type:'text/plain'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download='extracted_colors.txt';
  link.click();
  toast('Extracted colors downloaded');
});

/* ---------- Export ---------- */
$('#export_palette')?.addEventListener('click', ()=>{
  const colors=$$('.color-box').map(b=>b.dataset.hex||'').filter(Boolean);
  const blob=new Blob([colors.join('\n')], {type:'text/plain'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download='palette.txt';
  link.click();
  toast('Palette downloaded as TXT');
});
$('#export_json')?.addEventListener('click', ()=>{
  const colors=$$('.color-box').map(b=>b.dataset.hex||'').filter(Boolean);
  const blob=new Blob([JSON.stringify(colors,null,2)], {type:'application/json'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download='palette.json';
  link.click();
  toast('Palette exported as JSON');
});
$('#export_grad_img')?.addEventListener('click', ()=>{
  const grad=$('#gradient-preview').style.background;
  const canvas=document.createElement('canvas'); canvas.width=800; canvas.height=200;
  const ctx=canvas.getContext('2d');
  const cols=grad.match(/#[0-9a-f]{6}/gi)||['#000','#fff'];
  const gradient=ctx.createLinearGradient(0,0,canvas.width,0);
  gradient.addColorStop(0,cols[0]);
  gradient.addColorStop(1,cols[1]);
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const link=document.createElement('a');
  link.href=canvas.toDataURL('image/png');
  link.download='gradient.png';
  link.click();
  toast('Gradient saved as PNG');
});

/* ---------- Mobile Nav ---------- */
const menuBtn = $('#menuToggle');
const nav = $('#navLinks');
const overlay = $('#navOverlay');
function openNav(){ nav.classList.add("show"); overlay.classList.add("show"); }
function closeNav(){ nav.classList.remove("show"); overlay.classList.remove("show"); }
function toggleNav(){ nav.classList.contains("show")?closeNav():openNav(); }
document.addEventListener("DOMContentLoaded", closeNav);
menuBtn?.addEventListener("click", toggleNav);
overlay?.addEventListener("click", closeNav);
nav?.querySelectorAll("a").forEach(link=>link.addEventListener("click", closeNav));
// Splash animation (3.5 seconds)
window.addEventListener('load', () => {
  const splash = document.getElementById('splash');

  // Show splash for 3.5 seconds
  setTimeout(() => {
    if (splash) splash.style.display = 'none';

    // Scroll to home section after splash
    document.getElementById('home')?.scrollIntoView({behavior:'smooth'});
  }, 2500);
});
/* ==============================================
   Formspree Contact Form with Toast*/
(function(){
  const contactForm = document.getElementById('contactForm');
  const toastDiv = document.getElementById('toast');

  function showToast(message, duration=3000){
    if(!toastDiv) return;
    toastDiv.textContent = message;
    toastDiv.style.background = 'linear-gradient(90deg, #ff7e5f, #feb47b)';
    toastDiv.style.color = '#fff';
    toastDiv.style.opacity = '1';
    toastDiv.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>{
      toastDiv.classList.remove('show');
      toastDiv.style.opacity = '0';
    }, duration);
  }

  if(contactForm){
    contactForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const formData = new FormData(contactForm);
      try{
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept':'application/json' }
        });

        if(response.ok){
          showToast('Your message was sent!');
          contactForm.reset();
        } else {
          showToast('Oops! Something went wrong.');
        }
      } catch(err){
        showToast('Error sending message.');
        console.error(err);
      }
    });
  }
})();
