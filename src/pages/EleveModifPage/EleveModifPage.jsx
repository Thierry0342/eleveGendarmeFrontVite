import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import './style.css';
import eleveService from '../../services/eleveService';
import specialiteService from '../../services/specialiteService'; // ✅ nouveau
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const user = JSON.parse(localStorage.getItem('user'));

const ModalModificationEleve = ({ show, onClose, eleve, onChange, onSave, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({});
  const [previewImage, setPreviewImage] = useState("");
  const [showFullImage, setShowFullImage] = useState(false);

  // ✅ État pour les spécialités dynamiques
  const [specialites, setSpecialites] = useState([
    { categorie: '', detail: '', niveauQualification: '' }
  ]);

  useEffect(() => {
    if (eleve) {
      setFormData(prev => {
        const baseData = {
          ...eleve,
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

        if (eleve.Sport) {
          const sportMapping = {
            Football: "Football",
            Basketball: "Basketball",
            Volley_ball: "Volley_ball",
            Musculation: "Musculation",
            Rugby: "Rugby",
            Athletisme: "Athletisme",
            Tennis: "Tennis",
            ArtsMartiaux: "ArtsMartiaux",
            Autre: "Autre",
          };
          const selectedSports = Object.entries(sportMapping)
            .filter(([key]) => eleve.Sport[key])
            .map(([key]) => sportMapping[key]);
          baseData.sports = selectedSports;
        }

        return baseData;
      });

      // ✅ Charger les spécialités existantes de l'élève
      if (eleve.specialites && eleve.specialites.length > 0) {
        setSpecialites(eleve.specialites.map(sp => ({
          id: sp.id, // important pour la mise à jour
          categorie: sp.categorie || '',
          detail: sp.detail || '',
          niveauQualification: sp.niveauQualification || '',
        })));
      } else {
        // Réinitialiser avec une ligne vide si pas de spécialités
        setSpecialites([{ categorie: '', detail: '', niveauQualification: '' }]);
      }

      if (eleve.image && typeof eleve.image === "string") {
        setPreviewImage(eleve.image);
      }
    }
  }, [eleve]);

  const [showFamille, setShowFamille] = useState(false);

  // ==========================================
  // ✅ GESTION DES SPÉCIALITÉS DYNAMIQUES
  // ==========================================

  const ajouterSpecialite = () => {
    setSpecialites(prev => [
      ...prev,
      { categorie: '', detail: '', niveauQualification: '' }
    ]);
  };


  const handleSpecialiteChange = (index, field, value) => {
    setSpecialites(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ==========================================
  // GESTION IMAGE
  // ==========================================

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

          if (width > height) {
            if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
          } else {
            if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const isJPEG = file.type === 'image/jpeg' || file.type === 'image/jpg';
          const mimeType = isJPEG ? 'image/jpeg' : 'image/png';
          const quality = isJPEG ? 0.7 : 1.0;

          canvas.toBlob((blob) => {
            const resizedFile = new File([blob], file.name, { type: mimeType, lastModified: Date.now() });
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

  const handlePhoneChange = (e, phoneKey) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, [phoneKey]: newValue }));
  };

  const supprimerEnfant = (index) => {
    setFormData((prevState) => {
      const enfants = [...prevState.famille.enfants];
      enfants.splice(index, 1);
      return { ...prevState, famille: { ...prevState.famille, enfants } };
    });
  };

  const ajouterEnfant = () => {
    setFormData((prev) => ({
      ...prev,
      famille: {
        ...prev.famille,
        enfants: [...prev.famille.enfants, { nom: '', prenom: '', dateNaissance: '', sexe: '' }],
      },
    }));
  };

  const ajouterFrere = () => {
    setFormData((prev) => ({
      ...prev,
      famille: { ...prev.famille, frere: [...prev.famille.frere, { nom: '' }] },
    }));
  };

  const ajouterSoeur = () => {
    setFormData((prev) => ({
      ...prev,
      famille: { ...prev.famille, soeur: [...prev.famille.soeur, { nom: '' }] },
    }));
  };

  const supprimerFrere = (index) => {
    setFormData((prevState) => {
      const frere = [...prevState.famille.frere];
      frere.splice(index, 1);
      return { ...prevState, famille: { ...prevState.famille, frere } };
    });
  };

  const supprimerSoeur = (index) => {
    setFormData((prevState) => {
      const soeur = [...prevState.famille.soeur];
      soeur.splice(index, 1);
      return { ...prevState, famille: { ...prevState.famille, soeur } };
    });
  };

  const handleChange = (e, index = null) => {
    const { name, value } = e.target;

    if (name.startsWith('famille.enfants')) {
      const field = name.split('.')[2];
      const newEnfants = [...formData.famille.enfants];
      newEnfants[index][field] = value;
      setFormData((prev) => ({ ...prev, famille: { ...prev.famille, enfants: newEnfants } }));
    } else if (name.startsWith('famille.soeur')) {
      const field = name.split('.')[2];
      const newSoeur = [...formData.famille.soeur];
      newSoeur[index][field] = value;
      setFormData((prev) => ({ ...prev, famille: { ...prev.famille, soeur: newSoeur } }));
    } else if (name.startsWith('famille.frere')) {
      const field = name.split('.')[2];
      const newFrere = [...formData.famille.frere];
      newFrere[index][field] = value;
      setFormData((prev) => ({ ...prev, famille: { ...prev.famille, frere: newFrere } }));
    } else if (name.startsWith('famille.')) {
      const path = name.split('.');
      setFormData(prevState => ({
        ...prevState,
        famille: {
          ...prevState.famille,
          [path[1]]: { ...prevState.famille[path[1]], [path[2]]: value },
        },
      }));
    } else if (name.startsWith('Pointure.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    } else if (name.startsWith('Filiere.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({ ...prev, [section]: { ...(prev[section] || {}), [field]: value } }));
    } else {
      setFormData(prevState => ({ ...prevState, [name]: value }));
    }
  };

  const toggleFamille = () => setShowFamille(!showFamille);

  // ==========================================
  // ✅ ENREGISTREMENT AVEC SPÉCIALITÉS
  // ==========================================
const supprimerSpecialite = async (index) => {
  const sp = specialites[index];

  // Si c'est la dernière ligne → vider les champs au lieu de supprimer
  if (specialites.length === 1) {
    // Si elle existe en base, supprimer en base
    if (sp.id) {
      try {
        await specialiteService.delete(sp.id);
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de supprimer la spécialité.' });
        return;
      }
    }
    // Réinitialiser la ligne (vider les champs, retirer l'id)
    setSpecialites([{ categorie: '', detail: '', niveauQualification: '' }]);
    return;
  }

  // Si plusieurs lignes → supprimer la ligne normalement
  if (sp.id) {
    try {
      await specialiteService.delete(sp.id);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de supprimer la spécialité.' });
      return;
    }
  }

  setSpecialites(prev => prev.filter((_, i) => i !== index));
};

const handleSave = async () => {
  try {
    const formDataToSend = new FormData();

    for (const key in formData) {
      if (key !== "image" && formData[key] !== undefined && formData[key] !== null) {
        if (["famille", "Diplome", "sports", "Filiere", "Pointure"].includes(key)) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      }
    }

    if (formData.image && typeof formData.image === "object") {
      formDataToSend.append("image", formData.image);
    }

    // Mise à jour de l'élève
    const response = await eleveService.put(eleve.id, formDataToSend);

    // ── SPÉCIALITÉS ──────────────────────────────────────

    // 1. Lignes existantes dont la catégorie a été vidée → supprimer en base
    const specialitesSupprimees = specialites.filter(sp => sp.id && sp.categorie.trim() === '');
    for (const sp of specialitesSupprimees) {
      await specialiteService.delete(sp.id);
    }

    // 2. Lignes non vides
    const specialitesFiltrees = specialites.filter(sp => sp.categorie.trim() !== '');

    // 2a. Existantes (ont un id) → mettre à jour
    const existantes = specialitesFiltrees.filter(sp => sp.id);
    for (const sp of existantes) {
      await specialiteService.put(sp.id, {
        categorie: sp.categorie,
        detail: sp.detail || '',
        niveauQualification: sp.niveauQualification || '',
      });
    }

    // 2b. Nouvelles (sans id) → créer en bulk
    const nouvelles = specialitesFiltrees.filter(sp => !sp.id);
    if (nouvelles.length > 0) {
      await specialiteService.bulkCreate(eleve.id, { specialites: nouvelles });
    }

    // ────────────────────────────────────────────────────

    if (response.status === 200) {
      await Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Élève mis à jour avec succès !',
        timer: 2000,
        showConfirmButton: false,
      });
      if (onUpdateSuccess) onUpdateSuccess();
    } else {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de la mise à jour.' });
    }

  } catch (error) {
    console.error("Erreur handleSave :", error);
    Swal.fire({ icon: 'error', title: 'Erreur serveur', text: 'Erreur serveur lors de la mise à jour.' });
  }
};

  return (
    <Modal show={show} onHide={onClose} size="xl" className='modal-overlay'>
      <Modal.Header closeButton>
        <Modal.Title>Modifier les informations de l'élève</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="col">
            <input type="file" className="form-control" name="image" accept="image/*" onChange={handleImageChange} />
          </div>
          <div className="col mt-3">
            <img
              src={previewImage || formData.image}
              alt="Aperçu élève"
              className="img-thumbnail"
              style={{ width: "150px", height: "150px", objectFit: "cover", cursor: "pointer" }}
              onClick={() => setShowFullImage(true)}
            />
          </div>

          <div className="row">
            {/* ======= COLONNE GAUCHE ======= */}
            <div className="col-md-5">
              <div className="card shadow-lg border rounded p-3">
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
                    <select className="form-select" name="peloton" value={formData.peloton} onChange={handleChange}>
                      <option value="">Peloton</option>
                      {[1, 2, 3].map(i => (
                        <option key={i} value={String(i)}>{i}</option>
                      ))}
                    </select>
                  </div>
                </div>

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

                {formData.genreConcours === 'specialiste' && (
                  <div className="mb-3">
                    <label className="form-label">Spécialité :</label>
                    {['Info-Telecom', 'topo', 'mecanicien', 'infrastructure', 'sport', 'plombier'].map(val => (
                      <div className="form-check" key={val}>
                        <input className="form-check-input" type="radio" name="Specialiste" checked={formData.Specialiste === val} value={val} onChange={handleChange} />
                        <label className="form-check-label">{val}</label>
                      </div>
                    ))}
                  </div>
                )}

                <div className="row mb-3">
                  <div className="col">
                    <input type="text" className="form-control" name="nom" placeholder="Nom" value={eleve.nom} onChange={onChange} style={{ textTransform: "uppercase" }} />
                  </div>
                  <div className="col">
                    <input type="text" className="form-control" name="prenom" placeholder="Prénom" value={eleve.prenom} onChange={onChange} />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col">
                    <input type="date" className="form-control" name="dateNaissance" value={eleve.dateNaissance} onChange={onChange} />
                  </div>
                  <div className="col">
                    <input type="text" className="form-control" name="lieuNaissance" placeholder="Lieu de naissance" value={eleve.lieuNaissance} onChange={onChange} />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col">
                    <input type="text" className="form-control" name="CIN" placeholder="Numéro CIN" value={eleve.CIN} onChange={onChange} />
                  </div>
                  <div className="col">
                    <input type="date" className="form-control" name="dateDelivrance" value={eleve.dateDelivrance} onChange={onChange} />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col">
                    <input type="text" className="form-control" name="lieuDelivrance" placeholder="Lieu de délivrance" value={eleve.lieuDelivrance} onChange={onChange} />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col">
                    <input type="date" className="form-control" name="duplicata" value={eleve.duplicata} onChange={onChange} />
                  </div>
                  <div className="col">
                    <input type="text" className="form-control" name="lieuDuplicata" placeholder="Lieu de duplicata" value={eleve.lieuDuplicata} onChange={onChange} />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Sexe :</label>
                  {['Masculin', 'Feminin'].map(s => (
                    <div className="form-check form-check-inline" key={s}>
                      <input className="form-check-input" type="radio" name="sexe" value={s} checked={eleve.sexe === s} onChange={onChange} />
                      <label className="form-check-label">{s === 'Feminin' ? 'Féminin' : s}</label>
                    </div>
                  ))}
                </div>

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
                        onChange={() => onChange({ target: { name: 'situationFamiliale', value: status } })}
                      />
                      <label className="form-check-label">{status}</label>
                    </div>
                  ))}
                </div>

                <div className="d-flex gap-3 mb-3">
                  {['telephone1', 'telephone2', 'telephone3'].map((phoneKey, index) => (
                    <input key={index} type="text" className="form-control" placeholder={`Téléphone ${index + 1}`} maxLength="11" value={formData[phoneKey] || ''} onChange={(e) => handlePhoneChange(e, phoneKey)} />
                  ))}
                </div>

                <div className="col mb-2">
                  <input type="text" className="form-control" name="facebook" placeholder="LOISIRS" value={eleve.facebook} onChange={onChange} />
                </div>

                <div className="col">
                  <select className="form-control" name="fady" value={eleve.fady} onChange={onChange}>
                    <option value="">FOKO</option>
                    {["ANTAIFASY","ANTAIMORO","ANTAMBAHOAKA","ANTANDROY","ANTANOSY","ANTAKARANA","BARA","BEZANOZANO","BETSILEO","BETSIMISARAKA","MAHAFALY","MERINA","MIKEA","SAKALAVA","SIHANAKA","TANALA","TSIMIHETY","VEZO"].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ======= COLONNE MILIEU ======= */}
            <div className="col-md-5">
              <div className="card shadow-lg border rounded p-3">
                <h5 className="card-title mb-3">Informations supplémentaires</h5>

                {/* ✅ ANCIEN CHAMP — affiché uniquement si pas de nouvelles spécialités */}
                {formData.SpecialisteAptitude && (
                  <div className="mb-3 p-2 border rounded bg-light">
                    <label className="form-label text-muted">
                      <small>Ancienne donnée — Spécialité ou aptitude</small>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="SpecialisteAptitude"
                      value={formData.SpecialisteAptitude || ''}
                      onChange={handleChange}
                    />
                  </div>
                )}

                {/* ✅ NOUVELLE SECTION — SPÉCIALITÉS DYNAMIQUES */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Spécialité(s) / Aptitude(s)</label>

                  {specialites.map((sp, index) => (
                    <div key={index} className="border rounded p-2 mb-2 bg-white">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted fw-semibold">Spécialité {index + 1}</small>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => supprimerSpecialite(index)}
                          
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Catégorie */}
                      <div className="mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Spécialité (ex: Informatique, BTP, Sport...)"
                          value={sp.categorie}
                          onChange={e => handleSpecialiteChange(index, 'categorie', e.target.value)}
                        />
                      </div>

                      {/* Détail */}
                      <div className="mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Détail (ex: Génie logiciel, Électricien, Basketball...)"
                          value={sp.detail}
                          onChange={e => handleSpecialiteChange(index, 'detail', e.target.value)}
                        />
                      </div>

                      {/* Niveau qualification */}
                      <div>
                        <select
                          className="form-select form-select-sm"
                          value={sp.niveauQualification}
                          onChange={e => handleSpecialiteChange(index, 'niveauQualification', e.target.value)}
                        >
                          <option value="">-- Niveau de qualification --</option>
                          <option value="Licencié">Licencié (diplôme / certificat / licence sportive)</option>
                          <option value="En cours de licence">En cours de licence</option>
                          <option value="Autodidacte">Autodidacte (sans titre officiel)</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {/* Bouton ajouter */}
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm mt-1 w-100"
                    onClick={ajouterSpecialite}
                  >
                    + Ajouter une spécialité / aptitude
                  </button>
                </div>

                {/* Sports */}
                <div className="mb-3">
                  <label className="form-label">Sport(s) pratiqué(s)</label>
                  <div className="d-flex flex-wrap gap-3">
                    {["Football", "Basketball", "Volley_ball", "Musculation", "Rugby", "Athletisme", "Tennis", "ArtsMartiaux", "Autre"].map((sport) => (
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

                <div className="mb-3">
                  <label className="form-label">Religion</label>
                  <div className="d-flex flex-wrap gap-3">
                    {["EKAR", "FJKM", "FLM", "ISLAM", "Autre"].map((religion) => (
                      <div className="form-check form-check-inline" key={religion}>
                        <input className="form-check-input" type="radio" name="religion" value={religion} checked={formData.religion === religion} onChange={handleChange} />
                        <label className="form-check-label">{religion}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Groupe sanguin</label>
                  <div className="d-flex flex-wrap gap-3">
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                      <div className="form-check form-check-inline" key={g}>
                        <input className="form-check-input" type="radio" name="groupeSaguin" value={g} checked={formData.groupeSaguin === g} onChange={handleChange} />
                        <label className="form-check-label">{g}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Dernière classe suivie</label>
                  <select className="form-control" name="niveau" value={formData.niveau} onChange={handleChange}>
                    <option value="">-- Sélectionner le niveau --</option>
                    {["BACC", "BACC +1", "BACC +2", "BACC +3", "BACC +4", "BACC +5", "BACC +6", "BACC +7", "BACC +8"].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="col"><p>En</p></div>
                <div className="col mb-3">
                  <input type="text" className="form-control" name="niveaufiliere" value={eleve.niveaufiliere} onChange={onChange} />
                </div>

                <div className="mb-3">
                  <label className="form-label">Diplômes obtenus</label>
                  <div className="d-flex flex-wrap gap-3">
                    {[
                      { label: "CEPE", key: "CEPE" }, { label: "BEPC", key: "BEPC" },
                      { label: "BACC S", key: "BACC_S" }, { label: "BACC L", key: "BACC_L" },
                      { label: "BACC_TECHNIQUE", key: "BACC_TECHNIQUE" }, { label: "Licence", key: "Licence" },
                      { label: "Master One", key: "MasterOne" }, { label: "Master Two", key: "MasterTwo" },
                      { label: "Doctorat", key: "Doctorat" },
                    ].map(({ label, key }) => (
                      <div className="form-check" key={key}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={formData.Diplome?.[key] || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData((prev) => ({ ...prev, Diplome: { ...(prev.Diplome || {}), [key]: checked } }));
                          }}
                        />
                        <label className="form-check-label">{label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {["Licence", "MasterOne", "MasterTwo", "Doctorat"].map((key) =>
                  formData.Diplome?.[key] && (
                    <div className="mb-3" key={key}>
                      <label className="form-label">Filière pour {key.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input
                        type="text"
                        className="form-control"
                        name={`Filiere.filiere${key}`}
                        value={formData.Filiere?.[`filiere${key}`] || ""}
                        onChange={handleChange}
                      />
                    </div>
                  )
                )}

                <div className="mb-3">
                  <label className="form-label">Relation(s) gênante(s)</label>
                  <textarea className="form-control" name="relationGenante" rows="3" placeholder="Toerana tsy tokony hiasana." value={formData.relationGenante} onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            {/* ======= COLONNE DROITE — POINTURE ======= */}
            <div className="col-md-2">
              <div className="card shadow-lg border rounded p-3">
                <h6 className="mb-3 text-center">POINTURE EFFETS</h6>

                <div className="mb-3">
                  <label className="form-label">Chemise / T-shirt</label>
                  <select className="form-select" name="Pointure.tailleChemise" value={formData.Pointure?.tailleChemise || ""} onChange={handleChange}>
                    <option value="">Choisir la taille</option>
                    {["XS", "S", "M", "L", "XL", "XXL"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Tour de tête (cm)</label>
                  <input type="number" className="form-control" name="Pointure.tourTete" value={formData.Pointure?.tourTete || ""} onChange={handleChange} min="28" max="60" placeholder="Ex: 40" />
                </div>

                <div className="mb-3">
                  <label className="form-label">Pointure pantalon</label>
                  <select className="form-select" name="Pointure.pointurePantalon" value={formData.Pointure?.pointurePantalon || ""} onChange={handleChange}>
                    <option value="">Choisir</option>
                    {[28, 30, 34, 36, 38, 40, 42, 44, 46, 48, 50].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Pointure chaussure</label>
                  <select className="form-select" name="Pointure.pointureChaussure" value={formData.Pointure?.pointureChaussure || ""} onChange={handleChange}>
                    <option value="">Choisir</option>
                    {[30, 34, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ======= FAMILLE ======= */}
            <div className="text-center mb-3 mt-3">
              <button type="button" className="btn btn-secondary" onClick={toggleFamille}>
                {showFamille ? 'Masquer' : 'Afficher'} les Informations Famille
              </button>
            </div>

            {showFamille && (
              <div className="mt-4 border p-5">
                <h4>INFORMATION SUR LES MEMBRES DE FAMILLE</h4>

                {[
                  { label: 'Nom et Prénom Conjointe', key: 'conjointe' },
                  { label: 'Nom et Prénom Père', key: 'pere' },
                  { label: 'Nom et Prénom Mère', key: 'mere' },
                  { label: 'À prévenir en cas d\'accident', key: 'accident' },
                ].map(({ label, key }) => (
                  <div className="row mb-3" key={key}>
                    <div className="col-md-4">
                      <label className="form-label">{label}</label>
                      <input type="text" name={`famille.${key}.nom`} className="form-control" value={formData.famille?.[key]?.nom || ''} onChange={handleChange} placeholder="Nom" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Téléphone</label>
                      <input type="text" name={`famille.${key}.phone`} className="form-control" value={formData.famille?.[key]?.phone || ''} onChange={handleChange} placeholder="Téléphone" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Adresse</label>
                      <input type="text" name={`famille.${key}.adresse`} className="form-control" value={formData.famille?.[key]?.adresse || ''} onChange={handleChange} placeholder="Adresse" />
                    </div>
                  </div>
                ))}

                {formData.famille?.enfants?.map((enfant, index) => (
                  <div key={index} className="row mb-5 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label">Nom enfant {index + 1}</label>
                      <input type="text" name="famille.enfants.nom" className="form-control" value={enfant.nom} onChange={(e) => handleChange(e, index)} placeholder="Nom" />
                    </div>
                    <div className="col-md-3 text-end">
                      <button type="button" className="btn btn-outline-danger mt-4" onClick={() => supprimerEnfant(index)}>🗑️</button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-primary mb-3" onClick={ajouterEnfant}>ENFANT</button>

                <div className="row mb-4">
                  {formData.famille?.frere?.map((frere, index) => (
                    <div key={index} className="col-md-6">
                      <label className="form-label">Nom Frère {index + 1}</label>
                      <input type="text" name={`famille.frere[${index}].nom`} className="form-control" value={frere.nom} onChange={(e) => handleChange(e, index)} placeholder="Nom du frère" />
                      <div className="text-end">
                        <button type="button" className="btn btn-outline-danger mt-2" onClick={() => supprimerFrere(index)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-primary mt-4" onClick={ajouterFrere}>FORMULAIRE FRERE</button>

                  {formData.famille?.soeur?.map((soeur, index) => (
                    <div key={index} className="col-md-6">
                      <label className="form-label">Nom Soeur {index + 1}</label>
                      <input type="text" name={`famille.soeur[${index}].nom`} className="form-control" value={soeur.nom} onChange={(e) => handleChange(e, index)} placeholder="Nom de la soeur" />
                      <div className="text-end">
                        <button type="button" className="btn btn-outline-danger mt-2" onClick={() => supprimerSoeur(index)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-primary mt-3" onClick={ajouterSoeur}>FORMULAIRE SOEUR</button>
                </div>
              </div>
            )}
          </div>

          {showFullImage && (
            <div
              style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
              onClick={() => setShowFullImage(false)}
            >
              <img src={previewImage || formData.image} alt="Aperçu en grand" style={{ maxWidth: "90%", maxHeight: "90%", border: "5px solid white", borderRadius: "10px" }} />
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        {user?.type === 'admin' && (
          <Button variant="primary" onClick={handleSave}>Modifier</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalModificationEleve;