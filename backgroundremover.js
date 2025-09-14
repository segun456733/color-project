// -------------------- BACKGROUND REMOVER --------------------

// Elements
const removeBgBtn = document.getElementById('remove_bg_btn');
const bgCanvas = document.getElementById('bg_canvas');
const downloadBtn = document.getElementById('download_bg_removed');
const eraserBtn = document.getElementById('eraser_btn');
const undoBtn = document.getElementById('undo_btn');
const redoBtn = document.getElementById('redo_btn');
const eraserSizeInput = document.getElementById('eraser_size');

// Preview image element
const imgPreview = document.getElementById('img_preview');
const bgCtx = bgCanvas.getContext('2d');

let erasing = false;
let isMouseDown = false;
let eraserSize = parseInt(eraserSizeInput.value);
let undoStack = [];
let redoStack = [];

// -------------------- DRAW TRANSPARENCY BACKGROUND --------------------
function drawCheckerboard(ctx, width, height, size = 20) {
    ctx.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
            ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "#ccc" : "#fff";
            ctx.fillRect(x, y, size, size);
        }
    }
}

// Helper to fit canvas to image
function setCanvasSize(img) {
    const maxWidth = 1024;
    const scale = Math.min(maxWidth / img.naturalWidth, 1);
    bgCanvas.width = img.naturalWidth * scale;
    bgCanvas.height = img.naturalHeight * scale;
}

// -------------------- IMAGE LOAD --------------------
imgPreview.addEventListener('load', () => {
    setCanvasSize(imgPreview);
    drawCheckerboard(bgCtx, bgCanvas.width, bgCanvas.height);
    bgCtx.drawImage(imgPreview, 0, 0, bgCanvas.width, bgCanvas.height);
    saveState();
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

bgCanvas.addEventListener('mousemove', e => {
    const rect = bgCanvas.getBoundingClientRect();
    const cursorX = rect.left + e.offsetX - eraserSize / 2;
    const cursorY = rect.top + e.offsetY - eraserSize / 2;
    eraserCursor.style.left = cursorX + 'px';
    eraserCursor.style.top = cursorY + 'px';

    if (erasing && isMouseDown) eraseAt(e.offsetX, e.offsetY);
});

bgCanvas.addEventListener('mousedown', e => {
    if (!erasing) return;
    isMouseDown = true;
    eraseAt(e.offsetX, e.offsetY);
});

bgCanvas.addEventListener('mouseup', () => {
    if (isMouseDown) saveState();
    isMouseDown = false;
});
bgCanvas.addEventListener('mouseleave', () => isMouseDown = false);

function eraseAt(x, y) {
    bgCtx.save();
    bgCtx.globalCompositeOperation = 'destination-out';
    bgCtx.beginPath();
    bgCtx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
    bgCtx.fill();
    bgCtx.restore();
}

// -------------------- UNDO / REDO --------------------
function saveState() {
    undoStack.push(bgCanvas.toDataURL());
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
}

undoBtn.addEventListener('click', () => {
    if (undoStack.length <= 1) return;
    redoStack.push(undoStack.pop());
    restoreImage(undoStack[undoStack.length - 1]);
});

redoBtn.addEventListener('click', () => {
    if (redoStack.length === 0) return;
    const imgData = redoStack.pop();
    restoreImage(imgData);
    undoStack.push(imgData);
});

function restoreImage(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
        drawCheckerboard(bgCtx, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(img, 0, 0);
    };
}

// -------------------- REMOVE BACKGROUND --------------------
const API_KEY = 'VZBGLheSkWLJdRVQuv8TSwV8'; // replace with your API key

removeBgBtn.addEventListener('click', async () => {
    if (!imgPreview.src) return alert('Upload an image first!');
    showNotification('Removing background...');

    try {
        const resizedDataUrl = resizeImage(imgPreview, 1024);
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': API_KEY },
            body: createFormData(resizedDataUrl)
        });

        if (!response.ok) throw new Error('API failed');

        const blob = await response.blob();
        const img = new Image();
        img.onload = () => {
            setCanvasSize(img);
            drawCheckerboard(bgCtx, bgCanvas.width, bgCanvas.height);
            bgCtx.drawImage(img, 0, 0, bgCanvas.width, bgCanvas.height);
            saveState();
            showNotification('Background removed!');
        };
        img.src = URL.createObjectURL(blob);

    } catch (err) {
        console.error(err);
        showNotification('API failed. Use manual eraser instead.');
    }
});

function resizeImage(img, maxWidth = 1024) {
    const scale = Math.min(maxWidth / img.naturalWidth, 1);
    const canvasResize = document.createElement('canvas');
    canvasResize.width = img.naturalWidth * scale;
    canvasResize.height = img.naturalHeight * scale;
    const ctxResize = canvasResize.getContext('2d');
    ctxResize.drawImage(img, 0, 0, canvasResize.width, canvasResize.height);
    return canvasResize.toDataURL('image/png');
}

function createFormData(dataUrl) {
    const formData = new FormData();
    formData.append('image_file', dataURLtoBlob(dataUrl), 'image.png');
    formData.append('size', 'auto');
    return formData;
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

// -------------------- DOWNLOAD --------------------
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = bgCanvas.toDataURL('image/png');
    link.download = 'bg_removed.png';
    link.click();
});

// -------------------- NOTIFICATIONS --------------------
function showNotification(msg) {
    const container = document.getElementById('notification-container');
    container.textContent = msg;
    container.style.opacity = 1;
    setTimeout(() => container.style.opacity = 0, 2500);
}
