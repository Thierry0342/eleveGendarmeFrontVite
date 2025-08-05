import React, { useEffect, useState,useRef } from 'react';
import EleveService from '../../services/eleveService'; // 
import NoteService from '../../services/note-service'; // ajuste le chemin selon ton projet

import ModalModificationEleve from '../EleveModifPage/EleveModifPage'; // 
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import { data } from 'react-router-dom';
import courService from '../../services/courService';
import NotefrancaisService from '../../services/notefrancais-service';
const user = JSON.parse(localStorage.getItem('user'));
import ExcelJS from 'exceljs';
import ProgressBar from 'react-bootstrap/ProgressBar';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Modal, Button } from 'react-bootstrap'; 
import RepartitionModal from './RepartitionModal';

import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable';


//table 

const ListeElevePge = () => {
  const [eleves, setEleves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [eleveActif, setEleveActif] = useState(null);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteId,setNoteId]=useState(null);
  const [notesfrancais, setNotesfrancais] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchText, setSearchText] = useState("");
  const [niveauFilter, setNiveauFilter] = useState("");
  const [showRepModal, setShowRepModal] = useState(false);

  
  const [filter, setFilter] = useState({ escadron: '', peloton: '' ,search:'' ,cour:''});
  const [notes, setNotes] = useState({
    finfetta: '',
    mistage: '',
    finstage: '',
    rangfinfetta:'',
    rangmistage:'',
    rangfinstage:'',

  });
  
  const [isLoading, setIsLoading] = useState(true);
 const [progress, setProgress] = useState(0);
 const isFirstLoad = useRef(true)
 const handleOpen = () => setShowNoteModal(true);
 const handleClose = () => setShowModal(false);
 const [loading, setLoading] = useState(false);
 const handleOpenNoteModal = (eleve) => {
  console.log("OUVERTURE MODAL NOTE POUR :", eleve);
  setSelectedEleve(eleve);
  setNoteModalOpen(true);
};

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setSelectedEleve(null);
    setNotes({
      finfetta: '',
      mistage: '',
      finstage: '',
      rangfinfetta:'',
      rangmistage:'',
      rangfinstage:'',
    });
  };
  //note francais 
  useEffect(() => {
    if (showNoteModal) {
      setLoading(true);
      NotefrancaisService.getAll()
        .then(res => {
          setNotesfrancais(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [showNoteModal]);
  const openModal = () => setShowNoteModal(true);
  const closeModal = () => setShowNoteModal(false);
  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
    },
    modal: {
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#fff',
      borderRadius: '8px',
      maxWidth: '900px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto',
      padding: '20px',
      zIndex: 1001,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px',
    },
    closeBtn: {
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      fontSize: '1.5rem',
      fontWeight: 'bold',
    }
  };
  //table note 
  const columns2 = [
    { name: 'Nom', selector: row => row.Eleve?.nom || '-', sortable: true },
    { name: 'Prénom', selector: row => row.Eleve?.prenom || '-', sortable: true },
    { name: 'Incorporation', selector: row => Number(row.Eleve?.numeroIncorporation) || '-', sortable: true },
    { name: 'Escadron', selector: row => row.Eleve?.escadron || '-', sortable: true },
    { name: 'Peloton', selector: row => row.Eleve?.peloton || '-', sortable: true },
  
    { name: 'Niveau', selector: row => row.niveau, sortable: true },
  
    { 
      name: 'Note', 
      selector: row => row.note, 
      sortable: true,
      cell: row => (
        <span style={{ color: row.note < 12 ? 'red' : 'inherit', fontWeight: row.note < 12 ? 'bold' : 'normal' }}>
          {row.note}
        </span>
      )
    },
  ];
  
  //filtre note 
  const filteredNotes = notesfrancais.filter(row => {
    const nom = row.Eleve?.nom?.toLowerCase() || "";
    const prenom = row.Eleve?.prenom?.toLowerCase() || "";
    const incorporation = String(row.Eleve?.numeroIncorporation || "");
    const recherche = searchTerm.toLowerCase();
  
    const matchSearch =
      nom.includes(recherche) ||
      prenom.includes(recherche) ||
      incorporation.includes(recherche);
  
    const matchNiveau = niveauFilter
      ? row.niveau?.startsWith(niveauFilter)
      : true;
  
    return matchSearch && matchNiveau;
  });
   // Filtrer les données selon recherche + filtre catégorie
  
  


  //repartition 
  const handleUpdateSuccess = () => {
    setRefreshKey(prev => prev + 1); // va relancer le useEffect
    handleCloseModal(); // ferme le modal après succès
  };
  
 
/******************************************************
 * 0) PERSISTENCE (localStorage)
 ******************************************************/
const STORAGE_KEYS = {
  rooms: 'repartition_rooms_v1',
  exclusions: 'repartition_exclusions_v1',
  staff: 'repartition_staff_v2',            // {surveillants:[], estafettes:[]}
  buildings: 'repartition_buildings_v1',
  estafettesPerBuilding: 'repartition_estafettes_per_building_v1',
  estafettesCfg: 'repartition_estafettes_cfg_v1', // { minPerBuilding, useThreeWhenRoomsGte }
  estafettesAssign: 'repartition_estafettes_assign_v1', // Map {batiment -> [labels]}
  reprise: 'repartition_reprise_v1'   // <--- AJOUT
};
function saveEstafettesPerBuilding(map) {
  try { localStorage.setItem(STORAGE_KEYS.estafettesPerBuilding, JSON.stringify(map || {})); } catch {}
}
function loadEstafettesPerBuilding() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.estafettesPerBuilding) || '{}'); } catch { return {}; }
}
function saveRooms(rooms){ try{ localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms||[])); }catch{} }
function loadRooms(){ try{ const a=JSON.parse(localStorage.getItem(STORAGE_KEYS.rooms)||'[]'); return Array.isArray(a)?a:[]; }catch{ return []; } }
function clearRooms(){ try{ localStorage.removeItem(STORAGE_KEYS.rooms); }catch{} }

function saveExclusions(excl){ try{ localStorage.setItem(STORAGE_KEYS.exclusions, JSON.stringify(excl||{})); }catch{} }
function loadExclusions(){ try{ const a=JSON.parse(localStorage.getItem(STORAGE_KEYS.exclusions)||'{}'); return (a && typeof a==='object')?a:{}; }catch{ return {}; } }
function clearExclusions(){ try{ localStorage.removeItem(STORAGE_KEYS.exclusions); }catch{} }
function saveReprise(list) {
  try { localStorage.setItem(STORAGE_KEYS.reprise, JSON.stringify(Array.isArray(list)?list:[])); } catch {}
}
function loadReprise() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.reprise) || '[]'); } catch { return []; }
}
function saveStaff(staff){
  try{ localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify({
    surveillants: Array.isArray(staff?.surveillants)?staff.surveillants:[],
    estafettes:   Array.isArray(staff?.estafettes)?staff.estafettes:[]
  })); }catch{}
}
function loadStaff(){
  try{
    const o=JSON.parse(localStorage.getItem(STORAGE_KEYS.staff)||'{}');
    return {
      surveillants: Array.isArray(o.surveillants)?o.surveillants:[],
      estafettes:   Array.isArray(o.estafettes)?o.estafettes:[]
    };
  }catch{ return {surveillants:[], estafettes:[]}; }
}

function saveBuildings(arr){ try{ localStorage.setItem(STORAGE_KEYS.buildings, JSON.stringify(arr||[])); }catch{} }
function loadBuildings(){ try{ const a=JSON.parse(localStorage.getItem(STORAGE_KEYS.buildings)||'[]'); return Array.isArray(a)?a:[]; }catch{ return []; } }

function saveEstafettesCfg(cfg){ try{ localStorage.setItem(STORAGE_KEYS.estafettesCfg, JSON.stringify(cfg||{})); }catch{} }
function loadEstafettesCfg(){
  try{
    const c = JSON.parse(localStorage.getItem(STORAGE_KEYS.estafettesCfg)||'{}');
    return {
      minPerBuilding: Math.max(2, Number(c.minPerBuilding||2)),
      useThreeWhenRoomsGte: Math.max(3, Number(c.useThreeWhenRoomsGte||4))
    };
  }catch{ return { minPerBuilding:2, useThreeWhenRoomsGte:4 }; }
}

function saveEstafettesAssign(mapObj){
  try{ localStorage.setItem(STORAGE_KEYS.estafettesAssign, JSON.stringify(mapObj||{})); }catch{}
}
function loadEstafettesAssign(){
  try{
    const o = JSON.parse(localStorage.getItem(STORAGE_KEYS.estafettesAssign)||'{}');
    return (o && typeof o==='object') ? o : {};
  }catch{ return {}; }
}

/******************************************************
 * 1) UTILITAIRES texte / grades / personnes
 ******************************************************/
const ALL_GRADES = new Set(["GPCE","GPHC","GHC","GP2C","GP1C","G2C","G1C","GST"]);
const ONLY_ESTAFETTE_GRADES = new Set(["GST","G2C"]);
const GRADE_ORDER = { GPCE:1, GPHC:2, GP1C:3, GP2C:4,GHC:5,G1C:6, G2C:7, GST:8 };
// Groupes pour la règle des 2 surveillants / salle
const GROUP_B = new Set(["GPCE","GPHC","GP1C","GP2C"]);         // « senior »
const GROUP_A = new Set(["GHC","G1C","G2C","GST"]);      // « adjoint »

