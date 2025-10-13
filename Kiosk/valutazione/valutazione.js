/* =====================================================
   RAMSERVICE - Valutazione Smartphone (versione GitHub + Cloud Run)
   ===================================================== */

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTALk9G-bdD_eitOcDhLV-z_kG0SrRwTeDjVoyBFwjlgjwisSk3h9gOAMur5pMOoxKDKV3cwQ9woxlr/pub?gid=2070797727&single=true&output=csv";
const SEND_URL = "https://ramservice-sync-721276708443.europe-west1.run.app/send-valutazione";


let data = [], step = 0, risposte = {};
const steps = [];

const descriptions = {
  "marca":"Inserisci la marca del tuo Smartphone.",
  "modello":"Inserisci il modello.",
  "memoria":"Inserisci la capacità della memoria del tuo dispositivo.",
  "batteria":"Imposta la percentuale con i pulsanti + e - (valore iniziale 100%).",
  "funzioni":"Il dispositivo si accende, si ricarica e si connette alla rete? Tutte le funzioni sono operative?",
  "display":"Controlla se il display ha graffi, pixel bruciati o crepe.",
  "retro":"Controlla il retro per graffi, crepe o segni di usura.",
  "account":"Gli account utente sono stati rimossi?"
};

// ===== Caricamento CSV =====
async function caricaCSV() {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const righe = text.trim().split("\n").map(r => r.split(","));
  righe.shift();
  data = righe.map(r => ({
    Marca:r[0],
    Modello:r[1],
    Memoria:r[2],
    PrezzoBase:parseFloat(r[3]),
    Foto:r[4]
  }));
  inizializzaSteps();
  mostraStep();
  setTimeout(equalizeColumns, 200);
}

// ===== Step =====
function inizializzaSteps() {
  steps.length = 0;
  steps.push({id:"marca", label:"Seleziona Marca", type:"select", options:[...new Set(data.map(d=>d.Marca))]});
  steps.push({id:"modello", label:"Seleziona Modello", type:"select", options:[], depends:"marca"});
  steps.push({id:"memoria", label:"Seleziona Memoria", type:"select", options:[], depends:"modello"});
  steps.push({id:"batteria", label:"Salute batteria (%)", type:"battery"});
  steps.push({id:"funzioni", label:"Il telefono funziona perfettamente?", type:"select", options:["Si, funziona perfettamente","No, funziona parzialmente"]});
  steps.push({id:"display", label:"Condizioni Display", type:"select", options:["No, ha il display rotto","Si, graffi visibili","Si, graffi impercettibili","Si, come nuovo"]});
  steps.push({id:"retro", label:"Condizioni retro", type:"select", options:["Il vetro è crepato","Integro ma graffiato","Integro e perfetto"]});
  steps.push({id:"account", label:"Account Rimossi", type:"select", options:["Si","No"]});
}

