import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import eleveService from '../../services/eleveService';
import { useNavigate } from 'react-router-dom';
import courService from '../../services/courService';

import Swal from 'sweetalert2';



const ElevePage = () => {
  const [formData, setFormData] = useState({
    numCandidature: '',
    numeroIncorporation: '',
    escadron: '',
    peloton: '',
    cour:'',
    matricule :'',
    centreConcours: '',
    Specialiste:'',
    genreConcours: '',
    SpecialisteAptitude: '',
    nom: '',
    diplomes: '',
    filiereDoctorat: '', 
    filiereMasterOne: '', 
    filiereLicence: '', 
    filiereMasterTwo:'',
    niveauEtude : '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    CIN: '',
    dateDelivrance: '',
    lieuDelivrance: '',
    duplicata: '',
    sports:'',
    loisir:'',
    religion:'',
    niveau:'',
    groupeSaguin:'',
    fady:'',
    relationGenante: "", 
    pointure : {
       tailleChemise: "",
       tourTete: "",
       pointurePantalon: "",
       pointureChaussure: "",
    },
    famille: {
      conjointe: { nom: '', prenom: '', adresse: '', phone: '' },
      pere: { nom: '', prenom: '', adresse: '', phone: '' },
      mere: { nom: '', prenom: '', adresse: '', phone: '' },
      contact: { nom: '', adresse: '', phone: '' },
      enfants: [
        { nom: '', prenom: '', dateNaissance: '', sexe: '' }
      ],
      soeur: [{ nom: '' }],
      frere: [{ nom: '' }],
      accidents: { nom:'', adresse:'',phone:''},
    },
    image: "",
    situationFamiliale: '',
    
      telephone1: '',
      telephone2: '',
      telephone3: '',
    
    facebook: "",


  });
  const navigate = useNavigate();
  const [showFamille, setShowFamille] = useState(false); // Etat pour afficher/masquer la section famille

  const [imagePreview, setImagePreview] = useState(''); // Pour afficher l'image sélectionnée
  ///// ajouter nouveau efant e
  const ajouterEnfant = () => {
    setFormData((prev) => ({
      ...prev,
      famille: {
        ...prev.famille,
        enfants: [...prev.famille.enfants, { nom: '', prenom: '', dateNaissance: '', sexe: '' }],
      },
    }));
  };
  //cour 
  const [filter, setFilter] = useState({
    cour: '',// 
    // ajoute d'autres filtres ici si nécessaire
  });
  
  const [coursList, setCoursList] = useState([]);
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
          setFormData(prev => ({
            ...prev,
            cour: coursData[0].cour,
          }));
        }
  
      } catch (err) {
        console.error("Erreur lors du chargement des cours", err);
      }
    };
  
    fetchCours();
  }, []);
  
  
  //suprime formulaire efant 
  const supprimerEnfant = (index) => {
    setFormData((prevState) => {
      const enfants = [...prevState.famille.enfants];
      enfants.splice(index, 1); // Supprime l'enfant à l'index donné

      return {
        ...prevState,
        famille: {
          ...prevState.famille,
          enfants,
        },
      };
    });
  };
  // fomulaire soeur et frere
  // Fonction pour ajouter un frère
  const ajouterFrere = () => {
    setFormData((prev) => ({
      ...prev,
      famille: {
        ...prev.famille,
        frere: [...prev.famille.frere, { nom: '', }],
      },
    }));
  };
  //suprim

  // Fonction pour ajouter une soeur
  const ajouterSoeur = () => {
    setFormData((prev) => ({
      ...prev,
      famille: {
        ...prev.famille,
        soeur: [...prev.famille.soeur, { nom: '' }],
      },
    }));
  };
  //suprim
  // Fonction pour supprimer un frère
  const supprimerFrere = (index) => {
    setFormData((prevState) => {
      const frere = [...prevState.famille.frere];
      frere.splice(index, 1); // Supprime l'enfant à l'index donné

      return {
        ...prevState,
        famille: {
          ...prevState.famille,
          frere,
        },
      };
    });
  };
  // Fonction pour supprimer une soeur
  const supprimerSoeur = (index) => {
    setFormData((prevState) => {
      const soeur = [...prevState.famille.soeur];
      soeur.splice(index, 1); // Supprime l'enfant à l'index donné

      return {
        ...prevState,
        famille: {
          ...prevState.famille,
          soeur,
        },
      };
    });
  };



  // Fonction pour gérer l'importation de l'image
 const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setFormData({ ...formData, image: file }); // Stocke directement le fichier (pas en base64)
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result); // Pour prévisualiser l'image
    };
    reader.readAsDataURL(file);
  }
};

  
  const handleChange = (e, index = null) => {
    const { name, value } = e.target;

    if (name.startsWith('famille.enfants')) {
      const field = name.split('.')[2]; // e
      const newEnfants = [...formData.famille.enfants];
      newEnfants[index][field] = value;

      setFormData((prev) => ({
        ...prev,
        famille: {
          ...prev.famille,
          enfants: newEnfants,
        },
      }));
    }
    else if (name.startsWith('famille.soeur')) {
      const field = name.split('.')[2]; // 
      const newSoeur = [...formData.famille.soeur];
      newSoeur[index][field] = value;

      setFormData((prev) => ({
        ...prev,
        famille: {
          ...prev.famille,
          soeur: newSoeur,
        },
      }));
    }
    else if (name.startsWith('famille.frere')) {
      const field = name.split('.')[2]; // 
      const newFrere = [...formData.famille.frere];
      newFrere[index][field] = value;

      setFormData((prev) => ({
        ...prev,
        famille: {
          ...prev.famille,
          frere: newFrere,
        },
      }));
    }
    else if (name.startsWith('famille.')) {
      const path = name.split('.');
      setFormData(prevState => ({
        ...prevState,
        famille: {
          ...prevState.famille,
          [path[1]]: {
            ...prevState.famille[path[1]],
            [path[2]]: value,
          },
        },
      }));
      
    }
    else if (name.startsWith('pointure.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        }
      }));
    }
     
    else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    //change en json
    const form = new FormData();

    // Champs simples
    form.append("numCandidature", formData.numCandidature);
    form.append("numeroIncorporation", formData.numeroIncorporation);
    form.append("escadron", formData.escadron);
    form.append("peloton", formData.peloton);
    form.append("matricule", formData.matricule);
    form.append("centreConcours", formData.centreConcours);
    form.append("Specialiste", formData.Specialiste);
    form.append("genreConcours", formData.genreConcours);
    form.append("SpecialisteAptitude", formData.SpecialisteAptitude);
    form.append("nom", formData.nom);
    form.append("filiereDoctorat", formData.filiereDoctorat);
    form.append("filiereMasterOne", formData.filiereMasterOne);
    form.append("filiereLicence", formData.filiereLicence);
    form.append("filiereMasterTwo", formData.filiereMasterTwo);
    form.append("niveauEtude", formData.niveauEtude);
    form.append("prenom", formData.prenom);
    form.append("dateNaissance", formData.dateNaissance);
    form.append("lieuNaissance", formData.lieuNaissance);
    form.append("CIN", formData.CIN);
    form.append("dateDelivrance", formData.dateDelivrance);
    form.append("lieuDelivrance", formData.lieuDelivrance);
    form.append("duplicata", formData.duplicata);
    form.append("loisir", formData.loisir);
    form.append("religion", formData.religion);
    form.append("niveau", formData.niveau);
    form.append("groupeSaguin", formData.groupeSaguin);
    form.append("fady", formData.fady);
    form.append("relationGenante", formData.relationGenante);
    form.append("situationFamiliale", formData.situationFamiliale);
    form.append("telephone1", formData.telephone1);
    form.append("telephone2", formData.telephone2);
    form.append("telephone3", formData.telephone3);
    form.append("facebook", formData.facebook);
    form.append("cour",formData.cour);
    
    // Champs complexes (convertis en chaînes JSON)
    form.append("pointure", JSON.stringify(formData.pointure));
    form.append("famille", JSON.stringify(formData.famille));
    form.append("diplomes", JSON.stringify(formData.diplomes)); // même si vide, important pour le backend
    form.append("sports", JSON.stringify(formData.sports));
  
    

    // Image (DOIT correspondre à multer.single("image"))
    if (formData.image) {
      form.append("image", formData.image);
    }
    



    if (!formData.escadron || !formData.peloton || !formData.CIN || !formData.numeroIncorporation || !formData.genreConcours) {
  
      Swal.fire({
        title: 'Veuillez vérifier les champs',
        text: "Les champs sont obligatoire !",
        icon: 'error',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Retour',
       
      })
      return; // Ne pas soumettre si des champs sont vides
    }



    console.log('Formulaire soumis:', form);

    try {
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: " Voullez vous ajouter ?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor:'#32CD32',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Oui, Ajouter',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          
           eleveService.post(form)
            .then(() => {
    
              Swal.fire('Ajouté!', 'L\'élève a été ajouté', 'success').then(() => {
                console.log('Formulaire soumis:', form);
                navigate('/eleve/listeEleveGendarme'); // 
              });
            })
            .catch(error => {
              console.error("Erreur lors de l'enregistrement :", error);
              Swal.fire("Une erreur s'est produite",'error')
              
              
            });
        }
      });


      //const response = await eleveService.post(formData);
     // console.log('Élève créé avec succès:', response);

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'élève:', error);
    }
  };

  // Fonction pour basculer l'affichage de la section famille
  const toggleFamille = () => {
    setShowFamille(!showFamille);
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">ELEVE GENDARME</h2>
      <form onSubmit={handleSubmit}>
             <div className="col-md-3">
             <select
                  className="form-select"
                  name="cour"
                  value={formData.cour}
                  onChange={handleChange}
                  required
                >
                 
                  {coursList.map((item) => (
                    <option key={item.id} value={item.cour}>
                      {item.cour}
                    </option>
                  ))}
                </select>
              </div>
              <br></br>
        <div className="col">
          {/* Champ pour télécharger l'image */}
          <input
            type="file"
            className="form-control"
            name="image"
            onChange={handleImageChange}
            required
          />
        </div>

        <div className="col">
          {/* Affichage de l'image ou image par défaut */}
          <img
            src={imagePreview || 'logo192.png'} // Image par défaut si aucune image sélectionnée
            alt="Aperçu"
            className="img-thumbnail"
            width="200"
          />
        </div>

        <div className="row">
          {/* Colonne gauche : formulaire principal */}
          
          <div className="col-md-5">

          <div className="card shadow-lg border rounded p-3">
            {/* Ligne 1 */}

            <  div className="row mb-3">
              <div className="col">
                <input type="text" className="form-control" name="numCandidature" placeholder="Numéro de candidature" value={formData.numCandidature} onChange={handleChange} />
              </div>
              <div className="col">
                <input type="text" className="form-control" name="numeroIncorporation" placeholder="Numéro d'incorporation" value={formData.numeroIncorporation} onChange={handleChange} />
              </div>
              <div className="col">
                <input type="text" className="form-control" name="matricule" placeholder="Matricule" value={formData.matricule} onChange={handleChange} />
              </div>
            </div>

            {/* Ligne 2 */}
            <div className="row mb-3">
              <div className="col">
                <select
                  className="form-select"
                  name="escadron"
                  value={formData.escadron}
                  onChange={handleChange}
                >
                  <option value="">Sélectionner un escadron</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </select>
              </div>

              <div className="col">
                <select
                  className="form-select"
                  name="peloton"
                  value={formData.peloton}
                  onChange={handleChange}
                  >
                  <option value="">Peloton</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>

                </select>
              </div>
            </div>

            {/* Ligne 3 */}
            <div className="row mb-3">
              <div className="col">
                <input type="text" className="form-control" name="centreConcours" placeholder="Centre de concours" value={formData.centreConcours} onChange={handleChange} />
              </div>
              <div className="col">
                <select className="form-select" name="genreConcours" value={formData.genreConcours} onChange={handleChange}>
                  <option value="">Choisir le genre de concours</option>
                  <option value="ordinaire">Ordinaire</option>
                  <option value="veuve">Veuve</option>
                  <option value="orphelin">Orphelin</option>
                  <option value="ex-militaire">Ex-militaire</option>
                  <option value="specialiste">Spécialiste</option>
                </select>
              </div>
            </div>

            {/* Si spécialiste, afficher les choix */}
            {formData.genreConcours === 'specialiste' && (
              <div className="mb-3">
                <label className="form-label">Spécialité :</label>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="Specialiste" value="informatique" onChange={handleChange} />
                  <label className="form-check-label">Informatique</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="Specialiste" value="telecomunication" onChange={handleChange} />
                  <label className="form-check-label">telecomunication</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="Specialiste" value="mecanicien" onChange={handleChange} />
                  <label className="form-check-label">mecanicien automobile</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="Specialiste" value="infrastructure" onChange={handleChange} />
                  <label className="form-check-label">infrastructure</label>
                </div>
                
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="Specialiste" value="sport" onChange={handleChange} />
                  <label className="form-check-label">Sport</label>
                </div>
                
              </div>
            )}

            {/* Ligne 4 */}
            <div className="row mb-3">
              <div className="col">
                <input type="text" className="form-control" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} />
              </div>
              <div className="col">
                <input type="text" className="form-control" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} />
              </div>
            </div>

            {/* Ligne 5 */}
            <div className="row mb-3">
              <div className="col">
                <input type="date" className="form-control" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} />
              </div>
              <div className="col">
                <input type="text" className="form-control" name="lieuNaissance" placeholder="Lieu de naissance" value={formData.lieuNaissance} onChange={handleChange} />
              </div>
            </div>

            {/* Ligne 6 */}
            <div className="row mb-3">
              <div className="col">
                <input type="text" className="form-control" name="CIN" placeholder="Numéro CIN" value={formData.CIN} onChange={handleChange} />
              </div>
              <div className="col">
                <input type="date" className="form-control" name="dateDelivrance" value={formData.dateDelivrance} onChange={handleChange} />
              </div>
            </div>

            {/* Ligne 7 */}
            <div className="row mb-3">
              <div className="col">
                <input type="text" className="form-control" name="lieuDelivrance" placeholder="Lieu de délivrance" value={formData.lieuDelivrance} onChange={handleChange} />
              </div>
              <div className="col">
                <input type="date" className="form-control" name="duplicata" placeholder="Duplicata (si applicable)" value={formData.duplicata} onChange={handleChange} />
              </div>
            </div>
            <div className="mb-3">
              {/* checkbox ici e */}
              <label className="form-label">Situation de famille:</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="situationFamiliale"
                    value="Celibataire"
                    checked={formData.situationFamiliale === "Celibataire"}
                    onChange={() => setFormData({ ...formData, situationFamiliale: "Celibataire" })}
                  />
                  <label className="form-check-label">
                    Célibataire
                  </label>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="situationFamiliale"
                    value="Marie"
                    checked={formData.situationFamiliale === "Marie"}
                    onChange={() => setFormData({ ...formData, situationFamiliale: "Marie" })}
                  />
                  <label className="form-check-label">
                    Marié(e)
                  </label>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="situationFamiliale"
                    value="Divorce"
                    checked={formData.situationFamiliale === "Divorce"}
                    onChange={() => setFormData({ ...formData, situationFamiliale: "Divorce" })}
                  />
                  <label className="form-check-label">
                    Divorcé(e)
                  </label>
                </div>
              </div>
            </div>
            {/* nimero phone */}

            <div className="d-flex gap-3 mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Téléphone 1"
                maxLength="10"
                value={formData.telephone1}
                onChange={(e) => {
                  const newValue = e.target.value.replace(/\D/g, '').slice(0, 10); // On autorise que les chiffres, 11 max
                  setFormData({
                    ...formData,telephone1: newValue
                    
                  });
                }}
              />

              <input
                type="text"
                className="form-control"
                placeholder="Téléphone 2"
                maxLength="10"
                value={formData.telephone2}
                onChange={(e) => {
                  const newValue = e.target.value.replace(/\D/g, '').slice(0, 11); // On autorise que les chiffres, 11 max
                  setFormData({
                    ...formData,telephone2: newValue
                  });
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Téléphone 3"
                maxLength="10"
                value={formData.telephone3}
                onChange={(e) => {
                  const newValue = e.target.value.replace(/\D/g, '').slice(0, 11); // On autorise que les chiffres, 11 max
                  setFormData({
                    ...formData,telephone3: newValue
                    
                  });
                }}
              />
            </div>
            <div className="col">
              <input type="text" className="form-control" name="facebook" placeholder="facebook" value={formData.facebook} onChange={handleChange} />
            </div>
            <div className="col">
              <input type="text" className="form-control" name="fady" placeholder="fady" value={formData.fady} onChange={handleChange} />
            </div>

         </div>
           {/* fin card gauche  */}
            
            
           
            </div>
            <div className="col-md-5">
  <div className="card shadow-lg border rounded p-3">
    <h5 className="card-title mb-3">Informations supplémentaires</h5>

    {/* Spécialité ou aptitude */}
    <div className="mb-3">
      <label className="form-label">Spécialité ou aptitude particulière</label>
      <input
        type="text"
        className="form-control"
        name="SpecialisteAptitude"
        value={formData.SpecialisteAptitude}
        onChange={handleChange}
      />
    </div>

    {/* Sports pratiqués (checkbox) */}
    <div className="mb-3">
  <label className="form-label">Sport(s) pratiqué(s)</label>
  <div className="d-flex flex-wrap gap-3">
    {["Football", "Basketball", "Volley-ball", "Athlétisme", "Tennis","arts martiaux", "Autre"].map((sport) => (
      <div className="form-check form-check-inline" key={sport}>
        <input
          className="form-check-input"
          type="checkbox"
          name="sports"
          value={sport}
          checked={formData.sports?.includes(sport)}
          onChange={(e) => {
            const checked = e.target.checked;
            const value = e.target.value;
            setFormData((prev) => {
              const sports = new Set(prev.sports || []);
              checked ? sports.add(value) : sports.delete(value);
              return { ...prev, sports: Array.from(sports) };
            });
          }}
        />
        <label className="form-check-label">{sport}</label>
      </div>
    ))}
  </div>
</div>


    {/* Religion (radio) */}
    <div className="mb-3">
      <label className="form-label">Religion</label>
      <div className="d-flex flex-wrap gap-3">
      {["EKAR", "FJKM", "FLM", "Islam", "Autre"].map((religion) => (
        <div className="form-check form-check-inline" key={religion}>
          <input
            className="form-check-input"
            type="radio"
            name="religion"
            value={religion}
            checked={formData.religion === religion}
            onChange={handleChange}
          />
          <label className="form-check-label">{religion}</label>
        </div>
      ))}
    </div>
    </div>
      {/* groupe saguin */}

    <div className="mb-3">
  <label className="form-label">Groupe sanguin</label>
  <div className="d-flex flex-wrap gap-3">
    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((groupeSaguin) => (
      <div className="form-check form-check-inline" key={groupeSaguin}>
        <input
          className="form-check-input"
          type="radio"
          name="groupeSaguin"
          value={groupeSaguin}
          checked={formData.groupeSaguin === groupeSaguin}
          onChange={handleChange}
        />
        <label className="form-check-label">{groupeSaguin}</label>
      </div>
    ))}
  </div>
</div>

    {/* Niveau d’étude */}
    <div className="mb-3">
      <label className="form-label">Dernière classe suivie</label>
      <input
        type="text"
        className="form-control"
        name="niveauEtude"
        value={formData.niveauEtude}
        onChange={handleChange}
      />
    </div>

 {/* Diplômes obtenus (checkbox) */}
<div className="mb-3">
  <label className="form-label">Diplômes obtenus</label>
  <div className="d-flex flex-wrap gap-3">
    {["CEPE", "BEPC", "BACC S", "BACC L", "Licence", "Master One", "Master Two", "Doctorat"].map((diplome) => (
      <div className="form-check" key={diplome}>
        <input
          className="form-check-input"
          type="checkbox"
          name="diplomes"
          value={diplome}
          checked={formData.diplomes?.includes(diplome)}
          onChange={(e) => {
            const checked = e.target.checked;
            const value = e.target.value;
            setFormData((prev) => {
              const diplomes = new Set(prev.diplomes || []);
              checked ? diplomes.add(value) : diplomes.delete(value);
              return { ...prev, diplomes: Array.from(diplomes) };
            });
          }}
        />
        <label className="form-check-label">{diplome}</label>
      </div>
    ))}
  </div>
</div>

{/* Champs de filière selon le diplôme */}
{["Licence", "Master One", "Master Two", "Doctorat"].map((niveau) =>
  formData.diplomes?.includes(niveau) && (
    <div className="mb-3" key={niveau}>
      <label className="form-label">
        Filière pour {niveau}
      </label>
      <input
        type="text"
        className="form-control"
        name={`filiere${niveau.replace(/\s/g, '')}`} // ex: filiereMasterOne
        value={formData[`filiere${niveau.replace(/\s/g, '')}`] || ""}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            [`filiere${niveau.replace(/\s/g, '')}`]: e.target.value,
          }))
        }
      />
    </div>
    
  )
)}

