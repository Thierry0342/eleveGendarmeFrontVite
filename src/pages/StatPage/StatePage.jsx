import React, { useEffect, useState } from "react";
import consultationService from "../../services/consultation-service"; // ajuste le chemin si besoin
import courService from "../../services/courService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatePage = () => {
  const [consultations, setConsultations] = useState([]);
  const [joursEscadron, setJoursEscadron] = useState([]);
  const [coursList, setCoursList] = useState([]);
  const [cour, setCour] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1); // Page actuelle
  const [itemsPerPage] = useState(5); // Nombre d'éléments par page


  const fetchConsultations = (selectedCour) => {

    if (!selectedCour) {
        console.error("Aucun cours sélectionné.");
        return;
      }
    consultationService.getByCour(selectedCour)
      .then(res => {
        setConsultations(res.data);
        calculerJoursEscadron(res.data);
      })
      .catch(err => console.error("Erreur chargement consultations :", err));
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
            console.error("Erreur lors du chargement des cours", err);
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

    if (eleveJourMap.has(eleveId)) {
      eleveJourMap.get(eleveId).jours += jours;
    } else {
      eleveJourMap.set(eleveId, {
        eleveId,
        nom: nomPrenom,
        jours,
      });
    }
  }
});

const joursParEleve = Array.from(eleveJourMap.values());
//filtre jour eleve 
const filteredJoursParEleve = joursParEleve.filter(item =>
    item.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedData = [...joursParEleve].sort((a, b) => b.jours - a.jours); // tri décroissant
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
    // Changer de page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const totalPages = Math.ceil(filteredJoursParEleve.length / itemsPerPage);

  useEffect(() => {
    fetchCours();
  }, []);

  useEffect(() => {
    if (cour){
        fetchConsultations(cour);

    }
  }, [cour]);
  
    

  
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
              <div className="card text-white bg-success mb-3">
                <div className="card-body">
                  <h5 className="card-title">RETOUR A L'ESCADRON</h5>
                  <p className="card-text fs-4">
                    {consultations.filter(c => c.status === "Escadron").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
            <div className="card text-white bg-danger mb-3">
            <div className="card-body">
                <h5 className="card-title">EVASAN</h5>
                <p className="card-text fs-4">
                {
                    consultations.length - 
                    (consultations.filter(c => c.status === "IG").length + 
                    consultations.filter(c => c.status === "Escadron").length)
                }
                </p>
            </div>
            </div>
        </div>
          </div>
          
          {/* Affichage des jours par consultation Escadron */}
          <div className="card mb-3">
    <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
        <span>Total des jours par élève (Déjà à l'Esc)</span>
        <input
            type="text"
            className="form-control form-control-sm w-50"
            placeholder="Rechercher par nom..."
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
                    {filteredJoursParEleve.length === 0 ? (
                        <tr>
                            <td colSpan="2" className="text-center text-muted">Aucun résultat</td>
                        </tr>
                    ) : (
                        filteredJoursParEleve.map((item, index) => (
                            <tr key={index}>
                                <td>{item.nom}</td>
                                <td><strong>{item.jours}</strong> jour(s)</td>
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
                        return (
                            nom.includes(searchTerm.toLowerCase()) ||
                            prenom.includes(searchTerm.toLowerCase())
                        );
                    });

                    const sorted = filtered.sort((a, b) => b.jours - a.jours);

                    // Pagination
                    const itemsPerPage = 5;
                    const indexOfLastItem = currentPage * itemsPerPage;
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
                                            <span className="badge bg-primary rounded-pill">{item.jours} jour(s)</span>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Pagination navigation */}
                            <nav className="mt-3">
                                <ul className="pagination pagination-sm justify-content-end">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Précédent</button>
                                    </li>
                                    {Array.from({ length: totalPages }).map((_, index) => (
                                        <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(index + 1)}>{index + 1}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Suivant</button>
                                    </li>
                                </ul>
                            </nav>
                        </>
                    );
                })()}
            </>
        )}
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
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                            data={sortedData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
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
                                height={70}
                                interval={0}
                            />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={36} />
                            <Bar
                                dataKey="jours"
                                fill="url(#colorJour)"
                                radius={[10, 10, 0, 0]}
                                name="Nombre de jours"
                            />
                            </BarChart>
                        </ResponsiveContainer>
                        </div>
                    </div>
                    </div>

                        </div>
                        </div>
                    );
                    };

export default StatePage;
