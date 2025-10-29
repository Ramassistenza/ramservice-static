import { api } from './api.js';
import { pxFromMm } from './utils.js';


const $ = (s) => document.querySelector(s);
const modelSelect = $('#modelSelect');
const uploadImage = $('#uploadImage');
const addTextBtn = $('#addTextBtn');
const addEmojiBtn = $('#addEmojiBtn');
const bgColor = $('#bgColor');
const exportBtn = $('#exportBtn');
const resetBtn = $('#resetBtn');
const warnings = $('#warnings');


let canvas; // fabric.Canvas
let currentModel;
let maskImage; // fabric.Image for overlay


async function loadModels() {
const data = await fetch('/data/models.json').then(r => r.json());
const active = data.models.filter(m => m.active);
active.forEach(m => {
const opt = document.createElement('option');
opt.value = m.id; opt.textContent = m.name; modelSelect.appendChild(opt);
});
if (active[0]) initModel(active[0].id, data);
modelSelect.addEventListener('change', () => initModel(modelSelect.value, data));
}


function initCanvas(w, h) {
if (canvas) canvas.dispose();
const el = document.getElementById('editorCanvas');
el.width = w; el.height = h;
canvas = new fabric.Canvas('editorCanvas', {
width: w,
height: h,
backgroundColor: '#FFFFFF',
preserveObjectStacking: true
});
// Touch gestures
canvas.on('mouse:wheel', (opt) => {
const delta = opt.e.deltaY;
let zoom = canvas.getZoom();
zoom *= 0.999 ** delta;
zoom = Math.min(Math.max(zoom, 0.1), 10);
canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
opt.e.preventDefault(); opt.e.stopPropagation();
});
}


async function initModel(modelId, data) {
const m = data.models.find(x => x.id === modelId);
currentModel = m;
warnings.textContent = '';


// Preferisci usare i px dichiarati, altrimenti derivali
const W = m.print_width_px || Math.round(pxFromMm(m.width_mm, m.dpi));
const H = m.print_height_px || Math.round(pxFromMm(m.height_mm, m.dpi));
initCanvas(W, H);


// Sfondo colore
canvas.setBackgroundColor(bgColor.value, canvas.renderAll.bind(canvas));


loadModels();