function _clean(s){ return String(s||"").replace(/\u00A0/g," ").replace(/\s{2,}/g," ").trim(); }
function cleanText(x){ return _clean(x); }
function gradeRank(g){ return GRADE_ORDER[g] ?? 99; }
function detectGrade(tok){ const t=String(tok||"").toUpperCase().replace(/\s+/g,""); return ALL_GRADES.has(t)?t:null; }
function gradeFromLabel(label){ return _clean(label).split("—")[0].trim().toUpperCase(); }
function nameFromLabel(label){ const p=_clean(label).split("—"); return _clean(p.slice(1).join("—")||p[0]||""); }
function normName(str){
  return String(str||"").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu,"")
    .replace(/[^a-z'\- ]+/g,"").replace(/\s+/g," ").trim();
}
function isGroupPairOK(lab1, lab2){
  if(!lab1 || !lab2) return false;
  const g1 = gradeFromLabel(lab1), g2 = gradeFromLabel(lab2);
  return (GROUP_B.has(g1) && GROUP_A.has(g2)) || (GROUP_B.has(g2) && GROUP_A.has(g1));
}

/** "GST Dupont Paul" ou "Dupont Paul -- GP2C" -> {name,grade,label} */
function parseSurveillantLine(line){
  const raw = _clean(String(line||"").replace(/\t/g," "));
  if (!raw) return null;
  let grade=null, name=raw;
  const mHead = raw.match(/^\s*([A-Z0-9]+)\s+(.+)$/);
  if (mHead && detectGrade(mHead[1])){ grade=detectGrade(mHead[1]); name=mHead[2].trim(); }
  else{
    const mTail = raw.match(/^(.+?)[-\s]{2,}([A-Z0-9]+)\s*$/);
    if (mTail && detectGrade(mTail[2])){ grade=detectGrade(mTail[2]); name=mTail[1].trim(); }
  }
  if (!grade) grade="GST";
  return { name, grade, label:`${grade} — ${name}` };
}

function shuffleInPlace(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

function getAllSurveillantNames(salles){
  return new Set((salles||[]).flatMap(s=>s.surveillants||[])
    .map(nameFromLabel)
    .map(normName)
    .filter(Boolean));
}
function getAllEstafetteNames(estAssign){
  return new Set(Object.values(estAssign||{}).flat()
    .map(nameFromLabel)
    .map(normName)
    .filter(Boolean));
}

/** Pools pour affichage + tirage aléatoire */
function buildSurvPools(lines){
  const peeps = (lines||[]).map(parseSurveillantLine).filter(Boolean);
  const display = peeps.slice().sort((a,b)=>{
    const r = gradeRank(a.grade)-gradeRank(b.grade);
    return r!==0 ? r : a.name.localeCompare(b.name,'fr',{sensitivity:'base'});
  });
  const ALL = peeps.slice();
  const A = ALL.filter(p=>GROUP_A.has(p.grade));
  const B = ALL.filter(p=>GROUP_B.has(p.grade));
  const shuffled = shuffleInPlace(ALL.slice());
  let i=0; const rr=()=> (shuffled.length ? shuffled[(i++)%shuffled.length] : null);
  return { display, A, B, ALL, rr };
}

function pickGradeAndNameFromCell(val){
  const s = cleanText(val);
  const m = s.match(/\b(GPCE|GPHC|GHC|GP2C|GP1C|G2C|G1C|GST)\b\s+(.+)$/i);
  if (m) return { grade:m[1].toUpperCase(), name:cleanText(m[2]) };
  return null;
}
function extractGradeAndNameFromRow(row){
  const line = cleanText(row);
  if (!line || /^\s*NR\b/i.test(line) || /\bGRADE\b/i.test(line)) return null;
  const parts = (line.includes("\t") ? line.split("\t") : line.split(/\s{2,}|\t/g))
    .map(cleanText).filter(Boolean);
  let grade=null, name=null;
  for (const p of parts) {
    const m = p.match(/\b(GPCE|GPHC|GHC|GP2C|GP1C|G2C|G1C|GST)\b/i);
    if (m) { grade = m[1].toUpperCase(); break; }
  }
  
  if (parts.length>=3){
    const cand = parts.find(c => /\p{L}+\s+\p{L}+/u.test(c) && (c.match(/\d/g)||[]).length<=2);
    if (cand) name=cand;
  }
  if (!name){
    let tmp=line;
    if (grade) tmp=tmp.replace(new RegExp(`\\b${grade}\\b`,'i'), '');
    tmp=tmp.replace(/(^|\s)(\d{2,}|(\d{2}\s){2,}\d{2})(?=$|\s)/g,' ')
           .replace(/\b\d+(er|ème)\s*ESC\b/ig,' ');
    const m = tmp.match(/([A-ZÀ-ÖØ-Ý'\- ]+\s+[A-ZÀ-ÖØ-Ýa-zà-öø-ý'\- ]{2,})/u);
    if (m) name=cleanText(m[1]);
  }
  if (!grade || !name) return null;
  return { grade, name, label:`${grade} — ${name}` };
}
function buildStaffFromPeople(people){
  const seen=new Set();
  const uniq=people.filter(p=>!seen.has(p.label)&&seen.add(p.label));
  const surveillants=uniq.map(p=>p.label);
  const estafettes=[...uniq.filter(p=>p.grade==="GST").map(p=>p.label), ...uniq.filter(p=>p.grade==="G2C").map(p=>p.label)];
  return { surveillants, estafettes, total:uniq.length };
}
function parsePersonnelFromPasted(text){
  const rows=String(text||'').split(/\r?\n/).map(cleanText).filter(Boolean);
  const people=[];
  for(const r of rows){ const p=extractGradeAndNameFromRow(r)||pickGradeAndNameFromCell(r); if(p) people.push(p); }
  return buildStaffFromPeople(people);
}
function parsePersonnelFromObjects(rows){
  if(!Array.isArray(rows)||!rows.length) return {surveillants:[], estafettes:[], total:0};
  const people=[];
  for(const row of rows){
    let hit=null;
    for(const k of Object.keys(row)){ hit=pickGradeAndNameFromCell(row[k]); if(hit) break; }
    if(!hit){
      const g=detectGrade(row.GRADE||row['Grade']||row['grade']);
      const n=cleanText(row['NOM ET PRENOMS']||row['Nom et prénom(s)']||row['NOM']||row['Nom']||'');
      if(g&&n) hit={grade:g,name:n};
    }
    if(hit) people.push({...hit,label:`${hit.grade} — ${hit.name}`});
  }
  return buildStaffFromPeople(people);
}

/******************************************************
 * 2) EXCLUSIONS (Modal compacte)
 ******************************************************/
async function exclureIncorporations(){
  if (!document.getElementById("exclu-css-min")) {
    const s=document.createElement('style'); s.id="exclu-css-min";
    s.textContent=`
      .exclu-wrap{display:flex;flex-direction:column;gap:10px}
      .exclu-tools{display:flex;gap:8px;flex-wrap:wrap}
      .exclu-tools input{padding:8px 10px;border:1px solid #d1d5db;border-radius:8px}
      .exclu-btn{padding:8px 12px;border:none;border-radius:8px;background:#3b82f6;color:#fff;cursor:pointer}
      .exclu-btn.ghost{background:#e5e7eb;color:#111827}
      .exclu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;max-height:360px;overflow:auto}
      .ex-row{display:flex;gap:6px;padding:8px;border:1px solid #e5e7eb;border-radius:10px;background:#fff}
      .ex-row input{flex:1;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px}
      .ex-row .rm{width:34px;border:1px solid #e5e7eb;border-radius:8px;background:#f3f4f6;cursor:pointer}
      .ex-invalid{border-color:#ef4444 !important;background:#fff1f2 !important}
      .ex-foot{font-size:12px;color:#475569;display:flex;justify-content:space-between}
      .room-card.sv-missing{border-color:#ef4444 !important;box-shadow:0 0 0 3px rgba(239,68,68,.12)}
      .room-card.sv-badpair{border-color:#f59e0b !important;box-shadow:0 0 0 3px rgba(245,158,11,.18)}
      .room-card.sv-duplicate{border-color:#a855f7 !important;box-shadow:0 0 0 3px rgba(168,85,247,.18)}
      .estaf-missing{color:#b91c1c;font-weight:600}
      .shortage-badge{margin-left:8px;padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px}
      .short-ok{background:#dcfce7;color:#065f46;border:1px solid #bbf7d0}
      .short-warn{background:#fef9c3;color:#92400e;border:1px solid #fde68a}
      .short-bad{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
    `;
    document.head.appendChild(s);
  }

  const rowHTML=(n="",m="")=>`
    <div class="ex-row">
      <input class="incorp" placeholder="Incorporation ex: 123" value="${n}">
      <input class="motif" placeholder="Motif ex: Cas médical" value="${m}">
      <button type="button" class="rm" title="Supprimer">×</button>
    </div>`;

  const html=`
    <div class="exclu-wrap">
      <div class="exclu-tools">
        <input id="bulk-inc" placeholder="Coller plusieurs incorporations (séparées par , ; espace ou retour)">
        <input id="bulk-motif" placeholder="Motif par défaut (optionnel)">
        <button type="button" id="btn-add" class="exclu-btn">+ Ajouter</button>
        <button type="button" id="btn-paste" class="exclu-btn">Coller → Ajouter</button>
        <button type="button" id="btn-clear" class="exclu-btn ghost">Vider</button>
      </div>
      <div id="rows" class="exclu-grid">${rowHTML()}</div>
      <div class="ex-foot"><span>Astuce : Entrée = valider • Échap = annuler</span><span id="count">1 ligne</span></div>
    </div>`;

  const res = await Swal.fire({
    title:"Exclure des incorporations", html, width:820, focusConfirm:false, showCancelButton:true, confirmButtonText:"Valider",
    didOpen:()=>{
      const rows=document.getElementById('rows'); const count=document.getElementById('count');
      const upd=()=>{ const n=rows.querySelectorAll('.ex-row').length; count.textContent=`${n} ${n>1?'lignes':'ligne'}`; };
      document.getElementById('btn-add').addEventListener('click',()=>{ rows.insertAdjacentHTML('beforeend', rowHTML()); upd(); });
      document.getElementById('btn-paste').addEventListener('click',()=>{
        const raw=(document.getElementById('bulk-inc').value||'').trim(); const def=(document.getElementById('bulk-motif').value||'').trim();
        if(!raw) return; raw.split(/[\s,;]+/).filter(Boolean).forEach(t=>rows.insertAdjacentHTML('beforeend', rowHTML(t,def))); upd();
      });
      document.getElementById('btn-clear').addEventListener('click',()=>{ rows.innerHTML=rowHTML(); upd(); });
      rows.addEventListener('click',e=>{ const btn=e.target.closest('.rm'); if(!btn) return; if(rows.querySelectorAll('.ex-row').length>1){ btn.closest('.ex-row').remove(); upd(); }});
      Swal.getPopup().addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); Swal.clickConfirm(); }});
      upd();
    },
    preConfirm:()=>{
      const rows=[...document.querySelectorAll('#rows .ex-row')]; let hasErr=false; const map=new Map();
      rows.forEach(r=>{
        const inc=r.querySelector('.incorp'), mot=r.querySelector('.motif');
        inc.classList.remove('ex-invalid'); mot.classList.remove('ex-invalid');
        const n=(inc.value||'').trim(), m=(mot.value||'').trim(); let ok=true;
        if(!/^\d+$/.test(n)){ inc.classList.add('ex-invalid'); ok=false; }
        if(!m){ mot.classList.add('ex-invalid'); ok=false; }
        if(ok) map.set(n,m); else hasErr=true;
      });
      if(map.size===0){ Swal.showValidationMessage("Ajoutez au moins une ligne valide."); return false; }
      if(hasErr){ Swal.showValidationMessage("Veuillez corriger les champs en rouge."); return false; }
      const out = {}; for(const [numero,motif] of map.entries()){ out[numero]=motif; }
      return out;
    }
  });

  const out = res.isConfirmed ? (res.value||{}) : null;
  if(res.isConfirmed) saveExclusions(out);
  return out||{};
}

/******************************************************
 * 3) STAFF (édition + import)
 ******************************************************/
async function editerStaff(){
  const prev=loadStaff(), cfg=loadEstafettesCfg();
  const html=`
    <div style="display:grid;gap:12px">
      <div style="display:flex;flex-direction:column;gap:6px">
        <label style="font-weight:600">Surveillants (2 par salle)</label>
        <small style="color:#64748b">Règle : un parmi <b>GPCE/GPHC/GP1C/GP2C</b> + un parmi <b>GHC/G1C/G2C/GST</b>.</small>
        <textarea id="sv" rows="6" placeholder="Un agent par ligne (ex: GST DUPONT Paul ou DUPONT Paul -- GP2C)"
          style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:8px 10px;outline:none">${(prev.surveillants||[]).join("\n")}</textarea>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <label style="font-weight:600">Estafettes / Agents de liaison (GST prioritaire, G2C si nécessaire)</label>
        <textarea id="es" rows="5" placeholder="Un agent par ligne (ex: GST RAKOTO …)"
          style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:8px 10px;outline:none">${(prev.estafettes||[]).join("\n")}</textarea>
        <small style="color:#64748b">Astuce : collez la liste complète, je filtrerai GST/G2C aux imports.</small>
      </div>
      <fieldset style="display:grid;gap:8px;border:1px solid #e5e7eb;border-radius:12px;padding:10px">
        <legend style="font-weight:700;font-size:14px;padding:0 6px">Règle estafettes</legend>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <label>Minimum par bâtiment :</label>
          <input id="minEstaf" type="number" min="2" value="${cfg.minPerBuilding}" style="width:120px;border:1px solid #d1d5db;border-radius:10px;padding:8px 10px" />
          <label>Passer à 3 si nbre de salles ≥</label>
          <input id="thrRooms" type="number" min="3" value="${cfg.useThreeWhenRoomsGte}" style="width:120px;border:1px solid #d1d5db;border-radius:10px;padding:8px 10px" />
        </div>
      </fieldset>
    </div>`;
  const res=await Swal.fire({ title:"Personnel", html, width:720, focusConfirm:false, showCancelButton:true, confirmButtonText:"Enregistrer" });
  if(!res.isConfirmed) return loadStaff();

  const sv=(document.getElementById('sv').value||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const es=(document.getElementById('es').value||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const minEst=Math.max(2, parseInt(document.getElementById('minEstaf').value,10)||2);
  const thr=Math.max(3, parseInt(document.getElementById('thrRooms').value,10)||4);
  saveStaff({surveillants:sv, estafettes:es}); saveEstafettesCfg({minPerBuilding:minEst, useThreeWhenRoomsGte:thr});
  return loadStaff();
}

async function importerPersonnelDepuisColler(){
  const html=`
    <div style="display:grid;gap:10px">
      <p style="margin:0;color:#475569">Collez les lignes (avec <b>GRADE</b> et <b>NOM ET PRENOMS</b>).</p>
      <textarea id="txtImport" rows="12" placeholder="Collez ici…" style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:10px 12px;outline:none"></textarea>
      <small style="color:#64748b">Pas besoin de nettoyer NR/MLE/Téléphone/Unité.</small>
    </div>`;
  const res=await Swal.fire({ title:"Importer le personnel (coller depuis Excel)", html, width:720, focusConfirm:false, showCancelButton:true, confirmButtonText:"Importer" });
  if(!res.isConfirmed) return null;
  const raw=document.getElementById('txtImport').value||'';
  const parsed=parsePersonnelFromPasted(raw);
  if(!parsed.total){ await Swal.fire("Aucun agent détecté","Vérifie la présence des colonnes GRADE/NOM.","warning"); return null; }
  saveStaff({surveillants:parsed.surveillants, estafettes:parsed.estafettes});
  await Swal.fire({icon:"success", title:"Import réussi", html:`<div style="text-align:left"><p>Agents détectés : <b>${parsed.total}</b></p><p>Surveillants : <b>${parsed.surveillants.length}</b></p><p>Estafettes (GST/G2C) : <b>${parsed.estafettes.length}</b></p></div>`});
  return loadStaff();
}

async function importerPersonnelDepuisExcel(){
  const html=`<div style="display:grid;gap:10px">
    <input id="excelFile" type="file" accept=".xlsx,.xls,.csv" style="border:1px solid #d1d5db;border-radius:10px;padding:8px 10px" />
    <small style="color:#64748b">Le fichier doit contenir <b>GRADE</b> et <b>NOM ET PRENOMS</b>.</small></div>`;
  const res=await Swal.fire({
    title:"Importer le personnel depuis un fichier", html, width:560, focusConfirm:false, showCancelButton:true, confirmButtonText:"Importer",
    preConfirm:async()=>{
      const input=document.getElementById('excelFile'); const file=input?.files?.[0];
      if(!file){ Swal.showValidationMessage("Sélectionnez un fichier."); return false; }
      try{
        const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:"array"}); const sheet=wb.Sheets[wb.SheetNames[0]];
        const rows=XLSX.utils.sheet_to_json(sheet,{defval:"",raw:false}); const parsed=parsePersonnelFromObjects(rows);
        if(!parsed.total){ Swal.showValidationMessage("Impossible de détecter des agents."); return false; }
        saveStaff({surveillants:parsed.surveillants, estafettes:parsed.estafettes}); return parsed;
      }catch(e){ console.error(e); Swal.showValidationMessage("Erreur de lecture du fichier."); return false; }
    }
  });
  if(!res.isConfirmed) return null;
  const p=res.value;
  await Swal.fire({icon:"success", title:"Import réussi", html:`<div style="text-align:left"><p>Agents détectés : <b>${p.total}</b></p><p>Surveillants : <b>${p.surveillants.length}</b></p><p>Estafettes (GST/G2C) : <b>${p.estafettes.length}</b></p></div>`});
  return loadStaff();
}