<div className="mb-3">
  <label className="form-label">Relation(s) gênante(s)</label>
  <textarea
    className="form-control"
    name="relationGenante"
    rows="3"
    placeholder="Toerana tsy tokony hiasana ."
    value={formData.relationGenante}
    onChange={handleChange}
  ></textarea>
</div>

 


  </div>

  

 
  
</div>
{/* section droite*/}

<div className="col-md-2">
  <div className="card shadow-lg border rounded p-3">
    <h6 className="mb-3 text-center">POINTURE EFFETS</h6>

    {/* Chemise / T-shirt */}
    <div className="mb-3">
      <label className="form-label">Chemise / T-shirt</label>
      <select
        className="form-select"
        name="pointure.tailleChemise"
        value={formData.pointure.tailleChemise}
        onChange={handleChange}
      >
        <option value="">Choisir la taille</option>
        <option value="XS">XS</option>
        <option value="S">S</option>
        <option value="M">M</option>
        <option value="L">L</option>
        <option value="XL">XL</option>
        <option value="XXL">XXL</option>
      </select>
    </div>

    {/* Tour de tête */}
    <div className="mb-3">
      <label className="form-label">Tour de tête (cm)</label>
      <input
        type="number"
        className="form-control"
        name="pointure.tourTete"
        value={formData.pointure.tourTete}
        onChange={handleChange}
        min="28"
        max="60"
        placeholder="Ex: 40"
      />
    </div>

    {/* Pantalon */}
    <div className="mb-3">
      <label className="form-label">Pointure pantalon</label>
      <select
        className="form-select"
        name="pointure.pointurePantalon"
        value={formData.pointure.pointurePantalon}
        onChange={handleChange}
      >
        <option value="">Choisir</option>
        {[28,30,34, 36, 38, 40, 42, 44, 46, 48, 50].map((taille) => (
          <option key={taille} value={taille}>{taille}</option>
        ))}
      </select>
    </div>

    {/* Chaussure */}
    <div className="mb-3">
      <label className="form-label">Pointure chaussure</label>
      <select
        className="form-select"
        name="pointure.pointureChaussure"
        value={formData.pointure.pointureChaussure}
        onChange={handleChange}
      >
        <option value="">Choisir</option>
        {[30,34,36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,47,48,49,50].map((taille) => (
          <option key={taille} value={taille}>{taille}</option>
        ))}
      </select>
    </div>
  </div>