function mostraStep() {
  const container = document.getElementById("stepContainer");
  container.innerHTML = "";

  if(step >= steps.length) {
    document.getElementById("nextBtn").style.display="none";
    document.getElementById("showPriceBtn").style.display="inline-block";
    aggiornaProgress(); equalizeColumns();
    return;
  }

  document.getElementById("nextBtn").style.display="inline-block";
  document.getElementById("showPriceBtn").style.display="none";

  const s = steps[step];
  const wrapper = document.createElement("div");

  const label = document.createElement("label");
  label.textContent = s.label;
  wrapper.appendChild(label);

  if(descriptions[s.id]){
    const desc = document.createElement("div");
    desc.className = "description";
    desc.textContent = descriptions[s.id];
    wrapper.appendChild(desc);
  }

  let input;
  if(s.type==="select"){
    input = document.createElement("select");
    input.id=s.id;
    let opts = s.options;
    if(s.depends==="marca" && risposte["marca"]) 
      opts = [...new Set(data.filter(d=>d.Marca===risposte["marca"]).map(d=>d.Modello))];
    if(s.depends==="modello" && risposte["marca"] && risposte["modello"]) 
      opts = [...new Set(data.filter(d=>d.Marca===risposte["marca"] && d.Modello===risposte["modello"]).map(d=>d.Memoria))];
    input.innerHTML = "<option value=''>-- Seleziona --</option>"+opts.map(o=>`<option value="${o}">${o}</option>`).join("");
  } 
  else if(s.type==="battery"){
    const box = document.createElement("div");
    box.className = "battery-box";

    input = document.createElement("input");
    input.type = "number"; input.id = "batteria"; input.min = 0; input.max = 100; input.value = 100; input.readOnly = true;

    const minus = document.createElement("button"); minus.type="button"; minus.textContent="-";
    const plus  = document.createElement("button"); plus.type="button"; plus.textContent="+";

    minus.onclick = () => {
      let val = parseInt(input.value)||0; if(val>0) val--;
      input.value = val; risposte[s.id]=val; aggiornaRiepilogo(); equalizeColumns();
    };
    plus.onclick = () => {
      let val = parseInt(input.value)||0; if(val<100) val++;
      input.value = val; risposte[s.id]=val; aggiornaRiepilogo(); equalizeColumns();
    };

    box.appendChild(minus); box.appendChild(input); box.appendChild(plus);
    wrapper.appendChild(box);
  }

  if(input && s.type!=="battery"){
    input.addEventListener("change", ()=>{
      risposte[s.id]=input.value;
      aggiornaRiepilogo();
      aggiornaImmagini();
      equalizeColumns();
    });
    wrapper.appendChild(input);
  }

  container.appendChild(wrapper);
  aggiornaProgress();
  equalizeColumns();
}

document.getElementById("nextBtn").addEventListener("click",()=>{
  const s = steps[step];
  const el = document.getElementById(s.id);
  if(!el || el.value===""){ alert("Seleziona un valore"); return; }
  risposte[s.id]=el.value;
  step++;
  aggiornaProgress();
  mostraStep();
});

// ===== Riepilogo + batteria bar =====
function aggiornaRiepilogo(){
  document.getElementById("sum_marca").textContent="Marca: "+(risposte["marca"]||"-");
  document.getElementById("sum_modello").textContent="Modello: "+(risposte["modello"]||"-");
  document.getElementById("sum_memoria").textContent="Memoria: "+(risposte["memoria"]||"-");

  const fill = document.getElementById("batteryFill");
  const txt = document.getElementById("batteryText");
  const sumBatt = document.getElementById("sum_batteria");
  let batt = parseInt(risposte["batteria"]);
  if(isNaN(batt)){
    sumBatt.textContent = "Batteria: -";
    fill.style.width = "0%"; txt.textContent="-";
  } else {
    if(batt < 80){
      sumBatt.innerHTML = "Batteria: <strong style='color:#c40000'>Batteria Assistenza</strong>";
      fill.style.width="100%"; fill.style.background="#c40000";
      txt.textContent="Batteria Assistenza"; txt.style.color="#fff";
    } else {
      sumBatt.textContent = "Batteria: "+batt+"%";
      fill.style.width=batt+"%";
      fill.style.background = batt<90 ? "orange" : "linear-gradient(90deg,#22c55e,#86efac)";
      txt.textContent = batt+"%"; txt.style.color="#0f172a";
    }
  }

  document.getElementById("sum_funzioni").textContent="Funzioni: "+(risposte["funzioni"]||"-");
  document.getElementById("sum_display").textContent="Display: "+(risposte["display"]||"-");
  document.getElementById("sum_retro").textContent="Retro: "+(risposte["retro"]||"-");
  document.getElementById("sum_account").textContent="Account Rimossi: "+(risposte["account"]||"-");
}

// ===== Progress =====
function aggiornaProgress(){
  const perc = Math.round((step/steps.length)*100);
  const bar = document.getElementById("progress");
  const txt = document.getElementById("progressText");
  bar.style.width = perc + "%";
  txt.textContent = perc + "%";
}

