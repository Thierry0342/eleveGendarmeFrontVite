import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import consultationService from "../../services/consultation-service";
import eleveService from "../../services/eleveService";
import cadreService from "../../services/cadre-service";
import courService from "../../services/courService";
import Swal from 'sweetalert2';
import '../../index.css';



  const ConsultationPage = () => {
  const [incorporation, setIncorporation] = useState('');
  const [matriculeCadre ,setMatriculeCadre] = useState('');
  const [cour2, setCour2] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [coursList,setCoursList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchNom, setSearchNom] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const [selectedRow, setSelectedRow] = useState(null);
  // ajout  eleve et cadre
  const [eleveData, setEleveData] = useState({});
  const [cadres, setCadres] = useState([]);
  const [formData, setFormData] = useState({
    status:"EVASAN"
    
  });
  //Modal 
    // Fonction pour fermer le modal
    const handleCloseModal = () => {
      setShowModal(false); // Ferme le modal
    };
    // Fonction pour ouvrir le modal avec les données de la consultation
  const handleEdit = (consultation) => {
    setSelectedConsultation(consultation);
    setShowModal(true);
  };

 
  //fin 

  const fetchConsultations = (cour2) => {
    consultationService.getByCour(cour2)
      .then(res => setConsultations(res.data))
      .catch(err => console.error("Erreur chargement consultations :", err));
  };

  //fecth all cadre
  const fetchCadreData = async (mat)=> {
    try {
       // console.log("matricule ve e",mat) //pk ity
        const responseCadre = await cadreService.getbyMat(mat)
        console.log(responseCadre.data);
        if(responseCadre.data){
            setCadres(responseCadre.data);
        }
        else{
            console.log("cadre non trouvé")
            
        }
  
    } catch (error) {
        setCadres({});
        console.error('Erreur lors de la récupération des données:', error);
        
    }
  }

  const fetchEleveData = async (inc, cour) => {
    try {
      const response = await eleveService.getByInc(inc, cour);
     
      if (response.data) {
        setEleveData(response.data);  // Stocke les données récupérées
        
        
      } else {
        console.log('Élève non trouvé');
          
        alert("Elève non trouvé")
      }
    } catch (err) {
        setEleveData({});
        console.error('Erreur lors de la récupération des données:', err);
    }
  };
 
  
  //handle chanhge 
  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  //get all cour avant 
  useEffect(() => {
    
    const fetchCours = async () => {
      try {
        const res = await courService.getAll();
        const coursData = res.data;
  
        // Trier par valeur décroissante
        coursData.sort((a, b) => b.cour - a.cour);
  
        setCoursList(coursData);
        //setCoursList2(coursData);
  
        // Définir automatiquement le premier cours comme valeur par défaut
        if (coursData.length > 0) {
            setCour2(coursData[0].cour); 
        }

      } catch (err) {
        console.error("Erreur lors du chargement des cours", err);
      }
    };
  
    fetchCours();
  }, []);
  useEffect(() => {
    
    if (incorporation && cour2) {
        fetchEleveData(incorporation, cour2);  // Passe à la fonction fetchEleveData
      }
   if(matriculeCadre){
        fetchCadreData(matriculeCadre);
      }
 
    
    fetchConsultations(cour2);
    //get cadre , 
  },  [incorporation, cour2,matriculeCadre]);

  //handle save 
  
  const handleSave = async () => {
    const result = await Swal.fire({
      title: 'Confirmer l\'enregistrement',
      text: 'Voulez-vous vraiment enregistrer cette consultation ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, enregistrer',
      cancelButtonText: 'Annuler',
    });
  
    if (result.isConfirmed) {
      try {
        const dataToSend = {
          ...formData,
          eleveId: eleveData.eleve.id,
          cadreId: cadres.id,
          cour : eleveData.eleve.cour,
        };
  
        await consultationService.post(dataToSend);
  
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Consultation enregistrée avec succès',
          timer: 1000,
          showConfirmButton: false,
        }).then(() => {
          window.location.reload();
        });
  
      } catch (error) {
        console.error("Erreur :", error);
        Swal.fire({
          toast: true,
          
          icon: 'error',
          title: "Erreur lors de l'enregistrement",
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          customClass: {
            popup: 'bg-danger text-white shadow-lg'
          }
        });
      }
      
    }
  };
  const handleModif = () => {
    consultationService.update(selectedConsultation.id, {
      dateArrive: selectedConsultation.dateArrive,
      status: selectedConsultation.status,
      // Ajoute ici d'autres champs à envoyer si nécessaire
    })
    .then(() => {
      Swal.fire({
        toast:true,
        icon: 'success',
        title: 'Succès',
        position: 'top-end',
        text: 'Consultation mise à jour',
        showConfirmButton: false,
        timerProgressBar: true,
      });
      window.location.reload();
      setShowModal(false);  // Ferme le modal
    })
    .catch((err) => {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Échec de la mise à jour',
      });
      console.error(err);
    });
  };
  

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette consultation ?")) {
      await consultationService.delete(id);
      window.location.reload();
    }
  };
  //serach eleve par inco
  // Fonction pour la recherche de l'élève en fonction du numéro d'incorporation et du cours


  const columns = [
    { name: "Nom et prénom de l'élève", selector: row => row.Eleve?.nom +" "+ row.Eleve.prenom, sortable: true },
    { name: "Esc", selector: row => row.Eleve?.escadron, sortable: true  ,width: "70px"},
    { name: "Pon", selector: row => row.Eleve?.peloton, width: "70px"},
    { name: "Nom Cadre", selector: row => row.Cadre?.nom },
    { name: "Téléphone Cadre", selector: row => row.phone },
    { name: "Date Départ", selector: row => row.dateDepart },
    { name: "Date Arrivée", selector: row => row.dateArrive || "-" },
    { name: "Service Médical", selector: row => row.service || "-" },
    { name: "Référé", selector: row => row.refere },
    {
      name: "Status",
      cell: row => {
        let color = "black";
        if (row.status === "Escadron") color = "green";
        else if (row.status === "IG") color = "orange";
        else if (row.status === "EVASAN") color = "red";
    
        return (
          <span style={{ color, fontWeight: "bold", textTransform: "uppercase" }}>
            {row.status}
          </span>
        );
      },
      sortable: true,
    },
    
    {
      name: "Actions",
      cell: row => (
        <div className="d-flex justify-content-start">
          {/* Bouton Supprimer */}
          <button
            className="btn btn-danger btn-sm me-2"
            onClick={() => handleDelete(row.id)}
          >
            DEL
          </button>
          
          {/* Bouton Modifier */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleEdit(row)}
          >
            UP
          </button>
        </div>
      ),
    }
    
    
  ];
  //filtre donne avant affichage dans le tableau 
  const filteredConsultations = consultations.filter((item) => {
    const nomComplet = `${item.Eleve?.nom || ""} ${item.Eleve?.prenom || ""}`.toLowerCase();
    const dateMatch = searchDate === "" || item.dateDepart?.startsWith(searchDate);
    const nomMatch = nomComplet.includes(searchNom.toLowerCase());
  
    return nomMatch && dateMatch;
  });
  

  return (
<div className="container py-4">
  <div className="mb-4">
  {/* Section de recherche élève et cadre */}
  <div className="row">
    {/* Recherche Élève à gauche */}
    <div className="col-md-6">
      <h5>Recherche Élève</h5>
      
         <div className="mb-3">
              <label htmlFor="cour" className="form-label">Cours</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-graduation-cap text-primary"></i>
                </span>
                <select
                  id="cour2"
                  className="form-control border border-primary rounded-3 shadow-sm p-2"
                  value={cour2}
                  onChange={(e) => setCour2(e.target.value)}
                  required
                >
                  {coursList.map((item) => (
                    <option key={item.id} value={item.cour}>
                      {item.cour}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          <div className="mb-3">
            <label>Numéro d'incorporation</label>
            <div className="input-group">
              <span className="input-group-text bg-white border border-primary rounded-start-3">
                <i className="fas fa-id-card text-primary"></i> {/* Icône */}
              </span>
              <input
                type="text"
                className="form-control border border-primary rounded-end-3 shadow-sm p-2"
                name="numeroIncorporation"
                value={incorporation}
                onChange={(e) => setIncorporation(e.target.value)}
                required
              />
            </div>
          </div>

      
    </div>

    {/* Sélection cadre à droite */}
    <div className="col-md-6">
      <h5>Cadre Responsable</h5>
      <div className="mb-3">
          <label>Matricule</label>
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-id-card text-primary"></i> {/* Icône "matricule" */}
            </span>
            <input
              type="text"
              className="form-control border border-primary rounded-3 shadow-sm p-2"
              name="matricule"
              value={matriculeCadre}
              onChange={(e) => setMatriculeCadre(e.target.value)}
              required
            />
          </div>
        </div>

    </div>
  </div>

  {/* Affichage infos élève */}
  {eleveData && Object.keys(eleveData).length > 0 && (
  <div className="row mt-4">
    {/* Bloc élève à gauche */}
    <div className="col-md-6">
      <div className="border rounded p-4 bg-light">
        <h5 className="mb-3">Informations de l'élève</h5>
        <div className="row">
          <div className="col-md-4 mb-2">
            <label>ID</label>
            <input className="form-control" value={eleveData.eleve.id} readOnly />
          </div>
          <div className="col-md-4 mb-2">
            <label>Nom</label>
            <input className="form-control" value={eleveData.eleve.nom} readOnly />
          </div>
          <div className="col-md-4 mb-2">
            <label>Prénom</label>
            <input className="form-control" value={eleveData.eleve.prenom} readOnly />
          </div>
          <div className="col-md-3 mb-2">
            <label>Escadron</label>
            <input className="form-control" value={eleveData.eleve.escadron} readOnly />
          </div>
          <div className="col-md-3 mb-2">
            <label>Peloton</label>
            <input className="form-control" value={eleveData.eleve.peloton} readOnly />
          </div>
          <div className="col-md-3 mb-2">
            <label>Incorporation</label>
            <input className="form-control" value={eleveData.eleve.numeroIncorporation} readOnly />
          </div>
          <div className="col-md-3 mb-2">
            <label>Cours</label>
            <input className="form-control" value={eleveData.eleve.cour} readOnly />
          </div>
        </div>
      </div>
    </div>

    {/* Bloc cadre à droite */}
    <div className="col-md-6">
      <div className="border rounded p-4 bg-light">
        <h5 className="mb-3">Informations du cadre</h5>
       
     
              <div className="row">
                <div className="col-md-6 mb-2">
                    
                  <label>Nom</label>
                  <input className="form-control" value={cadres.grade +" "+cadres.nom} readOnly />
                </div>
                <div className="col-md-6 mb-2">
                  <label>Service</label>
                  <input className="form-control" value={cadres.service} readOnly />
                </div>
                <div className="col-md-6 mb-2">
                  <label>Matricule</label>
                  <input className="form-control" value={cadres.matricule} readOnly />
                </div>
                <div className="col-md-6 mb-2">
                  <label>Phone</label>
                  <input className="form-control" value={cadres.phone} readOnly />
                </div>
              </div>
      
        
        
   
      </div>
    </div>
  </div>
)}

  {/* Formulaire principal en dessous */}
      <div className="mt-4">
        <h5>Informations de la Consultation</h5>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label>Date de départ</label>
            <div className="input-group">
              <span className="input-group-text"><i className="fas fa-calendar-alt"></i></span>
              <input
                type="date"
                className="form-control"
                name="dateDepart"
                value={formData.dateDepart}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <label>Référé</label>
            <div className="input-group">
              <span className="input-group-text"><i className="fas fa-user-md"></i></span>
              <input
                type="text"
                className="form-control"
                name="refere"
                value={formData.refere}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <label>Service</label>
            <div className="input-group">
              <span className="input-group-text"><i className="fas fa-hospital"></i></span>
              <input
                type="text"
                className="form-control"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <label>Référence Message</label>
            <div className="input-group">
              <span className="input-group-text"><i className="fas fa-envelope-open-text"></i></span>
              <input
                type="text"
                className="form-control"
                name="refMessage"
                value={formData.refMessage}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <label>Téléphone</label>
            <div className="input-group">
              <span className="input-group-text"><i className="fas fa-phone"></i></span>
              <input
                type="text"
                className="form-control"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
        </div>

        <div className="mt-4 d-flex justify-content-center">
            <button
              className="btn btn-success d-flex align-items-center justify-content-center gap-2 px-4 py-2 rounded-3 shadow"
              onClick={handleSave}
            >
              <i className="fas fa-save"></i>
              Enregistrer
            </button>
          </div>

      </div>

    
        
        {/*commence ici le tableau*/}
        <h2 className="text-3xl font-semibold mb-4 text-center text-primary">
              EVACUATION SANITAIRE
            </h2>

            {/* Bouton afficher/masquer */}
            <div className="text-center mb-4">
              <button
                onClick={() => setIsTableVisible(!isTableVisible)}
                className="btn btn-outline-primary px-4 py-2 shadow rounded-pill"
              >
                <i className={`fas ${isTableVisible ? "fa-eye-slash" : "fa-eye"} me-2`}></i>
                {isTableVisible ? "Masquer la Liste" : "Afficher la Liste"}
              </button>
            </div>
            

            {isTableVisible && (
              <>
              <div className="row g-3 mb-4 bg-light p-3 rounded-4 shadow-sm border">
                  <div className="col-md-6 position-relative">
                    <label className="form-label fw-bold">🔍 Rechercher par nom</label>
                    <input
                      type="text"
                      className="form-control border-primary rounded-3 shadow-sm ps-4"
                      placeholder="Nom ou prénom de l'élève"
                      value={searchNom}
                      onChange={(e) => setSearchNom(e.target.value)}
                    />
                    <i className="bi bi-person position-absolute top-50 start-0 translate-middle-y ms-2 text-primary"></i>
                  </div>

                  <div className="col-md-6 position-relative">
                    <label className="form-label fw-bold">📅 Filtrer par date de départ</label>
                    <input
                      type="date"
                      className="form-control border-primary rounded-3 shadow-sm ps-4"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                    />
                    <i className="bi bi-calendar-event position-absolute top-50 start-0 translate-middle-y ms-2 text-primary"></i>
                  </div>
                </div>


                {/* Tableau des consultations */}
                <div className="card shadow-sm mb-4 p-3 border rounded-3">
                  <DataTable
                    columns={columns}
                    data={filteredConsultations}
                    pagination
                    highlightOnHover
                    responsive
                    striped
                    paginationRowsPerPageOptions={[5, 10, 15]}
                    noDataComponent="Aucune consultation trouvée"
                  />
                </div>

                {/* Cartes de statistiques */}
                <div className="row mb-4 text-center">
                  <div className="col-md-4 mb-3">
                    <div className="card shadow-sm border-start border-4 border-primary">
                      <div className="card-body">
                        <h5 className="card-title text-primary">
                          <i className="fas fa-notes-medical me-2"></i>Total consultations
                        </h5>
                        <p className="card-text fs-4 fw-bold">{consultations.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4 mb-3">
                    <div className="card shadow-sm border-start border-4 border-success">
                      <div className="card-body">
                        <h5 className="card-title text-success">
                          <i className="fas fa-user-check me-2"></i>Admis IG
                        </h5>
                        <p className="card-text fs-4 fw-bold">
                          {consultations.filter(c => c.status === "IG").length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4 mb-3">
                    <div className="card shadow-sm border-start border-4 border-warning">
                      <div className="card-body">
                        <h5 className="card-title text-warning">
                          <i className="fas fa-shield-alt me-2"></i>Escadron
                        </h5>
                        <p className="card-text fs-4 fw-bold">
                          {consultations.filter(c => c.status === "Escadron").length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}


      
                      {showModal && selectedConsultation && (
                    <div
                      className="modal fade show d-flex align-items-center justify-content-center"
                      tabIndex="-1"
                      style={{
                        display: "block",
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.4)",
                        backdropFilter: "blur(2px)",
                        zIndex: 1050,
                      }}
                    >
                      <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content shadow-lg border-0">
                          <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">Modifier la consultation</h5>
                            <button
                              type="button"
                              className="btn-close btn-close-white"
                              onClick={handleCloseModal}
                            ></button>
                          </div>

                          <div className="modal-body">
                            <div className="mb-3">
                              <label>ID</label>
                              <input
                                className="form-control"
                                value={selectedConsultation.id}
                                readOnly
                              />
                            </div>

                            <div className="mb-3">
                              <label>Date Arrivée</label>
                              <input
                                type="date"
                                className="form-control"
                                value={selectedConsultation.dateArrive || ''}
                                onChange={(e) => setSelectedConsultation({
                                  ...selectedConsultation,
                                  dateArrive: e.target.value
                                })}
                              />
                            </div>

                            <div className="mb-3">
                              <label>Status</label>
                              <select
                                className="form-select"
                                value={selectedConsultation.status || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSelectedConsultation({
                                    ...selectedConsultation,
                                    status: value,
                                    customStatus: value === "Autre" ? "" : null
                                  });
                                }}
                              >
                                <option value="IG">Admis IG</option>
                                <option value="Escadron">Escadron</option>
                                <option value="EVASAN">EVASAN</option>
                                
                              </select>
                            </div>

                        
                          </div>

                          <div className="modal-footer">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleCloseModal}
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handleModif}
                            >
                              Sauvegarder
                            </button>

                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                        
                          

                      </div>
                    );
                  };

export default ConsultationPage;