</div>



        </div>
        <br></br>

        {/* Bouton pour afficher/masquer la section famille */}
        <div className="text-center mb-3">
          <button type="button" className="btn btn-secondary" onClick={toggleFamille}>
            {showFamille ? 'Masquer' : 'Afficher'} les Informations Famille
          </button>
        </div>

        {/* Informations de la Famille */}
        {showFamille && (
          <div className="mt-4 border p-5">
            <h4>INFORMATION SUR LES MEMBRES DE FAMILLE</h4>

            {/* Conjointe */}
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Nom et Prénom Conjointe</label>
                <input
                  type="text"
                  name="famille.conjointe.nom"
                  className="form-control"
                  value={formData.famille.conjointe.nom}
                  onChange={handleChange}
                  placeholder="Nom et Prénom de la conjointe"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Téléphone</label>
                <input
                  type="text"
                  name="famille.conjointe.phone"
                  className="form-control"
                  value={formData.famille.conjointe.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  name="famille.conjointe.adresse"
                  className="form-control"
                  value={formData.famille.conjointe.adresse}
                  onChange={handleChange}
                  placeholder="Adresse"
                />
              </div>
            </div>


            {/* Père */}
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Nom et Prénom pére</label>
                <input
                  type="text"
                  name="famille.pere.nom"
                  className="form-control"
                  value={formData.famille.pere.nom}
                  onChange={handleChange}
                  placeholder="Nom et Prénom pére"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Téléphone</label>
                <input
                  type="text"
                  name="famille.pere.phone"
                  className="form-control"
                  value={formData.famille.pere.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  name="famille.pere.adresse"
                  className="form-control"
                  value={formData.famille.pere.adresse}
                  onChange={handleChange}
                  placeholder="Adresse"
                />
              </div>
            </div>


            {/* Mère */}
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Nom et Prénom mére</label>
                <input
                  type="text"
                  name="famille.mere.nom"
                  className="form-control"
                  value={formData.famille.mere.nom}
                  onChange={handleChange}
                  placeholder="Nom et Prénom mere"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Téléphone</label>
                <input
                  type="text"
                  name="famille.mere.phone"
                  className="form-control"
                  value={formData.famille.mere.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  name="famille.mere.adresse"
                  className="form-control"
                  value={formData.famille.mere.adresse}
                  onChange={handleChange}
                  placeholder="Adresse"
                />
              </div>
            </div>
            {/* accident */}
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">A prevenir en cas d'accident</label>
                <input
                  type="text"
                  name="famille.accidents.nom"
                  className="form-control"
                  value={formData.famille.accidents.nom}
                  onChange={handleChange}
                  placeholder="Nom "
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Téléphone</label>
                <input
                  type="text"
                  name="famille.accidents.phone"
                  className="form-control"
                  value={formData.famille.accidents.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  name="famille.accidents.adresse"
                  className="form-control"
                  value={formData.famille.accidents.adresse}
                  onChange={handleChange}
                  placeholder="Adresse"
                />
              </div>
            </div>
            {formData.famille.enfants.map((enfant, index) => (
              <div key={index} className="row mb-5 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Nom enfant {index + 1}</label>
                  <input
                    type="text"
                    name="famille.enfants.nom"
                    className="form-control"
                    value={enfant.nom}
                    onChange={(e) => handleChange(e, index)}
                    placeholder="Nom"
                  />
                </div>
              
                <div className="col-md-3 text-end">
                  <button
                    type="button"
                    className="btn btn-outline-danger mt-4"
                    onClick={() => supprimerEnfant(index)}
                    title="Supprimer cet enfant"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {/* btn ajout formulaire enfant*/}
            <button type="button" className="btn btn-primary mb-3" onClick={ajouterEnfant}>
              ENFANT
            </button>

            <div className="row mb-4">
              {/* Formulaire Frère */}
              {formData.famille.frere.map((frere, index) => (
                <div key={index} className="col-md-6">
                  <label className="form-label">Nom Frère {index + 1}</label>
                  <input
                    type="text"
                    name={`famille.frere[${index}].nom`}
                    className="form-control"
                    value={frere.nom}
                    onChange={(e) => handleChange(e, index, "frere")}
                    placeholder="Nom du frère"
                  />
                  <div className="text-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger mt-2"
                      onClick={() => supprimerFrere(index)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-primary mt-4"
                onClick={ajouterFrere}
              >
                FORMULAIRE FRERE
              </button>

              {/* Formulaire Soeur */}
              {formData.famille.soeur.map((soeur, index) => (
                <div key={index} className="col-md-6">
                  <label className="form-label">Nom Soeur {index + 1}</label>
                  <input
                    type="text"
                    name={`famille.soeur[${index}].nom`}
                    className="form-control"
                    value={soeur.nom}
                    onChange={(e) => handleChange(e, index, "soeur")}
                    placeholder="Nom du soeur"
                  />
                  <div className="text-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger mt-2"
                      onClick={() => supprimerSoeur(index)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-primary mt-3"
                onClick={ajouterSoeur}
              >
                FORMULAIRE SOEUR
              </button>
            </div>


          </div>



        )}


        <br></br>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit} // Lancer la fonction handleSubmit au clic
        >
          VALIDER
        </button>

      </form>
    </div>
  );
};

export default ElevePage;