/******************************************************
 * 4) ESTAFETTES — calcul auto en excluant les surveillants
 ******************************************************/
// Retourne un Set des noms normalisés de toutes les personnes surveillants (pour toutes les salles)
function getAllSurveillantNames(salles) {
  return new Set(
    (salles || [])
      .flatMap(s => s.surveillants || [])
      .map(label => normName(nameFromLabel(label)))
      .filter(Boolean)
  );
}

function computeEstafettesParBat(salles, staff, editedMap /* {bat -> [label]} */){
  // Choix utilisateur précédents
  
  const fromUI = new Map(Object.entries(editedMap||{}));
  const cfg = loadEstafettesCfg();

  // 1) Exclure toute personne déjà surveillant (règle stricte)
  const survUsed = getAllSurveillantNames(salles);

  // 2) Pool autorisé = GST puis G2C, hors surveillants
// Pool des estafettes autorisées : jamais un déjà surveillant
const base = (staff?.estafettes||[])
.map(l => ({ grade: gradeFromLabel(l), name: nameFromLabel(l), label:l }))
.filter(p => ONLY_ESTAFETTE_GRADES.has(p.grade))
.filter(p => !survUsed.has(normName(p.name))); // <--- ICI

  // 3) Déduplique par nom + mélange pour vrai random
  const seen = new Set();
  const pool = base.filter(p=>{
    const n=normName(p.name);
    if(seen.has(n)) return false;
    seen.add(n);
    return true;
  });
  shuffleInPlace(pool);

  // 4) Groupement des salles par bâtiment
  const byBat = new Map();
  for(const s of (salles||[])){
    const b=_clean(s.batiment)||"—";
    if(!byBat.has(b)) byBat.set(b,[]);
    byBat.get(b).push(s);
  }

  const perBat = loadEstafettesPerBuilding();   // <-- ajout
  const needFor = (bat)=>{
    if (perBat[bat]) return perBat[bat];
    const nb=(byBat.get(bat)||[]).length;
    return (nb >= cfg.useThreeWhenRoomsGte) ? Math.max(3,cfg.minPerBuilding) : Math.max(2,cfg.minPerBuilding);
  };

  // 5) Round-robin *avec* unicité globale estafettes (pas 2 bâtiments)
  let idx=0;
  const usedEst = new Set(); // noms normalisés déjà affectés comme estafette (tous bâtiments)
  const rr = ()=>{
    while(idx < pool.length){
      const lab = pool[idx++].label;
      const n = normName(nameFromLabel(lab));
      if(!usedEst.has(n)){
        usedEst.add(n);
        return lab;
      }
    }
    return null; // plus personne dispo → laisser vide
  };

  // 6) Construit le résultat par bâtiment
  const out=new Map();
  for(const bat of byBat.keys()){
    const need = needFor(bat);

    // On nettoie d'abord les sélections utilisateur :
    //  - supprime quiconque est surveillant
    //  - supprime doublons par nom
    const userSelRaw = (fromUI.get(bat)||[]).filter(Boolean);
    const seenLoc = new Set();
    const userSel = [];
    for(const lab of userSelRaw){
      const n = normName(nameFromLabel(lab));
      if(!n) continue;
      if(survUsed.has(n)) continue;         // jamais surveillant & estafette
      if(usedEst.has(n)) continue;          // déjà utilisé par un autre bâtiment
      if(seenLoc.has(n)) continue;          // pas de doublon local
      seenLoc.add(n);
      usedEst.add(n);                        // réserve globalement
      userSel.push(lab);
    }

    // Complète aléatoirement jusqu'au besoin
    const list = userSel.slice(0, need);
    while(list.length < need){
      const e = rr();
      if(!e) break;                          // pool épuisé -> vide laissé
      list.push(e);
    }
    out.set(bat, list);
  }
  return out;
}


/******************************************************
 * 5) MODAL principal (salles + à droite onglet Estafettes)
 ******************************************************/
/******************************************************
 * 5) MODAL principal (salles + à droite onglet Estafettes)
 *    → version "simple" : on redemande TOUJOURS le nb de salles
 *      et on ajuste savedRooms avant d'ouvrir le modal
 ******************************************************/
