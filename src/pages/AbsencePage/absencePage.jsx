import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import eleveService from '../../services/eleveService';
import courService from '../../services/courService';
import absenceService from '../../services/absence-service';
import spaspecialeService from'../../services/spaSpeciale-service';
import dateService from'../../services/dateservice';
import DataTable from 'react-data-table-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from "xlsx";
import { fr } from "date-fns/locale";
import { format } from 'date-fns';
import './style.css'
const user = JSON.parse(localStorage.getItem('user'));



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
  const [newSpaSpeciale, setNewSpaSpeciale] = useState({ motif: '', nombre: '', date: '' });
  //motif autre 
  const [incorporationSPA, setIncorporationSPA] = useState('');
  const [eleveSPAInfo, setEleveSPAInfo] = useState(null);
  const [autreMotif, setAutreMotif] = useState("");
  const [typeMotif, setTypeMotif] = useState("");
  const [showOptions, setShowOptions] = useState(false);
 
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
       handleExportPDFSimple();
      } else if (result.isDenied) {
        handleExportPDFNarratif();
      }
    });
  };



   //pagination spa
   const [pageAbsence, setPageAbsence] = useState(1);
   const [pageSpa, setPageSpa] = useState(1);
   const ITEMS_PER_PAGE = 5;
   const [currentPage, setCurrentPage] = useState(1);
   
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
         console.log("id pox ve ee" +id);      
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
        console.log('Élève non trouvé');
          
        alert("Elève non trouvé")
      }
    } catch (err) {
        setEleveData({});
        setAllEleves({});
        console.error('Erreur lors de la récupération des données:', err);
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
  //console.log("******id ve",eleveData?.eleve?.id);
  //console.log("******id ve",absences.eleveId);
    // Vérifie s'il existe déjà une absence avec la même date et le même élève
    const absenceExistante = absences.some(abs => {
      const sameDate = new Date(abs.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0];
      
      const sameEleve = abs.eleveId === eleveData?.eleve?.id;
      
      return sameDate && sameEleve;
    });
    
  
    if (absenceExistante) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Cette absence existe déjà pour cette date.',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return; // Ne pas continuer si déjà existant
    }
    const finalMotif = motif === "AUTRE" 
    ? `${autreMotif} (${typeMotif})` 
    : motif;
  
    Swal.fire({
      title: 'Confirmer l\'enregistrement',
      text: 'Voulez-vous enregistrer cette absence ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, enregistrer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        const dataToSend = {
          
          eleveId: eleveData.eleve.id,
          date,
          motif:finalMotif
        };
  
        absenceService.post(dataToSend)
          .then(response => {
            console.log('Absence enregistrée avec succès:', response.data);
            setAbsences([...absences, response.data]);
            setIncorporation('');
  
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'L\'absence a été enregistrée.',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
            });
          })
          .catch(error => {
            console.error('Erreur lors de l\'enregistrement de l\'absence:', error);
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Une erreur est survenue lors de l\'enregistrement.',
              confirmButtonColor: '#d33',
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
    })
    .catch(error => {
      console.error("Erreur lors de la récupération de la date serveur :", error);
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
    const motifsI =["IG", "CONSULTATION", "A REVOIR IG", "REPOS SANITAIRE","CONFINES EN CHAMBRE","GARDE MALADE IG","DONNEUR DE SANG"];
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
  
console.log("spa speciale veee",spaSpeciale)
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

  const handleExportPDFSimple =()=>{
    try {
      const doc = new jsPDF({ format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginBottom = 20; // marge en bas pour éviter d’écrire trop bas
      
      // Formatage de la date
      const formattedDate = format(new Date(spaDate), "d MMMM yyyy");
  
      // Entête
      doc.setFontSize(11);
      doc.setFont("Times", "normal");
      doc.text("ECOLE DE LA GENDARMERIE NATIONALE", 5, 15);
      doc.text("AMBOSITRA", 35, 22);
      doc.text("----------------------", 32, 25);
      doc.text("DIRECTION DE L'INSTRUCTION", 17, 32);
      doc.text("----------------------", 32, 35);
      doc.text("COURS DE FORMATION DES ELEVES GENDARME", 5, 42);
      doc.text("-----------------------", 32, 45);
      doc.text("REPOBLIKAN'I MADAGASCAR", 150, 15);
      doc.text("Fitiavana - Tanindrazana - Fandrosoana", 145, 22);
      doc.text("-----------------------", 165, 25);
  
      doc.setFontSize(12);
      doc.text(`Situation de Prise d'Arme du ${filter.cour} CFEG du ${formattedDate} `, 90, 55);
  
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
      const specificMotifs = ["IG", "CONSULTATION", "A REVOIR IG", "REPOS SANITAIRE","CONFINES EN CHAMBRE","GARDE MALADE IG","DONNEUR DE SANG"];
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
      bodyDetails.push(['', '', '', '', '', '']);
  
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
  
      bodyDetails.push(['', '', '', '', '', '']);
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
          halign: 'center',
        },
        headStyles: {
          fontStyle: 'bold',
        },
        showHead: 'firstPage',
      });
  
      // Texte final "DESTINATAIRES"
      let finalY = doc.lastAutoTable.finalY + 10;
      const spaceNeeded = 90; // hauteur estimée nécessaire
  
      if (finalY + spaceNeeded > pageHeight - marginBottom) {
        doc.addPage();
        finalY = 20;
      }
  
      doc.setFontSize(11);
      doc.text("DESTINATAIRES", 5, finalY);
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
      doc.text(`NR        EGNA/2-DI/C-A Ambositra,le ${formattedDate} `,120 ,finalY+7);
      doc.text("Le chef d'escadron,Donatiens RAYMOND",130,finalY+17)
      doc.text("Commandant du cours A de formation des élèves gendarmes",114,finalY+23)
  
      // Sauvegarde du PDF
      doc.save(`SPA DU_${spaDate}.pdf`);
  
    } catch (error) {
      console.error("Erreur lors de l'exportation du PDF :", error);
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
    const formattedDate = format(new Date(spaDate), "d MMMM yyyy");
    doc.setFontSize(13);
    let content = `OBJET  SPA ELEVE GENDARME ${filter.cour}EME CFEG X HVRC X DATE  DU ${formattedDate} X `;
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
      'CONSULTATION',
      'A REVOIR IG',
      'REPOS SANITAIRE',
      'CONFINES EN CHAMBRE',
      'GARDE MALADE IG',
      'DONNEUR DE SANG',
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
      content += `${(i + 1).toString().padStart(2, '0')} / ${nom} NR ${numero} -  `;
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
      content += `${(i + 1).toString().padStart(2, '0')} / ${nom} NR ${numero} - `;
    });

    indexSectionIndispo++;
  }
}

  
    content += 'FIN RABEMANANTSOA';
  
    // Nettoyage espaces et retours ligne
    content = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
    doc.text(content, 10, 10, { maxWidth: 190 });
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
      "CONSULTATION",
      "A REVOIR IG",
      "REPOS SANITAIRE",
      "CONFINES EN CHAMBRE",
      "GARDE MALADE IG",
      "DONNEUR DE SANG"
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
                    className="form-select border-0 shadow-sm"
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
                    className="form-control border-0 shadow-sm"
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
                          <option value="IG">ADMIS IG</option>
                          <option value="CHRR">ADMIS CHRR</option>
                          <option value="EVASAN">EVASAN</option>
                          <option value="A REVOIR IG">A REVOIR IG</option>
                          <option value="A REVOIR CHRR">A REVOIR CHRR</option>
                          <option value="CONSULTATION">CONSULTATION</option>
                          <option value="CONSULTATION EXTERNE">CONSULTATION EXTERNE</option>
                          <option value="GARDE MALADE IG">GARDE MALADE IG</option>
                          <option value="A REVOIR CENHOSOA">A REVOIR CENHOSOA</option>
                          <option value="ADMIS CENHOSOA">ADMIS CENHOSOA</option>
                          <option value="ADMIS HOMI">ADMIS HOMI</option>
                          <option value="DONNEUR DE SANG">DONNEUR DE SANG</option>
                          <option value="CONFINES EN CHAMBRE">CONFINES EN CHAMBRE</option>
                          <option value="ADMIS CLINIC MANIA">ADMIS CLINIC MANIA</option>
                          <option value="AD COM DLI">AD COM DLI</option>
                          <option value="AD COM DQG SPORT">AD COM DQG SPORT</option>
                          <option value="PERMISSION">PERMISSION</option>
                          <option value="VATOVORY">VATOVORY</option>
                          <option value="SPORT">SPORT</option>
                          <option value="AD MDG">AD MDG</option>
                          <option value="REPOS SANITAIRE">REPOS SANITAIRE</option>
                          <option value="STAGE">STAGE</option>
                          <option value="ARTS MARTIAUX">ARTS MARTIAUX</option>
                          <option value="MISSION">MISSION</option>
                          <option value="MISSION TANA">MISSION TANA</option>
                          <option value="AD CEGN">AD CEGN</option>
                          <option value="TOBY FANDRIANA">TOBY FANDRIANA</option>
                          <option value="DEFILE TANA">DEFILE TANA</option>
                          <option value="DEFILE AMBOSITRA">DEFILE AMBOSITRA</option>
                          <option value="S.O">S.O</option>
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
                                      
                                            {user?.type !== 'user' && (
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

                                                        Swal.fire({
                                                          title: 'Confirmer l\'ajout',
                                                          text: 'Voulez-vous vraiment ajouter ce motif spécial ?',
                                                          icon: 'question',
                                                          showCancelButton: true,
                                                          confirmButtonText: 'Oui, ajouter',
                                                          cancelButtonText: 'Annuler',
                                                          confirmButtonColor: '#3085d6',
                                                          cancelButtonColor: '#d33'
                                                        }).then((result) => {
                                                          if (result.isConfirmed) {
                                                            newSpaSpeciale.cour=filter.cour
                                                            spaspecialeService.post(newSpaSpeciale)
                                                              .then(() => {
                                                                Swal.fire({
                                                                  icon: 'success',
                                                                  title: 'Ajouté avec succès',
                                                                  showConfirmButton: false,
                                                                  timer: 1500
                                                                });

                                                                setNewSpaSpeciale({ motif: "", nombre: "", date: "" });

                                                                spaspecialeService.getAll().then(res => setSpaSpeciale(res.data || []));
                                                              })
                                                              .catch((err) => {
                                                                console.error(err);
                                                                Swal.fire({
                                                                  icon: 'error',
                                                                  title: 'Erreur',
                                                                  text: 'Erreur lors de l\'ajout. Veuillez réessayer.',
                                                                });
                                                              });
                                                          }
                                                        });
                                                      }}
                                                    >
                                                      Ajouter
                                                    </button>

                                                    <button className="btn btn-secondary" onClick={() => setShowSpaSpecialeModal(false)}>Fermer</button>
                                                  </div>
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
                                                                      console.error(err);
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



                                        </div>
                                      </div>
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
