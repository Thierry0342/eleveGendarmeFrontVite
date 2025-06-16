import React, { useEffect, useState,useRef } from 'react';
import EleveService from '../../services/eleveService'; // 
import NoteService from '../../services/note-service'; // ajuste le chemin selon ton projet

import ModalModificationEleve from '../EleveModifPage/EleveModifPage'; // 
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import { data } from 'react-router-dom';
import courService from '../../services/courService';
const user = JSON.parse(localStorage.getItem('user'));
import ExcelJS from 'exceljs';
import ProgressBar from 'react-bootstrap/ProgressBar';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";



//table 

const ListeElevePge = () => {
  const [eleves, setEleves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [eleveActif, setEleveActif] = useState(null);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteId,setNoteId]=useState(null);
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
  
  const handleOpenNoteModal = (eleve) => {
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
  //repartition 

  



  



  function genererRepartitionEtExporter(eleves, incorporationRange = null) {
    const structureSalles = [20, 24, 24, 35, 35, 36, 39, 40,32,29,26, ...Array(31).fill(35)];
  
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
  
// maka donne rehetra
useEffect(() => {
  let allEleves = [];
  let currentOffset = 0;
  const limit = 500;

  const fetchAllData = async () => {
    if (isFirstLoad.current) setIsLoading(true);

    allEleves = [];
    currentOffset = 0;

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
        isFirstLoad.current = false; // ne plus afficher le loader après la 1ère fois
      }
    }
  };

  fetchAllData(); // 1er appel


  const intervalId = setInterval(fetchAllData, 3000); // 
  return () => clearInterval(intervalId);
}, []);


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
                👥 
              </h5>
              {user.type !== 'saisie' && (
                <button
                  className="btn btn-success"
                  onClick={handleExportExcel}
                >
                  <i className="fa fa-file-excel me-2"></i>
                  Exporter (.xlsx)
                </button>
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
                        {noteModalOpen && (
                          <div className="modal-overlay">
                            <div
                              className="modal-content"
                              style={{
                                maxWidth: '600px',
                                background: 'white',
                                borderRadius: '10px',
                                padding: '20px',
                                position: 'relative',
                              }}
              >
                <button className="modal-close-btn" onClick={handleCloseNoteModal}>
                  ×
                </button>
                <h5 className="text-center mb-3"> Notes</h5>

                <div className="row">
                  {/* Fin FETTA */}
                  <div className="col-md-6 mb-3">
                    <label>Fin FETTA</label>
                    <input
                      type="text"
                      className="form-control"
                      value={notes.finfetta}
                      maxLength="5"
                      onChange={(e) =>
                        setNotes({ ...notes, finfetta: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>Rang Fin FETTA</label>
                    <input
                      type="text"
                      className="form-control"
                      value={notes.rangfinfetta || ''}
                      onChange={(e) =>
                        setNotes({ ...notes, rangfinfetta: e.target.value })
                      }
                    />
                  </div>

                  {/* Mi-Stage */}
                  <div className="col-md-6 mb-3">
                    <label>Mi-Stage</label>
                    <input
                      type="text"
                      className="form-control"
                      value={notes.mistage}
                      maxLength="5"
                      onChange={(e) =>
                        setNotes({ ...notes, mistage: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>Rang Mi-Stage</label>
                    <input
                      type="text"
                      className="form-control"
                      value={notes.rangmistage || ''}
                      onChange={(e) =>
                        setNotes({ ...notes, rangmistage: e.target.value })
                      }
                    />
                  </div>

                  {/* Fin Formation */}
                  <div className="col-md-6 mb-3">
                    <label>Fin Formation</label>
                    <input
                      type="text"
                      className="form-control"
                      value={notes.finstage}
                      maxLength="5"
                      onChange={(e) =>
                        setNotes({ ...notes, finstage: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>Rang Fin Formation</label>
                    <input
                      type="text"
                      className="form-control"
                      value={notes.rangfinstage || ''}
                      onChange={(e) =>
                        setNotes({ ...notes, rangfinstage: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Bouton Enregistrer */}
                <div className="text-center">
                  {(user?.type !== 'saisie' && user?.type !== 'user') && (
                    <button
                      className="btn btn-success w-100 rounded-pill"
                      onClick={handleSaveNotes}
                    >
                      Enregistrer
                    </button>
                  )}
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
