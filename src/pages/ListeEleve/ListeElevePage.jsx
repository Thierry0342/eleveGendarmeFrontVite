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
  rooms: 'repartition_rooms_v1',            // [{numero, capacite}, ...]
  exclusions: 'repartition_exclusions_v1',  // [{numero, motif}, ...]
};

function saveRooms(rooms) {
  try { localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms || [])); } catch (e) {}
}
function loadRooms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.rooms);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function clearRooms() {
  try { localStorage.removeItem(STORAGE_KEYS.rooms); } catch (e) {}
}

function saveExclusions(exclusions) {
  try { localStorage.setItem(STORAGE_KEYS.exclusions, JSON.stringify(exclusions || [])); } catch (e) {}
}
function loadExclusions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.exclusions);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function clearExclusions() {
  try { localStorage.removeItem(STORAGE_KEYS.exclusions); } catch (e) {}
}

/******************************************************
 * 1) Modal EXCLUSIONS (simple & efficace)
 ******************************************************/
async function exclureIncorporations() {
  // CSS minimal pour un rendu propre
  if (!document.getElementById("exclu-css-min")) {
    const s = document.createElement("style");
    s.id = "exclu-css-min";
    s.textContent = `
      .exclu-wrap { display:flex; flex-direction:column; gap:10px; }
      .exclu-tools { display:flex; gap:8px; flex-wrap:wrap; }
      .exclu-tools input { padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; outline:none; }
      .exclu-btn { padding:8px 12px; border:none; border-radius:8px; cursor:pointer; background:#3b82f6; color:#fff; }
      .exclu-btn.ghost { background:#e5e7eb; color:#111827; }
      .exclu-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:8px; max-height:360px; overflow:auto; }
      .ex-row { display:flex; gap:6px; padding:8px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; }
      .ex-row input { flex:1; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; outline:none; }
      .ex-row .rm { width:34px; border:1px solid #e5e7eb; border-radius:8px; background:#f3f4f6; cursor:pointer; }
      .ex-invalid { border-color:#ef4444 !important; background:#fff1f2 !important; }
      .ex-foot { font-size:12px; color:#475569; display:flex; justify-content:space-between; }
    `;
    document.head.appendChild(s);
  }

  const rowHTML = (num = "", mot = "") => `
    <div class="ex-row">
      <input class="incorp" placeholder="Incorporation ex: 123" value="${num}">
      <input class="motif"  placeholder="Motif ex: Cas médical" value="${mot}">
      <button type="button" class="rm" title="Supprimer">×</button>
    </div>
  `;

  const html = `
    <div class="exclu-wrap">
      <div class="exclu-tools">
        <input id="bulk-inc"  placeholder="Coller plusieurs incorporations (séparées par , ; espace ou retour)">
        <input id="bulk-motif" placeholder="Motif par défaut (optionnel)">
        <button type="button" id="btn-add"   class="exclu-btn">+ Ajouter</button>
        <button type="button" id="btn-paste" class="exclu-btn">Coller → Ajouter</button>
        <button type="button" id="btn-clear" class="exclu-btn ghost">Vider</button>
      </div>
      <div id="rows" class="exclu-grid">
        ${rowHTML()}
      </div>
      <div class="ex-foot">
        <span>Astuce : Entrée = valider • Échap = annuler</span>
        <span id="count">1 ligne</span>
      </div>
    </div>
  `;

  const res = await Swal.fire({
    title: "Exclure des incorporations",
    html,
    width: 820,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Valider",
    didOpen: () => {
      const rows = document.getElementById("rows");
      const count = document.getElementById("count");
      const upd = () => {
        const n = rows.querySelectorAll(".ex-row").length;
        count.textContent = `${n} ${n > 1 ? "lignes" : "ligne"}`;
      };

      document.getElementById("btn-add").addEventListener("click", () => {
        rows.insertAdjacentHTML("beforeend", rowHTML());
        upd();
      });

      document.getElementById("btn-paste").addEventListener("click", () => {
        const raw = (document.getElementById("bulk-inc").value || "").trim();
        const defMotif = (document.getElementById("bulk-motif").value || "").trim();
        if (!raw) return;
        const tokens = raw.split(/[\s,;]+/).filter(Boolean);
        tokens.forEach(t => rows.insertAdjacentHTML("beforeend", rowHTML(t, defMotif)));
        upd();
      });

      document.getElementById("btn-clear").addEventListener("click", () => {
        rows.innerHTML = rowHTML();
        upd();
      });

      rows.addEventListener("click", (e) => {
        const btn = e.target.closest(".rm");
        if (!btn) return;
        const row = btn.closest(".ex-row");
        if (!row) return;
        if (rows.querySelectorAll(".ex-row").length > 1) {
          row.remove(); upd();
        }
      });

      Swal.getPopup().addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); Swal.clickConfirm(); }
      });

      upd();
    },
    preConfirm: () => {
      const rows = [...document.querySelectorAll("#rows .ex-row")];
      let valid = true;
      const map = new Map(); // déduplique

      rows.forEach(r => {
        const inc = r.querySelector(".incorp");
        const mot = r.querySelector(".motif");
        inc.classList.remove("ex-invalid");
        mot.classList.remove("ex-invalid");

        const numero = (inc.value || "").trim();
        const motif  = (mot.value || "").trim();

        if (!/^\d+$/.test(numero)) { inc.classList.add("ex-invalid"); valid = false; }
        if (!motif)               { mot.classList.add("ex-invalid"); valid = false; }
        if (valid) map.set(numero, motif);
      });

      if (!valid) {
        Swal.showValidationMessage("Veuillez corriger les champs en rouge.");
        return false;
      }
      return Array.from(map.entries()).map(([numero, motif]) => ({ numero, motif }));
    }
  });

  const out = res.isConfirmed ? (res.value || []) : [];
  saveExclusions(out); // mémorise
  return out;
}