// ===== Immagini =====
function aggiornaImmagini(){
  const logoMap = {
    "Apple":"https://ramassistenza.github.io/ramservice-static/ValutazioneUsato/Loghi/logoapple.png",
    "Samsung":"https://ramassistenza.github.io/ramservice-static/ValutazioneUsato/Loghi/logosamsung.png"
  };
  document.getElementById("logoMarca").src = risposte["marca"] ? (logoMap[risposte["marca"]] || "") : "";
  const riga = data.find(d=>d.Marca===risposte["marca"] && d.Modello===risposte["modello"]);
  document.getElementById("fotoProdotto").src = riga ? riga.Foto : "";
}

// ===== Calcolo prezzo =====
function calcolaPrezzo(){
  const riga = data.find(d=>d.Marca===risposte["marca"] && d.Modello===risposte["modello"] && d.Memoria===risposte["memoria"]);
  if(!riga){ alert("Combinazione non trovata!"); return; }

  let prezzo = Number(riga.PrezzoBase) || 0;
  const batteria = Number(risposte["batteria"]) || 100;
  if(batteria < 85) prezzo *= 0.72;
  if(risposte["funzioni"]==="No, funziona parzialmente") prezzo *= 0.5;

  switch(risposte["display"]){
    case "No, ha il display rotto": prezzo *=0.2; break;
    case "Si, graffi visibili": prezzo *=0.75; break;
    case "Si, graffi impercettibili": prezzo *=0.93; break;
  }
  switch(risposte["retro"]){
    case "Il vetro è crepato": prezzo *=0.5; break;
    case "Integro ma graffiato": prezzo *=0.75; break;
  }

  if(risposte["account"]==="No") prezzo *= 0.2;

  prezzo = Math.floor(prezzo / 10) * 10;
  document.getElementById("priceBox").textContent="€ "+prezzo;

  document.getElementById("postPrice").classList.remove("hidden");
  renderChart(prezzo);
  equalizeColumns();
}

document.getElementById("showPriceBtn").addEventListener("click", calcolaPrezzo);
document.getElementById("restartBtn").addEventListener("click", ricomincia);

