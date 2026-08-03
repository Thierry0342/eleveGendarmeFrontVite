import 'bootstrap/dist/css/bootstrap.min.css';
import './cadre-theme.css';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import cadreService from '../../services/cadre-service';
import DataTable from 'react-data-table-component';
import Swal from 'sweetalert2';

// ===================== CONSTANTES =====================

const GRADES = [
  "GST", "G2C", "G1C", "GHC", "GP2C", "GP1C", "GPHC", "GPCE",
  "LIEUTENANT", "CAPITAINE", "CHEF D'ESCADRON", "LIEUTENANT-COLONEL",
  "COLONEL", "GÉNÉRAL DE BRIGADE", "GÉNÉRAL DE DIVISION",
];

const SERVICES = [
  "1ER ESCADRON", "2EME ESCADRON", "3EME ESCADRON", "4EME ESCADRON", "5EME ESCADRON",
  "6EME ESCADRON", "7EME ESCADRON", "8EME ESCADRON", "9EME ESCADRON", "10EME ESCADRON",
  "CAB", "DI", "COUR A", "COUR B", "MATR", "SM", "INFRA", "PIF", "SED", "SRH",
  "PEDA", "SSL", "TELECOM", "ARM", "PDS", "INFO", "SE",
];

const SEXES = ["Masculin", "Féminin"];
const QUALITES_ENFANT = [
  { value: "L", label: "L - Légitime" },
  { value: "R", label: "R - Reconnu" },
  { value: "A", label: "A - Adopté" },
];
const NATURES_FELICITATION = [
  { value: "TS", label: "TS - Témoignage de satisfaction" },
  { value: "C", label: "C - Citation ordre ou inscription livre d'or" },
  { value: "FE", label: "FE - Lettre de félicitation ou Félicitation écrite" },
];
const TYPES_PUNITION = [
  { value: "AR", label: "AR - Arrêt de rigueur" },
  { value: "AS", label: "AS - Arrêt simple" },
  { value: "ASS", label: "ASS - Arrêt simple avec sursis" },
  { value: "AF", label: "AF - Arrêt forteresse" },
];
const MOTIFS_AFFECTATION = [
  { value: "IDS", label: "IDS - Intérêt de service" },
  { value: "CP", label: "CP - Convenance personnelle" },
  { value: "SCR", label: "SCR - Sans changement de résidence" },
  { value: "MD", label: "MD - Mesure disciplinaire" },
];
const CATEGORIES_DIPLOME = ["Civil", "Militaire"];

const EMPTY_ENFANT = { numero: "", nomPrenom: "", dateNaissance: "", lieuNaissance: "", qualite: "", sexe: "", observation: "" };
const EMPTY_SERVICE_MILITAIRE = { typeService: "", dateDebut: "", dateFin: "", promoClasse: "", mleSN: "" };
const EMPTY_GRADE = { grade: "", dateNomination: "", refDecision: "" };
const EMPTY_DECORATION = { nature: "", refAttribution: "", datePriseEffet: "" };
const EMPTY_FELICITATION = { nature: "", reference: "", libelle: "", autorite: "" };
const EMPTY_PUNITION = { taux: "", type: "", dpe: "", autoriteInfligeante: "", reference: "", libelle: "" };
const EMPTY_DIPLOME = { intitule: "", reference: "", entite: "", categorie: "Civil" };
const EMPTY_SERMENT = { typePrestation: "", datePrestation: "", lieu: "", observations: "" };
const EMPTY_AFFECTATION = { unite: "", fonction: "", acDuLe: "", refDecision: "", motif: "", dateDisponibilite: "", referenceCR: "" };
const EMPTY_RELATION = { type: "", districtRegion: "" };

const INITIAL_FORM = {
  matricule: "", nom: "", prenom: "", phone: "", photo: "",
  positionEffectiveUnite: "", positionEffectiveFonction: "", positionEffectiveDepuisLe: "", positionEffectiveDisponibleLe: "",
  positionTheoriqueUnite: "", positionTheoriqueFonction: "", positionTheoriqueDepuisLe: "", positionTheoriqueDisponibleLe: "",
  grade: "", service: "",

  dateNaissance: "", lieuNaissance: "", sexe: "", groupeSanguin: "", taille: "",
  pereNomPrenom: "", mereNomPrenom: "", groupeEthnique: "", religion: "",
  cin: "", cinDelivreLe: "", cinDelivreA: "",
  dateMariage: "", autorisationMariage: "", mariageRompuLe: "", motifRompuMariage: "",
  remarieLe: "", deuxiemeAutorisationMariage: "", numeroDateJugementDeces: "",

  epouxNomPrenom: "", epouxFonction: "", epouxMatricule: "", epouxCin: "",
  epouxOrganismeEmployeur: "", epouxRefDecisionIncorporation: "", epouxDelivreLe: "", epouxDelivreA: "",

  dateIncorporation: "", diplomeDecisionIncorporation: "",
  nombrePiecesJointes: "", nombreFeuillesSupplementaires: "",

  enfants: [], servicesMilitaires: [], gradesSuccessifs: [], decorations: [],
  felicitations: [], punitions: [], diplomes: [], serments: [], affectations: [], relationsInterets: [],

  sanitairePATC: { reference: "", medecinTraitant: "", nombrePATC: "", dateDebutPATC: "", renouvelable: "" },
  sanitaireCREFA: { reference: "", type: "", referenceEnvoiCREFA: "", referenceEnvoiFinance: "", observation: "" },
};

