import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import eleveService from '../../services/eleveService';
import courService from '../../services/courService';
import absenceService from '../../services/absence-service';
import DataTable from 'react-data-table-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';


const SaisieAbsence = () => {



  const [incorporation, setIncorporation] = useState('');
  const [eleveData, setEleveData] = useState({});
  const [cour, setCour] = useState([]);
  const [cour2, setCour2] = useState([]);
  const [motif, setMotif] = useState('');
  const [date,setDate]=useState('');
  const [absences, setAbsences] = useState([]);
  const [coursList, setCoursList] = useState([]);
  const [coursList2, setCoursList2] = useState([]);
  const [listeAbsence, setListeAbsence] = useState([]);
  const [filter, setFilter] = useState({ escadron: '', peloton: '' ,search:'' ,cour:'',date:''});
  const [showTable, setShowTable] = useState(false);
  const [showModal, setShowModal] = useState(false);
  //pour spa
  const [spaDate, setSpaDate] = useState('');
  const [totalI, setTotalI] = useState(0);
  const [totalA,setTotalA] = useState(0);
  const [spaNumber, setSpaNumber] = useState(1500); // Valeur par défaut



  

  //ajout cour automatique
  useEffect(() => {
    const fetchCours = async () => {
      try {
        const res = await courService.getAll();
        const coursData = res.data;
  
        // Trier par valeur décroissante
        coursData.sort((a, b) => b.cour - a.cour);
  
        setCoursList(coursData);
        setCoursList2(coursData);
  
        // Définir automatiquement le premier cours comme valeur par défaut
        if (coursData.length > 0) {
            setCour(coursData[0].cour); 
            setCour2(coursData[0].cour); 
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
         console.log("id pox ve ee" +id);      
          absenceService.delete(id)
            .then(() => {
              setListeAbsence(prev => prev.filter(e => e.id !== id));
              Swal.fire('Supprimé !', 'Operation Terminé', 'success');
              
            })
            .catch(error => {
              console.error("Erreur lors de la suppression :", error);
              Swal.fire('Erreur', 'Impossible de supprimer cet élève.', 'error');
            });
        }
      });
    };
    

  // get tous les absence 
  useEffect(() => {
    const intervalId = setInterval(() => {
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
    }, 1000); // Appeler toutes les 1 secondes (1000 ms)
  
    // Nettoyer l'intervalle lorsque le composant est démonté
    return () => clearInterval(intervalId);
  
  }, []);
  //inserer dans un tableau react
 //console.log("absence veee",absences)
  const columns = [
    { name: 'Nom', selector: row => row.Eleve.nom, sortable: true },
    { name: 'Prénom', selector: row => row.Eleve.prenom, sortable: true },
    { name: 'Escadron', selector: row => row.Eleve.escadron, sortable :true},
    { name: 'Peloton', selector: row => row.Eleve.peloton },
    { name: 'Incorporation', selector: row => row.Eleve.numeroIncorporation },
    { name: 'Cours', selector: row => row.Eleve.cour },
    { name: 'Date', selector: row => row.date },
    { name: 'Motifs', selector: row => row.motif ,sortable :true},
    {
      name: 'Actions',
      cell: row => (
        <>
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row.id)}>
            Delete
          </button>
        </>
      )
    }
    
   
  ];

  const fetchEleveData = async (inc, cour) => {
    try {
      const response = await eleveService.getByInc(inc, cour);
      if (response.data) {
        setEleveData(response.data);  // Stocke les données récupérées
        console.log("reponse maka by incorportation"+eleveData)
      } else {
        console.log('Élève non trouvé');
          
        alert("Elève non trouvé")
      }
    } catch (err) {
        setEleveData({});
        console.error('Erreur lors de la récupération des données:', err);
    }
  };

  useEffect(() => {
    if (incorporation && cour2) {
      fetchEleveData(incorporation, cour2);  // Passe à la fonction fetchEleveData
    }
  }, [incorporation, cour2]);
  //ajout absence 
  const handleSubmit = (e) => {
    e.preventDefault();
    
  
    
    Swal.fire({
      title: 'Confirmer l\'enregistrement',
      text: 'Voulez-vous enregistrer cette absence ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, enregistrer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        //data to send
        const dataToSend = {
          eleveId: eleveData.eleve.id,
          date,
          motif,
        };    
        absenceService.post(dataToSend)
          .then(response => {
            console.log('Absence enregistrée avec succès:', response.data);
            setAbsences([...absences, response.data]);
  
            //  Message de succès
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: 'L\'absence a été enregistrée.',
              confirmButtonColor: '#3085d6',
            });
          })
          .catch(error => {
            console.error('Erreur lors de l\'enregistrement de l\'absence:', error);
  
            //  Message d'erreur
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Une erreur est survenue lors de l\'enregistrement.',
              confirmButtonColor: '#d33',
            });
          });
      }
    });
  };
 //date aujourdhui
 useEffect(() => {
  const today = new Date().toISOString().split("T")[0]; // format 'YYYY-MM-DD'
  setDate(today);
}, []);
// Application du filtre
       const absenceafficher = listeAbsence.filter(abs => {
            const escadronMatch = filter.escadron === '' || String(abs.Eleve.escadron) === filter.escadron;
            const pelotonMatch = filter.peloton === '' || String(abs.Eleve.peloton) === filter.peloton;
            const courMatch = filter.cour === '' || String(abs.Eleve.cour) === filter.cour;

            const matchSearch = !filter.search || (
              abs.Eleve.nom?.toLowerCase().includes(filter.search.toLowerCase()) ||
              abs.Eleve.prenom?.toLowerCase().includes(filter.search.toLowerCase()) ||
              String(abs.Eleve.numeroIncorporation)?.includes(filter.search)
            );
            const dateMatch = !filter.date || abs.date === filter.date;


            if (filter.peloton !== '' && filter.escadron === '' && filter.search) {
              return true;
            }

            return escadronMatch && pelotonMatch && courMatch && matchSearch && dateMatch;
       });

      //pour le filtre 
      //console.log("Toutes les absences :", listeAbsence);

  const handleFilterChange = (e) => {
     const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };
  //total eleve absence 
  const absencesParIncorporationEtMotif = absenceafficher.reduce((acc, eleve) => {
    const { numeroIncorporation, motif } = eleve;
    
    if (!acc[numeroIncorporation]) {
      acc[numeroIncorporation] = {};
    }
    
    if (!acc[numeroIncorporation][motif]) {
      acc[numeroIncorporation][motif] = 1;
    } else {
      acc[numeroIncorporation][motif]++;
    }
    
    return acc;
  }, {});
  //ppour SPA 
  const handleAfficherIndispo = () => {
    const motifsI = ["IG", "CONSULTATION", "A REVOIR IG", "REPOS SAN"];
    
    const totalIvalue = absenceafficher.filter(abs =>
      motifsI.includes(abs.motif?.toUpperCase()) &&
      abs.date === spaDate && cour===cour
    ).length;
  
    const totalAvalue = absenceafficher.filter(abs =>
      !motifsI.includes(abs.motif?.toUpperCase()) &&
      abs.date === spaDate
    ).length;
  
    setTotalI(totalIvalue);
    setTotalA(totalAvalue);
  };
  // -----------------------------------------------
  ///En pdf 
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ format: "a4" });
      //change le date 
      const formattedDate = format(new Date(spaDate), "d MMMM yyyy");
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


  
      doc.setFontSize(12);
      doc.text(`Situation de Prise d'Arme du ${filter.cour} CFEG du ${formattedDate} `, 90, 55);
  
      // Tableau résumé
      autoTable(doc, {
        startY: 60,
        head: [['R', 'A', 'P', 'I', 'S']],
        body: [[spaNumber, totalA, spaNumber - totalA, totalI, (spaNumber - totalA) - totalI]],
        theme: 'grid',
        tableWidth: 100,
        margin: { left: doc.internal.pageSize.getWidth() - 120 },
        styles: {
          fontSize: 10,
          halign: 'center',
        },
      });
  
      // Préparation des données détaillées, avec regroupement des absences par motif
      const absencesDuJour = absenceafficher.filter(abs => abs.date === spaDate);
  
      // Motifs spécifiques à afficher après les autres
      const specificMotifs = ["IG", "CONSULTATION", "A REVOIR IG", "REPOS SAN"];
      
      // Regroupement des absences par motif
      const groupedMotifs = {};
      absencesDuJour.forEach(abs => {
        const motif = abs.motif?.toUpperCase() || "SANS MOTIF";
        if (!groupedMotifs[motif]) groupedMotifs[motif] = [];
        groupedMotifs[motif].push(abs);
      });
  
      // Construction des lignes du tableau
      let bodyDetails = [];
  
      // Ajout des autres motifs avant les motifs spécifiques
      Object.entries(groupedMotifs).forEach(([motif, absences]) => {
        if (!specificMotifs.includes(motif)) {
          // Ligne de total pour le motif
          bodyDetails.push([
            `${motif} : ${absences.length}`,
            '',
            '',
            '',
            '',
            ''
          ]);

          absences.forEach((abs, index) => {
            bodyDetails.push([
              '',
              abs.Eleve?.nom || '',
              abs.Eleve?.prenom || '',
              abs.Eleve?.numeroIncorporation || '',
              abs.Eleve?.escadron || '',
              abs.Eleve?.peloton || '',
            ]);
          });
  
          
        }
      });
  
      // Ajout des motifs spécifiques après
      specificMotifs.forEach(motif => {
        if (groupedMotifs[motif]) {
          bodyDetails.push([
            `${motif} : ${groupedMotifs[motif].length}`,
            '',
            '',
            '',
            '',
            ''
          ]);
          groupedMotifs[motif].forEach((abs, index) => {
            bodyDetails.push([
              '',
              abs.Eleve?.nom || '',
              abs.Eleve?.prenom || '',
              abs.Eleve?.numeroIncorporation || '',
              abs.Eleve?.escadron || '',
              abs.Eleve?.peloton || '',
            ]);
          });
  
          // Ligne de total pour le motif
         
        }
      });
  
      // Tableau détaillé en bas
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['MOTIFS', 'NOM', 'PRENOM', 'NUM INC', 'ESC', 'PON']],
        body: bodyDetails,
        theme: 'striped',
        styles: {
          fontSize: 10,
          halign: 'center',
        },
        headStyles: {
          fontStyle: 'bold',
          
        },
      });
      const finalY = doc.lastAutoTable.finalY; 
      doc.setFontSize(12);
      doc.text("DESTINATAIRES", 5 , finalY + 10);
      doc.text("- Monsieur le COLONEL ,",7, finalY + 17);
      doc.text(" Commandant de l'Ecole de la Gendarmerie nationale ,",7,finalY+22);
      doc.text("-AMBOSITRA-",70,finalY+28);
      doc.text("EGNA/CAB",45,finalY+32);  
      doc.save(`SPA_${spaDate}.pdf`);
    } catch (error) {
      console.error("Erreur lors de l'exportation du PDF :", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    }
  };
  
  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">SAISIE ABSENCE ELEVE GENDARME</h2>
      <br></br>
      <br></br>
      <div className="row">
        {/* Formulaire à gauche */}
        <div className="col-md-4">
          <form onSubmit={handleSubmit}>
            {/* Sélection du cours */}
            <div className="mb-3">
              <label htmlFor="cour" className="form-label">Cours</label>
              <select
                id="cour2"
                className="form-select"
                value={cour2}
                onChange={(e) => setCour2(e.target.value)}
                required
              >
                 {coursList2.map((item) => (
                    <option key={item.id} value={item.cour}>
                      {item.cour}
                    </option>
                  ))}
              </select>
            </div>

            {/* Saisie du numéro d'incorporation */}
            <div className="mb-3">
              <label htmlFor="incorporation" className="form-label">Numéro d'Incorporation</label>
              <input
                id="incorporation"
                type="text"
                className="form-control"
                value={incorporation}
                onChange={(e) => setIncorporation(e.target.value)}
                required
              />
            </div>
        
           
             

            {/* Affichage automatique des informations de l'élève */}
            {eleveData && Object.keys(eleveData).length > 0 && (
              <>
                <div className="mb-3">
                  <label htmlFor="nom" className="form-label">Nom</label>
                  <input
                    id="nom"
                    type="text"
                    className="form-control"
                    value={eleveData.eleve.nom || ''}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="prenom" className="form-label">Prénom</label>
                  <input
                    id="prenom"
                    type="text"
                    className="form-control"
                    value={eleveData.eleve.prenom || ''}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="matricule" className="form-label">Matricule</label>
                  <input
                    id="matricule"
                    type="text"
                    className="form-control"
                    value={eleveData.eleve.matricule || ''}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="escadron" className="form-label">Escadron</label>
                  <input
                    id="escadron"
                    type="text"
                    className="form-control"
                    value={eleveData.eleve.escadron || ''}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="peloton" className="form-label">Peloton</label>
                  <input
                    id="peloton"
                    type="text"
                    className="form-control"
                    value={eleveData.eleve.peloton || ''}
                    disabled
                  />
                </div>
                <div className="col">
                <input type="date" className="form-control" name="dateNaissance" value={date}   onChange={(e) => setDate(e.target.value)} />
              </div>
                 {/* Sélection du motif */}
            <div className="mb-3">
              <label htmlFor="motif" className="form-label">Motif</label>
              <select
                id="motif"
                className="form-select"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                required
              >
                <option value="">Sélectionner un motif</option>
                <option value="IG">ADMIS IG</option>
                <option value="CHRR">ADMIS CHRR</option>
                <option value="EVASAN">EVASAN</option>
                <option value="CONSULTATION">CONSULTATION</option>
                <option value="A REVOIR CHRR">A REVOIR CHRR</option>
                <option value="A REVOIR IG">A REVOIR IG</option>
                <option value="AD COM DLI">AD COM DLI</option>
                <option value="PERMISSION">PERMISSION</option>
                <option value="SPORT">SPORT</option>
                <option value="AD MDG">AD MDG</option>
                <option value="REPOS SANITAIRE">REPOS SANITAIRE</option>
                <option value="STAGE">STAGE</option>
                <option value="MISSION">MISSIOPN</option>
                <option value="AD_CEGN">AD CEGN</option>
                <option value="TOBY FANDRIANA">TOBY FANDRIANA</option>
              </select>
            </div>
            

            <div className="text-center">
              <button type="submit" className="btn btn-primary">Enregistrer Absence</button>
            </div>
              </>
            )}

           
          </form>
        </div>

        {/* Tableau des absences à droite */}
        <div className="col-md-8 mx-auto">
        <h3 className="text-center">Liste des Absences</h3>
          <form className="mb-4">
                      <div className="row">
                        <div className='col-md-4'>
                          <select
                            className="form-select"
                            name="cour"
                            value={filter.cour}
                            onChange={handleFilterChange}
                          >
                            {coursList.map((c) => (
                              <option key={c.id} value={c.cour}>
                                {c.cour}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className='col-md-4'>
                          <select
                            className="form-select"
                            name="escadron"
                            value={filter.escadron}
                            onChange={handleFilterChange}
                          >
                            <option value="">Escadron</option>
                            {[...Array(10)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>

                        <div className='col-md-4'>
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
                      </div>
                    </form>
                   
                    <div className="row mt-3">
                              <div className="col-md-8">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Rechercher par nom, prénom ou incorporation"
                                  name="search"
                                  value={filter.search}
                                  onChange={handleFilterChange}
                                />
                              </div>
                              <div className="col-md-4">
                                <input
                                  type="date"
                                  className="form-control"
                                  name="date"
                                  value={filter.date}
                                  onChange={handleFilterChange}
                                />
                              </div>


                      
                                  </div>
                                  <br></br>                                                                 
                                    <DataTable
                                        columns={columns}
                                        data={absenceafficher}
                                        pagination
                                        paginationPerPage={50}
                                        paginationRowsPerPageOptions={[10,20,50, 100]}
                                        highlightOnHover
                                        striped
                                        noDataComponent="Aucun élève à afficher"
                                        customStyles={customStyles}
                                      />
                                    <div className="d-flex justify-content-end gap-5 my-3">
                                        <button
                                          className="btn btn-info"
                                          onClick={() => setShowTable(prev => !prev)}
                                        >
                                          {showTable ? "Masquer le résumé des absences" : "Afficher le résumé des absences"}
                                        </button>

                                        <button className="btn btn-info" onClick={() => setShowModal(true)}>
                                          SPA
                                        </button>
                                      </div>                                   

                                      {showTable && (
                                        <div className="mt-4">
                                          <h5 className="text-center mb-3">Absences par Élève et Motif</h5>
                                          <table className="table table-bordered table-striped table-sm text-center">
                                            <thead className="table-dark">
                                              <tr>
                                                <th>Motif</th>
                                                <th>Nombre d'absences</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {Object.entries(absencesParIncorporationEtMotif).map(([inc, motifs]) =>
                                                Object.entries(motifs).map(([motif, count]) => (
                                                  <tr key={`${inc}-${motif}`}>
                                                    <td>{motif}</td>
                                                    <td><span className="badge bg-primary">{count}</span></td>
                                                  </tr>
                                                ))
                                              )}
                                            </tbody>
                                          </table>

                                          {/* Total global des absences */}
                                          <div className="text-end mt-2">
                                            <strong>Total :</strong> {absenceafficher.length} absences enregistrées
                                          </div>
                                        </div>
                                      )}
                               
                                  </div>
                                </div>
                                {showModal && (
                                        <>
                                          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                                            <div className="modal-dialog modal-lg">
                                              <div className="modal-content">
                                                <div className="modal-header">
                                                  <h5 className="modal-title">Situation de Prise d'Arme </h5>
                                                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                                </div>

                                                <div className="modal-body">
                                                  {/* Formulaire de sélection de date */}
                                                  <form className="d-flex align-items-center mb-4 gap-3">
                                                      <label htmlFor="spaDate" className="form-label mb-0">Date :</label>
                                                      <input
                                                        type="date"
                                                        id="spaDate"
                                                        className="form-control w-auto"
                                                        value={spaDate}
                                                        onChange={(e) => setSpaDate(e.target.value)}
                                                      />
                                                       <label htmlFor="totalEleve" className="form-label mb-0">Réaliser (R) :</label>
                                                          <input
                                                            type="number"
                                                            id="totalEleve"
                                                            className="form-control w-auto"
                                                            value={spaNumber}
                                                            onChange={(e) => setSpaNumber(Number(e.target.value))}
                                                          />

                                                      <button type="button" className="btn btn-primary" onClick={handleAfficherIndispo}>
                                                        AFFICHER SPA
                                                      </button>
                                                    </form>


                                                  {/* Tableau SPA */}
                                                  <table className="table table-bordered table-sm text-center">
                                                    <thead className="table-secondary">
                                                      <tr>
                                                        <th>R</th>
                                                        <th>A</th>
                                                        <th>P</th>
                                                        <th>I</th>
                                                        <th>S</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      <tr>
                                                        <td><span className="badge bg-info">{spaNumber}</span></td>
                                                        <td><span className="badge bg-warning">{totalA}</span></td>    {/* I : motifs médicaux */}
                                                        <td><span className="badge bg-info">{spaNumber-totalA}</span></td>
                                                        <td><span className="badge bg-warning">{totalI}</span></td> {/* A : autres motifs */}
                                                        <td><span className="badge bg-info">{(spaNumber-totalA)-totalI}</span></td>
                                                      </tr>
                                                    </tbody>
                                                  </table>
                                                </div>

                                                <div className="modal-footer d-flex justify-content-between">
                                                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
                                                  <button className="btn btn-success" onClick={handleExportPDF}>IMPRIMER</button>

                                                </div>
                                              </div>
                                            </div>

                                            {/* Overlay backdrop */}
                                            
                                          </div>
                                        </>
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
                          //show modal SPA 
                        
                          
export default SaisieAbsence;
