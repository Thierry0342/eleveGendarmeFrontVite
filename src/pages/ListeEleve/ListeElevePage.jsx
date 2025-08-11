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
// Remplace entièrement saveReprise / loadReprise par ceci :

function saveReprise(data) {
  try {
    // Accepte l’objet {adjoints:[], seniors:[]} ou l’ancien tableau
    const payload = (data && typeof data === 'object')
      ? data
      : (Array.isArray(data) ? data : { adjoints: [], seniors: [] });
    localStorage.setItem(STORAGE_KEYS.reprise, JSON.stringify(payload));
  } catch {}
}

function loadReprise() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.reprise);
    if (!raw) return { adjoints: [], seniors: [] };     // par défaut: objet vide
    const parsed = JSON.parse(raw);

    // Migration douce : on supporte l’ancien tableau
    if (Array.isArray(parsed)) return parsed;            // ancien format (fallback export simple)
    if (parsed && typeof parsed === 'object') {
      // normalise les champs
      return {
        adjoints: Array.isArray(parsed.adjoints) ? parsed.adjoints : [],
        seniors : Array.isArray(parsed.seniors)  ? parsed.seniors  : []
      };
    }
    return { adjoints: [], seniors: [] };
  } catch {
    return { adjoints: [], seniors: [] };
  }
}

  function saveStaff(staff) {
    try {
        localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify({
            surveillants: Array.isArray(staff?.surveillants) ? staff.surveillants : [],
            estafettes: Array.isArray(staff?.estafettes) ? staff.estafettes : []
        }));
    } catch (e) {
        console.error("Erreur lors de la sauvegarde du personnel:", e);
    }
  }
  function loadStaff() {
    try {
        const o = JSON.parse(localStorage.getItem(STORAGE_KEYS.staff) || '{}');
        return {
            surveillants: Array.isArray(o.surveillants) ? o.surveillants : [],
            estafettes: Array.isArray(o.estafettes) ? o.estafettes : []
        };
    } catch (e) {
        console.error("Erreur lors du chargement du personnel:", e);
        return { surveillants: [], estafettes: [] };
    }
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
  // --- Surveillants toujours prioritaires (jamais estafette)
  const ALWAYS_SURVEILLANTS = [
    { name: "RASOLOFOHERY Jean Jacquis", mle: "22462" }
  ];
  function isAlwaysSurveillant(person) {
    if (!person) return false;
    const nn  = normName(person.name || "");
    const mle = String(person.mle || "").trim();
    for (const a of ALWAYS_SURVEILLANTS) {
      if (nn && normName(a.name) === nn) return true;
      if (a.mle && mle && a.mle === mle)   return true;
    }
    return false;
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
  function shuffleInPlace(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j]]; } return arr; }
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
  function buildSurvPools(lines) {
    let peeps;
    if (lines.length > 0 && typeof lines[0] === 'object' && lines[0].grade) {
        peeps = lines.map(p => ({
            grade: p.grade,
            name: p.name,
            label: p.label || `${p.grade} — ${p.name}`,
            mle: p.mle || "",
            nrTph: p.nrTph || "",
            unite: p.unite || ""
        }));
    } else {
        peeps = (lines || []).map(parseSurveillantLine).filter(Boolean);
    }
    const display = peeps.slice().sort((a, b) => {
        const r = gradeRank(a.grade) - gradeRank(b.grade);
        return r !== 0 ? r : a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });
    const ALL = peeps.slice();
    const A = ALL.filter(p => GROUP_A.has(p.grade));
    const B = ALL.filter(p => GROUP_B.has(p.grade));
    const shuffled = shuffleInPlace(ALL.slice());
    let i = 0;
    const rr = () => (shuffled.length ? shuffled[(i++) % shuffled.length] : null);
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
  function buildStaffFromPeople(people) {
    const seen = new Set();
    const uniq = people.filter(p => !seen.has(p.label) && seen.add(p.label));
    const surveillants = uniq.map(p => ({
        label: p.label,
        grade: p.grade,
        name: p.name,
        mle: p.mle || "",
        nrTph: p.nrTph || "",
        unite: p.unite || ""
    }));
    const estafettes = [
        ...uniq.filter(p => p.grade === "GST").map(p => ({
            label: p.label, grade: p.grade, name: p.name,
            mle: p.mle || "", nrTph: p.nrTph || "", unite: p.unite || ""
        })),
        ...uniq.filter(p => p.grade === "G2C").map(p => ({
            label: p.label, grade: p.grade, name: p.name,
            mle: p.mle || "", nrTph: p.nrTph || "", unite: p.unite || ""
        }))
    ];
    return { surveillants, estafettes, total: uniq.length };
  }
  function parsePersonnelLine(line) {
    const raw = _clean(String(line||""));
    const withoutNr = raw.replace(/^[\d\s.]+/, "");
    const cols = withoutNr.split(/\t| {2,}/).map(_clean).filter(Boolean);
    if (cols.length < 3) return null;
    let grade = null, gradeIdx = -1;
    for (let i=0;i<cols.length;i++){
      const g = detectGrade(cols[i]);
      if (g){ grade = g; gradeIdx = i; break; }
    }
    if (!grade) return null;
    const mle   = cols[cols.length-3] || "";
    const nrTph = cols[cols.length-2] || "";
    const unite = cols[cols.length-1] || "";
    const name = cols.slice(gradeIdx+1, cols.length-3).join(" ").trim();
    if (!name) return null;
    return { grade, name, mle, nrTph, unite, label: `${grade} — ${name}` };
  }
  function parsePersonnelFromPasted(text){
    const rows = String(text||'').split(/\r?\n/).map(cleanText).filter(Boolean);
    const people = [];
    const seemsHeader = r => /\bGRADE\b/i.test(r) && /\bNOM\b/i.test(r);
    for (let i=0;i<rows.length;i++){
      const r = rows[i];
      if (i===0 && seemsHeader(r)) continue;
      let p = parsePersonnelLine(r);
      if (!p) {
        const g = extractGradeAndNameFromRow(r) || pickGradeAndNameFromCell(r);
        if (g){
          const parts = r.split('\t').map(cleanText);
          p = { ...g, mle: parts[3]||"", nrTph: parts[4]||"", unite: parts[5]||"", label: `${g.grade} — ${g.name}` };
        }
      }
      if (p) people.push(p);
    }
    return buildStaffFromPeople(people);
  }
  function verifierDonneesPersonnel() {
    const staff = loadStaff();
    console.log("Données personnel sauvegardées:", staff);
    if (staff.surveillants && staff.surveillants.length > 0) {
        const sample = staff.surveillants[0];
        console.log("Exemple de surveillant:", sample);
        console.log("Champs MLE, NR TPH, UNITE:", { mle: sample.mle, nrTph: sample.nrTph, unite: sample.unite });
    }
    if (staff.estafettes && staff.estafettes.length > 0) {
        const sample = staff.estafettes[0];
        console.log("Exemple d'estafette:", sample);
        console.log("Champs MLE, NR TPH, UNITE:", { mle: sample.mle, nrTph: sample.nrTph, unite: sample.unite });
    }
  }
  function parsePersonnelFromObjects(rows){
    const looksLikeGrade = v => ALL_GRADES.has(String(v||"").replace(/\s+/g,"").toUpperCase());
    const looksLikePhone = v => typeof v==='string' && v.replace(/\D/g,'').length >= 8;
    const looksLikeMle   = v => /^\d{4,6}$/.test(String(v||"").trim());
    const looksLikeUnite = v => typeof v==='string' && /\b(ESC|SSL|SM|SAF|SRH|SED|MATR|PEDA|ARM|DI|CAB|COURS|DAG)\b/i.test(v);
    const people = [];
    for(const row of (rows||[])){
      let grade = null;
      for(const val of Object.values(row)){
        const t = String(val||"");
        const m = t.match(/\b(GPCE|GPHC|GHC|GP2C|GP1C|G2C|G1C|GST|CEN|CNE|LTN|MLTN|DLTN|LCL|MCDT)\b/i);
        if(m){ grade = m[1].toUpperCase(); break; }
      }
      const longest = Object.values(row)
        .map(v => String(v||"").trim())
        .filter(s => /\p{L}{2,}/u.test(s))
        .sort((a,b)=>b.length-a.length)[0] || "";
      const name = cleanText(longest);
      if(!grade || !name) continue;
      let mle="", nrTph="", unite="";
      for(const val of Object.values(row)){
        const cell = String(val||"").trim();
        if(!cell) continue;
        if(!mle   && looksLikeMle(cell))   { mle = cell; continue; }
        if(!nrTph && looksLikePhone(cell)) { nrTph = cell; continue; }
        if(!unite && looksLikeUnite(cell)) { unite = cell.toUpperCase(); continue; }
      }
      if(looksLikePhone(mle) && !nrTph){ nrTph = mle; mle = ""; }
      if(!looksLikePhone(nrTph) && looksLikeUnite(nrTph) && !unite){ unite = nrTph.toUpperCase(); nrTph = ""; }
      people.push({ grade, name, label:`${grade} — ${name}`, mle, nrTph, unite });
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
    function formatPerson(person) {
        if (!person) return "";
        const base = person.label || `${person.grade} — ${person.name}`;
        const extra = [];
        if (person.mle) extra.push(`MLE: ${person.mle}`);
        if (person.nrTph) extra.push(`TPH: ${person.nrTph}`);
        if (person.unite) extra.push(`UNITÉ: ${person.unite}`);
        return extra.length > 0 ? `${base} [${extra.join(', ')}]` : base;
    }
    const html=`
        <div style="display:grid;gap:12px">
            <div style="display:flex;flex-direction:column;gap:6px">
                <label style="font-weight:600">Surveillants (2 par salle)</label>
                <small style="color:#64748b">Règle : un parmi <b>GPCE/GPHC/GP1C/GP2C</b> + un parmi <b>GHC/G1C/G2C/GST</b>.</small>
                <textarea id="sv" rows="8" placeholder="Un agent par ligne (ex: GST DUPONT Paul ou DUPONT Paul -- GP2C)"
                    style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:8px 10px;outline:none;font-family:monospace;font-size:13px">
                    ${(prev.surveillants || []).map(formatPerson).join("\n")}
                </textarea>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
                <label style="font-weight:600">Estafettes / Agents de liaison (GST prioritaire, G2C si nécessaire)</label>
                <textarea id="es" rows="6" placeholder="Un agent par ligne (ex: GST RAKOTO …)"
                    style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:8px 10px;outline:none;font-family:monospace;font-size:13px">
                    ${(prev.estafettes || []).map(formatPerson).join("\n")}
                </textarea>
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
    const res=await Swal.fire({ title:"Personnel", html, width:800, focusConfirm:false, showCancelButton:true, confirmButtonText:"Enregistrer" });
    if(!res.isConfirmed) return loadStaff();
    function parsePersonLine(line) {
        const match = line.match(/^(.+?)\s*\[(.+)\]$/);
        if (match) {
            const label = match[1].trim();
            const infoStr = match[2];
            const info = {};
            infoStr.split(',').forEach(item => {
                const [key, value] = item.split(':').map(s => s.trim());
                if (key && value) {
                    if (key.toLowerCase() === 'mle') info.mle = value;
                    if (key.toLowerCase() === 'tph') info.nrTph = value;
                    if (key.toLowerCase() === 'unité' || key.toLowerCase() === 'unite') info.unite = value;
                }
            });
            const parsed = parseSurveillantLine(label);
            if (parsed) { return { ...parsed, ...info }; }
        }
        return parseSurveillantLine(line);
    }
    const svText=(document.getElementById('sv').value||'').split('\n').map(s=>s.trim()).filter(Boolean);
    const esText=(document.getElementById('es').value||'').split('\n').map(s=>s.trim()).filter(Boolean);
    const sv = svText.map(parsePersonLine).filter(Boolean);
    const es = esText.map(parsePersonLine).filter(Boolean);
    const minEst=Math.max(2, parseInt(document.getElementById('minEstaf').value,10)||2);
    const thr=Math.max(3, parseInt(document.getElementById('thrRooms').value,10)||4);
    const svObjects = sv.map(p => ({ label: p.label, grade: p.grade, name: p.name, mle: p.mle || "", nrTph: p.nrTph || "", unite: p.unite || "" }));
    const esObjects = es.map(p => ({ label: p.label, grade: p.grade, name: p.name, mle: p.mle || "", nrTph: p.nrTph || "", unite: p.unite || "" }));
    saveStaff({surveillants:svObjects, estafettes:esObjects}); 
    saveEstafettesCfg({minPerBuilding:minEst, useThreeWhenRoomsGte:thr});
    return loadStaff();
  }
  // Remet à zéro les surveillants mais garde nb/descr/bâtiments
  // Remet à zéro les surveillants mais garde nb/descr/bâtiments
  // Modifier la fonction resetSurveillantsAfterImport
function resetSurveillantsAfterImport() {
  // Ne sauvegarde plus l'état du modal ici
  const rooms = loadRooms();
  if (Array.isArray(rooms) && rooms.length) {
    const cleared = rooms.map(r => ({ 
      ...r, 
      surveillants: []  // Conserve description, batiment, capacite
    }));
    saveRooms(cleared);
  }
  saveEstafettesAssign({});
}

// Modifier les fonctions d'import pour conserver l'état du modal
async function importerPersonnelDepuisColler() {
  // Sauvegarder l'état actuel AVANT l'import
  if (document.querySelector('.room-card')) {
    snapshotRoomsFromModalAndSave();
  }

  const html = `<div style="display:grid;gap:10px">
    <p style="margin:0;color:#475569">Collez les lignes (avec <b>GRADE</b> et <b>NOM ET PRENOMS</b>).</p>
    <textarea id="txtImport" rows="12" placeholder="Collez ici…" style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:10px 12px;outline:none"></textarea>
    <small style="color:#64748b">Format attendu : NR | GRADE | NOM ET PRENOMS | MLE | NR TPH | UNITE</small>
  </div>`;
  
  const res = await Swal.fire({
    title: "Importer le personnel (coller depuis Excel)", 
    html, 
    width: 720, 
    focusConfirm: false, 
    showCancelButton: true, 
    confirmButtonText: "Importer",
    preDestroy: () => {
      // Restaurer l'état du modal après fermeture
      if (document.querySelector('.room-card')) {
        hydrateRoomsInputsFromStorage();
      }
    }
  });
  
  if (!res.isConfirmed) return null;
  const raw = document.getElementById('txtImport').value || '';
  const parsed = parsePersonnelFromPasted(raw);
  
  if (!parsed.total) { 
    await Swal.fire("Aucun agent détecté", "Vérifie la présence des colonnes GRADE/NOM.", "warning"); 
    return null; 
  }
  
  saveStaff({surveillants: parsed.surveillants, estafettes: parsed.estafettes});
  verifierDonneesPersonnel();
  resetSurveillantsAfterImport();
  
  if (document.querySelector('.room-card')) {
    const staff = loadStaff();
    buildSurveillantOptions(staff);
    hydrateRoomsInputsFromStorage();
    const t = document.querySelector('.sv1') || document.querySelector('.room-building');
    if (t) t.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  await Swal.fire({
    icon: "success", 
    title: "Import réussi",
    html: `<div style="text-align:left">
      <p>Agents détectés : <b>${parsed.total}</b></p>
      <p>Surveillants : <b>${parsed.surveillants.length}</b></p>
      <p>Estafettes (GST/G2C) : <b>${parsed.estafettes.length}</b></p>
      <p style="color:#10b981;font-size:12px;margin-top:8px">Les configurations ont été conservées.</p>
    </div>`
  });
  
  return loadStaff();
}

async function importerPersonnelDepuisExcel() {
  // Sauvegarder l'état actuel AVANT l'import
  if (document.querySelector('.room-card')) {
    snapshotRoomsFromModalAndSave();
  }

  const html = `<div style="display:grid;gap:10px">
    <input id="excelFile" type="file" accept=".xlsx,.xls,.csv" style="border:1px solid #d1d5db;border-radius:10px;padding:8px 10px" />
    <small style="color:#64748b">Le fichier doit contenir <b>GRADE</b> et <b>NOM ET PRENOMS</b>.<br>
    Les colonnes <b>MLE</b>, <b>NR TPH</b> et <b>UNITE</b> seront également importées si disponibles.</small>
  </div>`;
  
  const res = await Swal.fire({
    title: "Importer le personnel depuis un fichier", 
    html, 
    width: 560, 
    focusConfirm: false,
    showCancelButton: true, 
    confirmButtonText: "Importer",
    preDestroy: () => {
      // Restaurer l'état du modal après fermeture
      if (document.querySelector('.room-card')) {
        hydrateRoomsInputsFromStorage();
      }
    },
    preConfirm: async () => {
      const input = document.getElementById('excelFile'); 
      const file = input?.files?.[0];
      if (!file) { 
        Swal.showValidationMessage("Sélectionnez un fichier."); 
        return false; 
      }
      try {
        const buf = await file.arrayBuffer(); 
        const wb = XLSX.read(buf, {type: "array"}); 
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {defval: "", raw: false}); 
        const parsed = parsePersonnelFromObjects(rows);
        if (!parsed.total) { 
          Swal.showValidationMessage("Impossible de détecter des agents."); 
          return false; 
        }
        return parsed;
      } catch (e) {
        console.error(e); 
        Swal.showValidationMessage("Erreur de lecture du fichier."); 
        return false;
      }
    }
  });
  
  if (!res.isConfirmed) return null;
  saveStaff({surveillants: res.value.surveillants, estafettes: res.value.estafettes}); 
  verifierDonneesPersonnel();
  resetSurveillantsAfterImport();
  
  if (document.querySelector('.room-card')) {
    const staff = loadStaff();
    buildSurveillantOptions(staff);
    hydrateRoomsInputsFromStorage();
    const t = document.querySelector('.sv1') || document.querySelector('.room-building');
    if (t) t.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  const p = res.value;
  await Swal.fire({
    icon: "success", 
    title: "Import réussi",
    html: `<div style="text-align:left">
      <p>Agents détectés : <b>${p.total}</b></p>
      <p>Surveillants : <b>${p.surveillants.length}</b></p>
      <p>Estafettes (GST/G2C) : <b>${p.estafettes.length}</b></p>
      <p style="color:#10b981;font-size:12px;margin-top:8px">Les configurations ont été conservées.</p>
    </div>`
  });
  
  return loadStaff();
}

// Ajouter cette fonction pour gérer la sauvegarde/restauration
function snapshotRoomsFromModalAndSave() {
  const cards = [...document.querySelectorAll('.room-card')];
  const currentRooms = cards.map((card, i) => ({
    numero: i + 1,
    capacite: parseInt(card.querySelector('.salle-nb')?.value, 10) || 0,
    description: (card.querySelector('.room-desc')?.value || '').trim(),
    batiment: (card.querySelector('.room-building')?.value || '').trim(),
    surveillants: [card.querySelector('.sv1')?.value, card.querySelector('.sv2')?.value].filter(Boolean)
  }));
  saveRooms(currentRooms);
}
  async function importerPersonnelDepuisColler(){
    const html=`<div style="display:grid;gap:10px">
        <p style="margin:0;color:#475569">Collez les lignes (avec <b>GRADE</b> et <b>NOM ET PRENOMS</b>).</p>
        <textarea id="txtImport" rows="12" placeholder="Collez ici…" style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:10px 12px;outline:none"></textarea>
        <small style="color:#64748b">Format attendu : NR | GRADE | NOM ET PRENOMS | MLE | NR TPH | UNITE</small>
    </div>`;
    const res=await Swal.fire({ title:"Importer le personnel (coller depuis Excel)", html, width:720, focusConfirm:false, showCancelButton:true, confirmButtonText:"Importer" });
    if(!res.isConfirmed) return null;
    const raw=document.getElementById('txtImport').value||'';
    const parsed=parsePersonnelFromPasted(raw);
    if(!parsed.total){ 
      await Swal.fire("Aucun agent détecté","Vérifie la présence des colonnes GRADE/NOM.","warning"); 
      return null; 
    }
    // 1) Enregistre le nouveau staff
    saveStaff({surveillants:parsed.surveillants, estafettes:parsed.estafettes});
    verifierDonneesPersonnel();
    // 2) Reset surveillants (on garde salles/bât/descr/capacités)
    resetSurveillantsAfterImport();
    // 3) Si le modal est ouvert, on rafraîchit l’UI en place
    if (document.querySelector('.room-card')) {
      const staff = loadStaff();
      buildSurveillantOptions(staff);       // remet les options avec le nouveau staff
      hydrateRoomsInputsFromStorage();      // remet les valeurs salles/bât/descr/capas visibles
      // délenche un 'change' pour recalcul estafettes/reprise via les listeners du modal
      const t = document.querySelector('.sv1') || document.querySelector('.room-building');
      if (t) t.dispatchEvent(new Event('change', { bubbles:true }));
    }
    await Swal.fire({
      icon:"success", title:"Import réussi",
      html:`<div style="text-align:left">
        <p>Agents détectés : <b>${parsed.total}</b></p>
        <p>Surveillants : <b>${parsed.surveillants.length}</b></p>
        <p>Estafettes (GST/G2C) : <b>${parsed.estafettes.length}</b></p>
        <p style="color:#10b981;font-size:12px;margin-top:8px">Les surveillants ont été remis à zéro (salles/bâtiments/descriptions conservés).</p>
      </div>`
    });
    return loadStaff();
  }
  async function importerPersonnelDepuisExcel(){
    const html=`<div style="display:grid;gap:10px">
      <input id="excelFile" type="file" accept=".xlsx,.xls,.csv" style="border:1px solid #d1d5db;border-radius:10px;padding:8px 10px" />
      <small style="color:#64748b">Le fichier doit contenir <b>GRADE</b> et <b>NOM ET PRENOMS</b>.<br>
      Les colonnes <b>MLE</b>, <b>NR TPH</b> et <b>UNITE</b> seront également importées si disponibles.</small>
    </div>`;
    const res=await Swal.fire({
      title:"Importer le personnel depuis un fichier", html, width:560, focusConfirm:false,
      showCancelButton:true, confirmButtonText:"Importer",
      preConfirm:async()=>{
        const input=document.getElementById('excelFile'); 
        const file=input?.files?.[0];
        if(!file){ Swal.showValidationMessage("Sélectionnez un fichier."); return false; }
        try{
          const buf=await file.arrayBuffer(); 
          const wb=XLSX.read(buf,{type:"array"}); 
          const sheet=wb.Sheets[wb.SheetNames[0]];
          const rows=XLSX.utils.sheet_to_json(sheet,{defval:"",raw:false}); 
          const parsed=parsePersonnelFromObjects(rows);
          if(!parsed.total){ Swal.showValidationMessage("Impossible de détecter des agents."); return false; }
          // 1) Enregistre le nouveau staff
          saveStaff({surveillants:parsed.surveillants, estafettes:parsed.estafettes}); 
          verifierDonneesPersonnel();
          return parsed;
        }catch(e){
          console.error(e); Swal.showValidationMessage("Erreur de lecture du fichier."); return false;
        }
      }
    });
    if(!res.isConfirmed) return null;
    // 2) Reset surveillants (on garde salles/bât/descr/capacités)
    resetSurveillantsAfterImport();
    // 3) Si le modal est ouvert, rafraîchir l’UI
    if (document.querySelector('.room-card')) {
      const staff = loadStaff();
      buildSurveillantOptions(staff);
      hydrateRoomsInputsFromStorage();
      const t = document.querySelector('.sv1') || document.querySelector('.room-building');
      if (t) t.dispatchEvent(new Event('change', { bubbles:true }));
    }
    const p=res.value;
    await Swal.fire({
      icon:"success", title:"Import réussi",
      html:`<div style="text-align:left">
        <p>Agents détectés : <b>${p.total}</b></p>
        <p>Surveillants : <b>${p.surveillants.length}</b></p>
        <p>Estafettes (GST/G2C) : <b>${p.estafettes.length}</b></p>
        <p style="color:#10b981;font-size:12px;margin-top:8px">Les surveillants ont été remis à zéro (salles/bâtiments/descriptions conservés).</p>
      </div>`
    });
    return loadStaff();
  }
  /******************************************************
   * 4) ESTAFETTES — calcul auto en excluant les surveillants
   ******************************************************/
  function computeEstafettesParBat(salles, staffRaw, editedMap /* {bat -> [labels]} */) {
    const fromUI = new Map(Object.entries(editedMap || {}));
    const cfg = loadEstafettesCfg();
    // 1) Surveillants déjà utilisés (Set de noms normalisés)
    const survUsed = getAllSurveillantNames(salles);
    // 2) Normalisation sûre d’une personne (accepte objet ou chaîne)
    const normalize = (p) => {
      if (!p) return null;
      if (typeof p === 'string') {
        const parsed = parseSurveillantLine(p);
        if (!parsed) return null;
        return {
          grade: String(parsed.grade || '').toUpperCase(),
          name:  parsed.name || '',
          label: parsed.label || `${parsed.grade || ''} — ${parsed.name || ''}`,
          mle:   '',
          nrTph: '',
          unite: ''
        };
      }
      const grade = String(p.grade || '').toUpperCase();
      const name  = p.name || '';
      if (!name) return null;
      return {
        grade,
        name,
        label: p.label || `${grade} — ${name}`,
        mle:   p.mle   || '',
        nrTph: p.nrTph || '',
        unite: p.unite || ''
      };
    };
    const survArr = (staffRaw?.surveillants || []).map(normalize).filter(Boolean);
    const estArr  = (staffRaw?.estafettes   || []).map(normalize).filter(Boolean);
    // 3) Tout le personnel possible (surveillants + estafettes), hors gens déjà surveillants
    const allStaff = [...survArr, ...estArr].filter(p => p.name && p.label);
    const pool0 = allStaff.filter(p => !survUsed.has(normName(p.name)));
    // 4) Règle estafette: pas de seniors, priorité GST > G2C > G1C
    const ALLOWED = new Set(['GST', 'G2C', 'G1C']); // (on exclut GHC aussi, selon ta demande)
    const pool1 = pool0.filter(p => ALLOWED.has(p.grade));
    const weight = { GST: 1, G2C: 2, G1C: 3 };
    pool1.sort((a, b) =>
      (weight[a.grade] || 9) - (weight[b.grade] || 9) ||
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    );
    // 5) Déduplique globalement par nom
    const seen = new Set();
    const pool = [];
    for (const p of pool1) {
      const n = normName(p.name);
      if (!n || seen.has(n)) continue;
      seen.add(n);
      pool.push(p);
    }
    // 6) Groupement des salles par bâtiment
    const byBat = new Map();
    for (const s of (salles || [])) {
      const b = _clean(s?.batiment) || '—';
      if (!byBat.has(b)) byBat.set(b, []);
      byBat.get(b).push(s);
    }
    const perBat = loadEstafettesPerBuilding();
    const needFor = (bat) => {
      if (perBat[bat]) return Math.max(1, Number(perBat[bat]));
      const nb = (byBat.get(bat) || []).length;
      return (nb >= cfg.useThreeWhenRoomsGte)
        ? Math.max(3, cfg.minPerBuilding)
        : Math.max(2, cfg.minPerBuilding);
    };
    // 7) Round-robin avec unicité globale
    let idx = 0;
    const usedEst = new Set(); // noms normalisés déjà pris comme estafette (tous bâtiments)
    const rr = () => {
      while (idx < pool.length) {
        const person = pool[idx++];
        const n = normName(person.name);
        if (!usedEst.has(n)) {
          usedEst.add(n);
          return person;
        }
      }
      return null;
    };
    // 8) Construire le résultat par bâtiment
    const out = new Map();
    const autoAssignments = new Map();
    for (const bat of byBat.keys()) {
      const need = needFor(bat);
      if (!fromUI.has(bat) || !Array.isArray(fromUI.get(bat)) || fromUI.get(bat).length === 0) {
        const list = [];
        for (let i = 0; i < need; i++) {
          const e = rr();
          if (!e) break;
          list.push(e.label);
        }
        out.set(bat, list);
        autoAssignments.set(bat, list);
      } else {
        // Nettoyer choix utilisateur (pas de surveillant, pas de doublon, pas de non-autorisé)
        const userSelRaw = (fromUI.get(bat) || []).filter(Boolean);
        const seenLoc = new Set();
        const userSel = [];
        for (const lab of userSelRaw) {
          const n = normName(nameFromLabel(lab));
          const g = gradeFromLabel(lab);
          if (!n) continue;
          if (survUsed.has(n)) continue;    // jamais surveillant & estafette
          if (usedEst.has(n)) continue;     // déjà pris ailleurs
          if (seenLoc.has(n)) continue;     // doublon local
          if (!ALLOWED.has(g)) continue;    // on enlève seniors + GHC
          seenLoc.add(n);
          usedEst.add(n);
          userSel.push(lab);
        }
        const list = userSel.slice(0, need);
        while (list.length < need) {
          const e = rr();
          if (!e) break;
          list.push(e.label);
        }
        out.set(bat, list);
      }
    }
    // 9) Retour
    return {
      estafettesMap: out,
      autoAssignments,
      usedEstafettes: usedEst,
      availableStaff: pool   // propre: objets normalisés uniquement
    };
  }
  /******************************************************
   * 5) MODAL principal (salles + à droite onglet Estafettes)
   ******************************************************/
  async function ajouterSallesViaModal(eleves, exclusions = []) {
    const savedRooms = loadRooms();
    const prevCount = savedRooms.length || 0;
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
        if (isNaN(n) || n <= 0) { Swal.showValidationMessage("Nombre invalide (≥ 1)."); return false; }
        return n;
      }
    });
    if (!value) return;
    const nbSalles = parseInt(value, 10);
    let activeRooms = savedRooms.slice(0, nbSalles);
    if (activeRooms.length < nbSalles) {
      for (let i = activeRooms.length; i < nbSalles; i++) {
        activeRooms.push({ numero: i + 1, capacite: 0, description: "", batiment: "", surveillants: [] });
      }
    }
    activeRooms = activeRooms.map((r, i) => ({
      numero: i + 1,
      capacite: Number(r.capacite) || 0,
      description: r.description || "",
      batiment: r.batiment || "",
      surveillants: Array.isArray(r.surveillants) ? r.surveillants.slice(0, 2) : []
    }));
    saveRooms(activeRooms);
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
        .room-card.sv-duplicate { border-color:#a855f7 !important; box-shadow:0 0 0 3px rgba(168,85,247,.18); }
        .reprise-box{border:1px solid #e5e7eb;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px}
        .reprise-head{display:flex;justify-content:space-between;align-items:center;font-weight:700}
        .reprise-grid{display:grid;grid-template-columns:1fr 110px 34px;gap:6px}
        .reprise-grid input{padding:8px 10px;border:1px solid #cfd4dc;border-radius:10px}
        .reprise-add{padding:6px 10px;border:none;border-radius:10px;background:#3b82f6;color:#fff;cursor:pointer}
        .reprise-del{border:1px solid #e5e7eb;border-radius:10px;background:#f3f4f6;cursor:pointer}
        /* Badge + puces surveillants visibles en haut */
        .room-head{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; }
        .sv-badges{ display:flex; gap:6px; flex-wrap:wrap; justify-content:center; max-width:100%; }
        .sv-chip{ background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3; padding:2px 8px; border-radius:999px; font-size:12px; line-height:18px; max-width:100%; }
        /* message + erreur estafettes (pas de SweetAlert) */
        .estaf-msg{ display:none; margin:4px 0 8px; font-size:12px; color:#b91c1c; }
        .est-sel.est-invalid{ border-color:#ef4444 !important; box-shadow:0 0 0 3px rgba(239,68,68,.15); }
      `;
      document.head.appendChild(style);
    }
    // Overrides hauteur
    {
      const css = `
        .repart-grid{max-height:78vh;padding-right:4px}
        .room-card{padding:14px;min-height:400px}
        .room-input-group input.salle-nb{height:44px;font-size:16px;padding:10px 12px}
        .btn-inc,.btn-dec{width:42px;height:42px;font-size:20px}
        .room-building,.room-desc{height:60px;font-size:14px}
        .room-staff{padding:10px;gap:8px}
        .room-staff select{height:40px;font-size:14px}
        .room-badge{font-size:14px;padding:8px 12px}
        @media (max-width:1200px){ .repart-body{grid-template-columns:1fr 400px} }
      `;
      const s = document.getElementById('swal-repart-css') || (()=> {
        const st = document.createElement('style'); st.id='swal-repart-css'; document.head.appendChild(st); return st;
      })();
      s.textContent += css;
    }
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
    const toolbar = `
      <div class="repart-toolbar">
        <div class="repart-toolbar-left">
          <button id="btn-staff" class="btn-chip">Personnel</button>
          <button id="btn-import-excel" class="btn-chip ghost">Importer Excel</button>
          <button id="btn-import-paste" class="btn-chip ghost">Coller Excel</button>
          <input id="cap-def" type="number" min="1" placeholder="Capacité par défaut"/><button id="apply-all" class="btn-chip">Appliquer à toutes</button>
          <input id="desc-def" type="text" placeholder="Description par défaut"/><button id="apply-desc-all" class="btn-chip alt">Appliquer descriptions</button>
          <input id="builds" type="text" placeholder="Bâtiments (ex: BAT 1°ESC)"/><button id="apply-buildings" class="btn-chip ghost">Assigner bâtiments</button>
          <input id="group-size" type="number" min="2" value="3" placeholder="Taille cible"/><input id="group-max" type="number" min="3" value="5" placeholder="Taille max"/><button id="auto-group-buildings" class="btn-chip">Grouper (A,B,C…)</button>
          <button id="clear-all" class="btn-chip ghost">Tout vider</button>
        </div>
        <div style="font-size:12px;color:#6b7280">Entrée : valider • Échap : annuler</div>
      </div>`;
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
    const result = await Swal.fire({
      title: "Effectif, bâtiments & surveillants des salles",
      html: `${toolbar}${bodyHTML}${footer}`,
      width: 'min(1400px, 96vw)',
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
        // bouton Random
        const confirmBtn = Swal.getConfirmButton();
        const randomBtn = document.createElement('button');
        randomBtn.id = 'btn-random-staff';
        randomBtn.textContent = 'Random personnels';
        randomBtn.className = 'btn-chip alt';
        randomBtn.style.marginRight = '8px';
        confirmBtn.parentNode.insertBefore(randomBtn, confirmBtn);
        let estAssign = loadEstafettesAssign();
        let staff = loadStaff();
        // options surveillants
        function buildSurveillantOptions(staff) {
          const pools = buildSurvPools(staff?.surveillants || []);
        
          // comptage déjà pris comme surveillants dans l'UI courante (si modal ouvert)
          const allRooms = [...document.querySelectorAll('.room-card')];
          const surveillantCount = {};
          allRooms.forEach(card => {
            ['sv1','sv2'].forEach(cls => {
              const v = card.querySelector(`.${cls}`)?.value;
              if (v) {
                const n = normName(nameFromLabel(v));
                surveillantCount[n] = (surveillantCount[n] || 0) + 1;
              }
            });
          });
        
          // nettoie les estafettes sauvegardées (jamais de seniors dedans)
          const estAssign = loadEstafettesAssign() || {};
          Object.keys(estAssign).forEach(bat => {
            estAssign[bat] = (estAssign[bat] || []).filter(lab => !GROUP_B.has(gradeFromLabel(lab)));
          });
          saveEstafettesAssign(estAssign);
        
          const allEstafette = getAllEstafetteNames(estAssign);
          const seniors  = pools.display.filter(p => GROUP_B.has(p.grade));
          const adjoints = pools.display.filter(p => GROUP_A.has(p.grade));
        
          const createOptions = (people, groupName) => {
            if (!people.length) return "";
            let options = `<option disabled style="font-weight:bold;background:#f3f4f6;color:#374151;">--- ${groupName} ---</option>`;
            people.forEach(p => {
              const n = normName(p.name);
              const isEst = allEstafette.has(n);
              const cnt   = surveillantCount[n] || 0;
              let color   = 'background:#dbeafe;color:#2563eb';
              if (isEst || cnt > 1) color = 'background:#fee2e2;color:#991b1b';
              else if (cnt === 1)   color = 'background:#e0e7ff;color:#64748b;';
              let displayLabel = p.label || `${p.grade} — ${p.name}`;
              if (p.mle || p.nrTph || p.unite) {
                const extra = [];
                if (p.mle)   extra.push(`MLE: ${p.mle}`);
                if (p.nrTph) extra.push(`TPH: ${p.nrTph}`);
                if (p.unite) extra.push(`UNITÉ: ${p.unite}`);
                displayLabel += ` [${extra.join(', ')}]`;
              }
              const val = (p.label || `${p.grade} — ${p.name}`).replace(/"/g,'&quot;');
              options += `<option value="${val}" style="${color}">${displayLabel}</option>`;
            });
            return options;
          };
        
          const html =
            createOptions(seniors , "GRADES") +
            createOptions(adjoints, "GENDARMES");
        
          document.querySelectorAll('.sv1,.sv2').forEach(sel => {
            const cur = sel.value;
            sel.innerHTML = `<option value=""></option>` + html;
            if (cur && [...sel.options].some(o => o.value === cur)) sel.value = cur; else sel.selectedIndex = 0;
          });
        
          if (!document.getElementById('personnel-group-css')) {
            const style = document.createElement('style'); style.id="personnel-group-css";
            style.textContent = `
              .sv1 option, .sv2 option { white-space: pre-wrap; max-width: 400px; }
              .sv1 option:disabled, .sv2 option:disabled { font-weight: bold; background:#f3f4f6 !important; color:#374151 !important; font-style: italic; }
            `;
            document.head.appendChild(style);
          }
        }
        
        buildSurveillantOptions(staff);
        const getSallesSnapshot = () => [...document.querySelectorAll('.room-card')].map((card, i) => ({
          numero: i + 1,
          batiment: (card.querySelector('.room-building')?.value || '').trim() || '—',
          surveillants: [card.querySelector('.sv1')?.value, card.querySelector('.sv2')?.value].filter(Boolean)
        }));
        function colorizeDuplicateSurveillants() {
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
                if (surveillantToRooms[norm] && surveillantToRooms[norm].length > 1) isDuplicate = true;
              }
            });
            if (isDuplicate) card.classList.add('sv-duplicate');
            else card.classList.remove('sv-duplicate');
          });
        }
        function colorizeShortages(estafettesData) {
          const cards = [...document.querySelectorAll('.room-card')];
          let missingSV = 0, missingEst = 0;
          const cfg = loadEstafettesCfg();
          const snapshot = getSallesSnapshot();
          const countByBat = new Map();
          snapshot.forEach(s => countByBat.set(s.batiment, (countByBat.get(s.batiment) || 0) + 1));
          const needFor = bat => (countByBat.get(bat) || 0) >= cfg.useThreeWhenRoomsGte ? Math.max(3, cfg.minPerBuilding) : Math.max(2, cfg.minPerBuilding);
          cards.forEach(card => {
              const sv1 = card.querySelector('.sv1')?.value, sv2 = card.querySelector('.sv2')?.value;
              if (!sv1 || !sv2) { card.classList.add('sv-missing'); missingSV++; } else { card.classList.remove('sv-missing'); }
          });
          let estMap = estafettesData?.estafettesMap || estafettesData;
          for (const [bat, list] of estMap.entries()) {
              const need = needFor(bat); 
              missingEst += Math.max(0, need - (list?.length || 0));
          }
          const badge = document.getElementById('shortage-indicator');
          if (missingSV === 0 && missingEst === 0) {
              badge.style.display = 'inline-block'; 
              badge.className = 'shortage-badge short-ok'; 
              badge.textContent = 'Aucun manque de personnel';
          } else {
              badge.style.display = 'inline-block';
              const parts = []; 
              if (missingSV > 0) parts.push(`${missingSV} salle(s) sans 2 surveillants`); 
              if (missingEst > 0) parts.push(`estafettes manquantes: ${missingEst}`);
              const sev = (missingSV > 0 && missingEst > 0) ? 'short-bad' : 'short-warn';
              badge.className = `shortage-badge ${sev}`; 
              badge.textContent = parts.join(' · ');
          }
          return { missingSV, missingEst };
        }
        // chips surveillants affichés en haut
        function updateRoomHeadChips() {
          document.querySelectorAll('.room-card').forEach((card, i) => {
            const head = card.querySelector('.room-head');
            const s1 = card.querySelector('.sv1')?.value;
            const s2 = card.querySelector('.sv2')?.value;
            const chips = [s1, s2].filter(Boolean)
              .map(lab => `<span class="sv-chip">${lab}</span>`).join('');
            head.innerHTML = `<span class="room-badge">Salle ${i+1}</span>${chips ? `<div class="sv-badges">${chips}</div>` : ''}`;
          });
        }
        function renderEstafettePanel() {
          const panel = document.getElementById('estafette-panel');
          if (!panel) return;
        
          const snapshot = (typeof getSallesSnapshot === "function")
            ? getSallesSnapshot()
            : [...document.querySelectorAll('.room-card')].map((card, i) => ({
                numero: i + 1,
                batiment: (card.querySelector('.room-building')?.value || '').trim() || '—',
                surveillants: [card.querySelector('.sv1')?.value, card.querySelector('.sv2')?.value].filter(Boolean)
              }));
        
          const estAssign = loadEstafettesAssign() || {};
          const perBat    = loadEstafettesPerBuilding() || {};
          const staff     = loadStaff();
        
          const estafettesData = computeEstafettesParBat(snapshot, staff, estAssign);
          const estMap         = estafettesData.estafettesMap;
          const autoAssignments= estafettesData.autoAssignments;
          const availableStaff = estafettesData.availableStaff;
        
          // options (uniquement GST/G2C/G1C, info extra visible)
          const allAvailableOptions = availableStaff.map(p=>{
            let lab = p.label || `${p.grade} — ${p.name}`;
            const extra=[];
            if (p.mle)   extra.push(`MLE:${p.mle}`);
            if (p.nrTph) extra.push(`TPH:${p.nrTph}`);
            if (p.unite) extra.push(`UNITÉ:${p.unite}`);
            if (extra.length) lab += ` [${extra.join(', ')}]`;
            return `<option value="${(p.label||'').replace(/"/g,'&quot;')}">${lab}</option>`;
          }).join('');
        
          const cfg = loadEstafettesCfg();
          const countByBat = new Map();
          snapshot.forEach(s => countByBat.set(s.batiment, (countByBat.get(s.batiment) || 0) + 1));
          const needFor = bat => perBat[bat] ?? ((countByBat.get(bat) || 0) >= cfg.useThreeWhenRoomsGte
                            ? Math.max(3, cfg.minPerBuilding) : Math.max(2,cfg.minPerBuilding));
        
          const bats = [...new Set(snapshot.map(s => s.batiment))];
        
          panel.innerHTML = `
            <div id="estaf-msg" class="estaf-msg" style="display:none;margin:4px 0 8px;font-size:12px;color:#b91c1c"></div>
            ${bats.map(bat=>{
              const need = needFor(bat);
              const list = estMap.get(bat) || [];
              const selects = Array.from({length: need}, (_,i)=>`
                <select class="est-sel" data-bat="${bat}" data-idx="${i}" style="width:100%;margin-top:6px;padding:8px 10px;border:1px solid #cfd4dc;border-radius:10px">
                  <option value=""></option>${allAvailableOptions}
                </select>`).join('');
              const manque = Math.max(0, need - (list?.length || 0));
              return `
                <div class="est-item" style="border:1px dashed #e5e7eb;border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:6px">
                  <div class="est-head" style="display:flex;justify-content:space-between;align-items:center;font-weight:600">
                    <span>Bâtiment <b>${bat}</b></span>
                    <span>${manque>0?`(manque ${manque})`:`${need} requis`}
                      <button class="btn-set-estaf" data-bat="${bat}" style="margin-left:6px">🖉</button>
                    </span>
                  </div>
                  <div class="est-list" data-bat="${bat}">${selects}</div>
                </div>`;
            }).join('')}
          `;
          document.addEventListener('change', (e)=>{
            if(e.target.matches('.sv1,.sv2,.room-building')){
              snapshotRoomsFromModalAndSave();
              renderEstafettePanel();
              renderReprisePanel();
            }
          });
          
        
          const showMsg = (txt) => {
            const m = panel.querySelector('#estaf-msg');
            m.textContent = txt || '';
            m.style.display = txt ? 'block' : 'none';
          };
        
          // bouton réglage par bat
          panel.querySelectorAll('.btn-set-estaf').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              const bat = btn.getAttribute('data-bat');
              const prev = perBat[bat] ?? '';
              const val = prompt(`Nb d'estafettes pour ${bat}`, prev === '' ? '' : String(prev));
              if (val === null) return;
              if (val === '' || isNaN(Number(val))) delete perBat[bat];
              else perBat[bat] = Math.max(1, Number(val));
              saveEstafettesPerBuilding(perBat);
              renderEstafettePanel();
              renderReprisePanel(); // pour MAJ des conflits
            });
          });
        
          // pré-remplissage : sauvegarde UI sinon auto
          panel.querySelectorAll('.est-sel').forEach(sel=>{
            const bat = sel.getAttribute('data-bat');
            const idx = +sel.getAttribute('data-idx');
            const saved = (estAssign[bat] || [])[idx] || '';
            const auto  = (autoAssignments.get(bat) || [])[idx] || '';
            const target= saved || auto || '';
            if (target && [...sel.options].some(o=>o.value===target)) sel.value = target;
            else sel.selectedIndex = 0;
          });
        
          // anti-doublons inline
          const getSelectedNames = (exceptSel = null) => {
            const set = new Set();
            panel.querySelectorAll('.est-sel').forEach(s=>{
              if (s===exceptSel) return;
              const v = s.value;
              if (!v) return;
              const n = normName(nameFromLabel(v));
              if (n) set.add(n);
            });
            return set;
          };
        
          panel.querySelectorAll('.est-sel').forEach(sel=>{
            sel.addEventListener('change', ()=>{
              const bat = sel.getAttribute('data-bat');
              const idx = +sel.getAttribute('data-idx');
        
              if (!sel.value) {
                const arr = (estAssign[bat] || []).slice();
                arr[idx] = '';
                estAssign[bat] = arr.filter(Boolean);
                saveEstafettesAssign(estAssign);
                showMsg('');
                return;
              }
        
              const picked = normName(nameFromLabel(sel.value));
              const already = getSelectedNames(sel);
              if (already.has(picked)) {
                sel.classList.add('est-invalid');
                showMsg("Cet agent est déjà affecté comme estafette ailleurs. Choisissez une autre personne.");
                sel.value = '';
                setTimeout(()=>sel.classList.remove('est-invalid'), 1200);
                return;
              }
        
              sel.classList.remove('est-invalid');
              showMsg('');
              const arr = (estAssign[bat] || []).slice();
              arr[idx] = sel.value;
              estAssign[bat] = arr.filter(Boolean);
              saveEstafettesAssign(estAssign);
        
              renderEstafettePanel();
              renderReprisePanel();
            });
          });
        }
        
              function renderReprisePanel(staffObj, estafettesData) {
                const grid = document.getElementById('reprise-grid');
                if (!grid) return;
              
                /* ---------- CSS (une seule fois) --------------------------------------- */
                if (!document.getElementById('repr-reset-css')) {
                  const s = document.createElement('style'); s.id = 'repr-reset-css';
                  s.textContent = `
                    #reprise-grid{display:block !important}
                    .repr-wrap{display:flex;flex-direction:column;gap:12px}
                    .repr-head{display:grid;grid-template-columns:1fr 1fr;gap:12px}
                    .repr-title{font-weight:800;text-align:center;font-size:16px;line-height:1.1}
                    .repr-sub{display:block;font-weight:600;color:#475569;font-size:12px;margin-top:2px}
                    .repr-status{border:1px solid #e5e7eb;border-radius:12px;padding:8px 10px;font-size:12.5px}
                    .repr-ok{background:#ecfdf5;color:#065f46;border-color:#bbf7d0}
                    .repr-warn{background:#fff7ed;color:#9a3412;border-color:#fed7aa}
                    .repr-bad{background:#fef2f2;color:#991b1b;border-color:#fecaca}
                    .repr-rows{display:grid;grid-template-columns:1fr 1fr 42px;gap:8px}
                    .repr-row{display:contents}
                    .repr-sel{width:100%;padding:10px;border:1px solid #cfd4dc;border-radius:12px;background:#fff}
                    .repr-sel.repr-error{border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.12)}
                    .repr-del{height:42px;border:1px solid #e5e7eb;border-radius:12px;background:#f3f4f6;cursor:pointer}
                    .repr-foot{display:grid;grid-template-columns:1fr 1fr;gap:8px}
                    .repr-foot small{color:#64748b;text-align:center}
                  `;
                  document.head.appendChild(s);
                }
              
                /* ---------- État persistant -------------------------------------------- */
                const saved = loadReprise();
                let state;
              
                // Migration ancien format (array [{nom,nombre}] ou similaire)
                if (Array.isArray(saved)) {
                  state = { adjoints: ["" ,"" ,""], seniors: ["" ,"" ,""] };
                } else if (saved && typeof saved === 'object') {
                  state = {
                    adjoints: Array.isArray(saved.adjoints) ? saved.adjoints.slice() : [],
                    seniors : Array.isArray(saved.seniors)  ? saved.seniors.slice()  : []
                  };
                } else {
                  state = { adjoints: [], seniors: [] };
                }
              
                // Toujours au moins 1 ligne
                const normalizeSameLength = () => {
                  const n = Math.max(state.adjoints.length || 1, state.seniors.length || 1);
                  while (state.adjoints.length < n) state.adjoints.push("");
                  while (state.seniors.length  < n) state.seniors.push("");
                };
                normalizeSameLength();
              
                /* ---------- Contexte d’exclusion (SV + Estafettes) --------------------- */
                const snapshot = (typeof getSallesSnapshot === "function") ? getSallesSnapshot() : [];
                const usedSV  = new Set(snapshot.flatMap(s=>s.surveillants||[]).map(nameFromLabel).map(normName));
                const usedEst = (estafettesData && estafettesData.usedEstafettes) ? estafettesData.usedEstafettes : new Set();
              
                /* ---------- Pools disponibles ------------------------------------------ */
                const staff = staffObj || loadStaff();
                const allPeople = [...(staff?.surveillants||[]), ...(staff?.estafettes||[])];
              
                const keep = p => {
                  const n = normName(p.name);
                  return n && !usedSV.has(n) && !usedEst.has(n);
                };
              
                const adjPool = allPeople
                  .filter(p => GROUP_A.has(p.grade))   // GHC/G1C/G2C/GST
                  .filter(keep)
                  .sort((a,b)=> gradeRank(a.grade)-gradeRank(b.grade) || a.name.localeCompare(b.name,'fr',{sensitivity:'base'}));
              
                const senPool = allPeople
                  .filter(p => GROUP_B.has(p.grade))   // GPCE/GPHC/GP1C/GP2C
                  .filter(keep)
                  .sort((a,b)=> gradeRank(a.grade)-gradeRank(b.grade) || a.name.localeCompare(b.name,'fr',{sensitivity:'base'}));
              
                /* ---------- Auto-remplissage doux (seulement si tout est vide) ---------- */
                const allEmpty =
                  state.adjoints.every(v => !v) &&
                  state.seniors.every(v => !v);
              
                if (allEmpty) {
                  const already = new Set();
                  const take = (pool, k) => {
                    const out = [];
                    for (const p of pool) {
                      const n = normName(p.name);
                      if (already.has(n)) continue;
                      out.push(p.label);
                      already.add(n);
                      if (out.length === k) break;
                    }
                    return out;
                  };
                  // jusqu’à 3 + 3 si disponible
                  const aFill = take(adjPool, 3);
                  const sFill = take(senPool, 3);
              
                  // Met 3 lignes si possible, sinon garde au moins 1
                  const rows = Math.max(1, Math.max(aFill.length, sFill.length, 3));
                  state.adjoints = Array.from({length: rows}, (_,i)=> aFill[i] || "");
                  state.seniors  = Array.from({length: rows}, (_,i)=> sFill[i] || "");
                } else {
                  // sinon : maintenir le nombre de lignes existant
                  normalizeSameLength();
                }
              
                /* ---------- Construction des <option> ----------------------------------- */
                const optionLabel = (p) => {
                  let lab = p.label || `${p.grade} — ${p.name}`;
                  const extra = [];
            if (p.mle)   extra.push(`MLE:${p.mle}`);
            if (p.nrTph) extra.push(`TPH:${p.nrTph}`);
            if (p.unite) extra.push(`UNITÉ:${p.unite}`);
            if (extra.length) lab += ` [${extra.join(', ')}]`;
            const val = (p.label || `${p.grade} — ${p.name}`).replace(/"/g,'&quot;');
            return `<option value="${val}">${lab}</option>`;
          };
          const buildOptions = (pool) => `<option value=""></option>` + pool.map(optionLabel).join('');
        
          /* ---------- Rendu ------------------------------------------------------- */
          const header = `
            <div class="repr-head">
              <div class="repr-title">Adjoints<span class="repr-sub">(GHC/G1C/G2C/GST)</span></div>
              <div class="repr-title">Seniors<span class="repr-sub">(GPCE/GPHC/GP1C/GP2C)</span></div>
            </div>
            <div id="repr-status" class="repr-status"></div>
          `;
        
          const rowsCount = Math.max(state.adjoints.length, state.seniors.length);
          const rowsHTML = Array.from({length: rowsCount}).map((_, i) => `
            <div class="repr-row" data-idx="${i}">
              <select class="repr-sel repr-adj" data-idx="${i}">
                ${buildOptions(adjPool)}
              </select>
              <select class="repr-sel repr-sen" data-idx="${i}">
                ${buildOptions(senPool)}
              </select>
              <button type="button" class="repr-del" title="Supprimer la ligne">×</button>
            </div>
          `).join('');
        
          const foot = `
            <div class="repr-foot">
              <small>Choisissez des réserves non déjà affectées.</small>
              <small>Évitez les doublons et conflits.</small>
            </div>
          `;
        
          grid.innerHTML = `<div class="repr-wrap">${header}<div class="repr-rows">${rowsHTML}</div>${foot}</div>`;
        
          // Pré-sélection
          grid.querySelectorAll('.repr-adj').forEach((sel, i) => { if (state.adjoints[i]) sel.value = state.adjoints[i]; });
          grid.querySelectorAll('.repr-sen').forEach((sel, i) => { if (state.seniors[i])  sel.value = state.seniors[i];  });
        
          /* ---------- Persistance (NE PAS filtrer les vides) ---------------------- */
          const persist = () => saveReprise({
            adjoints: state.adjoints,
            seniors : state.seniors
          });
        
          /* ---------- Statut / validations --------------------------------------- */
          const statusEl = document.getElementById('repr-status');
        
          function computeDupFlags() {
            const normalizeArr = arr => arr
              .map(v => v ? normName(nameFromLabel(v)) : '')
              .filter(Boolean);
        
            const all = [...normalizeArr(state.adjoints), ...normalizeArr(state.seniors)];
            const seen = new Set(); let dup = false;
            for (const n of all) { if (seen.has(n)) { dup = true; break; } seen.add(n); }
        
            let clash = false;
            for (const n of all) { if (usedSV.has(n) || usedEst.has(n)) { clash = true; break; } }
        
            return { dup, clash };
          }
        
          function updateStatus() {
            const emptyAdj = state.adjoints.filter(v=>!v).length;
            const emptySen = state.seniors .filter(v=>!v).length;
            const { dup, clash } = computeDupFlags();
        
            let cls = 'repr-ok', txt = 'Réserves complètes';
            const parts = [];
            if (emptyAdj || emptySen) parts.push(`Adjoints vides: ${emptyAdj} • Seniors vides: ${emptySen}`);
            if (dup)   parts.push('Doublon dans les réserves');
            if (clash) parts.push('Conflit avec surveillant/estafette');
        
            if (parts.length) {
              txt = parts.join(' • ');
              cls = (clash ? 'repr-bad' : 'repr-warn');
            }
            statusEl.className = `repr-status ${cls}`;
            statusEl.textContent = txt;
          }
        
          updateStatus();
          persist();
        
          function isTaken(value, idx, side) {
            const n = normName(nameFromLabel(value)); if (!n) return false;
            if (usedSV.has(n) || usedEst.has(n)) return true;
            const inAdj = state.adjoints.some((v,j)=> j!==idx && normName(nameFromLabel(v||""))===n);
            const inSen = state.seniors .some((v,j)=> j!==idx && normName(nameFromLabel(v||""))===n);
            return inAdj || inSen;
          }
        
          // Changement d’un select
          grid.addEventListener('change', (e) => {
            const sel = e.target.closest('.repr-sel'); if (!sel) return;
            const idx  = Number(sel.dataset.idx || -1);
            const side = sel.classList.contains('repr-adj') ? 'adj' : 'sen';
            const val  = sel.value || "";
        
            sel.classList.remove('repr-error');
        
            if (val && isTaken(val, idx, side)) {
              sel.classList.add('repr-error');
              sel.value = "";
              return;
            }
        
            if (side === 'adj') state.adjoints[idx] = val; else state.seniors[idx] = val;
            updateStatus();
            persist();
          });
        
          // Suppression d’une paire
          grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.repr-del'); if (!btn) return;
        
            const row = btn.closest('.repr-row');
            const idx = Number(row?.dataset.idx ?? -1);
            if (idx < 0) return;
        
            state.adjoints.splice(idx, 1);
            state.seniors .splice(idx, 1);
        
            if (state.adjoints.length === 0 && state.seniors.length === 0) {
              state.adjoints.push("");
              state.seniors.push("");
            }
        
            persist();
            renderReprisePanel(staff, estafettesData);
          });
        
          // Bouton “+ Ligne” (en dehors du grid)
          const addBtn = document.getElementById('reprise-add');
          if (addBtn && !addBtn._reprBound) {
            addBtn._reprBound = true;
            addBtn.addEventListener('click', () => {
              state.adjoints.push("");
              state.seniors.push("");
              persist();
              renderReprisePanel(staff, estafettesData);
              setTimeout(() => {
                document
                  .querySelector('.repr-rows .repr-row:last-child .repr-adj')
                  ?.focus();
              }, 0);
            });
          }
        }
        function hydrateRoomsInputsFromStorage() {
          const rooms = loadRooms();
          if (!rooms || !rooms.length) return;
          document.querySelectorAll('.room-card').forEach((card, i) => {
            const r = rooms[i] || {};
            const nb = card.querySelector('.salle-nb');       if (nb) nb.value = r.capacite ?? '';
            const b  = card.querySelector('.room-building');  if (b)  b.value = r.batiment ?? '';
            const d  = card.querySelector('.room-desc');      if (d)  d.value = r.description ?? '';
          });
        }
        
      //
        // Random surveillants
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
        function prioritizePinned(list) {
          const pins   = list.filter(isAlwaysSurveillant);
          const others = list.filter(p => !isAlwaysSurveillant(p));
          return [...pins, ...others];
        }
        
        function randomizeSurveillantsAcrossRooms() {
          const _staff = (typeof staff !== "undefined" && staff) ? staff : loadStaff();
        
          const pools = buildSurvPools(_staff.surveillants || []);
          const used = new Set();
        
          // priorités demandées
          const SENIOR_ORDER  = ["GP2C","GP1C","GPHC","GPCE"]; // groupe B
          const ADJO_ORDER    = ["GST","G2C","G1C","GHC"];     // groupe A
        
          function makePrioritized(list, order){
            const map = new Map(order.map(g=>[g,[]]));
            (list||[]).forEach(p=>{
              if(!p || !p.grade || !p.name) return;
              const g = String(p.grade).toUpperCase();
              if(map.has(g)) map.get(g).push(p);
            });
            order.forEach(g=>shuffleInPlace(map.get(g)));
            const all = order.flatMap(g=>map.get(g));
            const vip = all.filter(isAlwaysSurveillant);
            const rest= all.filter(p=>!isAlwaysSurveillant(p));
            return [...vip, ...rest];
          }
        
          const seniors  = makePrioritized(pools.B || [], SENIOR_ORDER);
          const adjoints = makePrioritized(pools.A || [], ADJO_ORDER);
        
          function takeNext(arr){
            for(const p of arr){
              if(!p || !p.name) continue;
              const n = normName(p.name);
              if(used.has(n)) continue;
              used.add(n);
              return p;
            }
            return null;
          }
        
          document.querySelectorAll(".room-card").forEach(card=>{
            const s1 = card.querySelector(".sv1"); // senior
            const s2 = card.querySelector(".sv2"); // adjoint
            if(!s1 || !s2) return;
        
            const senior  = takeNext(seniors);
            const adjoint = takeNext(adjoints);
        
            const lab1 = senior  ? (senior.label  || `${senior.grade} — ${senior.name}`) : "";
            const lab2 = adjoint ? (adjoint.label || `${adjoint.grade} — ${adjoint.name}`) : "";
        
            s1.value = lab1 && [...s1.options].some(o=>o.value===lab1) ? lab1 : "";
            s2.value = lab2 && [...s2.options].some(o=>o.value===lab2) ? lab2 : "";
          });
        }
        
        
        
        // Random : surveillants + estafettes auto (sans toast)
        randomBtn.addEventListener('click', () => {
          randomizeSurveillantsAcrossRooms();
          snapshotRoomsFromModalAndSave();
          saveEstafettesAssign({});
          const estafettesData = computeEstafettesParBat(getSallesSnapshot(), staff, {});
          saveEstafettesAssign(Object.fromEntries([...estafettesData.estafettesMap.entries()]));
          renderEstafettePanel();
          renderReprisePanel(staff, estafettesData);
          colorizeShortages(estafettesData);
          updateRoomHeadChips();
        });
        // listeners basiques
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
          saveBuildings(arr); snapshotRoomsFromModalAndSave(); renderEstafettePanel();renderReprisePanel(); updateRoomHeadChips();
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
          snapshotRoomsFromModalAndSave(); renderEstafettePanel();renderReprisePanel(); updateRoomHeadChips();
        });
        document.getElementById('clear-all')?.addEventListener('click',()=>{
          document.querySelectorAll('.salle-nb').forEach(i=>i.value='');
          document.querySelectorAll('.room-desc').forEach(i=>i.value='');
          document.querySelectorAll('.room-building').forEach(i=>i.value='');
          document.querySelectorAll('.sv1,.sv2').forEach(s=>s.selectedIndex=-1);
          saveEstafettesAssign({}); snapshotRoomsFromModalAndSave(); renderEstafettePanel(); updateSum(); updateRoomHeadChips();
        });
        if (!document.getElementById('reprise-ui-fix')) {
          const st = document.createElement('style');
          st.id = 'reprise-ui-fix';
          st.textContent = `
            .reprise-box { padding:12px; }
            .reprise-head { font-weight:800; font-size:14px; }
            #reprise-grid { display:grid; grid-template-columns: 1fr 1fr; gap:10px 14px; align-items:start; }
            #reprise-grid .repr-col-title{ grid-column: span 1; text-align:center; font-weight:700; line-height:1.1; margin-bottom:2px; }
            #reprise-grid .repr-sel{ width:100%; min-width:160px; font-size:12px; padding:8px 10px; border:1px solid #cfd4dc; border-radius:10px; }
            #reprise-grid .hint{ grid-column: span 1; font-size:11px; color:#64748b; text-align:center; }
          `;
          document.head.appendChild(st);
        }
        document.addEventListener('change', (e)=>{
          if(e.target.matches('.sv1,.sv2,.room-building')){
            snapshotRoomsFromModalAndSave();
            renderEstafettePanel();
            renderReprisePanel();
            colorizeDuplicateSurveillants();
            updateRoomHeadChips();
          }
        });
        document.getElementById('btn-staff')?.addEventListener('click', async ()=>{ 
          await editerStaff(); 
          staff = loadStaff();
          buildSurveillantOptions(staff);
          colorizeDuplicateSurveillants();
          snapshotRoomsFromModalAndSave(); 
          renderEstafettePanel(); 
          renderReprisePanel();
          updateRoomHeadChips();
        });
        document.getElementById('btn-import-excel')?.addEventListener('click', async ()=>{ 
          const st=await importerPersonnelDepuisExcel(); 
          if(st){ 
            staff = st;
            buildSurveillantOptions(staff);
            colorizeDuplicateSurveillants();
            snapshotRoomsFromModalAndSave(); 
            renderEstafettePanel(); 
            renderReprisePanel();
            updateRoomHeadChips();
          }
        });
        document.getElementById('btn-import-paste')?.addEventListener('click', async ()=>{ 
          const st=await importerPersonnelDepuisColler(); 
          if(st){ 
            staff = st;
            buildSurveillantOptions(staff);
            colorizeDuplicateSurveillants();
            snapshotRoomsFromModalAndSave(); 
            renderEstafettePanel(); 
            renderReprisePanel();
            updateRoomHeadChips();
          }
        });
        if (!document.getElementById('personnel-css')) {
          const style = document.createElement('style'); style.id="personnel-css";
          style.textContent=` .sv1 option, .sv2 option { white-space: pre-wrap; max-width: 400px; } `;
          document.head.appendChild(style);
        }
        colorizeDuplicateSurveillants();
        // pré-sélection sauvegardée
        document.querySelectorAll('.room-card').forEach((card, i) => {
            const s1 = card.querySelector('.sv1');
            const s2 = card.querySelector('.sv2');
            const saved = activeRooms[i]?.surveillants || [];
            const savedLabels = saved.map(s => (typeof s === 'string') ? s : (s.label || `${s.grade} — ${s.name}`));
            if (savedLabels[0]) s1.value = savedLabels[0];
            if (savedLabels[1]) s2.value = savedLabels[1];
        });
        updateSum();
        renderEstafettePanel();
        renderReprisePanel();
        updateRoomHeadChips();
        Swal.getPopup().addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); Swal.clickConfirm(); }});
      },
      preConfirm: () => {
        const nbs=[...document.querySelectorAll('.salle-nb')];
        let firstInvalid=null; const out=[];
        const descs=[...document.querySelectorAll('.room-desc')];
        const bats=[...document.querySelectorAll('.room-building')];
        const cards=[...document.querySelectorAll('.room-card')];
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
  // (optionnel) Suggestion reprise non utilisée directement
  function computeSuggestedReprise(snapshot, staff, estafettesData) {
    const survUsed = new Set((snapshot || []).flatMap(s => s.surveillants || []).map(lbl => normName(nameFromLabel(lbl))).filter(Boolean));
    const usedEst = estafettesData?.usedEstafettes || new Set();
    const people = (staff?.surveillants || []).map(p => typeof p === 'string' ? parseSurveillantLine(p) : ({ grade:p.grade, name:p.name, label:p.label || `${p.grade} — ${p.name}` }))
      .filter(Boolean).filter(p => { const n=normName(p.name); return !survUsed.has(n) && !usedEst.has(n); });
    let seniors = 0, adjoints = 0;
    for (const p of people) {
      const g = String(p.grade || "").toUpperCase();
      if (GROUP_B.has(g)) seniors++; else if (GROUP_A.has(g)) adjoints++;
    }
    const out = [];
    const s = Math.min(seniors, 3);
    const a = Math.min(adjoints, 3);
    if (s > 0) out.push({ nom: "Réserve seniors (GPCE/GPHC/GP1C/GP2C)", nombre: s });
    if (a > 0) out.push({ nom: "Réserve adjoints (GHC/G1C/G2C/GST)", nombre: a });
    return out;
  }
  /******************************************************
   * 6) PERSONNEL — affectation final (export)
   ******************************************************/
  function affecterPersonnel(salles, staff){
    const savedAssign = loadEstafettesAssign();
    const estafettesData = computeEstafettesParBat(salles, staff, savedAssign);
    const estMap = estafettesData.estafettesMap;
    const estafettesParBatiment = Array.from(estMap.entries()).map(([batiment, estafettes])=>{
        const nbSalles = salles.filter(s => (_clean(s.batiment)||"—")===batiment).length;
        return { batiment, estafettes, nbSalles };
    });
    const missingSV = salles.reduce((acc,s)=> acc + Math.max(0, 2 - (Array.isArray(s.surveillants)?s.surveillants.length:0)), 0);
    const alerts=[]; if(missingSV>0) alerts.push(`Salles sans 2 surveillants: ${missingSV}.`);
    return { salles, estafettesParBatiment, alerts, estafettesData };
  }
  /******************************************************
   * 7) RÉPARTITION ÉLÈVES
   ******************************************************/
  async function genererRepartitionDepuisCartes(eleves, cartes, exclusionsDict = {}) {
    // 1) Sécuriser l'entrée élèves
    const rawEleves = Array.isArray(eleves) ? eleves : [];
    const cleanEleves = rawEleves.filter(e => e && typeof e === "object"); // supprime null/undefined/autres
    const exclusionSet = new Set(Object.keys(exclusionsDict || {}));
  
    // 2) Exclure + garder une liste propre
    const elevesExclus = [];
    const elevesFiltres = cleanEleves.filter(e => {
      const inc = (e.numeroIncorporation ?? "").toString().trim();
      if (inc && exclusionSet.has(inc)) {
        e.salle = exclusionsDict[inc] || "Non affecté";
        elevesExclus.push(e);
        return false;
      }
      return true;
    });
  
    // 3) Mélanger
    const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } };
    shuffle(elevesFiltres);
  
    // 4) Créer les pools par escadron (clé par défaut si manquant)
    const pools = {};
    for (const e of elevesFiltres) {
      const key = (e.escadron ?? "—").toString();   // ← évite undefined
      if (!pools[key]) pools[key] = [];
      pools[key].push(e);
    }
    // Mélanger chaque pool
    Object.keys(pools).forEach(k => shuffle(pools[k]));
  
    // 5) Remplissage des salles
    const salles = [];
    const restants = [];
    (cartes || []).forEach(({ numero, capacite, description, batiment, surveillants }) => {
      const salle = [];
      const quotas = {};
  
      const round = (maxParEsc) => {
        let added = 0;
        const keys = Object.keys(pools).filter(k => pools[k].length > 0);
        shuffle(keys);
        for (const esc of keys) {
          if (salle.length >= (capacite || 0)) break;
          const q = quotas[esc] || 0;
          if (q < maxParEsc && pools[esc].length > 0) {
            const e = pools[esc].shift();
            if (e) {
              e.salle = numero;
              e.salleDesc = description || "";
              e.batiment = batiment || "";
              salle.push(e);
              quotas[esc] = q + 1;
              added++;
            }
          }
        }
        return added;
      };
  
      // 2/3/4 par escadron (selon places restantes)
      if (salle.length < capacite) round(1);
      if (salle.length < capacite) round(2);
      while (salle.length < capacite && round(3) > 0) {}
      while (salle.length < capacite && round(4) > 0) {}
  
      salles.push({
        numero,
        effectif: salle.length,
        eleves: salle,
        description: description || "",
        batiment: batiment || "",
        surveillants: surveillants || []
      });
    });
  
    // 6) Restants
    Object.values(pools).forEach(l => restants.push(...l));
    shuffle(restants);
    if (restants.length > 0) {
      restants.forEach(e => { e.salle = "Reste"; e.batiment = ""; });
      salles.push({ numero: "Reste", effectif: restants.length, eleves: restants, description: "" });
    }
  
    // 7) Estafettes + export
    const staff = loadStaff();
    const { estafettesParBatiment, alerts } = affecterPersonnel(salles, staff);
    if (alerts.length) console.warn(alerts.join(" | "));
    checkNoDoublonSurvEstaf(salles, estafettesParBatiment);
  
    const tousEleves = [...salles.flatMap(s => s.eleves), ...elevesExclus];
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
   * 8) EXPORT EXCEL
   ******************************************************/
  function sanitizeSheetName(name){ return String(name).replace(/[:\\/?*\[\]]/g,'').slice(0,31); }
  function uniqueSheetName(wb, base){ let name=sanitizeSheetName(base); let i=2; while(wb.SheetNames.includes(name)){ name=sanitizeSheetName(`${base.slice(0,28)}_${i++}`); } return name; }
  async function exporterVersExcel(tousEleves, salles, elevesExclus = [], estafettesParBatiment = []) {
    const wb = XLSX.utils.book_new();
  
    /* ------------------------ Résumé ------------------------ */
    const repartitionParSalle = (salles || []).map(s => {
      const lib = s.numero === "Reste"
        ? "Salle Reste"
        : (s.description ? `Salle ${s.numero} (${s.description})` : `Salle ${s.numero}`);
      const nb  = typeof s.effectif === "number" ? s.effectif : ((s.eleves || []).length);
      const bat = s.batiment ? ` [Bâtiment ${s.batiment}]` : "";
      return `${lib}${bat} : ${nb} élèves`;
    });
  
    const escadrons = [...new Set(
      (Array.isArray(tousEleves) ? tousEleves : [])
        .filter(e => e && typeof e === "object" && e.escadron != null && String(e.escadron).trim() !== "")
        .map(e => String(e.escadron))
    )].sort((a, b) => (+a || 0) - (+b || 0));
  
    const repartitionParEscadron = escadrons.map(esc => {
      const n = (tousEleves || []).filter(e => (e && String(e.escadron) === esc)).length;
      return `Escadron ${esc} : ${n} élèves`;
    });
  
    const exclMap = new Map();
    (elevesExclus || []).forEach(e => {
      const inc   = String(e.numeroIncorporation ?? "").trim() || "(?)";
      const motif = String(e.salle ?? "Exclu").trim();
      const key   = `${inc} — ${motif}`;
      exclMap.set(key, (exclMap.get(key) || 0) + 1);
    });
    const exclusionsLignes = [...exclMap].map(([k, n]) => n > 1 ? `${k} (${n})` : k);
  
    const resumeData = [
      { Clé: "Total élèves",      Valeur: (tousEleves || []).length },
      { Clé: "Nombre de salles",  Valeur: (salles || []).length },
      { Clé: "",                  Valeur: "" },
      { Clé: "Répartition par salle", Valeur: "" },
      ...repartitionParSalle.map(line => ({ Clé: "", Valeur: line })),
      { Clé: "", Valeur: "" },
      { Clé: "Surveillants",      Valeur: "Voir feuille « Surveillants »" },
      { Clé: "", Valeur: "" },
      { Clé: "Estafettes par bâtiment", Valeur: "" },
      ...(estafettesParBatiment || []).map(b => ({
        Clé: "", Valeur: `${b.batiment || "—"} : ${(b.estafettes || []).join(", ") || "—"} (${b.nbSalles} salle(s))`
      })),
      { Clé: "", Valeur: "" },
      { Clé: "Répartition par escadron", Valeur: "" },
      ...repartitionParEscadron.map(line => ({ Clé: "", Valeur: line })),
      ...(exclusionsLignes.length
        ? [{ Clé: "", Valeur: "" }, { Clé: "Exclusions (incorporation : motif)", Valeur: "" },
           ...exclusionsLignes.map(line => ({ Clé: "", Valeur: line }))]
        : [])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumeData, { skipHeader: true }), "Résumé");
  
  /* ------------------------ Feuilles par salle (avec colonne SEXE = M/F) ------------------------ */
