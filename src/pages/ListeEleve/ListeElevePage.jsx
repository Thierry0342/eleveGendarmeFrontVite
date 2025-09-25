import React, { useEffect, useState,useRef } from 'react';
import EleveService from '../../services/eleveService'; // 
import NoteService from '../../services/note-service'; // ajuste le chemin selon ton projet

import ModalModificationEleve from '../EleveModifPage/EleveModifPage'; // 
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import { data } from 'react-router-dom';
import courService from '../../services/courService';
import NotefrancaisService from '../../services/notefrancais-service';
import consultationService from "../../services/consultation-service"; // adapte le chemin
import absenceService from "../../services/absence-service"; // adapte le chemin
import eleveDetailsService from "../../services/eleveDetailsService"
const user = JSON.parse(localStorage.getItem('user'));
import ExcelJS from 'exceljs';
import ProgressBar from 'react-bootstrap/ProgressBar';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Modal, Button } from 'react-bootstrap'; 
import RepartitionModal from './RepartitionModal';
import sanctionService from "../../services/sanction-service";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable';
import './style.css'

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
  const [showRepModal, setShowRepModal] = useState(false);4
  // --- ÉTATS consultation par élève ---
const [consultationsEleve, setConsultationsEleve] = useState([]);
const [loadingConsultationsEleve, setLoadingConsultationsEleve] = useState(false);
const [errorConsultationsEleve, setErrorConsultationsEleve] = useState(null);
// --- ÉTATS absences par élève ---
const [absencesEleve, setAbsencesEleve] = useState([]);
const [loadingAbsencesEleve, setLoadingAbsencesEleve] = useState(false);
const [errorAbsencesEleve, setErrorAbsencesEleve] = useState(null);
const [absDaysMap, setAbsDaysMap] = React.useState({});        // { [eleveId]: number }
const [consDaysMap, setConsDaysMap] = React.useState({});      // { [eleveId]: number }
const [hasSanctionMap, setHasSanctionMap] = React.useState({});// { [eleveId]: boolean }
const [loadingTotals, setLoadingTotals] = React.useState(false);
const tableRows = React.useMemo(() => (eleves ?? []), [eleves]);
// --- Sanctions: états ---
const [sanctions, setSanctions] = useState([]);
const [loadingSanctions, setLoadingSanctions] = useState(false);
const [errorSanctions, setErrorSanctions] = useState(null);
// juste avant le JSX :
const canEdit = ['peda', 'admin', 'superadmin'].includes(String(user?.type).toLowerCase());
// Formulaire (seulement pour admin/superadmin)
const [sanctionForm, setSanctionForm] = useState({ type: "negative", motif: "" });
const [sanctionEditingId, setSanctionEditingId] = useState(null);
  // Droit d'édition
const canEditSanctions = ["admin", "superadmin"].includes(user?.type);
const [notesByEleve, setNotesByEleve] = React.useState({});
  const [filter, setFilter] = useState({ escadron: '', peloton: '' ,search:'' ,cour:'', centreConcours: "" , lieuNaissance: "",  fady: "" });
  //maka centre de concours 
  const centreConcoursList = [...new Set(eleves.map(e => e.centreConcours).filter(Boolean))].sort((a, b) =>
  a.localeCompare(b, 'fr', { sensitivity: 'base' })
);

const lieuNaissanceList = [...new Set(eleves.map(e => e.lieuNaissance).filter(Boolean))].sort((a, b) =>
  a.localeCompare(b, 'fr', { sensitivity: 'base' })
);

const fadyList = [...new Set(eleves.map(e => e.fady).filter(Boolean))].sort((a, b) =>
  a.localeCompare(b, 'fr', { sensitivity: 'base' })
);

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
      inset: 0,
      backgroundColor: 'rgba(0,0,0,.5)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',               // marge autour du modal
    },
    modal: {
      width: 'min(1400px, 98vw)',    // très large
      height: 'min(92vh, 1000px)',   // très haut
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,.2)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',            // cache débordement, le body va scroller
    },
    header: {
      padding: '12px 16px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      background: '#fff',
      zIndex: 1,
    },
    body: {
      flex: 1,
      overflow: 'auto',
      padding: '16px',
    },
    closeBtn: {
      border: 'none',
      background: 'transparent',
      fontSize: '24px',
      lineHeight: 1,
      cursor: 'pointer',
    },
  };
  //note pour chaque eleve 

  /*
  React.useEffect(() => {
    const idsInTable = Array.from(
      new Set(tableRows.map(r => r?.Id ?? r?.id).filter(Boolean))
    );
  
    // ne fetcher que ce qui manque dans le cache
    const toFetch = idsInTable.filter((id) => !(id in notesByEleve));
    if (toFetch.length === 0) return;
  
    let cancelled = false;
    (async () => {
      try {
        const pairs = await Promise.all(
          toFetch.map(async (id) => {
            try {
              const res = await NoteService.getbyEleveId(id);
              const d = Array.isArray(res?.data) ? res.data[0] : res?.data;
              const payload = d ? {
                finfetta: d.finfetta ?? null,
                mistage:  d.mistage  ?? null,
                finstage: d.finstage ?? null,
              } : null;
              return [id, payload];
            } catch {
              return [id, null];
            }
          })
        );
        if (cancelled) return;
        setNotesByEleve((prev) => {
          const next = { ...prev };
          pairs.forEach(([id, n]) => { next[id] = n; });
          return next;
        });
      } catch {}
    })();
  
    return () => { cancelled = true; };
  }, [tableRows, notesByEleve]); 
  */
  
  // ===== 3) HELPERS d'accès/formatage pour les colonnes =====
  // Utilise ton parseNumberFlexible existant
  const getRowNote = (row, field) => {
    // priorité à row.notes.field si tu l’as déjà dans la ligne,
    // sinon on prend depuis notesByEleve (fetché via getbyEleveId)
    const direct = row?.notes?.[field] ?? row?.[field];
    if (direct !== undefined && direct !== null && direct !== '') return direct;
    const id = row?.Id ?? row?.id;
    return notesByEleve[id]?.[field] ?? null;
  };
  
  const selectorNoteNumeric = (row, field) => {
    const v = getRowNote(row, field);
    const n = parseNumberFlexible(v);
    return Number.isFinite(n) ? n : -Infinity; // tri numérique même si valeur absente
  };
  
  const renderNoteCell = (row, field) => {
    const v = getRowNote(row, field);
    const n = parseNumberFlexible(v);
    return Number.isFinite(n) ? n.toFixed(2) : (v ?? '-');
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

  // Helpers

// Helpers dates
// === HELPERS DATES & KEYS ROBUSTES ===
//helper note 
// lit d’abord row.notes[field], puis row[field], puis notesByEleve

//



//les bacth
const safeSumAbsences = (absList = []) => {
  return absList.reduce((acc, a) => {
    let v = parseNumberFlexible(getNombreAbs(a));
    return acc + (Number.isFinite(v) ? v : 1);
  }, 0);
};

const safeSumConsultationsDays = (consList = []) => {
  return consList.reduce((acc, c) => {
    const start = getStartField(c);
    const end   = getEndField(c);
    const nb    = getNbJours(c);
    const computed = (end && start) ? dayDiffInclusive(start, end) : null;
    const days  = (nb != null && nb !== "") ? Number(nb) : computed;
    return acc + (end && Number.isFinite(days) ? days : 0);
  }, 0);
};
useEffect(() => {
  if (!eleves || eleves.length === 0) return;

  const ids = eleves.map(e => e.Id ?? e.id).filter(Boolean);
  const toFetch = ids.filter(id => 
    !(id in absDaysMap) || 
    !(id in consDaysMap) || 
    !(id in hasSanctionMap) || 
    !(id in notesByEleve)
  );

  if (toFetch.length === 0) return;

  let cancelled = false;
  setLoadingTotals(true);

  (async () => {
    try {
      // API serveur: reçoit un tableau d'IDs et renvoie tout
      const res = await eleveDetailsService.getBatchByIds(toFetch); 
      if (cancelled) return;

      const { absences, consultations, sanctions, notes } = res.data;

      // -------------------------------
      // Absences
      const absMap = {};
      absences.forEach(a => {
        if (!absMap[a.eleveId]) absMap[a.eleveId] = [];
        absMap[a.eleveId].push(a);
      });

      // Consultations
      const consMap = {};
      consultations.forEach(c => {
        if (!consMap[c.eleveId]) consMap[c.eleveId] = [];
        consMap[c.eleveId].push(c);
      });

      // Sanctions
      const sancMap = {};
      sanctions.forEach(s => { sancMap[s.eleveId] = true; });

      // Notes
      const notesMap = {};
      notes.forEach(n => {
        const d = Array.isArray(n) ? n[0] : n;
        notesMap[d?.eleveId] = d ? {
          finfetta: d.finfetta ?? null,
          mistage:  d.mistage  ?? null,
          finstage: d.finstage ?? null,
        } : null;
      });

      // -------------------------------
      // Mise à jour state en une seule fois par type
      setAbsDaysMap(prev => {
        const next = { ...prev };
        Object.entries(absMap).forEach(([id, list]) => { next[id] = safeSumAbsences(list); });
        return next;
      });

      setConsDaysMap(prev => {
        const next = { ...prev };
        Object.entries(consMap).forEach(([id, list]) => { next[id] = safeSumConsultationsDays(list); });
        return next;
      });

      setHasSanctionMap(prev => ({ ...prev, ...sancMap }));
      setNotesByEleve(prev => ({ ...prev, ...notesMap }));

    } catch (err) {
      console.error("Erreur récupération batch:", err);
      // en cas d'erreur, on met des valeurs par défaut
      if (!cancelled) {
        toFetch.forEach(id => {
          setAbsDaysMap(prev => ({ ...prev, [id]: 0 }));
          setConsDaysMap(prev => ({ ...prev, [id]: 0 }));
          setHasSanctionMap(prev => ({ ...prev, [id]: false }));
          setNotesByEleve(prev => ({ ...prev, [id]: null }));
        });
      }
    } finally {
      if (!cancelled) setLoadingTotals(false);
    }
  })();

  return () => { cancelled = true; };
}, [eleves]);



// Helpers mapping robustes
const getMotifAbs = (a) =>
  a?.motif ?? a?.raison ?? a?.reason ?? a?.cause ?? "-";

const getNombreAbs = (a) =>
  a?.nbJours ?? a?.nombre ?? a?.nombreJours ?? a?.jours ?? a?.quantite ?? a?.duree ?? a?.count ?? a?.nb ?? null;
// Normalise une clé de groupement
const normalizeKey = (s) => String(s ?? "").trim().toLowerCase();

// Parse un nombre même s'il est dans une string ("3", "3.0", "3 jours", etc.)
const parseNumberFlexible = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const m = String(v).match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

// Chargement quand le modal s’ouvre
React.useEffect(() => {
  const eleveId = selectedEleve?.Id ?? selectedEleve?.id;
  if (!noteModalOpen || !eleveId) return;

  let cancelled = false;
  (async () => {
    setLoadingAbsencesEleve(true);
    setErrorAbsencesEleve(null);
    try {
      const { data } = await absenceService.getByEleveId(eleveId);
      const list = Array.isArray(data) ? data : (data ? [data] : []);
      if (!cancelled) setAbsencesEleve(list);
    } catch (e) {
      if (!cancelled) {
        setAbsencesEleve([]);
        setErrorAbsencesEleve("Impossible de charger les absences de l'élève.");
      }
    } finally {
      if (!cancelled) setLoadingAbsencesEleve(false);
    }
  })();

  return () => { cancelled = true; };
}, [noteModalOpen, selectedEleve?.Id, selectedEleve?.id]);
// Parse très permissif (YYYY-MM-DD, DD/MM/YYYY, ISO, timestamp)
const parseDateFlexible = (v) => {
  if (!v && v !== 0) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    const dt = new Date(v);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const s = String(v).trim();
  if (!s) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/").map(Number);
    return new Date(y, m - 1, d);
  }

  // ISO / autres acceptés par Date
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
};