async function ajouterSallesViaModal(eleves, exclusions = []) {
  const savedRooms = loadRooms();
  const prevCount = savedRooms.length || 0;
  // Demande systématique du nombre de salles (pré-rempli)
  const { value } = await Swal.fire({
    title: "Combien de salles ?",
    input: "number",
    inputLabel: "Nombre total de salles",
    inputValue: prevCount || "",
    inputPlaceholder: "Ex : 40",
    allowOutsideClick: false,
    showCancelButton: true,
    confirmButtonText: "Continuer",
    cancelButtonText: "Annuler",
    preConfirm: (val) => {
      const n = parseInt(val, 10);
      if (isNaN(n) || n <= 0) {
        Swal.showValidationMessage("Nombre invalide (≥ 1).");
        return false;
      }
      return n;
    }
  });
  if (!value) return; // annulé
  // Ajuste la liste de salles à la nouvelle taille
  const nbSalles = parseInt(value, 10);
  let activeRooms = savedRooms.slice(0, nbSalles);
  if (activeRooms.length < nbSalles) {
    for (let i = activeRooms.length; i < nbSalles; i++) {
      activeRooms.push({ numero: i + 1, capacite: 0, description: "", batiment: "", surveillants: [] });
    }
  }
  // Renumérote proprement
  activeRooms = activeRooms.map((r, i) => ({
    numero: i + 1,
    capacite: Number(r.capacite) || 0,
    description: r.description || "",
    batiment: r.batiment || "",
    surveillants: Array.isArray(r.surveillants) ? r.surveillants.slice(0, 2) : []
  }));
  // (Option) on sauvegarde tout de suite cette base redimensionnée
  saveRooms(activeRooms);
  // ===== CSS (inchangé, 1 seule fois)
  if (!document.getElementById('swal-repart-css')) {
    const style = document.createElement('style'); style.id = 'swal-repart-css';
    style.textContent = `
      .swal2-popup.repart-popup{padding:18px 20px 16px}
      .btn-chip{padding:8px 12px;border-radius:10px;border:none;background:#3b82f6;color:#fff;cursor:pointer}
      .btn-chip.alt{background:#6366f1} .btn-chip.ghost{background:#e5e7eb;color:#111827}
      .repart-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap}
      .repart-toolbar-left{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .repart-toolbar-left input{padding:8px 10px;border:1px solid #cfd4dc;border-radius:10px}
      .repart-body{display:grid;grid-template-columns:1fr 320px;gap:12px}
      .repart-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;max-height:480px;overflow:auto;padding-right:2px}
      .room-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;box-shadow:0 1px 3px rgba(16,24,40,.06)}
      .room-head{display:flex;align-items:center;justify-content:center}
      .room-badge{font-weight:700;font-size:13px;background:#eef2ff;color:#4338ca;padding:6px 10px;border-radius:999px;border:1px solid #c7d2fe}
      .room-input-group{display:flex;align-items:center;gap:8px;justify-content:center}
      .room-input-group input.salle-nb{width:92px;text-align:center;padding:10px 8px;border:1px solid #cfd4dc;border-radius:10px;font-weight:700}
      .btn-inc,.btn-dec{width:34px;height:34px;border-radius:10px;border:1px solid #e5e7eb;background:#f3f4f6;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center}
      .room-building,.room-desc{width:100%;padding:8px 10px;border:1px solid #cfd4dc;border-radius:10px}
      .room-staff{display:flex;flex-direction:column;gap:6px;padding:8px;border:1px dashed #e5e7eb;border-radius:10px;background:#f8fafc;font-size:12.5px}
      .room-staff .lab{font-weight:700;color:#334155}
      .room-staff select{width:100%;padding:8px 10px;border:1px solid #cfd4dc;border-radius:10px}
      .repart-sidebar{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:10px}
      .side-title{font-weight:800;font-size:14px}
      .est-item{border:1px dashed #e5e7eb;border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:6px}
      .est-head{display:flex;justify-content:space-between;align-items:center;font-weight:600}
      .est-list select{width:100%;margin-top:6px;padding:8px 10px;border:1px solid #cfd4dc;border-radius:10px}
      .room-card.sv-missing{border-color:#ef4444 !important;box-shadow:0 0 0 3px rgba(239,68,68,.12)}
      .estaf-missing{color:#b91c1c;font-weight:600}
      .repart-footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:8px 10px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;font-size:13px;color:#334155}
      .footer-kpi{display:flex;gap:12px;align-items:center}
      .kpi{background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;padding:6px 10px;border-radius:10px;font-weight:700}
      .shortage-badge{margin-left:8px;padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px}
      .short-ok{background:#dcfce7;color:#065f46;border:1px solid #bbf7d0}
      .short-warn{background:#fef9c3;color:#92400e;border:1px solid #fde68a}
      .short-bad{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
      .room-card.sv-duplicate {
        border-color: #a855f7 !important;
        box-shadow: 0 0 0 3px rgba(168,85,247,.18);
      }
      .reprise-box{border:1px solid #e5e7eb;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px}
.reprise-head{display:flex;justify-content:space-between;align-items:center;font-weight:700}
.reprise-grid{display:grid;grid-template-columns:1fr 110px 34px;gap:6px}
.reprise-grid input{padding:8px 10px;border:1px solid #cfd4dc;border-radius:10px}
.reprise-add{padding:6px 10px;border:none;border-radius:10px;background:#3b82f6;color:#fff;cursor:pointer}
.reprise-del{border:1px solid #e5e7eb;border-radius:10px;background:#f3f4f6;cursor:pointer}

      
    `;
    document.head.appendChild(style);
  }
  // === GÉNÉRATION DES CARTES À PARTIR DE activeRooms
  const cardsHTML = activeRooms.map((r, i) => {
    const cap = r.capacite ?? "";
    const desc = r.description ?? "";
    const bat  = r.batiment ?? "";
    return `
      <div class="room-card">
        <div class="room-head"><span class="room-badge">Salle ${i + 1}</span></div>
        <div class="room-input-group">
          <button class="btn-dec" type="button" data-idx="${i}">−</button>
          <input class="salle-nb" type="number" min="1" inputmode="numeric" placeholder="Nb élèves" data-idx="${i}" value="${cap}">
          <button class="btn-inc" type="button" data-idx="${i}">+</button>
        </div>
        <input class="room-building" type="text" placeholder="Bâtiment (ex: A, Bloc 1…)" data-idx="${i}" value="${bat}">
        <input class="room-desc" type="text" placeholder="Description (ex: Salle 11…)" data-idx="${i}" value="${desc}">
        <div class="room-staff" data-idx="${i}">
          <div class="lab">Surveillants (2 requis)</div>
          <select class="sv1" data-idx="${i}"></select>
          <select class="sv2" data-idx="${i}" style="margin-top:4px"></select>
        </div>
      </div>`;
  }).join("");
  // Barre d'outils (inchangée)
  const toolbar = `
    <div class="repart-toolbar">
      <div class="repart-toolbar-left">
        <button id="btn-staff" class="btn-chip">Personnel</button>
        <button id="btn-import-excel" class="btn-chip ghost">Importer Excel</button>
        <button id="btn-import-paste" class="btn-chip ghost">Coller Excel</button>
        <input id="cap-def" type="number" min="1" placeholder="Capacité par défaut"/><button id="apply-all" class="btn-chip">Appliquer à toutes</button>
        <input id="desc-def" type="text" placeholder="Description par défaut"/><button id="apply-desc-all" class="btn-chip alt">Appliquer descriptions</button>
        <input id="builds" type="text" placeholder="Bâtiments (ex: A,B,C)"/><button id="apply-buildings" class="btn-chip ghost">Assigner bâtiments</button>
        <input id="group-size" type="number" min="2" value="3" placeholder="Taille cible"/><input id="group-max" type="number" min="3" value="5" placeholder="Taille max"/><button id="auto-group-buildings" class="btn-chip">Grouper (A,B,C…)</button>
        <button id="clear-all" class="btn-chip ghost">Tout vider</button>
      </div>
      <div style="font-size:12px;color:#6b7280">Entrée : valider • Échap : annuler</div>
    </div>`;
  // Corps : grille + sidebar estafettes
  const bodyHTML = `
    <div class="repart-body">
      <div class="repart-grid">${cardsHTML}</div>
      <aside class="repart-sidebar">
        <div class="side-title">Onglet — Estafettes par bâtiment</div>
        <div id="estafette-panel"></div>
        <div class="reprise-box" id="reprise-box">
        <div class="reprise-head">
         <span>À reprendre (réserves)</span>
        <button type="button" id="reprise-add" class="reprise-add">+ Ligne</button>
    </div>
  <div class="reprise-grid" id="reprise-grid"></div>
</div>

      </aside>
    </div>`;
  // Footer
  const footer = `
    <div class="repart-footer">
      <div class="footer-kpi">
        <span>Total saisi : <span id="sum-cap" class="kpi">0</span></span>
        ${Array.isArray(eleves) ? `<span>Élèves dispo : <span class="kpi">${eleves.length}</span></span>` : ''}
        <span>Salles : <span class="kpi">${activeRooms.length}</span></span>
        <span id="shortage-indicator" class="shortage-badge short-ok" style="display:none"></span>
      </div>
      <div style="font-size:12px;color:#6b7280">Astuce : utilisez les boutons +/−</div>
    </div>`;
  // Ouverture
  const result = await Swal.fire({
    title: "Effectif, bâtiments & personnels des salles",
    html: `${toolbar}${bodyHTML}${footer}`,
    width: 1100,
    focusConfirm: false,
    allowOutsideClick: false,
    customClass: { popup: "repart-popup" },
    showCancelButton: true,
    confirmButtonText: "Valider Répartition",
    didOpen: () => {
      const inputs = [...document.querySelectorAll('.salle-nb')];
      const sumEl = document.getElementById('sum-cap');
      const total = Array.isArray(eleves) ? eleves.length : null;
      const updateSum = () => {
        const sum = inputs.reduce((a, inp) => a + (parseInt(inp.value, 10) || 0), 0);
        if (sumEl) {
          sumEl.textContent = sum;
          if (total != null) {
            sumEl.style.background = sum < total ? '#fee2e2' : (sum > total ? '#fef9c3' : '#dcfce7');
            sumEl.style.color = '#111827';
          }
        }
      };
      // Bouton Random (surveillants) — inchangé
      const confirmBtn = Swal.getConfirmButton();
      const randomBtn = document.createElement('button');
      randomBtn.id = 'btn-random-staff';
      randomBtn.textContent = 'Random personnels';
      randomBtn.className = 'btn-chip alt';
      randomBtn.style.marginRight = '8px';
      confirmBtn.parentNode.insertBefore(randomBtn, confirmBtn);
      // Estafettes par bâtiment (état)
      let estAssign = loadEstafettesAssign();
      let staff = loadStaff();

      const getSallesSnapshot = () => [...document.querySelectorAll('.room-card')].map((card, i) => ({
        numero: i + 1,
        batiment: (card.querySelector('.room-building')?.value || '').trim() || '—',
        surveillants: [card.querySelector('.sv1')?.value, card.querySelector('.sv2')?.value].filter(Boolean)
      }));
      function getAllEstafetteNames(estAssign) {
        // Retourne Set de tous les noms (normés) d’estafettes assignées (tous bâtiments)
        return new Set(
          Object.values(estAssign || {})
            .flat()
            .map(label => normName(nameFromLabel(label)))
            .filter(Boolean)
        );
      }
      function buildSurveillantOptions() {
        const pools = buildSurvPools(staff.surveillants || []);
        // Compter combien de fois chaque personne est affectée
        const allRooms = [...document.querySelectorAll('.room-card')];
        const surveillantCount = {};
        allRooms.forEach(card => {
          ['sv1', 'sv2'].forEach(cls => {
            const v = card.querySelector(`.${cls}`)?.value;
            if (v) {
              const n = normName(nameFromLabel(v));
              surveillantCount[n] = (surveillantCount[n] || 0) + 1;
            }
          });
        });
        // Noms d'estafette
        const estAssign = loadEstafettesAssign();
        const allEstafette = getAllEstafetteNames(estAssign);
      
        const options = pools.display.map(p => {
          const n = normName(p.name);
          const isEstafette = allEstafette.has(n);
          const count = surveillantCount[n] || 0;
          // Coloration :
          // - ROUGE si affecté dans PLUS D’UNE salle, ou déjà estafette
          // - BLEU si jamais affecté
          // - GRIS si utilisé une fois
          let color = 'background:#dbeafe;color:#2563eb'; // bleu
          if (isEstafette || count > 1) color = 'background:#fee2e2;color:#991b1b'; // rouge vif
          else if (count === 1) color = 'background:#e0e7ff;color:#64748b;'; // gris/bleu pâle
          return `<option value="${p.label.replace(/"/g, '&quot;')}" style="${color}">${p.label}</option>`;
        }).join('');
        document.querySelectorAll('.sv1,.sv2').forEach(sel => {
          const cur = sel.value;
          sel.innerHTML = `<option value=""></option>` + options;
          if (cur && [...sel.options].some(o => o.value === cur)) {
            sel.value = cur;
          } else {
            sel.selectedIndex = 0;
          }
        });
      }
      
      
      /** 
       * Colore la carte salle si un surveillant est déjà ailleurs comme surveillant OU comme estafette.
       */
      function colorizeDuplicateSurveillants() {
        const allRooms = [...document.querySelectorAll('.room-card')];
        // 1. Compte le nombre d'occurrences de chaque surveillant
        const surveillantToRooms = {};
        allRooms.forEach((card, idx) => {
          ['sv1', 'sv2'].forEach(cls => {
            const val = card.querySelector(`.${cls}`)?.value;
            if (val) {
              const norm = normName(nameFromLabel(val));
              if (!surveillantToRooms[norm]) surveillantToRooms[norm] = [];
              surveillantToRooms[norm].push(idx); // stocke l'indice de la salle
            }
          });
        });
      
        // 2. Pour chaque salle, regarde si l’un des surveillants y est affecté à plus d'une salle
        allRooms.forEach((card, idx) => {
          let isDuplicate = false;
          ['sv1', 'sv2'].forEach(cls => {
            const val = card.querySelector(`.${cls}`)?.value;
            if (val) {
              const norm = normName(nameFromLabel(val));
              // S'il y a PLUS d'une salle pour ce surveillant, c'est un doublon
              if (surveillantToRooms[norm] && surveillantToRooms[norm].length > 1) {
                isDuplicate = true;
              }
            }
          });
          if (isDuplicate) card.classList.add('sv-duplicate');
          else card.classList.remove('sv-duplicate');
        });
      }
      
      
      
    
      
      
      
      
      function colorizeShortages(estMap) {
        const cards = [...document.querySelectorAll('.room-card')];
        let missingSV = 0, missingEst = 0;
        const cfg = loadEstafettesCfg();
        const snapshot = getSallesSnapshot();
        const countByBat = new Map();
        snapshot.forEach(s => countByBat.set(s.batiment, (countByBat.get(s.batiment) || 0) + 1));
        const needFor = bat => (countByBat.get(bat) || 0) >= cfg.useThreeWhenRoomsGte ? Math.max(3, cfg.minPerBuilding) : Math.max(2, cfg.minPerBuilding);
        cards.forEach(card => {
          const sv1 = card.querySelector('.sv1')?.value, sv2 = card.querySelector('.sv2')?.value;
          if (!sv1 || !sv2) { card.classList.add('sv-missing'); missingSV++; } else card.classList.remove('sv-missing');
        });
        for (const [bat, list] of estMap.entries()) {
          const need = needFor(bat); missingEst += Math.max(0, need - (list?.length || 0));
        }
        const badge = document.getElementById('shortage-indicator');
        if (missingSV === 0 && missingEst === 0) {
          badge.style.display = 'inline-block'; badge.className = 'shortage-badge short-ok'; badge.textContent = 'Aucun manque de personnel';
        } else {
          badge.style.display = 'inline-block';
          const parts = []; if (missingSV > 0) parts.push(`${missingSV} salle(s) sans 2 surveillants`); if (missingEst > 0) parts.push(`estafettes manquantes: ${missingEst}`);
          const sev = (missingSV > 0 && missingEst > 0) ? 'short-bad' : 'short-warn';
          badge.className = `shortage-badge ${sev}`; badge.textContent = parts.join(' · ');
        }
        return { missingSV, missingEst };
      }
      

      function renderEstafettePanel() {
        const panel = document.getElementById('estafette-panel');
        if (!panel) return;
        const snapshot = getSallesSnapshot();
        const survUsed = getAllSurveillantNames(snapshot);
        const estAssign = loadEstafettesAssign();
        const perBat = loadEstafettesPerBuilding();
        let staff = loadStaff();

      
        // Liste des surveillants déjà utilisés (pour filtrer l'affichage)
        
      
        // Filtrer la pool d’estafettes (jamais de doublon)
        const pool = (staff.estafettes || [])
        .filter(l => ONLY_ESTAFETTE_GRADES.has(gradeFromLabel(l)))
         .filter(l => !survUsed.has(normName(nameFromLabel(l))));
 
        const options = pool.map(l => `<option value="${l.replace(/"/g, '&quot;')}">${l}</option>`).join('');
      
        // Pour calcul du besoin personnalisé par bâtiment
        const cfg = loadEstafettesCfg();
        const countByBat = new Map();
        snapshot.forEach(s => countByBat.set(s.batiment, (countByBat.get(s.batiment) || 0) + 1));
        const needFor = bat => {
          if (perBat[bat]) return perBat[bat];
          return (countByBat.get(bat) || 0) >= cfg.useThreeWhenRoomsGte ? Math.max(3, cfg.minPerBuilding) : Math.max(2, cfg.minPerBuilding);
        };
      
        const bats = [...new Set(snapshot.map(s => s.batiment))];
        

        panel.innerHTML = bats.map(bat => {
          const custom = perBat[bat];
          const need = typeof custom === 'number' ? custom : needFor(bat);
          const list = computeEstafettesParBat(snapshot, staff, estAssign).get(bat) || [];
          const manque = Math.max(0, need - list.length);
          const selects = Array.from({ length: need }, (_, i) => `
            <select class="est-sel" data-bat="${bat}" data-idx="${i}">
              <option value=""></option>${options}
            </select>`).join('');
          return `
            <div class="est-item">
              <div class="est-head">
                <span>Bâtiment <b>${bat}</b></span>
                <span>
                  ${manque>0?`(manque ${manque})`:`${need} requis`}
                  <button class="btn-set-estaf" data-bat="${bat}" style="margin-left:6px">🖉</button>
                </span>
              </div>
              <div class="est-list" data-bat="${bat}">
                ${selects}
              </div>
            </div>`;
        }).join('');
      
        // Édition du nombre d’estafettes pour chaque bâtiment
        panel.querySelectorAll('.btn-set-estaf').forEach(btn => {
          btn.addEventListener('click', async () => {
            const bat = btn.getAttribute('data-bat');
            const prev = perBat[bat] ?? '';
            const { value } = await Swal.fire({
              title: `Nb d’estafettes pour ${bat}`,
              input: 'number',
              inputValue: prev,
              inputAttributes: { min: 1 },
              showCancelButton: true
            });
            if (value !== undefined) {
              if (value === '' || isNaN(Number(value))) delete perBat[bat];
              else perBat[bat] = Math.max(1, Number(value));
              saveEstafettesPerBuilding(perBat);
              renderEstafettePanel();
              renderReprisePanel();
            }
          });
        });
      
        // Appliquer la sélection de la sauvegarde (jamais de surveillant déjà choisi)
        panel.querySelectorAll('.est-sel').forEach(sel => {
          const bat = sel.getAttribute('data-bat');
          const idx = parseInt(sel.getAttribute('data-idx'), 10);
          const cur = (estAssign[bat] || [])[idx] || '';
          // On ne propose pas les surveillants
          sel.value = [...sel.options].some(o => o.value === cur) ? cur : '';
          sel.addEventListener('change', () => {
            const arr = (estAssign[bat] || []).slice();
            arr[idx] = sel.value || '';
            estAssign[bat] = arr.filter(Boolean);
            saveEstafettesAssign(estAssign);
            renderEstafettePanel();
            renderReprisePanel();
          });
        });
      
        // Affiche les alertes de manque
        colorizeShortages(computeEstafettesParBat(snapshot, staff, estAssign));
      }
      

      function renderReprisePanel() {
        const grid = document.getElementById('reprise-grid');
        if (!grid) return;
      
        // 1) Charger l'existant
        let rows = loadReprise(); // [{nom, nombre}]
      
        // 2) Si vide (ou uniquement lignes vides), proposer l'auto par défaut (modifiable ensuite)
        const isEmpty = !rows.length || rows.every(r => !(r?.nom?.trim()) && !(Number(r?.nombre) > 0));
        if (isEmpty) {
          const snapshot = getSallesSnapshot();       // déjà défini dans didOpen
          const suggestion = computeSuggestedReprise(snapshot, staff, estAssign);
          if (suggestion.length) {
            rows = suggestion;
            saveReprise(rows);                        // on persiste pour l’export Excel
          } else {
            // Laisse une ligne vide si aucune suggestion
            rows = [{ nom:"", nombre:0 }];
            saveReprise(rows);
          }
        }
      
        const rowHTML = (nom="", nombre="") => `
          <input class="repr-nom" placeholder="Nom" value="${(nom||"").replace(/"/g,'&quot;')}">
          <input class="repr-nb" type="number" min="0" placeholder="Nombre" value="${Number(nombre)||""}">
          <button type="button" class="reprise-del">×</button>
        `;
      
        grid.innerHTML = rows.map(r => rowHTML(r.nom, r.nombre)).join('');
      
        // Écouteurs: suppression d'une ligne
        grid.addEventListener('click', (e) => {
          const btn = e.target.closest('.reprise-del');
          if (!btn) return;
          const items = [...grid.querySelectorAll('.repr-nom')].map((inp, i) => ({
            nom: inp.value.trim(),
            nombre: Number(grid.querySelectorAll('.repr-nb')[i].value || 0)
          }));
          const idx = [...grid.querySelectorAll('.reprise-del')].indexOf(btn);
          if (idx >= 0) items.splice(idx, 1);
          saveReprise(items);
          renderReprisePanel();
        });
      
        // Sauvegarde sur input
        grid.querySelectorAll('.repr-nom,.repr-nb').forEach(inp => {
          inp.addEventListener('input', () => {
            const items = [...grid.querySelectorAll('.repr-nom')].map((inp, i) => ({
              nom: inp.value.trim(),
              nombre: Number(grid.querySelectorAll('.repr-nb')[i].value || 0)
            }));
            saveReprise(items);
          });
        });
      }
      
      
      // Bouton + ligne
      document.getElementById('reprise-add')?.addEventListener('click', () => {
        const list = loadReprise().slice();
        list.push({ nom:"", nombre:0 });
        saveReprise(list);
        renderReprisePanel();
      });
      


      function colorizeDuplicateSurveillants() {
        // Récupère toutes les affectations surveillants
        const allRooms = [...document.querySelectorAll('.room-card')];
        const surveillantToRooms = {};
        allRooms.forEach((card, idx) => {
          ['sv1', 'sv2'].forEach(cls => {
            const val = card.querySelector(`.${cls}`)?.value;
            if (val) {
              const norm = normName(nameFromLabel(val));
              if (!surveillantToRooms[norm]) surveillantToRooms[norm] = [];
              surveillantToRooms[norm].push(idx);
            }
          });
        });
        allRooms.forEach((card, idx) => {
          let isDuplicate = false;
          ['sv1', 'sv2'].forEach(cls => {
            const val = card.querySelector(`.${cls}`)?.value;
            if (val) {
              const norm = normName(nameFromLabel(val));
              if (surveillantToRooms[norm] && surveillantToRooms[norm].length > 1 && surveillantToRooms[norm].includes(idx)) {
                isDuplicate = true;
              }
            }
          });
          if (isDuplicate) card.classList.add('sv-duplicate');
          else card.classList.remove('sv-duplicate');
        });
      }
      colorizeDuplicateSurveillants();

      

      
      function snapshotRoomsFromModalAndSave() {
        const cards = [...document.querySelectorAll('.room-card')];
        const out = cards.map((card, i) => ({
          numero: i + 1,
          capacite: parseInt(card.querySelector('.salle-nb')?.value, 10) || 0,
          description: (card.querySelector('.room-desc')?.value || '').trim(),
          batiment: (card.querySelector('.room-building')?.value || '').trim(),
          surveillants: [card.querySelector('.sv1')?.value, card.querySelector('.sv2')?.value].filter(Boolean)
        }));
        saveRooms(out);
      }
      function randomizeSurveillantsAcrossRooms() {
        const pools = buildSurvPools(staff.surveillants || []); 
        const usedNames = new Set(); // Suivre les noms déjà utilisés
        
        // Créer des copies mélangées des pools
        const shuffledA = shuffleInPlace(pools.A.slice());
        const shuffledB = shuffleInPlace(pools.B.slice());
        
        document.querySelectorAll('.room-card').forEach(card => {
          const s1 = card.querySelector('.sv1');
          const s2 = card.querySelector('.sv2');
          
          // Trouver un surveillant du groupe A non utilisé
          let personA = null;
          for (let i = 0; i < shuffledA.length; i++) {
            if (!usedNames.has(normName(shuffledA[i].name))) {
              personA = shuffledA[i];
              usedNames.add(normName(personA.name));
              break;
            }
          }
          
          // Trouver un surveillant du groupe B non utilisé
          let personB = null;
          for (let i = 0; i < shuffledB.length; i++) {
            if (!usedNames.has(normName(shuffledB[i].name))) {
              personB = shuffledB[i];
              usedNames.add(normName(personB.name));
              break;
            }
          }
          
          // Assigner aléatoirement l'ordre
          if (Math.random() < 0.5) {
            s1.value = personB ? personB.label : '';
            s2.value = personA ? personA.label : '';
          } else {
            s1.value = personA ? personA.label : '';
            s2.value = personB ? personB.label : '';
          }
        });
      }
      // Random : surveillants + estafettes auto
      randomBtn.addEventListener('click', () => {
        randomizeSurveillantsAcrossRooms();
        snapshotRoomsFromModalAndSave();
        const autoMap = computeEstafettesParBat(getSallesSnapshot(), staff, {});
        const estAssignObj = Object.fromEntries([...autoMap.entries()]);
        saveEstafettesAssign(estAssignObj);
        renderEstafettePanel();
        renderReprisePanel();
        const estMap = computeEstafettesParBat(getSallesSnapshot(), staff, estAssignObj);
        const { missingSV, missingEst } = colorizeShortages(estMap);
        if (missingSV > 0 || missingEst > 0) {
          Swal.fire({ toast:true, position:"top-end", timer:2500, showConfirmButton:false, icon:"warning",
            title:`Random terminé`, text:`Manques → Surveillants: ${missingSV} salle(s), Estafettes: ${missingEst}` });
        } else {
          Swal.fire({ toast:true, position:"top-end", timer:1200, showConfirmButton:false, icon:"success", title:"Random ok" });
        }
      });
      
      // Listeners basiques (inchangés)
      document.querySelectorAll('.btn-inc').forEach(btn=>{
        btn.addEventListener('click',()=>{ const idx=btn.getAttribute('data-idx'); const inp=document.querySelector(`.salle-nb[data-idx="${idx}"]`);
          inp.value=Math.max(0,parseInt(inp.value||'0',10))+1; updateSum(); });
      });
      document.querySelectorAll('.btn-dec').forEach(btn=>{
        btn.addEventListener('click',()=>{ const idx=btn.getAttribute('data-idx'); const inp=document.querySelector(`.salle-nb[data-idx="${idx}"]`);
          const v=Math.max(0,(parseInt(inp.value||'0',10)-1)); inp.value=v||''; updateSum(); });
      });
      inputs.forEach(inp=>{ inp.addEventListener('input',()=>{ updateSum(); }); inp.addEventListener('wheel',e=>e.preventDefault(),{passive:false}); });
      document.getElementById('apply-all')?.addEventListener('click',()=>{ const v=parseInt(document.getElementById('cap-def').value,10); if(!isNaN(v)&&v>0){ inputs.forEach(i=>i.value=v); updateSum(); }});
      document.getElementById('apply-desc-all')?.addEventListener('click',()=>{ const d=document.getElementById('desc-def').value||''; document.querySelectorAll('.room-desc').forEach(i=>i.value=d); });
      document.getElementById('apply-buildings')?.addEventListener('click',()=>{
        const raw=(document.getElementById('builds').value||'').trim(); if(!raw) return;
        const arr=raw.split(/[,;]+/).map(s=>s.trim()).filter(Boolean); if(!arr.length) return;
        const bInputs=[...document.querySelectorAll('.room-building')]; bInputs.forEach((i,idx)=>i.value=arr[idx%arr.length]);
        saveBuildings(arr); snapshotRoomsFromModalAndSave(); renderEstafettePanel();renderReprisePanel();
      });
      document.getElementById('auto-group-buildings')?.addEventListener('click',()=>{
        const bInputs=[...document.querySelectorAll('.room-building')];
        const total=bInputs.length;
        const target=Math.max(2, parseInt(document.getElementById('group-size').value,10)||3);
        const maxSz=Math.max(target, parseInt(document.getElementById('group-max').value,10)||5);
        const groups=Math.ceil(total/target); const base=Math.floor(total/groups); let rest=total%groups;
        const sizes=Array.from({length:groups},()=>base); let i=0; while(rest>0){ if(sizes[i]<maxSz){ sizes[i]++; rest--; } i=(i+1)%sizes.length; }
        const labelOf=idx=>String.fromCharCode(65+idx); let cur=0;
        sizes.forEach((sz,g)=>{ const lab=labelOf(g); for(let k=0;k<sz&&cur<total;k++,cur++){ bInputs[cur].value=lab; }});
        saveBuildings(sizes.map((_,i)=>String.fromCharCode(65+i)));
        snapshotRoomsFromModalAndSave(); renderEstafettePanel();renderReprisePanel();
      });
      document.getElementById('clear-all')?.addEventListener('click',()=>{
        document.querySelectorAll('.salle-nb').forEach(i=>i.value='');
        document.querySelectorAll('.room-desc').forEach(i=>i.value='');
        document.querySelectorAll('.room-building').forEach(i=>i.value='');
        document.querySelectorAll('.sv1,.sv2').forEach(s=>s.selectedIndex=-1);
        saveEstafettesAssign({}); snapshotRoomsFromModalAndSave(); renderEstafettePanel(); updateSum();
      });
      // Changement surveillant/bâtiment = maj estafettes + sauvegarde
      document.addEventListener('change', (e)=>{
        if(e.target.matches('.sv1,.sv2,.room-building')){
          snapshotRoomsFromModalAndSave();
          renderEstafettePanel();
          renderReprisePanel();
          colorizeDuplicateSurveillants();

        }
      });
      // Boutons import / personnel
      document.getElementById('btn-staff')?.addEventListener('click', async ()=>{ 
        await editerStaff(); 
        staff = loadStaff(); // Mettre à jour la variable staff
        buildSurveillantOptions(); 
        colorizeDuplicateSurveillants();
        snapshotRoomsFromModalAndSave(); 
        renderEstafettePanel(); 
        renderReprisePanel();
      });
      document.getElementById('btn-import-excel')?.addEventListener('click', async ()=>{ 
        const st=await importerPersonnelDepuisExcel(); 
        if(st){ 
          staff = st; // Mettre à jour la variable staff
          buildSurveillantOptions(); 
          colorizeDuplicateSurveillants();
          snapshotRoomsFromModalAndSave(); 
          renderEstafettePanel(); 
          renderReprisePanel();
        }
      });
      document.getElementById('btn-import-paste')?.addEventListener('click', async ()=>{ 
        const st=await importerPersonnelDepuisColler(); 
        if(st){ 
          staff = st; // Mettre à jour la variable staff
          buildSurveillantOptions(); 
          colorizeDuplicateSurveillants();
          snapshotRoomsFromModalAndSave(); 
          renderEstafettePanel(); 
          renderReprisePanel();
        }
      });
      
      // CORRECTION: D'abord construire les options, puis remplir les valeurs
      buildSurveillantOptions();
      colorizeDuplicateSurveillants()
      
      // Pré-sélection surveillants depuis activeRooms (au lieu de savedRooms)
      const pools = buildSurvPools(staff.surveillants || []); 
      document.querySelectorAll('.room-card').forEach((card,i)=>{
        const s1=card.querySelector('.sv1'), s2=card.querySelector('.sv2');
        const saved = activeRooms[i]?.surveillants || [];
        if(saved[0]) s1.value=saved[0];
        if(saved[1]) s2.value=saved[1];
      });
      
      updateSum();
      renderEstafettePanel();
      renderReprisePanel();
      Swal.getPopup().addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); Swal.clickConfirm(); }});
    },
    preConfirm: () => {
      const nbs=[...document.querySelectorAll('.salle-nb')];
      const descs=[...document.querySelectorAll('.room-desc')];
      const bats=[...document.querySelectorAll('.room-building')];
      const cards=[...document.querySelectorAll('.room-card')];
      let firstInvalid=null; const out=[];
      for(let i=0;i<nbs.length;i++){
        const inp=nbs[i]; const v=parseInt(inp.value,10);
        if(isNaN(v)||v<1){ inp.classList.add('invalid'); if(!firstInvalid) firstInvalid=inp; }
        else{
          const description=(descs[i]?.value||'').trim();
          const building=(bats[i]?.value||'').trim();
          const sv1=cards[i]?.querySelector('.sv1')?.value||'';
          const sv2=cards[i]?.querySelector('.sv2')?.value||'';
          out.push({ numero:i+1, capacite:v, description, batiment:building, surveillants:[sv1,sv2].filter(Boolean) });
        }
      }
      if(firstInvalid){ firstInvalid.scrollIntoView({behavior:"smooth",block:"center"}); Swal.showValidationMessage("Chaque salle doit avoir au moins 1 élève."); return false; }
      return out;
    }
  });
  const salles = result.isConfirmed ? result.value : null;
  if (salles && Array.isArray(eleves)) {
    saveRooms(salles);
    await genererRepartitionDepuisCartes(eleves, salles, exclusions);
  }
}
// Calcule la proposition "À reprendre" selon la règle : 3 si dispo ≥3 ; sinon 1/2 ; sinon 0
function computeSuggestedReprise(snapshot, staff, estAssign) {
  // 1) Noms déjà utilisés (surveillants + estafettes)
  const survUsed = new Set(
    (snapshot || [])
      .flatMap(s => s.surveillants || [])
      .map(lbl => normName(nameFromLabel(lbl)))
      .filter(Boolean)
  );
  const usedEst = new Set(
    Object.values(estAssign || {})
      .flat()
      .map(lbl => normName(nameFromLabel(lbl)))
      .filter(Boolean)
  );

  // 2) Base "surveillants" déclarés (toutes les personnes possibles côté staff.surveillants)
  const parsed = (staff?.surveillants || [])
    .map(parseSurveillantLine)
    .filter(Boolean)
    // On ne retient que ceux qui ne sont ni déjà surveillants ni déjà estafettes
    .filter(p => {
      const n = normName(p.name);
      return !survUsed.has(n) && !usedEst.has(n);
    });

  // 3) Compter par groupes
  let seniors = 0, adjoints = 0;
  for (const p of parsed) {
    const g = String(p.grade || "").toUpperCase();
    if (GROUP_B.has(g)) seniors++;               // GPCE/GPHC/GP1C/GP2C
    else if (GROUP_A.has(g)) adjoints++;         // GHC/G1C/G2C/GST
  }

  // 4) Règle de sortie
  const pick = (n) => (n >= 3 ? 3 : n);          // 0, 1, 2 ou 3

  const out = [];
  const s = pick(seniors);
  const a = pick(adjoints);
  if (s > 0) out.push({ nom: "Réserve seniors (GPCE/GPHC/GP1C/GP2C)", nombre: s });
  if (a > 0) out.push({ nom: "Réserve adjoints (GHC/G1C/G2C/GST)", nombre: a });
  return out;
}



