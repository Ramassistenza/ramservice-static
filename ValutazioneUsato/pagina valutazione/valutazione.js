/* valutazione.js */
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTALk9G-bdD_eitOcDhLV-z_kG0SrRwTeDjVoyBFwjlgjwisSk3h9gOAMur5pMOoxKDKV3cwQ9woxlr/pub?gid=2070797727&single=true&output=csv";
let data = [], step = 0, risposte = {};
const steps = [];

const descriptions = {
  "marca":"Inserisci la marca del tuo Smartphone;",
  "modello":"Inserisci il modello;",
  "memoria":"Inserisci la capacità della memoria del tuo dispositivo;",
  "batteria":"Controlla la capacità massima della batteria. Si trova in Impostazioni -> Batteria -> Stato batteria",
  "funzioni":"Il dispositivo si accende, si ricarica e si connette alla rete. Ha altoparlanti, microfoni e fotocamere funzionanti.",
  "display":"Controlla la presenza di macchie luminose, pixel bruciati o linee/segni di burn in (scolorimento), o se sono presenti crepe e rotture dei cristalli.",
  "retro":"Controlla il retro per graffi, crepe e segni di usura.",
  "account":""
};

async function caricaCSV() {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const righe = text.trim().split("\n").map(r => r.split(","));
  righe.shift(); // intestazioni
  data = righe.map(r => ({
    Marca:r[0],
    Modello:r[1],
    Memoria:r[2],
    PrezzoBase:parseFloat(r[3]),
    Foto:r[4]
  }));
  inizializzaSteps();
  mostraStep();
}

function inizializzaSteps() {
  steps.length = 0; // reset
  steps.push({id:"marca", label:"Seleziona Marca", type:"select", options:[...new Set(data.map(d=>d.Marca))]});
  steps.push({id:"modello", label:"Seleziona Modello", type:"select", options:[], depends:"marca"});
  steps.push({id:"memoria", label:"Seleziona Memoria", type:"select", options:[], depends:"modello"});
  steps.push({id:"batteria", label:"Salute batteria (%)", type:"number", min:1, max:100, default:100});
  steps.push({id:"funzioni", label:"Il telefono funziona perfettamente o ha qualche problema?", type:"select", options:["Si, funziona perfettamente","No, funziona parzialmente"]});
  steps.push({id:"display", label:"Condizioni Display", type:"select", options:["No, ha il display rotto","Si, ma presenta graffi ben visibili","Si, ma graffi impercettibili","Si, come nuovo"]});
  steps.push({id:"retro", label:"Condizioni retro", type:"select", options:["Il vetro è crepato","Integro ma presenta graffi","Integro e perfetto"]});
  steps.push({id:"account", label:"Account e blocchi utente rimossi?", type:"select", options:["Si","No"]});
}