/******************************************************
 * 2) Modal CAPACITÉS (pré-rempli + joli) + persistance
 ******************************************************/
async function ajouterSallesViaModal(eleves, exclusions = []) {
  // recharge éventuelle (capacité + description)
  const savedRooms = loadRooms(); // [{numero, capacite, description?}]
  let nbSalles = savedRooms.length;

  if (!nbSalles) {
    const { value } = await Swal.fire({
      title: "Combien de salles ?",
      input: "number",
      inputLabel: "Nombre total de salles",
      inputPlaceholder: "Ex : 40",
      allowOutsideClick: false,
      preConfirm: (val) => {
        const n = parseInt(val, 10);
        if (isNaN(n) || n <= 0) {
          Swal.showValidationMessage("Nombre invalide.");
          return false;
        }
        return n;
      }
    });
    if (!value) return;
    nbSalles = value;
  }

  // CSS (si pas déjà injecté)
  if (!document.getElementById("swal-repart-css")) {
    const style = document.createElement("style");
    style.id = "swal-repart-css";
    style.textContent = `
      .swal2-popup.repart-popup { padding: 18px 20px 16px; }
      .repart-toolbar{ display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap; }
      .repart-toolbar-left{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      .repart-toolbar-left input{ width:190px; padding:8px 10px; border:1px solid #cfd4dc; border-radius:10px; outline:none; }
      .btn-chip{ padding:8px 12px; border-radius:10px; border:none; cursor:pointer; background:#3b82f6; color:#fff; box-shadow:0 1px 2px rgba(0,0,0,.06); }
      .btn-chip.alt{ background:#6366f1; }
      .btn-chip.ghost{ background:#e5e7eb; color:#111827; }
      .repart-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px; max-height:420px; overflow:auto; padding-right:2px; }
      .room-card{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:12px; display:flex; flex-direction:column; gap:10px; box-shadow:0 1px 3px rgba(16,24,40,.06); transition:transform .08s ease, box-shadow .1s ease; }
      .room-card:hover{ transform:translateY(-1px); box-shadow:0 6px 16px rgba(16,24,40,.08); }
      .room-head{ display:flex; align-items:center; justify-content:center; }
      .room-badge{ font-weight:700; font-size:13px; line-height:1; background:#eef2ff; color:#4338ca; padding:6px 10px; border-radius:999px; border:1px solid #c7d2fe; }
      .room-input-group{ display:flex; align-items:center; gap:8px; justify-content:center; }
      .room-input-group input.salle-nb{ width:92px; text-align:center; padding:10px 8px; border:1px solid #cfd4dc; border-radius:10px; font-weight:700; outline:none; transition:border-color .15s ease, background .15s ease; }
      .room-input-group input.salle-nb.invalid{ border-color:#ef4444; background:#fff1f2; }
      .btn-inc,.btn-dec{ width:34px; height:34px; border-radius:10px; border:1px solid #e5e7eb; cursor:pointer; background:#f3f4f6; font-size:18px; font-weight:700; line-height:1; display:flex; align-items:center; justify-content:center; transition:background .12s ease, transform .08s ease; }
      .btn-inc:hover,.btn-dec:hover{ background:#e5e7eb; }
      .btn-inc:active,.btn-dec:active{ transform:scale(.98); }
      .room-desc{ width:100%; padding:8px 10px; border:1px solid #cfd4dc; border-radius:10px; outline:none; }
      .repart-footer{ display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding:8px 10px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; font-size:13px; color:#334155; }
      .footer-kpi{ display:flex; gap:12px; align-items:center; }
      .kpi{ background:#eef2ff; color:#3730a3; border:1px solid #c7d2fe; padding:6px 10px; border-radius:10px; font-weight:700; }
    `;
    document.head.appendChild(style);
  }

  // Cartes (capacité + description)
  const cards = Array.from({ length: nbSalles }, (_, i) => {
    const cap  = savedRooms[i]?.capacite ?? "";
    const desc = savedRooms[i]?.description ?? "";
    return `
      <div class="room-card">
        <div class="room-head">
          <span class="room-badge">Salle ${i + 1}</span>
        </div>
        <div class="room-input-group">
          <button class="btn-dec" type="button" data-idx="${i}">−</button>
          <input class="salle-nb" type="number" min="1" inputmode="numeric" placeholder="Nb élèves" data-idx="${i}" value="${cap}">
          <button class="btn-inc" type="button" data-idx="${i}">+</button>
        </div>
        <input class="room-desc" type="text" placeholder="Description (ex: Salle 11, Réfectoire Nord…)" data-idx="${i}" value="${desc}">
      </div>
    `;
  }).join("");

  const toolbar = `
    <div class="repart-toolbar">
      <div class="repart-toolbar-left">
        <input id="cap-def"  type="number" min="1" placeholder="Capacité par défaut" />
        <button id="apply-all"     class="btn-chip">Appliquer à toutes</button>
        <input id="desc-def" type="text" placeholder="Description par défaut" />
        <button id="apply-desc-all" class="btn-chip alt">Appliquer descriptions</button>
        <button id="clear-all"     class="btn-chip ghost">Tout vider</button>
      </div>
      <div style="font-size:12px;color:#6b7280">Entrée : valider • Échap : annuler</div>
    </div>
  `;
  const footer = `
    <div class="repart-footer">
      <div class="footer-kpi">
        <span>Total saisi : <span id="sum-cap" class="kpi">0</span></span>
        ${Array.isArray(eleves) ? `<span>Élèves dispo : <span class="kpi">${eleves.length}</span></span>` : ``}
        <span>Salles : <span class="kpi">${nbSalles}</span></span>
      </div>
      <div style="font-size:12px;color:#6b7280">Astuce : utilisez les boutons +/−</div>
    </div>
  `;

  const result = await Swal.fire({
    title: "Effectif & descriptions des salles",
    html: `${toolbar}<div class="repart-grid">${cards}</div>${footer}`,
    width: 960,
    focusConfirm: false,
    allowOutsideClick: false,
    customClass: { popup: "repart-popup" },
    showCancelButton: true,
    confirmButtonText: "Valider Répartition",
    didOpen: () => {
      const inputs = [...document.querySelectorAll(".salle-nb")];
      const sumEl  = document.getElementById("sum-cap");
      const total  = Array.isArray(eleves) ? eleves.length : null;

      const updateSum = () => {
        const sum = inputs.reduce((acc, inp) => acc + (parseInt(inp.value, 10) || 0), 0);
        if (sumEl) {
          sumEl.textContent = sum;
          if (total != null) {
            sumEl.style.background = sum < total ? '#fee2e2' : (sum > total ? '#fef9c3' : '#dcfce7');
            sumEl.style.color = '#111827';
          }
        }
      };

      document.querySelectorAll(".btn-inc").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = btn.getAttribute("data-idx");
          const inp = document.querySelector(`.salle-nb[data-idx="${idx}"]`);
          const v = Math.max(0, parseInt(inp.value || "0", 10)) + 1;
          inp.value = v;
          inp.classList.remove("invalid");
          updateSum();
        });
      });
      document.querySelectorAll(".btn-dec").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = btn.getAttribute("data-idx");
          const inp = document.querySelector(`.salle-nb[data-idx="${idx}"]`);
          const v = Math.max(0, parseInt(inp.value || "0", 10) - 1);
          inp.value = v || "";
          inp.classList.remove("invalid");
          updateSum();
        });
      });

      inputs.forEach(inp => {
        inp.addEventListener("input", () => { inp.classList.remove("invalid"); updateSum(); });
        inp.addEventListener("wheel", e => e.preventDefault(), { passive:false });
      });

      document.getElementById("apply-all")?.addEventListener("click", () => {
        const v = parseInt(document.getElementById("cap-def").value, 10);
        if (!isNaN(v) && v > 0) { inputs.forEach(inp => inp.value = v); updateSum(); }
      });
      document.getElementById("apply-desc-all")?.addEventListener("click", () => {
        const d = document.getElementById("desc-def").value || "";
        document.querySelectorAll(".room-desc").forEach(inp => inp.value = d);
      });
      document.getElementById("clear-all")?.addEventListener("click", () => {
        inputs.forEach(inp => inp.value = "");
        document.querySelectorAll(".room-desc").forEach(inp => inp.value = "");
        updateSum();
      });

      Swal.getPopup().addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); Swal.clickConfirm(); }
      });

      updateSum();
    },
    preConfirm: () => {
      const nbs   = [...document.querySelectorAll(".salle-nb")];
      const descs = [...document.querySelectorAll(".room-desc")];
      let firstInvalid = null;
      const out = [];

      for (let i = 0; i < nbs.length; i++) {
        const inp = nbs[i];
        inp.classList.remove("invalid");
        const v = parseInt(inp.value, 10);
        if (isNaN(v) || v < 1) {
          inp.classList.add("invalid");
          if (!firstInvalid) firstInvalid = inp;
        } else {
          const description = (descs[i]?.value || "").trim();
          out.push({ numero: i + 1, capacite: v, description });
        }
      }

      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        Swal.showValidationMessage("Chaque salle doit avoir au moins 1 élève.");
        return false;
      }
      return out;
    }
  });

  const salles = result.isConfirmed ? result.value : null;
  if (salles && Array.isArray(eleves)) {
    saveRooms(salles); // maintenant avec description
    await genererRepartitionDepuisCartes(eleves, salles, exclusions);
  }
}