/******************************************************
 * 6) PERSONNEL — affectation final (export)
 ******************************************************/
function affecterPersonnel(salles, staff){
  // Pas d'auto-complétion surveillants si insuffisant
  const savedAssign = loadEstafettesAssign(); // {bat -> [labels]}
  const estMap = computeEstafettesParBat(salles, staff, savedAssign);
  const estafettesParBatiment = Array.from(estMap.entries()).map(([batiment, estafettes])=>{
    const nbSalles = salles.filter(s => (_clean(s.batiment)||"—")===batiment).length;
    return { batiment, estafettes, nbSalles };
  });

  const missingSV = salles.reduce((acc,s)=> acc + Math.max(0, 2 - (Array.isArray(s.surveillants)?s.surveillants.length:0)), 0);
  const alerts=[];
  if(missingSV>0) alerts.push(`Salles sans 2 surveillants: ${missingSV}.`);
  return { salles, estafettesParBatiment, alerts };
}

/******************************************************
 * 7) RÉPARTITION ÉLÈVES
 ******************************************************/
async function genererRepartitionDepuisCartes(eleves, cartes, exclusionsDict={}){
  const exclusionSet=new Set(Object.keys(exclusionsDict||{}));
  const elevesExclus=[]; const elevesFiltres=(eleves||[]).filter(e=>{
    const inc=String(e.numeroIncorporation??'').trim();
    if(exclusionSet.has(inc)){ e.salle=exclusionsDict[inc]||"Non affecté"; elevesExclus.push(e); return false; }
    return true;
  });

  const shuffle=arr=>{ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } };
  shuffle(elevesFiltres);

  const pools={}; elevesFiltres.forEach(e=>{ if(!pools[e.escadron]) pools[e.escadron]=[]; pools[e.escadron].push(e); });
  Object.keys(pools).forEach(k=>shuffle(pools[k]));

  const salles=[]; const restants=[];
  (cartes||[]).forEach(({numero,capacite,description,batiment,surveillants})=>{
    const salle=[]; const quotas={};
    const round=max=>{
      let added=0; const keys=Object.keys(pools).filter(k=>pools[k].length>0); shuffle(keys);
      for(const esc of keys){
        if(salle.length>=capacite) break;
        const q=quotas[esc]||0; if(q<max && pools[esc].length>0){
          const e=pools[esc].shift(); if(e){ e.salle=numero; e.salleDesc=description||''; e.batiment=batiment||''; salle.push(e); quotas[esc]=q+1; added++; }
        }
      } return added;
    };
    if(salle.length<capacite) round(1);
    if(salle.length<capacite) round(2);
    while(salle.length<capacite && round(3)>0){}; while(salle.length<capacite && round(4)>0){};
    salles.push({ numero, effectif:salle.length, eleves:salle, description:description||"", batiment:batiment||"", surveillants:surveillants||[] });
  });

  Object.values(pools).forEach(l=>restants.push(...l)); shuffle(restants);
  if(restants.length>0){ restants.forEach(e=>{ e.salle="Reste"; e.batiment=""; }); salles.push({ numero:"Reste", effectif:restants.length, eleves:restants, description:"" }); }

  const staff=loadStaff();
  const {estafettesParBatiment, alerts}=affecterPersonnel(salles, staff);
  if(alerts.length) console.warn(alerts.join(' | '));