function mostraStep() {
  const container = document.getElementById("stepContainer");
  container.innerHTML = "";

  document.getElementById("restartBtn").style.display="inline-block";

  if(step >= steps.length) { 
    document.getElementById("nextBtn").style.display="none";
    document.getElementById("showPriceBtn").style.display="inline-block";
    aggiornaProgress();
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
  } else if(s.type==="number"){
    input = document.createElement("input");
    input.type="number"; input.id=s.id; input.min=s.min; input.max=s.max; input.value=s.default;
  }

  input.addEventListener("change", ()=>{
    risposte[s.id]=input.value;
    aggiornaRiepilogo();
    aggiornaImmagini();
  });

  wrapper.appendChild(input);
  container.appendChild(wrapper);
  aggiornaProgress();
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

function aggiornaRiepilogo(){
  document.getElementById("sum_marca").textContent="Marca: "+(risposte["marca"]||"-");
  document.getElementById("sum_modello").textContent="Modello: "+(risposte["modello"]||"-");
  document.getElementById("sum_memoria").textContent="Memoria: "+(risposte["memoria"]||"-");
  document.getElementById("sum_batteria").textContent="Batteria: "+(risposte["batteria"]||"-");
  document.getElementById("sum_funzioni").textContent="Funzioni: "+(risposte["funzioni"]||"-");
  document.getElementById("sum_display").textContent="Display: "+(risposte["display"]||"-");
  document.getElementById("sum_retro").textContent="Retro: "+(risposte["retro"]||"-");
  document.getElementById("sum_account").textContent="Account: "+(risposte["account"]||"-");
}

function aggiornaProgress(){
  const perc = Math.round((step/steps.length)*100);
  const progress = document.getElementById("progress");
  const progressText = document.getElementById("progressText");
  if(progress && progressText){
    progress.style.width = perc + "%";
    progressText.textContent = perc + "%";
  }
}

function aggiornaImmagini(){
  const logoMap = {
    "Apple":"https://ramservice.altervista.org/ValutazioneUsato/Loghi/logoapple.png",
    "Samsung":"https://ramservice.altervista.org/ValutazioneUsato/Loghi/logosamsung.png"
  };
  document.getElementById("logoMarca").src = risposte["marca"] ? (logoMap[risposte["marca"]] || "") : "";
  const riga = data.find(d=>d.Marca===risposte["marca"] && d.Modello===risposte["modello"]);
  document.getElementById("fotoProdotto").src = riga ? riga.Foto : "";
}

function calcolaPrezzo(){
  const riga = data.find(d=>d.Marca===risposte["marca"] && d.Modello===risposte["modello"] && d.Memoria===risposte["memoria"]);
  if(!riga){ alert("Combinazione non trovata!"); return; }

  let prezzo = Number(riga.PrezzoBase) || 0;
  const batteria = Number(risposte["batteria"]) || 100;
  if(batteria < 85) prezzo *= 0.72;
  if(risposte["funzioni"]==="No, funziona parzialmente") prezzo *= 0.5;

  switch(risposte["display"]){
    case "No, ha il display rotto": prezzo *=0.2; break;
    case "Si, ma presenta graffi ben visibili": prezzo *=0.75; break;
    case "Si, ma graffi impercettibili": prezzo *=0.93; break;
  }

  switch(risposte["retro"]){
    case "Il vetro è crepato": prezzo *=0.5; break;
    case "Integro ma presenta graffi": prezzo *=0.75; break;
  }

  if(risposte["account"]==="No") prezzo*=0.2;

  // 🔹 Arrotondamento per difetto alle decine
  prezzo = Math.floor(prezzo / 10) * 10;

  document.getElementById("priceBox").textContent="€ "+prezzo;
}

function ricomincia(){
  step=0;
  risposte={};
  document.getElementById("priceBox").textContent="Prezzo Valutazione";
  document.getElementById("nextBtn").style.display="inline-block";
  document.getElementById("showPriceBtn").style.display="none";
  document.getElementById("progress").style.width="0%";
  document.getElementById("progressText").textContent="0%";
  aggiornaRiepilogo();
  aggiornaImmagini();
  mostraStep();
}

// Avvio
caricaCSV();

// Collego pulsanti
document.getElementById("showPriceBtn").addEventListener("click", calcolaPrezzo);
document.getElementById("restartBtn").addEventListener("click", ricomincia);

// Allineamento riepilogo altezza
function adjustHeights(){
  try{
    const left = document.getElementById('stepsCol');
    const right = document.getElementById('summaryCol');
    if(!left || !right) return;
    right.style.minHeight = '';
    const leftRect = left.getBoundingClientRect();
    right.style.minHeight = Math.ceil(leftRect.height) + 2 + 'px';
  }catch(e){}
}
window.addEventListener('load', ()=>{ setTimeout(adjustHeights,120); });
window.addEventListener('resize', ()=>{ setTimeout(adjustHeights,80); });

const stepContainer = document.getElementById('stepContainer');
if(stepContainer){
  const mo = new MutationObserver(()=> setTimeout(adjustHeights,60));
  mo.observe(stepContainer, {childList:true, subtree:true, attributes:true, characterData:true});
}
setTimeout(adjustHeights,500);
setTimeout(adjustHeights,1200);

// ====== fallback: forza altezza uguale alle due colonne (se necessario) ======
(function() {
  function equalizeColumns() {
    const left = document.getElementById('stepsCol');
    const right = document.getElementById('summaryCol');
    if(!left || !right) return;
    // reset prima
    left.style.minHeight = '';
    right.style.minHeight = '';
    // misura e applica
    const lh = left.getBoundingClientRect().height;
    const rh = right.getBoundingClientRect().height;
    const maxh = Math.max(lh, rh);
    // lascia qualche pixel di margine
    left.style.minHeight = Math.ceil(maxh) + 'px';
    right.style.minHeight = Math.ceil(maxh) + 'px';
  }

  // debounce rapido
  let t;
  function scheduleEqualize(){ clearTimeout(t); t = setTimeout(equalizeColumns, 70); }

  window.addEventListener('load', () => { scheduleEqualize(); });
  window.addEventListener('resize', () => { scheduleEqualize(); });

  // osserva cambiamenti nel contenuto degli steps (quando mostri nuovi input)
  const sc = document.getElementById('stepContainer');
  if(sc){
    const mo = new MutationObserver(()=> scheduleEqualize());
    mo.observe(sc, { childList: true, subtree: true, attributes: true, characterData: true });
  }

  // chiamate di sicurezza iniziali
  setTimeout(equalizeColumns, 200);
  setTimeout(equalizeColumns, 800);
})();
