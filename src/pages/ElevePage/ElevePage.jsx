import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import eleveService from '../../services/eleveService';
import specialiteService from '../../services/specialiteService'; // ✅ nouveau
import { useNavigate } from 'react-router-dom';
import courService from '../../services/courService';
import "./ElevePage.css"
import Swal from 'sweetalert2';

const ElevePage = () => {
  const [formData, setFormData] = useState({
    numCandidature: '',
    numeroIncorporation: '',
    escadron: '',
    peloton: '',
    cour: '',
    matricule: '',
    centreConcours: '',
    Specialiste: '',
    genreConcours: '',
    SpecialisteAptitude: '',
    nom: '',
    diplomes: '',
    filiereDoctorat: '',
    filiereMasterOne: '',
    filiereLicence: '',
    filiereMasterTwo: '',
    niveauEtude: '',
    prenom: '',
    dateNaissance: '',
    lieuNaissance: '',
    CIN: '',
    dateDelivrance: '',
    lieuDelivrance: '',
    lieuDuplicata: '',
    duplicata: '',
    sports: '',
    loisir: '',
    religion: '',
    niveau: '',
    niveaufiliere: '',
    groupeSaguin: '',
    fady: '',
    sexe: '',
    relationGenante: "",
    pointure: {
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
      enfants: [{ nom: '', prenom: '', dateNaissance: '', sexe: '' }],
      soeur: [{ nom: '' }],
      frere: [{ nom: '' }],
      accidents: { nom: '', adresse: '', phone: '' },
    },
    image: "",
    situationFamiliale: '',
    telephone1: '',
    telephone2: '',
    telephone3: '',
    facebook: "",
  });

  const navigate = useNavigate();
  const [showFamille, setShowFamille] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // ✅ État spécialités dynamiques
  const [specialites, setSpecialites] = useState([
    { categorie: '', detail: '', niveauQualification: '' }
  ]);

  // ==========================================
  // COURS
  // ==========================================
  const [filter, setFilter] = useState({ cour: '' });
  const [coursList, setCoursList] = useState([]);

  useEffect(() => {
    const fetchCours = async () => {
      try {
        const res = await courService.getAll();
        const coursData = res.data;
        coursData.sort((a, b) => b.cour - a.cour);
        setCoursList(coursData);
        if (coursData.length > 0) {
          setFormData(prev => ({ ...prev, cour: coursData[0].cour }));
        }
      } catch (err) {
        console.error("Erreur lors du chargement des cours", err);
      }
    };
    fetchCours();
  }, []);

  // ==========================================
  // FAMILLE
  // ==========================================
  const ajouterEnfant = () => {
    setFormData((prev) => ({
      ...prev,
      famille: {
        ...prev.famille,
        enfants: [...prev.famille.enfants, { nom: '', prenom: '', dateNaissance: '', sexe: '' }],
      },
    }));
  };

  const supprimerEnfant = (index) => {
    setFormData((prevState) => {
      const enfants = [...prevState.famille.enfants];
      enfants.splice(index, 1);
      return { ...prevState, famille: { ...prevState.famille, enfants } };
    });
  };

  const ajouterFrere = () => {
    setFormData((prev) => ({
      ...prev,
      famille: { ...prev.famille, frere: [...prev.famille.frere, { nom: '' }] },
    }));
  };

  const supprimerFrere = (index) => {
    setFormData((prevState) => {
      const frere = [...prevState.famille.frere];
      frere.splice(index, 1);
      return { ...prevState, famille: { ...prevState.famille, frere } };
    });
  };

  const ajouterSoeur = () => {
    setFormData((prev) => ({
      ...prev,
      famille: { ...prev.famille, soeur: [...prev.famille.soeur, { nom: '' }] },
    }));
  };

  const supprimerSoeur = (index) => {
    setFormData((prevState) => {
      const soeur = [...prevState.famille.soeur];
      soeur.splice(index, 1);
      return { ...prevState, famille: { ...prevState.famille, soeur } };
    });
  };

  // ==========================================
  // ✅ SPÉCIALITÉS DYNAMIQUES
  // ==========================================
  const ajouterSpecialite = () => {
    setSpecialites(prev => [
      ...prev,
      { categorie: '', detail: '', niveauQualification: '' }
    ]);
  };

  const supprimerSpecialite = (index) => {
    if (specialites.length === 1) {
      setSpecialites([{ categorie: '', detail: '', niveauQualification: '' }]);
      return;
    }
    setSpecialites(prev => prev.filter((_, i) => i !== index));
  };

  const handleSpecialiteChange = (index, field, value) => {
    setSpecialites(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ==========================================
  // IMAGE
  // ==========================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 500;
          const maxHeight = 500;
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
            setImagePreview(URL.createObjectURL(resizedFile));
          }, mimeType, quality);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Veuillez sélectionner un fichier image valide (png, jpg, jpeg, webp)');
    }
  };

  // ==========================================
  // HANDLE CHANGE
  // ==========================================
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
    } else if (name.startsWith('pointure.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    } else {
      setFormData(prevState => ({ ...prevState, [name]: value }));
    }
  };

  // ==========================================
  // ✅ CRÉER ÉLÈVE + SPÉCIALITÉS
  // ==========================================
  const creerEleveEtSpecialites = async (form) => {
    const response = await eleveService.post(form);
    const newEleveId = response.data?.id;

    const specialitesFiltrees = specialites.filter(sp => sp.categorie.trim() !== '');
    if (newEleveId && specialitesFiltrees.length > 0) {
      await specialiteService.bulkCreate(newEleveId, { specialites: specialitesFiltrees });
    }

    await Swal.fire("Ajouté!", "L'élève a été ajouté.", "success");
    navigate("/eleve/listeEleveGendarme");
  };

  // ==========================================
  // SUBMIT
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
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
    form.append("cour", formData.cour);
    form.append("sexe", formData.sexe);
    form.append("pointure", JSON.stringify(formData.pointure));
    form.append("famille", JSON.stringify(formData.famille));
    form.append("diplomes", JSON.stringify(formData.diplomes));
    form.append("sports", JSON.stringify(formData.sports));

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
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: "Voulez vous ajouter ?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#32CD32',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Oui, Ajouter',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          eleveService.getByInc(formData.numeroIncorporation, formData.cour)
            .then(res => {
              if (res.data.eleve) {
                Swal.fire("Échec", "Un élève avec cette incorporation et ce cours existe déjà.", "warning");
              } else {
                // ✅ créer élève + spécialités
                creerEleveEtSpecialites(form).catch(error => {
                  console.error("Erreur lors de l'enregistrement :", error);
                  Swal.fire("Erreur", "Une erreur s'est produite", "error");
                });
              }
            })
            .catch(error => {
              if (error.response && error.response.status === 404) {
                // ✅ créer élève + spécialités
                creerEleveEtSpecialites(form).catch(err => {
                  console.error("Erreur lors de l'enregistrement :", err);
                  Swal.fire("Erreur", "Une erreur s'est produite", "error");
                });
              } else {
                console.error("Erreur lors de la vérification :", error);
                Swal.fire("Erreur", "Impossible de vérifier l'existence de l'élève", "error");
              }
            });
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'élève:', error);
    }
  };

  const toggleFamille = () => setShowFamille(!showFamille);

  // ==========================================
  // JSX
  // ==========================================
  return (
    <div className="container mt-5">
      <h2 className="text-center mb-2 fw-bold text-uppercase text-primary" style={{ letterSpacing: '1px' }}>
        Fiche Élève Gendarme
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="col-md-3">
          <select className="form-select" name="cour" value={formData.cour} onChange={handleChange} required>
            {coursList.map((item) => (
              <option key={item.id} value={item.cour}>{item.cour}</option>
            ))}
          </select>
        </div>
        <br />

        <div className="col">
          <input type="file" className="form-control" name="image" onChange={handleImageChange} required />
        </div>
        <div className="col">
          <img src={imagePreview || 'images/egna.jpg'} alt="Aperçu" className="img-thumbnail" width="200" />
        </div>

        <div className="row">
          {/* ======= COLONNE GAUCHE ======= */}
          <div className="col-md-5">
            <div className="card shadow-lg border rounded p-3">

              <div className="row mb-3">
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

              <div className="row mb-3">
                <div className="col">
                  <select className="form-select" name="escadron" value={formData.escadron} onChange={handleChange}>
                    <option value="">Sélectionner un escadron</option>
                    {[1,2,3,4,5,6,7,8,9,10].map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="col">
                  <select className="form-select" name="peloton" value={formData.peloton} onChange={handleChange}>
                    <option value="">Peloton</option>
                    {[1,2,3].map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

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

              {formData.genreConcours === 'specialiste' && (
                <div className="mb-3">
                  <label className="form-label">Spécialité :</label>
                  {[
                    { value: 'Info-Telecom', label: 'Info-Telecom' },
                    { value: 'topo', label: 'topo' },
                    { value: 'mecanicien', label: 'mecanicien automobile' },
                    { value: 'infrastructure', label: 'infrastructure' },
                    { value: 'sport', label: 'Sport' },
                    { value: 'plombier', label: 'Plombier' },
                  ].map(({ value, label }) => (
                    <div className="form-check" key={value}>
                      <input className="form-check-input" type="radio" name="Specialiste" value={value} onChange={handleChange} />
                      <label className="form-check-label">{label}</label>
                    </div>
                  ))}
                </div>
              )}

              <div className="row mb-3">
                <div className="col">
                  <input type="text" className="form-control" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} style={{ textTransform: "uppercase" }} />
                </div>
                <div className="col">
                  <input type="text" className="form-control" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <input type="date" className="form-control" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} />
                </div>
                <div className="col">
                  <input type="text" className="form-control" name="lieuNaissance" placeholder="Lieu de naissance" value={formData.lieuNaissance} onChange={handleChange} />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <input type="text" className="form-control" name="CIN" placeholder="Numéro CIN" value={formData.CIN} onChange={handleChange} />
                </div>
                <div className="col">
                  <input type="date" className="form-control" name="dateDelivrance" value={formData.dateDelivrance} onChange={handleChange} />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <input type="text" className="form-control" name="lieuDelivrance" placeholder="Lieu de délivrance" value={formData.lieuDelivrance} onChange={handleChange} />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col">
                  <input type="date" className="form-control" name="duplicata" value={formData.duplicata} onChange={handleChange} />
                </div>
                <div className="col">
                  <input type="text" className="form-control" name="lieuDuplicata" placeholder="Lieu de duplicata" value={formData.lieuDuplicata} onChange={handleChange} />
                </div>
              </div>

              <div className="row mb-3">
                <label className="form-label">Sexe :</label>
                {['Masculin', 'Feminin'].map(s => (
                  <div className="form-check form-check-inline" key={s}>
                    <input className="form-check-input" type="checkbox" name="sexe" value={s}
                      checked={formData.sexe === s}
                      onChange={() => setFormData({ ...formData, sexe: s })} />
                    <label className="form-check-label">{s === 'Feminin' ? 'Féminin' : s}</label>
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <label className="form-label">Situation de famille:</label>
                <div className="d-flex gap-3">
                  {[
                    { value: 'Celibataire', label: 'Célibataire' },
                    { value: 'Marie', label: 'Marié(e)' },
                    { value: 'Divorce', label: 'Divorcé(e)' },
                  ].map(({ value, label }) => (
                    <div className="form-check" key={value}>
                      <input className="form-check-input" type="checkbox" name="situationFamiliale" value={value}
                        checked={formData.situationFamiliale === value}
                        onChange={() => setFormData({ ...formData, situationFamiliale: value })} />
                      <label className="form-check-label">{label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-flex gap-3 mb-3">
                <input type="text" className="form-control" placeholder="Téléphone 1" maxLength="10"
                  value={formData.telephone1}
                  onChange={(e) => setFormData({ ...formData, telephone1: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                <input type="text" className="form-control" placeholder="Téléphone 2" maxLength="10"
                  value={formData.telephone2}
                  onChange={(e) => setFormData({ ...formData, telephone2: e.target.value.replace(/\D/g, '').slice(0, 11) })} />
                <input type="text" className="form-control" placeholder="Téléphone 3" maxLength="10"
                  value={formData.telephone3}
                  onChange={(e) => setFormData({ ...formData, telephone3: e.target.value.replace(/\D/g, '').slice(0, 11) })} />
              </div>

              <div className="col mb-2">
                <input type="text" className="form-control" name="facebook" placeholder="facebook" value={formData.facebook} onChange={handleChange} />
              </div>

              <div className="col">
                <select className="form-control" name="fady" value={formData.fady} onChange={handleChange}>
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

              {/* ✅ SPÉCIALITÉS DYNAMIQUES */}
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
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Spécialité (ex: Informatique, BTP, Sport...)"
                        value={sp.categorie}
                        onChange={e => handleSpecialiteChange(index, 'categorie', e.target.value)}
                      />
                    </div>
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Détail (ex: Génie logiciel, Électricien, Basketball...)"
                        value={sp.detail}
                        onChange={e => handleSpecialiteChange(index, 'detail', e.target.value)}
                      />
                    </div>
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
                  {["Football", "Basketball", "Volley-ball", "Musculation", "Rugby", "Athlétisme", "Tennis", "arts martiaux", "Autre"].map((sport) => (
                    <div className="form-check form-check-inline" key={sport}>
                      <input className="form-check-input" type="checkbox" name="sports" value={sport}
                        checked={formData.sports?.includes(sport)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const value = e.target.value;
                          setFormData((prev) => {
                            const sports = new Set(prev.sports || []);
                            checked ? sports.add(value) : sports.delete(value);
                            return { ...prev, sports: Array.from(sports) };
                          });
                        }} />
                      <label className="form-check-label">{sport}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Religion */}
              <div className="mb-3">
                <label className="form-label">Religion</label>
                <div className="d-flex flex-wrap gap-3">
                  {["EKAR", "FJKM", "FLM", "ISLAM", "Autre"].map((religion) => (
                    <div className="form-check form-check-inline" key={religion}>
                      <input className="form-check-input" type="radio" name="religion" value={religion}
                        checked={formData.religion === religion} onChange={handleChange} />
                      <label className="form-check-label">{religion}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Groupe sanguin */}
              <div className="mb-3">
                <label className="form-label">Groupe sanguin</label>
                <div className="d-flex flex-wrap gap-3">
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                    <div className="form-check form-check-inline" key={g}>
                      <input className="form-check-input" type="radio" name="groupeSaguin" value={g}
                        checked={formData.groupeSaguin === g} onChange={handleChange} />
                      <label className="form-check-label">{g}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Niveau */}
              <div className="mb-3">
                <label className="form-label">Dernière classe suivie</label>
                <select className="form-control" name="niveau" value={formData.niveau} onChange={handleChange}>
                  <option value="">-- Sélectionner le niveau --</option>
                  {["BACC","BACC +1","BACC +2","BACC +3","BACC +4","BACC +5","BACC +6","BACC +7","BACC +8"].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="col"><p>En</p></div>
              <div className="col mb-3">
                <input type="text" placeholder="filière" className="form-control" name="niveaufiliere" value={formData.niveaufiliere} onChange={handleChange} />
              </div>

              {/* Diplômes */}
              <div className="mb-3">
                <label className="form-label">Diplômes obtenus</label>
                <div className="d-flex flex-wrap gap-3">
                  {["CEPE", "BEPC", "BACC S", "BACC L", "BACC_TECHNIQUE", "Licence", "Master One", "Master Two", "Doctorat"].map((diplome) => (
                    <div className="form-check" key={diplome}>
                      <input className="form-check-input" type="checkbox" name="diplomes" value={diplome}
                        checked={formData.diplomes?.includes(diplome)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const value = e.target.value;
                          setFormData((prev) => {
                            const diplomes = new Set(prev.diplomes || []);
                            checked ? diplomes.add(value) : diplomes.delete(value);
                            return { ...prev, diplomes: Array.from(diplomes) };
                          });
                        }} />
                      <label className="form-check-label">{diplome}</label>
                    </div>
                  ))}
                </div>
              </div>

              {["Licence", "Master One", "Master Two", "Doctorat"].map((niveau) =>
                formData.diplomes?.includes(niveau) && (
                  <div className="mb-3" key={niveau}>
                    <label className="form-label">Filière pour {niveau}</label>
                    <input type="text" className="form-control"
                      name={`filiere${niveau.replace(/\s/g, '')}`}
                      value={formData[`filiere${niveau.replace(/\s/g, '')}`] || ""}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        [`filiere${niveau.replace(/\s/g, '')}`]: e.target.value,
                      }))} />
                  </div>
                )
              )}

              <div className="mb-3">
                <label className="form-label">Relation(s) gênante(s)</label>
                <textarea className="form-control" name="relationGenante" rows="3"
                  placeholder="Toerana tsy tokony hiasana."
                  value={formData.relationGenante} onChange={handleChange}></textarea>
              </div>

            </div>
          </div>

          {/* ======= COLONNE DROITE — POINTURE ======= */}
          <div className="col-md-2">
            <div className="card shadow-lg border rounded p-3">
              <h6 className="mb-3 text-center">POINTURE EFFETS</h6>

              <div className="mb-3">
                <label className="form-label">Chemise / T-shirt</label>
                <select className="form-select" name="pointure.tailleChemise" value={formData.pointure.tailleChemise} onChange={handleChange}>
                  <option value="">Choisir la taille</option>
                  {["XS","S","M","L","XL","XXL"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Tour de tête (cm)</label>
                <input type="number" className="form-control" name="pointure.tourTete"
                  value={formData.pointure.tourTete} onChange={handleChange} min="28" max="60" placeholder="Ex: 40" />
              </div>

              <div className="mb-3">
                <label className="form-label">Pointure pantalon</label>
                <select className="form-select" name="pointure.pointurePantalon" value={formData.pointure.pointurePantalon} onChange={handleChange}>
                  <option value="">Choisir</option>
                  {[28,30,34,36,38,40,42,44,46,48,50].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Pointure chaussure</label>
                <select className="form-select" name="pointure.pointureChaussure" value={formData.pointure.pointureChaussure} onChange={handleChange}>
                  <option value="">Choisir</option>
                  {[30,34,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <br />

        {/* ======= FAMILLE ======= */}
        <div className="text-center mb-3">
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
            ].map(({ label, key }) => (
              <div className="row mb-3" key={key}>
                <div className="col-md-4">
                  <label className="form-label">{label}</label>
                  <input type="text" name={`famille.${key}.nom`} className="form-control"
                    value={formData.famille[key].nom} onChange={handleChange} placeholder="Nom" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Téléphone</label>
                  <input type="text" name={`famille.${key}.phone`} className="form-control"
                    value={formData.famille[key].phone} onChange={handleChange} placeholder="Téléphone" />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Adresse</label>
                  <input type="text" name={`famille.${key}.adresse`} className="form-control"
                    value={formData.famille[key].adresse} onChange={handleChange} placeholder="Adresse" />
                </div>
              </div>
            ))}

            {/* Accident */}
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">À prévenir en cas d'accident</label>
                <input type="text" name="famille.accidents.nom" className="form-control"
                  value={formData.famille.accidents.nom} onChange={handleChange} placeholder="Nom" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Téléphone</label>
                <input type="text" name="famille.accidents.phone" className="form-control"
                  value={formData.famille.accidents.phone} onChange={handleChange} placeholder="Téléphone" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Adresse</label>
                <input type="text" name="famille.accidents.adresse" className="form-control"
                  value={formData.famille.accidents.adresse} onChange={handleChange} placeholder="Adresse" />
              </div>
            </div>

            {/* Enfants */}
            {formData.famille.enfants.map((enfant, index) => (
              <div key={index} className="row mb-5 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Nom enfant {index + 1}</label>
                  <input type="text" name="famille.enfants.nom" className="form-control"
                    value={enfant.nom} onChange={(e) => handleChange(e, index)} placeholder="Nom" />
                </div>
                <div className="col-md-3 text-end">
                  <button type="button" className="btn btn-outline-danger mt-4"
                    onClick={() => supprimerEnfant(index)}>🗑️</button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-primary mb-3" onClick={ajouterEnfant}>ENFANT</button>

            <div className="row mb-4">
              {/* Frères */}
              {formData.famille.frere.map((frere, index) => (
                <div key={index} className="col-md-6">
                  <label className="form-label">Nom Frère {index + 1}</label>
                  <input type="text" name={`famille.frere[${index}].nom`} className="form-control"
                    value={frere.nom} onChange={(e) => handleChange(e, index, "frere")} placeholder="Nom du frère" />
                  <div className="text-end">
                    <button type="button" className="btn btn-outline-danger mt-2"
                      onClick={() => supprimerFrere(index)}>🗑️</button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-outline-primary mt-4" onClick={ajouterFrere}>
                FORMULAIRE FRERE
              </button>

              {/* Sœurs */}
              {formData.famille.soeur.map((soeur, index) => (
                <div key={index} className="col-md-6">
                  <label className="form-label">Nom Soeur {index + 1}</label>
                  <input type="text" name={`famille.soeur[${index}].nom`} className="form-control"
                    value={soeur.nom} onChange={(e) => handleChange(e, index, "soeur")} placeholder="Nom de la soeur" />
                  <div className="text-end">
                    <button type="button" className="btn btn-outline-danger mt-2"
                      onClick={() => supprimerSoeur(index)}>🗑️</button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-outline-primary mt-3" onClick={ajouterSoeur}>
                FORMULAIRE SOEUR
              </button>
            </div>
          </div>
        )}

        <br />
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>
          VALIDER
        </button>
      </form>
    </div>
  );
};

export default ElevePage;