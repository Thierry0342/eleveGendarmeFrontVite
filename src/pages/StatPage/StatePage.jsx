import React, { useEffect, useState } from "react";
import consultationService from "../../services/consultation-service"; // ajuste le chemin si besoin
import courService from "../../services/courService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DataTable from 'react-data-table-component';
import "./EvasanModal.css"
import absenceService from "../../services/absence-service";
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
  const [searchMotif, setSearchMotif] = useState('');

  //paggination
  
  
  const [currentPage, setCurrentPage] = useState(1); // Page actuelle
  const [itemsPerPage] = useState(5); // Nombre d'éléments par page

  //click row 
  const handleView = (row) => {
    setSelectedRow(row);
  };
  //close modal 
  const closeModal = () => {
    setSelectedRow(null);
  };


 //get consultation
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
  //get consultation_2
  const fetchConsultations2 = (selectedCour) => {
    if (!selectedCour) {
      console.error("Aucun cours sélectionné.");
      return;
    }
  
    consultationService.getByCour(selectedCour)
      .then(res => {
        const consultationsEvasan = res.data.filter(c => c.status === "EVASAN");
      //  console.log(consultationsEvasan);
        setConsultations2(consultationsEvasan); // n'affiche que les EVASAN
       
      })
      .catch(err => console.error("Erreur chargement consultations :", err));
  };
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
    fetchAbsence();
   
  }, []);
  console.log("abnsence rehetrea  aa",listeAbsence);
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
            console.error("Données inattendues :", response.data);
          }
        })
        .catch(error => {
          console.error("Erreur lors du chargement des absence :", error);
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
    const matchDate = selectedDate ? abs.date === selectedDate : true;
    const matchIncorp = numIncorp ? abs.Eleve?.numeroIncorporation === numIncorp : true;
    return matchCour && matchDate && matchIncorp;
  });
  
  
  const recapParEleve = {};

  filteredAbsences.forEach(abs => {
    const eleveId = abs.eleveId;
    const nom = abs.Eleve?.nom || 'Inconnu';
    const motif = abs.motif || 'Inconnu';
    const date = abs.date;
  
    if (!recapParEleve[eleveId]) {
      recapParEleve[eleveId] = {
        nom,
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
        nom: data.nom,
        motif,
        count: datesSet.size, // nombre de dates uniques
      });
    });
  });
  
  const columns2 = [
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
  // 2. Calculer le nombre de personnes distinctes par motif
      const elevesParMotif = {};
      filteredAbsences.forEach(abs => {
        const motif = abs.motif || 'Inconnu';
        const eleveId = abs.eleveId;

        if (!elevesParMotif[motif]) {
          elevesParMotif[motif] = new Set();
        }
        elevesParMotif[motif].add(eleveId);
      });

      const personneParMotifData = Object.entries(elevesParMotif).map(([motif, eleveSet]) => ({
        motif,
        nombrePersonnes: eleveSet.size,
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
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{item.motif}</strong>
                  </div>
                  <span className="badge bg-success rounded-pill">
                    {item.nombrePersonnes} personne(s)
                  </span>
                </li>
              ))}
            </ul>

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
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
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
                        </form>

                        <DataTable
                      
                          columns={columns2}
                          data={motifData}
                          pagination
                          highlightOnHover
                          striped
                          responsive
                          noDataComponent="Aucune donnée"
                          paginationPerPage={5} // Affiche au minimum 5 éléments par page
                          paginationRowsPerPageOptions={[5, 10, 15, 20, 50]} // Options de pagination
                          customStyles={customStyles}
                        />
                      </div>




                  {/* FIN SPA*/}
                    {/* MODAL ICI – À L'EXTÉRIEUR DU DATATABLE */}
                    {selectedRow && (
                      <div className="modal-overlayy">
                        <div className="modal-content">
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
                            <p><strong>Status:</strong> {selectedRow.status}</p>
                          </div>
                          <button className="btn btn-danger mt-3" onClick={closeModal}>Fermer</button>
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
