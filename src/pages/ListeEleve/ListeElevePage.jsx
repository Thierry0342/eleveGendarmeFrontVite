import React, { useEffect, useState } from 'react';
import EleveService from '../../services/eleveService'; // ⚠️ Vérifie la casse exacte du fichier
import ModalModificationEleve from '../EleveModifPage/EleveModifPage'; // 
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import { data } from 'react-router-dom';
import courService from '../../services/courService';
const user = JSON.parse(localStorage.getItem('user'));
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';



//table 

const ListeElevePge = () => {
  const [eleves, setEleves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [eleveActif, setEleveActif] = useState(null);
  const [filter, setFilter] = useState({ escadron: '', peloton: '' ,search:'' ,cour:''});

  //cour 
  const [coursList, setCoursList] = useState([]);
  useEffect(() => {
    const fetchCours = async () => {
      try {
        const res = await courService.getAll();
        const coursData = res.data;
  
        // Trier par valeur décroissante
        coursData.sort((a, b) => b.cour - a.cour);
  
        setCoursList(coursData);
  
        // Définir par défaut le plus grand
        if (coursData.length > 0) {
          setFilter(prev => ({
            ...prev,
            cour: coursData[0].cour.toString(), // Important si select attend une string
          }));
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
        
        EleveService.delete(id)
          .then(() => {
            setEleves(prev => prev.filter(e => e.id !== id));
            Swal.fire('Supprimé !', 'L\'élève a été supprimé.', 'success');
          })
          .catch(error => {
            console.error("Erreur lors de la suppression :", error);
            Swal.fire('Erreur', 'Impossible de supprimer cet élève.', 'error');
          });
      }
    });
  };
  
// maka donne rehetra
useEffect(() => {
  const intervalId = setInterval(() => {
    EleveService.get()
      .then(response => {
        if (Array.isArray(response.data)) {
          setEleves(response.data);
          console.log("Données mises à jour :", response.data); // Affiche les nouvelles données dans la console
        } else {
          console.error("Données inattendues :", response.data);
        }
      })
      .catch(error => {
        console.error("Erreur lors du chargement des élèves :", error);
      });
  }, 1000); // Appeler toutes les 1 secondes (1000 ms)

  // Nettoyer l'intervalle lorsque le composant est démonté
  return () => clearInterval(intervalId);

}, []); // L'effet s'exécute une seule fois au montage du composant

  const handleOpenModal = (eleve) => {
    setEleveActif(eleve);
    setShowModal(true);
  };
  

  const handleCloseModal = () => {
    setShowModal(false);
    setEleveActif(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEleveActif(prev => ({
      ...prev,
      [name]: value
    }));
  };
  //pour le filtre 
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (EleveService.update) {
        await EleveService.update(eleveActif); // Assure-toi que cette méthode est bien dans ton service
      }
      setShowModal(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
    }
  };

  
 
  // Application du filtre
  const elevesAAfficher = eleves.filter(eleve => {
    const escadronMatch = filter.escadron === '' || eleve.escadron === Number(filter.escadron);
    const pelotonMatch = filter.peloton === '' || eleve.peloton === Number(filter.peloton);
    const courMatch = filter.cour === '' || eleve.cour === Number(filter.cour); // <- Ajout ici
    const matchSearch = !filter.search || (
      eleve.nom?.toLowerCase().includes(filter.search.toLowerCase()) ||
      eleve.prenom?.toLowerCase().includes(filter.search.toLowerCase()) ||
      eleve.numeroIncorporation?.toString().includes(filter.search)
    );
  
    // Si peloton sélectionné sans escadron mais une recherche est présente → OK
    if (filter.peloton !== '' && filter.escadron === '' && filter.search) {
      return true;
    }
  
    return escadronMatch && pelotonMatch && courMatch && matchSearch; // <- Ajout ici
  });
  
const columns = [
  { name: 'Nom', selector: row => row.nom, sortable: true },
  { name: 'Prénom', selector: row => row.prenom, sortable: true },
  { name: 'Escadron', selector: row => row.escadron, sortable :true},
  { name: 'Peloton', selector: row => row.peloton },
  { name: 'Matricule', selector: row => row.matricule} ,
  { name: 'Incorporation', selector: row => row.numeroIncorporation },
  { name: 'Cours', selector: row => row.cour },
  {
    name: 'Actions',
    cell: row => (
      <>
        <button
          className="btn btn-warning btn-sm me-2"
          onClick={() => handleOpenModal(row)}
        >
          View
        </button>
    
        {user?.type === 'admin' && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </button>
        )}
      </>
    )
  }
];
//export en excel 
const handleExportExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Elèves par escadron');

    // Titre principal fusionné
    const title = 'Liste des élèves gendarme';
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.font = { size: 16, bold: true };
    worksheet.getRow(1).height = 30;

    // Définir les colonnes (sera réutilisé pour chaque section)
    const columns = [
      { header: 'Nom', key: 'nom', width: 20 },
      { header: 'Prénom', key: 'prenom', width: 20 },
      { header: 'Numéro Incorporation', key: 'numeroIncorporation', width: 25 },
      { header: 'Escadron', key: 'escadron', width: 15 },
      { header: 'Peloton', key: 'peloton', width: 15 },
      
    ];
    worksheet.columns = columns;

    // Ligne de départ après le titre
    let currentRow = 3;

    // Récupérer la liste des escadrons uniques, triés par ordre croissant
    const escadronsUniques = [...new Set(elevesAAfficher.map(e => e.escadron))].sort((a, b) => a - b);

    for (const escadron of escadronsUniques) {
      // Sous-titre escadron
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const sousTitreCell = worksheet.getCell(`A${currentRow}`);
      sousTitreCell.value = `${escadron}ème escadron`;
      sousTitreCell.font = { size: 14, bold: true, color: { argb: 'FF1F497D' } };
      sousTitreCell.alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.getRow(currentRow).height = 20;
      currentRow++;

      // En-tête colonnes pour cet escadron
      worksheet.getRow(currentRow).values = columns.map(col => col.header);
      worksheet.getRow(currentRow).font = { bold: true };
      worksheet.getRow(currentRow).alignment = { horizontal: 'center' };
      worksheet.getRow(currentRow).border = {
        bottom: { style: 'thin' }
      };
      currentRow++;

      // Filtrer élèves de cet escadron
      const elevesEscadron = elevesAAfficher.filter(e => e.escadron === escadron);

      // Ajouter chaque élève dans une ligne
      elevesEscadron.forEach(eleve => {
        worksheet.getRow(currentRow).values = [
          eleve.nom || '',
          eleve.prenom || '',
          eleve.numeroIncorporation || '',
          eleve.escadron || '',
          eleve.peloton || '',
          
        ];
        currentRow++;
      });

      // Ligne vide entre escadrons
      currentRow++;
    }

    // Sauvegarder le fichier Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Eleves_par_Escadron_${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (error) {
    console.error("Erreur lors de l'exportation Excel :", error);
    alert("Erreur lors de l'exportation Excel");
  }
};


  

  return (
    <div className="container mt-5">
      <h1 className="text-center fw-bold mb-4">
      --<i className="fa fa-users me-2 text-primary"></i>
        Liste des Élèves Gendarmes --
            
        </h1>
      <div className="row justify-content-center mb-5">
        <div className="col-md-6">
          <div className="row g-2">
            <div className='col-12'>
            <div className="col-md-3">
              <select
                  className="form-select"
                  name="cour"
                  value={filter.cour}
                  onChange={handleFilterChange}
                >
                  <option value="">COURS</option>
                  {coursList.map((c) => (
                    <option key={c.id} value={c.cour}>
                      {c.cour}
                    </option>
                  ))}
                </select>

              </div>
            </div>

            <div className="col-12">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par nom, prénom ou incorporation"
                name="search"
                value={filter.search}
                onChange={handleFilterChange}
              />
            </div>

              <div className="col-6">
                <select
                  className="form-select"
                  name="escadron"
                  value={filter.escadron}
                  onChange={handleFilterChange}
                >
                  <option value="">Sélectionner un escadron</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>

                      <div className="col-6">
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
                  {/* Réinitialiser le filtre */}
                      <div className="col-12">
                          <button
                            className="btn btn-outline-secondary w-100 btn-lg"
                            onClick={() => setFilter({ escadron: '', peloton: '', search: '',cour:''})}
                          >
                            <i className="fa fa-refresh"></i> Réinitialiser les filtres
                          </button>
                        </div>
                    </div>
                  </div>
                </div>
                <DataTable
                    columns={columns}
                    data={elevesAAfficher}
                    pagination
                    paginationPerPage={50}
                    paginationRowsPerPageOptions={[50, 100]}
                    highlightOnHover
                    striped
                    noDataComponent="Aucun élève à afficher"
                    customStyles={customStyles}
                 />
                 <button
                    className="btn btn-outline-success"
                    onClick={handleExportExcel}
                  >
                    📥 Exporter en Excel (.xlsx)
                  </button>

                 <div className="text-end mt-2">
                    <strong>Total :</strong> {elevesAAfficher.length} élèves Gendarmes
                  </div>

                    {eleveActif && (
                      <ModalModificationEleve
                        show={showModal}
                        onClose={handleCloseModal}
                        eleve={eleveActif}
                        onChange={handleChange}
                        onSave={handleSave}
                      />
                    )}
                    
                  </div>
                    );
                   };
                                  const customStyles = {
                                    headCells: {
                                      style: {
                                        fontSize: '17px', // Taille du texte des en-têtes
                                        fontWeight: 'bold',
                                      },
                                    },
                                    cells: {
                                      style: {
                                        fontSize: '17px', // Taille du texte des cellules
                                      },
                                    },
                                  };



export default ListeElevePge;
