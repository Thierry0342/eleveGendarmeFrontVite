import React, { useEffect, useState ,useRef } from "react";
import consultationService from "../../services/consultation-service"; // ajuste le chemin si besoin
import courService from "../../services/courService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,Cell  } from 'recharts';
import DataTable from 'react-data-table-component';
import "./EvasanModal.css"
import absenceService from "../../services/absence-service";
import * as XLSX from 'xlsx';
import { API_URL } from '../../config/root/modules';
import { Modal, Button } from 'react-bootstrap';
import { BsPeopleFill, BsCalendarCheck } from "react-icons/bs";
import dateService from'../../services/dateservice';
import Swal from 'sweetalert2';
const StatePage = () => {
  const [consultations, setConsultations] = useState([]);
  const [consultations2, setConsultations2] = useState([]);
  const [joursEscadron, setJoursEscadron] = useState([]);
  const [coursList, setCoursList] = useState([]);
  const [cour, setCour] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [listeAbsence,setListeAbsence] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [numIncorp, setNumIncorp] = useState('');
  const [currentPageMotif, setCurrentPageMotif] = useState(1);
  const [currentPageMotif1, setCurrentPageMotif1] = useState(1);
  const [searchMotif, setSearchMotif] = useState('');
  const [dateDebut, setDateDebut] = useState('');
   const [dateFin, setDateFin] = useState('');
   const [selectedMotif, setSelectedMotif] = useState(null);
   const [showModal, setShowModal] = useState(false);
   const [searchIncorp, setSearchIncorp] = useState('');
   const [imagePreview, setImagePreview] = useState(null);
   const fileInputRef = useRef(null);
   const [isImageOpen, setIsImageOpen] = useState(false);
   const [selectedItem, setSelectedItem] = useState(null);
   const [showModal2, setShowModal2] = useState(false);
   const [nomRecherche, setNomRecherche] = useState('');
   const [selectedEleve, setSelectedEleve] = useState(null);
   const [showModal3, setShowModal3] = useState(false);
   const [showModal4, setShowModal4] = useState(false);
   const [showModal5, setShowModal5] = useState(false);
   const [dateServeur, setDateServeur] = useState(null);
const [recentEleves, setRecentEleves] = useState([]);
const [totalEscadron, setTotalEscadron] = useState(0);
const [recentDepartEleves, setRecentDepartEleves] = useState([]);
const [recentPartis, setRecentPartis] = useState([]);
const [totalEvasan, setTotalEvasan] = useState(0);

  //paggination
  
  //filtre inc dans le tableau nombre eleve par motif 
  // Filtrer les élèves selon la recherche par incorporation (numeroIncorporation)
  const filteredEleves = React.useMemo(() => {
    if (!selectedMotif?.eleves) return [];
    if (!searchIncorp.trim()) return selectedMotif.eleves;

    return selectedMotif.eleves.filter(eleve =>
      eleve.numeroIncorporation.toLowerCase().includes(searchIncorp.trim().toLowerCase())
    );
  }, [searchIncorp, selectedMotif]);
  
  const [currentPage, setCurrentPage] = useState(1); // Page actuelle
  const [currentPage1, setCurrentPage1] = useState(1); // Page actuelle
  const [itemsPerPage] = useState(5); // Nombre d'éléments par page
  
//clcik graphe 
const handleBarClick = (data) => {
  setSelectedEleve(data);
 // console.log(data);
  setShowModal3(true);
};

const handleRowClick = (eleve) => {
  setSelectedEleve(eleve);
  setShowModal3(true);
};

const handleClose = () => {
  setShowModal3(false);
  setSelectedEleve(null);
};

  //click row 
  const handleView = (row) => {
    setSelectedRow(row);
  };
  //close modal 
  const closeModal = () => {
    setSelectedRow(null);
  };
  //image click
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
   // Initialiser imagePreview depuis selectedRow.Eleve.image
   useEffect(() => {
    if (selectedRow?.Eleve?.image) {
      setImagePreview(selectedRow.Eleve.image);
    } else {
      setImagePreview(null);
    }
  }, [selectedRow]);
  //
  useEffect(() => {
    const alreadyNotified = localStorage.getItem('versionNotified');
  
   
      Swal.fire({
        title: '🚀 Nouvelle version 2.0.1 disponible !',
       
        icon: 'info',
        confirmButtonText: 'Compris',
        confirmButtonColor: '#007bff',
        showCloseButton: true,
        backdrop: true,
        background: '#fefefe',
        customClass: {
          popup: 'custom-version-popup'
        },
        timer: 2000,
        timerProgressBar: true,
        didClose: () => {
          localStorage.setItem('versionNotified', 'true');
        }
      });
    
  }, []);
  
  //nombre jpour consul
  const handleBadgeClick = (item) => {
    const consultation = consultations.find(c => c.id === item.id);
    if (consultation) {
      setSelectedItem({
        ...item,
        Eleve: consultation.Eleve,
        dateDepart: consultation.dateDepart,
        dateArrive: consultation.dateArrive
      });
      setShowModal2(true);
    }
  };

  const closeModal2 = () => {
    setShowModal2(false);
    setSelectedItem(null);
  };
//miverina 
  // Vérifie si date d'arrivée est dans les 4 derniers jours
 // Trouver les élèves "récents" arrivés

 useEffect(() => {
  dateService.getServerDate()
    .then(res => {
      setDateServeur(res.data.today);
    })
    .catch(err => console.error(err));
}, []);

useEffect(() => {
  if (!dateServeur) return;

  const now = new Date(dateServeur);

  // Total élèves actuellement à l'escadron
  const total = consultations.filter(c => c.status === "Escadron").length;
  setTotalEscadron(total);

  // Élèves récemment revenus à l’escadron (dans les 4 derniers jours)
  const recentArrive = consultations.filter(c => {
    if (c.status !== "Escadron" || !c.dateArrive) return false;
    const arrive = new Date(c.dateArrive);
    const diff = (now - arrive) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 4;
  });
  setRecentEleves(recentArrive);

  // Élèves récemment partis en EVASAN (dans les 4 derniers jours)
  const recentDepart = consultations.filter(c => {
    if (c.status === "Evasan" || !c.dateDepart) return false;
    const depart = new Date(c.dateDepart);
    const diff = (now - depart) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 4;
  });
  setRecentDepartEleves(recentDepart);


  // Total EVASAN (ceux qui ne sont ni IG ni Escadron)
  const totalEvasan = consultations.filter(c =>
    c.status !== "Escadron" && c.status !== "IG"
  ).length;
  setTotalEvasan(totalEvasan);
}, [consultations, dateServeur]);

 //get consultation
  const fetchConsultations = (selectedCour) => {

    if (!selectedCour) {
       // console.error("Aucun cours sélectionné.");
        return;
      }
    consultationService.getByCour(selectedCour)
      .then(res => {
        setConsultations(res.data);
        calculerJoursEscadron(res.data);
      })
      .catch(err => {
        
      });
  };
  //get consultation_2
  const fetchConsultations2 = (selectedCour) => {
    if (!selectedCour) {
    //  console.error("Aucun cours sélectionné.");
      return;
    }
  
    consultationService.getByCour(selectedCour)
      .then(res => {
        const consultationsEvasan = res.data.filter(c => c.status === "EVASAN");
      //  console.log(consultationsEvasan);
        setConsultations2(consultationsEvasan); // n'affiche que les EVASAN
       
      })
      .catch(err => {
        // Gestion silencieuse de l'erreur, sans affichage console
      });
      
  };
//  console.log('qsdfqsfqf',consultations2);
  
  //initialise table consultation
  const columns = [
    { name: "Nom et prénom de l'élève", selector: row => row.Eleve?.nom + " " + row.Eleve?.prenom, sortable: true },
    { name: "Esc", selector: row =>row.Eleve?.escadron, width: "70px", sortable: true, },
    { name: "Pon", selector: row => row.Eleve?.peloton,width: "70px", },
    { name: "Date Départ", selector: row => row.dateDepart },
    {
      name: "Statut",
      cell: row => (
        <span style={{ color: row.status === "EVASAN" ? "RED" : "black", fontWeight: "bold" }}>
          {row.status}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: row => (
        <div className="d-flex justify-content-start">

          <button className="btn btn-success btn-sm" onClick={() => handleView(row)}>VIEW</button>
        </div>
      ),
    }
  ];
  //export nombre jour par motif 
  const exportToExcel = (motifData) => {
    if (!motifData || !Array.isArray(motifData.eleves)) return;

    const worksheetData = filteredEleves.map((eleve, index) => ({
      '#': index + 1,
      'Nom': eleve.nom,
      'Prénom': eleve.prenom,
      'Incorporation': eleve.numeroIncorporation,
      'Escadron': eleve.escadron,
      'Peloton': eleve.peloton,
      'Nombre de motifs': eleve.nombre || 1, 
      
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Élèves');

    XLSX.writeFile(workbook, `Eleves_${motifData.motif}.xlsx`);
  };
  


  const calculerJoursEscadron = (data) => {
    const jours = data
      .filter(c => c.status === "Escadron" && c.dateDepart && c.dateArrive)
      .map(c => {
        const date1 = new Date(c.dateDepart);
        const date2 = new Date(c.dateArrive);
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { id: c.id, jours: diffDays };
      });
    setJoursEscadron(jours);
  };
    //ajout cour automatique
        const fetchCours = async () => {
          try {
            const res = await courService.getAll();
            const coursData = res.data;
      
            // Trier par valeur décroissante
            coursData.sort((a, b) => b.cour - a.cour);
      
            setCoursList(coursData);
            // Définir automatiquement le premier cours comme valeur par défaut
            if (coursData.length > 0) {
                setCour(coursData[0].cour); 
                
            }
      
          } catch (err) {
          // console.error("Erreur lors du chargement des cours", err);
          }
        };
      
//graphe statistique 
const eleveJourMap = new Map();

consultations.forEach(item => {
  if (
    item.status === "Escadron" &&
    item.dateDepart &&
    item.dateArrive &&
    item.Eleve?.id
  ) {
    const depart = new Date(item.dateDepart);
    const arrive = new Date(item.dateArrive);
    const jours = Math.ceil((arrive - depart) / (1000 * 60 * 60 * 24));

    const eleveId = item.Eleve.id;
    const nomPrenom = ` ${item.Eleve.prenom}`;
    const numeroIncorporation = ` ${item.Eleve.numeroIncorporation}`;
    const escadron = ` ${item.Eleve.escadron}`;
    const peloton = ` ${item.Eleve.peloton}`;
    const image =  ` ${item.Eleve.image}`

    if (eleveJourMap.has(eleveId)) {
      const eleve = eleveJourMap.get(eleveId);
      eleve.jours += jours;
      eleve.consultations.push({
        id: item.id,
        motif: item.motif,
        jours,
        dateDepart: item.dateDepart,
        dateArrive: item.dateArrive,
      });
    } else {
      eleveJourMap.set(eleveId, {
        eleveId,
        nom: nomPrenom,
        numeroIncorporation: numeroIncorporation,
        escadron: escadron,
        peloton: peloton,
        jours,
        image:image,
        consultations: [
          {
            id: item.id,
            motif: item.motif,
            jours,
            dateDepart: item.dateDepart,
            dateArrive: item.dateArrive,
          }
        ],
      });
    }
  }
});

const joursParEleve = Array.from(eleveJourMap.values());

// Puis filtres / tris / pagination comme avant

//filtre jour eleve 
const filteredJoursParEleve = joursParEleve.filter(item =>
  item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.numeroIncorporation.toLowerCase().includes(searchTerm.toLowerCase())
);

// tri décroissant sur les données filtrées
const sortedData = [...filteredJoursParEleve].sort((a, b) => b.jours - a.jours);


// Pagination
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

// Total pages basé sur les données filtrées
const totalPages = Math.ceil(filteredJoursParEleve.length / itemsPerPage);
const BAR_WIDTH = 25;

  // Calcul largeur conteneur interne en fonction du nombre de barres
  const containerWidth = Math.max(sortedData.length * BAR_WIDTH, 600);


  useEffect(() => {
    fetchCours();
    fetchAbsence();
   
  }, []);
// console.log("abnsence rehetrea  aa",listeAbsence);
  useEffect(() => {
    if (cour){
        fetchConsultations(cour);
        fetchConsultations2(cour)

    }
  }, [cour]);
  //get all absence 
  const fetchAbsence =()=> {
   
      absenceService.getAll()
        .then(response => {
          if (Array.isArray(response.data)) {
            setListeAbsence(response.data);
           // console.log("Données mises à jour :", response.absences); // Affiche les nouvelles données dans la console
          } else {
           // console.error("Données inattendues :", response.data);
          }
        })
        .catch(error => {
      //    console.error("Erreur lors du chargement des absence :", error);
        });


  }
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-sm rounded p-2 border">
          <p className="fw-bold mb-1">{label}</p>
          <p className="mb-0">
            <strong>{payload[0].value}</strong> jour(s)
          </p>
        </div>
      );
    }
}
   
  //filtre et comptage absence 
  const filteredAbsences = listeAbsence.filter(abs => {
    const matchCour = cour ? abs.Eleve?.cour == cour : true;
   // Normaliser les dates
    const dateAbs = new Date(abs.date).toISOString().slice(0, 10);
 
  const matchDate = (() => {
    if (dateDebut && dateFin) {
      return dateAbs >= dateDebut && dateAbs <= dateFin;
    }
    if (dateDebut && !dateFin) {
      return dateAbs === dateDebut;
    }
    return true;
  })();
    const matchIncorp = numIncorp ? abs.Eleve?.numeroIncorporation === numIncorp : true;
    return matchCour && matchDate && matchIncorp;
  });
  
  
  const recapParEleve = {};

  filteredAbsences.forEach(abs => {
    const eleveId = abs.eleveId;
    const nom = abs.Eleve?.nom || 'Inconnu';
    const motif = abs.motif || 'Inconnu';
    const date = abs.date;
    const incorp =abs.Eleve?.numeroIncorporation
  
    if (!recapParEleve[eleveId]) {
      recapParEleve[eleveId] = {
        nom,
        numeroIncorporation: incorp,
        motifs: {},
      };
    }
  
    // Initialiser une liste de dates uniques par motif
    if (!recapParEleve[eleveId].motifs[motif]) {
      recapParEleve[eleveId].motifs[motif] = new Set();
    }
  
    // Ajouter la date au set
    recapParEleve[eleveId].motifs[motif].add(date);
  });
  const motifData = [];

  Object.entries(recapParEleve).forEach(([eleveId, data]) => {
    Object.entries(data.motifs).forEach(([motif, datesSet]) => {
      motifData.push({
        eleveId,
        incorp: data.numeroIncorporation,
        nom: data.nom,
        motif,
        count: datesSet.size, // nombre de dates uniques
      });
    });
   // console.log('asasasasas',data);
  });

  
  const columns2 = [
    {
      name: 'inc',
      selector: row => parseInt(row.incorp, 10), // assure que ce soit bien un nombre
      sortable: true,
      sortFunction: (a, b) => {
        const valA = parseInt(a.incorp, 10);
        const valB = parseInt(b.incorp, 10);
        return valA - valB;
      }
    },
    
    {
      name: "Élève",
      selector: row => row.nom,
      sortable: true,
    },
    {
      name: "Motif",
      selector: row => row.motif,
      sortable: true,
    },
    {
      name: "Nombre",
      selector: row => row.count,
      sortable: true,
    },
  ];
  //tableau pour nombre par motif
  const regroupementMotifs = {
    'CONSULTATION EXTERNE': 'CONSULTATION TANA',
    'EVASAN': 'CONSULTATION TANA',
    'A REVOIR CENHOSOA': 'CONSULTATION TANA',
    'A REVOIR CENHSOA': 'CONSULTATION TANA',
     'A revoir CENHOSOA':'A revoir CENHOSOA',
  };
  
  const elevesParMotif = {}; // Map des élèves distincts par motif
  const nombreOccurrencesParMotif = {}; // Nombre brut de lignes par motif
  
  filteredAbsences.forEach(abs => {
    // Normaliser
    const motifRaw = abs.motif || 'Inconnu';
    const motifNormalise = motifRaw.trim().toUpperCase();
  
    // Ajouter au compteur brut
    if (!nombreOccurrencesParMotif[motifNormalise]) {
      nombreOccurrencesParMotif[motifNormalise] = 0;
    }
    nombreOccurrencesParMotif[motifNormalise]++;
  
    // Élève
    const eleve = abs.Eleve;
    if (!eleve) return;
    const eleveId = eleve.id || eleve._id || abs.eleveId;
    if (!eleveId) return;
  
    // Ajout des élèves distincts
    if (!elevesParMotif[motifNormalise]) {
      elevesParMotif[motifNormalise] = new Map();
    }
    if (!elevesParMotif[motifNormalise].has(eleveId)) {
      elevesParMotif[motifNormalise].set(eleveId, {
        nom: eleve.nom,
        prenom: eleve.prenom,
        numeroIncorporation: eleve.numeroIncorporation,
        escadron: eleve.escadron,
        peloton: eleve.peloton,
        nombre: 1
      });
    } else {
      const existant = elevesParMotif[motifNormalise].get(eleveId);
      existant.nombre += 1;
    }
    // Regroupement éventuel
   // Regroupement éventuel
const regroupement = regroupementMotifs[motifNormalise];
if (regroupement) {
  if (!nombreOccurrencesParMotif[regroupement]) {
    nombreOccurrencesParMotif[regroupement] = 0;
  }
  nombreOccurrencesParMotif[regroupement]++;

  if (!elevesParMotif[regroupement]) {
    elevesParMotif[regroupement] = new Map();
  }

  if (!elevesParMotif[regroupement].has(eleveId)) {
    elevesParMotif[regroupement].set(eleveId, {
      nom: eleve.nom,
      prenom: eleve.prenom,
      numeroIncorporation: eleve.numeroIncorporation,
      escadron: eleve.escadron,
      peloton: eleve.peloton,
      nombre: 1,  // initialisation à 1
    });
  } else {
    // Incrémenter la propriété nombre au lieu d'écraser
    const existant = elevesParMotif[regroupement].get(eleveId);
    existant.nombre = (existant.nombre || 1) + 1;
  }
}

  });
  

  // Transformer en tableau
  const personneParMotifData = Object.entries(elevesParMotif).map(([motif, elevesMap]) => ({
    motif,
    nombrePersonnes: elevesMap.size,
    nombreTotalOccurences: nombreOccurrencesParMotif[motif] || 0,
    eleves: Array.from(elevesMap.values()),
  }));
  
  
  

  
    

  
 

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Colonne gauche : statistiques */}
        
        <div className="col-md-6">
        <div className="mb-3">
            <label htmlFor="cour" className="form-label">Cours</label>
            <select
                id="cour"
                className="form-select"
                value={cour}
                onChange={(e) => setCour(e.target.value)}
            >
                {coursList.map((item, index) => (
                <option key={index} value={item.cour}>
                    {item.cour}
                </option>
                ))}
            </select>
            {/* Ajouter un bouton à côté du select */}
         
            </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card text-white bg-primary mb-3">
                <div className="card-body">
                  <h5 className="card-title">CONSULTATION EXTERNE</h5>
                  <p className="card-text fs-4">{consultations.length}</p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card text-white bg-warning mb-3">
                <div className="card-body">
                  <h5 className="card-title">RETOUR IG</h5>
                  <p className="card-text fs-4">
                    {consultations.filter(c => c.status === "IG").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
        <div
          className="card text-white bg-success mb-3"
          style={{ cursor: "pointer" }}
          onClick={() => setShowModal4(true)}
        >
          <div className="card-body">
                  <h5 className="card-title d-flex justify-content-between align-items-center">
          RETOUR A EGNA
          {recentEleves.length > 0 && (
             <span className="badge bg-warning text-dark badge-animate">Nouveau</span>
          )}
     </h5>
            <p className="card-text fs-4">{totalEscadron}</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-6">
  <div className="card text-white bg-danger mb-3" style={{ cursor: "pointer" }} onClick={() => setShowModal5(true)}>
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">
          EVASAN
        </h5>
        {recentDepartEleves.length > 0 && (
          <span className="badge bg-warning text-dark badge-animate">Nouveau</span>
        )}
      </div>
      <p className="card-text fs-4 mt-2">{totalEvasan}</p>
    </div>
  </div>
</div>
</div>
          {/* Affichage des jours par consultation Escadron */}
          <div className="card mb-3">
    <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
        <span>Total des jours par élève </span>
        <input
            type="text"
            className="form-control form-control-sm w-50"
            placeholder="Rechercher par nom ou incorporation"
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Réinitialise à la première page lors d'une recherche
            }}
        />
    </div>

    <div className="card-body p-0">
        <div className="table-responsive">
            <table className="table table-striped mb-0">
                <thead className="table-dark">
                    <tr>
                        <th>Élève</th>
                        <th>Total jours</th>
                    </tr>
                </thead>
                <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="2" className="text-center text-muted">Aucun résultat</td>
              </tr>
            ) : (
              currentItems.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => handleRowClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <strong>
                      {'NR'}{item.numeroIncorporation}{"("}{item.escadron}/{item.peloton}{")"} {item.nom}
                    </strong>
                  </td>
                  <td style={{ color: item.jours > 45 ? 'red' : 'black' }}>
            <div className="d-flex align-items-center">
              <span><strong>{item.jours}</strong> jour(s)</span>
              <span
                className="badge rounded-pill px-3 py-1 fw-medium badge-pulse"
                style={{
                  backgroundColor: item.consultations?.length > 1 ? '#ff9800' : '#17a2b8',
                  color: 'white',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  marginLeft: '12px'
                }}
                title={`Consultations : ${item.consultations?.length || 0}`}
              >
                {item.consultations?.length > 1 ? 'Discontinue' : 'Continue'}
              </span>
            </div>
          </td>

                </tr>
              ))
            )}
          </tbody>

            </table>

            {totalPages > 0 && (
                <nav className="mt-3">
                    <ul className="pagination pagination-sm justify-content-end">
                        {/* Bouton Précédent */}
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                Précédent
                            </button>
                        </li>

                        {/* Numéros de pages */}
                        {Array.from({ length: totalPages }, (_, index) => (
                            <li
                                key={index}
                                className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            </li>
                        ))}

                        {/* Bouton Suivant */}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                Suivant
                            </button>
                        </li>
                    </ul>
                </nav>
            )}
        </div>
    </div>
