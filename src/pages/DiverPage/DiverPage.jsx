import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import EleveService from '../../services/eleveService';
import courService from '../../services/courService';
import pointureService from '../../services/pointure-service';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const DiverPage = () => {
  const [eleves, setEleves] = useState([]);
  const [cours, setCours] = useState([]);
  const [filteredPointures, setFilteredPointures] = useState([]);
  const [filter, setFilter] = useState({ cour: '', diplome: '', religion: '',genreConcours:'',Specialiste:'',fady:'',ageRange: null  });
  const [pointures, setPointures] = useState([]);

  const niveauxEtude = [
    'BACC',
    'BACC +1',
    'BACC +2',
    'BACC +3',
    'BACC +4',
    'BACC +5',
    'BACC +6',
    'BACC +7',
    'BACC +8'
  ];
  const ethnies = [
    "ANTAIFASY", "ANTAIMORO", "ANTAMBAHOAKA", "ANTANDROY", "ANTANOSY", "ANTAKARANA",
"BARA", "BEZANOZANO", "BETSILEO", "BETSIMISARAKA", "MAHAFALY", "MERINA", 
"MIKEA", "SAKALAVA", "SIHANAKA", "TANALA", "TSIMIHETY", "VEZO"

  ];
  
  const genresConcours = ['ordinaire', 'specialiste', 'veuve', 'orphelin', 'ex-militaire'];
  const specialiste = ['informatique', 'telecommunication', 'mecanicien', 'infrastructure', 'sport'];

  const religions = ['EKAR', 'FLM', 'FJKM', 'ISLAM', 'AUTRE'];

  useEffect(() => {
    const fetchCours = async () => {
      try {
        const res = await courService.getAll();
        const coursData = res.data.sort((a, b) => b.cour - a.cour);
        setCours(coursData);

        if (coursData.length > 0) {
          setFilter(prev => ({
            ...prev,
            cour: coursData[0].cour.toString()
          }));
        }
      } catch (err) {
        console.error("Erreur lors du chargement des cours", err);
      }
    };

    fetchCours();
  }, []);

  useEffect(() => {
    EleveService.get()
      .then(response => {
        if (Array.isArray(response.data)) {
          setEleves(response.data);
        } else {
          console.error("Données inattendues :", response.data);
        }
      })
      .catch(error => {
        console.error("Erreur lors du chargement des élèves :", error);
      });
  }, []);

  //get pointure 
  useEffect(() => {
    pointureService.get()
      .then(response => {
        if (Array.isArray(response.data)) {
          console.log(response.data)
          setPointures(response.data);
        } else {
          console.error("Données inattendues :", response.data);
        }
      })
      .catch(error => {
        console.error("Erreur lors du chargement des élèves :", error);
      });
      
  }, []);
  //filtre pointure 
  useEffect(() => {
    const result = pointures.filter(p => {
      // Vérifie si l'eleve existe et a un champ "cour"
      return filter.cour ? p.Eleve?.cour?.toString() === filter.cour : true;
    });

    setFilteredPointures(result);
  }, [pointures, filter.cour]);
  


  const filteredEleves = eleves.filter(e => {
    const age = dayjs().diff(dayjs(e.dateNaissance), 'year');
    const matchSpecialiste = filter.genreConcours !== 'specialiste' 
    || (e.genreConcours === 'specialiste' && (!filter.specialiste || e.Specialiste === filter.specialiste));

    return (
      (filter.cour ? e.cour?.toString() === filter.cour : true) &&
      (filter.diplome ? e.niveau === filter.diplome : true) &&
      (filter.religion ? e.religion === filter.religion : true) &&
      (filter.fady ? e.fady === filter.fady : true) && 
      (filter.ageRange ? age >= filter.ageRange.min && age <= filter.ageRange.max : true) &&
      (filter.genreConcours ? e.genreConcours === filter.genreConcours : true) &&
      // Si un type de spécialité est sélectionné, on le filtre (ex: Informatique), sinon on ignore
      (filter.Specialiste ? e.Specialiste === filter.Specialiste : true) &&
      matchSpecialiste
    );
  });
  
  //age 
  // Traitement des âges
// Traitement des âges avec filtre de validité
const ages = filteredEleves
  .map(e => dayjs().diff(dayjs(e.dateNaissance), 'year'))
  .filter(age => age >= 17 && age <= 60); // ✅ filtre ici

const minAge = ages.length > 0 ? Math.min(...ages) : 'N/A';
const maxAge = ages.length > 0 ? Math.max(...ages) : 'N/A';

const tranchesAge = [
  { label: '17-20 ans', min: 17, max: 20 },
  { label: '21-24 ans', min: 21, max: 24 },
  { label: '25-29 ans', min: 25, max: 29 },
  { label: '30 ans et +', min: 30, max: 60 } // ✅ max 60 ans
];

const ageClassCounts = tranchesAge.map(classe => {
  const count = filteredEleves.filter(e => {
    const age = dayjs().diff(dayjs(e.dateNaissance), 'year');
    return age >= classe.min && age <= classe.max && age <= 60; // 
  }).length;
  return { ...classe, count };
})

 //colonne eleve
  const columns = [
    { name: 'Nom et prenom', selector: row => row.nom +" "+row.prenom, sortable: true },
    { name: 'Escadron', selector: row => row.escadron ,width:"100px" },
    { name: 'Peloton', selector: row => row.peloton ,width:"100px"},
    { name: 'Âge',width:"100px", selector: row => {
      const age = dayjs().diff(dayjs(row.dateNaissance), 'year');
      return age >= 17 && age <= 100 ? age : 'N/A';
    }, sortable: true },
    { name: 'Niveau', selector: row => row.niveau ,width:"100px"},
    {name :'Concour', selector : row =>row.genreConcours,width:"100px"},
    { name: 'Religion', selector: row => row.religion },
    { name: 'Foko', selector: row => row.fady },
    { name: 'Sexe', selector: row => row.sexe },
    
  ];
  //tailleee

  const columns2 = [
    {
      name: 'Nom et prenoms',
      selector: row => row.Eleve?.nom+" "+row.Eleve?.prenom|| '-',
      sortable: true,
    },
    {
      name: 'Escadron',
      selector: row => row.Eleve?.escadron || '-',
      sortable: true,
    },
    {
      name: 'Peloton',
      selector: row => row.Eleve?.peloton || '-',
      sortable: true,
    },
    
    {
      name: 'Chemise',
      selector: row => row.tailleChemise || '-',
      sortable: true,
    },
    {
      name: 'Tete',
      selector: row => row.tourTete || '-',
      sortable: true,
    },
    {
      name: 'Patalon',
      selector: row => row.pointurePantalon || '-',
      sortable: true,
    },
    {
      name: 'Chausure',
      selector: row => row.pointureChaussure || '-',
      sortable: true,
    },
  ];

//impression 
const handlePrint = () => {
  const formatEscadronLabel = (num) => {
    if (num === 1) return '1er escadron';
    if (num === 2) return '2ème escadron';
    if (num === 3) return '3ème escadron';
    if (num === 4) return '4ème escadron';
    if (num === 5) return '5ème escadron';
    return `${num}ème escadron`;
  };
  //colonne tailleee 
  

  // Trier et filtrer les élèves
  const filteredTableRows = filteredEleves
    .filter(eleve => filter.escadron ? eleve.escadron === filter.escadron : true)
    .filter(eleve => filter.peloton ? eleve.peloton === filter.peloton : true)
    .sort((a, b) => {
      const escadronA = parseInt(a.escadron, 10);
      const escadronB = parseInt(b.escadron, 10);
      if (escadronA !== escadronB) return escadronA - escadronB;
      const pelotonA = parseInt(a.peloton, 10);
      const pelotonB = parseInt(b.peloton, 10);
      return pelotonA - pelotonB;
    });

  // Grouper par escadron
  const groupedByEscadron = {};
  filteredTableRows.forEach(eleve => {
    const escNum = parseInt(eleve.escadron, 10);
    if (!groupedByEscadron[escNum]) {
      groupedByEscadron[escNum] = [];
    }
    groupedByEscadron[escNum].push(eleve);
  });

  // Création du PDF
  const doc = new jsPDF();
  let y = 15;

  // En-tête
  doc.setFontSize(11);
  doc.setFont("TIMES NEW ROMAN");
  doc.text("ECOLE DE LA GENDARMERIE NATIONALE", 5, y);
  doc.text("AMBOSITRA", 35, y + 7);
  doc.text("----------------------", 32, y + 10);
  doc.text("DIRECTION DE L'INSTRUCTION", 17, y + 17);
  doc.text("----------------------", 32, y + 20);
  doc.text("COUR DE FORMATION DES ELEVES GENDARME", 5, y + 27);
  doc.text("-----------------------", 32, y + 30);
  doc.text("REPOBLIKAN'I MADAGASCAR", 150, y);
  doc.text("Fitiavana - Tanindrazana - Fandrosoana", 145, y + 7);
  doc.text("-----------------------", 165, y + 10);

  y += 40;

  // Filtres appliqués
  doc.setFontSize(14);
  let filterText = '';
  if (filter.cour) filterText += `Cours : ${filter.cour}  `;
  if (filter.diplome) filterText += `| Diplôme : ${filter.diplome}  `;
  if (filter.religion) filterText += `| Religion : ${filter.religion}  `;
  if (filter.fady) filterText += `| Foko : ${filter.fady}  `;
  if (filter.ageRange) filterText += `| Âge : ${filter.ageRange.label}`;
  if (filter.genreConcours) filterText += `| Concours : ${filter.genreConcours}  `;
  if (filter.genreConcours === 'specialiste' && filter.Specialiste)
    filterText += `| Spécialité : ${filter.Specialiste}  `;
  if (!filterText) filterText = 'Aucun filtre appliqué';

  doc.setFontSize(12);
  doc.text(filterText, 14, y);
  y += 10;

  // Groupe par escadron
  Object.keys(groupedByEscadron).sort((a, b) => a - b).forEach((escNum) => {
    const escLabel = formatEscadronLabel(parseInt(escNum, 10));
    const eleves = groupedByEscadron[escNum];

    doc.setFontSize(13);
    doc.text(escLabel, 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Nom et prénoms', 'Escadron', 'Peloton', 'Incorporation', 'Matricule']],
      body: eleves.map(e => [
        e.nom + ' ' + e.prenom,
        e.escadron,
        e.peloton,
        e.numeroIncorporation,
        e.matricule
      ]),
      styles: { fontSize: 11, cellPadding: 2 },
      margin: { left: 14, right: 14 },
      theme: 'striped',
      didDrawPage: (data) => {
        y = data.cursor.y + 10;
      }
    });
  });

  doc.save('liste_eleves.pdf');
};
//print pointure 
const exportPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(`Fiche Pointure - Cours ${filter.cour}`, 14, 15);

  const tableColumn = [
    "Nom et prénoms",
    "Escadron",
    "Peloton",
    "Chemise",
    "Tête",
    "Pantalon",
    "Chaussure",
  ];

  const tableRows = filteredPointures.map(row => [
    row.Eleve ? `${row.Eleve.nom} ${row.Eleve.prenom}` : "-",
    row.Eleve?.escadron || "-",
    row.Eleve?.peloton || "-",
    row.tailleChemise || "-",
    row.tourTete || "-",
    row.pointurePantalon || "-",
    row.pointureChaussure || "-",
  ]);

  autoTable(doc, {
    startY: 20,
    head: [tableColumn],
    body: tableRows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }, // bleu
  });

  doc.save(`pointures-cours-${filter.cour}.pdf`);
};

  return (
    <div className="container mt-4">
      {/* Formulaire de filtre par cour */}
      <div className="mb-4">
        <label className="form-label fw-bold">Sélectionner un cour :</label>
        <select
          className="form-control"
          name="cour"
          value={filter.cour}
          onChange={e => setFilter({ ...filter, cour: e.target.value })}
        >
          {cours.map((c) => (
            <option key={c.id} value={c.cour}>{c.cour}</option>
          ))}
        </select>
      </div>
      
      {/* Tableau des élèves */}
          <DataTable
                title={
                  <div className="d-flex flex-column align-items-start">
                    <h5 className="mb-1 fw-bold">
                      Liste des élèves
                      {filter.cour && ` - Cour ${filter.cour}`}
                      {filter.diplome && ` - ${filter.diplome}`}
                      {filter.religion && ` - ${filter.religion}`}
                      {filter.fady && ` - ${filter.fady}`} {/* ✅ ajout */}
                      {filter.genreConcours && ` - ${filter.genreConcours}`}
                      {filter.Specialiste && ` - ${filter.Specialiste}`}
                      {filter.ageRange && ` - Âge ${filter.ageRange.label}`}
                    </h5>
                    <small className="text-muted">
                      {filteredEleves.length} élève(s) affiché(s)
                    </small>
                  </div>
                }
                columns={columns}
                data={filteredEleves}
                pagination
                highlightOnHover
                striped
                responsive
                dense
                persistTableHead
                customStyles={{
                  headCells: {
                    style: {
                      backgroundColor: '#007bff',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    },
                  },
                  rows: {
                    style: {
                      fontSize: '14px',
                    },
                  },
                  table: {
                    style: {
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    },
                  },
                }}
              />
            <div className="d-flex justify-content-end mt-4">
            <button onClick={handlePrint} className="btn btn-primary">
              Imprimer le tableau
            </button>
          </div>


      {/* Bloc affichage âge min/max */}
        <div className="mt-4">
          <h6>Âge minimum : <strong>{minAge}</strong> ans</h6>
          <h6>Âge maximum : <strong>{maxAge}</strong> ans</h6>
        </div>

        <h5 className="mt-5 fw-bold text-primary text-uppercase">Filtrer par tranche d’âge</h5>

<div className="d-flex justify-content-center flex-wrap gap-3 mt-4">
  {tranchesAge.map((tranche) => {
    const isActive = filter.ageRange?.label === tranche.label;
    const matchingCount = eleves.filter(e => {
      const age = dayjs().diff(dayjs(e.dateNaissance), 'year');
      return (
        age >= tranche.min &&
        age <= tranche.max &&
        (!filter.religion || e.religion === filter.religion) &&
        (!filter.diplome || e.niveau === filter.diplome) &&
        (!filter.cour || e.cour?.toString() === filter.cour)
      );
    }).length;

    return (
      <div
        key={tranche.label}
        className={`card text-center shadow-sm border-0 ${isActive ? 'bg-warning-subtle border-warning' : 'bg-white'}`}
        style={{
          cursor: 'pointer',
          width: '160px',
          transition: 'all 0.3s',
        }}
        onClick={() => setFilter({ ...filter, ageRange: tranche })}
      >
        <div className="card-body p-3">
          <h6 className="fw-semibold mb-1">{tranche.label}</h6>
          <p className="text-muted small mb-0">{matchingCount} élève(s)</p>
        </div>
      </div>
    );
  })}

  {/* Tout afficher */}
  <div
    className="card text-center shadow-sm border-0 bg-light"
    style={{ cursor: 'pointer', width: '160px', transition: 'all 0.3s' }}
    onClick={() => setFilter({ ...filter, ageRange: null })}
  >
    <div className="card-body p-3">
      <h6 className="fw-semibold mb-1">Tout afficher</h6>
      <p className="text-muted small mb-0">
        {
          eleves.filter(e =>
            (!filter.religion || e.religion === filter.religion) &&
            (!filter.diplome || e.niveau === filter.diplome) &&
            (!filter.cour || e.cour?.toString() === filter.cour)
          ).length
        } élèves
      </p>
    </div>
  </div>
</div>



<h5 className="mt-5 fw-bold text-primary text-uppercase">Filtrer par niveau d’étude</h5>

<div className="d-flex justify-content-center flex-wrap gap-3 mt-4">
  {niveauxEtude.map((niveau) => {
    const isActive = filter.diplome === niveau;
    const matchingCount = eleves.filter(e =>
      e.niveau === niveau &&
      (!filter.religion || e.religion === filter.religion) &&
      (!filter.cour || e.cour?.toString() === filter.cour)
    ).length;

    return (
      <div
        key={niveau}
        className={`card text-center shadow-sm border-0 ${isActive ? 'bg-primary-subtle border-primary' : 'bg-white'}`}
        style={{
          cursor: 'pointer',
          width: '160px',
          transition: 'all 0.3s',
        }}
        onClick={() => setFilter({ ...filter, diplome: niveau })}
      >
        <div className="card-body p-3">
          <h6 className="fw-semibold mb-1">{niveau}</h6>
          <p className="text-muted small mb-0">{matchingCount} élève(s)</p>
        </div>
      </div>
    );
  })}

  {/* Tout afficher */}
  <div
    className="card text-center shadow-sm border-0 bg-light"
    style={{ cursor: 'pointer', width: '160px', transition: 'all 0.3s' }}
    onClick={() => setFilter({ ...filter, diplome: '' })}
  >
    <div className="card-body p-3">
      <h6 className="fw-semibold mb-1">Tout afficher</h6>
      <p className="text-muted small mb-0">
        {
          eleves.filter(e =>
            (!filter.religion || e.religion === filter.religion) &&
            (!filter.cour || e.cour?.toString() === filter.cour)
          ).length
        } élèves
      </p>
    </div>
  </div>
</div>

<h5 className="mt-5 fw-bold text-primary text-uppercase">Filtrer par genre de concours</h5>

<div className="d-flex justify-content-center flex-wrap gap-3 mt-4">
  {genresConcours.map((genre) => {
    const isActive = filter.genreConcours === genre;
    const count = eleves.filter(e =>
      e.genreConcours === genre &&
      (!filter.religion || e.religion === filter.religion) &&
      (!filter.diplome || e.niveau === filter.diplome) &&
      (!filter.ageRange || (
        dayjs().diff(dayjs(e.dateNaissance), 'year') >= filter.ageRange.min &&
        dayjs().diff(dayjs(e.dateNaissance), 'year') <= filter.ageRange.max
      ))
    ).length;

    return (
      <div
        key={genre}
        className={`card text-center shadow-sm border-0 ${isActive ? 'bg-warning-subtle border-warning' : 'bg-white'}`}
        style={{ cursor: 'pointer', width: '160px', transition: 'all 0.3s' }}
        onClick={() => setFilter({ ...filter, genreConcours: genre, specialiste: '' })}
      >
        <div className="card-body p-3">
          <h6 className="fw-semibold mb-1">{genre}</h6>
          <p className="text-muted small mb-0">{count} élève(s)</p>
        </div>
      </div>
    );
  })}

  {/* Tout afficher */}
  <div
    className="card text-center shadow-sm border-0 bg-light"
    style={{ cursor: 'pointer', width: '160px', transition: 'all 0.3s' }}
    onClick={() => setFilter({ ...filter, genreConcours: '', specialiste: '' })}
  >
    <div className="card-body p-3">
      <h6 className="fw-semibold mb-1">Tout afficher</h6>
      <p className="text-muted small mb-0">{eleves.length} élèves</p>
    </div>
  </div>
</div>

{/* Spécialités si genre = "specialiste" */}
{filter.genreConcours === 'specialiste' && (
  <>
    <h6 className="mt-4 fw-bold text-secondary">Choisir une spécialité</h6>
    <div className="d-flex justify-content-center flex-wrap gap-3 mt-3">
      {specialiste.map((spec) => (
        <div
          key={spec}
          className={`card text-center shadow-sm border-0 ${filter.Specialiste === spec ? 'bg-info-subtle border-info' : 'bg-white'}`}
          style={{ cursor: 'pointer', width: '160px', transition: 'all 0.3s' }}
          onClick={() => setFilter({ ...filter, Specialiste: spec })}
        >
          <div className="card-body p-3">
            <h6 className="fw-semibold mb-0">{spec}</h6>
          </div>
        </div>
      ))}

      <div
        className="card text-center shadow-sm border-0 bg-light"
        style={{ cursor: 'pointer', width: '160px', transition: 'all 0.3s' }}
        onClick={() => setFilter({ ...filter, Specialiste: '' })}
      >
        <div className="card-body p-3">
          <h6 className="fw-semibold mb-0">Tout afficher</h6>
        </div>
      </div>
    </div>
  </>
)}
<h5 className="mt-5 fw-bold text-primary text-uppercase">Filtrer par religion</h5>

<div className="d-flex justify-content-center flex-wrap gap-3 mt-4">
  {religions.map((relig) => {
    const isActive = filter.religion === relig;
    const count = eleves.filter(e =>
      e.religion === relig &&
      (!filter.diplome || e.niveau === filter.diplome) &&
      (!filter.cour || e.cour?.toString() === filter.cour)
    ).length;

    return (
      <div
        key={relig}
        className={`card text-center shadow-sm border-0 ${isActive ? 'bg-success-subtle border-success' : 'bg-white'}`}
        style={{ cursor: 'pointer', width: '160px', transition: 'all 0.3s' }}
        onClick={() => setFilter({ ...filter, religion: relig })}
      >
        <div className="card-body p-3">
          <h6 className="fw-semibold mb-1">{relig}</h6>
          <p className="text-muted small mb-0">{count} élève(s)</p>
        </div>
      </div>
    );
  })}

  <div
    className="card text-center shadow-sm border-0 bg-light"
    style={{ cursor: 'pointer', width: '160px', transition: 'all 0.3s' }}
    onClick={() => setFilter({ ...filter, religion: '' })}
  >
    <div className="card-body p-3">
      <h6 className="fw-semibold mb-1">Tout afficher</h6>
      <p className="text-muted small mb-0">
        {eleves.filter(e =>
          (!filter.diplome || e.niveau === filter.diplome) &&
          (!filter.cour || e.cour?.toString() === filter.cour)
        ).length} élèves
      </p>
    </div>
  </div>
</div>

<h5 className="mt-5 fw-bold text-primary text-uppercase">Filtrer par Foko</h5>

<div className="d-flex justify-content-center flex-wrap gap-3 mt-4">
  {ethnies.map((foko) => {
    const isActive = filter.fady === foko;
    const count = eleves.filter(e =>
      e.fady === foko &&
      (!filter.diplome || e.niveau === filter.diplome) &&
      (!filter.cour || e.cour?.toString() === filter.cour) &&
      (!filter.religion || e.religion === filter.religion)
    ).length;

    return (
      <div
        key={foko}
        className={`card text-center shadow-sm border-0 ${isActive ? 'bg-success-subtle border-success' : 'bg-white'}`}
        style={{ cursor: 'pointer', width: '160px', transition: 'all 0.3s' }}
        onClick={() => setFilter({ ...filter, fady: foko })}
      >
        <div className="card-body p-3">
          <h6 className="fw-semibold mb-1">{foko}</h6>
          <p className="text-muted small mb-0">{count} élève(s)</p>
        </div>
      </div>
    );
  })}

  <div
    className="card text-center shadow-sm border-0 bg-light"
    style={{ cursor: 'pointer', width: '160px', transition: 'all 0.3s' }}
    onClick={() => setFilter({ ...filter, fady: '' })}
  >
    <div className="card-body p-3">
      <h6 className="fw-semibold mb-1">Tout afficher</h6>
      <p className="text-muted small mb-0">
        {eleves.filter(e =>
          (!filter.religion || e.religion === filter.religion) &&
          (!filter.diplome || e.niveau === filter.diplome) &&
          (!filter.cour || e.cour?.toString() === filter.cour)
        ).length} élèves
      </p>
    </div>
  </div>
</div>




      <h5 className="mt-5 fw-bold text-primary text-uppercase">Pointure</h5>
      <DataTable
        columns={columns2}
        data={filteredPointures}
        pagination
        highlightOnHover
        responsive
        striped
        noDataComponent="Aucune pointure trouvée"
        customStyles={{
          headCells: {
            style: {
              backgroundColor: '#007bff',
              fontWeight: 'bold',
              fontSize: '14px',
            },
          },
          rows: {
            style: {
              fontSize: '14px',
            },
          },
          table: {
            style: {
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              overflow: 'hidden',
            },
          },
        }}
      />
         <div className="d-flex justify-content-end mt-4">
            <button onClick={exportPDF} className="btn btn-primary">
              EXPORTPDF
            </button>
          </div>

    </div>
    
  );
};

export default DiverPage;
