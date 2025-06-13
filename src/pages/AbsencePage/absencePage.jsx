import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import eleveService from '../../services/eleveService';
import courService from '../../services/courService';
import absenceService from '../../services/absence-service';
import spaspecialeService from'../../services/spaSpeciale-service';
import dateService from'../../services/dateservice';
import GardeMaladeService from '../../services/gardeMalade-service';
import DataTable from 'react-data-table-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import consultationService from "../../services/consultation-service";
import cadreService from "../../services/cadre-service";
import * as XLSX from "xlsx";
import { fr } from "date-fns/locale";
import { format } from 'date-fns';
import './style.css'
const user = JSON.parse(localStorage.getItem('user'));
import { Modal, Button } from 'react-bootstrap';
import Select from 'react-select';



  const SaisieAbsence = () => {

  const [incorporation, setIncorporation] = useState('');
  const [eleveData, setEleveData] = useState({});
  const [allEleves,setAllEleves]=useState({});
  const [cour, setCour] = useState([]);
  const [cour2, setCour2] = useState([]);
  const [motif, setMotif] = useState('');
  const [date,setDate]=useState('');
  const [absences, setAbsences] = useState([]);
  const [coursList, setCoursList] = useState([]);
  const [coursList2, setCoursList2] = useState([]);
  const [listeAbsence, setListeAbsence] = useState([]);
  const [filter, setFilter] = useState({ escadron: '', peloton: '' ,search:'' ,cour:'',date:''});
  const [showTable, setShowTable] = useState(false);
  const [showModal, setShowModal] = useState(false);
  //pour spa
  const [spaSpeciale,setSpaSpeciale]=useState([]);
  const [spaDate, setSpaDate] = useState('');
  const [totalI, setTotalI] = useState(0);
  const [totalA,setTotalA] = useState(0);
  const [spaNumber, setSpaNumber] = useState(1499); // Valeur par défaut
  const [showSpaSpecialeModal, setShowSpaSpecialeModal] = useState(false);
  const [newSpaSpeciale, setNewSpaSpeciale] = useState({ motif: '', nombre: '', date:'' });
  //motif autre 
  const [incorporationSPA, setIncorporationSPA] = useState('');
  const [eleveSPAInfo, setEleveSPAInfo] = useState(null);
  const [autreMotif, setAutreMotif] = useState("");
  const [typeMotif, setTypeMotif] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [spaSpecialeTempList, setSpaSpecialeTempList] = useState([]);


  //cadre
  const [cadres, setCadres] = useState([]);
  const [selectedCadreId, setSelectedCadreId] = useState("");
  const [newsGardeMalade, setNewsGardeMalade] = useState({
    nom: "",
    matricule: "",
    grade: "",
    service: "",
    phone: "",
  });
  //garde malade 
  const [gardesMalades, setGardesMalades] = useState([]);
  useEffect(() => {
    GardeMaladeService.getAll()
      .then(res => {
        setGardesMalades(res.data);
      })
      .catch(err => console.error(err));
  }, []);
  
  const handleSelectCadre = (e) => {
    const cadreId = e.target.value;
    setSelectedCadreId(cadreId);

    const selectedCadre = cadres.find(c => c.id === parseInt(cadreId));
    if (selectedCadre) {
      setNewsGardeMalade({
        nom: selectedCadre.nom,
        matricule: selectedCadre.matricule,
        grade: selectedCadre.grade || "",
        service: selectedCadre.service || "",
        phone: selectedCadre.phone || "",
      });
    } else {
      setNewsGardeMalade({
        nom: "",
        matricule: "",
        grade: "",
        service: "",
        phone: "",
      });
    }
  };

    //consultation 
    const [consultations, setConsultations] = useState([]);
  //modif consultation 
  //ca
  const filteredConsultations = consultations
  .filter(c => c.status === "EVASAN")
  .filter(c =>
    `${c.Eleve?.nom} ${c.Eleve?.prenom} ${c.Eleve?.numeroIncorporation}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  //modal garde malade 
  const [mainModalVisible, setMainModalVisible] = useState(false);
  const [modaleVisible, setModaleVisible] = useState(false);

  

  const rowsPerPage = 5;

  // Etat modal pour saisir service et garde malade
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // Etat formulaire garde malade en bas du tableau
  const [newGardeMalade, setNewGardeMalade] = useState({ nom: "", numero: "" });

  // Pagination calculs
  const totalPages1 = Math.ceil(filteredConsultations.length / rowsPerPage);
  const startIndex1 = (currentPage - 1) * rowsPerPage;
  const currentConsultations =filteredConsultations.slice(startIndex1, startIndex1 + rowsPerPage);

  // Quand on clique sur checkbox hospitalisé
  const handleHospitaliseChange = (consultation, checked) => {
    if (checked) {
      setSelectedConsultation({ ...consultation, hospitalise: true });
      setModalVisible(true);
    } else {
      consultationService
        .update(consultation.id, {
          ...consultation,
          hospitalise: false,
         
        })
        .then(() => {
          // Mettre à jour localement la liste
          setConsultations(prev =>
            prev.map(c =>
              c.id === consultation.id
                ? { ...c, hospitalise: false,  }
                : c
            )
          );
        })
        .catch(err => console.error("Erreur de mise à jour :", err));
    }
  };
  
  

  // Gestion du formulaire modal
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setSelectedConsultation(prev => ({ ...prev, [name]: value }));
  };

  // Enregistrement modal : mise à jour base et fermeture modal
  
  const handleSaveModal = () => {
    if (!selectedConsultation.service || !selectedConsultation.cadreId) {
      alert("Veuillez remplir le service et choisir un garde malade");
      return;
    }
  
    consultationService
      .update(selectedConsultation.id, {
        ...selectedConsultation,
        hospitalise: true,
      })
      .then(() => {
        setConsultations((prev) =>
          prev.map((c) =>
            c.id === selectedConsultation.id ? selectedConsultation : c
          )
        );
        setModalVisible(false);
        setSelectedConsultation(null);
      })
      .catch((err) => {
        console.error("Erreur lors de la mise à jour :", err);
        alert("Une erreur est survenue lors de l'enregistrement.");
      });
  };
  
  
  
  // Gestion formulaire garde malade en bas du tableau
  const handleNewGardeChange = (e) => {
    const { name, value } = e.target;
    setNewsGardeMalade(prev => ({ ...prev, [name]: value }));
  };
 //ajout garde malade 
 const handleAddGardeMalade = async () => {
  try {
    if (!newsGardeMalade.nom || !newsGardeMalade.matricule) {
      alert("Veuillez sélectionner un cadre valide.");
      return;
    }

    // Envoi des données à l'API et récupération de l'objet créé
    const response = await GardeMaladeService.post(newsGardeMalade);
    const nouveauGarde = response.data;

    alert("Garde malade ajouté avec succès !");

    // Ajout direct dans le tableau (état local)
    setGardesMalades(prev => [...prev, nouveauGarde]);

    // Réinitialisation des champs
    setNewsGardeMalade({
      nom: "",
      matricule: "",
      grade: "",
      service: "",
      phone: "",
    });

    setSelectedCadreId("");

  } catch (error) {
    console.error("Erreur lors de l'ajout :", error);
    alert("Échec de l'ajout du garde malade.");
  }
};

  //supprimer garde malade 
  const handleDeleteGardemalade = async id => {
    if (window.confirm("Confirmer la suppression de ce garde malade ?")) {
      try {
        await GardeMaladeService.delete(id);
        setGardesMalades(prev => prev.filter(gm => gm.id !== id));
      } catch (error) {
        console.error("Erreur de suppression :", error);
        alert("Échec de la suppression.");
      }
    }
  };
  //maka ny garde malade rehetra 
  const gardeMaladesEVASAN = consultations
  .filter(c => c.status === "EVASAN" && c.hospitalise === true && c.cadreId && c.Cadre)

  .map(c => c.Cadre); // 

// Supprimer les doublons par ID
const uniqueGardeMalades = gardeMaladesEVASAN.filter(
  (cadre, index, self) =>
    index === self.findIndex(c => c.id === cadre.id)
);


  
  //modif en bas de page sur pdf 
   
//consultation 
const fetchConsultations = (cour2) => {
  consultationService.getByCour(cour2)
    .then(res => {
      console.log("✅ Données consultations reçues :", res.data); // log ici
      setConsultations(res.data);
    })
    .catch(err => console.error("❌ Erreur chargement consultations :", err));
};
//recup cadre 
useEffect(() => {
  const fetchCadres = async () => {
    try {
      const responseCadre = await cadreService.getAll();
      setCadres(responseCadre.data); // ou responseCadre si c’est déjà un tableau
    } catch (error) {
      console.error("Erreur lors de la récupération des cadres :", error);
    }
  };

  fetchCadres();
}, []);
//select cadre 
const cadreOptions = cadres.map(cadre => ({
  value: cadre.id,
  label: `${cadre.nom}  (${cadre.matricule})`,
}));
//pdf garde malade 
const handleExportPDFGarde = () => {
  const doc = new jsPDF();

  // Titre principal
  doc.setFontSize(16);
  doc.text("RAPPORT EVASAN - Élèves hospitalisés et non hospitalisés", 10, 10);

  // ----------------------------------
  // 1. Élèves hospitalisés
  // ----------------------------------
  doc.setFontSize(14);
  

  const hospitalised = consultations.filter(c => c.status === "EVASAN" && c.hospitalise);
  const hospitalisedcount=hospitalised.length;
  doc.text(`${hospitalisedcount} EG  Élèves hospitalisés`, 10, 20);
  const hospitalisedRows = hospitalised.flatMap((c, index) => {
    const eleve = c.Eleve || {};
    const cadre = cadres.find(cadre => cadre.id === c.cadreId);

    const cadreNom = cadre?.nom || "-";
    const cadrePhone = cadre?.phone || "-";
    const cadreService = cadre?.service || "-";

    return [
      [
        index + 1,
        
        `${eleve.nom || ""} ${eleve.prenom || ""}`,
        eleve.numeroIncorporation || "-",
        eleve.escadron || "-",
        eleve.peloton || "-",
        c.service || "-"
      ],
      [
        "",  
        { 
          content: `Garde Malade : ${cadreNom} | Service : ${cadreService} | Tél : ${cadrePhone}`, 
          colSpan: 5, 
          styles: { fontStyle: 'italic', textColor: '#333' } 
        }, 
        ""
      ]
    ];
  });

  autoTable(doc, {
    startY: 25,
    head: [["#",  "Élève", "Incorporation", "Escadron", "Peloton", "Service"]],
    body: hospitalisedRows,
    theme: "grid",
    margin: { left: 5, right: 5 },
    styles: { lineHeight: 0.9 }
  });

  let yAfterHospitalised = doc.lastAutoTable.finalY + 5;

  // ----------------------------------
  // 2. Élèves non hospitalisés
  // ----------------------------------

  const nonHospitalised = consultations.filter(c => c.status === "EVASAN" && !c.hospitalise);
  const gardesMaladesCount = gardesMalades.length;
  const nonHospitalisedCount = nonHospitalised.length;

  // Texte avec les compteurs au-dessus du tableau non hospitalisés
  doc.setFontSize(14);
  doc.text(
    `${nonHospitalisedCount} EG NON HOSPITALISÉ(S)`, 
    10, 
    yAfterHospitalised 
  );

  const nonHospitalisedRows = nonHospitalised.map((c, index) => {
    const eleve = c.Eleve || {};
    return [
      index + 1,
      
      `${eleve.nom || ""} ${eleve.prenom || ""}`,
      eleve.numeroIncorporation || "-",
      eleve.escadron || "-",
      eleve.peloton || "-",
      "NON HOSPITALISE"
    ];
  });

  autoTable(doc, {
    startY: yAfterHospitalised + 5,
    head: [["#", "NOM ET PRENOMS", "INC", "ESC", "PON", "POSITION"]],
    body: nonHospitalisedRows,
    theme: "grid",
    margin: { left: 5, right: 5 },
    styles: { lineHeight: 0.9 },
    columnStyles: {
      2: { cellWidth: 18 },  // Incorporation (index 2)
      3: { cellWidth: 13 },  // Escadron (index 3)
      4: { cellWidth: 13 },  // Peloton (index 4)
    }
  });

  let yAfterNonHospitalised = doc.lastAutoTable.finalY + 5;

  // ----------------------------------
  // 3. Autres cadres garde-malade (non assignés)
  // ----------------------------------
  doc.setFontSize(14);
  doc.text( `${gardesMaladesCount} GARDE(S) MALADE(S)`, 10, yAfterNonHospitalised);

  const cadreRows = gardesMalades.map((cadre, index) => [
    index + 1,
    cadre.grade +" "+ cadre.nom || "-",
    cadre.service || "-",
    cadre.phone || "-",
    "GARDE MALADE"
  ]);

  autoTable(doc, {
    startY: yAfterNonHospitalised + 5,
    head: [["#", "NOM ET PRENOMS", "Service", "GARDE MALADE","POSITION"]],
    body: cadreRows,
    theme: "grid",
    margin: { left: 5, right: 5 },
    styles: { lineHeight: 0.9 },
  });

  // Enregistrer le fichier
  doc.save("rapport_evasan.pdf");
};






useEffect(() => {
  if (cour) {
    fetchConsultations(cour);
  }
}, [cour]);
   const [footerLines, setFooterLines] = useState({

      line1: ``,
      line2: "Le chef d'escadron, Donatiens RAYMOND",
      line3: "Commandant du cours A de formation des élèves gendarmes",
      line4:"PO "
    });
    useEffect(() => {
      if (!spaDate) return; // éviter erreur si spaDate est vide
    
      try {
        const formattedDate = format(new Date(spaDate), "d MMMM yyyy", { locale: fr });
    
        // Capitaliser la première lettre du mois (ex : "mai" -> "Mai")
        const capitalizedDate = formattedDate.replace(/(?<=\d\s)(\p{L})/u, (c) => c.toUpperCase());
    
        setFooterLines((prev) => ({
          ...prev,
          line1: `NR   EGNA/2-DI/C-A Ambositra, le ${capitalizedDate}`,
        }));
      } catch (error) {
        console.error("Erreur de formatage de date :", error);
      }
    }, [spaDate]);
    //utile pour temporaire 
    const [absencesTemporaires, setAbsencesTemporaires] = useState([]);
    // État pour contrôler l'ouverture du modal
     const [showModale, setShowModale] = useState(false);
// Ouvre/ferme le modal
   const handleOpenModal = () => setShowModale(true);
   const handleCloseModal = () => setShowModale(false);
   //sup modal temporaire 
   const handleSupprimerTemporaire = (absenceASupprimer) => {
    const nouvelleListe = absencesTemporaires.filter(
      (a) =>
        !(
          a.numeroIncorporation === absenceASupprimer.numeroIncorporation &&
          a.nom === absenceASupprimer.nom &&
          a.prenom === absenceASupprimer.prenom &&
          a.date === absenceASupprimer.date
        )
    );
  
    setAbsencesTemporaires(nouvelleListe);
  };
  
  //regroup motif tempraire 
   // Regroupe les absences par motif
   const absencesParMotif = absencesTemporaires.reduce((groups, absence) => {
    const key = absence.motif || 'Sans motif';
    if (!groups[key]) groups[key] = [];
    groups[key].push(absence);
    return groups;
  }, {});
  
 
    const handleExportPDF = () => {
      Swal.fire({
        title: 'Choisissez le format d\'impression',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '📄 PDF Simple',
        denyButtonText: '📻 Message Radio',
        cancelButtonText: 'Annuler',
      }).then((result) => {
        if (result.isConfirmed) {
          // Avant de lancer le PDF simple, demander si on veut modifier les lignes
          Swal.fire({
            title: 'Modifier le pied du document ?',
            text: "Souhaitez-vous modifier les lignes de signature ?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Oui',
            cancelButtonText: 'Non',
          }).then((res) => {
            if (res.isConfirmed) {
              // Afficher les champs à modifier
              Swal.fire({
                title: 'Modifier le pied',
                html: `
                  <input id="line1" class="swal2-input" value="${footerLines.line1}" placeholder="Ligne 1">
                  <input id="line2" class="swal2-input" value="${footerLines.line2}" placeholder="Ligne 2">
                  <input id="line3" class="swal2-input" value="${footerLines.line3}" placeholder="Ligne 3">
                  <input id="line4" class="swal2-input" value="${footerLines.line4}" placeholder="Ligne 4">

                `,
                focusConfirm: false,
                showCancelButton: true,
                preConfirm: () => {
                  const line1 = document.getElementById('line1').value;
                  const line2 = document.getElementById('line2').value;
                  const line3 = document.getElementById('line3').value;
                  const line4 = document.getElementById('line4').value;

                    return { line1, line2, line3, line4 }; // 
                }
              }).then((swalResult) => {
                if (swalResult.isConfirmed && swalResult.value) {
                  const { line1, line2, line3,line4 } = swalResult.value;
                  setFooterLines({ line1, line2, line3 });
                  handleExportPDFSimple({ line1, line2, line3, line4 }); // <-- passer les valeurs ici
                }
              });
            } else {
              handleExportPDFSimple(); // sans modification
            }
          });
    
        } else if (result.isDenied) {
          handleExportPDFNarratif();
        }
      });
    };
    



   //pagination spa
   const [pageAbsence, setPageAbsence] = useState(1);
   const [pageSpa, setPageSpa] = useState(1);
   const ITEMS_PER_PAGE = 5;

   
  //ajout cour automatique
  useEffect(() => {
    const fetchCours = async () => {
      try {
        const res = await courService.getAll();
        const coursData = res.data;
  
        // Trier par valeur décroissante
        coursData.sort((a, b) => b.cour - a.cour);
  
        setCoursList(coursData);
        setCoursList2(coursData);
  
        // Définir automatiquement le premier cours comme valeur par défaut
        if (coursData.length > 0) {
            setCour(coursData[0].cour); 
            setCour2(coursData[0].cour); 
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
       //  console.log("id pox ve ee" +id);      
          absenceService.delete(id)
            .then(() => {
              setListeAbsence(prev => prev.filter(e => e.id !== id));
              Swal.fire('Supprimé !', 'Operation Terminé', 'success');
              
            })
            .catch(error => {
              console.error("Erreur lors de la suppression :", error);
              Swal.fire('Erreur', 'Impossible de supprimer cet élève.', 'error');
            });
        }
      });
    };
    

  // get tous les absence 
  useEffect(() => {
    const intervalId = setInterval(() => {
      absenceService.getAll()
        .then(response => {
          if (Array.isArray(response.data)) {
            setListeAbsence(response.data);
           // console.log("Données mises à jour :", response.absences); // Affiche les nouvelles données dans la console
          } else {
            console.error("Données inattendues :", response.data);
          }
        })
        .catch(error => {
          console.error("Erreur lors du chargement des absence :", error);
        });
    }, 1000); // Appeler toutes les 1 secondes (1000 ms)
  
    // Nettoyer l'intervalle lorsque le composant est démonté
    return () => clearInterval(intervalId);
  
  }, []);
  //get spaSpeciale 
  useEffect(() => {
    const intervalId = setInterval(() => {
      spaspecialeService.getAll()
        .then(response => {
          if (Array.isArray(response.data)) {
            setSpaSpeciale(response.data);
            //console.log("Données mises à jour :", response.data); // Affiche les nouvelles données dans la console
          } else {
            console.error("Données inattendues :", response.data);
          }
        })
        .catch(error => {
          console.error("Erreur lors du chargement  :", error);
        });
    }, 1000); // Appeler toutes les 1 secondes (1000 ms)
  
    // Nettoyer l'intervalle lorsque le composant est démonté
    return () => clearInterval(intervalId);
  
  }, []);
  //ajout spa speciale 
 


  //inserer dans un tableau react
 //console.log("absence veee",absences)
  const columns = [
    { name: 'Nom', selector: row => row.Eleve.nom, sortable: true },
    { name: 'Prénom', selector: row => row.Eleve.prenom,  sortable: true },
    { name: 'Escadron', selector: row => row.Eleve.escadron, maxwidth: '2px',sortable :true},
    { name: 'Peloton', selector: row => row.Eleve.peloton,maxwidth: '100px',},
    { name: 'Incorporation', selector: row => row.Eleve.numeroIncorporation },
    { name: 'Date', selector: row => row.date },
    {
      name: 'Motifs',
      selector: row => row.motif,
      sortable: true,
      cell: row => (
        <span style={{ color: 'goldenrod', fontWeight: 'bold' }}>
          {row.motif}
        </span>
      )
    },
    
    {
      name: 'Actions',
      cell: row => (
        <>{ user?.type === 'superadmin' &&(
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.id)}>
            Delete
          </button>

          )}

          
        </>
      )
    }
    
   
  ];

  const fetchEleveData = async (inc, cour) => {
    try {
      const response = await eleveService.getByInc(inc, cour);
      if (response.data) {
        setEleveData(response.data);  // Stocke les données récupérées
        setAllEleves(response.data);
        //console.log("reponse maka by incorportation"+eleveData)
      } else {
      //  console.log('Élève non trouvé');
          
        alert("Elève non trouvé")
      }
    } catch (err) {
        setEleveData({});
        setAllEleves({});
     //   console.error('Erreur lors de la récupération des données:', err);
    }
  };

  useEffect(() => {
    if (incorporation && cour2) {
      fetchEleveData(incorporation, cour2);  // Passe à la fonction fetchEleveData
    }
  }, [incorporation, cour2]);
  //ajout absence 
  const handleSubmit = (e) => {
    e.preventDefault();
  
    const absenceExistante = [...listeAbsence, ...absencesTemporaires].some(abs => {
      const sameDate = new Date(abs.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0];
      const sameEleve = abs.eleveId === eleveData?.eleve?.id;
      return sameDate && sameEleve;
    });
    
  
    if (absenceExistante) {
      Swal.fire({
        toast: true,
        position: 'center',
        icon: 'warning',
        title: 'Cette absence existe déjà pour cette date.',
        showConfirmButton: false,
        timer: 3000,
        customClass: {
          title: 'swal-title-red'
        },
        timerProgressBar: true,
      });
      return;
    }
  
    const finalMotif = motif === "AUTRE" 
      ? `${autreMotif} (${typeMotif})` 
      : motif;
  
    const dataToAdd = {
      eleveId: eleveData.eleve.id,
      date,
      motif: finalMotif,
      nom: eleveData.eleve.nom, // utile pour l'affichage
      prenom: eleveData.eleve.prenom,
      escadron: eleveData.eleve.escadron,
      peloton: eleveData.eleve.peloton,
      numeroIncorporation:eleveData.eleve.numeroIncorporation,
      
    }
  
    setAbsencesTemporaires(prev => [...prev, dataToAdd]);
    setIncorporation('');
  
    Swal.fire({
      toast: true,
      position: 'center',
      icon: 'success',
      
      title: 'Absence ajoutée temporairement.',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        title: 'swal-title-yellow'
      }
    });
  };
  //envoie tous 
  const handleEnvoyerTout = () => {
    if (absencesTemporaires.length === 0) return;
  
    Swal.fire({
      title: 'Confirmer l\'envoi',
      text: `Voulez-vous enregistrer les ${absencesTemporaires.length} absences ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, enregistrer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        Promise.all(absencesTemporaires.map(abs =>
          absenceService.post(abs)
        ))
          .then(results => {
            Swal.fire({
              toast: true,
              position: 'center',
              icon: 'success',
              title: 'Toutes les absences ont été enregistrées.',
              showConfirmButton: false,
              timer: 3000,
            });
            setAbsencesTemporaires([]);
            absenceService.getAll()
              .then(res => setListeAbsence(res.data))
              .catch(err => console.error("Erreur lors de la mise à jour :", err));
          })
          .catch(error => {
            console.error("Erreur lors de l'enregistrement en masse :", error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Un problème est survenu lors de l\'enregistrement.',
            });
          });
      }
      
      
    });
  };
  
  
  
 //date aujourdhui
