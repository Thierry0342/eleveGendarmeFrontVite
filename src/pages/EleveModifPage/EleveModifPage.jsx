
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import './style.css';
import eleveService from '../../services/eleveService';

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
      const baseData = { ...eleve };

      // Mapping des sports en true
      if (eleve.Sport) {
        const sportMapping = {
          Football: "Football",
          Basketball: "Basketball",
          Volley_ball: "Volley-ball",
          Athletisme: "Athlétisme",
          Tennis: "Tennis",
          ArtsMartiaux: "arts martiaux",
          Autre: "Autre",
        };

        const selectedSports = Object.entries(sportMapping)
          .filter(([key]) => eleve.Sport[key])
          .map(([_, label]) => label);

         
        baseData.sports = selectedSports;
      }
      console.log("basedata ve ee",baseData);
   

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
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
  
      // Pour l'aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  
  // Fonction pour mettre à jour les valeurs de téléphone
  const handlePhoneChange = (e, phoneKey) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 11); // Autorise seulement les chiffres, max 11 caractères
    onChange({
      ...eleve,
      eleveTelephone: {
        ...eleve.eleveTelephone,
        [phoneKey]: newValue
      }
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
        if (["famille", "diplomes", "sports","filiere"].includes(key)) {
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
    console.log("FormData avant envoi : ", formDataToSend);
    const response = await eleveService.put(eleve.id, formDataToSend);
    onClose();
    
    
    if (response.status === 200) {
      console.log("Élève mis à jour avec succès :", response.data);
      // Tu peux fermer le modal ou rafraîchir la liste
    } else {
      console.error("Erreur lors de la mise à jour de l'élève");
    }
  } catch (error) {
    console.error("Erreur serveur :", error);
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
                    <input type="text" className="form-control" name="nom" placeholder="Nom" value={eleve.nom} onChange={onChange} />
                  </div>
                  <div className="col">
                    <input type="text" className="form-control" name="prenom" placeholder="Prénom" value={eleve.prenom} onChange={onChange} />
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
                      value={eleve[phoneKey]}
                      onChange={(e) => handlePhoneChange(e, phoneKey)}
                    />
                  ))}
                </div>

                <div className="col">
                  <input type="text" className="form-control" name="facebook" placeholder="facebook" value={eleve.facebook} onChange={onChange} />
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
        name={`filiere${key}`} // Ex : filiereMasterOne
        value={formData.Filiere[`filiere${key}`] || ""}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            [`Filiere.filiere${key}`]: e.target.value,
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
                  name="Conjointe.nom"
                  className="form-control"
                  value={formData.Conjointe.nom}
                  onChange={handleChange}
                  placeholder="Nom et Prénom de la conjointe"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Téléphone</label>
                <input
                  type="text"
                  name="Conjointe.phone"
                  className="form-control"
                  value={formData.Conjointe.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  name="Conjointe.adresse"
                  className="form-control"
                  value={formData.Conjointe.adresse}
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
                  name="Pere.nom"
                  className="form-control"
                  value={formData.Pere.nom}
                  onChange={handleChange}
                  placeholder="Nom et Prénom pére"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Téléphone</label>
                <input
                  type="text"
                  name="Pere.phone"
                  className="form-control"
                  value={formData.Pere.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  name="Pere.adresse"
                  className="form-control"
                  value={formData.Pere.adresse}
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
                  name="Mere.nom"
                  className="form-control"
                  value={formData.Mere.nom}
                  onChange={handleChange}
                  placeholder="Nom et Prénom mere"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Téléphone</label>
                <input
                  type="text"
                  name="Mere.phone"
                  className="form-control"
                  value={formData.Mere.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  name="Mere.adresse"
                  className="form-control"
                  value={formData.Mere.adresse}
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
                  name="Accident.nom"
                  className="form-control"
                  value={formData.Accident.nom}
                  onChange={handleChange}
                  placeholder="Nom "
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Téléphone</label>
                <input
                  type="text"
                  name="Accident.phone"
                  className="form-control"
                  value={formData.Accident.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  name="Accident.adresse"
                  className="form-control"
                  value={formData.Accident.adresse}
                  onChange={handleChange}
                  placeholder="Adresse"
                />
              </div>
            </div>
            {formData.Enfants.map((enfant, index) => (
              <div key={index} className="row mb-5 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Nom enfant {index + 1}</label>
                  <input
                    type="text"
                    name="Enfants.nom"
                    className="form-control"
                    value={enfant.nom}
                    onChange={(e) => handleChange(e, index)}
                    placeholder="Nom"
                  />
                </div>
              
               
              </div>
            ))}

           
            <div className="row mb-4">
              {/* Formulaire Frère */}
              {formData.Freres.map((frere, index) => (
                <div key={index} className="col-md-6">
                  <label className="form-label">Nom Frère {index + 1}</label>
                  <input
                    type="text"
                    name={`Freres[${index}].nom`}
                    className="form-control"
                    value={frere.nom}
                    onChange={(e) => handleChange(e, index, "frere")}
                    placeholder="Nom du frère"
                  />
                  
                </div>
              ))}
              

              {/* Formulaire Soeur */}
              {formData.Soeurs.map((soeur, index) => (
                <div key={index} className="col-md-6">
                  <label className="form-label">Nom Soeur {index + 1}</label>
                  <input
                    type="text"
                    name={`Soeurs[${index}].nom`}
                    className="form-control"
                    value={soeur.nom}
                    onChange={(e) => handleChange(e, index, "soeur")}
                    placeholder="Nom du soeur"
                  />
                  
                </div>
              ))}
              
            </div>


          </div>



        )}

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
        <Button variant="primary" onClick={handleSave}>Modifier</Button>
      </Modal.Footer>
    </Modal>
    
  );
  
  
};


export default ModalModificationEleve;
