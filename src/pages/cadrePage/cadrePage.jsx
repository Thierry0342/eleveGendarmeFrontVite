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
   // Fonction de changement pour tous les champs
   const handleChangeSPA = (e) => {
    const { name, value } = e.target;
    const newForm = { ...formSPA, [name]: value };
  
    if (name === "matricule" || name === "prenom") {
      // Si tu changes un des champs (matricule ou prénom), on réinitialise les autres champs associés
      if (!newForm.matricule && !newForm.prenom) {
        newForm.nom = "";
        newForm.grade = "";
        newForm.service = "";
      }
    }
  
    setFormSPA(newForm);
  };
  
  

  useEffect(() => {
    const inputMatricule = typeof formSPA.matricule === 'string' ? formSPA.matricule.trim().toLowerCase() : '';
const inputPrenom = typeof formSPA.prenom === 'string' ? formSPA.prenom.trim().toLowerCase() : '';

    
  
    const found = cadres.find((c) => {
      const mat = String(c.matricule || "").trim().toLowerCase();
      const prenom = String(c.prenom || "").trim().toLowerCase();
  
      // Recherche par matricule ou prénom
      return mat === inputMatricule || prenom === inputPrenom;
    });
  
    if (found) {
      // Si une correspondance est trouvée, remplir tous les champs
      setFormSPA((prev) => ({
        ...prev,
        nom: found.nom || "",
        prenom: found.prenom || "",
        grade: found.grade || "",
        service: found.service || "",
        matricule: found.matricule || prev.matricule,  // Mise à jour du matricule si nécessaire
      }));
    } else if (!inputMatricule && !inputPrenom) {
      // Si aucun des deux champs n'est rempli, réinitialiser les autres champs
      setFormSPA((prev) => ({
        ...prev,
        nom: "",
        prenom: "",
        grade: "",
        service: "",
        matricule: "",
      }));
    }
  }, [formSPA.matricule, formSPA.prenom, cadres]);
  
  
  

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
     // console.log(response.data);
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
    <div className="container py-4">
    <div className="row g-4">
      {/* Formulaire à gauche */}
      <div className="col-md-5">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h4 className="card-title text-primary mb-4">
              <i className="fa fa-user-plus me-2"></i>Ajouter un Cadre
            </h4>

            {['matricule', 'nom', 'prenom'].map((field) => (
              <div className="mb-3" key={field}>
                <input
                  type={field === 'matricule' ? 'number' : 'text'}
                  className="form-control form-control-lg"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                />
              </div>
            ))}

            <div className="mb-3">
              <select
                className="form-select form-select-lg"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
              >
                <option value="">-- SÉLECTIONNEZ LE GRADE --</option>
                {["GST", "G2C", "G1C", "GHC", "GP2C", "GP1C", "GPHC", "GPCE", "LIEUTENANT", "CAPITAINE", "CHEF D'ESCADRON", "LIEUTENANT-COLONEL", "COLONEL", "GÉNÉRAL DE BRIGADE", "GÉNÉRAL DE DIVISION"].map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <select
                className="form-select form-select-lg"
                name="service"
                value={formData.service}
                onChange={handleChange}
              >
                <option value="">-- SÉLECTIONNEZ LE SERVICE --</option>
                {["1ER ESCADRON", "2EME ESCADRON", "3EME ESCADRON", "4EME ESCADRON", "5EME ESCADRON", "6EME ESCADRON", "7EME ESCADRON", "8EME ESCADRON", "9EME ESCADRON", "10EME ESCADRON", "SIT INFO", "SE", "COUR A", "COUR B", "MATR", "SM", "INFRA"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="d-flex justify-content-between">
              <button className="btn btn-primary w-50 me-2" onClick={handleAddCadre}>
                <i className="fa fa-plus me-1"></i> Ajouter
              </button>
              <button className="btn btn-success w-50" onClick={handleModifCadre}>
                <i className="fa fa-edit me-1"></i> Modifier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau à droite */}
      <div className="col-md-7">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h4 className="card-title text-primary mb-3">
              <i className="fa fa-users me-2"></i>Liste des Cadres
            </h4>
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
      </div>
    </div>


  </div>
  
  )};
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
  }
        

export default CadreFormBootstrap;