useEffect(() => {
  dateService.getServerDate()
    .then(response => {
      setDate(response.data.today);
      setFilter((prev) => ({ ...prev, date: response.data.today }));
      setSpaDate(response.data.today);
         // Met à jour newSpaSpeciale avec la date récupérée
         setNewSpaSpeciale(prev => ({ ...prev, date: response.data.today }));
    })
    .catch(error => {
     // console.error("Erreur lors de la récupération de la date serveur :", error);
    });
}, []);

// Application du filtre
       const absenceafficher = listeAbsence.filter(abs => {
            const escadronMatch = filter.escadron === '' || String(abs.Eleve.escadron) === filter.escadron;
            const pelotonMatch = filter.peloton === '' || String(abs.Eleve.peloton) === filter.peloton;
            const courMatch = filter.cour === '' || String(abs.Eleve.cour) === filter.cour;

            const matchSearch = !filter.search || (
              abs.Eleve.nom?.toLowerCase().includes(filter.search.toLowerCase()) ||
              abs.Eleve.prenom?.toLowerCase().includes(filter.search.toLowerCase()) ||
              String(abs.Eleve.numeroIncorporation)?.includes(filter.search)
            );
            const dateMatch = !filter.date || abs.date === filter.date;


            if (filter.peloton !== '' && filter.escadron === '' && filter.search) {
              return true;
            }

            return escadronMatch && pelotonMatch && courMatch && matchSearch && dateMatch;
       });
       //filter spa speciale 
       // Filtrer par cours et date
          
       
       

      //pour le filtre 
      //console.log("Toutes les absences :", listeAbsence);

  const handleFilterChange = (e) => {
     const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };
  //total eleve absence 
  const absencesParIncorporationEtMotif = absenceafficher.reduce((acc, eleve) => {
    const { numeroIncorporation, motif } = eleve;
    
    if (!acc[numeroIncorporation]) {
      acc[numeroIncorporation] = {};
    }
    
    if (!acc[numeroIncorporation][motif]) {
      acc[numeroIncorporation][motif] = 1;
    } else {
      acc[numeroIncorporation][motif]++;
    }
    
    return acc;
  }, {});
  //ppour SPA 
  const handleAfficherIndispo = () => {
    const motifsI =["ADMIS IG","IG", "CONSULTATION", "A REVOIR IG", "REPOS SANITAIRE","CONFINES EN CHAMBRE","GARDE MALADE IG","DONNEUR DE SANG","A REVOIR CHRR","A REVOIR CLINIC MANIA","CHAMBRE DE SURETE"];
    // ISO pour comparaison de dates
  const spaDateISO = new Date(spaDate).toISOString().slice(0, 10);

  const isIndisponibleMotif = (motif) => {
    if (!motif) return false;
    const motifUpper = motif.toUpperCase().trim();
    return (
      motifsI.includes(motifUpper) ||
      motifUpper.endsWith("(INDISPONIBLE)") ||
      motifUpper.endsWith("INDISPONIBLE")
    );
  };

    // Total indisponibles
  const totalIvalue = absenceafficher.filter(abs =>
    isIndisponibleMotif(abs.motif) &&
    abs.date === spaDate &&
    cour === cour
  ).length;
  
    // Total absents (non indisponibles)
  const totalAvalue = absenceafficher.filter(abs =>
    !isIndisponibleMotif(abs.motif) &&
    abs.date === spaDate
  ).length;

    // Prendre en compte les SPA spéciales
  const spaSpecialesDuJour = spaSpeciale.filter(spa => spa.date?.slice(0, 10) === spaDateISO);
  const totalASpeciale = spaSpecialesDuJour.reduce((total, spa) => total + (spa.nombre || 0), 0);

  // totalA ajusté
  const totalAwithSpecial = totalAvalue + totalASpeciale;
   
  
    setTotalI(totalIvalue);
    setTotalA(totalAwithSpecial);
  };
  //pagination tableau
   // Pagination pour tableau Absences par Motif
   const absenceMotifsArray = Object.entries(absencesParIncorporationEtMotif)
   .flatMap(([inc, motifs]) =>
     Object.entries(motifs).map(([motif, count]) => ({ motif, count }))
   );
   const totalAbsencePages = Math.ceil(absenceMotifsArray.length / ITEMS_PER_PAGE);
   const paginatedAbsences = absenceMotifsArray.slice(
   (pageAbsence - 1) * ITEMS_PER_PAGE,
   pageAbsence * ITEMS_PER_PAGE
   );

   // Pagination pour tableau Spa Spéciale
   // Filtrage combiné par date ET cours
   const spaFiltered = spaSpeciale.filter(spa => {
    const matchDate = filter.date ? spa.date?.slice(0, 10) === filter.date : true;
    const matchCour = filter.cour ? spa.cour === parseInt(filter.cour) : true;
    return matchDate && matchCour;
  });
  
