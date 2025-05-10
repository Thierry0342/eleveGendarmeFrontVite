import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState , useEffect } from 'react';
import cadreService from '../../services/cadre-service';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';

const CadreFormBootstrap = () => {
  const [cadres, setCadres] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showSPA, setShowSPA] = useState(false);
  const [formSPA, setFormSPA] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    grade: "",
    service: "",
  });

  const [formData, setFormData] = useState({
    matricule :'',
    nom: '',
    prenom: '',
    grade: '',
    service: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  //affiche SPA 
  const toggleSPA = () => setShowSPA(!showSPA);
  const handleChangeSPA = (e) => {
    const { name, value } = e.target;
    const newForm = { ...formSPA, [name]: value };

    // Auto-remplir si matricule trouvé
    if (name === "matricule") {
      const found = cadres.find((c) => c.matricule === value);
      if (found) {
        newForm.nom = found.nom;
        newForm.prenom = found.prenom;
        newForm.grade = found.grade;
        newForm.service = found.service;
      }
    }

    setFormSPA(newForm);
  };



  const handleAddCadre = async () => {
    if (formData.nom && formData.prenom && formData.grade && formData.service) {
      try {
        await cadreService.post(formData); // Envoie au backend
        await fetchCadre(); // Recharge depuis le backend
        setFormData({ nom: '', prenom: '', grade: '', service: '' });
      } catch (error) {
        console.error("Erreur lors de l'ajout du cadre :", error);
      }
    }
  };
//changement des donne via back 
useEffect(() => {
    const intervalId = setInterval(() => {
        fetchCadre(); 

    },2000)
    return () => clearInterval(intervalId);
  }, []);

  const fetchCadre = async () => {
    try {
      const response = await cadreService.getAll();
      setCadres(response.data); // C'est la seule chose utile ici
      console.log(response.data);
    } catch (error) {
      console.error('Erreur de chargement des cadres', error);
    }
  };
  
  //delete et modif 
  const handleEdit = (cadre) => {
    // Remplit le formulaire avec les données à modifier
    setFormData({
      matricule:cadre.matricule,
      nom: cadre.nom,
      prenom: cadre.prenom,
      grade: cadre.grade,
      service: cadre.service
    });
    setEditingId(cadre.id); //  state editingId
  };
  
  const handleModifCadre = async () => {
    if (!editingId) return;
  
    try {
      await cadreService.update(editingId, formData); // <-- 
      console.log("forrrmmm data",formData)
      await fetchCadre(); // Recharger les données
      setFormData({ matriucle: '' ,nom: '', prenom: '', grade: '', service: '' }); // Réinitialiser
      setEditingId(null);
    } catch (error) {
      console.error("Erreur lors de la modification :", error);
    }
  };
  
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });
  
    if (result.isConfirmed) {
      try {
        await cadreService.delete(id);
        await fetchCadre();
        Swal.fire('Supprimé !', 'Le cadre a été supprimé.', 'success');
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        Swal.fire('Erreur', "La suppression a échoué.", 'error');
      }
    }
  };
  /// tableau cadre 
  const columns = [
    { name: 'Nom', selector: row => row.nom, sortable: true },
    { name: 'Prénom', selector: row => row.prenom, sortable: true },
    { name: 'Grade', selector: row => row.grade, sortable: true },
    { name: 'Service', selector: row => row.service, sortable: true },
    {
      name: 'Actions',
      cell: row => (
        <>
          <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(row)}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.id)}>
            Delete
          </button>
        </>
      ),
    },
  ];

  


  return (
    <div className="container mt-4">
      <div className="row">
        {/* Formulaire à gauche */}
        <div className="col-md-5">
          <h4>Ajouter un Cadre</h4>
          <div className="mb-3">
            <label className="form-label">Matricule</label>
            <input
              type="number"
              className="form-control"
              name="matricule"
              value={formData.matricule}
              onChange={handleChange}
              placeholder="Matricule"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Nom</label>
            <input
              type="text"
              className="form-control"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Entrez le nom"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Prénom</label>
            <input
              type="text"
              className="form-control"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              placeholder="Entrez le prénom"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Grade</label>
            <select
                className="form-control"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                >
                <option value="">-- SÉLECTIONNEZ LE GRADE --</option>
                <option value="GST">GST</option>
                <option value="G2C">G2C</option>
                <option value="G1C">G1C</option>
                <option value="GHC">GHC</option>
                <option value="GP2C">GP2C</option>
                <option value="GP1C">GP1C</option>
                <option value="GPHC">GPHC</option>
                <option value="GPCE">GPCE</option>
                <option value="LIEUTENANT">LIEUTENANT</option>
                <option value="CAPITAINE">CAPITAINE</option>
                <option value="CHEF D'ESCADRON">CHEF D'ESCADRON</option>
                <option value="LIEUTENANT-COLONEL">LIEUTENANT-COLONEL</option>
                <option value="COLONEL">COLONEL</option>
                <option value="GÉNÉRAL DE BRIGADE">GÉNÉRAL DE BRIGADE</option>
                <option value="GÉNÉRAL DE DIVISION">GÉNÉRAL DE DIVISION</option>
                </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Service</label>
                        <select
                            className="form-control"
                            name="service"
                            value={formData.service}
                            onChange={handleChange}
                            >
                            <option value="">-- SÉLECTIONNEZ LE SERVICE --</option>
                            <option value="1ER ESCADRON">1ER ESCADRON</option>
                            <option value="2EME ESCADRON">2EME ESCADRON</option>
                            <option value="3EME ESCADRON">3EME ESCADRON</option>
                            <option value="4EME ESCADRON">4EME ESCADRON</option>
                            <option value="5EME ESCADRON">5EME ESCADRON</option>
                            <option value="6EME ESCADRON">6EME ESCADRON</option>
                            <option value="7EME ESCADRON">7EME ESCADRON</option>
                            <option value="8EME ESCADRON">8EME ESCADRON</option>
                            <option value="9EME ESCADRON">9EME ESCADRON</option>
                            <option value="10EME ESCADRON">10EME ESCADRON</option>
                            <option value="SIT INFO">SIT INFO</option>
                            <option value="SE">SE</option>
                            <option value="COUR A">COUR A</option>
                            <option value="COUR B">COUR B</option>
                            <option value="MATR">MATR</option>
                            <option value="SM">SM</option>
                            <option value="INFRA">INFRA</option>
                            </select>
                    </div>
                    <button className="btn btn-primary me-4" onClick={handleAddCadre}>
                        Ajouter
                    </button>
                    
                    <button className="btn btn-success" onClick={handleModifCadre}>
                        Modifier
                    </button>
                    </div>

                    {/* Tableau à droite */}
                    <div className="col-md-7">
                    <h4>Liste des Cadres</h4>
                        <DataTable
                        columns={columns}
                        data={cadres}
                        pagination
                        highlightOnHover
                        striped
                        noDataComponent="Aucun élève à afficher"
                        customStyles={customStyles}
                        
                    />                         

        </div>
        
      </div>
      <button
        className="btn btn-secondary"
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999,
        }}
        onClick={toggleSPA}
      >
        SPA
      </button>
      {showSPA && (
        <div className="container mt-4 border-top pt-4 bg-light">
          <div className="row">
            <div className="col-md-5">
              <h4>Formulaire SPA</h4>
              <div className="mb-3">
                <label className="form-label">Matricule</label>
                <input
                  type="text"
                  className="form-control"
                  name="matricule"
                  value={formSPA.matricule}
                  onChange={handleChangeSPA}
                  placeholder="Entrez le matricule"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Nom</label>
                <input
                  type="text"
                  className="form-control"
                  name="nom"
                  value={formSPA.nom}
                  onChange={handleChangeSPA}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Prénom</label>
                <input
                  type="text"
                  className="form-control"
                  name="prenom"
                  value={formSPA.prenom}
                  onChange={handleChangeSPA}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Grade</label>
                <input
                  type="text"
                  className="form-control"
                  name="grade"
                  value={formSPA.grade}
                  onChange={handleChangeSPA}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Service</label>
                <input
                  type="text"
                  className="form-control"
                  name="service"
                  value={formSPA.service}
                  onChange={handleChangeSPA}
                />
              </div>
              <button className="btn btn-primary">Soumettre</button>
            </div>
          </div>
        </div>
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
        

export default CadreFormBootstrap;
