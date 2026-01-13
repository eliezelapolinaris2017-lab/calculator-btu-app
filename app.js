const HUB_URL = "https://eliezelapolinaris2017-lab.github.io/oasis-hub/";

const $ = (id)=>document.getElementById(id);

function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

function btuBasePerFt2(mode){
  // Base práctico PR: res ~ 25 BTU/ft², com ~ 30 BTU/ft²
  return mode === "com" ? 30 : 25;
}

function insulFactor(v){
  if(v==="good") return 0.95;
  if(v==="poor") return 1.10;
  return 1.00;
}
function windowsFactor(v){
  if(v==="some") return 1.07;
  if(v==="many") return 1.12;
  return 1.00;
}

function calcBTU(){
  const area = Number($("area").value||0);
  const height = Number($("height").value||8);
  const people = Number($("people").value||0);
  const mode = $("mode").value;

  if(area <= 0){
    $("outBTU").textContent = "—";
    $("outRange").textContent = "—";
    $("outMode").textContent = mode==="com" ? "Comercial" : "Residencial";
    $("outHint").textContent = "Pon el área en ft² y te lo calculo.";
    return null;
  }

  const sun = $("sun").checked;
  const kitchen = $("kitchen").checked;
  const insul = $("insul").value;
  const windows = $("windows").value;

  // Ajuste por altura (baseline 8ft)
  const heightFactor = clamp(height / 8, 0.85, 1.35);

  // Base
  let btu = area * btuBasePerFt2(mode);

  // Altura
  btu *= heightFactor;

  // Personas: +600 BTU por persona extra (sobre 2)
  const extraPeople = Math.max(0, people - 2);
  btu += extraPeople * 600;

  // Cargas
  if(sun) btu *= 1.10;
  if(kitchen) btu *= 1.15;

  // Aislamiento + Ventanas
  btu *= insulFactor(insul);
  btu *= windowsFactor(windows);

  // Redondeo a múltiplos típicos (500)
  btu = Math.round(btu / 500) * 500;

  const low = Math.round(btu * 0.90 / 500) * 500;
  const high = Math.round(btu * 1.10 / 500) * 500;

  $("outBTU").textContent = btu.toLocaleString("en-US") + " BTU";
  $("outRange").textContent = low.toLocaleString("en-US") + " – " + high.toLocaleString("en-US");
  $("outMode").textContent = mode==="com" ? "Comercial" : "Residencial";
  $("outHint").textContent = "Decisión rápida: escoge el tamaño más cercano estándar.";

  return { btu, low, high, mode, area, height, people, sun, kitchen, insul, windows };
}

function buildSummary(r){
  const m = r.mode==="com" ? "Comercial" : "Residencial";
  const flags = [
    r.sun ? "Sol directo" : null,
    r.kitchen ? "Cocina/Calor" : null,
    r.insul==="good" ? "Aislamiento bueno" : (r.insul==="poor" ? "Aislamiento pobre" : "Aislamiento normal"),
    r.windows==="no" ? "Sin ventanas grandes" : (r.windows==="some" ? "Ventanas algunas" : "Ventanas muchas")
  ].filter(Boolean).join(" · ");
  return `Oasis BTU Pro | ${m}\nArea: ${r.area} ft² | Altura: ${r.height} ft | Personas: ${r.people}\n${flags}\nRecomendado: ${r.btu} BTU | Rango: ${r.low}-${r.high}`;
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    alert("Copiado ✅");
  }catch{
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    alert("Copiado ✅");
  }
}

function resetAll(){
  $("area").value = "";
  $("height").value = "8";
  $("people").value = "2";
  $("mode").value = "res";
  $("sun").checked = false;
  $("kitchen").checked = false;
  $("insul").value = "good";
  $("windows").value = "no";
  calcBTU();
}

function boot(){
  const hub = $("hubBackBtn");
  if(hub) hub.href = HUB_URL;

  $("btnCalc").addEventListener("click", calcBTU);
  $("btnReset").addEventListener("click", resetAll);

  // recalcular ligero al cambiar inputs (sin molestar)
  ["area","height","people","mode","insul","windows"].forEach(id=>{
    $(id).addEventListener("input", calcBTU);
    $(id).addEventListener("change", calcBTU);
  });
  ["sun","kitchen"].forEach(id=>{
    $(id).addEventListener("change", calcBTU);
  });

  $("btnCopyBTU").addEventListener("click", ()=>{
    const r = calcBTU();
    if(!r) return;
    copyText(String(r.btu));
  });

  $("btnCopyText").addEventListener("click", ()=>{
    const r = calcBTU();
    if(!r) return;
    copyText(buildSummary(r));
  });

  calcBTU();
}

document.addEventListener("DOMContentLoaded", boot);