// Définition des étapes du stepper. `check` détermine si l'étape contient déjà
// des données (utilisé pour l'indicateur "rempli" dans la barre latérale).
const STEP_DEFS = [
  { id: 'identification', numeral: '—', label: 'Identification & Position',
    check: (f) => f.nom || f.prenom || f.matricule },
  { id: 'etatCivil', numeral: 'I', label: 'État civil',
    check: (f) => f.dateNaissance || f.lieuNaissance || f.cin },
  { id: 'epoux', numeral: 'II', label: 'Époux(se) actuel(le)',
    check: (f) => f.epouxNomPrenom || f.epouxFonction },
  { id: 'enfants', numeral: 'III', label: 'Enfants',
    check: (f) => f.enfants.length > 0 },
  { id: 'servicesMilitaires', numeral: 'IV', label: 'Services militaire effectué',
    check: (f) => f.servicesMilitaires.length > 0 },
  { id: 'incorporation', numeral: 'V', label: 'Services Gendarmerie',
    check: (f) => f.dateIncorporation },
  { id: 'gradesSuccessifs', numeral: 'VI', label: 'Grades successifs',
    check: (f) => f.gradesSuccessifs.length > 0 },
  { id: 'decorations', numeral: 'VII', label: 'Décorations successives',
    check: (f) => f.decorations.length > 0 },
  { id: 'felicitations', numeral: 'VIII', label: 'Félicitations',
    check: (f) => f.felicitations.length > 0 },
  { id: 'punitions', numeral: 'IX', label: 'Punitions',
    check: (f) => f.punitions.length > 0 },
  { id: 'diplomes', numeral: 'X', label: 'Diplômes et brevets',
    check: (f) => f.diplomes.length > 0 },
  { id: 'serments', numeral: 'XI', label: 'Serments',
    check: (f) => f.serments.length > 0 },
  { id: 'affectations', numeral: 'XII', label: 'Affectations successives',
    check: (f) => f.affectations.length > 0 },
  { id: 'sanitaire', numeral: 'XIII', label: 'Renseignements sanitaires',
    check: (f) => f.sanitairePATC.reference || f.sanitaireCREFA.reference },
  { id: 'relations', numeral: 'XIV', label: 'Relations gênantes',
    check: (f) => f.relationsInterets.length > 0 },
  { id: 'pieces', numeral: '—', label: 'Pièces jointes',
    check: (f) => f.nombrePiecesJointes || f.nombreFeuillesSupplementaires },
];

// ===================== COMPOSANTS UTILITAIRES =====================

