// js/api.js
const BASE = '';
export const api = {
async login(email, password) {
const r = await fetch('/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
return r.ok ? r.json() : null;
},
async uploadMask(file, modelId, token) {
const fd = new FormData(); fd.append('file', file); fd.append('modelId', modelId);
const r = await fetch('/admin/upload-mask', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: fd });
return r.ok ? r.json() : null;
},
async saveModel(model, token) {
const r = await fetch('/admin/models', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(model) });
return r.ok ? r.json() : null;
},
async deleteModel(id, token) {
const r = await fetch(`/admin/models/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
return r.ok ? r.json() : null;
},
async uploadFinalPNG(dataURL, modelId) {
const r = await fetch('/api/upload-final', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataURL, modelId }) });
return r.ok ? r.json() : null;
}
};