(salles || []).forEach(salle => {
  // Helper : normaliser le sexe en M / F
  const normalizeSex = (val) => {
    const s = String(val ?? "")
      .toLowerCase()
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .trim();
    if (!s) return "";
    if (/^(m|masc|masculin|male|homme|h|garcon|g|boy|1)$/.test(s)) return "M";
    if (/^(f|fem|feminin|female|femme|fille|girl|2)$/.test(s)) return "F";
    return "";
  };

  // Ajout de "Sexe" dans l'en-tête
  const header = ["NR", "Nom", "Prénom", "Sexe", "Escadron", "Peloton", "Incorporation", "Salle", "Bâtiment"];
  const titre  = (salle.numero === "Reste" ? "SALLE RESTE" : `SALLE ${salle.numero}`).toUpperCase();
  const aoa    = [];
  const merges = [];

  // Titre + éventuelle description
  aoa.push([titre]);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } });

  if (salle.description && salle.numero !== "Reste") {
    aoa.push([String(salle.description).toUpperCase()]);
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: header.length - 1 } });
  } else {
    aoa.push([]);
  }

  // Surveillants en haut
  (salle.surveillants || []).forEach(lab => {
    const grade = gradeFromLabel(lab);
    const nom   = nameFromLabel(lab);
    aoa.push([grade, nom]);
  });

  aoa.push([]);
  aoa.push(header);

  // Tri des élèves par numéro d'incorporation (comme avant)
  const eleves = (salle.eleves || []).slice()
    .sort((a, b) => (+a.numeroIncorporation || 0) - (+b.numeroIncorporation || 0));

  // Ligne élève (Sexe normalisé en M/F)
  eleves.forEach((e, idx) => {
    const sexe = normalizeSex(e?.sexe ?? e?.SEXE ?? e?.genre ?? e?.Genre ?? "");
    aoa.push([
      idx + 1,
      e?.nom || "",
      e?.prenom || "",
      sexe,                          // <-- M ou F uniquement
      e?.escadron ?? "",
      e?.peloton ?? "",
      e?.numeroIncorporation ?? "",
      (salle.numero === "Reste" ? "Reste" : salle.numero),
      salle?.batiment || ""
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"]   = [
    { wpx: 38 },  // NR
    { wpx: 200 }, // Nom
    { wpx: 180 }, // Prénom
    { wpx: 60 },  // Sexe (M/F)
    { wpx: 80 },  // Escadron
    { wpx: 80 },  // Peloton
    { wpx: 120 }, // Incorporation
    { wpx: 65 },  // Salle
    { wpx: 90 }   // Bâtiment
  ];

  const base = salle.numero === "Reste"
    ? "Salle Reste"
    : (salle.description ? `Salle ${salle.numero} - ${salle.description}` : `Salle ${salle.numero}`);

  XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName(wb, base));
});

  
    /* ------------------------ Feuilles par ESCADRON (tri: Incorporation puis Peloton) ------------------------ */
  /* ------------------------ Feuilles par ESCADRON (tri: Peloton puis Incorporation) ------------------------ */
{
  // Aplatit tous les élèves affectés (avec leur salle/bâtiment)
  const assignes = [];
  (salles || []).forEach(salle => {
    (salle.eleves || []).forEach(e => {
      assignes.push({
        nom: e?.nom || "",
        prenom: e?.prenom || "",
        escadron: e?.escadron ?? "",
        peloton: e?.peloton ?? "",
        numeroIncorporation: e?.numeroIncorporation ?? "",
        _salle: (salle.numero === "Reste" ? "Reste" : salle.numero),
        _bat: salle.batiment || ""
      });
    });
  });

  // Liste unique des escadrons présents (1,2,3,...) triés croissant
  const escSet = [...new Set(
    assignes.map(e => String(e.escadron)).filter(s => s.trim() !== "")
  )].sort((a, b) => (+a || 0) - (+b || 0));

  // Helper nombre (gère valeurs vides)
  const num = v => {
    const s = String(v ?? "").replace(/\D/g, "");
    return s ? parseInt(s, 10) : Number.POSITIVE_INFINITY;
  };

  // Une feuille par escadron
  escSet.forEach(esc => {
    // Tri: Peloton -> Incorporation -> Nom -> Prénom
    const list = assignes
      .filter(e => String(e.escadron) === String(esc))
      .sort((a, b) =>
        num(a.peloton) - num(b.peloton) ||
        num(a.numeroIncorporation) - num(b.numeroIncorporation) ||
        (a.nom || "").localeCompare(b.nom || "", 'fr', { sensitivity: 'base' }) ||
        (a.prenom || "").localeCompare(b.prenom || "", 'fr', { sensitivity: 'base' })
      );

    // Feuille Escadron X
    const aoa = [["NR", "Nom", "Prénom", "Peloton", "Incorporation", "Salle", "Bâtiment"]];
    list.forEach((e, i) => {
      aoa.push([
        i + 1,
        e.nom,
        e.prenom,
        e.peloton,
        e.numeroIncorporation,
        e._salle,
        e._bat
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [
      { wpx: 38 },  // NR
      { wpx: 200 }, // Nom
      { wpx: 180 }, // Prénom
      { wpx: 80 },  // Peloton
      { wpx: 120 }, // Incorporation
      { wpx: 65 },  // Salle
      { wpx: 90 }   // Bâtiment
    ];
    XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName(wb, `Escadron ${esc}`));
  });
}

    /* ------------------------ Surveillants (feuille historique conservée) ------------------------ */
    {
      const aoa = [["NR", "GRADE", "NOM ET PRENOMS", "MLE", "NR TPH", "UNITE", "SALLE"]];
      let nr = 1;
  
      const sallesOrdre = [...salles].sort((a, b) =>
        (a.numero === "Reste" ? 1e9 : +a.numero) - (b.numero === "Reste" ? 1e9 : +b.numero)
      );
  
      const surveillantToSalle = new Map();
      sallesOrdre.forEach(salle => {
        (salle.surveillants || []).forEach(label => {
          const nom = normName(nameFromLabel(label));
          surveillantToSalle.set(nom, salle.numero === "Reste" ? "Reste" : salle.numero);
        });
      });
  
      const staff = loadStaff();
      const staffData = new Map();
      [...(staff?.surveillants || []), ...(staff?.estafettes || [])].forEach(person => {
        const nom = normName(person.name);
        staffData.set(nom, { mle: person.mle || "", nrTph: person.nrTph || "", unite: person.unite || "" });
      });
  
      sallesOrdre.forEach(salle => {
        (salle.surveillants || []).forEach(label => {
          const nomComplet = nameFromLabel(label);
          const nomNormalise = normName(nomComplet);
          const salleAssignee = surveillantToSalle.get(nomNormalise) || "";
          const info = staffData.get(nomNormalise) || {};
          aoa.push([ nr++, gradeFromLabel(label), nomComplet, info.mle || "", info.nrTph || "", info.unite || "", salleAssignee ]);
        });
      });
  
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [
        { wpx: 42 }, { wpx: 55 }, { wpx: 235 }, { wpx: 80 },
        { wpx: 105 }, { wpx: 90 }, { wpx: 55 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Surveillants");
    }
  
    /* ------------------------ Surveillants (par MLE) ------------------------ */
    {
      const sallesOrdre = [...salles].sort((a, b) =>
        (a.numero === "Reste" ? 1e9 : +a.numero) - (b.numero === "Reste" ? 1e9 : +b.numero)
      );
  
      const surveillantToSalle = new Map();
      sallesOrdre.forEach(salle => {
        (salle.surveillants || []).forEach(label => {
          const n = normName(nameFromLabel(label));
          surveillantToSalle.set(n, salle.numero === "Reste" ? "Reste" : salle.numero);
        });
      });
  
      const staff = loadStaff();
      const staffData = new Map();
      [...(staff?.surveillants||[]), ...(staff?.estafettes||[])].forEach(p => {
        const n = normName(p.name);
        staffData.set(n, { mle: p.mle || "", nrTph: p.nrTph || "", unite: p.unite || "" });
      });
  
      const rows = [];
      sallesOrdre.forEach(salle => {
        (salle.surveillants || []).forEach(label => {
          const fullName = nameFromLabel(label);
          const grade = gradeFromLabel(label);
          const n = normName(fullName);
          const info = staffData.get(n) || {};
          rows.push({
            GRADE: grade, NOM: fullName, MLE: info.mle || "",
            TPH: info.nrTph || "", UNITE: info.unite || "",
            SALLE: surveillantToSalle.get(n) || ""
          });
        });
      });
  
      const numMLE = v => {
        const s = String(v || "").replace(/\D/g, "");
        return s ? parseInt(s, 10) : NaN;
      };
      rows.sort((a, b) => {
        const ma = numMLE(a.MLE), mb = numMLE(b.MLE);
        if (isNaN(ma) && isNaN(mb)) return a.NOM.localeCompare(b.NOM, 'fr', {sensitivity:'base'});
        if (isNaN(ma)) return 1;
        if (isNaN(mb)) return -1;
        return ma - mb || a.NOM.localeCompare(b.NOM, 'fr', {sensitivity:'base'});
      });
  
      const aoa = [["NR","GRADE","NOM ET PRENOMS","MLE","NR TPH","UNITE","SALLE"]];
      rows.forEach((r, i) => aoa.push([i+1, r.GRADE, r.NOM, r.MLE, r.TPH, r.UNITE, r.SALLE]));
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [
        {wpx:42},{wpx:55},{wpx:260},{wpx:80},{wpx:105},{wpx:90},{wpx:55}
      ];
      XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName(wb, "Surveillants (par MLE)"));
    }
  
    /* ------------------------ À reprendre ------------------------ */
 /* ------------------------ À reprendre (détaillée) ------------------------ */
{
  const reprise = loadReprise();

  // Récup infos MLE/TPH/UNITE depuis le staff
  const staff = loadStaff();
  const staffData = new Map();
  [...(staff?.surveillants || []), ...(staff?.estafettes || [])].forEach(p => {
    const key = normName(p.name);
    staffData.set(key, {
      mle:   p.mle   || "",
      nrTph: p.nrTph || "",
      unite: p.unite || ""
    });
  });

  // Nouveau format (objet { adjoints:[], seniors:[] } ) -> tableau détaillé
  if (reprise && typeof reprise === 'object' &&
      (Array.isArray(reprise.adjoints) || Array.isArray(reprise.seniors))) {

    const lignes = [];
    (reprise.adjoints || []).filter(Boolean).forEach(lab => lignes.push({ cat: "Adjoint", lab }));
    (reprise.seniors  || []).filter(Boolean).forEach(lab => lignes.push({ cat: "Senior",  lab }));

    const aoa = [["NR","Catégorie","GRADE","NOM ET PRENOMS","MLE","NR TPH","UNITE"]];
    lignes.forEach((row, i) => {
      const grade = gradeFromLabel(row.lab);
      const nom   = nameFromLabel(row.lab);
      const info  = staffData.get(normName(nom)) || {};
      aoa.push([ i + 1, row.cat, grade, nom, info.mle, info.nrTph, info.unite ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [
      { wpx: 38 },  // NR
      { wpx: 90 },  // Catégorie
      { wpx: 55 },  // GRADE
      { wpx: 260 }, // NOM ET PRENOMS
      { wpx: 80 },  // MLE
      { wpx: 105 }, // NR TPH
      { wpx: 90 }   // UNITE
    ];
    XLSX.utils.book_append_sheet(wb, ws, "À reprendre");

  } else {
    // Ancien format (liste [{nom, nombre}]) -> on garde le fallback simple
    let aoa = [["Nom", "Nombre"]];
    (reprise || []).forEach(r => {
      if ((r.nom || "").trim() || +r.nombre > 0) aoa.push([r.nom, +r.nombre || ""]);
    });
    if (aoa.length === 1) aoa.push(["—",""]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wpx: 160 }, { wpx: 80 }];
    XLSX.utils.book_append_sheet(wb, ws, "À reprendre");
  }
}

  
    /* ------------------------ Estafettes (par bâtiment — historique) ------------------------ */
    {
      const aoa = [["NR", "Bâtiment", "Nb salles", "Estafettes"]];
      (estafettesParBatiment || []).forEach((b, i) => {
        aoa.push([i + 1, b.batiment || "—", b.nbSalles || 0, (b.estafettes || []).join(", ")]);
      });
      if (aoa.length === 1) aoa.push(["—", "—", "—", "—"]);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [{ wpx: 40 }, { wpx: 110 }, { wpx: 80 }, { wpx: 400 }];
      XLSX.utils.book_append_sheet(wb, ws, "Estafettes");
    }
  
    /* ------------------------ Estafettes (par MLE) ------------------------ */
    {
      const flat = [];
      (estafettesParBatiment || []).forEach(b => {
        (b.estafettes || []).forEach(label => {
          flat.push({ bat: b.batiment || "—", label });
        });
      });
  
      const staff = loadStaff();
      const staffData = new Map();
      [...(staff?.surveillants||[]), ...(staff?.estafettes||[])].forEach(p => {
        const n = normName(p.name);
        staffData.set(n, { mle: p.mle || "", nrTph: p.nrTph || "", unite: p.unite || "" });
      });
  
      const rows = flat.map(({bat, label}) => {
        const fullName = nameFromLabel(label);
        const grade = gradeFromLabel(label);
        const n = normName(fullName);
        const info = staffData.get(n) || {};
        return {
          GRADE: grade, NOM: fullName, MLE: info.mle || "",
          TPH: info.nrTph || "", UNITE: info.unite || "", BAT: bat
        };
      });
  
      const numMLE = v => {
        const s = String(v || "").replace(/\D/g, "");
        return s ? parseInt(s, 10) : NaN;
      };
      rows.sort((a, b) => {
        const ma = numMLE(a.MLE), mb = numMLE(b.MLE);
        if (isNaN(ma) && isNaN(mb)) return a.NOM.localeCompare(b.NOM, 'fr', {sensitivity:'base'});
        if (isNaN(ma)) return 1;
        if (isNaN(mb)) return -1;
        return ma - mb || a.NOM.localeCompare(b.NOM, 'fr', {sensitivity:'base'});
      });
  
      const aoa = [["NR","GRADE","NOM ET PRENOMS","MLE","NR TPH","UNITE","BATIMENT"]];
      rows.forEach((r, i) => aoa.push([i+1, r.GRADE, r.NOM, r.MLE, r.TPH, r.UNITE, r.BAT]));
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [
        {wpx:42},{wpx:55},{wpx:260},{wpx:80},{wpx:105},{wpx:90},{wpx:90}
      ];
      XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName(wb, "Estafettes (par MLE)"));
    }
  
    /* ------------------------ Exclus (optionnel) ------------------------ */
    if ((elevesExclus || []).length) {
      const data = elevesExclus.map((e, idx) => ({
        NR: idx + 1,
        Nom: e.nom || "",
        "Prénom": e.prenom || "",
        Escadron: e.escadron || "",
        Peloton: e.peloton || "",
        Incorporation: e.numeroIncorporation || "",
        Motif: e.salle || ""
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Exclus");
    }
  
    /* ------------------------ Écriture du fichier ------------------------ */
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "repartition_salles.xlsx");
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
          const d=r.description?` (${r.description})`:''; const b=r.batiment?` [Bâtiment ${r.batiment}]`:''; const sv=Array.isArray(r.surveillants)&&r.surveillants.length?` — SV: ${r.surveillants.join(", ")}`:'';
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