//console.log("spa speciale veee",spaSpeciale)
// Pagination des motifs filtrés
const totalSpaPages = Math.ceil(spaFiltered.length / ITEMS_PER_PAGE);
const paginatedSpa = spaFiltered.slice(
  (pageSpa - 1) * ITEMS_PER_PAGE,
  pageSpa * ITEMS_PER_PAGE
);

// [OPTIONNEL] Si tu veux toujours afficher tous les motifs sans filtrage pour une autre section :
const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
const paginatedSpaSpeciale = spaSpeciale.slice(startIndex, startIndex + ITEMS_PER_PAGE);
const totalPages = Math.ceil(spaSpeciale.length / ITEMS_PER_PAGE);

//motif change 
const handleMotifChange = (e) => {
  setMotif(e.target.value);
  if (e.target.value !== "AUTRE") {
    setAutreMotif("");
  }
}
  // -----------------------------------------------
  ///En pdf 

  const handleExportPDFSimple = (footer = footerLines) => {
    try {
      const doc = new jsPDF({ format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginBottom = 20; // marge en bas pour éviter d’écrire trop bas
      
      // Formatage de la date
      const formattedDate = format(new Date(spaDate), "d MMMM yyyy", { locale: fr });

// Capitaliser la première lettre du mois (ex : "mai" -> "Mai")
     const capitalizedDate = formattedDate.replace(/\b\p{L}/u, c => c.toLowerCase());
  
      // Entête
      doc.setFontSize(10);
      doc.setFont("Times", "normal");
      doc.text("ECOLE DE LA GENDARMERIE NATIONALE", 5, 15);
      doc.text("AMBOSITRA", 35, 22);
      doc.text("----------------------", 32, 25);
      doc.text("DIRECTION DE L'INSTRUCTION", 17, 32);
      doc.text("----------------------", 32, 35);
      doc.text("COURS DE FORMATIONS DES ELEVES GENDARME", 5, 42);
      doc.text("-----------------------", 32, 45);
      doc.text("REPOBLIKAN'I MADAGASCAR", 150, 15);
      doc.text("Fitiavana - Tanindrazana - Fandrosoana", 145, 22);
      doc.text("-----------------------", 165, 25);
  
      doc.setFontSize(10);
      doc.text(`Situation de Prise d'Arme du ${filter.cour} CFEG du ${capitalizedDate} `, 90, 55);
  
      // Calcul des données spaSpeciale du jour
      const spaDateISO = new Date(spaDate).toISOString().slice(0, 10);
      const spaSpecialesDuJour = spaSpeciale.filter(spa => spa.date?.slice(0, 10) === spaDateISO);
      const totalAjoutSpaSpeciale = spaSpecialesDuJour.reduce((total, spa) => total + (spa.nombre || 0), 0);
      const totalASpeciale = totalA;
  
      // Premier tableau résumé
      autoTable(doc, {
        startY: 60,
        head: [['R', 'A', 'P', 'I', 'S']],
        body: [[
          spaNumber,
          totalASpeciale,
          spaNumber - totalASpeciale,
          totalI,
          (spaNumber - totalASpeciale) - totalI
        ]],
        theme: 'grid',
        tableWidth: 100,
        margin: { left: pageWidth - 120 },
        styles: {
          fontSize: 10,
          halign: 'center',
        },
      });
  
      // Préparation du tableau détaillé des absences
      const absencesDuJour = absenceafficher.filter(abs => abs.date === spaDate);
      const specificMotifs = ["IG","ADMIS IG", "CONSULTATION", "A REVOIR IG", "REPOS SANITAIRE","CONFINES EN CHAMBRE","GARDE MALADE IG","DONNEUR DE SANG","A REVOIR CHRR","A REVOIR CLINIC MANIA","CHAMBRE DE SURETE"];
     // Fonction pour identifier un motif "indisponible"
      const isIndisponible = (motif) => {
        if (!motif) return false;
        const motifUpper = motif.toUpperCase();
        return (
          specificMotifs.includes(motifUpper) ||
          motifUpper.endsWith("(INDISPONIBLE)")
        );
      };
      const groupedMotifs = {};
      absencesDuJour.forEach(abs => {
        const motif = abs.motif?.toUpperCase() || "SANS MOTIF";
        if (!groupedMotifs[motif]) groupedMotifs[motif] = [];
        groupedMotifs[motif].push(abs);
      });
  
      let bodyDetails = [];
  
      // En-tête motifs absents
      bodyDetails.push(['', { content: 'MOTIFS DES ABSENTS', styles: { fontStyle: 'bold' } }, '', '', '', '']);
      
  
      // Ajout des spaSpeciale
      spaSpecialesDuJour.forEach(spa => {
        bodyDetails.push([`${spa.motif.toUpperCase()} : ${spa.nombre}`, '', '', '', '', '']);
      });
  
      // Ajout des autres motifs (hors spécifiques)
     // Ajout des motifs "absents" (non indisponibles)
      Object.entries(groupedMotifs).forEach(([motif, absences]) => {
        if (!isIndisponible(motif)) {
          bodyDetails.push([`${motif} : ${absences.length}`, '', '', '', '', '']);
          absences.forEach(abs => {
            bodyDetails.push([
              '',
              abs.Eleve?.nom || '',
              abs.Eleve?.prenom || '',
              abs.Eleve?.numeroIncorporation || '',
              abs.Eleve?.escadron || '',
              abs.Eleve?.peloton || ''
            ]);
          });
        }
      });
  
      
      bodyDetails.push(['', { content: 'MOTIFS DES INDISPONIBLES', styles: { fontStyle: 'bold' } }, '', '', '', '']);
  
     // Ajout des motifs "indisponibles"
    Object.entries(groupedMotifs).forEach(([motif, absences]) => {
      if (isIndisponible(motif)) {
        bodyDetails.push([`${motif} : ${absences.length}`, '', '', '', '', '']);
        absences.forEach(abs => {
          bodyDetails.push([
            '',
            abs.Eleve?.nom || '',
            abs.Eleve?.prenom || '',
            abs.Eleve?.numeroIncorporation || '',
            abs.Eleve?.escadron || '',
            abs.Eleve?.peloton || ''
          ]);
        });
      }
    });
  
      // Deuxième tableau détaillé
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['MOTIFS', 'NOM', 'PRENOM', 'INC', 'ESC', 'PON']],
        body: bodyDetails,
        theme: 'striped',
       
        styles: {
          fontSize: 10,
          halign: 'left',
          cellPadding:1
        },
        headStyles: {
          fontStyle: 'bold',
        },
        showHead: 'firstPage',
        margin: { left: 5, right: 5 }, 
        columnStyles: {
          0: { cellWidth: 52 }, 
          
          4:{cellWidth:11},
          5:{cellWidth:11}
        },
        didParseCell: function (data) {
          if (data.column.index === 0 && data.cell.raw.includes(':')) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
       
      });
  
      // Texte final "DESTINATAIRES"
      let finalY = doc.lastAutoTable.finalY + 10;
      const lineHeight = 3;
      const destinataireLines = 13; // 13 lignes de texte écrites en tout
      const spaceNeeded = lineHeight * destinataireLines;
      
  
      if (finalY + spaceNeeded > pageHeight - marginBottom) {
        doc.addPage();
        finalY = 10;
      }
  
      doc.setFontSize(10);
      const text = "DESTINATAIRES";
      const x = 5;
      const y = finalY;
      doc.text(text, x, y);
      const textWidth = doc.getTextWidth(text);

      // Dessine une ligne juste en dessous du texte (ajuste `+1` si besoin)
      doc.line(x, y + 1, x + textWidth, y + 1);
      doc.text("- Monsieur le COLONEL ,", 7, finalY + 7);
      doc.text(" Commandant de l'Ecole de la Gendarmerie nationale ,", 7, finalY + 12);
      doc.text("-AMBOSITRA-", 70, finalY + 18);
      doc.text("(EGNA/CAB)", 45, finalY + 22);
  
      doc.text("- A Monsieur LE LIEUTENANT-COLONEL,", 7, finalY + 30);
      doc.text("Directeur de l'instruction a l'Ecole de la Gendarmerie nationale", 7, finalY + 35);
      doc.text("-AMBOSITRA-", 70, finalY + 41);
      doc.text("(EGNA/DI)", 45, finalY + 45);
  
      doc.text("- A Monsieur LE LIEUTENANT-COLONEL,", 7, finalY + 52);
      doc.text("Chef de Service Administratif et Financier,", 7, finalY + 57);
      doc.text("-AMBOSITRA-", 70, finalY + 63);
      doc.text("(EGNA/SAF)", 45, finalY + 67);
  
      doc.text("- Aux archives,", 7, finalY + 71);
     doc.text(footer.line1, 120, finalY + 7);
      doc.text(footer.line2, 130, finalY + 17);
      doc.text(footer.line3, 114, finalY + 23);
      doc.text(footer.line4, 130, finalY + 31);

  
      // Sauvegarde du PDF
      doc.save(`SPA DU_${spaDate}.pdf`);
  
    } catch (error) {
    //  console.error("Erreur lors de l'exportation du PDF :", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    }
  }
  const handleExportPDFNarratif = () => {
    const doc = new jsPDF();
  
    const formatDate = (date) => {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${d.getFullYear()}`;
    };
  
    const spaDateISO = new Date(spaDate).toISOString().slice(0, 10);
    const spaSpecialesDuJour = spaSpeciale.filter(
      (spa) => spa.date?.slice(0, 10) === spaDateISO
    );
    // Formatage de la date
    const formatDateCustom = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate();
      const year = date.getFullYear().toString().slice(-2);
    
      const monthMap = [
        "JAN", "FEV", "MAR", "AVR", "MAI", "JUN",
        "JUI", "AOU", "SEP", "OCT", "NOV", "DEC"
      ];
      const month = monthMap[date.getMonth()];
    
      return `${day} ${month} ${year}`;
    };
    const formattedDate = formatDateCustom(spaDate);

    doc.setFontSize(13);
    let content = `OBJET  SPA ELEVE GENDARME 79 EME CFEG X HVRC X DATE  DU ${formattedDate} X `;
    const totalRealise = spaNumber || 0;
    const totalAbsent = totalA || 0;
    const totalPresent = spaNumber - totalA || 0;
    const totalIndisponible = totalI || 0;
    const totalSurLeRang = totalRealise - totalAbsent - totalIndisponible;
  
    content += `EFFECTIF REALISE  ${totalRealise} X `;
    content += `ABSENTS  ${totalAbsent} X `;
    content += `PRESENTS  ${totalPresent} X `;
    content += `INDISPONIBLES  ${totalIndisponible} X `;
    content += `SUR LE RANG  ${totalSurLeRang} X `;
    
    // Fonctions d'aide
    const specificMotifs = [
      'IG',
      "ADMIS IG",
      'CONSULTATION',
      'A REVOIR IG',
      'REPOS SANITAIRE',
      'CONFINES EN CHAMBRE',
      'GARDE MALADE IG',
      'DONNEUR DE SANG',
      'CHAMBRE DE SURETE',
      'A REVOIR CHRR',
      'A REVOIR CLINIC MANIA',


    ];
    const isIndisponible = (motif) => {
      if (!motif) return false;
      const motifUpper = motif.toUpperCase();
      return (
        specificMotifs.includes(motifUpper) || motifUpper.endsWith('(INDISPONIBLE)')
      );
    };
  
    const absencesDuJour = absenceafficher.filter((abs) => abs.date === spaDate);
  
    const groupedMotifs = {};
    absencesDuJour.forEach((abs) => {
      const motif = abs.motif?.toUpperCase().trim() || 'SANS MOTIF';
      if (!groupedMotifs[motif]) groupedMotifs[motif] = [];
      groupedMotifs[motif].push(abs);
    });
  
    // Sections pour absents et indisponibles (à ajuster selon ta structure réelle)
    const sectionsAbsents = [
      'ALPHA',   'BRAVO',   'CHARLIE', 'DELTA',  'ECHO', 
      'FOXTROT', 'GOLF',    'HOTEL',   'INDIA',  'JULIETT', 
      'KILO',    'LIMA',    'MIKE',    'NOVEMBER','OSCAR',
      'PAPA',    'QUEBEC',  'ROMEO',   'SIERRA', 'TANGO',
      'UNIFORM', 'VICTOR',  'WHISKEY', 'XRAY',   'YANKEE', 
      'ZULU'
    ];
    
    const sectionsIndispo = [
      'PRIMO',    // 1er
      'SECUNDO',  // 2e
      'TERTIO',   // 3e
      'QUARTO',   // 4e
      'QUINTO',   // 5e
      'SESTO',    // 6e
      'SEPTIMO',  // 7e
      'OTTAVO',   // 8e
      'NONO',     // 9e
      'DECIMO'    // 10e
    ];
    
  
    // Fonction pour récupérer section par index (ou boucle)
    let indexSectionAbsent = 0;
    let indexSectionIndispo = 0;
  
    // Absents
    content += 'MOTIFS DES ABSENTS X ';

// 1. SPA spéciales
spaSpecialesDuJour.forEach(spa => {
  const section = sectionsAbsents[indexSectionAbsent % sectionsAbsents.length];
  const motif = spa.motif?.toUpperCase() || 'SPA SPECIALE';
  const nombre = spa.nombre || 0;
  content += `${section} X ${nombre} ${motif} X `;
  indexSectionAbsent++;
});

// 2. Absents classiques avec élèves
for (const [motif, absences] of Object.entries(groupedMotifs)) {
  if (!isIndisponible(motif)) {
    const section = sectionsAbsents[indexSectionAbsent % sectionsAbsents.length];
    const motifUpper = motif.toUpperCase();
    const nombre = absences.length;

    content += `${section} X ${nombre} ${motifUpper} X `;

    absences.forEach((abs, i) => {
      const eleve = abs.Eleve;
      const nom = eleve?.nom?.toUpperCase() || 'INCONNU';
      const numero = eleve?.numeroIncorporation || 'N/A';
      const prenom = eleve?.prenom.toUpperCase() || 'N/A';
      content += `${(i + 1).toString().padStart(2, '0')}/EG ${nom} ${prenom} NR ${numero} X  `;
    });

    indexSectionAbsent++;
  }
}

    
  
    // Indisponibles
    content += 'MOTIFS DES INDISPONIBLES X ';
for (const [motif, absences] of Object.entries(groupedMotifs)) {
  if (isIndisponible(motif)) {
    const section = sectionsIndispo[indexSectionIndispo % sectionsIndispo.length];
    const motifUpper = motif.toUpperCase();
    const nombre = absences.length;

    // Ajouter section, nombre et motif
    content += `${section} X ${nombre} ${motifUpper} X `;

    absences.forEach((abs, i) => {
      const eleve = abs.Eleve;
      const nom = eleve?.nom?.toUpperCase() || 'INCONNU';
      const numero = eleve?.numeroIncorporation || 'N/A';
      const prenom = eleve?.prenom.toUpperCase() || 'N/A';
      content += `${(i + 1).toString().padStart(2, '0')}/EG ${nom} ${prenom} NR ${numero} X `;
    });

    indexSectionIndispo++;
  }
}

  
    content += 'FIN RABEMANANTSOA';
  
    // Nettoyage espaces et retours ligne
    content = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
    const lineHeight = 7; // hauteur d'une ligne
    const margin = 10;
    const pageHeight = doc.internal.pageSize.height;
    
    // Divise le texte long en lignes compatibles avec la largeur de la page
    const lines = doc.splitTextToSize(content, 190);
    
    let y = margin;
    
    lines.forEach((line) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });
    
    doc.save('spa.pdf');
  };
  //en excel 
  const handleExportExcel = async () => {
    const { isConfirmed, value: exportType } = await Swal.fire({
      title: "Choix du format d'export",
      text: "Souhaitez-vous inclure les noms des élèves ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Exporter avec nomination",
      cancelButtonText: "Annuler",
      input: "radio",
      inputOptions: {
        simple: "Export simplifié (juste les totaux)",
        complet: "Export complet (avec les noms)",
      },
      inputValidator: (value) => {
        if (!value) return "Veuillez choisir un format.";
      },
    });
  
    if (!isConfirmed) return;
  
    const spaDateISO = new Date(spaDate).toISOString().slice(0, 10);
    const formattedDate = format(new Date(spaDate), "d MMMM yyyy", { locale: fr });
  
    const spaSpecialesDuJour = spaSpeciale.filter(
      (spa) => spa.date?.slice(0, 10) === spaDateISO
    );
    const totalAjoutSpaSpeciale = spaSpecialesDuJour.reduce(
      (total, spa) => total + (spa.nombre || 0),
      0
    );
  
    const resumeData = [
      ["", "Situation de Prise d'Arme"],
      ["Cours", `${filter.cour}`],
      ["Date", formattedDate],
      ["R", spaNumber],
      ["A", totalA],
      ["P", spaNumber - totalA],
      ["I", totalI],
      ["S", (spaNumber - totalA) - totalI],
    ];
  
    const absencesDuJour = absenceafficher.filter(
      (abs) => abs.date === spaDate
    );
  
    const specificMotifs = [
      "IG",
      "ADMIS IG",
      "CONSULTATION",
      "A REVOIR IG",
      "REPOS SANITAIRE",
      "CONFINES EN CHAMBRE",
      "GARDE MALADE IG",
      "DONNEUR DE SANG",
      "CHAMRE DE SURETE",
      "A REVOIR CHRR",
      "A REVOIR CLINIC MANIA",
      "CHAMBRE DE SURETE"
    ];
  
    const isIndisponible = (motif) => {
      if (!motif) return false;
      const motifUpper = motif.toUpperCase().trim();
      return (
        specificMotifs.includes(motifUpper) ||
        motifUpper.endsWith("(INDISPONIBLE)") ||
        motifUpper.endsWith("INDISPONIBLE")
      );
    };
  
    // Regrouper les motifs
    const groupedMotifs = {};
    absencesDuJour.forEach((abs) => {
      const motif = abs.motif?.toUpperCase().trim() || "SANS MOTIF";
      if (!groupedMotifs[motif]) groupedMotifs[motif] = [];
      groupedMotifs[motif].push(abs);
    });
  
    const detailsData = [];
  
    if (exportType === "complet") {
      // EXPORT COMPLET
      detailsData.push(["MOTIFS DES ABSENTS"]);
      spaSpecialesDuJour.forEach((spa) => {
        detailsData.push([`${spa.motif.toUpperCase()} : ${spa.nombre}`]);
      });
  
      Object.entries(groupedMotifs).forEach(([motif, absences]) => {
        if (!isIndisponible(motif)) {
          detailsData.push([`${motif} : ${absences.length}`]);
          detailsData.push(["", "Nom", "Prénom", "Incorporation", "Escadron", "Peloton"]);
          absences.forEach((abs) => {
            detailsData.push([
              "",
              abs.Eleve?.nom || "",
              abs.Eleve?.prenom || "",
              abs.Eleve?.numeroIncorporation || "",
              abs.Eleve?.escadron || "",
              abs.Eleve?.peloton || "",
            ]);
          });
        }
      });
  
      detailsData.push([""]);
      detailsData.push(["MOTIFS DES INDISPONIBLES"]);
  
      Object.entries(groupedMotifs).forEach(([motif, absences]) => {
        if (isIndisponible(motif)) {
          detailsData.push([`${motif} : ${absences.length}`]);
          detailsData.push(["", "Nom", "Prénom", "Incorporation", "Escadron", "Peloton"]);
          absences.forEach((abs) => {
            detailsData.push([
              "",
              abs.Eleve?.nom || "",
              abs.Eleve?.prenom || "",
              abs.Eleve?.numeroIncorporation || "",
              abs.Eleve?.escadron || "",
              abs.Eleve?.peloton || "",
            ]);
          });
        }
      });
    } else {
      // EXPORT SIMPLIFIÉ
      detailsData.push(["MOTIFS DES ABSENTS"]);
      spaSpecialesDuJour.forEach((spa) => {
        detailsData.push([`${spa.motif.toUpperCase()} : ${spa.nombre}`]);
      });
  
      Object.entries(groupedMotifs).forEach(([motif, absences]) => {
        if (!isIndisponible(motif)) {
          detailsData.push([`${motif} : ${absences.length}`]);
        }
      });
  
      detailsData.push([""]);
      detailsData.push(["MOTIFS DES INDISPONIBLES"]);
  
      Object.entries(groupedMotifs).forEach(([motif, absences]) => {
        if (isIndisponible(motif)) {
          detailsData.push([`${motif} : ${absences.length}`]);
        }
      });
    }
  
    // 📄 Création du fichier Excel
    const wb = XLSX.utils.book_new();
    const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
    const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
  
    XLSX.utils.book_append_sheet(wb, wsResume, "Résumé SPA");
    XLSX.utils.book_append_sheet(wb, wsDetails, "Détails Absences");
  
    const formattedFilenameDate = format(new Date(spaDate), "dd_MMMM_yyyy", { locale: fr }).toUpperCase();
    const filename = exportType === "complet"
      ? `SPA_COMPLET_DU_${formattedFilenameDate}.xlsx`
      : `SPA_RESUME_DU_${formattedFilenameDate}.xlsx`;
  
    XLSX.writeFile(wb, filename);
  };
      
  
              //set filter o
              const handleResetFilter = () => {
                setFilter({
                  cour: "",
                  escadron: "",
                  peloton: "",
                  search: "",
                  date: "",
                });
              };
           
  
              return (
                <div className="container mt-5">
                <h2 className="text-center text-uppercase fw-bold text-primary mb-4" style={{ letterSpacing: "2px" }}>
                  Saisie des Absences - Élève Gendarme
                </h2>
                <hr className="mx-auto" style={{ width: "100px", borderTop: "3px solid #0d6efd" }} />
              
                  <br></br>
                  <div className="row">
                    {/* Formulaire à gauche */}
                    <div className="col-md-4">
              <form onSubmit={handleSubmit} className="p-4 bg-light rounded shadow-sm">
                {/* Sélection du cours */}
                <div className="mb-3">
                  <label htmlFor="cour2" className="form-label d-flex align-items-center">
                    <i className="fas fa-book me-2"></i>Cours
                  </label>
                  <select
                    id="cour2"
                    className="form-select border border-secondary shadow-sm"

                    value={cour2}
                    onChange={(e) => setCour2(e.target.value)}
                    required
                  >
                    {coursList2.map((item) => (
                      <option key={item.id} value={item.cour}>
                        {item.cour}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Saisie du numéro d'incorporation */}
                <div className="mb-3">
                  <label htmlFor="incorporation" className="form-label d-flex align-items-center">
                    <i className="fas fa-id-badge me-2"></i>Numéro d'Incorporation
                  </label>
                  <input
                    id="incorporation"
                    type="text"
                    className="form-select border border-secondary shadow-sm"

                    value={incorporation}
                    onChange={(e) => setIncorporation(e.target.value)}
                    required
                  />
                </div>

                {/* Affichage automatique des informations de l'élève */}
                {eleveData && Object.keys(eleveData).length > 0 && (
                  <>
                   

                    <div className="mb-3">
                      <label htmlFor="prenom" className="form-label d-flex align-items-center">
                        <i className="fas fa-user-tag me-2"></i>Nom et Prénom
                      </label>
                      <input
                        id="prenom"
                        type="text"
                        className="form-control"
                        value={eleveData.eleve.nom +" "+ eleveData.eleve.prenom || ''}
                        disabled
                      />
                    </div>

                 

                    <div className="mb-3">
                      <label htmlFor="escadron" className="form-label d-flex align-items-center">
                        <i className="fas fa-shield-alt me-2"></i>Escadron
                      </label>
                      <input
                        id="escadron"
                        type="text"
                        className="form-control"
                        value={eleveData.eleve.escadron || ''}
                        disabled
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="peloton" className="form-label d-flex align-items-center">
                        <i className="fas fa-users me-2"></i>Peloton
                      </label>
                      <input
                        id="peloton"
                        type="text"
                        className="form-control"
                        value={eleveData.eleve.peloton || ''}
                        disabled
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="dateNaissance" className="form-label d-flex align-items-center">
                        <i className="fas fa-calendar-alt me-2"></i>Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        name="dateNaissance"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>

                  {/* Sélection du motif */}
                      <div className="mb-3">
                        <label htmlFor="motif" className="form-label d-flex align-items-center">
                          <i className="fas fa-list-alt me-2"></i>Motif
                        </label>
                        <select
                          id="motif"
                          className="form-select border-0 shadow-sm"
                          value={motif}
                          onChange={(e) => setMotif(e.target.value)}
                          required
                        >
                          <option value="">Sélectionner un motif</option>
                          <option value="A REVOIR CENHOSOA">A REVOIR CENHOSOA</option>
                            <option value="A REVOIR CHRR">A REVOIR CHRR</option>
                            <option value="A REVOIR CLINIC MANIA">A REVOIR CLINIC MANIA</option>
                            <option value="A REVOIR IG">A REVOIR IG</option>
                            <option value="AD CEGN">AD CEGN</option>
                            <option value="AD COM DLI">AD COM DLI</option>
                            <option value="AD COM DQG SPORT">AD COM DQG SPORT</option>
                            <option value="AD MDG">AD MDG</option>
                            <option value="ADMIS CENHOSOA">ADMIS CENHOSOA</option>
                            <option value="ADMIS CHRR">ADMIS CHRR</option>
                            <option value="ADMIS CLINIC MANIA">ADMIS CLINIC MANIA</option>
                            <option value="ADMIS HOMI">ADMIS HOMI</option>
                            <option value="ADMIS IG">ADMIS IG</option>
                            <option value="ANM">ANM</option>
                            <option value="ARTS MARTIAUX">ARTS MARTIAUX</option>
                            <option value="CHAMBRE DE SURETE">CHAMBRE DE SURETE</option>
                            <option value="CHRR">CHRR</option>
                            <option value="CONFINES EN CHAMBRE">CONFINES EN CHAMBRE</option>
                            <option value="CONSULTATION">CONSULTATION</option>
                            <option value="CONSULTATION CLINIC MANIA">CONSULTATION CLINIC MANIA</option>
                            <option value="CONSULTATION EXTERNE">CONSULTATION EXTERNE</option>
                            <option value="DEFILE AMBOSITRA">DEFILE AMBOSITRA</option>
                            <option value="DEFILE TANA">DEFILE TANA</option>
                            <option value="DONNEUR DE SANG">DONNEUR DE SANG</option>
                            <option value="EVASAN">EVASAN</option>
                            <option value="GARDE MALADE IG">GARDE MALADE IG</option>
                            <option value="MISSION">MISSION</option>
                            <option value="MISSION TANA">MISSION TANA</option>
                            <option value="PERMISSION">PERMISSION</option>
                            <option value="REPOS SANITAIRE">REPOS SANITAIRE</option>
                            <option value="S.O">S.O</option>
                            <option value="SPORT">SPORT</option>
                            <option value="STAGE">STAGE</option>
                            <option value="TOBY FANDRIANA">TOBY FANDRIANA</option>
                            <option value="VATOVORY">VATOVORY</option>

                          <option value="AUTRE">Autre...</option>
                        </select>
                      </div>

                      {/* Champ texte si "Autre" est sélectionné */}
                      {motif === 'AUTRE' && (
                        <>
                          <div className="mb-3">
                            <label htmlFor="autreMotif" className="form-label">
                              <i className="fas fa-pen me-2"></i>Motif personnalisé
                            </label>
                            <input
                              type="text"
                              id="autreMotif"
                              className="form-control border-0 shadow-sm"
                              value={autreMotif}
                              onChange={(e) => setAutreMotif(e.target.value)}
                              placeholder="Saisir le motif"
                              required
                            />
                          </div>

                          <div className="mb-3">
                            <label htmlFor="typeMotif" className="form-label">
                              <i className="fas fa-check-circle me-2"></i>Type de motif
                            </label>
                            <select
                              id="typeMotif"
                              className="form-select border-0 shadow-sm"
                              value={typeMotif}
                              onChange={(e) => setTypeMotif(e.target.value)}
                              required
                            >
                              <option value="">Choisir le type</option>
                              <option value="ABSENT">ABSENT</option>
                              <option value="INDISPONIBLE">INDISPONIBLE</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* Bouton Enregistrer */}
                      {user?.type === 'saisie' && (
                        <div className="text-center">
                          <button
                            type="submit"
                            className="btn btn-success w-100 shadow-sm"
                          >
                            <i className="fas fa-save me-2"></i>Enregistrer Absence
                          </button>
                          <br></br>
                          <br></br>
                                   {absencesTemporaires.length > 0 && (
                                          <Button variant="warning" onClick={handleOpenModal}>
                                            Voir absences en attente ({absencesTemporaires.length})
                                          </Button>
                                        )}
                            </div>
                            )}
                                        </>
                                      )}
                                    </form>
                                  </div>

                    {/* Tableau des absences à droite */}
                              <div className="col-md-8 mx-auto">
                              <h3 className="text-center mb-4 fw-bold text-primary">📋 Liste des Absents</h3>                
                                {/* Card pour le formulaire de recherche */}
                                <div className="card shadow-sm">
                                  <div className="card-body">
                                    <form className="mb-4">
                                      <div className="row">
                                        {/* Sélecteur de Cours */}
                                        <div className="col-md-4 mb-3">
                                          
                                          <select
                                            className="form-select"
                                            name="cour"
                                            value={filter.cour}
                                            onChange={handleFilterChange}
                                          >
                                            {coursList.map((c) => (
                                              <option key={c.id} value={c.cour}>
                                                {c.cour}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Sélecteur d'Escadron */}
                                        <div className="col-md-4 mb-3">
                                      
                                          <select
                                            className="form-select"
                                            name="escadron"
                                            value={filter.escadron}
                                            onChange={handleFilterChange}
                                          >
                                            <option value="">Escadron</option>
                                            {[...Array(10)].map((_, i) => (
                                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Sélecteur de Peloton */}
                                        <div className="col-md-4 mb-3">
                                        
                                          <select
                                            className="form-select"
                                            name="peloton"
                                            value={filter.peloton}
                                            onChange={handleFilterChange}
                                          >
                                            <option value="">Peloton</option>
                                            {[1, 2, 3].map(p => (
                                              <option key={p} value={p}>{p}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>

                                      {/* Recherche par nom ou prénom */}
                                      <div className="row mt-3">
                                        <div className="col-md-8 mb-3">
                                        
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Rechercher par nom, prénom ou incorporation"
                                            name="search"
                                            value={filter.search}
                                            onChange={handleFilterChange}
                                          />
                                        </div>

                                        {/* Sélecteur de Date */}
                                        <div className="col-md-4 mb-3">
                                        
                                          <input
                                            type="date"
                                            className="form-control"
                                            name="date"
                                            value={filter.date}
                                            onChange={handleFilterChange}
                                          />
                                        </div>
                                      </div>
                                      <div className="d-flex justify-content-center mt-4">
                                      <button type="button" className="btn btn-outline-secondary px-4 py-2 rounded-pill shadow-sm"    onClick={handleResetFilter}>               
                                      🔁 Réinitialiser la recherche
                                    </button>
                                      </div>

                                    </form>
                                  </div>
                               </div>

                                        <br></br>                                                                 
                                          <DataTable
                                              columns={columns}
                                              data={absenceafficher}
                                              pagination
                                              paginationPerPage={10}
                                              paginationRowsPerPageOptions={[10,20,50, 100]}
                                              highlightOnHover
                                              striped
                                              noDataComponent="Aucun élève à afficher"
                                              customStyles={customStyles}
                                            />
                                         <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 my-4">
                                            <button
                                              className="btn btn-outline-primary w-100 w-md-auto"
                                              onClick={() => setShowTable(prev => !prev)}
                                            >
                                              {showTable ? " 📝 Masquer le résumé " : " 📝 Afficher le résumé"}
                                            </button>
                                          
                                            <button
                                              className="btn btn-outline-success w-100 w-md-auto"
                                              onClick={() => setShowModal(true)}
                                            >
                                              ⚔️ Situation de Prise d'Arme (SPA)
                                            </button>
                                      
                                            {(user?.type !== 'user' && user?.type !== 'spa' )&&  (
                                            <button
                                              className="btn btn-outline-success w-100 w-md-auto"
                                              onClick={() => setShowSpaSpecialeModal(true)}
                                            >
                                              ⚔️ SPA SPECIALE
                                            </button>
                                          )}



                                            {showSpaSpecialeModal && (
                                      <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                        <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
                                          <div className="modal-content">
                                            <div className="modal-header">
                                              <h5 className="modal-title">Ajouter SPA Spéciale</h5>
                                              <button type="button" className="btn-close" onClick={() => setShowSpaSpecialeModal(false)}></button>
                                            </div>
                                            <div className="modal-body d-flex flex-column flex-md-row gap-4">
                                              {/* Formulaire SPA spéciale */}
                                              <div className="flex-fill">
                                                <form>
                                                  <div className="mb-3">
                                                    <label className="form-label">Motif</label>
                                                    <input
                                                      type="text"
                                                      className="form-control"
                                                      value={newSpaSpeciale.motif}
                                                      onChange={(e) => setNewSpaSpeciale({ ...newSpaSpeciale, motif: e.target.value })}
                                                      required
                                                    />
                                                  </div>
                                                  <div className="mb-3">
                                                    <label className="form-label">Nombre</label>
                                                    <input
                                                      type="number"
                                                      className="form-control"
                                                      value={newSpaSpeciale.nombre}
                                                      onChange={(e) => setNewSpaSpeciale({ ...newSpaSpeciale, nombre: Number(e.target.value) })}
                                                      required
                                                    />
                                                  </div>
                                                  <div className="mb-3">
                                                    <label className="form-label">Date</label>
                                                    <input
                                                      type="date"
                                                      className="form-control"
                                                      value={newSpaSpeciale.date}
                                                      required
                                                      onChange={(e) => setNewSpaSpeciale({ ...newSpaSpeciale, date: e.target.value })}
                                                    />
                                                  </div>
                                                  <div className="d-flex justify-content-between">
                                                  <button
                                                    type="button"
                                                    className="btn btn-success"
                                                    onClick={() => {
                                                      if (!newSpaSpeciale.motif || !newSpaSpeciale.nombre || !newSpaSpeciale.date) {
                                                        Swal.fire({
                                                          icon: 'warning',
                                                          title: 'Champs manquants',
                                                          text: 'Veuillez remplir tous les champs requis (motif, nombre, date).',
                                                        });
                                                        return;
                                                      }

                                                      // Ajout au tableau temporaire
                                                      const newEntry = { ...newSpaSpeciale, cour: filter.cour };

                                                      setSpaSpecialeTempList(prev => [...prev, newEntry]);

                                                      Swal.fire({
                                                        icon: 'success',
                                                        title: 'Ajouté au tableau temporaire',
                                                        showConfirmButton: false,
                                                        timer: 1000
                                                      });

                                                      // Réinitialise le formulaire
                                                      setNewSpaSpeciale({ motif: "", nombre: "", date: date });
                                                    }}
                                                  >
                                                    Ajouter
                                                  </button>



                                                    <button className="btn btn-secondary" onClick={() => setShowSpaSpecialeModal(false)}>Fermer</button>
                                                    
                                                  </div>
                                                  <table className="table mt-3">
                                                    <thead>
                                                      <tr>
                                                        <th>Motif</th>
                                                        <th>Nombre</th>
                                                        <th>Date</th>
                                                        <th>Actions</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {spaSpecialeTempList.map((item, index) => (
                                                        <tr key={index}>
                                                          <td>{item.motif}</td>
                                                          <td>{item.nombre}</td>
                                                          <td>{item.date}</td>
                                                          <td>
                                                            <button
                                                              className="btn btn-danger btn-sm"
                                                              onClick={() => {
                                                                setSpaSpecialeTempList(prev => prev.filter((_, i) => i !== index));
                                                              }}
                                                            >
                                                              Supprimer
                                                            </button>
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                  <button
                                                    className="btn btn-primary mt-3"
                                                    onClick={() => {
                                                      if (spaSpecialeTempList.length === 0) {
                                                        Swal.fire({
                                                          icon: 'info',
                                                          title: 'Aucun motif à envoyer',
                                                          text: 'Ajoutez au moins un motif avant de valider.',
                                                        });
                                                        return;
                                                      }

                                                      Swal.fire({
                                                        title: 'Confirmer l\'envoi',
                                                        text: 'Voulez-vous vraiment envoyer tous les motifs à la base de données ?',
                                                        icon: 'question',
                                                        showCancelButton: true,
                                                        confirmButtonText: 'Oui, envoyer',
                                                        cancelButtonText: 'Annuler'
                                                      }).then((result) => {
                                                        if (result.isConfirmed) {
                                                          Promise.all(
                                                            spaSpecialeTempList.map(item => spaspecialeService.post(item))
                                                          )
                                                            .then(() => {
                                                              Swal.fire({
                                                                icon: 'success',
                                                                title: 'Tous les motifs ont été envoyés',
                                                                showConfirmButton: false,
                                                                timer: 1500
                                                              });
                                                              setSpaSpecialeTempList([]);
                                                              spaspecialeService.getAll().then(res => setSpaSpeciale(res.data || []));
                                                            })
                                                            .catch(err => {
                                                              console.error(err);
                                                              Swal.fire({
                                                                icon: 'error',
                                                                title: 'Erreur',
                                                                text: 'Erreur lors de l\'envoi. Veuillez réessayer.',
                                                              });
                                                            });
                                                        }
                                                      });
                                                    }}
                                                  >
                                                    Valider et envoyer
                                                  </button>


                                                </form>
                                              </div>

                                              {/* Liste des SPA spéciales avec pagination */}
                                              <div className="flex-fill border-start ps-3">
                                                <h6 className="mb-2">📋 Motifs spéciaux existants</h6>
                                                <ul className="list-group">
                                                  {paginatedSpaSpeciale.length > 0 ? (
                                                    paginatedSpaSpeciale.map((spa) => (
                                                      <li key={spa._id} className="list-group-item d-flex justify-content-between align-items-center">
                                                        <div>
                                                          <strong>{spa.motif}</strong> <small className="text-muted">({spa.date?.slice(0, 10)})</small>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2">
                                                          <span className="badge bg-primary">{spa.nombre}</span>
                                                          {user?.type !== 'saisie' && (
                                                            <button
                                                              className="btn btn-sm btn-danger"
                                                              onClick={() => {
                                                                if (window.confirm("Supprimer ce motif ?")) {
                                                                  spaspecialeService.delete(spa.id)
                                                                    .then(() => {
                                                                      setSpaSpeciale(spaSpeciale.filter(item => item.id !== spa.id));
                                                                    })
                                                                    .catch(err => {
                                                                     //console.error(err);
                                                                      alert("Erreur lors de la suppression.");
                                                                    });
                                                                }
                                                              }}
                                                            >
                                                              Supprimer
                                                            </button>
                                                          )}
                                                         

                                                        </div>
                                                      </li>
                                                    ))
                                                  ) : (
                                                    <li className="list-group-item text-muted text-center">Aucun motif</li>
                                                  )}
                                                </ul>

                                                {/* Pagination */}
                                                <nav className="mt-3">
                                                  <ul className="pagination justify-content-center">
                                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                      <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>Précédent</button>
                                                    </li>
                                                    {Array.from({ length: totalPages }, (_, i) => (
                                                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                                      </li>
                                                    ))}
                                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                      <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>Suivant</button>
                                                    </li>
                                                  </ul>
                                                  

                                                </nav>
                                              </div>
                                             
                                             
    



                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}




                                          </div>
                                

                                          {showTable && (
                                          <div className="mt-4">

                                            {/* ==== TABLEAU ABSENCES ==== */}
                                            <h5 className="text-center mb-3">Absences par Élève et Motif</h5>
                                            <table className="table table-bordered table-striped table-sm text-center">
                                              <thead className="table-dark">
                                                <tr>
                                                  <th>Motif</th>
                                                  <th>Nombre d'absences</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {paginatedAbsences.map((entry, index) => (
                                                  <tr key={index}>
                                                    <td>{entry.motif}</td>
                                                    <td><span className="badge bg-primary">{entry.count}</span></td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                              <div><strong>Total :</strong> {absenceafficher.length} absences enregistrées</div>
                                              <div>
                                                <button
                                                  className="btn btn-sm btn-outline-secondary me-2"
                                                  disabled={pageAbsence === 1}
                                                  onClick={() => setPageAbsence(p => p - 1)}
                                                >
                                                  ◀ Précédent
                                                </button>
                                                <button
                                                  className="btn btn-sm btn-outline-secondary"
                                                  disabled={pageAbsence === totalAbsencePages}
                                                  onClick={() => setPageAbsence(p => p + 1)}
                                                >
                                                  Suivant ▶
                                                </button>
                                              </div>
                                            </div>

                                            {/* ==== TABLEAU MOTIF SPECIAL ==== */}
                                            <h5 className="text-center mb-3">
                                              {filter.date ? `Motifs Spéciaux du ${filter.date}` : ""}
                                            </h5>
                                            <h5 className="text-center mb-3">
                                            {filter.date
                                              ? `Motifs Spéciaux du ${filter.date}${filter.cour ? ` - ${filter.cour}` : ''}`
                                              : filter.cour
                                                ? `Motifs Spéciaux pour le cours ${filter.cour}`
                                                : "Tous les Motifs Spéciaux"}
                                          </h5>

                                          <table className="table table-bordered table-striped table-sm text-center">
                                            <thead className="table-warning">
                                              <tr>
                                                <th>Motif</th>
                                                <th>Nombre</th>
                                                <th>Date</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {paginatedSpa.length > 0 ? (
                                                paginatedSpa.map((spa, index) => (
                                                  <tr key={index}>
                                                    <td>
                                                      {spa.motif} <span className="badge bg-info">[Spécial]</span>
                                                    </td>
                                                    <td>
                                                      <span className="badge bg-warning">{spa.nombre}</span>
                                                    </td>
                                                    <td>{spa.date}</td>
                                                  </tr>
                                                ))
                                              ) : (
                                                <tr>
                                                  <td colSpan="3">Aucun motif spécial pour ces critères</td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>

                                          <div className="d-flex justify-content-end mb-3">
                                            <button
                                              className="btn btn-sm btn-outline-secondary me-2"
                                              disabled={pageSpa === 1}
                                              onClick={() => setPageSpa((p) => p - 1)}
                                            >
                                              ◀ Précédent
                                            </button>
                                            <button
                                              className="btn btn-sm btn-outline-secondary"
                                              disabled={pageSpa === totalSpaPages}
                                              onClick={() => setPageSpa((p) => p + 1)}
                                            >
                                              Suivant ▶
                                            </button>
                                          </div>

                                            
                                          </div>
                                        )}
                            <>
      <Button
        className="mb-3"
        variant="primary"
        onClick={() => setMainModalVisible(true)}
      >
        🗂 Ouvrir la liste des consultations EVASAN
      </Button>

      <Modal
        size="xl"
        show={mainModalVisible}
        onHide={() => setMainModalVisible(false)}
        className='modal2'
      
      >
        <Modal.Header closeButton>
          <Modal.Title>📋 Liste des consultations EVASAN</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <input
              type="text"
              className="form-control shadow-sm"
              placeholder="🔍 Rechercher un élève (nom ou prénom)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <table className="table table-bordered table-hover table-striped shadow-sm">
            <thead className="table-dark text-center">
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Élève</th>
                <th>Hospitalisé</th>
              </tr>
            </thead>
            <tbody>
              {currentConsultations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    Aucune consultation EVASAN
                  </td>
                </tr>
              ) : (
                currentConsultations.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={c.hospitalise ? "table-success" : ""}
                  >
                    <td>{startIndex + idx + 1}</td>
                    <td>{c.date}</td>
                    <td>
                      {c.Eleve?.nom} {c.Eleve?.prenom}
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={c.hospitalise}
                        onChange={(e) =>
                          handleHospitaliseChange(c, e.target.checked)
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <nav>
            <ul className="pagination justify-content-center">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ⬅️ Précédent
                </button>
              </li>
              <li className="page-item disabled">
                <span className="page-link">
                  Page {currentPage} / {totalPages1}
                </span>
              </li>
              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Suivant ➡️
                </button>
              </li>
            </ul>
          </nav>

          {/* Modal saisie service + garde malade */}
          <Modal show={modaleVisible} onHide={() => setModaleVisible(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Saisie service et garde malade</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <label>Service</label>
                <input
                  type="text"
                  name="service"
                  className="form-control"
                  value={selectedConsultation?.service || ""}
                  onChange={handleModalChange}
                />
              </div>
              <div className="mb-3">
                <label>Garde malade (cadre)</label>
                <select
                  name="cadreId"
                  className="form-control"
                  value={selectedConsultation?.cadreId || ""}
                  onChange={handleModalChange}
                >
                  <option value="">-- Sélectionner un cadre --</option>
                  {cadres.map((cadre) => (
                    <option key={cadre.id} value={cadre.id}>
                      {cadre.nom} ({cadre.service}) ({cadre.matricule})
                    </option>
                  ))}
                </select>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setModaleVisible(false)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSaveModal}>
                Enregistrer
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Formulaire ajout garde malade */}
          <div className="mt-5 p-3 border rounded shadow-sm bg-light">
            <h4 className="text-success">Ajouter un garde malade (cadre)</h4>
            <div className="mb-2">
              <select
                name="cadreId"
                className="form-control"
                value={selectedCadreId}
                onChange={handleSelectCadre}
              >
                <option value="">-- Sélectionner un cadre --</option>
                {cadres.map((cadre) => (
                  <option key={cadre.id} value={cadre.id}>
                    {cadre.nom} ({cadre.service}) ({cadre.matricule})
                  </option>
                ))}
              </select>
            </div>
            {["nom", "matricule", "grade", "service", "phone"].map((field, i) => (
              <div className="mb-2" key={i}>
                <input
                  type={field === "matricule" ? "number" : "text"}
                  name={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="form-control"
                  value={newsGardeMalade[field]}
                  readOnly
                />
              </div>
            ))}
            <button
              className="btn btn-success w-100"
              onClick={handleAddGardeMalade}
            >
              ➕ Ajouter
            </button>
          </div>

          {/* Liste garde malade élèves hospitalisés */}
          <div className="mt-5">
            <h4>🧑‍⚕️ Garde malade – Élèves hospitalisés</h4>
            {uniqueGardeMalades.length === 0 ? (
              <p>Aucun garde malade trouvé.</p>
            ) : (
              <table className="table table-striped table-bordered shadow-sm">
                <thead className="table-primary">
                  <tr>
                    <th>Nom cadre</th>
                    <th>Service</th>
                    <th>Numéro</th>
                    <th>Élève assigné</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueGardeMalades.map((cadre) => {
                    const consultationAssociee = consultations.find(
                      (c) => c.status === "EVASAN" && c.cadreId === cadre.id
                    );
                    const eleve = consultationAssociee?.Eleve;
                    return (
                      <tr key={cadre.id}>
                        <td>{cadre.nom}</td>
                        <td>{cadre.service}</td>
                        <td>{cadre.phone}</td>
                        <td>
                          {eleve
                            ? `${eleve.nom} ${eleve.prenom}`
                            : "Élève non assigné"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Liste garde malade élèves non hospitalisés */}
          <div className="mt-5">
            <h4>👥 Garde malade – Élèves non hospitalisés</h4>
            {gardesMalades.length === 0 ? (
              <p>Aucun garde malade pour élèves non hospitalisés.</p>
            ) : (
              <table className="table table-bordered table-hover shadow-sm">
                <thead className="table-light">
                  <tr>
                    <th>Nom</th>
                    <th>Matricule</th>
                    <th>Grade</th>
                    <th>Service</th>
                    <th>Numéro</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {gardesMalades.map((gm) => (
                    <tr key={gm.id}>
                      <td>{gm.nom}</td>
                      <td>{gm.matricule}</td>
                      <td>{gm.grade || "-"}</td>
                      <td>{gm.service || "-"}</td>
                      <td>{gm.phone || "-"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteGardemalade(gm.id)}
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <button className="btn btn-outline-primary mt-4" onClick={handleExportPDFGarde}>
            📤 Exporter en PDF
          </button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMainModalVisible(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </>



                                        </div>
                                      </div>
                                      <Modal show={showModale} onHide={handleCloseModal} size="xl" centered>
                                      <Modal.Header closeButton>
                                        <Modal.Title>Absences en attente d’envoi</Modal.Title>
                                      </Modal.Header>
                                      <Modal.Body>
                                        <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                                          {Object.entries(absencesParMotif).map(([motif, absences]) => (
                                            <div 
                                              key={motif} 
                                              style={{ 
                                                minWidth: '250px', 
                                                border: '1px solid #ddd', 
                                                borderRadius: '5px', 
                                                padding: '10px', 
                                                backgroundColor: '#f9f9f9' 
                                              }}
                                            >
                                              <h5 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
                                                {motif} ({absences.length})
                                              </h5>
                                              <ul className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                {absences.map((a, idx) => (
                                                  <li
                                                    key={idx}
                                                    className="list-group-item d-flex justify-content-between align-items-center"
                                                    style={{ padding: '5px 10px' }}
                                                  >
                                                    <div style={{ fontSize: '1em' }}>
                                                      <strong>{a.numeroIncorporation} {a.escadron}{"/"}{a.peloton}</strong> {a.nom} {a.prenom} <br />
                                                      <small>{new Date(a.date).toLocaleDateString()}</small>
                                                    </div>
                                                    <button
                                                      className="btn btn-sm btn-danger"
                                                      onClick={() => handleSupprimerTemporaire(a)}
                                                      style={{ height: '30px', padding: '0 8px' }}
                                                    >
                                                      ×
                                                    </button>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          ))}
                                        </div>
                                      </Modal.Body>

                                      <Modal.Footer>
                                        <Button variant="secondary" onClick={handleCloseModal}>
                                          Fermer
                                        </Button>
                                        <Button
                                          variant="success"
                                          onClick={() => {
                                            handleEnvoyerTout();
                                            handleCloseModal();
                                          }}
                                          disabled={absencesTemporaires.length === 0}
                                        >
                                          Enregistrer tout
                                        </Button>
                                      </Modal.Footer>
                                    </Modal>

                                      {showModal && (
                                        <>
                                          {/* Overlay backdrop */}
                                          <div className="custom-modal-overlay">
                                            <div className="modal-dialog custom-modal-dialog" role="document">
                                              <div className="modal-content">
                                                <div className="modal-header">
                                                
                                                <div className="modal-header justify-content-center">
                                                <h5 className="modal-title text-center fw-bold fs-4 w-100">
                                                  🪖 Situation de Prise d'Arme
                                                </h5>
                                             

                                                    <br></br>
                                                    <br></br>
                                                  </div>

                                                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                                </div>
                                                   <br></br>
                                                    
                                                <div className="modal-body">
                                                  {/* Formulaire de sélection de date */}
                                                  <form className="row g-3 align-items-end mb-4">
                                                  <div className="col-md-4">
                                                    <label htmlFor="spaDate" className="form-label">Date</label>
                                                    <input
                                                      type="date"
                                                      id="spaDate"
                                                      className="form-control"
                                                      value={spaDate}
                                                      onChange={(e) => setSpaDate(e.target.value)}
                                                    />
                                                  </div>

                                                  <div className="col-md-3">
                                                    <label htmlFor="totalEleve" className="form-label">Effectif réalisé (R)</label>
                                                    <input
                                                      type="number"
                                                      id="totalEleve"
                                                      className="form-control"
                                                      value={spaNumber}
                                                      onChange={(e) => setSpaNumber(Number(e.target.value))}
                                                    />
                                                  </div>

                                                  <div className="col-md-3 d-flex align-items-end">
                                                    <button
                                                      type="button"
                                                      className="btn btn-success w-100"
                                                      onClick={handleAfficherIndispo}
                                                    >
                                                      🪖 Afficher SPA
                                                    </button>
                                                  </div>
                                                </form>


                                                  {/* Tableau SPA */}
                                                  <table className="table table-bordered table-sm text-center">
                                                    <thead className="table-secondary">
                                                      <tr>
                                                        <th>R</th>
                                                        <th>A</th>
                                                        <th>P</th>
                                                        <th>I</th>
                                                        <th>S</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      <tr>
                                                        <td><span className="badge bg-info">{spaNumber}</span></td>
                                                        <td><span className="badge bg-warning">{totalA}</span></td>
                                                        <td><span className="badge bg-info">{spaNumber - totalA}</span></td>
                                                        <td><span className="badge bg-warning">{totalI}</span></td>
                                                        <td><span className="badge bg-info">{(spaNumber - totalA) - totalI}</span></td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                </div>

                                                <div className="modal-footer d-flex justify-content-between flex-wrap gap-2">
                                              <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                                                ❌ Fermer
                                              </button>

                                              <div className="btn-group position-relative">
                                              <div className="btn-group">
                                              <button className="btn btn-primary" onClick={handleExportPDF}>
                                                🖨️ Imprimer (PDF)
                                              </button>
                                            </div>

                                             
                                                
                                                
                                                <button className="btn btn-success" onClick={handleExportExcel}>
                                                  📊 Export Excel (.xlsx)
                                                </button>
                                              </div>
                                            </div>

                                              </div>
                                            </div>
                                          </div>
                                          
                                        </>
                                        
                                      )}
                                      

                                   </div>
                                  );
                                  
                                };
                                const customStyles = {
                                  headCells: {
                                    style: {
                                      fontSize: '14px', // Taille du texte des en-têtes
                                      fontWeight: 'bold',
                                    },
                                  },
                                  cells: {
                                    style: {
                                      fontSize: '14px', // Taille du texte des cellules
                                    },
                                  },
                                  stripedStyle: {
                                    style: {
                                      backgroundColor: '#f2f2f2', // Lignes paires (striped)
                                    },
                                  }
                                };
                                //show modal SPA  special
                              
                                
                                                      
export default SaisieAbsence;