// AJOUTE CETTE LIGNE :
checkNoDoublonSurvEstaf(salles, estafettesParBatiment);
  const tousEleves=[...salles.flatMap(s=>s.eleves), ...elevesExclus];
  await exporterVersExcel(tousEleves, salles, elevesExclus, estafettesParBatiment);
}
function checkNoDoublonSurvEstaf(salles, estafettesParBatiment){
  const allSV = new Set((salles||[]).flatMap(s=>s.surveillants||[]).map(nameFromLabel).map(normName));
  const allEST = new Set(estafettesParBatiment.flatMap(b=>b.estafettes||[]).map(nameFromLabel).map(normName));
  const doublons = [...allSV].filter(n => allEST.has(n));
  if(doublons.length){
    alert("Erreur : Les agents suivants sont à la fois surveillants ET estafettes :\n" + doublons.join(", "));
  }
}


/******************************************************
 * 8) EXPORT EXCEL (identique à ta version)
 ******************************************************/
function sanitizeSheetName(name){ return String(name).replace(/[:\\/?*\[\]]/g,'').slice(0,31); }
function uniqueSheetName(wb, base){ let name=sanitizeSheetName(base); let i=2; while(wb.SheetNames.includes(name)){ name=sanitizeSheetName(`${base.slice(0,28)}_${i++}`); } return name; }

