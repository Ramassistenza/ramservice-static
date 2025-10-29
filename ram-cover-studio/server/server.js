require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');


const app = express();
app.use(helmet());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 500 }));


// Static hosting (front-end + data + templates)
const ROOT = path.resolve(__dirname, '..');
app.use(express.static(ROOT));


// Simple auth
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASS;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';


app.post('/admin/login', (req, res) => {
const { email, password } = req.body || {};
if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
const token = jwt.sign({ role: 'admin', email }, JWT_SECRET, { expiresIn: '8h' });
return res.json({ token });
}
res.status(401).json({ error: 'Unauthorized' });
});


function auth(req, res, next) {
const hdr = req.headers.authorization || '';
const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
if (!token) return res.status(401).json({ error: 'No token' });
try { req.user = jwt.verify(token, JWT_SECRET); next(); } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }
}


// Models CRUD (local file for simplicity)
const MODELS_PATH = path.join(ROOT, 'data', 'models.json');
function readModels() { return JSON.parse(fs.readFileSync(MODELS_PATH, 'utf8')); }
function writeModels(db) { fs.writeFileSync(MODELS_PATH, JSON.stringify(db, null, 2)); }
app.listen(PORT, () => console.log('RAM Cover Studio API on :' + PORT));