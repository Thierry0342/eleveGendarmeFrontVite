import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import EleveService from '../../services/eleveService';
import courService from '../../services/courService';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const DiverPage = () => {
  const [eleves, setEleves] = useState([]);
  const [cours, setCours] = useState([]);
  const [filter, setFilter] = useState({ cour: '', diplome: '', religion: '',ageRange: null  });

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

  const filteredEleves = eleves.filter(e => {
    const age = dayjs().diff(dayjs(e.dateNaissance), 'year');
    return (
      (filter.cour ? e.cour?.toString() === filter.cour : true) &&
      (filter.diplome ? e.niveau === filter.diplome : true) &&
      (filter.religion ? e.religion === filter.religion : true) &&
      (filter.ageRange ? age >= filter.ageRange.min && age <= filter.ageRange.max : true)
    );
  });
  
  //age 
  // Traitement des âges
const ages = filteredEleves
.map(e => dayjs().diff(dayjs(e.dateNaissance), 'year'))
.filter(age => age >= 17);

const minAge = ages.length > 0 ? Math.min(...ages) : 'N/A';
const maxAge = ages.length > 0 ? Math.max(...ages) : 'N/A';

const tranchesAge  = [
  { label: '17-20 ans', min: 17, max: 20 },
  { label: '21-24 ans', min: 21, max: 24 },
  { label: '25-29 ans', min: 25, max: 29 },
  { label: '30 ans et +', min: 30, max: 100 }
];

const ageClassCounts = tranchesAge .map(classe => {
const count = filteredEleves.filter(e => {
  const age = dayjs().diff(dayjs(e.dateNaissance), 'year');
  return age >= classe.min && age <= classe.max;
}).length;
return { ...classe, count };
});


  const columns = [
    { name: 'Nom', selector: row => row.nom, sortable: true },
    { name: 'Prénom', selector: row => row.prenom, sortable: true },
    { name: 'Âge', selector: row => {
      const age = dayjs().diff(dayjs(row.dateNaissance), 'year');
      return age >= 17 && age <= 100 ? age : 'N/A';
    }, sortable: true },
    { name: 'Niveau', selector: row => row.niveau },
    {name :'Concour', selector : row =>row.genreConcours},
    { name: 'Religion', selector: row => row.religion },
    { name: 'Cour', selector: row => row.cour }
  ];
//impression 
const handlePrint = () => {
  const doc = new jsPDF();

  // Définir les colonnes du tableau
  const tableColumns = ['Nom et prenoms','Escadron','Peloton', 'Incorporation', 'Matricule'];
  const tableRows = filteredEleves.map(eleve => [
    eleve.nom+' '+eleve.prenom,
    eleve.escadron,
    eleve.peloton,
    eleve.numeroIncorporation,
    eleve.matricule,
  ]);

  // Titre du PDF
  doc.setFontSize(11);
  doc.setFont("TIMES NEW ROMAN");
  doc.text("ECOLE DE LA GENDARMERIE NATIONALE", 5, 15);
  doc.text("AMBOSITRA", 35, 22);
  doc.text("----------------------", 32, 25);
  doc.text("DIRECTION DE L'INSTRUCTION", 17, 32);
  doc.text("----------------------", 32, 35);
  doc.text("COUR DE FORMATION DES ELEVES GENDARME", 5, 42);
  doc.text("-----------------------", 32, 45);
  doc.text("REPOBLIKAN'I MADAGASCAR",150,15);
  doc.text("Fitiavana - Tanindrazana - Fandrosoana",145,22);
  doc.text("-----------------------", 165, 25);


  // Filtres appliqués
  doc.setFontSize(14);
  let filterText = '';
  if (filter.cour) filterText += `Cours : ${filter.cour}  `;
  if (filter.diplome) filterText += `| Diplôme : ${filter.diplome}  `;
  if (filter.religion) filterText += `| Religion : ${filter.religion}  `;
  if (filter.ageRange) filterText += `| Âge : ${filter.ageRange.label}`;
  if (!filterText) filterText = 'Aucun filtre appliqué';

  doc.text(filterText, 30, 55);

  // Tableau
  autoTable(doc, {
    startY: 60,
    head: [tableColumns],
    body: tableRows,
    theme: 'striped',
    styles: { fontSize: 12, cellPadding: 2 },
    margin: { top: 30 },
  });

  // Sauvegarder
  doc.save('liste_eleves.pdf');
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

                <h5 className="mt-5 fw-bold">Filtrer par tranche d’âge</h5>
        <div className="d-flex justify-content-around flex-wrap mt-3">
          {tranchesAge.map((tranche) => (
            <div
              key={tranche.label}
              className="card p-3 m-2 text-center shadow-sm"
              style={{
                cursor: 'pointer',
                width: '160px',
                border: filter.ageRange?.label === tranche.label ? '2px solid #ffc107' : '1px solid #ccc',
                backgroundColor: filter.ageRange?.label === tranche.label ? '#fff8e1' : 'white'
              }}
              onClick={() => setFilter({ ...filter, ageRange: tranche })}
            >
              <h6 className="mb-1">{tranche.label}</h6>
              <p className="mb-0 text-muted">
                {
                  eleves.filter(e => {
                    const age = dayjs().diff(dayjs(e.dateNaissance), 'year');
                    return (
                      age >= tranche.min &&
                      age <= tranche.max &&
                      (!filter.religion || e.religion === filter.religion) &&
                      (!filter.diplome || e.niveau === filter.diplome) &&
                      (!filter.cour || e.cour?.toString() === filter.cour)
                    );
                  }).length
                } élève(s)
              </p>
            </div>
          ))}
          <div
            className="card p-3 m-2 text-center bg-light shadow-sm"
            style={{ cursor: 'pointer', width: '160px' }}
            onClick={() => setFilter({ ...filter, ageRange: null })}
          >
            <h6 className="mb-1">Tout afficher</h6>
            <p className="mb-0 text-muted">
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


      {/* Menu des diplômes en cartes */}
      <h5 className="mt-5 fw-bold">Filtrer par niveau d’étude</h5>
      <div className="d-flex justify-content-around flex-wrap mt-3">
        {niveauxEtude.map((niveau) => (
          <div
            key={niveau}
            className="card p-3 m-2 text-center shadow-sm"
            style={{
              cursor: 'pointer',
              width: '160px',
              border: filter.diplome === niveau ? '2px solid #0d6efd' : '1px solid #ccc',
              backgroundColor: filter.diplome === niveau ? '#e9f2ff' : 'white'
            }}
            onClick={() => setFilter({ ...filter, diplome: niveau })}
          >
            <h6 className="mb-1">{niveau}</h6>
            <p className="mb-0 text-muted">
              {eleves.filter(e =>
                e.niveau === niveau && e.cour?.toString() === filter.cour &&
                (!filter.religion || e.religion === filter.religion)
              ).length} élèves
            </p>
          </div>
        ))}
        <div
          className="card p-3 m-2 text-center bg-light shadow-sm"
          style={{ cursor: 'pointer', width: '160px' }}
          onClick={() => setFilter({ ...filter, diplome: '' })}
        >
          <h6 className="mb-1">Tout afficher</h6>
          <p className="mb-0 text-muted">
            {eleves.filter(e => e.cour?.toString() === filter.cour &&
              (!filter.religion || e.religion === filter.religion)
            ).length} élèves
          </p>
        </div>
      </div>

      {/* Menu des religions en cartes */}
      <h5 className="mt-5 fw-bold">Filtrer par religion</h5>
      <div className="d-flex justify-content-around flex-wrap mt-3">
        {religions.map((relig) => (
          <div
            key={relig}
            className="card p-3 m-2 text-center shadow-sm"
            style={{
              cursor: 'pointer',
              width: '160px',
              border: filter.religion === relig ? '2px solid #198754' : '1px solid #ccc',
              backgroundColor: filter.religion === relig ? '#e6f7ed' : 'white'
            }}
            onClick={() => setFilter({ ...filter, religion: relig })}
          >
            <h6 className="mb-1">{relig}</h6>
            <p className="mb-0 text-muted">
              {eleves.filter(e =>
                e.religion === relig && e.cour?.toString() === filter.cour &&
                (!filter.diplome || e.niveau === filter.diplome)
              ).length} élèves
            </p>
          </div>
        ))}
        <div
          className="card p-3 m-2 text-center bg-light shadow-sm"
          style={{ cursor: 'pointer', width: '160px' }}
          onClick={() => setFilter({ ...filter, religion: '' })}
        >
          <h6 className="mb-1">Tout afficher</h6>
          <p className="mb-0 text-muted">
            {eleves.filter(e => e.cour?.toString() === filter.cour &&
              (!filter.diplome || e.niveau === filter.diplome)
            ).length} élèves
          </p>
        </div>
      </div>
      {/* Menu des tranches d’âge en cartes */}


    </div>
  );
};

export default DiverPage;