const formatDate = React.useCallback((v) => {
  const dt = parseDateFlexible(v);
  return dt ? dt.toLocaleDateString() : "-";
}, []);

const toLocalMidnight = (v) => {
  const dt = parseDateFlexible(v);
  if (!dt) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

const dayDiffInclusive = (start, end) => {
  const a = toLocalMidnight(start);
  const b = toLocalMidnight(end);
  if (!a || !b || b < a) return null;
  const MS = 24 * 60 * 60 * 1000;
  return Math.floor((b - a) / MS) + 1;
};

// Normalisation simple pour matcher les clés indifféremment
const normalize = (s) => String(s).toLowerCase().replace(/[\s_]/g, "");

// Recherche d'une valeur dans l'objet en essayant plusieurs clés potent.
const getFieldByKeys = (obj, keys) => {
  for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  // tentative par normalisation
  const map = Object.fromEntries(Object.keys(obj || {}).map((k) => [normalize(k), k]));
  for (const k of keys) {
    const nk = normalize(k);
    if (map[nk] !== undefined) return obj[map[nk]];
  }
  return null;
};

// Variantes courantes pour départ / arrivée / nb jours (FR/camel/snake)
const START_KEYS = [
  "dateDepart","date_depart","depart","dateDebut","date_debut","debut",
  "start","startDate","dateStart","sortie","date_sortie","date_start","date"
];
const END_KEYS = [
  "dateArrive","date_arrivee","arrivee","retour","dateFin","date_fin","fin",
  "end","endDate","dateEnd","date_retour","date_end"
];
const DAYS_KEYS = ["nbJours","nbJour","nombreJours","nombre_jours","jours","duree","days","totalDays"];

const getStartField = (c) => getFieldByKeys(c, START_KEYS);
const getEndField   = (c) => getFieldByKeys(c, END_KEYS);
const getNbJours    = (c) => getFieldByKeys(c, DAYS_KEYS);

// --- CHARGEMENT quand le modal s’ouvre ---
React.useEffect(() => {
  const eleveId = selectedEleve?.Id ?? selectedEleve?.id;
  if (!noteModalOpen || !eleveId) return;

  let cancelled = false;
  async function run() {
    setLoadingConsultationsEleve(true);
    setErrorConsultationsEleve(null);
    try {
      const { data } = await consultationService.getByEleveId(eleveId);
      const list = Array.isArray(data) ? data : (data ? [data] : []);
      if (!cancelled) setConsultationsEleve(list);
    } catch (e) {
      if (!cancelled) {
        setConsultationsEleve([]);
        setErrorConsultationsEleve("Impossible de charger les consultations de l'élève.");
      }
    } finally {
      if (!cancelled) setLoadingConsultationsEleve(false);
    }
  }
  run();
  return () => { cancelled = true; };
}, [noteModalOpen, selectedEleve?.Id, selectedEleve?.id]);
//
//
//sanctions
// ===== SANCTIONS: mapping unique UI <-> backend =====
// Si chez toi true = NÉGATIVE (et false = POSITIVE), inverse ces deux fonctions :
const typeFromBool = (b) => (b ? "positive" : "negative"); // true -> positive
const boolFromType = (t) => (t === "positive");            // "positive" -> true

const getSanctionType = (s) => {
  if (s?.type === "positive" || s?.type === "negative") return s.type;
  if (typeof s?.sanction === "boolean") return typeFromBool(s.sanction);
  return "negative"; // défaut
};

const getSanctionMotif = (s) => s?.motif ?? s?.raison ?? s?.reason ?? "-";

const getSanctionTaux = (s) =>
  s?.taux ?? s?.rate ?? s?.valeur ?? null;

// ===== Chargement à l'ouverture du modal =====
React.useEffect(() => {
  const eleveId = selectedEleve?.Id ?? selectedEleve?.id;
  if (!noteModalOpen || !eleveId) return;

  let off = false;
  (async () => {
    setLoadingSanctions(true);
    setErrorSanctions(null);
    try {
      const { data } = await sanctionService.getByEleveId(eleveId);
      if (!off) setSanctions(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (e) {
      if (!off) {
        setSanctions([]);
        setErrorSanctions("Impossible de charger les sanctions.");
      }
    } finally {
      if (!off) setLoadingSanctions(false);
    }
  })();

  return () => { off = true; };
}, [noteModalOpen, selectedEleve?.Id, selectedEleve?.id]);

// ===== Handlers CRUD =====
async function handleSaveSanction() {
  if (!canEditSanctions) return;
  const eleveId = selectedEleve?.Id ?? selectedEleve?.id;
  if (!eleveId) return;

  const motif = (sanctionForm.motif || "").trim();
  if (!motif) return;

  // On envoie TOUJOURS le booléen `sanction` pour matcher ton schéma actuel
  const payload = {
    eleveId,
    motif,
    type: sanctionForm.type,                  // pour compat future si tu ajoutes la colonne "type"
    taux: sanctionForm.taux ?? null,  
    sanction: boolFromType(sanctionForm.type) // booléen attendu par le back actuel
  };

  try {
    if (sanctionEditingId) {
      await sanctionService.update(sanctionEditingId, payload);
    } else {
      await sanctionService.post(payload);
    }
    const { data } = await sanctionService.getByEleveId(eleveId);
    setSanctions(Array.isArray(data) ? data : (data ? [data] : []));
    setSanctionEditingId(null);
    setSanctionForm({ type: "negative", motif: "" });
  } catch (err) {
    console.error(err);
    alert("Erreur lors de l’enregistrement de la sanction.");
  }
}

function handleEditSanction(s) {
  if (!canEditSanctions) return;
  setSanctionEditingId(s.id);
  setSanctionForm({
    type: getSanctionType(s),
    taux: getSanctionTaux(s) || "",
    motif: getSanctionMotif(s) || ""
  });
}

async function handleDeleteSanction(id) {
  if (!canEditSanctions || !id) return;
  if (!confirm("Supprimer cette sanction ?")) return;

  try {
    await sanctionService.delete(id);
    const eleveId = selectedEleve?.Id ?? selectedEleve?.id;
    const { data } = await sanctionService.getByEleveId(eleveId);
    setSanctions(Array.isArray(data) ? data : (data ? [data] : []));
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la suppression.");
  }
}

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
  /* =========================
   PERF HELPERS (NOUVEAU)
   ========================= */

// Cache mémoire pour écriture incrémentale
let _roomsCache = Array.isArray(loadRooms()) ? loadRooms() : [];

// petit debounce
function debounce(fn, wait = 200) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), wait); };
}

// sauvegarde coalescée
const saveRoomsDebounced = debounce(() => { try { saveRooms(_roomsCache); } catch {} }, 250);

// MàJ d’un seul champ de salle
function updateRoomField(idx, field, value) {
  if (!_roomsCache[idx]) _roomsCache[idx] = { numero: idx + 1, capacite: 0, description: "", batiment: "", surveillants: [] };
  _roomsCache[idx][field] = value;
  saveRoomsDebounced();
}

// (optionnel) MàJ d’un surveillant sans snapshot complet
function updateRoomSurveillant(idx, pos /*1|2*/, label) {
  if (!_roomsCache[idx]) _roomsCache[idx] = { numero: idx + 1, capacite: 0, description: "", batiment: "", surveillants: [] };
  const arr = Array.isArray(_roomsCache[idx].surveillants) ? _roomsCache[idx].surveillants.slice(0, 2) : [];
  arr[pos - 1] = label || "";
  _roomsCache[idx].surveillants = arr.filter(Boolean);
  saveRoomsDebounced();
}

