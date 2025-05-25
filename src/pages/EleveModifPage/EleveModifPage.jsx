
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import './style.css';
import eleveService from '../../services/eleveService';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const user = JSON.parse(localStorage.getItem('user'));

const ModalModificationEleve = ({ show, onClose, eleve, onChange, onSave }) => {
  //initie donne
  const [formData, setFormData] = useState({})
  const [previewImage, setPreviewImage] = useState(""); // <== Aperçu de l'image
  //affiche image 
  const [showFullImage, setShowFullImage] = useState(false);

 
  //initialise les donne 
 useEffect(() => {
  if (eleve) {
    // Initialisation de base
    setFormData(prev => {
      const baseData = { ...eleve , 
        famille: {
          conjointe: eleve.Conjointe ?? {},
          mere: eleve.Mere ?? {},
          pere: eleve.Pere ?? {},
          accident: eleve.Accident ?? {},
          enfants: eleve.Enfants ?? [],       
          frere: eleve.Freres ?? [],          
          soeur: eleve.Soeurs ?? [],         
        },
      
      
      };
//console.log("dsdsdsdsdsdsdsdsdd",eleve.Conjointe )
      // Mapping des sports en true
      if (eleve.Sport) {
        const sportMapping = {
          Football: "Football",
          Basketball: "Basketball",
          Volley_ball: "Volley_ball",
          Athletisme: "Athletisme",
          Tennis: "Tennis",
          ArtsMartiaux: "ArtsMartiaux",
          Autre: "Autre",
        };

        
        const selectedSports = Object.entries(sportMapping)
    .filter(([key]) => eleve.Sport[key])
    .map(([key]) => sportMapping[key]); // on ajoute le label

          baseData.sports = selectedSports;
      }

    // console.log("basedata ve ee",baseData);
   

      return baseData;
    });

    // Image de prévisualisation
    if (eleve.image && typeof eleve.image === "string") {
      setPreviewImage(eleve.image);
    }

    console.log(eleve);
  }
}, [eleve]);

 
 // console.log(eleve.peloton)
 const [showFamille, setShowFamille] = useState(false); // Etat pour afficher/masquer la section famille
 const [imagePreview, setImagePreview] = useState(''); // Pour afficher l'image sélectionnée
 
  
  // Fonction pour gérer l'importation de l'image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
  
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 400;
          const maxHeight = 400;
          let width = img.width;
          let height = img.height;
  
          // Redimensionnement proportionnel
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
  
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
  
          // Choisir un type et une qualité selon l'extension
          const isJPEG = file.type === 'image/jpeg' || file.type === 'image/jpg';
          const mimeType = isJPEG ? 'image/jpeg' : 'image/png';
          const quality = isJPEG ? 0.7 : 1.0; // compression pour JPEG
  
          canvas.toBlob((blob) => {
            const resizedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });
  
            setFormData({ ...formData, image: resizedFile });
            setPreviewImage(URL.createObjectURL(resizedFile));
          }, mimeType, quality);
        };
        img.src = event.target.result;
      };
  
      reader.readAsDataURL(file);
    } else {
      alert('Veuillez sélectionner un fichier image valide (png, jpg, jpeg, webp)');
    }
  };
  
  
  // Fonction pour mettre à jour les valeurs de téléphone
  const handlePhoneChange = (e, phoneKey) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({
      ...prev,
      [phoneKey]: newValue
    }));
  };
  //ajout et suprresion methode
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
    else if (name.startsWith('Pointure.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        }
      }));
    }
    else if (name.startsWith('Filiere.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section] || {}),
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

  
   // Fonction pour basculer l'affichage de la section famille
   const toggleFamille = () => {
    setShowFamille(!showFamille);
  };
  //envoie donne 
  

const handleSave = async () => {
  try {
    const formDataToSend = new FormData();

    // Ne pas ajouter l'image dans cette boucle (elle sera ajoutée à part)
    for (const key in formData) {
      if (key !== "image" && formData[key] !== undefined && formData[key] !== null) {
        // Pour les objets complexes
        if (["famille", "Diplome", "sports","Filiere","Pointure"].includes(key)) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      }
    }

    // Ajouter l'image si présente
    if (formData.image && typeof formData.image === "object") {
      formDataToSend.append("image", formData.image);
    }

    // Appel du service avec les bonnes données
    //console.log("FormData avant envoi : ", formDataToSend);
    const response = await eleveService.put(eleve.id, formDataToSend);
    onClose();
    
    
    if (response.status === 200) {
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Élève mis à jour avec succès !',
        timer: 2000,
        showConfirmButton: false,
      });
  
      toast.success('Élève mis à jour avec succès !');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Erreur lors de la mise à jour de l'élève.",
      });
  
      toast.error("Erreur lors de la mise à jour de l'élève.");
    }
  } catch (error) {
    console.error("Erreur serveur :", error);
  
    Swal.fire({
      icon: 'error',
      title: 'Erreur Serveur',
      text: 'Une erreur s’est produite sur le serveur.',
    });
  
    toast.error('Erreur serveur lors de la mise à jour.');
  }
};

  
  
  


  return (
    <Modal show={show} onHide={onClose} size="xl" dialogClassName="large-modal" >
      <Modal.Header closeButton>
        <Modal.Title>Modifier les informations de l'élève</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
        <div className="col">
  {/* Champ pour télécharger une nouvelle image */}
  <input
    type="file"
    className="form-control"
    name="image"
    accept="image/*"
    onChange={handleImageChange}
  />
</div>

<div className="col mt-3">
  {/* Aperçu de l'image actuelle ou modifiée */}
  <img
  src={previewImage || formData.image}
  alt="Aperçu élève"
  className="img-thumbnail"
  style={{ width: "150px", height: "150px", objectFit: "cover", cursor: "pointer" }}
  onClick={() => setShowFullImage(true)}
/>

</div>

          <div className="row">
            {/* Colonne gauche : formulaire principal */}
            <div className="col-md-5">
              <div className="card shadow-lg border rounded p-3">
                {/* Ligne 1 */}
                <div className="row mb-3">
                  <div className="col">
                    <input type="text" className="form-control" name="numCandidature" placeholder="Numéro de candidature" value={eleve.numCandidature} onChange={onChange} />
                  </div>
                  <div className="col">
                    <input type="text" className="form-control" name="numeroIncorporation" placeholder="Numéro d'incorporation" value={eleve.numeroIncorporation} onChange={onChange} />
                  </div>
                  <div className="col">
                <input type="text" className="form-control" name="matricule" placeholder="Matricule" value={eleve.matricule} onChange={onChange} />
              </div>
                </div>

                {/* Ligne 2 */}
                <div className="row mb-3">
                  <div className="col">
                    <select className="form-select" name="escadron" value={formData.escadron} onChange={handleChange}>
                      <option value="">Sélectionner un escadron</option>
                      {Array.from({ length: 10 }, (_, index) => index + 1).map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
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
                   {[1, 2, 3].map(i => (
                  <option key={i} value={String(i)}>{i}</option>
                   ))}
                   </select>

              </div>
                </div>

                {/* Ligne 3 */}
                <div className="row mb-3">
                  <div className="col">
                    <input type="text" className="form-control" name="centreConcours" placeholder="Centre de concours" value={eleve.centreConcours} onChange={onChange} />
                  </div>
                  <div className="col">
                    <select className="form-select" name="genreConcours" value={eleve.genreConcours} onChange={onChange}>
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
                  <input className="form-check-input" type="radio" name="Specialiste" checked={formData.Specialiste === 'informatique'} value="informatique" onChange={handleChange} />
                  <label className="form-check-label">Informatique</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="Specialiste" checked={formData.Specialiste === 'telecomunication'}  value="telecomunication" onChange={handleChange} />
                  <label className="form-check-label">telecomunication</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="Specialiste" value="mecanicien" checked={formData.Specialiste === 'mecanicien'}  onChange={handleChange} />
                  <label className="form-check-label">mecanicien automobile</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="Specialiste" value="infrastructure" checked={formData.Specialiste === 'infrastructure'}  onChange={handleChange} />
                  <label className="form-check-label">infrastructure</label>
                </div>
                
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="Specialiste" value="sport" checked={formData.Specialiste === 'sport'} onChange={handleChange} />
                  <label className="form-check-label">Sport</label>
                </div>
              
              </div>
            )}


                {/* Ligne 4 */}
                <div className="row mb-3">
                  <div className="col">
                    <input type="text" className="form-control" name="nom" placeholder="Nom" value={eleve.nom} onChange={onChange}  style={{ textTransform: "uppercase" }}/>
                  </div>
                  <div className="col">
                    <input type="text" className="form-control" name="prenom" placeholder="Prénom" value={eleve.prenom} onChange={onChange}  />
                  </div>
                </div>

                {/* Ligne 5 */}
                <div className="row mb-3">
                  <div className="col">
                    <input type="date" className="form-control" name="dateNaissance" value={eleve.dateNaissance} onChange={onChange} />
                  </div>
                  <div className="col">
                    <input type="text" className="form-control" name="lieuNaissance" placeholder="Lieu de naissance" value={eleve.lieuNaissance} onChange={onChange} />
                  </div>
                </div>

                {/* Ligne 6 */}
                <div className="row mb-3">
                  <div className="col">
                    <input type="text" className="form-control" name="CIN" placeholder="Numéro CIN" value={eleve.CIN} onChange={onChange} />
                  </div>
                  <div className="col">
                    <input type="date" className="form-control" name="dateDelivrance" value={eleve.dateDelivrance} onChange={onChange} />
                  </div>
                </div>

                {/* Ligne 7 */}
                <div className="row mb-3">
                  <div className="col">
                    <input type="text" className="form-control" name="lieuDelivrance" placeholder="Lieu de délivrance" value={eleve.lieuDelivrance} onChange={onChange} />
                  </div>
                  <div className="col">
                    <input type="text" className="form-control" name="duplicata" placeholder="Duplicata (si applicable)" value={eleve.duplicata} onChange={onChange} />
                  </div>
                </div>
                {/* Sexe */}
              <div className="mb-3">
                <label className="form-label">Sexe :</label>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="sexe"
                    value="Masculin"
                    checked={eleve.sexe === "Masculin"}
                    onChange={onChange}
                  />
                  <label className="form-check-label">Masculin</label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="sexe"
                    value="Feminin"
                    checked={eleve.sexe === "Feminin"}
                    onChange={onChange}
                  />
                  <label className="form-check-label">Féminin</label>
                </div>
              </div>


                {/* Situation de famille */}
                <div className="mb-3">
                  <label className="form-label">Situation de famille:</label>
                  {['Celibataire', 'Marie', 'Divorce'].map(status => (
                    <div className="form-check" key={status}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="situationFamiliale"
                        value={status}
                        checked={eleve.situationFamiliale === status}
                        onChange={() => onChange({
                          target: {
                            name: 'situationFamiliale',
                            value: status
                          }
                        })}
                      />
                      <label className="form-check-label">{status}</label>
                    </div>
                  ))}
                </div>

                {/* Téléphone */}
                <div className="d-flex gap-3 mb-3">
                  {['telephone1', 'telephone2', 'telephone3'].map((phoneKey, index) => (
                   <input
                   key={index}
                   type="text"
                   className="form-control"
                   placeholder={`Téléphone ${index + 1}`}
                   maxLength="11"
                   value={formData[phoneKey] || ''}
                   onChange={(e) => handlePhoneChange(e, phoneKey)}
                 />
                 
                  ))}
                </div>

                <div className="col">
                  <input type="text" className="form-control" name="facebook" placeholder="facebook" value={eleve.facebook} onChange={onChange} />
                </div>
                <div className="col">
              <select
                className="form-control"
                name="fady"
                value={eleve.fady}
                onChange={onChange}
              >
                <option value="">Foko</option>
                <option value="Antaifasy">Antaifasy</option>
                <option value="Antaimoro">Antaimoro</option>
                <option value="Antambahoaka">Antambahoaka</option>
                <option value="Antandroy">Antandroy</option>
                <option value="Antanosy">Antanosy</option>
                <option value="Antikarana">Antakarana</option>
                <option value="Bara">Bara</option>
                <option value="Bezanozano">Bezanozano</option>
                <option value="Betsileo">Betsileo</option>
                <option value="Betsimisaraka">Betsimisaraka</option>
                <option value="Mahafaly">Mahafaly</option>
                <option value="Merina">Merina</option>
                <option value="Mikea">Mikea</option>
                <option value="Sakalava">Sakalava</option>
                <option value="Sihanaka">Sihanaka</option>
                <option value="Tanala">Tanala</option>
                <option value="Tsimihety">Tsimihety</option>
                <option value="Vezo">Vezo</option>
              </select>
            </div>
              </div>
            </div>
            {/* card milie commence ici*/ }
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
          {["Football", "Basketball", "Volley_ball", "Athletisme", "Tennis","ArtsMartiaux", "Autre"].map((sport) => (
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
    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((groupeSanguin) => (
      <div className="form-check form-check-inline" key={groupeSanguin}>
        <input
          className="form-check-input"
          type="radio"
          name="groupeSaguin"
          value={groupeSanguin}
          checked={formData.groupeSaguin === groupeSanguin}
          onChange={handleChange}
        />
        <label className="form-check-label">{groupeSanguin}</label>
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
        name="niveau"
        value={formData.niveau}
        onChange={handleChange}
      />
    </div>

 {/* Diplômes obtenus (checkbox) */}
 <div className="mb-3">
  <label className="form-label">Diplômes obtenus</label>
  <div className="d-flex flex-wrap gap-3">
    {[
      { label: "CEPE", key: "CEPE" },
      { label: "BEPC", key: "BEPC" },
      { label: "BACC S", key: "BACC_S" },
      { label: "BACC L", key: "BACC_L" },
      { label: "Licence", key: "Licence" },
      { label: "Master One", key: "MasterOne" },
      { label: "Master Two", key: "MasterTwo" },
      { label: "Doctorat", key: "Doctorat" },
    ].map(({ label, key }) => (
      <div className="form-check" key={key}>
        <input
          className="form-check-input"
          type="checkbox"
          name={`Diplome.${key}`}
          checked={formData.Diplome?.[key] || false}
          onChange={(e) => {
            const checked = e.target.checked;
            setFormData((prev) => ({
              ...prev,
              Diplome: {
                ...(prev.Diplome || {}),
                [key]: checked,
              },
            }));
          }}
        />
        <label className="form-check-label">{label}</label>
      </div>
    ))}
  </div>
</div>


{/* Champs de filière selon le diplôme */}
{["Licence", "MasterOne", "MasterTwo", "Doctorat"].map((key) =>
  formData.Diplome?.[key] && (
    <div className="mb-3" key={key}>
      <label className="form-label">Filière pour {key.replace(/([A-Z])/g, ' $1').trim()}</label>
      <input
          type="text"
          className="form-control"
          name={`Filiere.filiere${key}`} // ⚠ Ajoute "Filiere." ici
          value={formData.Filiere?.[`filiere${key}`] || ""}
          onChange={handleChange}
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
        name="Pointure.tailleChemise"
        value={formData.Pointure?.tailleChemise || ""}
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
        name="Pointure.tourTete"
        value={formData.Pointure?.tourTete || ""}
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
        name="Pointure.pointurePantalon"
        value={formData.Pointure?.pointurePantalon || ""}
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
        name="Pointure.pointureChaussure"
        value={formData.Pointure?.pointureChaussure || ""}
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




            {/*car milieu termine ici  */}
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
                  name="famille.accident.nom"
                  className="form-control"
                  value={formData.famille.accident.nom}
                  onChange={handleChange}
                  placeholder="Nom "
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Téléphone</label>
                <input
                  type="text"
                  name="famille.accident.phone"
                  className="form-control"
                  value={formData.famille.accident.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  name="famille.accident.adresse"
                  className="form-control"
                  value={formData.famille.accident.adresse}
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
                    onChange={(e) => handleChange(e, index, "enfants")}
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

            

            {/*fin famille */}
             </div>
          {/*fin car */}
          {showFullImage && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "rgba(0,0,0,0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                  }}
                  onClick={() => setShowFullImage(false)} // Ferme quand on clique en dehors
                >
                  <img
                    src={previewImage || formData.image}
                    alt="Aperçu en grand"
                    style={{
                      maxWidth: "90%",
                      maxHeight: "90%",
                      border: "5px solid white",
                      borderRadius: "10px",
                    }}
                  />
</div>
)}

          
          

        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        {user?.type === 'admin' && (
      <Button variant="primary" onClick={handleSave}>
         Modifier
        </Button>
        )}
      </Modal.Footer>
    </Modal>
    
  );
  
  
};


export default ModalModificationEleve;
