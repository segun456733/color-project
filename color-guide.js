// Elements
const cgTitle = document.getElementById('cg-title');
const cgDescription = document.getElementById('cg-description');
const cgSwatches = document.getElementById('cg-swatches');
const cgGradientPreview = document.getElementById('cg-gradient-preview');
const cgUsageList = document.getElementById('cg-usage-list');
const cgPrev = document.getElementById('cg-prev');
const cgNext = document.getElementById('cg-next');
const cgColorTree = document.getElementById('cg-color-tree');
const decadeBtns = document.querySelectorAll('.cg-decade-btn');

// Data
const colorGuideData = [
  {
    title: "1990s",
    description: "Bright neon colors and bold contrasts were popular in 1990s design.",
    swatches: ["#ff007f", "#00ffff", "#ffcc00", "#9900ff"],
    gradient: ["#ff007f", "#00ffff"],
    tree: ["#ff007f", "#ff66cc", "#00ffff", "#ccff00", "#9900ff"],
    usage: ["Backgrounds: neon panels", "Text: minimal for readability", "Buttons: bright accents"]
  },
  {
    title: "2000s",
    description: "Web-safe colors, gradients, and glossy UI were common in the 2000s.",
    swatches: ["#6699cc", "#ff6600", "#33cc33", "#cc0033"],
    gradient: ["#6699cc", "#ff6600"],
    tree: ["#6699cc", "#99ccff", "#ff6600", "#ff9966", "#33cc33"],
    usage: ["Backgrounds: soft pastels", "Text: clear black or white", "Accents: buttons and icons"]
  },
  {
    title: "2010s",
    description: "Flat design with bold, simple color palettes dominated the 2010s.",
    swatches: ["#03a9f4", "#f441a5", "#ffc107", "#8bc34a"],
    gradient: ["#03a9f4", "#f441a5"],
    tree: ["#03a9f4", "#00bcd4", "#f441a5", "#e91e63", "#ffc107"],
    usage: ["Backgrounds: neutral with color pops", "Text: high contrast", "Buttons: solid colors"]
  },
  {
    title: "2020s",
    description: "Minimalism, muted tones, and dynamic gradients are trends in the 2020s.",
    swatches: ["#f5a623", "#50e3c2", "#b8e986", "#bd10e0"],
    gradient: ["#f5a623", "#50e3c2"],
    tree: ["#f5a623", "#f7c25b", "#50e3c2", "#3ad8b0", "#bd10e0"],
    usage: ["Backgrounds: muted soft colors", "Text: clear legible", "Accents: subtle highlights"]
  }
];

let currentIndex = 0;

// Render Function
function renderColorGuide(index) {
  const data = colorGuideData[index];
  cgTitle.textContent = data.title;
  cgDescription.textContent = data.description;

  // Swatches
  cgSwatches.innerHTML = "";
  data.swatches.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'cg-swatch';
    swatch.style.background = color;
    swatch.title = color;
    swatch.addEventListener('click', () => {
      cgGradientPreview.style.background = `linear-gradient(to right, ${color}, ${data.gradient[1]})`;
      navigator.clipboard.writeText(color);
      alert(`Copied ${color} to clipboard!`);
    });
    cgSwatches.appendChild(swatch);
  });

  // Gradient
  cgGradientPreview.style.background = `linear-gradient(to right, ${data.gradient[0]}, ${data.gradient[1]})`;

  // Color Tree
  cgColorTree.innerHTML = "";
  data.tree.forEach(color => {
    const node = document.createElement('div');
    node.className = 'cg-tree-node';
    node.style.background = color;
    node.title = color;
    node.addEventListener('click', () => {
      cgGradientPreview.style.background = `linear-gradient(to right, ${color}, ${data.gradient[1]})`;
      navigator.clipboard.writeText(color);
      alert(`Copied ${color} to clipboard!`);
    });
    cgColorTree.appendChild(node);
  });

  // Usage
  cgUsageList.innerHTML = "";
  data.usage.forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    cgUsageList.appendChild(li);
  });

  // Update active timeline button
  decadeBtns.forEach(btn => btn.classList.remove('active'));
  decadeBtns[index].classList.add('active');

  // Disable prev/next buttons at edges
  cgPrev.disabled = index === 0;
  cgNext.disabled = index === colorGuideData.length - 1;
}

// Navigation
cgPrev.addEventListener('click', () => {
  if (currentIndex > 0) currentIndex--;
  renderColorGuide(currentIndex);
});

cgNext.addEventListener('click', () => {
  if (currentIndex < colorGuideData.length - 1) currentIndex++;
  renderColorGuide(currentIndex);
});

// Timeline buttons
decadeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentIndex = parseInt(btn.dataset.index);
    renderColorGuide(currentIndex);
  });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
  if(e.key === 'ArrowLeft') cgPrev.click();
  if(e.key === 'ArrowRight') cgNext.click();
});

// Initial render
renderColorGuide(currentIndex);