const Field = ({ label, name, value, onChange, type = "text", options = null, colClass = "col-md-4", required = false }) => (
  <div className={`mb-3 ${colClass}`}>
    <label className="form-label small fw-semibold">
      {label}{required && <span className="text-danger"> *</span>}
    </label>
    {options ? (
      <select className="form-select" name={name} value={value || ""} onChange={onChange}>
        <option value="">-- Sélectionner --</option>
        {options.map((opt) =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
    ) : (
      <input type={type} className="form-control" name={name} value={value || ""} onChange={onChange} />
    )}
  </div>
);

const RepeatableTable = ({ title, hint, field, columns, emptyRow, rows, onAddRow, onRemoveRow, onRowChange }) => (
  <div className="mb-2">
    <div className="d-flex justify-content-between align-items-center mb-2">
      <div>
        <h6 className="text-secondary mb-0">{title}</h6>
        {hint && <div className="text-muted" style={{ fontSize: '0.78rem' }}>{hint}</div>}
      </div>
      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onAddRow(field, emptyRow)}>
        <i className="fa fa-plus me-1"></i> Ajouter une ligne
      </button>
    </div>
    {rows.length === 0 && (
      <div className="empty-state border rounded" style={{ padding: '1.5rem' }}>
        <i className="fa fa-inbox"></i>
        Aucune ligne pour l'instant — clique sur « Ajouter une ligne » pour commencer.
      </div>
    )}
    {rows.map((row, index) => (
      <div key={index} className="border rounded p-2 mb-2 bg-light-subtle position-relative">
        <div className="row">
          {columns.map((col) => (
            <div className={col.colClass || "col-md-3"} key={col.key}>
              <label className="form-label small">{col.label}</label>
              {col.options ? (
                <select
                  className="form-select form-select-sm"
                  value={row[col.key] || ""}
                  onChange={(e) => onRowChange(field, index, col.key, e.target.value)}
                >
                  <option value="">--</option>
                  {col.options.map((opt) =>
                    typeof opt === "string" ? (
                      <option key={opt} value={opt}>{opt}</option>
                    ) : (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    )
                  )}
                </select>
              ) : (
                <input
                  type={col.type || "text"}
                  className="form-control form-control-sm"
                  value={row[col.key] || ""}
                  onChange={(e) => onRowChange(field, index, col.key, e.target.value)}
                />
              )}
            </div>
          ))}
          <div className="col-md-1 d-flex align-items-end mb-2">
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onRemoveRow(field, index)} title="Supprimer la ligne">
              <i className="fa fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ===================== COMPOSANT PRINCIPAL =====================

const CadreFormBootstrap = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cadres, setCadres] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [activeStep, setActiveStep] = useState(STEP_DEFS[0].id);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const displayedPhotoUrl = photoPreview || cadreService.getPhotoUrl(formData.photo);

  const fetchCadre = async () => {
    try {
      const response = await cadreService.getAll();
      setCadres(response.data);
    } catch (error) {
      console.error('Erreur de chargement des cadres', error);
    }
  };

  useEffect(() => {
    fetchCadre();
    const intervalId = setInterval(fetchCadre, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredCadres = cadres.filter((cadre) =>
    ["nom", "prenom", "grade", "service", "matricule"].some((key) =>
      String(cadre[key] || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNestedChange = (parentKey) => (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [parentKey]: { ...formData[parentKey], [name]: value } });
  };

  const handleAddRow = (field, emptyRow) => setFormData({ ...formData, [field]: [...formData[field], { ...emptyRow }] });
  const handleRemoveRow = (field, index) => setFormData({ ...formData, [field]: formData[field].filter((_, i) => i !== index) });
  const handleRowChange = (field, index, key, value) => {
    setFormData({ ...formData, [field]: formData[field].map((row, i) => (i === index ? { ...row, [key]: value } : row)) });
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingId(null);
    setActiveStep(STEP_DEFS[0].id);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleAddCadre = async () => {
    if (!formData.nom || !formData.prenom || !formData.matricule) {
      Swal.fire('Champs requis', 'Nom, prénom et matricule sont obligatoires (section Identification).', 'warning');
      setActiveStep('identification');
      return;
    }
    try {
      const response = await cadreService.post(formData);
      const newId = response.data && response.data.id;
      if (photoFile && newId) {
        try {
          await cadreService.uploadPhoto(newId, photoFile);
        } catch (photoError) {
          console.error("Erreur lors de l'upload de la photo :", photoError);
          Swal.fire('Fiche créée', "La fiche a été créée mais l'envoi de la photo a échoué.", 'warning');
        }
      }
      await fetchCadre();
      resetForm();
      Swal.fire('Ajouté', 'La fiche a été créée avec succès.', 'success');
    } catch (error) {
      console.error("Erreur lors de l'ajout du cadre :", error);
      Swal.fire('Erreur', "L'ajout a échoué.", 'error');
    }
  };

  const handleEdit = (cadre) => {
    setFormData({
      ...INITIAL_FORM,
      ...cadre,
      enfants: cadre.enfants || [],
      servicesMilitaires: cadre.servicesMilitaires || [],
      gradesSuccessifs: cadre.gradesSuccessifs || [],
      decorations: cadre.decorations || [],
      felicitations: cadre.felicitations || [],
      punitions: cadre.punitions || [],
      diplomes: cadre.diplomes || [],
      serments: cadre.serments || [],
      affectations: cadre.affectations || [],
      relationsInterets: cadre.relationsInterets || [],
      sanitairePATC: cadre.sanitairePATC || INITIAL_FORM.sanitairePATC,
      sanitaireCREFA: cadre.sanitaireCREFA || INITIAL_FORM.sanitaireCREFA,
    });
    setEditingId(cadre.id);
    setActiveStep('identification');
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Si on arrive depuis CadreDetailPage via le bouton "Modifier"
  // (navigate(CADRE_FORM_ROUTE, { state: { editCadre } })), on précharge
  // directement la fiche en mode édition.
  useEffect(() => {
    if (location.state && location.state.editCadre) {
      handleEdit(location.state.editCadre);
      // Nettoie le state pour éviter de recharger la même fiche si
      // l'utilisateur revient sur cette page plus tard via le bouton retour.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleModifCadre = async () => {
    if (!editingId) return;
    try {
      await cadreService.update(editingId, formData);
      if (photoFile) {
        try {
          await cadreService.uploadPhoto(editingId, photoFile);
        } catch (photoError) {
          console.error("Erreur lors de l'upload de la photo :", photoError);
          Swal.fire('Fiche modifiée', "La fiche a été mise à jour mais l'envoi de la photo a échoué.", 'warning');
        }
      }
      await fetchCadre();
      resetForm();
      Swal.fire('Modifié', 'La fiche a été mise à jour.', 'success');
    } catch (error) {
      console.error("Erreur lors de la modification :", error);
      Swal.fire('Erreur', "La modification a échoué.", 'error');
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
      cancelButtonText: 'Annuler',
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

  const columns = [
    {
      name: 'Photo', width: '64px',
      cell: row => row.photo ? (
        <img src={cadreService.getPhotoUrl(row.photo)} alt="" style={{ width: 36, height: 42, objectFit: 'cover' }} className="rounded border" />
      ) : (
        <div className="d-flex align-items-center justify-content-center bg-light border rounded text-muted" style={{ width: 36, height: 42 }}>
          <i className="fa fa-user small"></i>
        </div>
      ),
    },
    { name: 'Nom', selector: row => row.nom, sortable: true },
    { name: 'Prénom', selector: row => row.prenom, sortable: true },
    { name: 'Grade', selector: row => row.grade, sortable: true },
    { name: 'Matricule', selector: row => row.matricule, sortable: true },
    {
      name: 'Actions', width: '150px',
      cell: row => (
        <>
          <button className="btn btn-outline-secondary btn-sm me-1" title="Voir la fiche complète" onClick={() => navigate(`/cadre/${row.matricule}`)}>
            <i className="fa fa-eye"></i>
          </button>
          <button className="btn btn-warning btn-sm me-1" title="Modifier ici" onClick={() => handleEdit(row)}>
            <i className="fa fa-edit"></i>
          </button>
          <button className="btn btn-danger btn-sm" title="Supprimer" onClick={() => handleDelete(row.id)}>
            <i className="fa fa-trash"></i>
          </button>
        </>
      ),
    },
  ];

  const stepIndex = STEP_DEFS.findIndex((s) => s.id === activeStep);
  const filledCount = useMemo(() => STEP_DEFS.filter((s) => s.check(formData)).length, [formData]);
  const progressPct = Math.round((filledCount / STEP_DEFS.length) * 100);

  const goPrev = () => { if (stepIndex > 0) setActiveStep(STEP_DEFS[stepIndex - 1].id); };
  const goNext = () => { if (stepIndex < STEP_DEFS.length - 1) setActiveStep(STEP_DEFS[stepIndex + 1].id); };

  return (
    <div className="cadre-app py-4">
      <div className="container-fluid px-4">
        <div className="cadre-page-header">
          <div>
            <h1 className="cadre-page-title">
              {editingId ? 'Modifier la fiche' : 'Nouvelle fiche individuelle'}
            </h1>
            <div className="cadre-page-subtitle">
              {editingId ? `Fiche en cours de modification — matricule ${formData.matricule}` : 'Renseigne les sections une à une, tu peux enregistrer à tout moment.'}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/cadre')}>
              <i className="fa fa-list me-1"></i> Voir le répertoire
            </button>
            {editingId && (
              <button className="btn btn-outline-secondary btn-sm" onClick={resetForm}>
                Annuler la modification
              </button>
            )}
          </div>
        </div>

        <div className="row g-4">
          {/* ===================== STEPPER (navigation sections) ===================== */}
          <div className="col-lg-3">
            <div className="stepper-nav">
              <div className="stepper-progress-track">
                <div className="stepper-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <ul className="stepper-list">
                {STEP_DEFS.map((step) => {
                  const filled = step.check(formData);
                  const active = activeStep === step.id;
                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        className={`stepper-item ${active ? 'active' : ''} ${filled ? 'filled' : ''}`}
                        onClick={() => setActiveStep(step.id)}
                      >
                        <span className="step-badge">{filled && !active ? <i className="fa fa-check" /> : step.numeral}</span>
                        <span className="step-label">{step.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* ===================== PANNEAU DE LA SECTION ACTIVE ===================== */}
          <div className="col-lg-5">
            <div className="cadre-section-panel">
              <div className="section-eyebrow">
                <span className="numeral">{STEP_DEFS[stepIndex].numeral}</span>
                <span className="title">{STEP_DEFS[stepIndex].label}</span>
                <span className="hint">Étape {stepIndex + 1} / {STEP_DEFS.length}</span>
              </div>

              {activeStep === 'identification' && (
                <>
                  <div className="row mb-3 align-items-center">
                    <div className="col-auto">
                      {displayedPhotoUrl ? (
                        <img src={displayedPhotoUrl} alt="Photo du cadre" className="cadre-avatar" />
                      ) : (
                        <div className="cadre-avatar-placeholder"><i className="fa fa-user fa-2x"></i></div>
                      )}
                    </div>
                    <div className="col">
                      <label className="form-label small fw-semibold">Photo</label>
                      <input type="file" className="form-control" accept="image/png, image/jpeg, image/webp" onChange={handlePhotoChange} />
                      <div className="form-text">JPG, PNG ou WEBP, 5 Mo max.</div>
                    </div>
                  </div>
                  <div className="row">
                    <Field label="Matricule" name="matricule" type="number" value={formData.matricule} onChange={handleChange} required colClass="col-md-6" />
                    <Field label="Nom" name="nom" value={formData.nom} onChange={handleChange} required colClass="col-md-6" />
                    <Field label="Prénom(s)" name="prenom" value={formData.prenom} onChange={handleChange} required colClass="col-md-6" />
                    <Field label="Téléphone" name="phone" value={formData.phone} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Grade actuel" name="grade" value={formData.grade} onChange={handleChange} options={GRADES} colClass="col-md-6" />
                    <Field label="Service / Unité" name="service" value={formData.service} onChange={handleChange} options={SERVICES} colClass="col-md-6" />
                  </div>
                  <p className="subgroup-label">Position effective</p>
                  <div className="row">
                    <Field label="Unité d'affectation" name="positionEffectiveUnite" value={formData.positionEffectiveUnite} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Fonction" name="positionEffectiveFonction" value={formData.positionEffectiveFonction} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Compter du" name="positionEffectiveDepuisLe" value={formData.positionEffectiveDepuisLe} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Disponible à/c du" name="positionEffectiveDisponibleLe" value={formData.positionEffectiveDisponibleLe} onChange={handleChange} colClass="col-md-6" />
                  </div>
                  <p className="subgroup-label">Position théorique</p>
                  <div className="row">
                    <Field label="Unité d'affectation" name="positionTheoriqueUnite" value={formData.positionTheoriqueUnite} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Fonction" name="positionTheoriqueFonction" value={formData.positionTheoriqueFonction} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Compter du" name="positionTheoriqueDepuisLe" value={formData.positionTheoriqueDepuisLe} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Disponible à/c du" name="positionTheoriqueDisponibleLe" value={formData.positionTheoriqueDisponibleLe} onChange={handleChange} colClass="col-md-6" />
                  </div>
                </>
              )}

              {activeStep === 'etatCivil' && (
                <>
                  <div className="row">
                    <Field label="Date de naissance" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Lieu de naissance" name="lieuNaissance" value={formData.lieuNaissance} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Sexe" name="sexe" value={formData.sexe} onChange={handleChange} options={SEXES} colClass="col-md-6" />
                    <Field label="Groupe sanguin" name="groupeSanguin" value={formData.groupeSanguin} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Taille (m)" name="taille" value={formData.taille} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Groupe ethnique" name="groupeEthnique" value={formData.groupeEthnique} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Religion" name="religion" value={formData.religion} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Fils/Fille de (père)" name="pereNomPrenom" value={formData.pereNomPrenom} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Et de (mère)" name="mereNomPrenom" value={formData.mereNomPrenom} onChange={handleChange} colClass="col-md-6" />
                  </div>
                  <p className="subgroup-label">Carte d'identité</p>
                  <div className="row">
                    <Field label="C.I.N n°" name="cin" value={formData.cin} onChange={handleChange} colClass="col-md-4" />
                    <Field label="Délivrée le" name="cinDelivreLe" value={formData.cinDelivreLe} onChange={handleChange} colClass="col-md-4" />
                    <Field label="Délivrée à" name="cinDelivreA" value={formData.cinDelivreA} onChange={handleChange} colClass="col-md-4" />
                    <Field label="N° et date jugement/acte décès" name="numeroDateJugementDeces" value={formData.numeroDateJugementDeces} onChange={handleChange} colClass="col-md-12" />
                  </div>
                  <p className="subgroup-label">Situation matrimoniale</p>
                  <div className="row">
                    <Field label="Marié(e) le" name="dateMariage" value={formData.dateMariage} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Autorisation de mariage" name="autorisationMariage" value={formData.autorisationMariage} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Mariage rompu le" name="mariageRompuLe" value={formData.mariageRompuLe} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Motif (décès, divorce)" name="motifRompuMariage" value={formData.motifRompuMariage} onChange={handleChange} colClass="col-md-6" />
                    <Field label="Remarié le" name="remarieLe" value={formData.remarieLe} onChange={handleChange} colClass="col-md-6" />
                    <Field label="2ème autorisation de mariage" name="deuxiemeAutorisationMariage" value={formData.deuxiemeAutorisationMariage} onChange={handleChange} colClass="col-md-6" />
                  </div>
                </>
              )}

              {activeStep === 'epoux' && (
                <div className="row">
                  <Field label="Nom et prénoms (à delle/sieur)" name="epouxNomPrenom" value={formData.epouxNomPrenom} onChange={handleChange} colClass="col-md-12" />
                  <Field label="Fonction" name="epouxFonction" value={formData.epouxFonction} onChange={handleChange} colClass="col-md-6" />
                  <Field label="Matricule" name="epouxMatricule" value={formData.epouxMatricule} onChange={handleChange} colClass="col-md-6" />
                  <Field label="C.I.N n°" name="epouxCin" value={formData.epouxCin} onChange={handleChange} colClass="col-md-6" />
                  <Field label="Organisme employeur" name="epouxOrganismeEmployeur" value={formData.epouxOrganismeEmployeur} onChange={handleChange} colClass="col-md-6" />
                  <Field label="Référence décision incorporation" name="epouxRefDecisionIncorporation" value={formData.epouxRefDecisionIncorporation} onChange={handleChange} colClass="col-md-6" />
                  <Field label="Délivrée le" name="epouxDelivreLe" value={formData.epouxDelivreLe} onChange={handleChange} colClass="col-md-3" />
                  <Field label="Délivrée à" name="epouxDelivreA" value={formData.epouxDelivreA} onChange={handleChange} colClass="col-md-3" />
                </div>
              )}

              {activeStep === 'enfants' && (
                <RepeatableTable
                  title="Liste des enfants" field="enfants" emptyRow={EMPTY_ENFANT} rows={formData.enfants}
                  onAddRow={handleAddRow} onRemoveRow={handleRemoveRow} onRowChange={handleRowChange}
                  columns={[
                    { key: "numero", label: "N°", colClass: "col-md-1" },
                    { key: "nomPrenom", label: "Nom et prénoms", colClass: "col-md-3" },
                    { key: "dateNaissance", label: "Date naissance", colClass: "col-md-2" },
                    { key: "lieuNaissance", label: "Lieu naissance", colClass: "col-md-2" },
                    { key: "qualite", label: "Qualité", colClass: "col-md-2", options: QUALITES_ENFANT },
                    { key: "sexe", label: "Sexe", colClass: "col-md-1", options: SEXES.map(s => s[0]) },
                    { key: "observation", label: "Observation", colClass: "col-md-3" },
                  ]}
                />
              )}

              {activeStep === 'servicesMilitaires' && (
                <RepeatableTable
                  title="Services (SN, SNHFAP...)" field="servicesMilitaires" emptyRow={EMPTY_SERVICE_MILITAIRE} rows={formData.servicesMilitaires}
                  onAddRow={handleAddRow} onRemoveRow={handleRemoveRow} onRowChange={handleRowChange}
                  columns={[
                    { key: "typeService", label: "Type de service", colClass: "col-md-3" },
                    { key: "dateDebut", label: "Date début sce", colClass: "col-md-2" },
                    { key: "dateFin", label: "Date fin sce", colClass: "col-md-2" },
                    { key: "promoClasse", label: "Promo/Classe", colClass: "col-md-2" },
                    { key: "mleSN", label: "Mle SN", colClass: "col-md-2" },
                  ]}
                />
              )}

              {activeStep === 'incorporation' && (
                <div className="row">
                  <Field label="Date d'incorporation" name="dateIncorporation" value={formData.dateIncorporation} onChange={handleChange} colClass="col-md-6" />
                  <Field label="Diplôme / décision d'incorporation" name="diplomeDecisionIncorporation" value={formData.diplomeDecisionIncorporation} onChange={handleChange} colClass="col-md-6" />
                </div>
              )}

              {activeStep === 'gradesSuccessifs' && (
                <RepeatableTable
                  title="Historique des grades" field="gradesSuccessifs" emptyRow={EMPTY_GRADE} rows={formData.gradesSuccessifs}
                  onAddRow={handleAddRow} onRemoveRow={handleRemoveRow} onRowChange={handleRowChange}
                  columns={[
                    { key: "grade", label: "Grade", colClass: "col-md-5", options: GRADES.concat(["Gendarme Stagiaire"]) },
                    { key: "dateNomination", label: "Date de nomination", colClass: "col-md-3" },
                    { key: "refDecision", label: "Réf décision (n° et date)", colClass: "col-md-4" },
                  ]}
                />
              )}

              {activeStep === 'decorations' && (
                <RepeatableTable
                  title="Décorations" field="decorations" emptyRow={EMPTY_DECORATION} rows={formData.decorations}
                  onAddRow={handleAddRow} onRemoveRow={handleRemoveRow} onRowChange={handleRowChange}
                  columns={[
                    { key: "nature", label: "Nature", colClass: "col-md-5" },
                    { key: "refAttribution", label: "Réf attribution (n° et date)", colClass: "col-md-4" },
                    { key: "datePriseEffet", label: "Date prise d'effet", colClass: "col-md-3" },
                  ]}
                />
              )}

              {activeStep === 'felicitations' && (
                <RepeatableTable
                  title="Félicitations" field="felicitations" emptyRow={EMPTY_FELICITATION} rows={formData.felicitations}
                  onAddRow={handleAddRow} onRemoveRow={handleRemoveRow} onRowChange={handleRowChange}
                  columns={[
                    { key: "nature", label: "Nature", colClass: "col-md-3", options: NATURES_FELICITATION },
                    { key: "reference", label: "Référence (n° et date)", colClass: "col-md-3" },
                    { key: "libelle", label: "Libellé", colClass: "col-md-3" },
                    { key: "autorite", label: "Autorité ayant octroyé", colClass: "col-md-3" },
                  ]}
                />
              )}

              {activeStep === 'punitions' && (
                <RepeatableTable
                  title="Punitions" field="punitions" emptyRow={EMPTY_PUNITION} rows={formData.punitions}
                  onAddRow={handleAddRow} onRemoveRow={handleRemoveRow} onRowChange={handleRowChange}
                  columns={[
                    { key: "taux", label: "Taux", colClass: "col-md-2" },
                    { key: "type", label: "Type", colClass: "col-md-2", options: TYPES_PUNITION },
                    { key: "dpe", label: "D.P.E.", colClass: "col-md-2" },
                    { key: "autoriteInfligeante", label: "Autorité infligeante", colClass: "col-md-3" },
                    { key: "reference", label: "Référence", colClass: "col-md-3" },
                    { key: "libelle", label: "Libellé", colClass: "col-md-12" },
                  ]}
                />
              )}

              {activeStep === 'diplomes' && (
                <RepeatableTable
                  title="Diplômes / brevets (civils et militaires)" field="diplomes" emptyRow={EMPTY_DIPLOME} rows={formData.diplomes}
                  onAddRow={handleAddRow} onRemoveRow={handleRemoveRow} onRowChange={handleRowChange}
                  columns={[
                    { key: "categorie", label: "Catégorie", colClass: "col-md-3", options: CATEGORIES_DIPLOME },
                    { key: "intitule", label: "Intitulé", colClass: "col-md-5" },
                    { key: "reference", label: "Référence (année)", colClass: "col-md-2" },
                    { key: "entite", label: "Entité ayant délivré", colClass: "col-md-12" },
                  ]}
                />
              )}

              {activeStep === 'serments' && (
                <RepeatableTable
                  title="Prestations de serment" field="serments" emptyRow={EMPTY_SERMENT} rows={formData.serments}
                  onAddRow={handleAddRow} onRemoveRow={handleRemoveRow} onRowChange={handleRowChange}
                  columns={[
                    { key: "typePrestation", label: "Type prestation", colClass: "col-md-3" },
                    { key: "datePrestation", label: "Date prestation", colClass: "col-md-2" },
                    { key: "lieu", label: "Lieu de la prestation", colClass: "col-md-3" },
                    { key: "observations", label: "Observations", colClass: "col-md-4" },
                  ]}
                />
              )}

              {activeStep === 'affectations' && (
                <RepeatableTable
                  title="Historique des affectations" field="affectations" emptyRow={EMPTY_AFFECTATION} rows={formData.affectations}
                  onAddRow={handleAddRow} onRemoveRow={handleRemoveRow} onRowChange={handleRowChange}
                  columns={[
                    { key: "unite", label: "Unité", colClass: "col-md-4" },
                    { key: "fonction", label: "Fonction", colClass: "col-md-4" },
                    { key: "acDuLe", label: "À/C du", colClass: "col-md-4" },
                    { key: "refDecision", label: "Réf décision", colClass: "col-md-4" },
                    { key: "motif", label: "Motif", colClass: "col-md-4", options: MOTIFS_AFFECTATION },
                    { key: "dateDisponibilite", label: "Date disponibilité", colClass: "col-md-4" },
                    { key: "referenceCR", label: "Référence CR disponibilité", colClass: "col-md-12" },
                  ]}
                />
              )}

              {activeStep === 'sanitaire' && (
                <>
                  <p className="subgroup-label">PATC</p>
                  <div className="row">
                    <Field label="Référence (n° et date)" name="reference" value={formData.sanitairePATC.reference} onChange={handleNestedChange('sanitairePATC')} colClass="col-md-6" />
                    <Field label="Médecin traitant" name="medecinTraitant" value={formData.sanitairePATC.medecinTraitant} onChange={handleNestedChange('sanitairePATC')} colClass="col-md-6" />
                    <Field label="Nombre PATC" name="nombrePATC" value={formData.sanitairePATC.nombrePATC} onChange={handleNestedChange('sanitairePATC')} colClass="col-md-4" />
                    <Field label="Date début PATC" name="dateDebutPATC" value={formData.sanitairePATC.dateDebutPATC} onChange={handleNestedChange('sanitairePATC')} colClass="col-md-4" />
                    <Field label="Renouvelable" name="renouvelable" value={formData.sanitairePATC.renouvelable} onChange={handleNestedChange('sanitairePATC')} options={["Oui", "Non"]} colClass="col-md-4" />
                  </div>
                  <p className="subgroup-label">CREFA</p>
                  <div className="row">
                    <Field label="Référence (n° et date)" name="reference" value={formData.sanitaireCREFA.reference} onChange={handleNestedChange('sanitaireCREFA')} colClass="col-md-6" />
                    <Field label="Type" name="type" value={formData.sanitaireCREFA.type} onChange={handleNestedChange('sanitaireCREFA')} colClass="col-md-6" />
                    <Field label="Référence envoi CREFA" name="referenceEnvoiCREFA" value={formData.sanitaireCREFA.referenceEnvoiCREFA} onChange={handleNestedChange('sanitaireCREFA')} colClass="col-md-6" />
                    <Field label="Référence envoi finance" name="referenceEnvoiFinance" value={formData.sanitaireCREFA.referenceEnvoiFinance} onChange={handleNestedChange('sanitaireCREFA')} colClass="col-md-6" />
                    <Field label="Observation" name="observation" value={formData.sanitaireCREFA.observation} onChange={handleNestedChange('sanitaireCREFA')} colClass="col-md-12" />
                  </div>
                </>
              )}

              {activeStep === 'relations' && (
                <RepeatableTable
                  title="Relations gênantes" hint="Famille, propriétés, troupeaux dans une zone sensible..."
                  field="relationsInterets" emptyRow={EMPTY_RELATION} rows={formData.relationsInterets}
                  onAddRow={handleAddRow} onRemoveRow={handleRemoveRow} onRowChange={handleRowChange}
                  columns={[
                    { key: "type", label: "Type", colClass: "col-md-6" },
                    { key: "districtRegion", label: "District et région", colClass: "col-md-6" },
                  ]}
                />
              )}

              {activeStep === 'pieces' && (
                <div className="row">
                  <Field label="Nombre pièces jointes" name="nombrePiecesJointes" value={formData.nombrePiecesJointes} onChange={handleChange} colClass="col-md-6" />
                  <Field label="Nombre feuilles supplémentaires" name="nombreFeuillesSupplementaires" value={formData.nombreFeuillesSupplementaires} onChange={handleChange} colClass="col-md-6" />
                </div>
              )}

              <div className="cadre-form-actions mt-4">
                <button className="btn btn-outline-secondary btn-sm" onClick={goPrev} disabled={stepIndex === 0}>
                  <i className="fa fa-arrow-left me-1"></i> Précédent
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={goNext} disabled={stepIndex === STEP_DEFS.length - 1}>
                  Suivant <i className="fa fa-arrow-right ms-1"></i>
                </button>
                <div className="ms-auto">
                  {!editingId ? (
                    <button className="btn btn-primary" onClick={handleAddCadre}>
                      <i className="fa fa-check me-1"></i> Créer la fiche
                    </button>
                  ) : (
                    <button className="btn btn-success" onClick={handleModifCadre}>
                      <i className="fa fa-check me-1"></i> Enregistrer les modifications
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===================== TABLEAU ===================== */}
          <div className="col-lg-4">
            <div className="cadre-section-panel" style={{ position: 'sticky', top: '1rem' }}>
              <div className="section-eyebrow" style={{ borderBottomColor: 'var(--cadre-border)' }}>
                <span className="title"><i className="fa fa-users me-2"></i>Cadres enregistrés</span>
              </div>
              <input
                type="text" className="form-control mb-3" placeholder="Rechercher un cadre..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
              <DataTable
                columns={columns}
                data={filteredCadres}
                pagination
                highlightOnHover
                striped
                noDataComponent={
                  <div className="empty-state">
                    <i className="fa fa-user-slash"></i>
                    Aucun cadre à afficher
                  </div>
                }
                customStyles={customStyles}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const customStyles = {
  headCells: { style: { fontSize: '13px', fontWeight: 'bold' } },
  cells: { style: { fontSize: '13px' } },
  stripedStyle: { style: { backgroundColor: '#f8f9fb' } },
};

export default CadreFormBootstrap;
