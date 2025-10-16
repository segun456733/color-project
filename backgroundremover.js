document.addEventListener('DOMContentLoaded', () => {
  // -------------------- ELEMENTS --------------------
  const removeBgBtn = document.getElementById('remove_bg_btn');
  const bgCanvas = document.getElementById('bg_canvas');
  const downloadBtn = document.getElementById('download_bg_removed');
  const eraserBtn = document.getElementById('eraser_btn');
  const undoBtn = document.getElementById('undo_btn');
  const redoBtn = document.getElementById('redo_btn');
  const eraserSizeInput = document.getElementById('eraser_size');
  const imgPreview = document.getElementById('img_preview');
  const imgInput = document.getElementById('img_input');
  const notificationContainer = document.getElementById('notification-container');

  const bgCtx = bgCanvas.getContext('2d');
  const API_KEY = 'RTYDpRYuxsNH6kmnbeski8cM'; // your remove.bg key

  // -------------------- STATE --------------------
  let erasing = false;
  let isMouseDown = false;
  let eraserSize = parseInt(eraserSizeInput.value || 30, 10);
  let undoStack = [];
  let redoStack = [];
  let uploadedImage = null;

  // -------------------- HELPERS --------------------
  function setCanvasSize(img) {
    const maxWidth = 1024;
    const scale = Math.min(maxWidth / img.naturalWidth, 1);
    bgCanvas.width = img.naturalWidth * scale;
    bgCanvas.height = img.naturalHeight * scale;
  }

  function renderCanvas(img) {
    setCanvasSize(img);
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.drawImage(img, 0, 0, bgCanvas.width, bgCanvas.height);
  }

  function saveState() {
    undoStack.push(bgCanvas.toDataURL('image/png'));
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
  }

  function restoreImage(dataUrl) {
    const img = new Image();
    img.onload = () => renderCanvas(img);
    img.src = dataUrl;
  }

  function showNotification(msg) {
    notificationContainer.textContent = msg;
    notificationContainer.style.opacity = 1;
    setTimeout(() => (notificationContainer.style.opacity = 0), 2000);
  }

  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  function createFormData(dataUrl) {
    const fd = new FormData();
    fd.append('image_file', dataURLtoBlob(dataUrl), 'image.png');
    fd.append('size', 'auto');
    return fd;
  }

  // -------------------- IMAGE UPLOAD --------------------
  function handleImageUpload(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    uploadedImage = new Image();
    uploadedImage.onload = () => {
      imgPreview.src = url;
      renderCanvas(uploadedImage);
      saveState();
    };
    uploadedImage.src = url;
  }

  imgInput.addEventListener('change', e => handleImageUpload(e.target.files[0]));

  // -------------------- REMOVE BACKGROUND --------------------
  removeBgBtn.addEventListener('click', async () => {
    if (!uploadedImage) return alert('Upload an image first!');
    showNotification('Removing background...');
    try {
      const temp = document.createElement('canvas');
      const tctx = temp.getContext('2d');
      temp.width = uploadedImage.width;
      temp.height = uploadedImage.height;
      tctx.drawImage(uploadedImage, 0, 0);
      const dataUrl = temp.toDataURL('image/png');

      const res = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': API_KEY },
        body: createFormData(dataUrl)
      });

      if (!res.ok) throw new Error('API failed');
      const blob = await res.blob();
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        renderCanvas(img);
        saveState();
        showNotification('Background removed successfully!');
      };
      img.src = URL.createObjectURL(blob);
    } catch (err) {
      console.error(err);
      showNotification('Background removal failed.');
    }
  });

  // -------------------- ERASER --------------------
  const eraserCursor = document.createElement('div');
  eraserCursor.style.position = 'absolute';
  eraserCursor.style.borderRadius = '50%';
  eraserCursor.style.pointerEvents = 'none';
  eraserCursor.style.background = 'rgba(255,0,0,0.2)';
  eraserCursor.style.boxShadow = '0 0 10px rgba(255,0,0,0.4)';
  eraserCursor.style.display = 'none';
  document.body.appendChild(eraserCursor);

  eraserSizeInput.addEventListener('input', e => {
    eraserSize = parseInt(e.target.value);
    eraserCursor.style.width = eraserSize + 'px';
    eraserCursor.style.height = eraserSize + 'px';
  });

  eraserBtn.addEventListener('click', () => {
    erasing = !erasing;
    eraserBtn.textContent = erasing ? 'Eraser: ON' : 'Start Eraser';
    eraserCursor.style.display = erasing ? 'block' : 'none';
  });

  function getOffset(e) {
    const rect = bgCanvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * bgCanvas.width,
      y: ((e.clientY - rect.top) / rect.height) * bgCanvas.height,
      rect
    };
  }

  bgCanvas.addEventListener('mousemove', e => {
    const { x, y, rect } = getOffset(e);
    eraserCursor.style.left = rect.left + e.offsetX - eraserSize / 2 + 'px';
    eraserCursor.style.top = rect.top + e.offsetY - eraserSize / 2 + 'px';
    if (erasing && isMouseDown) eraseAt(x, y);
  });

  bgCanvas.addEventListener('mousedown', e => {
    if (!erasing) return;
    isMouseDown = true;
    const { x, y } = getOffset(e);
    eraseAt(x, y);
  });

  bgCanvas.addEventListener('mouseup', () => {
    if (isMouseDown) saveState();
    isMouseDown = false;
  });

  bgCanvas.addEventListener('mouseleave', () => (isMouseDown = false));

  function eraseAt(x, y) {
    bgCtx.save();
    bgCtx.globalCompositeOperation = 'destination-out';
    bgCtx.beginPath();
    bgCtx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
    bgCtx.fill();
    bgCtx.restore();
  }

  // -------------------- UNDO / REDO --------------------
  undoBtn.addEventListener('click', () => {
    if (undoStack.length > 1) {
      redoStack.push(undoStack.pop());
      restoreImage(undoStack[undoStack.length - 1]);
    }
  });

  redoBtn.addEventListener('click', () => {
    if (redoStack.length > 0) {
      const data = redoStack.pop();
      restoreImage(data);
      undoStack.push(data);
    }
  });

  // -------------------- DOWNLOAD (pure transparent PNG) --------------------
  downloadBtn.addEventListener('click', () => {
    if (!uploadedImage) {
      showNotification('No image to download!');
      return;
    }

    const select = document.createElement('select');
    const rect = downloadBtn.getBoundingClientRect();
    select.style.position = 'absolute';
    select.style.top = rect.bottom + window.scrollY + 'px';
    select.style.left = rect.left + window.scrollX + 'px';
    select.style.zIndex = 9999;
    select.style.padding = '6px';
    select.style.fontSize = '14px';
    select.style.borderRadius = '8px';
    select.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    select.innerHTML =
      '<option value="">Select size...</option>' +
      [400, 800, 1200, 1600, 2000, 2400]
        .map(s => `<option value="${s}">${s}px</option>`)
        .join('');

    document.body.appendChild(select);

    select.addEventListener('change', () => {
      const width = parseInt(select.value);
      if (!width) return;
      const aspectRatio = bgCanvas.height / bgCanvas.width;
      const height = Math.round(width * aspectRatio);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      const img = new Image();
      img.src = bgCanvas.toDataURL('image/png');
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        const link = document.createElement('a');
        link.href = tempCanvas.toDataURL('image/png');
        link.download = `background_removed_${width}px.png`;
        link.click();
        select.remove();
      };
    });

    function handler(e) {
      if (e.target !== select && e.target !== downloadBtn) {
        select.remove();
        document.removeEventListener('click', handler);
      }
    }
    document.addEventListener('click', handler);
  });
});