async function exporterVersExcel(tousEleves, salles, elevesExclus=[], estafettesParBatiment=[]){
  const wb=XLSX.utils.book_new();

  const repartitionParSalle = salles.map(s=>{
    const lib = s.numero==="Reste" ? "Salle Reste" : (s.description ? `Salle ${s.numero} (${s.description})` : `Salle ${s.numero}`);
    const nb = (typeof s.effectif==="number") ? s.effectif : (Array.isArray(s.eleves)?s.eleves.length:0);
    const bat = s.batiment ? ` [Bâtiment ${s.batiment}]` : "";
    return `${lib}${bat} : ${nb} élèves`;
  });

  const escadronsList=[...new Set(tousEleves.map(e=>e.escadron))].filter(x=>x!==undefined&&x!==null&&x!=="").sort((a,b)=>(Number(a)||0)-(Number(b)||0));
  const repartitionParEscadron = escadronsList.map(esc=>`Escadron ${esc} : ${tousEleves.filter(e=>e.escadron===esc).length} élèves`);

  const exclMap=new Map();
  if(Array.isArray(elevesExclus)&&elevesExclus.length){
    elevesExclus.forEach(e=>{
      const inc=(e.numeroIncorporation??'').toString().trim()||"(?)";
      const motif=(e.salle??'Exclu').toString().trim();
      const key=`${inc} — ${motif}`; exclMap.set(key,(exclMap.get(key)||0)+1);
    });
  }
  const exclusionsLignes=[...exclMap.entries()].map(([k,n])=> n>1?`${k} (${n})`:k);

  const resumeData=[
    {Clé:"Total élèves", Valeur:tousEleves.length},
    {Clé:"Nombre de salles", Valeur:salles.length},
    {Clé:"Répartition par salle", Valeur:""},
    ...repartitionParSalle.map(line=>({Clé:"", Valeur:line})),
    {Clé:"", Valeur:""},
    {Clé:"Surveillants (2 / salle)", Valeur:""},
    ...salles.map(s=>({Clé:"", Valeur:`${s.numero==="Reste"?"Salle Reste":`Salle ${s.numero}`} : ${(s.surveillants||[]).join(", ")||"—"}`})),
    {Clé:"", Valeur:""},
    {Clé:"Estafettes par bâtiment", Valeur:""},
    ...estafettesParBatiment.map(b=>({Clé:"", Valeur:`${b.batiment} : ${b.estafettes.join(", ")||"—"} (${b.nbSalles} salle(s))`})),
    {Clé:"", Valeur:""},
    {Clé:"Répartition par escadron", Valeur:""},
    ...repartitionParEscadron.map(line=>({Clé:"", Valeur:line})),
    ...(exclusionsLignes.length?[{Clé:"",Valeur:""},{Clé:"Exclusions (incorporation : motif)",Valeur:""}, ...exclusionsLignes.map(line=>({Clé:"",Valeur:line}))]:[])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumeData), "Résumé");

  // Feuilles par salle
  salles.forEach(salle=>{
    const header=["NR","Nom","Prénom","Escadron","Peloton","Incorporation","Salle (num)","Bâtiment"];
    const titre=(salle.numero==="Reste"?"SALLE RESTE":`SALLE ${salle.numero}`).toUpperCase();
    const aoa=[]; const merges=[];
    aoa.push([titre]); merges.push({s:{r:0,c:0}, e:{r:0,c:header.length-1}});
    if(salle.description && salle.numero!=="Reste"){ aoa.push([String(salle.description).toUpperCase()]); merges.push({s:{r:1,c:0}, e:{r:1,c:header.length-1}}); }
    else aoa.push([]);
    // Nouvelle version — formaté comme dans ton exemple
    if (salle.surveillants && salle.surveillants.length) {
      salle.surveillants.forEach(label => {
        let grade = "", nom = "", phone = "", info = "";
        const parts = label.split("—").map(s => s.trim());
        if (parts.length > 1) { grade = parts[0]; nom = parts.slice(1).join(" — "); }
        else { nom = parts[0]; }
        // => Récupérer phone/info ici si tu veux
        aoa.push([grade, nom, phone, info]);
      });
    } else {
      aoa.push(["—", "Aucun surveillant"]);
    }
    aoa.push([]); // ligne vide avant header élève

    aoa.push(header);
    const sorted=(salle.eleves||[]).slice().sort((a,b)=>(Number(a.numeroIncorporation)||0)-(Number(b.numeroIncorporation)||0));
    sorted.forEach((e,idx)=>{ aoa.push([idx+1, e.nom||"", e.prenom||"", e.escadron??"", e.peloton??"", e.numeroIncorporation??"", (salle.numero==="Reste"?"Reste":salle.numero), salle.batiment||""]); });
    const ws=XLSX.utils.aoa_to_sheet(aoa); ws['!merges']=merges;
    ws['!cols']=[{wpx:40},{wpx:200},{wpx:180},{wpx:80},{wpx:80},{wpx:120},{wpx:110},{wpx:90}];
    const baseName=(salle.numero==="Reste")?"Salle Reste":(salle.description?`Salle ${salle.numero} - ${salle.description}`:`Salle ${salle.numero}`);
    XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName(wb, baseName));
  });

  // Feuilles par escadron
  const escs=[...new Set(tousEleves.map(e=>e.escadron))].filter(x=>x!==undefined&&x!==null&&x!=="").sort((a,b)=>(Number(a)||0)-(Number(b)||0));
  escs.forEach((esc,i)=>{
    const sorted=tousEleves.filter(e=>e.escadron===esc).sort((a,b)=>{
      const pa=Number(a.peloton)||0, pb=Number(b.peloton)||0; if(pa!==pb) return pa-pb;
      const ia=Number(a.numeroIncorporation)||0, ib=Number(b.numeroIncorporation)||0; return ia-ib;
    });
    const aoa=[]; const merges=[]; const header=["NR","Nom","Prénom","Escadron","Peloton","Incorporation","Salle (num)","Bâtiment"];
    const titre=`${esc}° ESCADRON`.toUpperCase(); aoa.push([titre]); merges.push({s:{r:0,c:0},e:{r:0,c:header.length-1}});
    aoa.push([]);
    aoa.push(header);
    let currentPeloton=null, nr=0;
    sorted.forEach(e=>{
      if(e.peloton!==currentPeloton){ currentPeloton=e.peloton; aoa.push([`=== Peloton ${currentPeloton} ===`]); merges.push({s:{r:aoa.length-1,c:0},e:{r:aoa.length-1,c:header.length-1}}); }
      nr+=1; aoa.push([nr, e.nom||"", e.prenom||"", e.escadron??"", e.peloton??"", e.numeroIncorporation??"", e.salle||"Non assigné", e.batiment||""]);
    });
    const ws=XLSX.utils.aoa_to_sheet(aoa); ws['!merges']=merges;
    ws['!cols']=[{wpx:40},{wpx:200},{wpx:180},{wpx:80},{wpx:80},{wpx:120},{wpx:110},{wpx:90}];
    XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName(wb, `${i+1}e Escadron`));
  });

  // Exclus
  if(Array.isArray(elevesExclus)&&elevesExclus.length){
    const data=elevesExclus.map((e,idx)=>({NR:idx+1, Nom:e.nom, "Prénom":e.prenom, Escadron:e.escadron, Peloton:e.peloton, Incorporation:e.numeroIncorporation, Motif:e.salle}));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Exclus");
  }

  // Estafettes
  // Estafettes + À reprendre (réserves)
{
  const aoa = [["NR","Bâtiment","Nb salles","Estafettes"]];
  if (Array.isArray(estafettesParBatiment) && estafettesParBatiment.length) {
    estafettesParBatiment.forEach((b, idx) => {
      aoa.push([idx+1, b.batiment, b.nbSalles, (b.estafettes||[]).join(", ")]);
    });
  } else {
    aoa.push(["—","—","—","—"]);
  }

  // Bloc "À reprendre" (depuis le modal)
  const reprise = loadReprise(); // [{nom, nombre}]
  aoa.push([]);
  aoa.push(["À reprendre"]);
  aoa.push(["Nom","Nombre"]);
  (reprise||[]).forEach(r => {
    if ((r.nom||"").trim() || Number(r.nombre)>0) {
      aoa.push([r.nom||"", Number(r.nombre)||0]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Largeurs de colonnes
  ws['!cols'] = [{wpx:50},{wpx:120},{wpx:90},{wpx:380}];
  XLSX.utils.book_append_sheet(wb, ws, "Estafettes");
}


  const wbout=XLSX.write(wb,{bookType:"xlsx",type:"array"});
  saveAs(new Blob([wbout],{type:"application/octet-stream"}), "repartition_salles.xlsx");
}

/******************************************************
 * 9) FAÇADES
 ******************************************************/
async function ouvrirEditeurRepartition(eleves){
  await editerStaff();
  const excl=await exclureIncorporations();
  await ajouterSallesViaModal(eleves, excl);
}

async function validerRepartitionRapide(eleves){
  const rooms=loadRooms(), excl=loadExclusions();
  if(!rooms.length){
    await Swal.fire("Aucune configuration enregistrée","Veuillez définir les capacités une première fois.","info");
    return ajouterSallesViaModal(eleves, excl);
  }
  const totalCap=rooms.reduce((s,r)=>s+(r.capacite||0),0);
  const html=`<div style="text-align:left">
    <p><b>Dernière configuration mémorisée</b></p>
    <ul style="max-height:220px;overflow:auto;padding-left:18px;margin:0">
      ${rooms.map(r=>{
        const d=r.description?` (${r.description})`:''; const b=r.batiment?` [Bâtiment ${r.batiment}]`:'';
        const sv=Array.isArray(r.surveillants)&&r.surveillants.length?` — SV: ${r.surveillants.join(", ")}`:'';
        return `<li>Salle ${r.numero}${d}${b} → ${r.capacite} élèves${sv}</li>`;
      }).join('')}
    </ul>
    <p style="margin-top:8px">Capacité totale : <b>${totalCap}</b> • Élèves dispo : <b>${eleves.length}</b></p>
  </div>`;
  const res=await Swal.fire({ title:"Valider la répartition", html, icon:"question", showDenyButton:true, confirmButtonText:"Valider", denyButtonText:"Modifier" });
  if(res.isConfirmed) return genererRepartitionDepuisCartes(eleves, rooms, excl);
  if(res.isDenied) return ajouterSallesViaModal(eleves, excl);
}
async function validerRepartition(eleves){ await validerRepartitionRapide(eleves); }

// Fonction PDF (à appeler en fin de genererRepartitionEtExporter)
function exporterRepartitionEnPDF(salles, escadronGlobalMap) {
  const doc = new jsPDF();

  // ✅ Répartition par salle
  salles.forEach((salle, index) => {
    if (index !== 0) doc.addPage();

    doc.setFontSize(16);
    doc.text("Répartition des élèves par salle", 14, 20);

    doc.setFontSize(14);
    doc.text(`Salle ${salle.numero} - ${salle.effectif} élèves`, 14, 10);

    const tableData = salle.eleves.map((eleve) => [
      eleve.nom,
      eleve.prenom,
      eleve.numeroIncorporation,
      eleve.escadron,
      eleve.peloton,
      eleve.salle,
    ]);

    autoTable(doc, {
      startY: 15,
      head: [["Nom", "Prénom", "Inc", "Escadron", "Peloton", "Salle"]],
      body: tableData,
      theme: "plain",
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
      pageBreak: 'avoid', // 👉 On évite les sauts de page automatiques
    });
  });

  // ✅ Répartition par escadron : Peloton = 1 page
  const escadronsTries = Object.keys(escadronGlobalMap)
    .map(Number)
    .sort((a, b) => a - b);

  escadronsTries.forEach((escadronNum) => {
    const liste = escadronGlobalMap[escadronNum];

    // Tri par peloton + incorporation
    liste.sort((a, b) => {
      if (a.peloton !== b.peloton) {
        return a.peloton - b.peloton;
      }
      return a.numeroIncorporation - b.numeroIncorporation;
    });

    // Grouper par peloton
    const pelotons = {};
    liste.forEach((eleve) => {
      if (!pelotons[eleve.peloton]) {
        pelotons[eleve.peloton] = [];
      }
      pelotons[eleve.peloton].push(eleve);
    });

    Object.keys(pelotons)
      .sort((a, b) => a - b)
      .forEach((pelotonNum) => {
        doc.addPage();

        doc.setFontSize(16);
        doc.text("Répartition par escadron", 14, 20);

        doc.setFontSize(14);
        doc.text(`Escadron ${escadronNum} - ${liste.length} élèves`, 14, 30);

        doc.setFontSize(12);
        doc.text(
          `${pelotonNum === "1" ? "1er" : pelotonNum + "ème"} Peloton`,
          14,
          40
        );

        const pelotonListe = pelotons[pelotonNum];

        const tableData = pelotonListe.map((eleve) => [
          eleve.nom,
          eleve.prenom,
          eleve.numeroIncorporation,
          eleve.escadron,
          eleve.peloton,
          eleve.salle,
        ]);

        autoTable(doc, {
          startY: 50,
          head: [["Nom", "Prénom", "Inc", "Escadron", "Peloton", "Salle"]],
          body: tableData,
          theme: "plain",
          headStyles: { fillColor: [39, 174, 96] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 9 }, // 👉 Réduire un peu la police si bcp d'élèves
          pageBreak: 'avoid', // 👉 Bloquer saut de page automatique
        });
      });
  });

  doc.save("repartition_eleves.pdf");
}

  //verifier 
  useEffect(() => {
    if (noteModalOpen && selectedEleve) {
     
       NoteService.getbyEleveId(selectedEleve.id)
       
        .then((res) => {
          if (res.data) {
            setNotes({
              finfetta: res.data.finfetta || '',
              mistage: res.data.mistage || '',
              finstage: res.data.finstage || '',
              rangfinfetta:res.data.rangfinfetta || '',
              rangmistage:res.data.rangmistage || '',
              rangfinstage:res.data.rangfinstage || '',
              
            });
            setNoteId(res.data.id); // pour savoir si c’est un update ou un create
          } else {
            setNotes({ finfetta: '', mistage: '', finstage: '' ,   rangfinfetta:'',rangmistage:'',rangfinstage:'',});
            setNoteId(null);
          }
        })
        .catch(() => {
          setNotes({ finfetta: '', mistage: '', finstage: '' ,   rangfinfetta:'',rangmistage:'',rangfinstage:'',});
          setNoteId(null);
        });
    }
  }, [noteModalOpen, selectedEleve]);
  
  //valide note 
  const handleSaveNotes = async () => {
    const noteData = {
      finfetta: notes.finfetta,
      mistage: notes.mistage,
      finstage: notes.finstage,
      //rang
      rangfinfetta:notes.rangfinfetta,
      rangmistage:notes.rangmistage,
      rangfinstage:notes.rangfinstage,
      eleveId: selectedEleve.id
    };
    //console.log("note id veeeee",noteId);
  
    try {
      if (noteId) {
        await NoteService.update(noteId, noteData);
      } else {
        await NoteService.post(noteData);
      }
      alert("Note enregistrée avec succès !");
      handleCloseNoteModal();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement :", err);
      alert("Échec de l'enregistrement.");
    }
  };
  
  
  

  //cour 
  const [coursList, setCoursList] = useState([]);
  useEffect(() => {
    const fetchCours = async () => {
      try {
        const res = await courService.getAll();
        const coursData = res.data;
  
        // Trier par valeur décroissante
        coursData.sort((a, b) => b.cour - a.cour);
  
        setCoursList(coursData);
  
        // Définir par défaut le plus grand
        if (coursData.length > 0) {
          setFilter(prev => ({
            ...prev,
            cour: coursData[0].cour.toString(), // Important si select attend une string
          }));
        }
      } catch (err) {
        console.error("Erreur lors du chargement des cours", err);
      }
    };
  
    fetchCours();
  }, []);
  
  //fonction delete
  const handleDelete = (id) => {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        
        EleveService.delete(id)
          .then(() => {
            setEleves(prev => prev.filter(e => e.id !== id));
            Swal.fire('Supprimé !', 'L\'élève a été supprimé.', 'success');
          })
          .catch(error => {
            console.error("Erreur lors de la suppression :", error);
            Swal.fire('Erreur', 'Impossible de supprimer cet élève.', 'error');
          });
      }
    });
  };

  useEffect(() => {
    fetchAllData();
  }, [refreshKey]); // ✅ ça relance le fetch quand refreshKey change
  
  
// maka donne rehetra
const fetchAllData = async () => {
  if (isFirstLoad.current) setIsLoading(true);
  let allEleves = [];
  let currentOffset = 0;
  const limit = 500;

  try {
    while (true) {
      const response = await EleveService.getPaginated(limit, currentOffset);
      const data = response.data;

      if (!Array.isArray(data) || data.length === 0) break;

      allEleves = [...allEleves, ...data];
      currentOffset += limit;

      if (data.length < limit) break;
    }

    setEleves(allEleves);
  } catch (error) {
    console.error("Erreur de chargement :", error);
  } finally {
    if (isFirstLoad.current) {
      setIsLoading(false);
      isFirstLoad.current = false;
    }
  }
};

  const handleOpenModal = (eleve) => {
    setEleveActif(eleve);
    setShowModal(true);
  };
  

  const handleCloseModal = () => {
    setShowModal(false);
    setEleveActif(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEleveActif(prev => ({
      ...prev,
      [name]: value
    }));
  };
  //pour le filtre 
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (EleveService.update) {
        await EleveService.update(eleveActif); // Assure-toi que cette méthode est bien dans ton service
      }
      setShowModal(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
    }
  };

  
 
  // Application du filtre
  const elevesAAfficher = eleves.filter(eleve => {
    const escadronMatch = filter.escadron === '' || eleve.escadron === Number(filter.escadron);
    const pelotonMatch = filter.peloton === '' || eleve.peloton === Number(filter.peloton);
    const courMatch = filter.cour === '' || eleve.cour === Number(filter.cour); // <- Ajout ici
    const matchSearch = !filter.search || (
      eleve.nom?.toLowerCase().includes(filter.search.toLowerCase()) ||
      eleve.prenom?.toLowerCase().includes(filter.search.toLowerCase()) ||
      eleve.numeroIncorporation?.toString().includes(filter.search)
    );
  
    // Si peloton sélectionné sans escadron mais une recherche est présente → OK
    if (filter.peloton !== '' && filter.escadron === '' && filter.search) {
      return true;
    }
  
    return escadronMatch && pelotonMatch && courMatch && matchSearch; // <- Ajout ici
  });
  
  const columns = [
    { name: 'Nom', selector: row => row.nom, sortable: true },
    { name: 'Prénom', selector: row => row.prenom, sortable: true ,},
    { name: 'Esc', selector: row => row.escadron, sortable: true ,width:"90px"},
    { name: 'Pon', selector: row => row.peloton ,width:"90px"},
    { name: 'Matricule', selector: row => row.matricule ,sortable: true},
    { name: 'Incorporation', selector: row => Number(row.numeroIncorporation) ,sortable: true,sortFunction: (a, b) => Number(a.numeroIncorporation) - Number(b.numeroIncorporation)},
   
    {
      name: 'Actions',
      cell: row => (
        <>
          <button
            className="btn btn-warning btn-sm me-2"
            onClick={() => handleOpenModal(row)}
          >
            View
          </button>
           {(user?.type === 'superadmin' || user?.type === 'admin' || user?.type === 'user' )&&(
             <>
    
         
                  <button
                className="btn btn-info btn-sm me-2"
                onClick={() => handleOpenNoteModal(row)}
              >
                Note
              </button>

              </>
          )}
              {user?.type === 'superadmin' && (
             <>
    
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(row.id)}
              >
                Delete
              </button>
            </>
          )}
        </>
      )
    }
    
  ];
  
