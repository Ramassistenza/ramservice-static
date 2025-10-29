import { api } from './api.js';
import { pxFromMm } from './utils.js';


const $ = (s) => document.querySelector(s);
const form = $('#modelForm');
const previewCanvas = new fabric.Canvas('preview', { width: 360, height: 720, backgroundColor: '#fff' });
const existingModels = $('#existingModels');


let modelsData;
let token;


$('#loginBtn').addEventListener('click', async () => {
const email = $('#adminEmail').value; const password = $('#adminPass').value;
const res = await api.login(email, password);
if (res?.token) { token = res.token; alert('Login ok'); loadModels(); }
});


async function loadModels() {
modelsData = await fetch('/data/models.json').then(r => r.json());
existingModels.innerHTML = '';
modelsData.models.forEach(m => {
const o = document.createElement('option'); o.value = m.id; o.textContent = m.name; existingModels.appendChild(o);
});
if (modelsData.models[0]) fillForm(modelsData.models[0]);
}


function fillForm(m) {
form.name.value = m.name;
form.id.value = m.id;
form.width_mm.value = m.width_mm;
form.height_mm.value = m.height_mm;
form.dpi.value = m.dpi;
form.active.value = m.active ? 'true' : 'false';
form.hole_x.value = m.camera_hole?.x || '';
form.hole_y.value = m.camera_hole?.y || '';
form.hole_w.value = m.camera_hole?.width || '';
form.hole_h.value = m.camera_hole?.height || '';
drawPreview(m);
}


existingModels.addEventListener('change', () => {
const m = modelsData.models.find(x => x.id === existingModels.value);
fillForm(m);
});


});