</div>

{/* Liste des jours par consultation Escadron */}
<div className="card mb-3">
    <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
        <span>Jours par consultation</span>
       
    </div>

    <div className="card-body">
        {joursEscadron.length === 0 ? (
            <p className="text-muted">Aucune arrivée.</p>
        ) : (
            <>
                {/* Pagination logic */}
                {(() => {
                    // Filtrage et tri
                    const filtered = joursEscadron.filter(item => {
                        const consultation = consultations.find(c => c.id === item.id);
                        const nom = consultation?.Eleve?.nom?.toLowerCase() || "";
                        const prenom = consultation?.Eleve?.prenom?.toLowerCase() || "";
                        const incorporation = consultation?.Eleve?.numeroIncorporation?.toLowerCase() || "";
                        return (
                            nom.includes(searchTerm.toLowerCase()) ||
                            prenom.includes(searchTerm.toLowerCase()) ||
                            incorporation.includes(searchTerm.toLowerCase())
                        );
                    });

                    const sorted = filtered.sort((a, b) => b.jours - a.jours);

                    // Pagination
                    const itemsPerPage = 5;
                    const indexOfLastItem = currentPage1 * itemsPerPage;
                    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                    const currentItems = sorted.slice(indexOfFirstItem, indexOfLastItem);
                    const totalPages = Math.ceil(sorted.length / itemsPerPage);

                    return (
                        <>
                            <ul className="list-group">
                                {currentItems.map(item => {
                                    const consultation = consultations.find(c => c.id === item.id);
                                    const nom = consultation?.Eleve?.nom || "";
                                    const prenom = consultation?.Eleve?.prenom || "";
                                    

                                    return (
                                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{nom} {prenom}</strong><br />
                                                <small className="text-muted">ID: {item.id}</small>
                                            </div>
                                            <span
                                            className={`badge rounded-pill ${item.jours > 45 ? 'bg-danger' : 'bg-primary'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleBadgeClick(item)}
                                          >
                                            {item.jours} jour(s)
                                          </span>

                                        </li>
                                    );
                                })}
                            </ul>
                             {/* Modal */}
                             {showModal2 && selectedItem && (
                <div
                  className="modal show fade"
                  style={{
                    display: "block",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                    zIndex: 1050,
                    
                  }}
                  onClick={closeModal2}
                >
                  <div
                    className="modal-dialog modal-dialog-centered"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: "400px" }}
                  >
                    <div className="modal-content shadow-lg rounded-3">
                      <div className="modal-header border-bottom-0">
                        <h5 className="modal-title">Détails Consultation</h5>
                        <button
                          type="button"
                          className="btn-close"
                          aria-label="Close"
                          onClick={closeModal2}
                          style={{ cursor: "pointer" }}
                        ></button>
                      </div>
                      <div className="modal-body text-center px-4">
                        {selectedItem.Eleve?.image ? (
                          <img
                            src={`${API_URL}${selectedItem.Eleve.image}`}
                            alt="Élève"
                            style={{
                              width: "140px",
                              height: "140px",
                              objectFit: "cover",
                              borderRadius: "50%",
                              marginBottom: "1rem",
                              boxShadow: "0 0 10px rgba(0,0,0,0.15)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "140px",
                              height: "140px",
                              borderRadius: "50%",
                              backgroundColor: "#e0e0e0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: "1rem",
                              fontStyle: "italic",
                              color: "#777",
                              boxShadow: "inset 0 0 8px #bbb",
                            }}
                          >
                            Pas d'image
                          </div>
                        )}
                        <p className="mb-2">
                          <strong>Nom :</strong> {selectedItem.Eleve?.nom || "-"}
                        </p>
                        <p className="mb-2">
                          <strong>Prénom :</strong> {selectedItem.Eleve?.prenom || "-"}
                        </p>
                        <p className="mb-2">
                          <strong>Date Départ :</strong> {selectedItem.dateDepart || "-"}
                        </p>
                        <p className="mb-0">
                          <strong>Date Arrivée :</strong> {selectedItem.dateArrive || "-"}
                        </p>
                      </div>
                      <div className="modal-footer border-top-0 justify-content-center">
                        <button className="btn btn-primary px-4" onClick={closeModal2}>
                          Fermer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

                            {/* Pagination navigation */}
                            <nav className="mt-3">
                                <ul className="pagination pagination-sm justify-content-end">
                                    <li className={`page-item ${currentPage1 === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(currentPage1 - 1)}>Précédent</button>
                                    </li>
                                    {Array.from({ length: totalPages }).map((_, index) => (
                                        <li key={index} className={`page-item ${currentPage1 === index + 1 ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage1(index + 1)}>{index + 1}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage1 === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage1(currentPage + 1)}>Suivant</button>
                                    </li>
                                </ul>
                            </nav>
                        </>
                    );
                })()}
            </>
        )}
    </div>
   {/* Tableau des personnes par motif d'absence */}
                    <div className="card mb-3">
                      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                        <span>Nombre de personnes par motif</span>
                      </div>

                      <div className="card-body">

                        {/* Barre de recherche */}
                        <div className="mb-3">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Rechercher un motif..."
                            value={searchMotif}
                            onChange={(e) => {
                              setSearchMotif(e.target.value);
                              setCurrentPageMotif(1); // Revenir à la première page lors d'une recherche
                            }}
                          />
                          <div className="d-flex gap-2 mb-3">
                              <input
                                type="date"
                                className="form-control"
                                value={dateDebut}
                                onChange={(e) => {
                                  setDateDebut(e.target.value);
                                  setCurrentPageMotif(1);
                                }}
                              />
                              <input
                                type="date"
                                className="form-control"
                                value={dateFin}
                                onChange={(e) => {
                                  setDateFin(e.target.value);
                                  setCurrentPageMotif(1);
                                }}
                              />
                            </div>

                        </div>

                        {personneParMotifData.length === 0 ? (
                          <p className="text-muted">Aucun motif trouvé.</p>
                        ) : (
                          (() => {
                            // Filtrage
                            const filteredMotifs = personneParMotifData.filter(item =>
                              item.motif.toLowerCase().includes(searchMotif.toLowerCase())
                            );

                            // Tri
                            const sortedMotifs = filteredMotifs.sort((a, b) => b.nombrePersonnes - a.nombrePersonnes);

                            // Pagination
                            const itemsPerPage = 5;
                            const indexOfLastItem = currentPageMotif * itemsPerPage;
                            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                            const currentItems = sortedMotifs.slice(indexOfFirstItem, indexOfLastItem);
                            const totalPages = Math.ceil(sortedMotifs.length / itemsPerPage);

                            return (
                              <>
                          <ul className="list-group">
                            {currentItems.map((item, index) => (
                              <li
                                key={index}
                                className="list-group-item d-flex justify-content-between align-items-center"
                                onClick={() => {
                                  setSelectedMotif(item);
                                  setShowModal(true);
                                  setSearchIncorp(""); // optionnel : réinitialiser la recherche
                                }}
                                style={{ cursor: 'pointer' }}
                              >
                                <div>
                                  <strong>{item.motif}</strong><br />
                                  <small className="text-muted">{item.nombreTotalOccurences}  au total</small>
                                </div>
                                <span className="badge bg-success rounded-pill">
                                  {item.nombrePersonnes} élève(s)
                                </span>
                              </li>
                            ))}
                          </ul>


                           {selectedMotif && (
                            <div
                            className={`modal fade ${showModal ? 'show d-block' : ''}`}
                            tabIndex="-1"
                            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                            onClick={() => setShowModal(false)}
                          >
                            <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
                              <div className="modal-content">
                                <div className="modal-header">
                                  <h5 className="modal-title">Élèves pour : {selectedMotif.motif}</h5>
                                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                                </div>
                                <div className="modal-body">
                                  {Array.isArray(selectedMotif.eleves) && selectedMotif.eleves.length > 0 ? (
                                    <>
                                      {/* Input recherche */}
                                      <div className="mb-3">
                                        <input
                                          type="text"
                                          className="form-control"
                                          placeholder="Rechercher par numéro d'incorporation..."
                                          value={searchIncorp}
                                          onChange={e => setSearchIncorp(e.target.value)}
                                        />
                                      </div>

                                      {/* Tableau des élèves */}
                                      <div className="table-responsive">
                                        <table className="table table-bordered table-sm">
                                          <thead>
                                            <tr>
                                              <th>#</th>
                                              <th>Nom</th>
                                              <th>Prénom</th>
                                              <th>Incorporation</th>
                                              <th>Escadron</th>
                                              <th>Peloton</th>
                                              <th>Nombre</th> {/* nouvelle colonne */}
                                            </tr>
                                          </thead>
                                          <tbody>
                                          {filteredEleves.length > 0 ? (
                                            [...filteredEleves] // copie pour éviter de muter l'original
                                              .sort((a, b) => (b.nombre || 0) - (a.nombre || 0)) // tri décroissant
                                              .map((eleve, idx) => (
                                                <tr key={idx}>
                                                  <td>{idx + 1}</td>
                                                  <td>{eleve.nom}</td>
                                                  <td>{eleve.prenom}</td>
                                                  <td>{eleve.numeroIncorporation}</td>
                                                  <td>{eleve.escadron}</td>
                                                  <td>{eleve.peloton}</td>
                                                  <td>{eleve.nombre || 1}</td>
                                                </tr>
                                              ))
                                          ) : (
                                            <tr>
                                              <td colSpan="7" className="text-center text-muted">
                                                Aucun élève ne correspond à la recherche.
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>

                                        </table>
                                      </div>

                                      {/* Bouton Export Excel */}
                                      <div className="d-flex justify-content-end mt-3">
                                        <button
                                          className="btn btn-success btn-sm"
                                          onClick={() => exportToExcel(selectedMotif)}
                                          disabled={filteredEleves.length === 0}
                                        >
                                          Exporter en Excel
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-muted">Aucun élève pour ce motif.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          )}





                                {/* Pagination */}
                                <nav className="mt-3">
                                  <ul className="pagination pagination-sm justify-content-end">
                                    <li className={`page-item ${currentPageMotif === 1 ? 'disabled' : ''}`}>
                                      <button className="page-link" onClick={() => setCurrentPageMotif(currentPageMotif - 1)}>Précédent</button>
                                    </li>
                                    {Array.from({ length: totalPages }).map((_, index) => (
                                      <li key={index} className={`page-item ${currentPageMotif === index + 1 ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPageMotif(index + 1)}>{index + 1}</button>
                                      </li>
                                    ))}
                                    <li className={`page-item ${currentPageMotif === totalPages ? 'disabled' : ''}`}>
                                      <button className="page-link" onClick={() => setCurrentPageMotif(currentPageMotif + 1)}>Suivant</button>
                                    </li>
                                  </ul>
                                </nav>
                              </>
                            );
                          })()
                        )}
                      </div>
                    </div>




                    </div>


                        </div>
                     {/* Colonne droite ) */}
                            <div className="col-md-6">
                    <div className="card mb-4 shadow">
                        <div className="card-body">
                        <h5 className="card-title text-primary mb-4">
                            📊 Jours de consultation par élève 
                        </h5>
                        <div style={{ width: "100%", overflowX: "auto" }}>
                      <div style={{ width: containerWidth }}>
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart
                            data={sortedData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
                            barCategoryGap={5}
                            barSize={BAR_WIDTH}
                          >
                            <defs>
                              <linearGradient id="colorJour" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#007bff" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#66b2ff" stopOpacity={0.6} />
                              </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="nom"
                              angle={-45}
                              textAnchor="end"
                              hide
                              height={70}
                              interval={0}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36} />

                            <Bar
                              dataKey="jours"
                              radius={[10, 10, 0, 0]}
                              name="Nombre de jours"
                              onClick={(data) => handleBarClick(data)}
                            >
                              {sortedData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.jours > 45 ? "#ff4d4f" : "url(#colorJour)"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                   {/* Modal Bootstrap */}
                   <Modal show={showModal3} onHide={handleClose} centered  dialogClassName="custom-modal-border">
                  <Modal.Header closeButton>
                    <Modal.Title>Informations de l'élève</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {selectedEleve && (
                      <>
                      {selectedEleve.image ? (
                  (() => {
                    const imageUrl = `${API_URL.replace(/\/$/, "")}/${selectedEleve.image.replace(/^\s*\//, "")}`;


                    return (
                      <div className="text-center mb-3">
                        <img
                          src={imageUrl}
                          alt={`Photo de ${selectedEleve.nom}`}
                          style={{
                            width: "120px",
                            height: "120px",
                            objectFit: "cover",
                            borderRadius: "50%",
                            border: "3px solid #007bff",
                          }}
                        />
                      </div>
                    );
                  })()
                ) : (
                  <div
                    className="text-center mb-3"
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      backgroundColor: "#ccc",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#555",
                      fontStyle: "italic",
                      margin: "0 auto 1rem",
                    }}
                  >
                    Pas d'image disponible
                  </div>
                )}


                  <p style={{ color: selectedEleve.jours > 45 ? 'red' : 'black' }}>
                    <strong>Total des jours :</strong> {selectedEleve.jours}
                  </p>

                       

                        <hr />

                        <h6 className="mb-3">Jours par consultation :</h6>

            {selectedEleve.consultations.length === 0 ? (
              <p className="text-muted fst-italic">Aucune consultation enregistrée.</p>
            ) : (
              <div>
                {selectedEleve.consultations.map((c, i) => {
                  const isLong = c.jours > 45;
                  return (
                    <div
                      key={i}
                      style={{
                        marginBottom: "12px",
                        paddingBottom: "8px",
                        borderBottom: "1px dashed #ccc",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                          ID : {c.id}
                        </span>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isLong ? "#dc3545" : "#17a2b8",
                            color: "white",
                            fontSize: "0.75rem",
                            padding: "6px 10px",
                          }}
                        >
                          {c.jours} jour(s)
                        </span>
                      </div>
                      <small className="text-muted">
                        Du <strong>{new Date(c.dateDepart).toLocaleDateString()}</strong> au{" "}
                        <strong>{new Date(c.dateArrive).toLocaleDateString()}</strong>
                      </small>
                    </div>
                  );
                })}
              </div>
            )}


                      </>
                    )}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                      Fermer
                    </Button>
                  </Modal.Footer>
                </Modal>


            {/* Modal affichant les élèves récents */}
            <Modal show={showModal4} onHide={() => setShowModal4(false)} >
  <Modal.Header closeButton className="bg-success text-white">
    <Modal.Title>
    <BsPeopleFill className="me-2" />
      Élèves arrivés récemment à l'EGNA
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {recentEleves.length === 0 ? (
      <p className="text-muted text-center">
        Aucun élève n’est revenu récemment.
      </p>
    ) : (
      <div className="d-flex flex-column gap-3">
        {recentEleves.map((eleve, index) => (
          <div
            key={index}
            className="border rounded shadow-sm p-3 bg-light"
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">
                👤 <strong>{eleve.Eleve?.nom} {eleve.Eleve?.prenom}</strong>
              </h6>
              <span className="badge bg-warning text-dark">Nouveau</span>
            </div>
            <div className="text-muted small">
            <BsCalendarCheck className="me-1" />
              Arrivé le {new Date(eleve.dateArrive).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    )}
  </Modal.Body>

  <Modal.Footer>
    <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
      Fermer
    </Button>
  </Modal.Footer>
</Modal>


<Modal show={showModal5} onHide={() => setShowModal5(false)} >
  <Modal.Header closeButton className="bg-danger text-white border-0">
    <Modal.Title>
      <i className="bi bi-box-arrow-right me-2"></i> Élèves récemment partis
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {recentDepartEleves.length === 0 ? (
      <p className="text-muted text-center">Aucun élève n’est parti récemment.</p>
    ) : (
      <ul className="list-group">
        {recentDepartEleves.map((eleve, index) => (
          <li className="list-group-item d-flex justify-content-between align-items-center" key={index}>
            <span>
              <strong>{eleve.Eleve?.nom || "Inconnu"} {eleve.Eleve?.prenom || ""}</strong>
            </span>
            <span className="badge bg-warning text-dark">
              Départ : {new Date(eleve.dateDepart).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    )}
  </Modal.Body>
  <Modal.Footer className="border-0">
    <Button variant="secondary" onClick={() => setShowModal5(false)}>
      Fermer
    </Button>
  </Modal.Footer>
</Modal>



                        </div>
                    </div>
                   
                 
                  <DataTable
                    title=" EVACUATION SANITAIRE"
                    columns={columns}
                    data={consultations2} // ce sera déjà filtré sur EVASAN
                    pagination
                    highlightOnHover
                    striped
                    responsive
                    noDataComponent="Aucune donneé"
                    paginationPerPage={5} // Affiche au minimum 5 éléments par page
                    paginationRowsPerPageOptions={[5, 10, 15, 20, 50]} // Options de pagination
                    customStyles={customStyles}
                  />
                  

                  <div className="container mt-4">
                  <div className="bg-light p-3 rounded shadow-sm mb-4 text-center">
                    <h5 className="fw-bold m-0">
                      <i className="fa fa-flag text-danger me-2"></i>
                      Situation de Prise d'Arme
                    </h5>
                  </div>


                        <form className="row g-3 mb-4">
                          <div className="col-md-6">
                            <label className="form-label">Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={dateDebut}
                              onChange={(e) => setDateDebut(e.target.value)}
                            />
                            
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Date fin</label>
                            <input
                              type="date"
                              className="form-control"
                              value={dateFin}
                              onChange={(e) => setDateFin(e.target.value)}
                            />
                            
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Numéro d'incorporation</label>
                            <input
                              type="number"
                              className="form-control"
                              value={numIncorp}
                              onChange={(e) => setNumIncorp(e.target.value)}
                            />
                          </div>
                                                        <div className="col-md-6">
                                <label className="form-label">Nom</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={nomRecherche}
                                  onChange={(e) => setNomRecherche(e.target.value)}
                                />
                              </div>

                                                      </form>
                                                      <DataTable
                                columns={columns2}
                                data={motifData.filter(row => {
                                  const matchIncorp = numIncorp === '' || row.incorp.toString().includes(numIncorp.toString());
                                  const matchNom = nomRecherche === '' || row.nom.toLowerCase().includes(nomRecherche.toLowerCase());
                                  return matchIncorp && matchNom;
                                })}
                                pagination
                                highlightOnHover
                                striped
                                responsive
                                noDataComponent="Aucune donnée"
                                paginationPerPage={5}
                                paginationRowsPerPageOptions={[5, 10, 15, 20, 50]}
                                customStyles={customStyles}
                              />

                      </div>




                          {/* FIN SPA*/}
                            {/* MODAL ICI – À L'EXTÉRIEUR DU DATATABLE */}
                                         {selectedRow && (
                                         <div className="modal-overlayy" onClick={closeModal} style={{
                                          position: 'fixed',
                                          top: 0, left: 0, right: 0, bottom: 0,
                                          backgroundColor: 'rgba(0,0,0,0.5)',
                                          display: 'flex',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          zIndex: 1050,
                                        }}>
                                          <div
                                            className="modal-content"
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                              backgroundColor: 'white',
                                              padding: '2rem',
                                              borderRadius: '8px',
                                              display: 'flex',
                                              gap: '2rem',
                                              maxWidth: '700px',
                                              width: '90%',
                                            }}
                                          >
                                            {/* Infos à gauche */}
                                            <div style={{ flex: 1 }}>
                                            <div style={{ flexBasis: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                              {selectedRow.Eleve?.image ? (
                                                <img
                                                src={`${API_URL}${selectedRow.Eleve.image}`}
                                          
                                                  style={{
                                                    width: '150px',
                                                    height: '150px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '2px solid #666',
                                                  }}
                                                  onClick={() => setIsImageOpen(true)}
                                                />
                                              ) : (
                                                <div
                                                  style={{
                                                    width: '150px',
                                                    height: '150px',
                                                    borderRadius: '50%',
                                                    border: '2px solid #666',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    color: '#666',
                                                    fontStyle: 'italic',
                                                    textAlign: 'center',
                                                    padding: '10px',
                                                  }}
                                                >
                                                  Pas d'image disponible
                                                </div>
                                                
                                                
                                              )}
                                              
                                            </div>
                                              <h4>INFORMATION EVASAN</h4>
                                              <div className="modal-fields">
                                                <p><strong>Nom:</strong> {selectedRow.Eleve?.nom}</p>
                                                <p><strong>Prénom:</strong> {selectedRow.Eleve?.prenom}</p>
                                                <p><strong>Escadron:</strong> {selectedRow.Eleve?.escadron}</p>
                                                <p><strong>Peloton:</strong> {selectedRow.Eleve?.peloton}</p>
                                                <p><strong>Incorporation:</strong> {selectedRow.Eleve?.numeroIncorporation}</p>
                                                <p><strong>Date Départ:</strong> {selectedRow.dateDepart}</p>
                                                <p><strong>Date Arrivée:</strong> {selectedRow.dateArrive || "-"}</p>
                                                <p><strong>Service Médical:</strong> {selectedRow.service || "-"}</p>
                                                <p><strong>Référé:</strong> {selectedRow.refere}</p>
                                                <p><strong>Nom Cadre:</strong> {selectedRow.Cadre?.nom}</p>
                                                <p><strong>Téléphone Cadre:</strong> {selectedRow.phone}</p>
                                                <p><strong>Status:</strong> <span style={{ color: selectedRow.status === "EVASAN" ? "red" : "black", fontWeight: "bold" }}>{selectedRow.status}</span></p>
                                              </div>
                                              <button className="btn btn-danger mt-3" onClick={closeModal}>Fermer</button>
                                            </div>
                                               {isImageOpen && (
                                            <div
                                              onClick={() => setIsImageOpen(false)}
                                              style={{
                                                position: "fixed",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: "rgba(0,0,0,0.8)",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                zIndex: 2000,
                                                cursor: "zoom-out",
                                              }}
                                            >
                                              <img
                                                src={`${API_URL}${selectedRow.Eleve.image}`}
                                                alt={`Photo agrandie de ${selectedRow.Eleve.nom}`}
                                                style={{
                                                  maxHeight: "90%",
                                                  maxWidth: "90%",
                                                  borderRadius: "10px",
                                                  boxShadow: "0 0 15px #000",
                                                }}
                                              />
                                            </div>
                                          )}
                                                                                

                                            {/* Image à droite */}
                                           
                                          </div>
                                          
                                          </div>
                                        
                                        
                                        
                                      )}
                                      

                                </div>
                                
                  
                            </div>
                            
                            
                            </div>
                            
                            
                            
                          );
                        };
                        const customStyles = {
                          headCells: {
                            style: {
                              backgroundColor: "#0d6efd", // Bleu Bootstrap
                              color: "white",
                              fontWeight: "bold",
                              height:"40px",
                              fontSize: "16px",
                            },
                          },
                          rows: {
                            style: {
                              fontSize: "13px",
                              minHeight: "50px",
                            },
                          },
                          cells: {
                            style: {
                              padding: "px",
                            },
                          },
                          header: {
                            style: {
                              fontSize: "20px",
                              fontWeight: "bold",
                              padding: "10px",
                              color: "#0d6efd",
                            },
                          },
                          pagination: {
                            style: {
                              borderTop: "1px solid #ccc",
                              padding: "10px",
                            },
                          },
                          highlightOnHoverStyle: {
                            backgroundColor: "#f1f1f1",
                            borderBottomColor: "#cccccc",
                            outline: "1px solid #dddddd",
                          },
                        };


export default StatePage;
