// =========================
// FUJIYA FULL COLOR EXTRACTOR + HARMONY
// =========================
(function() {
  'use strict';

  // =========================
  // DOM ELEMENTS
  // =========================
  const imgInput = document.getElementById('img_input');
  const imgPreview = document.getElementById('img_preview');
  const imgToggle = document.getElementById('img_toggle');
  const extractedColors = document.getElementById('extracted_colors');
  const copyBtn = document.getElementById('ex_copy');
  const downloadBtn = document.getElementById('ex_download');
  const jsonBtn = document.getElementById('ex_export_json');
  const cssBtn = document.getElementById('ex_export_css');
  const tailwindBtn = document.getElementById('ex_export_tailwind');
  const safeToggle = document.getElementById('safe_colors_toggle');
  const colorCountSelect = document.getElementById('colorCount');
  const harmonyContainer = document.getElementById('harmonies');
  const eyedropInfo = document.getElementById('eyedrop_info');
  const canvas = document.getElementById('extract_canvas');
  const ctx = canvas.getContext('2d');

  // =========================
  // VARIABLES
  // =========================
  let colors = [];
  let originalColors = [];

  // =========================
  // HARMONIES / MOODS
  // =========================
  const moods = {
    vintage: ['#C9ADA7', '#F9E4C8', '#A3A380', '#5D576B', '#2A2D34'],
    pastel: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'],
    vibrant: ['#FF5733', '#FFBD33', '#75FF33', '#33FFBD', '#335BFF']
  };

  if (harmonyContainer) {
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'mood-buttons';
    Object.keys(moods).forEach(mood => {
      const btn = document.createElement('button');
      btn.textContent = mood.charAt(0).toUpperCase() + mood.slice(1);
      btn.dataset.mood = mood;
      btnWrapper.appendChild(btn);
    });
    harmonyContainer.appendChild(btnWrapper);

    btnWrapper.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const mood = btn.dataset.mood;
        colors = [...moods[mood]];
        originalColors = [...colors];
        updateDisplay();
      });
    });
  }

  // =========================
  // IMAGE UPLOAD
  // =========================
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

  // =========================
  // IMAGE TOGGLE
  // =========================
  imgToggle.addEventListener('click', () => {
    if (imgPreview.style.display === 'none') {
      imgPreview.style.display = 'block';
      imgToggle.textContent = 'Hide Image';
    } else {
      imgPreview.style.display = 'none';
      imgToggle.textContent = 'Show Image';
    }
  });

  // =========================
  // COLOR EXTRACTION
  // =========================
  function extractColors(image, region = null) {
    const width = region ? region.w : image.naturalWidth;
    const height = region ? region.h : image.naturalHeight;
    canvas.width = width;
    canvas.height = height;

    if (region) {
      ctx.drawImage(image, region.x, region.y, region.w, region.h, 0, 0, width, height);
    } else {
      ctx.drawImage(image, 0, 0, width, height);
    }

    const data = ctx.getImageData(0, 0, width, height).data;
    const colorMap = {};

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue;
      const hex = rgbToHex(r, g, b);
      colorMap[hex] = (colorMap[hex] || 0) + 1;
    }

    let sortedColors = Object.entries(colorMap)
      .map(([hex, count]) => ({ hex, count }))
      .sort((a, b) => b.count - a.count)
      .map(c => c.hex);

    const count = parseInt(colorCountSelect.value) || 10;
    colors = pickDistinctColors(sortedColors, count);
    originalColors = [...colors];
    updateDisplay();
  }

  // =========================
  // HELPERS
  // =========================
  function rgbToHex(r, g, b) { return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''); }
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return { r: parseInt(hex.substr(0,2),16), g: parseInt(hex.substr(2,2),16), b: parseInt(hex.substr(4,2),16) };
  }
  function pickDistinctColors(arr, count) {
    const distinct = [];
    const distance = (c1, c2) => {
      const rgb1 = hexToRgb(c1), rgb2 = hexToRgb(c2);
      return Math.sqrt((rgb1.r - rgb2.r)**2 + (rgb1.g - rgb2.g)**2 + (rgb1.b - rgb2.b)**2);
    };
    for (let color of arr) {
      if (distinct.length===0) { distinct.push(color); continue; }
      if (distinct.every(c => distance(c, color) > 30)) distinct.push(color);
      if (distinct.length>=count) break;
    }
    let i=0;
    while(distinct.length<count && i<arr.length){
      if(!distinct.includes(arr[i])) distinct.push(arr[i]);
      i++;
    }
    return distinct;
  }

  // =========================
  // DISPLAY COLORS
  // =========================
  function updateDisplay() {
    const displayArray = safeToggle && safeToggle.checked ? getSafeColors() : colors;
    extractedColors.innerHTML = '';
    displayArray.forEach((color,i)=>{
      const box = document.createElement('div');
      box.className='shade-box';
      box.style.background=color;
      box.innerHTML=`<span class="color-label">${color.toUpperCase()}</span>`;
      box.addEventListener('click',()=>{navigator.clipboard.writeText(color);showToast(`${color} copied!`);});
      extractedColors.appendChild(box);
      setTimeout(()=>{box.style.opacity=1;box.style.transform='translateY(0)';},i*50);
    });
  }

  // =========================
  // COPY & EXPORT
  // =========================
  copyBtn.addEventListener('click',()=>{navigator.clipboard.writeText(colors.join(', '));showToast('Colors copied!');});
  downloadBtn.addEventListener('click',()=>{drawPalettePNG(colors,'palette.png');});
  jsonBtn.addEventListener('click',()=>{exportJSON(colors,'palette.json');});
  cssBtn.addEventListener('click',()=>{exportCSS(colors,'palette.css');});
  if(tailwindBtn) tailwindBtn.addEventListener('click',()=>{exportTailwind(colors);});

  function drawPalettePNG(arr,filename='palette.png'){
    const size=100;
    canvas.width=size*arr.length; canvas.height=size;
    arr.forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(i*size,0,size,size);});
    const link=document.createElement('a'); link.href=canvas.toDataURL('image/png'); link.download=filename; link.click();
  }
  function exportJSON(arr,filename='palette.json'){const blob=new Blob([JSON.stringify(arr,null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=filename;link.click();}
  function exportCSS(arr,filename='palette.css'){const content=':root{\n'+arr.map((c,i)=>`--color${i+1}:${c};`).join('\n')+'\n}';const blob=new Blob([content],{type:'text/css'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=filename;link.click();}
  function exportTailwind(arr){const twVars=arr.map((c,i)=>`--color-${i+1}:${c};`).join('\n');const twContent=`:root {\n${twVars}\n}\nmodule.exports={theme:{extend:{colors:{${arr.map((c,i)=>`color${i+1}:'var(--color-${i+1})'`).join(',')}}}}};`;const blob=new Blob([twContent],{type:'text/plain'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='palette-tailwind.js';link.click();}

  // =========================
  // SAFE COLORS FILTER
  // =========================
  function luminance(r,g,b){const a=[r,g,b].map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];}
  function contrast(rgb1,rgb2){const L1=luminance(rgb1.r,rgb1.g,rgb1.b);const L2=luminance(rgb2.r,rgb2.g,rgb2.b);return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);}
  function getSafeColors(){return colors.filter(c=>contrast(hexToRgb(c),{r:255,g:255,b:255})>=4.5 && contrast(hexToRgb(c),{r:0,g:0,b:0})>=4.5);}
  if(safeToggle) safeToggle.addEventListener('change',updateDisplay);

  // =========================
  // TOAST
  // =========================
  function showToast(msg){
    let toast=document.getElementById('toast');
    if(!toast){toast=document.createElement('div');toast.id='toast';toast.style.position='fixed';toast.style.bottom='20px';toast.style.right='20px';toast.style.background='rgba(0,0,0,0.8)';toast.style.color='#fff';toast.style.padding='10px 16px';toast.style.borderRadius='8px';toast.style.zIndex='10000';toast.style.transition='opacity 0.3s';document.body.appendChild(toast);}
    toast.textContent=msg; toast.style.opacity='1';
    setTimeout(()=>{toast.style.opacity='0';},1800);
  }


})();
// =========================
// MINI PALETTE DISPLAY
// =========================
const miniPalette = document.createElement('div');
miniPalette.id = 'mini_palette';
miniPalette.style.position = 'fixed';
miniPalette.style.bottom = '20px';
miniPalette.style.left = '20px';
miniPalette.style.display = 'flex';
miniPalette.style.gap = '6px';
miniPalette.style.background = 'rgba(0,0,0,0.6)';
miniPalette.style.padding = '6px';
miniPalette.style.borderRadius = '8px';
miniPalette.style.zIndex = '10000';
document.body.appendChild(miniPalette);

// Helper to update mini palette
function updateMiniPalette() {
  miniPalette.innerHTML = '';
  originalColors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.style.width = '30px';
    swatch.style.height = '30px';
    swatch.style.background = color;
    swatch.style.border = '1px solid #fff';
    swatch.style.borderRadius = '4px';
    miniPalette.appendChild(swatch);
  });
}

// =========================
// EYEDROPPER MODIFIED TO UPDATE MINI PALETTE
// =========================
imgPreview.addEventListener('mousemove', e => {
  if (!eyedropActive) return;
  const rect = imgPreview.getBoundingClientRect();
  const scaleX = imgPreview.naturalWidth / rect.width;
  const scaleY = imgPreview.naturalHeight / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);

  const data = sampleCtx.getImageData(x, y, 1, 1).data;
  const hex = rgbToHex(data[0], data[1], data[2]);

  // Show hover preview
  previewBox.style.display = 'block';
  previewBox.style.background = hex;
  previewBox.textContent = hex.toUpperCase();
  previewBox.style.transform = `translate(${e.pageX + 20}px, ${e.pageY + 20}px)`;

  eyedropInfo.textContent = `rgb(${data[0]},${data[1]},${data[2]})`;
});

imgPreview.addEventListener('click', e => {
  if (!eyedropActive) return;
  const rect = imgPreview.getBoundingClientRect();
  const scaleX = imgPreview.naturalWidth / rect.width;
  const scaleY = imgPreview.naturalHeight / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);

  const data = sampleCtx.getImageData(x, y, 1, 1).data;
  const hex = rgbToHex(data[0], data[1], data[2]);

  if (!originalColors.includes(hex)) {
    colors.push(hex);
    originalColors.push(hex);
    updateDisplay();
    updateMiniPalette(); // <-- Update mini palette instantly
    showToast(`${hex} added to palette!`);
  }

  eyedropActive = false;
  previewBox.style.display = 'none';
});