/******************************************************
 * 4) RÉPARTITION (min 2 / max 3, parfois 4) + EXCLUSIONS
 ******************************************************/
async function genererRepartitionDepuisCartes(eleves, cartes, exclusions = []) {
  // Normaliser exclusions (clé = numeroIncorporation sous forme de chaîne)
  const exclusionSet = new Set();
  const motifMap     = new Map();
  exclusions.forEach(({ numero, motif }) => {
    const key = String(numero).trim();
    exclusionSet.add(key);
    motifMap.set(key, motif);
  });

  const elevesExclus  = [];
  const elevesFiltres = eleves.filter(e => {
    const inc = String(e.numeroIncorporation).trim();
    if (exclusionSet.has(inc)) {
      e.salle = motifMap.get(inc) || "Non affecté";
      elevesExclus.push(e);
      return false;
    }
    return true;
  });

  // Mélange utilitaire
  const shuffleArray = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };
  shuffleArray(elevesFiltres);

  // Regrouper par escadron + mélanger chaque pool
  const pools = {};
  elevesFiltres.forEach(e => {
    if (!pools[e.escadron]) pools[e.escadron] = [];
    pools[e.escadron].push(e);
  });
  Object.keys(pools).forEach(k => shuffleArray(pools[k]));

  const salles   = [];
  const restants = [];

  // Remplissage par “tours” : 1 → 2 → 3 → 4 (si besoin)
  cartes.forEach(({ numero, capacite, description }) => {
    const salle  = [];
    const quotas = {};
  
    const round = (maxParEscadron) => {
      let added = 0;
      const keys = Object.keys(pools).filter(k => pools[k].length > 0);
      for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
      }
      for (const esc of keys) {
        if (salle.length >= capacite) break;
        const q = quotas[esc] || 0;
        if (q < maxParEscadron && pools[esc].length > 0) {
          const eleve = pools[esc].shift();
          if (eleve) {
            eleve.salle = numero;
            eleve.salleDesc = description || "";   // <-- description portée jusqu’à l’export
            salle.push(eleve);
            quotas[esc] = q + 1;
            added++;
          }
        }
      }
      return added;
    };
  
    if (salle.length < capacite) round(1);
    if (salle.length < capacite) round(2);
    while (salle.length < capacite && round(3) > 0) {}
    while (salle.length < capacite && round(4) > 0) {}
  
    salles.push({ numero, effectif: salle.length, eleves: salle, description: description || "" });
  });
  

  // Restants
  Object.values(pools).forEach(list => restants.push(...list));
  shuffleArray(restants);
  if (restants.length > 0) {
    restants.forEach(e => e.salle = "Reste");
    salles.push({ numero: "Reste", effectif: restants.length, eleves: restants });
  }

  const tousEleves = [...salles.flatMap(s => s.eleves), ...elevesExclus];

  await exporterVersExcel(tousEleves, salles, elevesExclus);
}

