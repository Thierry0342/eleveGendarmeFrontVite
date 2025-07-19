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
  
  



  function genererRepartitionEtExporter(eleves, incorporationRange = null) {
    const structureSalles = [...Array(50).fill(30)];
  
    // 1. Filtrage (si une plage ou un seul numéro est fourni)
    let elevesFiltres = [...eleves];
    if (Array.isArray(incorporationRange)) {
      const [min, max] = incorporationRange;
      elevesFiltres = elevesFiltres.filter(e =>
        e.numeroIncorporation >= min && e.numeroIncorporation <= max
      );
    } else if (typeof incorporationRange === 'number') {
      elevesFiltres = elevesFiltres.filter(e =>
        e.numeroIncorporation === incorporationRange
      );
    }
  
    // 2. Tri par numeroIncorporation croissant
    elevesFiltres.sort((a, b) => a.numeroIncorporation - b.numeroIncorporation);
  
    // 3. Mélanger pour éviter les regroupements de noms semblables
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
    shuffleArray(elevesFiltres);
  
    let elevesRestants = [...elevesFiltres];
    const salles = [];
    const escadronGlobalMap = {};
  
    const getRandomElevesPourSalle = (effectif) => {
      let salle = [];
      const escadronMap = {};
      let essais = 0;
      const maxEssais = 1000;
  
      while (salle.length < effectif && elevesRestants.length > 0 && essais < maxEssais) {
        essais++;
        const eleve = elevesRestants.shift();
  
        const countInSalle = escadronMap[eleve.escadron] || 0;
        if (countInSalle >= 4) {
          elevesRestants.push(eleve);
          continue;
        }
  
        salle.push(eleve);
        escadronMap[eleve.escadron] = countInSalle + 1;
  
        if (!escadronGlobalMap[eleve.escadron]) escadronGlobalMap[eleve.escadron] = [];
        escadronGlobalMap[eleve.escadron].push(eleve);
      }
  
      return salle;
    };
  
    // Répartition initiale selon structure
    structureSalles.forEach((effectif, index) => {
      if (elevesRestants.length === 0) return;
  
      const numeroSalle = index + 1;
      const salle = getRandomElevesPourSalle(effectif);
  
      const groupes = Array.from({ length: 12 }, () => []);
      salle.forEach((eleve, idx) => {
        eleve.salle = numeroSalle;
        eleve.groupe = (idx % 12) + 1;
        groupes[idx % 12].push(eleve);
      });
  
      salles.push({ numero: numeroSalle, effectif: salle.length, groupes });
    });
  
    // Salles supplémentaires si besoin
    let numeroSalle = salles.length + 1;
    while (elevesRestants.length > 0) {
      const effectif = Math.min(20 + Math.floor(Math.random() * 16), elevesRestants.length);
      const salle = getRandomElevesPourSalle(effectif);
  
      const groupes = Array.from({ length: 12 }, () => []);
      salle.forEach((eleve, idx) => {
        eleve.salle = numeroSalle;
        eleve.groupe = (idx % 12) + 1;
        groupes[idx % 12].push(eleve);
      });
  
      salles.push({ numero: numeroSalle, effectif: salle.length, groupes });
      numeroSalle++;
    }
  
    // RÉSUMÉ + FEUILLES
    const totalEleves = elevesFiltres.length;
    const totalSalles = salles.length;
    const totalGroupes = totalSalles * 12;
    const dateGeneration = new Date().toLocaleString("fr-FR");
  
    const repartitionParSalle = salles.map(
      (s) => `Salle ${s.numero} : ${s.effectif} élèves`
    );
    const repartitionParEscadron = Object.entries(escadronGlobalMap).map(
      ([escadron, liste]) => `Escadron ${escadron} : ${liste.length} élèves`
    );
  
    const resumeData = [
      { Clé: "Date de génération", Valeur: dateGeneration },
      { Clé: "Total élèves à répartir", Valeur: totalEleves },
      { Clé: "Nombre de salles", Valeur: totalSalles },
      { Clé: "Total de groupes (12 par salle)", Valeur: totalGroupes },
      { Clé: "Répartition par salle", Valeur: "" },
      ...repartitionParSalle.map((line) => ({ Clé: "", Valeur: line })),
      { Clé: "", Valeur: "" },
      { Clé: "Répartition par escadron", Valeur: "" },
      ...repartitionParEscadron.map((line) => ({ Clé: "", Valeur: line })),
    ];
  
    const wb = XLSX.utils.book_new();
    const wsResume = XLSX.utils.json_to_sheet(resumeData, { skipHeader: false });
    XLSX.utils.book_append_sheet(wb, wsResume, "RÉSUMÉ");
  
    // FEUILLES PAR SALLE
    salles.forEach((salle) => {
      const data = [];
      salle.groupes.forEach((groupe) => {
        groupe.forEach((eleve) => {
          data.push({
            Nom: eleve.nom,
            Prénom: eleve.prenom,
            Incorporation: eleve.numeroIncorporation,
            Escadron: eleve.escadron,
            Peloton: eleve.peloton,
            Salle: eleve.salle,
          });
        });
      });
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, `Salle ${salle.numero}`);
    });
  
    // FEUILLES PAR ESCADRON
    Object.entries(escadronGlobalMap).forEach(([escadron, liste]) => {
      const wsData = liste.map((eleve) => ({
        Nom: eleve.nom,
        Prénom: eleve.prenom,
        Incorporation: eleve.numeroIncorporation,
        Escadron: eleve.escadron,
        Peloton: eleve.peloton,
        Salle: eleve.salle,
        Groupe: eleve.groupe,
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, `Escadron ${escadron}`);
    });
  
    // EXPORT
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "repartition_salles_resume.xlsx"
    );
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