// repousse les gros rendus quand le thread est libre
function idleDebounce(fn, timeout = 600) {
  let pending = false, lastArgs = null;
  const runner = () => { pending = false; const a = lastArgs; lastArgs = null; fn.apply(null, a || []); };
  return (...args) => {
    lastArgs = args;
    if (pending) return;
    pending = true;
    if (window.requestIdleCallback) requestIdleCallback(runner, { timeout });
    else setTimeout(runner, Math.min(timeout, 200));
  };
}

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
        <input class="motif" placeholder="Motif ex: EVASAN" value="${m}">
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
      title:"MOTIF DES ABSENTS", html, width:820, focusConfirm:false, showCancelButton:true, confirmButtonText:"Valider",
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
// === UNIQUE === Remplace toutes les définitions par celle-ci
async function importerPersonnelDepuisColler() {
  // Sauvegarder l'état actuel AVANT l'import si le modal salles est ouvert
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
    // ⬇️ preDestroy ➜ willClose
    willClose: () => {
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

  saveStaff({ surveillants: parsed.surveillants, estafettes: parsed.estafettes });
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


// === UNIQUE === Remplace toutes les définitions par celle-ci
async function importerPersonnelDepuisExcel() {
  // Sauvegarder l'état actuel AVANT l'import si le modal salles est ouvert
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
    // ⬇️ preDestroy ➜ willClose
    willClose: () => {
      if (document.querySelector('.room-card')) {
        hydrateRoomsInputsFromStorage();
      }
    },
    preConfirm: async () => {
      const input = document.getElementById('excelFile');
      const file  = input?.files?.[0];
      if (!file) { Swal.showValidationMessage("Sélectionnez un fichier."); return false; }
      try {
        const buf   = await file.arrayBuffer();
        const wb    = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows  = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
        const parsed = parsePersonnelFromObjects(rows);
        if (!parsed.total) { Swal.showValidationMessage("Impossible de détecter des agents."); return false; }
        return parsed;
      } catch (e) {
        console.error(e);
        Swal.showValidationMessage("Erreur de lecture du fichier.");
        return false;
      }
    }
  });

  if (!res.isConfirmed) return null;

  saveStaff({ surveillants: res.value.surveillants, estafettes: res.value.estafettes });
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
    // 1) Récup rooms sauvegardées & nombre
    const savedRooms = loadRooms();
    const prevCount  = savedRooms.length || 0;
  
    const ask = await Swal.fire({
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
    if (!ask.value) return;
  
    const nbSalles = parseInt(ask.value, 10);
  
    // 2) Construire l’état actif des salles
    let activeRooms = (savedRooms || []).slice(0, nbSalles);
    while (activeRooms.length < nbSalles) {
      const i = activeRooms.length;
      activeRooms.push({ numero: i + 1, capacite: 0, description: "", batiment: "", surveillants: [] });
    }
    activeRooms = activeRooms.map((r, i) => ({
      numero: i + 1,
      capacite: Number(r.capacite) || 0,
      description: r.description || "",
      batiment: r.batiment || "",
      surveillants: Array.isArray(r.surveillants) ? r.surveillants.slice(0, 2) : []
    }));
    saveRooms(activeRooms);
    // ↓ pour que le cache reflète exactement l’état d’ouverture du modal
_roomsCache = activeRooms.slice();
  
    // 3) CSS (une seule fois)
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
        .repart-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;max-height:78vh;overflow:auto;padding-right:4px}
        .room-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 1px 3px rgba(16,24,40,.06);min-height:400px}
        .room-head{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
        .room-badge{font-weight:700;font-size:14px;background:#eef2ff;color:#4338ca;padding:8px 12px;border-radius:999px;border:1px solid #c7d2fe}
        .room-input-group{display:flex;align-items:center;gap:8px;justify-content:center}
        .room-input-group input.salle-nb{width:92px;text-align:center;padding:10px 12px;border:1px solid #cfd4dc;border-radius:10px;font-weight:700;height:44px;font-size:16px}
        .btn-inc,.btn-dec{width:42px;height:42px;border-radius:10px;border:1px solid #e5e7eb;background:#f3f4f6;font-size:20px;font-weight:700;display:flex;align-items:center;justify-content:center}
        .room-building,.room-desc{width:100%;padding:8px 10px;border:1px solid #cfd4dc;border-radius:10px;height:60px;font-size:14px}
        .room-staff{display:flex;flex-direction:column;gap:6px;padding:10px;border:1px dashed #e5e7eb;border-radius:10px;background:#f8fafc;font-size:12.5px}
        .room-staff .lab{font-weight:700;color:#334155}
        .room-staff select{width:100%;padding:8px 10px;border:1px solid #cfd4dc;border-radius:10px;height:40px;font-size:14px}
        .repart-sidebar{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:10px}
        .side-title{font-weight:800;font-size:14px}
        .est-item{border:1px dashed #e5e7eb;border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:6px}
        .est-head{display:flex;justify-content:space-between;align-items:center;font-weight:600}
        .est-list select{width:100%;margin-top:6px;padding:8px 10px;border:1px solid #cfd4dc;border-radius:10px}
        .room-card.sv-missing{border-color:#ef4444 !important;box-shadow:0 0 0 3px rgba(239,68,68,.12)}
        .room-card.sv-duplicate{border-color:#a855f7 !important;box-shadow:0 0 0 3px rgba(168,85,247,.18)}
        .repart-footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:8px 10px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;font-size:13px;color:#334155}
        .footer-kpi{display:flex;gap:12px;align-items:center}
        .kpi{background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;padding:6px 10px;border-radius:10px;font-weight:700}
        .shortage-badge{margin-left:8px;padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px}
        .short-ok{background:#dcfce7;color:#065f46;border:1px solid #bbf7d0}
        .short-warn{background:#fef9c3;color:#92400e;border:1px solid #fde68a}
        .short-bad{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
        .sv-badges{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:100%}
        .sv-chip{background:#eef2ff;border:1px solid #c7d2fe;color:#3730a3;padding:2px 8px;border-radius:999px;font-size:12px;line-height:18px;max-width:100%}
        @media (max-width:1200px){ .repart-body{grid-template-columns:1fr 400px} }
      `;
      document.head.appendChild(style);
    }
    if (!document.getElementById('repart-invalid-css')) {
      const st = document.createElement('style'); st.id = 'repart-invalid-css';
      st.textContent = `.invalid{border-color:#ef4444 !important;background:#fff1f2 !important}`;
      document.head.appendChild(st);
    }
    if (!document.getElementById('personnel-css')) {
      const style = document.createElement('style'); style.id="personnel-css";
      style.textContent=` .sv1 option, .sv2 option { white-space: pre-wrap; max-width: 400px; } `;
      document.head.appendChild(style);
    }
  
    // 4) HTML cartes
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
  
    // 5) Toolbar / Aside / Footer
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
    const bodyHTML = `
      <div class="repart-body">
        <div class="repart-grid">${cardsHTML}</div>
        <aside class="repart-sidebar">
          <div class="side-title">Onglet — Estafettes par bâtiment</div>
          <div id="estafette-panel"></div>
          <div class="reprise-box" id="reprise-box" style="border:1px solid #e5e7eb;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px">
            <div class="reprise-head" style="display:flex;justify-content:space-between;align-items:center;font-weight:700">
              <span>À reprendre (réserves)</span>
              <button type="button" id="reprise-add" class="btn-chip">+ Ligne</button>
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
  
    // 6) Affichage modal principal
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
        // ---- helpers ----
    
        const inputs = [...document.querySelectorAll('.salle-nb')];
        const sumEl  = document.getElementById('sum-cap');
        const total  = Array.isArray(eleves) ? eleves.length : null;
  
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
        const getSallesSnapshot = () => [...document.querySelectorAll('.room-card')].map((card, i) => ({
          numero: i + 1,
          batiment: (card.querySelector('.room-building')?.value || '').trim() || '—',
          surveillants: [card.querySelector('.sv1')?.value, card.querySelector('.sv2')?.value].filter(Boolean)
        }));
  
        function updateRoomHeadChips() {
          document.querySelectorAll('.room-card').forEach((card, i) => {
            const head = card.querySelector('.room-head');
            const s1 = card.querySelector('.sv1')?.value;
            const s2 = card.querySelector('.sv2')?.value;
            const chips = [s1, s2].filter(Boolean).map(lab => `<span class="sv-chip">${lab}</span>`).join('');
            head.innerHTML = `<span class="room-badge">Salle ${i+1}</span>${chips ? `<div class="sv-badges">${chips}</div>` : ''}`;
          });
        }
        function colorizeDuplicateSurveillants() {
          const allRooms = [...document.querySelectorAll('.room-card')];
          const map = {};
          allRooms.forEach((card, idx) => {
            ['sv1', 'sv2'].forEach(cls => {
              const val = card.querySelector(`.${cls}`)?.value;
              if (!val) return;
              const norm = normName(nameFromLabel(val));
              (map[norm] ||= []).push(idx);
            });
          });
          allRooms.forEach((card, idx) => {
            let dup = false;
            ['sv1', 'sv2'].forEach(cls => {
              const val = card.querySelector(`.${cls}`)?.value;
              if (val) {
                const norm = normName(nameFromLabel(val));
                if (map[norm] && map[norm].length > 1) dup = true;
              }
            });
            card.classList.toggle('sv-duplicate', !!dup);
          });
        }
        function colorizeShortages(estafettesData) {
          const cards = [...document.querySelectorAll('.room-card')];
          let missingSV = 0, missingEst = 0;
          const cfg = loadEstafettesCfg();
          const snapshot = getSallesSnapshot();
          const countByBat = new Map();
          snapshot.forEach(s => countByBat.set(s.batiment, (countByBat.get(s.batiment) || 0) + 1));
          const needFor = bat => (countByBat.get(bat) || 0) >= cfg.useThreeWhenRoomsGte
            ? Math.max(3, cfg.minPerBuilding) : Math.max(2, cfg.minPerBuilding);
  
          cards.forEach(card => {
            const sv1 = card.querySelector('.sv1')?.value, sv2 = card.querySelector('.sv2')?.value;
            if (!sv1 || !sv2) { card.classList.add('sv-missing'); missingSV++; }
            else               { card.classList.remove('sv-missing'); }
          });
  
          let iter;
          if (estafettesData?.estafettesMap instanceof Map) iter = estafettesData.estafettesMap.entries();
          else if (estafettesData instanceof Map)          iter = estafettesData.entries();
          else                                            iter = Object.entries(estafettesData || {});
          for (const [bat, list] of iter) {
            const need = needFor(bat);
            const have = Array.isArray(list) ? list.length : 0;
            missingEst += Math.max(0, need - have);
          }
  
          const badge = document.getElementById('shortage-indicator');
          if (!badge) return { missingSV, missingEst };
  
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
  
        // -- Options surveillants
        function _buildSurveillantOptions(staff) {
          const pools = buildSurvPools(staff?.surveillants || []);
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
          const assign = loadEstafettesAssign() || {};
          Object.keys(assign).forEach(bat => {
            assign[bat] = (assign[bat] || []).filter(lab => !GROUP_B.has(gradeFromLabel(lab)));
          });
          saveEstafettesAssign(assign);
          const allEstafette = getAllEstafetteNames(assign);
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
          const html = createOptions(seniors , "GRADES") + createOptions(adjoints, "GENDARMES");
          document.querySelectorAll('.sv1,.sv2').forEach(sel => {
            const cur = sel.value;
            sel.innerHTML = `<option value=""></option>` + html;
            if (cur && [...sel.options].some(o => o.value === cur)) sel.value = cur; else sel.selectedIndex = 0;
          });
        }
  
        function renderEstafettePanel() {
          const panel = document.getElementById('estafette-panel');
          if (!panel) return;
  
          const snapshot = getSallesSnapshot();
          const estAssign = loadEstafettesAssign() || {};
          const perBat    = loadEstafettesPerBuilding() || {};
          const staff     = loadStaff();
  
          const estafettesData = computeEstafettesParBat(snapshot, staff, estAssign);
          const estMap         = estafettesData.estafettesMap;
          const autoAssignments= estafettesData.autoAssignments;
          const availableStaff = estafettesData.availableStaff;
  
          const allAvailableOptions = availableStaff.map(p=>{
            let lab = p.label || `${p.grade} — ${p.name}`;
            const extra=[]; if (p.mle) extra.push(`MLE:${p.mle}`); if (p.nrTph) extra.push(`TPH:${p.nrTph}`); if (p.unite) extra.push(`UNITÉ:${p.unite}`);
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
                <div class="est-item">
                  <div class="est-head">
                    <span>Bâtiment <b>${bat}</b></span>
                    <span>${manque>0?`(manque ${manque})`:`${need} requis`}
                      <button class="btn-set-estaf" data-bat="${bat}" style="margin-left:6px">🖉</button>
                    </span>
                  </div>
                  <div class="est-list" data-bat="${bat}">${selects}</div>
                </div>`;
            }).join('')}
          `;
  
          const showMsg = (txt) => {
            const m = panel.querySelector('#estaf-msg');
            m.textContent = txt || ''; m.style.display = txt ? 'block' : 'none';
          };
  
          // Pré-remplir
          panel.querySelectorAll('.est-sel').forEach(sel=>{
            const bat = sel.getAttribute('data-bat');
            const idx = +sel.getAttribute('data-idx');
            const saved = (estAssign[bat] || [])[idx] || '';
            const auto  = (autoAssignments.get(bat) || [])[idx] || '';
            const target= saved || auto || '';
            if (target && [...sel.options].some(o=>o.value===target)) sel.value = target;
            else sel.selectedIndex = 0;
          });
  
          if (!panel._bound) {
            panel._bound = true;
  
            panel.addEventListener('click', (e)=>{
              const btn = e.target.closest('.btn-set-estaf'); if (!btn) return;
              const bat = btn.getAttribute('data-bat');
              const prev = perBat[bat] ?? '';
              const val = prompt(`Nb d'estafettes pour ${bat}`, prev === '' ? '' : String(prev));
              if (val === null) return;
              if (val === '' || isNaN(Number(val))) delete perBat[bat];
              else perBat[bat] = Math.max(1, Number(val));
              saveEstafettesPerBuilding(perBat);
              renderEstafettePanel();
              renderReprisePanel(); // MAJ conflits
            });
  
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
  
            panel.addEventListener('change', (e)=>{
              const sel = e.target.closest('.est-sel'); if (!sel) return;
              const bat = sel.getAttribute('data-bat');
              const idx = +sel.getAttribute('data-idx');
              const estAssignLoc = loadEstafettesAssign() || {};
  
              if (!sel.value) {
                const arr = (estAssignLoc[bat] || []).slice();
                arr[idx] = '';
                estAssignLoc[bat] = arr.filter(Boolean);
                saveEstafettesAssign(estAssignLoc);
                showMsg('');
                return;
              }
  
              const picked = normName(nameFromLabel(sel.value));
              const already = getSelectedNames(sel);
              if (already.has(picked)) {
                sel.classList.add('est-invalid');
                showMsg("il/elle ets déjà affecté comme estafette ailleurs. Choisissez une autre personne.");
                sel.value = '';
                setTimeout(()=>sel.classList.remove('est-invalid'), 1200);
                return;
              }
  
              sel.classList.remove('est-invalid');
              showMsg('');
              const arr = (estAssignLoc[bat] || []).slice();
              arr[idx] = sel.value;
              estAssignLoc[bat] = arr.filter(Boolean);
              saveEstafettesAssign(estAssignLoc);
  
              renderEstafettePanel();
              renderReprisePanel();
            });
          }
  
          // KPI manques
          colorizeShortages(estafettesData);
        } // renderEstafettePanel
  
        function renderReprisePanel(staffObj, estafettesData) {
          const grid = document.getElementById('reprise-grid');
          if (!grid) return;
  
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
  
          const saved = loadReprise(); // { adjoints:[], seniors:[] } ou ancien array
          let state;
          if (Array.isArray(saved)) { state = { adjoints: [""], seniors: [""] }; }
          else if (saved && typeof saved === 'object') {
            state = {
              adjoints: Array.isArray(saved.adjoints) ? saved.adjoints.slice() : [""],
              seniors : Array.isArray(saved.seniors)  ? saved.seniors.slice()  : [""]
            };
          } else { state = { adjoints: [""], seniors: [""] }; }
  
          const normalizeSameLength = () => {
            const n = Math.max(state.adjoints.length || 1, state.seniors.length || 1);
            while (state.adjoints.length < n) state.adjoints.push("");
            while (state.seniors.length  < n) state.seniors.push("");
          };
          normalizeSameLength();
  
          const snapshot = getSallesSnapshot();
          const usedSV  = new Set(snapshot.flatMap(s=>s.surveillants||[]).map(nameFromLabel).map(normName));
          const usedEst = (estafettesData && estafettesData.usedEstafettes) ? estafettesData.usedEstafettes : new Set();
  
          const staff = staffObj || loadStaff();
          const allPeople = [...(staff?.surveillants||[]), ...(staff?.estafettes||[])];
          const keep = p => { const n = normName(p.name); return n && !usedSV.has(n) && !usedEst.has(n); };
  
          const adjPool = allPeople.filter(p=>GROUP_A.has(p.grade)).filter(keep)
            .sort((a,b)=> gradeRank(a.grade)-gradeRank(b.grade) || a.name.localeCompare(b.name,'fr',{sensitivity:'base'}));
          const senPool = allPeople.filter(p=>GROUP_B.has(p.grade)).filter(keep)
            .sort((a,b)=> gradeRank(a.grade)-gradeRank(b.grade) || a.name.localeCompare(b.name,'fr',{sensitivity:'base'}));
  
          const allEmpty = state.adjoints.every(v => !v) && state.seniors.every(v => !v);
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
            const aFill = take(adjPool, 3);
            const sFill = take(senPool, 3);
            const rows = Math.max(1, Math.max(aFill.length, sFill.length, 3));
            state.adjoints = Array.from({length: rows}, (_,i)=> aFill[i] || "");
            state.seniors  = Array.from({length: rows}, (_,i)=> sFill[i] || "");
          } else normalizeSameLength();
  
          const optionLabel = (p) => {
            let lab = p.label || `${p.grade} — ${p.name}`;
            const extra = []; if (p.mle) extra.push(`MLE:${p.mle}`); if (p.nrTph) extra.push(`TPH:${p.nrTph}`); if (p.unite) extra.push(`UNITÉ:${p.unite}`);
            if (extra.length) lab += ` [${extra.join(', ')}]`;
            const val = (p.label || `${p.grade} — ${p.name}`).replace(/"/g,'&quot;');
            return `<option value="${val}">${lab}</option>`;
          };
          const buildOptions = (pool) => `<option value=""></option>` + pool.map(optionLabel).join('');
  
          const header = `
            <div class="repr-head">
              <div class="repr-title">GENDARMES<span class="repr-sub">(GHC/G1C/G2C/GST)</span></div>
              <div class="repr-title">GRADES<span class="repr-sub">(GPCE/GPHC/GP1C/GP2C)</span></div>
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
  
          grid.querySelectorAll('.repr-adj').forEach((sel, i) => { if (state.adjoints[i]) sel.value = state.adjoints[i]; });
          grid.querySelectorAll('.repr-sen').forEach((sel, i) => { if (state.seniors[i])  sel.value = state.seniors[i];  });
  
          const persist = () => saveReprise({ adjoints: state.adjoints, seniors: state.seniors });
          const statusEl = document.getElementById('repr-status');
  
          function computeDupFlags() {
            const normalizeArr = arr => arr.map(v => v ? normName(nameFromLabel(v)) : '').filter(Boolean);
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
            if (parts.length) { txt = parts.join(' • '); cls = (clash ? 'repr-bad' : 'repr-warn'); }
            statusEl.className = `repr-status ${cls}`; statusEl.textContent = txt;
          }
          updateStatus(); persist();
  
          if (!grid._bound) {
            grid._bound = true;
            grid.addEventListener('change', (e) => {
              const sel = e.target.closest('.repr-sel'); if (!sel) return;
              const idx  = Number(sel.dataset.idx || -1);
              const side = sel.classList.contains('repr-adj') ? 'adj' : 'sen';
              const val  = sel.value || "";
              sel.classList.remove('repr-error');
  
              const n = val ? normName(nameFromLabel(val)) : '';
              const usedSVEst = new Set([...usedSV, ...usedEst]);
              const inAdj = state.adjoints.some((v,j)=> j!==idx && v && normName(nameFromLabel(v))===n);
              const inSen = state.seniors .some((v,j)=> j!==idx && v && normName(nameFromLabel(v))===n);
              if (val && (usedSVEst.has(n) || inAdj || inSen)) {
                sel.classList.add('repr-error');
                sel.value = "";
                return;
              }
              if (side === 'adj') state.adjoints[idx] = val; else state.seniors[idx] = val;
              updateStatus(); persist();
            });
            grid.addEventListener('click', (e) => {
              const btn = e.target.closest('.repr-del'); if (!btn) return;
              const row = btn.closest('.repr-row'); const idx = Number(row?.dataset.idx ?? -1);
              if (idx < 0) return;
              state.adjoints.splice(idx, 1);
              state.seniors .splice(idx, 1);
              if (state.adjoints.length === 0 && state.seniors.length === 0) { state.adjoints.push(""); state.seniors.push(""); }
              persist(); renderReprisePanel(staff, estafettesData);
            });
          }
  
          const addBtn = document.getElementById('reprise-add');
          if (addBtn && !addBtn._reprBound) {
            addBtn._reprBound = true;
            addBtn.addEventListener('click', () => {
              state.adjoints.push(""); state.seniors.push("");
              persist(); renderReprisePanel(staff, estafettesData);
              setTimeout(() => { document.querySelector('.repr-rows .repr-row:last-child .repr-adj')?.focus(); }, 0);
            });
          }
        } // renderReprisePanel
  
        // -- Hydratation simple des inputs depuis storage (sans surveillants)
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
  
        // -- Random surveillants
        function randomizeSurveillantsAcrossRooms() {
          const staff = loadStaff();
          const pools = buildSurvPools(staff.surveillants || []);
          const used = new Set();
          const SENIOR_ORDER  = ["GP2C","GP1C","GPHC","GPCE"];
          const ADJO_ORDER    = ["GST","G2C","G1C","GHC"];
          function makePrioritized(list, order){
            const map = new Map(order.map(g=>[g,[]]));
            (list||[]).forEach(p=>{ const g=String(p.grade).toUpperCase(); if(map.has(g)) map.get(g).push(p); });
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
            const s1 = card.querySelector(".sv1");
            const s2 = card.querySelector(".sv2");
            if(!s1 || !s2) return;
            const senior  = takeNext(seniors);
            const adjoint = takeNext(adjoints);
            const lab1 = senior  ? (senior.label  || `${senior.grade} — ${senior.name}`) : "";
            const lab2 = adjoint ? (adjoint.label || `${adjoint.grade} — ${adjoint.name}`) : "";
            s1.value = lab1 && [...s1.options].some(o=>o.value===lab1) ? lab1 : "";
            s2.value = lab2 && [...s2.options].some(o=>o.value===lab2) ? lab2 : "";
          });
        }
  
        // -- Bouton Random inséré avant le bouton de validation
        const confirmBtn = Swal.getConfirmButton();
        const randomBtn = document.createElement('button');
        randomBtn.id = 'btn-random-staff';
        randomBtn.textContent = 'Random personnels';
        randomBtn.className = 'btn-chip alt';
        randomBtn.style.marginRight = '8px';
        confirmBtn.parentNode.insertBefore(randomBtn, confirmBtn);
        randomBtn.addEventListener('click', () => {
          randomizeSurveillantsAcrossRooms();
          snapshotRoomsFromModalAndSave();
          saveEstafettesAssign({});
          const estafettesData = computeEstafettesParBat(getSallesSnapshot(), loadStaff(), {});
          saveEstafettesAssign(Object.fromEntries([...estafettesData.estafettesMap.entries()]));
          renderEstafettePanel();
          renderReprisePanel(loadStaff(), estafettesData);
          colorizeShortages(estafettesData);
          updateRoomHeadChips();
        });
  
        // -- Listeners UI simples
        document.querySelectorAll('.btn-inc').forEach(btn=>{
          btn.addEventListener('click',()=>{ const idx=btn.getAttribute('data-idx'); const inp=document.querySelector(`.salle-nb[data-idx="${idx}"]`);
            inp.value=Math.max(0,parseInt(inp.value||'0',10))+1; updateSum(); snapshotRoomsFromModalAndSave(); });
        });
        document.querySelectorAll('.btn-dec').forEach(btn=>{
          btn.addEventListener('click',()=>{ const idx=btn.getAttribute('data-idx'); const inp=document.querySelector(`.salle-nb[data-idx="${idx}"]`);
            const v=Math.max(0,(parseInt(inp.value||'0',10)-1)); inp.value=v||''; updateSum(); snapshotRoomsFromModalAndSave(); });
        });
        inputs.forEach(inp=>{
          inp.addEventListener('input',()=>{ updateSum(); });
          inp.addEventListener('wheel',e=>e.preventDefault(),{passive:false});
        });
  
        document.getElementById('apply-all')?.addEventListener('click',()=>{
          const v=parseInt(document.getElementById('cap-def').value,10);
          if(!isNaN(v)&&v>0){ inputs.forEach(i=>i.value=v); updateSum(); snapshotRoomsFromModalAndSave(); }
        });
        document.getElementById('apply-desc-all')?.addEventListener('click',()=>{
          const d=document.getElementById('desc-def').value||'';
          document.querySelectorAll('.room-desc').forEach(i=>i.value=d);
          snapshotRoomsFromModalAndSave();
        });
        document.getElementById('apply-buildings')?.addEventListener('click',()=>{
          const raw=(document.getElementById('builds').value||'').trim(); if(!raw) return;
          const arr=raw.split(/[,;]+/).map(s=>s.trim()).filter(Boolean); if(!arr.length) return;
          const bInputs=[...document.querySelectorAll('.room-building')]; bInputs.forEach((i,idx)=>i.value=arr[idx%arr.length]);
          saveBuildings(arr); snapshotRoomsFromModalAndSave(); renderEstafettePanel(); renderReprisePanel(); updateRoomHeadChips();
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
          snapshotRoomsFromModalAndSave(); renderEstafettePanel(); renderReprisePanel(); updateRoomHeadChips();
        });
        document.getElementById('clear-all')?.addEventListener('click',()=>{
          document.querySelectorAll('.salle-nb').forEach(i=>i.value='');
          document.querySelectorAll('.room-desc').forEach(i=>i.value='');
          document.querySelectorAll('.room-building').forEach(i=>i.value='');
          document.querySelectorAll('.sv1,.sv2').forEach(s=>s.selectedIndex=-1);
          saveEstafettesAssign({}); snapshotRoomsFromModalAndSave(); renderEstafettePanel(); updateSum(); updateRoomHeadChips();
        });
  
       
        document.getElementById('btn-import-excel')?.addEventListener('click', async ()=>{ 
          const st=await importerPersonnelDepuisExcel(); 
          if(st){ 
            _buildSurveillantOptions(st);
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
            _buildSurveillantOptions(st);
            colorizeDuplicateSurveillants();
            snapshotRoomsFromModalAndSave(); 
            renderEstafettePanel(); 
            renderReprisePanel();
            updateRoomHeadChips();
          }
        });
  
        // Pré-sélection des SV sauvegardés
        document.querySelectorAll('.room-card').forEach((card, i) => {
          const s1 = card.querySelector('.sv1');
          const s2 = card.querySelector('.sv2');
          const saved = activeRooms[i]?.surveillants || [];
          const savedLabels = saved.map(s => (typeof s === 'string') ? s : (s.label || `${s.grade} — ${s.name}`));
          if (savedLabels[0]) s1.value = savedLabels[0];
          if (savedLabels[1]) s2.value = savedLabels[1];
        });
  
        // Options SV + Rendu initial
        _buildSurveillantOptions(loadStaff());
        updateSum();
        renderEstafettePanel();
        renderReprisePanel();
        updateRoomHeadChips();
        colorizeDuplicateSurveillants();
  
        // --- Un SEUL listener "input/change" sur le popup, avec debounce ---
       
        // Rebuild lourd (panneaux) repoussé au repos
const debouncedRebuild = idleDebounce(() => {
  // On prend un snapshot complet UNIQUEMENT quand c’est pertinent
  snapshotRoomsFromModalAndSave();
  renderEstafettePanel();
  renderReprisePanel();
  colorizeDuplicateSurveillants();
  updateRoomHeadChips();
}, 2000);

// 1) Sur frappe dans Bâtiment / Description / Capacité -> mise à jour ciblée + save coalescée
const popup = Swal.getPopup();
popup.addEventListener('input', (e) => {
  const t = e.target;
  if (t.classList.contains('room-building')) {
    updateRoomField(+t.dataset.idx, 'batiment', (t.value || '').trim());
  } else if (t.classList.contains('room-desc')) {
    updateRoomField(+t.dataset.idx, 'description', (t.value || '').trim());
  } else if (t.classList.contains('salle-nb')) {
    updateRoomField(+t.dataset.idx, 'capacite', parseInt(t.value, 10) || 0);
    // on garde le KPI réactif sans snapshot global
    const inputs = [...document.querySelectorAll('.salle-nb')];
    const sum = inputs.reduce((a, inp) => a + (parseInt(inp.value, 10) || 0), 0);
    const sumEl = document.getElementById('sum-cap'); if (sumEl) sumEl.textContent = sum;
  }
});

// 2) Quand l’utilisateur “valide” (blur/change) -> on reconstruit les panneaux
popup.addEventListener('change', (e) => {
  if (e.target.matches('.sv1, .sv2')) {
    updateRoomSurveillant(+e.target.dataset.idx, e.target.classList.contains('sv1')?1:2, e.target.value);
    debouncedRebuild();
  } else if (e.target.matches('.room-building, .room-desc')) {
    debouncedRebuild();
  }
});

  
        if (!popup._boundHandlers) {
          popup._boundHandlers = true;
  
          // En tapant dans Bâtiment/Description -> on sauve seulement (léger)
      
  
          // Sur "change" (validation) -> on reconstruit panels (debounced)
          popup.addEventListener('change', (e) => {
            if (e.target.matches('.sv1, .sv2, .room-building, .room-desc')) {
              debouncedRebuild();
            }
          });
        }
  
        // Enter = confirmer
        Swal.getPopup().addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); Swal.clickConfirm(); }});
      },
      preConfirm: () => {
        const nbs  = [...document.querySelectorAll('.salle-nb')];
        const descs= [...document.querySelectorAll('.room-desc')];
        const bats = [...document.querySelectorAll('.room-building')];
        const cards= [...document.querySelectorAll('.room-card')];
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
  
    // 7) Enchaînement répartition si élèves fournis
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
    if (s > 0) out.push({ nom: "GRADES", nombre: s });
    if (a > 0) out.push({ nom: "GENDARMES", nombre: a });
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
  
  function checkNoDoublonSurvEstaf(salles, estafettesParBatiment) {
    const allSV = new Set((salles || [])
      .flatMap(s => s.surveillants || [])
      .map(nameFromLabel).map(normName));
  
    const allEST = new Set((estafettesParBatiment || [])
      .flatMap(b => b.estafettes || [])
      .map(nameFromLabel).map(normName));
  
    const doublons = [...allSV].filter(n => allEST.has(n));
    if (doublons.length) {
      Swal.fire({
        icon: 'error',
        title: 'Conflits de rôles',
        html: 'Ces agents sont à la fois <b>surveillants</b> et <b>estafettes</b> :<br><b>' +
              doublons.join('</b>, <b>') + '</b>'
      });
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
    (reprise.adjoints || []).filter(Boolean).forEach(lab => lignes.push({ cat: "GENDARME", lab }));
    (reprise.seniors  || []).filter(Boolean).forEach(lab => lignes.push({ cat: "GRADE",  lab }));

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

  const normSexe = (v) => {
    const s = (v ?? '').toString().trim().toLowerCase();
    if (['m', 'masculin', 'male', 'garçon', 'garcon'].includes(s)) return 'M';
    if (['f', 'féminin', 'feminin', 'female', 'fille'].includes(s)) return 'F';
    return '';
  };
  
 
  // Application du filtre
  const elevesAAfficher = eleves.filter(eleve => {
    const escadronMatch = filter.escadron === '' || eleve.escadron === Number(filter.escadron);
    const pelotonMatch = filter.peloton === '' || eleve.peloton === Number(filter.peloton);
    const courMatch = filter.cour === '' || eleve.cour === Number(filter.cour);
  
    const sexeEleve = normSexe(eleve.sexe ?? eleve.gender ?? eleve.sex);
    const matricule = eleve.matricule ?? eleve.mle ?? eleve.matriculeNumber;
    const sexeMatch = !filter.sexe || sexeEleve === filter.sexe;
  
    const centreConcoursMatch = filter.centreConcours === '' || eleve.centreConcours === filter.centreConcours;
    const lieuNaissanceMatch = filter.lieuNaissance === '' || eleve.lieuNaissance === filter.lieuNaissance;
    const fadyMatch = filter.fady === '' || eleve.fady === filter.fady;
  
    const matchSearch = !filter.search || (
      eleve.nom?.toLowerCase().includes(filter.search.toLowerCase()) ||
      eleve.prenom?.toLowerCase().includes(filter.search.toLowerCase()) ||
      eleve.numeroIncorporation?.toString().includes(filter.search) ||
      matricule?.toString().includes(filter.search) ||
      (['m', 'f'].includes(filter.search) && sexeEleve.toLowerCase() === filter.search)
    );
  
    // Cas particulier : peloton sélectionné sans escadron mais une recherche est présente → OK
    if (filter.peloton !== '' && filter.escadron === '' && filter.search) {
      return true;
    }
  
    return (
      escadronMatch &&
      pelotonMatch &&
      courMatch &&
      sexeMatch &&
      matchSearch &&
      centreConcoursMatch &&
      lieuNaissanceMatch &&
      fadyMatch
    );
  });
  
  // Helper robuste
const sexToMF = (v) => {
  if (v === null || v === undefined) return "-";
  // nombres / booleans éventuels
  if (v === 1 || v === true) return "M";
  if (v === 0 || v === false) return "F";

  const s = String(v).trim().toLowerCase();

  // Masculin
  if (["m", "masculin", "male", "homme", "lahy", "garçon", "garcon"].includes(s)) return "M";
  // Féminin
  if (["f", "féminin", "feminin", "female", "femme", "vavy", "fille"].includes(s)) return "F";

  // Si déjà "M" / "F" ou autre valeur courte
  if (s === "m") return "M";
  if (s === "f") return "F";

  return "-";
};

 const columns = [
  { name: 'Nom', selector: row => row.nom, sortable: true },
  { name: 'Prénom', selector: row => row.prenom, sortable: true },
  { name: 'Sexe', selector: row => sexToMF(row.sexe), sortable: true, width: "90px", center: true },

  { name: 'Esc / Pon', selector: row => row.escadron + " "+row.peloton , sortable: true , width:"130px" },
  { name: 'Matricule', selector: row => row.matricule, sortable: true,width : "110px" },
  {
    name: 'Inc',
    selector: row => Number(row.numeroIncorporation),
    sortable: true,
    sortFunction: (a, b) => Number(a.numeroIncorporation) - Number(b.numeroIncorporation),
    width: "70px"
  },

  // === Nouvelles colonnes alimentées par les maps ===
  {
    name: 'Sanction',
    selector: row => {
      const id = row.Id ?? row.id;
      const v = hasSanctionMap[id];
      return v === undefined ? '…' : (v ? 'Oui' : 'Non');
    },
    sortable: true,
    width: "120px"
  },
  {
    name: 'Absences (jours)',
    selector: row => {
      const id = row.Id ?? row.id;
      const v = absDaysMap[id];
      return v === undefined ? '…' : v;

    },
    sortable: true,
    width: "140px"
  },
  {
    name: 'Consultations externes',
    selector: row => {
      const id = row.Id ?? row.id;
      const v = consDaysMap[id];
      return v === undefined ? -1 : v; // -1 pour ceux pas encore chargés
    },
    sortable: true,
    width: "140px",
    cell: row => {
      const id = row.Id ?? row.id;
      const v = consDaysMap[id];
      return v === undefined ? '…' : v;
    }
  },
  // === NOUVELLES COLONNES MOYENNES ===
  {
    name: 'FETTA',
    width: '130px',
    right: true,
    sortable: true,
    selector: (row) => selectorNoteNumeric(row, 'finfetta'),
    cell:     (row) => renderNoteCell(row, 'finfetta'),
  },
  {
    name: 'Mi-Stage',
    width: '130px',
    right: true,
    sortable: true,
    selector: (row) => selectorNoteNumeric(row, 'mistage'),
    cell:     (row) => renderNoteCell(row, 'mistage'),
  },
  {
    name: 'Fin Formation',
    width: '130px',
    right: true,
    sortable: true,
    selector: (row) => selectorNoteNumeric(row, 'finstage'),
    cell:     (row) => renderNoteCell(row, 'finstage'),
  },
  
  

  {
    name: 'Actions',
    cell: row => (
      <>
        <button className="btn btn-warning btn-sm me-2" onClick={() => handleOpenModal(row)}>View</button>
        {(user?.type === 'superadmin' || user?.type === 'admin' || user?.type === 'user') && (
          <button className="btn btn-info btn-sm me-2" onClick={() => handleOpenNoteModal(row)}>Fiche</button>
        )}
        {user?.type === 'superadmin' && (
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.id)}>Delete</button>
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

     {/* SearchCard — version Bootstrap améliorée */}
<div className="row justify-content-center mb-5">
  <div className="col-md-11 col-lg-9">
    <div className="card border-0 shadow rounded-4">
      {/* Header */}
      <div
        className="card-header border-0 p-3 rounded-top-4"
        style={{ background: "linear-gradient(135deg,#f8f9fa,#eef2f7)" }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <i className="fa fa-search fs-5 text-secondary" aria-hidden="true"></i>
            <div>
              <h6 className="mb-0">Recherche d’élèves</h6>
              <small className="text-muted">
                Filtre par cours, escadron, peloton, sexe, ou saisis un nom/incorporation.
              </small>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() =>
              setFilter({ escadron: "", peloton: "", search: "", cour: "", sexe: "" })
            }
          >
            <i className="fa fa-refresh me-1"></i> Réinitialiser
            {(filter.cour || filter.search || filter.escadron || filter.peloton || filter.sexe) && (
              <span className="badge text-bg-secondary ms-2">
                {Number(Boolean(filter.cour)) +
                  Number(Boolean(filter.search)) +
                  Number(Boolean(filter.escadron)) +
                  Number(Boolean(filter.peloton)) +
                  Number(Boolean(filter.sexe))}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="row g-3">
          {/* Recherche (avec icône + bouton effacer) */}
          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="search">
              Recherche
            </label>
            <div className="position-relative">
              <span
                className="position-absolute top-50 translate-middle-y ms-3"
                aria-hidden="true"
              >
                <i className="fa fa-search text-muted"></i>
              </span>

              <input
                id="search"
                type="text"
                className="form-control ps-5"
                placeholder="Nom, prénom, incorporation ou matricule"
                name="search"
                value={filter.search}
                onChange={handleFilterChange}
                aria-label="Recherche par nom, prénom, incorporation ou matricule"
              />

              {filter.search && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none position-absolute top-50 end-0 translate-middle-y me-2"
                  onClick={() => setFilter({ ...filter, search: "" })}
                  aria-label="Effacer la recherche"
                  title="Effacer"
                >
                  <i className="fa fa-times-circle"></i>
                </button>
              )}
            </div>
           
          </div>
        


          {/* Cours */}
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="cours">
              Cours
            </label>
            <select
              id="cours"
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
            {/* Centre de concours */}
            <div className="col-md-6">
                <label className="form-label fw-semibold" htmlFor="centreConcours">
                  Centre de concours
                </label>
                <select
                  id="centreConcours"
                  className="form-select"
                  name="centreConcours"
                  value={filter.centreConcours}
                  onChange={handleFilterChange}
                >
                  <option value="">Tous les centres</option>
                  {centreConcoursList.map((cc, i) => (
                    <option key={i} value={cc}>
                      {cc}
                    </option>
                  ))}
                </select>
              </div>
                              {/* Lieu de naissance */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold" htmlFor="lieuNaissance">
                    Lieu de naissance
                  </label>
                  <select
                    id="lieuNaissance"
                    className="form-select"
                    name="lieuNaissance"
                    value={filter.lieuNaissance}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous les lieux</option>
                    {lieuNaissanceList.map((ln, i) => (
                      <option key={i} value={ln}>
                        {ln}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fady */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold" htmlFor="fady">
                    FOKO
                  </label>
                  <select
                    id="fady"
                    className="form-select"
                    name="fady"
                    value={filter.fady}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous les "FOKO"</option>
                    {fadyList.map((f, i) => (
                      <option key={i} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

          {/* Escadron */}
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="escadron">
              Escadron
            </label>
            <select
              id="escadron"
              className="form-select"
              name="escadron"
              value={filter.escadron}
              onChange={handleFilterChange}
            >
              <option value="">Tous les escadrons</option>
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Peloton */}
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="peloton">
              Peloton
            </label>
            <select
              id="peloton"
              className="form-select"
              name="peloton"
              value={filter.peloton}
              onChange={handleFilterChange}
            >
              <option value="">Tous les pelotons</option>
              {[1, 2, 3].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Sexe */}
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="sexe">
              Sexe
            </label>
            <select
              id="sexe"
              className="form-select"
              name="sexe"
              value={filter.sexe}
              onChange={handleFilterChange}
            >
              <option value="">Tous les sexes</option>
              <option value="M">Masculin (M)</option>
              <option value="F">Féminin (F)</option>
            </select>
          </div>

          {/* Astuce UX */}
         

          {/* Bouton Réinitialiser pleine largeur (optionnel) */}
        
        </div>
      </div>
    </div>
  </div>
</div>


                
<div
  style={{
    /* fait sortir le bloc du padding/centrage parent */
    width: '100vw',
    marginLeft: 'calc(50% - 50vw)',
    marginRight: 'calc(50% - 50vw)',
    paddingLeft: 0,
    paddingRight: 0,
  }}
>
  <div className="card border-0 shadow rounded-4 mb-4 w-100" style={{margin:"1rem"}}>

  {/* HEADER */}
  <div style={{ background: 'linear-gradient(135deg,#f8f9fa,#eef2f7)' }}>
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">

      
      {/* Titre + compteur */}
      <div className="d-flex align-items-center gap-2">
        <h5 className="fw-bold text-primary mb-0">
          👥 Liste des élèves Gendarme
        </h5>
        <span className="badge text-bg-primary rounded-pill">
          {eleves?.length ?? 0}
        </span>
      </div>

      {/* Toolbar desktop */}
      <div className="d-none d-md-flex align-items-center gap-2">
        {canEdit && (
          <>
            <button
              type="button"
              className="btn btn-primary btn-sm shadow-sm rounded-3"
              onClick={() => validerRepartitionRapide(eleves)}
              data-bs-toggle="tooltip"
              title="Valider la répartition actuelle par salles"
              aria-label="Valider la répartition"
            >
              <i className="fa fa-check me-2" aria-hidden="true"></i>
              Valider la répartition
            </button>

            <button
              type="button"
              className="btn btn-outline-warning btn-sm shadow-sm rounded-3"
              onClick={async () => {
                const excl = await exclureIncorporations(); // se sauvegarde déjà
                await ajouterSallesViaModal(eleves, excl);
              }}
              data-bs-toggle="tooltip"
              title="Modifier ou redéfinir les capacités des salles"
              aria-label="Modifier ou redéfinir les capacités"
            >
              <i className="fa fa-sliders me-2" aria-hidden="true"></i>
              (Re)définir les capacités
            </button>
          </>
        )}

        {user.type !== "saisie" && (
          <>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm shadow-sm rounded-3"
              onClick={() => setShowNoteModal(true)}
              data-bs-toggle="tooltip"
              title="Saisir ou éditer les notes de Français"
              aria-label="Ouvrir la saisie des notes de Français"
            >
              <i className="fa fa-book me-2" aria-hidden="true"></i>
              Note Français
            </button>

            <button
              type="button"
              className="btn btn-success btn-sm shadow-sm rounded-3"
              onClick={handleExportExcel}
              data-bs-toggle="tooltip"
              title="Exporter la liste au format Excel (.xlsx)"
              aria-label="Exporter en Excel"
            >
              <i className="fa fa-file-excel me-2" aria-hidden="true"></i>
              Exporter (.xlsx)
            </button>
          </>
        )}
      </div>

      {/* Toolbar mobile (menu condensé) */}
      <div className="dropdown d-md-none">
        <button
          className="btn btn-light btn-sm shadow-sm rounded-3 dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          Actions
        </button>
        <ul className="dropdown-menu dropdown-menu-end">
          {canEdit && (
            <>
              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() => validerRepartitionRapide(eleves)}
                >
                  <i className="fa fa-check" aria-hidden="true"></i>
                  <span>Valider la répartition</span>
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={async () => {
                    const excl = await exclureIncorporations();
                    await ajouterSallesViaModal(eleves, excl);
                  }}
                >
                  <i className="fa fa-sliders" aria-hidden="true"></i>
                  <span>(Re)définir les capacités</span>
                </button>
              </li>
              <li><hr className="dropdown-divider" /></li>
            </>
          )}

          {user.type !== "saisie" && (
            <>
              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() => setShowNoteModal(true)}
                >
                  <i className="fa fa-book" aria-hidden="true"></i>
                  <span>Note Français</span>
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={handleExportExcel}
                >
                  <i className="fa fa-file-excel" aria-hidden="true"></i>
                  <span>Exporter (.xlsx)</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="card-body p-0">
      {isLoading ? (
        <div className="text-center my-4">
          <ProgressBar now={60} label="Chargement..." animated striped />
        </div>
      ) : (
        <div className="table-responsive" style={{ width: "100%", overflowX: "auto" }}>
         <DataTable
          //  className="datatable-fixed-header"
            columns={columns}
            data={elevesAAfficher}
            pagination
            paginationPerPage={50}
            paginationRowsPerPageOptions={[50, 100]}
            highlightOnHover
            striped
            fixedHeader
           
            noDataComponent="Aucun élève à afficher"
            customStyles={{
              table: {
                style: {
                  width: '100%',
                },
              },
              headRow: {
                style: {
                  backgroundColor: '#f8f9fa',
                  fontWeight: 700,
                },
              },
              headCells: {
                style: {
                  fontSize: '1.1rem',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                },
              },
              rows: {
                style: {
                  fontSize: '1rem',
                  minHeight: '48px',
                },
              },
              cells: {
                style: {
                  fontSize: '1rem',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                },
              },
            }}
          />


                  </div>
                )}
              </div>
            </div>
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
        maxWidth: '1200px',
        width: '95%',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        position: 'relative',
        zIndex: 10000,
        color: 'black',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }}
    >
      <button
        style={{ position: 'absolute', top: 10, right: 10, fontSize: '24px', background: 'transparent', border: 'none', cursor: 'pointer' }}
        onClick={handleCloseNoteModal}
      >
        ×
      </button>

      <h5 className="text-center mb-3">
        Fiche – {selectedEleve.nom} {selectedEleve.prenom}
      </h5>

      {/* ======= 2 colonnes x 2 lignes ======= */}
      <div className="row g-3" style={{height: 'calc(90vh - 90px)'}}>

        {/* ================= COL 1 (ligne 1) : NOTES ================= */}
        <div className="col-12 col-lg-6 d-flex">
          <div className="card shadow-sm border-0 w-100 d-flex flex-column h-100">
            <div className="card-header bg-light fw-semibold d-flex justify-content-between align-items-center">
              <span>Notes (aperçu)</span>
              {(user?.type !== 'saisie' && user?.type !== 'user') && (
                <button className="btn btn-success btn-sm rounded-pill" onClick={handleSaveNotes}>
                  Enregistrer
                </button>
              )}
            </div>
            <div className="card-body p-2" style={{overflowY:'auto'}}>
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <tbody>
                    <tr>
                      <th style={{whiteSpace:'nowrap'}}>Fin FETTA</th>
                      <td>{notes.finfetta || '-'}</td>
                      <th style={{whiteSpace:'nowrap'}}>Rang Fin FETTA</th>
                      <td>{notes.rangfinfetta || '-'}</td>
                    </tr>
                    <tr>
                      <th>Mi-Stage</th>
                      <td>{notes.mistage || '-'}</td>
                      <th>Rang Mi-Stage</th>
                      <td>{notes.rangmistage || '-'}</td>
                    </tr>
                    <tr>
                      <th>Fin Formation</th>
                      <td>{notes.finstage || '-'}</td>
                      <th>Rang Fin Formation</th>
                      <td>{notes.rangfinstage || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ============ COL 2 (ligne 1) : CONSULTATIONS EXTERNES ============ */}
        <div className="col-12 col-lg-6 d-flex">
          <div className="card shadow-sm border-0 w-100 d-flex flex-column h-100">
            <div className="card-header bg-light fw-semibold d-flex justify-content-between align-items-center">
              <span>Consultations externes</span>
              <span className="badge bg-secondary">{consultationsEleve?.length || 0}</span>
            </div>

            <div className="card-body p-2" style={{overflowY:'auto'}}>
              {loadingConsultationsEleve && (
                <div className="alert alert-info py-2 mb-2">Chargement…</div>
              )}
              {errorConsultationsEleve && (
                <div className="alert alert-danger py-2 mb-2">{errorConsultationsEleve}</div>
              )}
              {!loadingConsultationsEleve && !errorConsultationsEleve && consultationsEleve.length === 0 && (
                <div className="text-muted">Aucune consultation.</div>
              )}

              {consultationsEleve.length > 0 && (() => {
                const rows = consultationsEleve.map((c, idx) => {
                  const start = getStartField(c);
                  const end   = getEndField(c);
                  const nb    = getNbJours(c);
                  const computed = (end && start) ? dayDiffInclusive(start, end) : null;
                  const days  = (nb != null && nb !== "") ? Number(nb) : computed;
                  const endLabel = end ? formatDate(end) : (start ? "Pas encore arrivé" : "-");
                  return {
                    key: c.id || idx,
                    id: c.id,
                    startLabel: start ? formatDate(start) : "-",
                    endLabel,
                    days: end ? (days ?? "-") : "-",
                    ok: Boolean(end && (days != null) && !Number.isNaN(days)),
                  };
                });
                const totalGlobal = rows.reduce((s, r) => s + (r.ok ? Number(r.days) : 0), 0);
                const enCours = rows.filter(r => r.endLabel === "Pas encore arrivé").length;

                return (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle">
                      <thead>
                        <tr>
                          <th style={{whiteSpace:'nowrap', position:'sticky', top:0, background:'#f8f9fa'}}>#</th>
                          <th style={{position:'sticky', top:0, background:'#f8f9fa'}}>Date départ</th>
                          <th style={{position:'sticky', top:0, background:'#f8f9fa'}}>Date arrivée</th>
                          <th style={{position:'sticky', top:0, background:'#f8f9fa'}}>Total (j)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={r.key}>
                            <td>{r.id ?? (i + 1)}</td>
                            <td>{r.startLabel}</td>
                            <td>{r.endLabel}</td>
                            <td>{r.days}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th colSpan={3} style={{textAlign:'right'}}>Total global (terminés)</th>
                          <th>
                            <span className="badge bg-secondary">{totalGlobal}</span>
                          </th>
                        </tr>
                        {enCours > 0 && (
                          <tr>
                            <td colSpan={4} className="text-muted">
                              {enCours} consultation(s) en cours (non comptées).
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ================= COL 3 (ligne 2) : ABSENCES ================= */}
        <div className="col-12 col-lg-6 d-flex">
          <div className="card shadow-sm border-0 w-100 d-flex flex-column h-100">
            <div className="card-header bg-light fw-semibold d-flex justify-content-between align-items-center">
              <span>Absences</span>
              <span className="badge bg-secondary">{absencesEleve?.length || 0}</span>
            </div>

            <div className="card-body p-2" style={{overflowY:'auto'}}>
              {loadingAbsencesEleve && (
                <div className="alert alert-info py-2 mb-2">Chargement…</div>
              )}
              {errorAbsencesEleve && (
                <div className="alert alert-danger py-2 mb-2">{errorAbsencesEleve}</div>
              )}
              {!loadingAbsencesEleve && !errorAbsencesEleve && absencesEleve.length === 0 && (
                <div className="text-muted">Aucune absence.</div>
              )}

              {absencesEleve.length > 0 && (() => {
                const groupsMap = {};
                absencesEleve.forEach((a) => {
                  const motifRaw = getMotifAbs(a);
                  const key = normalizeKey(motifRaw || "Sans motif");
                  const label = (motifRaw && String(motifRaw).trim()) || "Sans motif";
                  const nbRaw = getNombreAbs(a);
                  let val = parseNumberFlexible(nbRaw);
                  if (!Number.isFinite(val)) val = 1;
                  if (!groupsMap[key]) groupsMap[key] = { label, sum: 0, count: 0 };
                  groupsMap[key].sum += val;
                  groupsMap[key].count += 1;
                });
                const rows = Object.values(groupsMap).sort((a, b) =>
                  a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
                );
                const totalGlobal = rows.reduce((acc, r) => acc + r.sum, 0);

                return (
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle">
                      <thead>
                        <tr>
                          <th style={{whiteSpace:'nowrap', position:'sticky', top:0, background:'#f8f9fa'}}>#</th>
                          <th style={{position:'sticky', top:0, background:'#f8f9fa'}}>Motif</th>
                          <th style={{position:'sticky', top:0, background:'#f8f9fa'}}>Nombre</th>
                          <th style={{position:'sticky', top:0, background:'#f8f9fa'}}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <tr key={r.label + idx}>
                            <td>{idx + 1}</td>
                            <td>{r.label}</td>
                            <td>{r.count}</td>
                            <td>{r.sum}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th colSpan={3} style={{textAlign:'right'}}>Total global</th>
                          <th><span className="badge bg-secondary">{totalGlobal}</span></th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

{/* ================= COL 4 (ligne 2) : SANCTIONS ================= */}
<div className="col-12 col-lg-6 d-flex">
  <div className="card shadow-sm border-0 w-100 d-flex flex-column h-100">
    <div className="card-header bg-light fw-semibold d-flex justify-content-between align-items-center">
      <span>Sanctions</span>
      <div className="d-flex gap-2">
        <span className="badge bg-success-subtle text-success border border-success-subtle">
          + {(sanctions || []).filter(s => getSanctionType(s) === "positive").length}
        </span>
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
          − {(sanctions || []).filter(s => getSanctionType(s) === "negative").length}
        </span>
      </div>
    </div>

    <div className="card-body p-2" style={{ overflowY: "auto" }}>
      {loadingSanctions && <div className="alert alert-info py-2 mb-2">Chargement…</div>}
      {errorSanctions && <div className="alert alert-danger py-2 mb-2">{errorSanctions}</div>}
      {!loadingSanctions && !errorSanctions && (!sanctions || sanctions.length === 0) && (
        <div className="text-muted">Aucune sanction.</div>
      )}

      {/* Formulaire d’ajout/édition — visible uniquement pour admin/superadmin */}
      {canEditSanctions && (
        <div className="mb-2 border rounded p-2">
          <div className="row g-2 align-items-end">
            {/* Champ Type */}
            <div className="col-4">
              <label className="form-label mb-1">Type</label>
              <select
                className="form-select form-select-sm"
                value={sanctionForm.type}
                onChange={(e) => setSanctionForm({ ...sanctionForm, type: e.target.value })}
              >
                <option value="positive">Positive</option>
                <option value="negative">Négative</option>
              </select>
            </div>

            {/* Champ Taux */}
            <div className="col-3">
              <label className="form-label mb-1">Taux</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="0"
                min="0"
                value={sanctionForm.taux || ""}
                onChange={(e) => setSanctionForm({ ...sanctionForm, taux: e.target.value })}
              />
            </div>

            {/* Champ Motif */}
            <div className="col-5">
              <label className="form-label mb-1">Motif</label>
              <input
                className="form-control form-control-sm"
                placeholder="Motif…"
                value={sanctionForm.motif}
                onChange={(e) => setSanctionForm({ ...sanctionForm, motif: e.target.value })}
              />
            </div>

            {/* Boutons */}
            <div className="col-12 d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleSaveSanction}
                disabled={!sanctionForm.motif || sanctionForm.motif.trim().length === 0}
                title={
                  !sanctionForm.motif?.trim()
                    ? "Saisir un motif pour activer"
                    : "Enregistrer la sanction"
                }
              >
                {sanctionEditingId ? "Mettre à jour" : "Ajouter"}
              </button>
              {sanctionEditingId && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setSanctionEditingId(null);
                    setSanctionForm({ type: "negative", motif: "", taux: "" });
                  }}
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tableau sanctions */}
      {sanctions && sanctions.length > 0 && (
        <div
          className="table-responsive"
          style={{ maxHeight: "300px", overflowY: "auto" }} // ✅ scroll vertical dans le tableau
        >
          <table className="table table-sm table-bordered align-middle mb-0">
            <thead>
              <tr>
                <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>#</th>
                <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>Type</th>
                <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>Taux</th>
                <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>Motif</th>
                {canEditSanctions && (
                  <th style={{ position: "sticky", top: 0, background: "#f8f9fa", zIndex: 1 }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sanctions.map((s, idx) => {
                const type = getSanctionType(s);
                const motif = s?.motif ?? s?.raison ?? s?.reason ?? "-";
                const taux = s?.taux ?? "-";
                const badge =
                  type === "positive" ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      Positive
                    </span>
                  ) : (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                      Négative
                    </span>
                  );

                return (
                  <tr key={s.id || idx}>
                    <td>{s.id ?? idx + 1}</td>
                    <td>{badge}</td>
                    <td>{taux}</td>
                    <td
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        minWidth: "200px",
                      }}
                    >
                      {motif || "-"}
                    </td>
                    {canEditSanctions && (
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditSanction(s)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteSanction(s.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
</div>


      </div>{/* /row */}
    </div>{/* /modal-content */}
  </div>
)}

{showNoteModal && (
  <div style={modalStyles.overlay} onClick={closeModal}>
    <div
      role="dialog"
      aria-modal="true"
      style={modalStyles.modal}
      onClick={e => e.stopPropagation()}
    >
      <div style={modalStyles.header}>
        <h5 style={{ margin: 0 }}>Liste des Notes Français</h5>
        <button style={modalStyles.closeBtn} onClick={closeModal}>&times;</button>
      </div>

      <div style={modalStyles.body}>
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
              onClick={() => setNiveauFilter(niveauFilter === cat ? "" : cat)}
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
              title={cat === "D" ? "Débutant" : cat === "I" ? "Intermédiaire" : "Avancé"}
            >
              {cat === "D" ? "Débutant" : cat === "I" ? "Intermédiaire" : "Avancé"}
            </div>
          ))}
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div style={{ height: '100%', minHeight: 0 }}>
            <DataTable
              columns={columns2}
              data={filteredNotes}
              pagination
              highlightOnHover
              paginationPerPage={100}                   // <- 100 lignes par page (par défaut)
              paginationRowsPerPageOptions={[25,50,100,200]} // <- options au choix
              striped
              dense
              noHeader
              // si tu utilises react-data-table-component, ça fixe le header et gère le scroll interne :
              fixedHeader
              fixedHeaderScrollHeight="60vh"
            />
          </div>
        )}

        {/* Bouton Exporter */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button className="btn btn-success" onClick={handleExportExcel2}>
            <i className="fa fa-file-excel me-2"></i>
            Exporter (.xlsx)
          </button>
        </div>
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