//export en excel 
const handleExportExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Elèves par escadron');

    // Titre principal fusionné
    const title = 'Liste des élèves gendarme';
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.font = { size: 16, bold: true };
    worksheet.getRow(1).height = 30;

    // Définir les colonnes (sera réutilisé pour chaque section)
    const columns = [
      { header: 'Nom', key: 'nom', width: 20 },
      { header: 'Prénom', key: 'prenom', width: 20 },
      { header: 'Numéro Incorporation', key: 'numeroIncorporation', width: 25 },
      { header: 'Matricule', key: 'matricule', width: 25 },
      { header: 'Escadron', key: 'escadron', width: 15 },
      { header: 'Peloton', key: 'peloton', width: 15 },
 
      { header: 'NUMERO 1', key: 'numero', width: 15 },
      { header: 'NUMERO 2', key: 'numero', width: 15 },
      { header: 'NUMERO 3', key: 'numero', width: 15 },




      { header: 'Note FETTA', key: 'finfetta', width: 15 },
      { header: 'Rang FETTA', key: 'rangFinfetta', width: 15 },
      { header: 'Note Mi-Stage', key: 'mistage', width: 15 },
      { header: 'Rang Mi-Stage', key: 'rangMistage', width: 15 },
      { header: 'Note Fin Formation', key: 'finstage', width: 18 },
      { header: 'Rang Fin Formation', key: 'rangFinstage', width: 18 },
    ];
    worksheet.columns = columns;
    

    // Ligne de départ après le titre
    let currentRow = 3;

    // Récupérer la liste des escadrons uniques, triés par ordre croissant
    const escadronsUniques = [...new Set(elevesAAfficher.map(e => e.escadron))].sort((a, b) => a - b);

    for (const escadron of escadronsUniques) {
      // Sous-titre escadron
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const sousTitreCell = worksheet.getCell(`A${currentRow}`);
      sousTitreCell.value = `${escadron}ème escadron`;
      sousTitreCell.font = { size: 14, bold: true, color: { argb: 'FF1F497D' } };
      sousTitreCell.alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 20;
      currentRow++;

      // En-tête colonnes pour cet escadron
      worksheet.getRow(currentRow).values = columns.map(col => col.header);
      worksheet.getRow(currentRow).font = { bold: true };
      worksheet.getRow(currentRow).alignment = { horizontal: 'center' };
      worksheet.getRow(currentRow).border = {
        bottom: { style: 'thin' }
      };
      currentRow++;

      // Filtrer élèves de cet escadron
      const elevesEscadron = elevesAAfficher.filter(e => e.escadron === escadron);
//console.log(elevesEscadron);
      // Ajouter chaque élève dans une ligne
      elevesEscadron.forEach(eleve => {
        worksheet.getRow(currentRow).values = [
          eleve.nom || '',
          eleve.prenom || '',
          eleve.numeroIncorporation || '',
          eleve.matricule || '',
          eleve.escadron || '',
          eleve.peloton || '',

          eleve.telephone1 || '',
          eleve.telephone2 || '',
          eleve.telephone3 || '',


          eleve.Note?.finfetta || '',
          eleve.Note?.rangfinfetta || '',
          eleve.Note?.mistage || '',
          eleve.Note?.rangmistage || '',
          eleve.Note?.finstage || '',
          eleve.Note?.rangfinstage || '',
        ];
         // Centrer chaque cellule de cette ligne
         worksheet.getRow(currentRow).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          });
        currentRow++;
      });
      

      // Ligne vide entre escadrons
      currentRow++;
    }

    // Sauvegarder le fichier Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Eleves_par_Escadron_${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (error) {
    console.error("Erreur lors de l'exportation Excel :", error);
    alert("Erreur lors de l'exportation Excel");
  }
};


function handleExportExcel2() {
  // Créer un nouveau classeur
  const workbook = XLSX.utils.book_new();

  // 1️⃣ Feuille principale : toutes les notes filtrées
  const allData = filteredNotes.map(row => ({
    Nom: row.Eleve?.nom || '',
    Prénom: row.Eleve?.prenom || '',
    Incorporation: row.Eleve?.numeroIncorporation || '',
    Escadron: row.Eleve?.escadron || '',
    Peloton: row.Eleve?.peloton || '',
    Niveau: row.niveau || '',
    Note: row.note != null ? row.note : ''
  }));
  const wsAll = XLSX.utils.json_to_sheet(allData);
  XLSX.utils.book_append_sheet(workbook, wsAll, 'Toutes Notes');

  // 2️⃣ Feuille Débutants
  const debutants = filteredNotes.filter(r => r.niveau?.toUpperCase().startsWith('D')).map(row => ({
    Nom: row.Eleve?.nom || '',
    Prénom: row.Eleve?.prenom || '',
    Incorporation: row.Eleve?.numeroIncorporation || '',
    Niveau: row.niveau || '',
    Note: row.note != null ? row.note : ''
  }));
  const wsDebutants = XLSX.utils.json_to_sheet(debutants);
  XLSX.utils.book_append_sheet(workbook, wsDebutants, 'Débutants');

  // 3️⃣ Feuille Intermédiaires
  const intermediaires = filteredNotes.filter(r => r.niveau?.toUpperCase().startsWith('I')).map(row => ({
    Nom: row.Eleve?.nom || '',
    Prénom: row.Eleve?.prenom || '',
    Incorporation: row.Eleve?.numeroIncorporation || '',
    Niveau: row.niveau || '',
    Note: row.note != null ? row.note : ''
  }));
  const wsInter = XLSX.utils.json_to_sheet(intermediaires);
  XLSX.utils.book_append_sheet(workbook, wsInter, 'Intermédiaires');

  // 4️⃣ Feuille Avancés
  const avances = filteredNotes.filter(r => r.niveau?.toUpperCase().startsWith('A')).map(row => ({
    Nom: row.Eleve?.nom || '',
    Prénom: row.Eleve?.prenom || '',
    Incorporation: row.Eleve?.numeroIncorporation || '',
    Niveau: row.niveau || '',
    Note: row.note != null ? row.note : ''
  }));
  const wsAvances = XLSX.utils.json_to_sheet(avances);
  XLSX.utils.book_append_sheet(workbook, wsAvances, 'Avancés');

  // 💾 Générer et télécharger
  XLSX.writeFile(workbook, 'notes_francais_complet.xlsx');
}


  return (
    <div className="container mt-5" >
     
     <h1 className="text-center fw-bold mb-4">
  <i className="fa fa-users me-2 text-primary"></i>
  Liste des Élèves Gendarmes
</h1>

      <div className="row justify-content-center mb-5">
        <div className="col-md-10 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="row g-3">
                {/* Cours */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Cours</label>
                  <select
                    className="form-select"
                    name="cour"
                    value={filter.cour}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous les cours</option>
                    {coursList.map((c) => (
                      <option key={c.id} value={c.cour}>
                        {c.cour}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recherche par nom, prénom ou incorporation */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Recherche</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nom, prénom ou incorporation"
                    name="search"
                    value={filter.search}
                    onChange={handleFilterChange}
                  />
                </div>

                {/* Escadron */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Escadron</label>
                  <select
                    className="form-select"
                    name="escadron"
                    value={filter.escadron}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous les escadrons</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>

                {/* Peloton */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Peloton</label>
                  <select
                    className="form-select"
                    name="peloton"
                    value={filter.peloton}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous les pelotons</option>
                    {[1, 2, 3].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Bouton Réinitialiser */}
                <div className="col-12 mt-3">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setFilter({ escadron: '', peloton: '', search: '', cour: '' })}
                  >
                    <i className="fa fa-refresh me-2"></i> Réinitialiser les filtres
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

                
               
      <div className="card shadow-sm border-0 mb-4">
  <div className="card-body">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h5 className="fw-bold text-primary m-0">
        👥 Liste des élèves Gendarme
      </h5>

      {user.type !== 'saisie' && (
  <div className="d-flex gap-2">
 <button className="btn btn-secondary" onClick={() => validerRepartitionRapide(eleves)}>
  Valider la répartition
</button>

<button className="btn btn-warning" onClick={async () => {
  const excl = await exclureIncorporations(); // se sauvegarde déjà
  await ajouterSallesViaModal(eleves, excl);
}}>
  Modifier / (Re)définir les capacités
</button>









    <button
      className="btn btn-warning"
      onClick={() => setShowNoteModal(true)}
    >
      <i className="fa fa-book me-2"></i>
      Note Français
    </button>

    <button
      className="btn btn-success"
      onClick={handleExportExcel}
    >
      <i className="fa fa-file-excel me-2"></i>
      Exporter (.xlsx)
    </button>
  </div>
)}

    </div>

    <div>

              {isLoading ? (
                <div className="text-center my-4">
                  <ProgressBar now={60} label="Chargement..." animated striped />
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={elevesAAfficher}
                  pagination
                  paginationPerPage={50}
                  paginationRowsPerPageOptions={[50, 100]}
                  highlightOnHover
                  striped
                  noDataComponent="Aucun élève à afficher"
                  customStyles={customStyles}
                />
              )}
                  </div>
                  {noteModalOpen && selectedEleve && (
  <div
    className="modal-overla"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <div
      className="modal-content"
      style={{
        maxWidth: '600px',
        width: '90%',
        background: 'white',
        borderRadius: '10px',
        padding: '20px',
        position: 'relative',
        zIndex: 10000,
        color: 'black',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
     <button
  style={{ position: 'absolute', top: 10, right: 10, fontSize: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
  onClick={handleCloseNoteModal}
>
  ×
</button>


      <h5 className="text-center mb-3">Notes – {selectedEleve.nom} {selectedEleve.prenom}</h5>

      <div className="row">
        {/* Fin FETTA */}
        <div className="col-md-6 mb-3">
          <label>Fin FETTA</label>
          <input
            type="text"
            className="form-control"
            value={notes.finfetta || ''}
            onChange={(e) => setNotes({ ...notes, finfetta: e.target.value })}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label>Rang Fin FETTA</label>
          <input
            type="text"
            className="form-control"
            value={notes.rangfinfetta || ''}
            onChange={(e) => setNotes({ ...notes, rangfinfetta: e.target.value })}
          />
        </div>

        {/* Mi-Stage */}
        <div className="col-md-6 mb-3">
          <label>Mi-Stage</label>
          <input
            type="text"
            className="form-control"
            value={notes.mistage || ''}
            onChange={(e) => setNotes({ ...notes, mistage: e.target.value })}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label>Rang Mi-Stage</label>
          <input
            type="text"
            className="form-control"
            value={notes.rangmistage || ''}
            onChange={(e) => setNotes({ ...notes, rangmistage: e.target.value })}
          />
        </div>

        {/* Fin Formation */}
        <div className="col-md-6 mb-3">
          <label>Fin Formation</label>
          <input
            type="text"
            className="form-control"
            value={notes.finstage || ''}
            onChange={(e) => setNotes({ ...notes, finstage: e.target.value })}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label>Rang Fin Formation</label>
          <input
            type="text"
            className="form-control"
            value={notes.rangfinstage || ''}
            onChange={(e) => setNotes({ ...notes, rangfinstage: e.target.value })}
          />
        </div>
      </div>

      {/* Bouton Enregistrer */}
      {(user?.type !== 'saisie' && user?.type !== 'user') && (
        <div className="text-center mt-3">
          <button
            className="btn btn-success w-100 rounded-pill"
            onClick={handleSaveNotes}
          >
            Enregistrer
          </button>
        </div>
      )}
    </div>
  </div>
)}

{showNoteModal && (
  <div style={modalStyles.overlay} onClick={closeModal}>
    <div
      style={modalStyles.modal}
      onClick={e => e.stopPropagation()} // éviter fermeture en click sur modal
    >
      <div style={modalStyles.header}>
        <h5>Liste des Notes Français</h5>
        <button style={modalStyles.closeBtn} onClick={closeModal}>&times;</button>
      </div>

      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher par nom, prénom ou incorporation..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '10px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          boxSizing: 'border-box'
        }}
      />

      {/* Cards filtres niveau */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '15px' }}>
        {["D", "I", "A"].map(cat => (
          <div
            key={cat}
            onClick={() => setNiveauFilter(niveauFilter === cat ? "" : cat)} // toggle filtre
            style={{
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: niveauFilter === cat ? "#0d6efd" : "#ccc",
              backgroundColor: niveauFilter === cat ? "#cfe2ff" : "#f8f9fa",
              fontWeight: "bold",
              userSelect: "none",
              minWidth: 100,
              textAlign: "center",
              transition: "all 0.3s",
             
            }}
            title={
              cat === "D" ? "Débutant" :
              cat === "I" ? "Intermédiaire" :
              "Avancé"
            }
          >
            {cat === "D" ? "Débutant" : cat === "I" ? "Intermédiaire" : "Avancé"}
          </div>
        ))}
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <DataTable
          columns={columns2}
          data={filteredNotes} // filteredNotes = notes filtrées selon recherche + niveauFilter
          pagination
          highlightOnHover
          striped
          dense
          noHeader
        />
      )}
      {/* Bouton Exporter */}
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
      <button
        className="btn btn-success"
        onClick={handleExportExcel2}
      >
        <i className="fa fa-file-excel me-2"></i>
        Exporter (.xlsx)
      </button>
    </div>

    </div>
    
  </div>
  
)}




            <div className="text-end mt-3">
              <span className="fw-semibold">
                Total : <span className="text-primary">{elevesAAfficher.length}</span> élèves gendarmes
              </span>
            </div>
          </div>
        </div>

                            {eleveActif && (
                              <ModalModificationEleve
                                show={showModal}
                                onClose={handleCloseModal}
                                eleve={eleveActif}
                                onChange={handleChange}
                                onSave={handleSave}
                                onUpdateSuccess={handleUpdateSuccess}

                              />
                            )}
                            
                          </div>
                            );
                          };
                                          const customStyles = {
                                            headCells: {
                                              style: {
                                                fontSize: '17px', // Taille du texte des en-têtes
                                                fontWeight: 'bold',
                                              },
                                            },
                                            cells: {
                                              style: {
                                                fontSize: '17px', // Taille du texte des cellules
                                              },
                                            },
                                          };



export default ListeElevePge;