// ===== Chart SVG =====
function renderChart(prezzoBase){
  const p1 = Math.floor(prezzoBase * 0.95);
  const p3 = Math.floor(prezzoBase * 0.85);
  const p6 = Math.floor(prezzoBase * 0.72);
  const fmt = v => v.toLocaleString('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0});

  const w = 680, h = 230, padL = 70, padR = 18, padT = 16, padB = 42;
  const maxPrice = prezzoBase, minPrice = p6, range = Math.max(1, maxPrice-minPrice);

  const x = [padL, (w-padL-padR)/2+padL, w-padR];
  const yFromVal = v => padT+(h-padT-padB)*(1 - (v-minPrice)/range);

  const pts = [
    {x:x[0], y:yFromVal(p1), label:`1 mese · -5% (${fmt(p1)})`},
    {x:x[1], y:yFromVal(p3), label:`3 mesi · -15% (${fmt(p3)})`},
    {x:x[2], y:yFromVal(p6), label:`6 mesi · -28% (${fmt(p6)})`}
  ];
  const path = `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y} L ${pts[2].x} ${pts[2].y}`;

  const yTicks = [
    {v:maxPrice, label:fmt(maxPrice)},
    {v:Math.round((maxPrice+minPrice)/2), label:fmt(Math.round((maxPrice+minPrice)/2))},
    {v:minPrice, label:fmt(minPrice)}
  ];

  const svg =
`<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <style> text { font-family: Poppins, sans-serif; } </style>
  <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h-padB}" stroke="#cbd5e1"/>
  <line x1="${padL}" y1="${h-padB}" x2="${w-padR}" y2="${h-padB}" stroke="#cbd5e1"/>
  ${yTicks.map(t=>`
    <line x1="${padL}" y1="${yFromVal(t.v)}" x2="${w-padR}" y2="${yFromVal(t.v)}" stroke="#eef2f7"/>
    <text x="${padL-10}" y="${yFromVal(t.v)+4}" text-anchor="end" font-size="12" fill="#475569">${t.label}</text>
  `).join('')}
  <defs>
    <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2563eb" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="${path} L ${pts[2].x} ${h-padB} L ${pts[0].x} ${h-padB} Z" fill="url(#gl)" />
  <path d="${path}" fill="none" stroke="#2563eb" stroke-width="3"/>
  ${pts.map(p=>`
    <circle cx="${p.x}" cy="${p.y}" r="5" fill="#2563eb"/>
    <text x="${p.x}" y="${p.y-10}" text-anchor="middle" font-size="12" fill="#111827">${p.label}</text>
  `).join('')}
</svg>`;
  document.getElementById("chart").innerHTML = svg;
}

// ===== Ricomincia =====
function ricomincia(){
  step=0; risposte={};
  document.getElementById("priceBox").textContent="Prezzo Valutazione";
  document.getElementById("nextBtn").style.display="inline-block";
  document.getElementById("showPriceBtn").style.display="none";
  document.getElementById("progress").style.width="0%";
  document.getElementById("progressText").textContent="0%";
  document.getElementById("postPrice").classList.add("hidden");
  document.getElementById("logoMarca").src = "";
  document.getElementById("fotoProdotto").src = "";
  aggiornaRiepilogo();
  mostraStep();
  equalizeColumns();
}

// ===== INVIO EMAIL (verso Cloud Run) =====
document.getElementById("sendEmailBtn").addEventListener("click", ()=>{
  const email = (document.getElementById("emailVal").value || "").trim();
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    alert("Inserisci un indirizzo email valido."); return;
  }

  const prezzoTxt = document.getElementById("priceBox").textContent.trim();
  const codice = generaCodiceVal();
  const modello = risposte.modello || "-";
  const oggi = new Date().toLocaleDateString("it-IT");
  const foto = document.getElementById("fotoProdotto").src || "";

  const subject = `[${oggi}] ${modello} - Codice ${codice}`;
  const body =
`Valutazione RAMSERVICE
Codice: ${codice}
Data: ${oggi}

Marca: ${risposte.marca || "-"}
Modello: ${modello}
Memoria: ${risposte.memoria || "-"}
Batteria: ${risposte.batteria || "-"}%
Funzioni: ${risposte.funzioni || "-"}
Display: ${risposte.display || "-"}
Retro: ${risposte.retro || "-"}
Account Rimossi: ${risposte.account || "-"}
Prezzo: ${prezzoTxt}
Validità: 7 giorni.
Foto Prodotto: ${foto}`;

  fetch(SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, subject, body })
  })
  .then(r => r.text())
  .then(t => {
    if (t.trim() === "OK") {
      const sm = document.querySelector(".email-row small");
      sm.style.color = "green";
      sm.textContent = "Email inviata con successo ✅";
      setTimeout(openModal, 1200);
    } else {
      alert("Errore nell'invio della mail: " + t);
    }
  })
  .catch(err => alert("Errore di connessione: " + err));
});

function generaCodiceVal(){
  return "VAL-"+new Date().toISOString().replace(/[-:.TZ]/g,"").slice(0,12);
}

// ===== MODAL =====
function openModal(){ document.getElementById("modal").classList.remove("hidden"); }
document.getElementById("modalRestart").addEventListener("click", ()=>{ document.getElementById("modal").classList.add("hidden"); ricomincia(); });
document.getElementById("modalHome").addEventListener("click", ()=>{ location.href="../index.html"; });

// ===== Equalize colonne =====
function equalizeColumns() {
  const left = document.getElementById('stepsCol');
  const right = document.getElementById('summaryCol');
  if(!left || !right) return;
  left.style.minHeight = right.style.minHeight = 'auto';
  const lh = left.getBoundingClientRect().height;
  const rh = right.getBoundingClientRect().height;
  const mh = Math.max(lh, rh);
  left.style.minHeight = right.style.minHeight = Math.ceil(mh) + 'px';
}

window.addEventListener('resize', ()=> setTimeout(equalizeColumns, 60));
const mo = new MutationObserver(()=> setTimeout(equalizeColumns, 60));
mo.observe(document.getElementById('stepContainer'), {childList:true, subtree:true, attributes:true});

caricaCSV();
