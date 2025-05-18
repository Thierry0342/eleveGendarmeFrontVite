import React, { useState, useEffect } from 'react';

import eleveService from '../../services/eleveService';
import courService from '../../services/courService';
import PermissionService from '../../services/permissionService';
import Swal from 'sweetalert2';
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
const PermissionPage = () => {
 const [cour, setCour] = useState([]);
 const [eleveData, setEleveData] = useState({});
 const [incorporation, setIncorporation] = useState('');
 const [coursList, setCoursList] = useState([]);
 const [permissionList, setPermissionList] = useState([]);
 const [filter, setFilter] = useState({ escadron: '', peloton: '' ,search:'' ,cour:'',date:''});
 
 const user = JSON.parse(localStorage.getItem('user'));

 const [formData, setFormData] = useState({
    telephone1: "",
    telephone2: "",
    telephone3: "",
    phoneFamille: "",
    lieu: "",
    
  });
  
  useEffect(() => {
    if (eleveData.eleve) {
      setFormData({
        telephone1: eleveData.eleve.telephone1 || "",
        telephone2: eleveData.eleve.telephone2 || "",
        telephone3: eleveData.eleve.telephone3 || "",
        cour: eleveData.eleve.cour ,
       
        
      });
    }
  }, [eleveData.eleve]);
  
  
  
 //ajout cour automatique
 useEffect(() => {
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
  
    fetchCours();
  }, []);
  //get all eleve 
  const fetchEleveData = async (inc, cour) => {
    try {
      const response = await eleveService.getByInc(inc, cour);
      if (response.data) {
        setEleveData(response.data);  // Stocke les données récupérées
     
        //console.log("reponse maka by incorportation"+eleveData)
      } else {
        console.log('Élève non trouvé');
          
        alert("Elève non trouvé")
      }
    } catch (err) {
        setEleveData({});
       
        console.error('Erreur lors de la récupération des données:', err);
    }
  };
  //filter
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
   setFilter(prev => ({ ...prev, [name]: value }));
 };

  useEffect(() => {
    if (incorporation && cour) {
      fetchEleveData(incorporation, cour);  // Passe à la fonction fetchEleveData
    }
  }, [incorporation, cour]);
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
      //get permission 

      useEffect(() => {
        const intervalId = setInterval(() => {
          PermissionService.getAll()
            .then(response => {
              if (Array.isArray(response.data)) {
                setPermissionList(response.data);
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
  //hanldeSubmit 
 const handleSubmit = (e) => {
  e.preventDefault();

  Swal.fire({
    title: 'Confirmer la création',
    text: 'Voulez-vous enregistrer ces informations ?',
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
        ...formData,
      };

      PermissionService.post(dataToSend) // ⬅️ appel du service
        .then(response => {
            setFormData('');
            setIncorporation('');
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Enregistrement réussi',
            showConfirmButton: false,
            timer: 3000,
            
          });
        })
        .catch(error => {
          console.error("Erreur lors de l'enregistrement :", error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible d’enregistrer les données.',
          });
        });
    }
  });
};
//delete perm 
const handleDeletePermission = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce permissionnaire ?")) return;
  
    try {
      PermissionService.delete(id)
      // Mettre à jour la liste localement après suppression :
      setPermissionList((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      alert("Une erreur est survenue lors de la suppression.");
    }
  };
  

const columns = [
    {
      name: "Nom et Prénoms",
      selector: (row) => row.Eleve.nom + " " + row.Eleve.prenom,
      sortable: true,
    },
    {
      name: "Escadron",
      selector: (row) => row.Eleve.escadron,
    },
    {
      name: "Peloton",
      selector: (row) => row.Eleve.peloton,
    },
    {
      name: "Téléphone 1",
      selector: (row) => row.telephone1,
    },
    {
      name: "Téléphone 2",
      selector: (row) => row.telephone2 || "-",
    },
    {
      name: "Téléphone 3",
      selector: (row) => row.telephone3 || "-",
    },
    {
      name: "Téléphone Famille",
      selector: (row) => row.phoneFamille,
    },
    {
      name: "Lieu",
      selector: (row) => row.lieu,
    },
    {
      name: "Cours",
      selector: (row) => row.cour,
    },
    {
      name: "Actions",
      cell: (row) => (
        <button
          className="btn btn-sm btn-outline-danger rounded-pill"
          onClick={() => handleDeletePermission(row.id)}
        >
           Supprimer
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];
  
  //filtre liste 
  const filteredPermissions = permissionList.filter((item) => {
    const matchCour = filter.cour === "" || item.cour === parseInt(filter.cour);
    const matchEscadron =
      filter.escadron === "" || item.Eleve?.escadron === parseInt(filter.escadron);
    const matchPeloton =
      filter.peloton === "" || item.Eleve?.peloton === parseInt(filter.peloton);
  
    const search = filter.search.toLowerCase();
    const matchSearch =
      !search ||
      item.Eleve?.nom?.toLowerCase().includes(search) ||
      item.Eleve?.prenom?.toLowerCase().includes(search) ||
      item.Eleve?.numeroIncorporation?.toString().includes(search);
  
    // Ajoute ici si tu as un champ `createdAt` ou `date` dans `Permission`
    const matchDate =
      filter.date === "" ||
      item.createdAt?.slice(0, 10) === filter.date; // compare format 'YYYY-MM-DD'
  
    return matchCour && matchEscadron && matchPeloton && matchSearch && matchDate;
  });
  //pdf
  const exportToExcel = (filteredPermissions) => {
    // Structure des données à exporter
    const data = filteredPermissions.map((item) => ({
      "Nom et Prénoms": `${item.Eleve?.nom || ""} ${item.Eleve?.prenom || ""}`,
      "Escadron": item.Eleve?.escadron || "",
      "Peloton": item.Eleve?.peloton || "",
      "Téléphone 1": item.telephone1 || "",
      "Téléphone 2": item.telephone2 || "",
      "Téléphone 3": item.telephone3 || "",
      "Téléphone Famille": item.phoneFamille || "",
      "Lieu": item.lieu || "",
      "Cours": item.cour || "",
    }));
  
    // Création de la feuille Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
  
    XLSX.utils.book_append_sheet(workbook, worksheet, "Permissions");
  
    // Génération et téléchargement
    XLSX.writeFile(workbook, "permissionnaires_filtrés.xlsx");
  };
  
  

  //le page


  return(
    <div className="container mt-5">
  <h2 className="text-center text-uppercase fw-bold text-primary mb-4" style={{ letterSpacing: "2px" }}>
    📝 Permission - Élève Gendarme
  </h2>
  <hr className="mx-auto" style={{ width: "100px", borderTop: "3px solid #0d6efd" }} />

  <div className="row">
    {/* Formulaire à gauche */}
    <div className="col-md-4">
      <form onSubmit={handleSubmit} className="p-4 bg-light rounded shadow-sm">
        {/* Sélection du cours */}
        <div className="mb-4">
          <label htmlFor="cour" className="form-label fw-semibold">
            <i className="fas fa-book me-2 text-primary"></i>Cours
          </label>
          <select
            id="cour"
            className="form-select border-0 shadow-sm"
            value={cour}
            onChange={(e) => setCour(e.target.value)}
            required
          >
            {coursList.map((item) => (
              <option key={item.id} value={item.cour}>
                {item.cour}
              </option>
            ))}
          </select>
        </div>

        {/* Incorporation */}
        <div className="mb-4">
          <label htmlFor="incorporation" className="form-label fw-semibold">
            <i className="fas fa-id-card me-2 text-primary"></i>Numéro d'incorporation
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

        {/* Affichage infos élève */}
        {eleveData?.eleve && (
          <>
            <hr />
            <h6 className="text-muted mb-3">Informations Élève</h6>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                <i className="fas fa-user me-2 text-primary"></i>Nom & Prénom
              </label>
              <input
                type="text"
                className="form-control"
                value={`${eleveData.eleve.nom} ${eleveData.eleve.prenom}`}
                disabled
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                <i className="fas fa-shield-alt me-2 text-primary"></i>Escadron
              </label>
              <input
                type="text"
                className="form-control"
                value={eleveData.eleve.escadron}
                disabled
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                <i className="fas fa-users me-2 text-primary"></i>Peloton
              </label>
              <input
                type="text"
                className="form-control"
                value={eleveData.eleve.peloton}
                disabled
              />
            </div>

            <hr />
            <h6 className="text-muted mb-3">Téléphones</h6>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label">Téléphone 1</label>
                <input
                  type="number"
                  className="form-control"
                  
                  value={formData.telephone1}
                  onChange={(e) => setFormData({ ...formData, telephone1: e.target.value })}
                />
              </div>
              <div className="col-6 mb-3">
                <label className="form-label">Téléphone 2</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.telephone2}
                  onChange={(e) => setFormData({ ...formData, telephone2: e.target.value })}
                />
              </div>
              <div className="col-6 mb-3">
                <label className="form-label">Téléphone 3</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.telephone3}
                  onChange={(e) => setFormData({ ...formData, telephone3: e.target.value })}
                />
              </div>
              <div className="col-6 mb-3">
                <label className="form-label">Tél. Famille</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.phoneFamille}
                  onChange={(e) => setFormData({ ...formData, phoneFamille: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Lieu de permission</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={formData.lieu}
                onChange={(e) => setFormData({ ...formData, lieu: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="text-center">
              <button type="submit" className="btn btn-success w-100 rounded-pill shadow">
                <i className="fas fa-save me-2"></i>Enregistrer la Permission
              </button>
            </div>
          </>
        )}
      </form>
    </div>


                               {/* Tableau des permissionnaires à droite */}
                                    <div className="col-md-8 mx-auto">
                                    <div className="card shadow-sm border-0">
                                        <div className="card-body">
                                        <h3 className="text-center fw-bold text-primary mb-4">
                                            📋 Liste des Permissionnaires
                                        </h3>

                                        {/* Formulaire de recherche */}
                                        <form className="mb-4">
                                            <div className="row g-3">
                                            {/* Sélecteur de Cours */}
                                            <div className="col-md-4">
                                                <select
                                                className="form-select shadow-sm"
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

                                            {/* Sélecteur d’Escadron */}
                                            <div className="col-md-4">
                                                <select
                                                className="form-select shadow-sm"
                                                name="escadron"
                                                value={filter.escadron}
                                                onChange={handleFilterChange}
                                                >
                                                <option value="">Escadron</option>
                                                {[...Array(10)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>
                                                    {i + 1}
                                                    </option>
                                                ))}
                                                </select>
                                            </div>

                                            {/* Sélecteur de Peloton */}
                                            <div className="col-md-4">
                                                <select
                                                className="form-select shadow-sm"
                                                name="peloton"
                                                value={filter.peloton}
                                                onChange={handleFilterChange}
                                                >
                                                <option value="">Peloton</option>
                                                {[1, 2, 3].map((p) => (
                                                    <option key={p} value={p}>
                                                    {p}
                                                    </option>
                                                ))}
                                                </select>
                                            </div>
                                            </div>

                                            {/* Recherche + Date */}
                                            <div className="row mt-3 g-3">
                                            <div className="col-md-8">
                                                <input
                                                type="text"
                                                className="form-control shadow-sm"
                                                placeholder="🔍 Rechercher par nom, prénom ou incorporation"
                                                name="search"
                                                value={filter.search}
                                                onChange={handleFilterChange}
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <input
                                                type="date"
                                                className="form-control shadow-sm"
                                                name="date"
                                                value={filter.date}
                                                onChange={handleFilterChange}
                                                />
                                            </div>
                                            </div>

                                            {/* Bouton Réinitialiser */}
                                            <div className="d-flex justify-content-center mt-4">
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary px-4 py-2 rounded-pill shadow-sm"
                                                onClick={handleResetFilter}
                                            >
                                                🔁 Réinitialiser la recherche
                                            </button>
                                            </div>
                                        </form>

                                        <h5 className="fw-bold text-secondary border-bottom pb-2 mb-3">
                                            Résultats :
                                        </h5>

                                        <DataTable
                                            columns={columns}
                                            data={filteredPermissions}
                                            pagination
                                            highlightOnHover
                                            striped
                                            dense
                                            responsive
                                        />
                                        <button
                                            className="btn btn-outline-primary mb-3"
                                            onClick={() => exportToPdf(filteredPermissions)}
                                            >
                                            📄 Exporter en PDF
                                            </button>
                                            <button
                                                className="btn btn-outline-success mb-3 mx-2"
                                                onClick={() => exportToExcel(filteredPermissions)}
                                                >
                                                📥  Exporter en Excel (.xlsx)
                                                </button>


                                        </div>
                                      
                                    </div>



                             <br></br>   
                                                                                                                                                                                        
                        </div>
                        </div>
                        
                        </div>
                        );
                        }
  export default PermissionPage;