/******************************************************
 * 5) EXPORT EXCEL
 ******************************************************/
function sanitizeSheetName(name) {
  return String(name).replace(/[:\\/?*\[\]]/g, '').slice(0, 31);
}
function uniqueSheetName(wb, base) {
  let name = sanitizeSheetName(base);
  let i = 2;
  while (wb.SheetNames.includes(name)) {
    name = sanitizeSheetName(`${base.slice(0, 28)}_${i++}`);
  }
  return name;
}

async function exporterVersExcel(tousEleves, salles, elevesExclus = []) {
  const wb = XLSX.utils.book_new();

  /* ---------- 1) Résumé ---------- */
  const repartitionParSalle = salles.map(s => {
    const lib =
      s.numero === "Reste"
        ? "Salle Reste"
        : (s.description ? `Salle ${s.numero} (${s.description})` : `Salle ${s.numero}`);
    const nb = (typeof s.effectif === "number")
      ? s.effectif
      : (Array.isArray(s.eleves) ? s.eleves.length : 0);
    return `${lib} : ${nb} élèves`;
  });

  const escadronsList = [...new Set(tousEleves.map(e => e.escadron))]
    .filter(x => x !== undefined && x !== null && x !== "")
    .sort((a,b)=> (Number(a)||0) - (Number(b)||0));

  const repartitionParEscadron = escadronsList.map(esc => {
    const count = tousEleves.filter(e => e.escadron === esc).length;
    return `Escadron ${esc} : ${count} élèves`;
  });

  // ⬇️ NOUVEAU : récap exclusions “incorporation — motif”
  const exclMap = new Map(); // clé "inc — motif" → compteur
  if (Array.isArray(elevesExclus) && elevesExclus.length) {
    elevesExclus.forEach(e => {
      const inc   = (e.numeroIncorporation ?? "").toString().trim() || "(?)";
      const motif = (e.salle ?? "Exclu").toString().trim();
      const key   = `${inc} — ${motif}`;
      exclMap.set(key, (exclMap.get(key) || 0) + 1);
    });
  }
  const exclusionsLignes = [...exclMap.entries()].map(([k, n]) => n > 1 ? `${k} (${n})` : k);

  const resumeData = [
    { Clé: "Total élèves", Valeur: tousEleves.length },
    { Clé: "Nombre de salles", Valeur: salles.length },
    { Clé: "Répartition par salle", Valeur: "" },
    ...repartitionParSalle.map(line => ({ Clé: "", Valeur: line })),
    { Clé: "", Valeur: "" },
    { Clé: "Répartition par escadron", Valeur: "" },
    ...repartitionParEscadron.map(line => ({ Clé: "", Valeur: line })),
    ...(exclusionsLignes.length
      ? [
          { Clé: "", Valeur: "" },
          { Clé: "Exclusions (incorporation : motif)", Valeur: "" },
          ...exclusionsLignes.map(line => ({ Clé: "", Valeur: line })),
        ]
      : [])
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(resumeData),
    "Résumé"
  );

  /* ---------- 2) Feuilles par salle (Titre fusionné + tri par Incorporation) ---------- */
  salles.forEach((salle) => {
    const header = ["NR","Nom","Prénom","Escadron","Peloton","Incorporation","Salle (num)"];

    const titre = (salle.numero === "Reste"
      ? "SALLE RESTE"
      : `SALLE ${salle.numero}`).toUpperCase();

    const aoa = [];
    const merges = [];

    // Ligne 1 : titre fusionné A1:G1
    aoa.push([titre]);
    merges.push({ s: { r:0, c:0 }, e: { r:0, c: header.length - 1 } });

    // Ligne 2 : description (si présente)
    if (salle.description && salle.numero !== "Reste") {
      aoa.push([String(salle.description).toUpperCase()]);
      merges.push({ s: { r:1, c:0 }, e: { r:1, c: header.length - 1 } });
    } else {
      aoa.push([]);
    }

    // Ligne entête
    aoa.push(header);

    const elevesTries = (salle.eleves || [])
      .slice()
      .sort((a,b) => (Number(a.numeroIncorporation)||0) - (Number(b.numeroIncorporation)||0));

    elevesTries.forEach((e, idx) => {
      aoa.push([
        idx + 1,
        e.nom || "",
        e.prenom || "",
        e.escadron ?? "",
        e.peloton ?? "",
        e.numeroIncorporation ?? "",
        (salle.numero === "Reste" ? "Reste" : salle.numero)
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = merges;
    ws["!cols"] = [
      { wpx: 40 },   // NR
      { wpx: 200 },  // Nom
      { wpx: 180 },  // Prénom
      { wpx: 80 },   // Escadron
      { wpx: 80 },   // Peloton
      { wpx: 120 },  // Incorporation
      { wpx: 110 },  // Salle (num)
    ];

    const baseName = (salle.numero === "Reste")
      ? "Salle Reste"
      : (salle.description ? `Salle ${salle.numero} - ${salle.description}` : `Salle ${salle.numero}`);
    const sheetName = uniqueSheetName(wb, baseName);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  /* ---------- 3) (optionnel) Feuilles par escadron ---------- */
  const escs = [...new Set(tousEleves.map(e => e.escadron))]
    .filter(x => x !== undefined && x !== null && x !== "")
    .sort((a,b)=> (Number(a)||0) - (Number(b)||0));

  escs.forEach((esc, i) => {
    const sorted = tousEleves
      .filter(e => e.escadron === esc)
      .sort((a, b) => {
        const pa = Number(a.peloton) || 0;
        const pb = Number(b.peloton) || 0;
        if (pa !== pb) return pa - pb;
        const ia = Number(a.numeroIncorporation) || 0;
        const ib = Number(b.numeroIncorporation) || 0;
        return ia - ib;
      });

    const aoa = [];
    const merges = [];
    const header = ["NR","Nom","Prénom","Escadron","Peloton","Incorporation","Salle (num)"];

    // Titre fusionné
    const titre = `${esc}° ESCADRON`.toUpperCase();
    aoa.push([titre]);
    merges.push({ s: { r:0, c:0 }, e: { r:0, c: header.length - 1 } });
    aoa.push([]);

    // Entête
    aoa.push(header);

    let currentPeloton = null;
    let nr = 0;
    sorted.forEach(e => {
      if (e.peloton !== currentPeloton) {
        currentPeloton = e.peloton;
        aoa.push([`=== Peloton ${currentPeloton} ===`]);
        merges.push({ s: { r: aoa.length-1, c:0 }, e: { r: aoa.length-1, c: header.length - 1 } });
      }
      nr += 1;
      aoa.push([
        nr,
        e.nom || "",
        e.prenom || "",
        e.escadron ?? "",
        e.peloton ?? "",
        e.numeroIncorporation ?? "",
        e.salle || "Non assigné"
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = merges;
    ws["!cols"] = [
      { wpx: 40 }, { wpx: 200 }, { wpx: 180 },
      { wpx: 80 }, { wpx: 80 }, { wpx: 120 }, { wpx: 110 },
    ];
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      uniqueSheetName(wb, `${i + 1}e Escadron`)
    );
  });

  /* ---------- 4) (optionnel) Feuille “Exclus” ---------- */
  if (Array.isArray(elevesExclus) && elevesExclus.length > 0) {
    const dataExclus = elevesExclus.map((e, idx) => ({
      NR: idx + 1,
      Nom: e.nom,
      Prénom: e.prenom,
      Escadron: e.escadron,
      Peloton: e.peloton,
      Incorporation: e.numeroIncorporation,
      Motif: e.salle // le motif est stocké dans e.salle pour les exclus
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataExclus), "Exclus");
  }

  /* ---------- 5) Sauvegarde ---------- */
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), "repartition_salles.xlsx");
}

/******************************************************
 * 6) EXEMPLES D’USAGE (boutons)
 ******************************************************/
// 1) Modifier / définir les capacités (et exclusions)
async function ouvrirEditeurRepartition(eleves) {
  const excl = await exclureIncorporations(); // se sauvegarde automatiquement
  await ajouterSallesViaModal(eleves, excl);
}
async function validerRepartitionRapide(eleves) {
  const rooms = loadRooms();     // [{numero, capacite, description?}]
  const excl  = loadExclusions();

  if (!rooms.length) {
    await Swal.fire("Aucune configuration enregistrée", "Veuillez définir les capacités une première fois.", "info");
    return ajouterSallesViaModal(eleves, excl);
  }

  const totalCap = rooms.reduce((s, r) => s + (r.capacite || 0), 0);
  const html = `
    <div style="text-align:left">
      <p><b>Dernière configuration mémorisée</b></p>
      <ul style="max-height:220px;overflow:auto;padding-left:18px;margin:0">
        ${rooms.map(r => {
          const d = r.description ? ` (${r.description})` : "";
          return `<li>Salle ${r.numero}${d} → ${r.capacite} élèves</li>`;
        }).join("")}
      </ul>
      <p style="margin-top:8px">Capacité totale : <b>${totalCap}</b> • Élèves dispo : <b>${eleves.length}</b></p>
    </div>
  `;

  const res = await Swal.fire({
    title: "Valider la répartition",
    html,
    icon: "question",
    showDenyButton: true,
    confirmButtonText: "Valider",
    denyButtonText: "Modifier",
  });

  if (res.isConfirmed) {
    return genererRepartitionDepuisCartes(eleves, rooms, excl);
  }
  if (res.isDenied) {
    return ajouterSallesViaModal(eleves, excl);
  }
}

// 2) Valider directement la répartition depuis l’état mémorisé
async function validerRepartition(eleves) {
  await validerRepartitionRapide(eleves);
}

  
  

  
  
  
 
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
