import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import EleveService from '../../services/eleveService';
import courService from '../../services/courService';

const DiverPage = () => {
  const [eleves, setEleves] = useState([]);
  const [cours, setCours] = useState([]);
  const [filter, setFilter] = useState({ cour: '', diplome: '', religion: '' });

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

  const filteredEleves = eleves.filter(e =>
    (filter.cour ? e.cour?.toString() === filter.cour : true) &&
    (filter.diplome ? e.niveau === filter.diplome : true) &&
    (filter.religion ? e.religion === filter.religion : true)
  );

  const columns = [
    { name: 'Nom', selector: row => row.nom, sortable: true },
    { name: 'Prénom', selector: row => row.prenom, sortable: true },
    { name: 'Niveau', selector: row => row.niveau },
    { name: 'Religion', selector: row => row.religion },
    { name: 'Cour', selector: row => row.cour }
  ];

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
        title={`Liste des élèves${filter.diplome ? ` - ${filter.diplome}` : ''}${filter.religion ? ` - ${filter.religion}` : ''}`}
        columns={columns}
        data={filteredEleves}
        pagination
        highlightOnHover
        dense
      />

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
    </div>
  );
};

export default DiverPage;
