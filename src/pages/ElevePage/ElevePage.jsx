import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import eleveService from '../../services/eleveService';
import specialiteService from '../../services/specialiteService';
import { useNavigate } from 'react-router-dom';
import courService from '../../services/courService';
import Swal from 'sweetalert2';

// ─── Composants UI réutilisables ──────────────────────────────────────────────

const SectionCard = ({ title, icon, children, accent = '#3b82f6' }) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    marginBottom: '20px',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 18px',
      background: `linear-gradient(135deg, ${accent}12, ${accent}06)`,
      borderBottom: `2px solid ${accent}28`,
    }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontWeight: '700', fontSize: '12px', color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
    </div>
    <div style={{ padding: '18px' }}>{children}</div>
  </div>
);

const FieldGroup = ({ label, required, children, hint }) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={{
      display: 'block', fontSize: '11px', fontWeight: '600',
      color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px'
    }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
    </label>
    {children}
    {hint && <small style={{ color: '#9ca3af', fontSize: '11px', marginTop: '3px', display: 'block' }}>{hint}</small>}
  </div>
);

const InlineRadioGroup = ({ options, name, value, onChange, labelMap = {} }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
    {options.map(opt => (
      <label key={opt} style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px', borderRadius: '20px',
        border: `1.5px solid ${value === opt ? '#3b82f6' : '#d1d5db'}`,
        background: value === opt ? '#eff6ff' : '#fff',
        cursor: 'pointer', fontSize: '13px',
        fontWeight: value === opt ? '600' : '400',
        color: value === opt ? '#1d4ed8' : '#374151',
        transition: 'all 0.15s ease', userSelect: 'none'
      }}>
        <input type="radio" name={name} value={opt} checked={value === opt} onChange={onChange} style={{ display: 'none' }} />
        {labelMap[opt] || opt}
      </label>
    ))}
  </div>
);

const CheckPill = ({ label, checked, onChange }) => (
  <label style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '5px 12px', borderRadius: '20px',
    border: `1.5px solid ${checked ? '#10b981' : '#d1d5db'}`,
    background: checked ? '#ecfdf5' : '#fff',
    cursor: 'pointer', fontSize: '13px',
    fontWeight: checked ? '600' : '400',
    color: checked ? '#059669' : '#374151',
    transition: 'all 0.15s ease', userSelect: 'none'
  }}>
    <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
    {checked ? '✓ ' : ''}{label}
  </label>
);

const TabButton = ({ id, label, icon, active, onClick, count }) => (
  <button type="button" onClick={() => onClick(id)} style={{
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '12px 20px', border: 'none',
    borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent',
    background: 'none',
    color: active ? '#1d4ed8' : '#6b7280',
    fontWeight: active ? '700' : '500', fontSize: '13px',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  }}>
    <span style={{ fontSize: '16px' }}>{icon}</span>
    <span>{label}</span>
    {count !== undefined && (
      <span style={{
        background: active ? '#3b82f6' : '#e5e7eb',
        color: active ? '#fff' : '#6b7280',
        borderRadius: '10px', fontSize: '10px', fontWeight: '700',
        padding: '1px 6px', minWidth: '18px', textAlign: 'center'
      }}>{count}</span>
    )}
  </button>
);

// ─── MembreFamilleCard défini hors du composant parent ────────────────────────
const MembreFamilleCard = ({ label, membreKey, icon, accent, formData, setFormData }) => {
  const membre = formData.famille?.[membreKey] || {};
  const estFDS = membre.estFDS === true || membre.estFDS === 'true';

  const update = (field, value) => {
    setFormData(prev => ({
      ...prev,
      famille: {
        ...prev.famille,
        [membreKey]: { ...(prev.famille?.[membreKey] || {}), [field]: value }
      }
    }));
  };

  return (
    <SectionCard title={label} icon={icon} accent={accent}>
      <FieldGroup label="Nom et Prénoms">
        <input className="form-control form-control-sm" value={membre.nom || ''} onChange={e => update('nom', e.target.value)} placeholder="Nom complet" />
      </FieldGroup>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <FieldGroup label="Téléphone">
          <input className="form-control form-control-sm" value={membre.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="Tél" />
        </FieldGroup>
        <FieldGroup label="Adresse">
          <input className="form-control form-control-sm" value={membre.adresse || ''} onChange={e => update('adresse', e.target.value)} placeholder="Adresse" />
        </FieldGroup>
      </div>
      <FieldGroup label="Profession" hint="Ex: ministre, commerçant(e), enseignant(e)...">
        <input className="form-control form-control-sm" value={membre.profession || ''} onChange={e => update('profession', e.target.value)} placeholder="Profession" />
      </FieldGroup>
      <div style={{ marginBottom: estFDS ? '10px' : '0' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
          border: `1.5px solid ${estFDS ? '#dc2626' : '#d1d5db'}`,
          background: estFDS ? '#fef2f2' : '#f9fafb',
          fontSize: '12px', fontWeight: estFDS ? '700' : '500',
          color: estFDS ? '#991b1b' : '#6b7280', userSelect: 'none'
        }}>
          <input type="checkbox" checked={estFDS} onChange={e => update('estFDS', e.target.checked)} style={{ display: 'none' }} />
          🎖️ {estFDS ? 'Membre FDS ✓' : 'Membre FDS ?'}
        </label>
      </div>
      {estFDS && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginTop: '8px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.04em' }}>
            🎖️ Détails FDS (Gendarme, Tafika, Police...)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <FieldGroup label="Grade">
              <input className="form-control form-control-sm" value={membre.gradeFDS || ''} onChange={e => update('gradeFDS', e.target.value)} placeholder="Ex: Adjudant, Lieutenant..." />
            </FieldGroup>
            <FieldGroup label="Poste / Affectation">
              <input className="form-control form-control-sm" value={membre.posteFDS || ''} onChange={e => update('posteFDS', e.target.value)} placeholder="Ex: Gendarmerie Antananarivo" />
            </FieldGroup>
          </div>
        </div>
      )}
    </SectionCard>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────

const ElevePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('identite');
  const [imagePreview, setImagePreview] = useState('');
  const [coursList, setCoursList] = useState([]);
  const [specialites, setSpecialites] = useState([{ categorie: '', detail: '', niveauQualification: '' }]);

  const [formData, setFormData] = useState({
    numCandidature: '', numeroIncorporation: '', escadron: '', peloton: '',
    cour: '', matricule: '', centreConcours: '', Specialiste: '',
    genreConcours: '', SpecialisteAptitude: '', nom: '', prenom: '',
    dateNaissance: '', lieuNaissance: '', CIN: '', dateDelivrance: '',
    lieuDelivrance: '', lieuDuplicata: '', duplicata: '', sports: [],
    facebook: '', religion: '', niveau: '', niveaufiliere: '',
    groupeSaguin: '', fady: '', sexe: '', relationGenante: '',
    situationFamiliale: '', telephone1: '', telephone2: '', telephone3: '',
    Diplome: {}, Filiere: {},
    Pointure: { tailleChemise: '', tourTete: '', pointurePantalon: '', pointureChaussure: '' },
    famille: {
      conjointe: { nom: '', phone: '', adresse: '', profession: '', estFDS: false, gradeFDS: '', posteFDS: '' },
      pere: { nom: '', phone: '', adresse: '', profession: '', estFDS: false, gradeFDS: '', posteFDS: '' },
      mere: { nom: '', phone: '', adresse: '', profession: '', estFDS: false, gradeFDS: '', posteFDS: '' },
      accident: { nom: '', phone: '', adresse: '', profession: '' },
      enfants: [],
      frere: [],
      soeur: [],
    },
    image: null,
  });

  // ─── Chargement des cours ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCours = async () => {
      try {
        const res = await courService.getAll();
        const data = res.data.sort((a, b) => b.cour - a.cour);
        setCoursList(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, cour: data[0].cour }));
      } catch (err) {
        console.error('Erreur cours', err);
      }
    };
    fetchCours();
  }, []);

  // ─── Image ───────────────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (png, jpg, jpeg, webp)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 500, maxH = 500;
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxW) { h *= maxW / w; w = maxW; } }
        else { if (h > maxH) { w *= maxH / h; h = maxH; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const isJPEG = file.type === 'image/jpeg' || file.type === 'image/jpg';
        canvas.toBlob((blob) => {
          const resized = new File([blob], file.name, { type: isJPEG ? 'image/jpeg' : 'image/png', lastModified: Date.now() });
          setFormData(prev => ({ ...prev, image: resized }));
          setImagePreview(URL.createObjectURL(resized));
        }, isJPEG ? 'image/jpeg' : 'image/png', isJPEG ? 0.7 : 1.0);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ─── handleChange générique ──────────────────────────────────────────────────
  const handleChange = (e, index = null) => {
    const { name, value } = e.target;
    if (name.startsWith('famille.enfants')) {
      const field = name.split('.')[2];
      const arr = [...formData.famille.enfants];
      arr[index][field] = value;
      setFormData(prev => ({ ...prev, famille: { ...prev.famille, enfants: arr } }));
    } else if (name.startsWith('famille.soeur')) {
      const field = name.split('.')[2];
      const arr = [...formData.famille.soeur];
      arr[index][field] = value;
      setFormData(prev => ({ ...prev, famille: { ...prev.famille, soeur: arr } }));
    } else if (name.startsWith('famille.frere')) {
      const field = name.split('.')[2];
      const arr = [...formData.famille.frere];
      arr[index][field] = value;
      setFormData(prev => ({ ...prev, famille: { ...prev.famille, frere: arr } }));
    } else if (name.startsWith('famille.')) {
      const path = name.split('.');
      setFormData(prev => ({ ...prev, famille: { ...prev.famille, [path[1]]: { ...prev.famille[path[1]], [path[2]]: value } } }));
    } else if (name.startsWith('Pointure.')) {
      const [, field] = name.split('.');
      setFormData(prev => ({ ...prev, Pointure: { ...prev.Pointure, [field]: value } }));
    } else if (name.startsWith('Filiere.')) {
      const [, field] = name.split('.');
      setFormData(prev => ({ ...prev, Filiere: { ...(prev.Filiere || {}), [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneChange = (e, key) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, [key]: v }));
  };

  // ─── Spécialités ────────────────────────────────────────────────────────────
  const ajouterSpecialite = () => setSpecialites(prev => [...prev, { categorie: '', detail: '', niveauQualification: '' }]);
  const supprimerSpecialite = (index) => {
    if (specialites.length === 1) { setSpecialites([{ categorie: '', detail: '', niveauQualification: '' }]); return; }
    setSpecialites(prev => prev.filter((_, i) => i !== index));
  };
  const handleSpecialiteChange = (index, field, value) =>
    setSpecialites(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });

  // ─── Famille ────────────────────────────────────────────────────────────────
  const ajouterEnfant = () => setFormData(prev => ({ ...prev, famille: { ...prev.famille, enfants: [...prev.famille.enfants, { nom: '' }] } }));
  const supprimerEnfant = (i) => setFormData(prev => { const a = [...prev.famille.enfants]; a.splice(i, 1); return { ...prev, famille: { ...prev.famille, enfants: a } }; });
  const ajouterFrere = () => setFormData(prev => ({ ...prev, famille: { ...prev.famille, frere: [...prev.famille.frere, { nom: '', profession: '', estFDS: false, gradeFDS: '', posteFDS: '' }] } }));
  const supprimerFrere = (i) => setFormData(prev => { const a = [...prev.famille.frere]; a.splice(i, 1); return { ...prev, famille: { ...prev.famille, frere: a } }; });
  const ajouterSoeur = () => setFormData(prev => ({ ...prev, famille: { ...prev.famille, soeur: [...prev.famille.soeur, { nom: '', profession: '', estFDS: false, gradeFDS: '', posteFDS: '' }] } }));
  const supprimerSoeur = (i) => setFormData(prev => { const a = [...prev.famille.soeur]; a.splice(i, 1); return { ...prev, famille: { ...prev.famille, soeur: a } }; });

  const updateFrere = (index, field, value) => {
    const arr = [...formData.famille.frere];
    arr[index] = { ...arr[index], [field]: value };
    setFormData(prev => ({ ...prev, famille: { ...prev.famille, frere: arr } }));
  };
  const updateSoeur = (index, field, value) => {
    const arr = [...formData.famille.soeur];
    arr[index] = { ...arr[index], [field]: value };
    setFormData(prev => ({ ...prev, famille: { ...prev.famille, soeur: arr } }));
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const creerEleveEtSpecialites = async (fd) => {
    const response = await eleveService.post(fd);
    const newId = response.data?.id;
    const filtrees = specialites.filter(sp => sp.categorie.trim() !== '');
    if (newId && filtrees.length > 0) await specialiteService.bulkCreate(newId, { specialites: filtrees });
    await Swal.fire('Ajouté!', "L'élève a été ajouté avec succès.", 'success');
    navigate('/eleve/listeEleveGendarme');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.escadron || !formData.peloton || !formData.CIN || !formData.numeroIncorporation || !formData.genreConcours) {
      Swal.fire({ title: 'Champs obligatoires manquants', text: 'Veuillez remplir tous les champs obligatoires.', icon: 'error', confirmButtonColor: '#d33' });
      return;
    }
    const result = await Swal.fire({
      title: 'Confirmer lajout', icon: 'question',
      showCancelButton: true, confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6c757d', confirmButtonText: 'Oui, ajouter',
      cancelButtonText: 'Annuler'
    });
    if (!result.isConfirmed) return;

    try {
      const fd = new FormData();
      const skip = ['image', 'famille', 'Diplome', 'Filiere', 'Pointure', 'sports'];
      for (const key in formData) {
        if (skip.includes(key)) continue;
        if (formData[key] !== undefined && formData[key] !== null) fd.append(key, formData[key]);
      }
      fd.append('famille', JSON.stringify(formData.famille));
      fd.append('Diplome', JSON.stringify(formData.Diplome));
      fd.append('Filiere', JSON.stringify(formData.Filiere));
      fd.append('Pointure', JSON.stringify(formData.Pointure));
      fd.append('sports', JSON.stringify(formData.sports));
      if (formData.image) fd.append('image', formData.image);

      try {
        const res = await eleveService.getByInc(formData.numeroIncorporation, formData.cour);
        if (res.data.eleve) {
          Swal.fire('Échec', 'Un élève avec cette incorporation et ce cours existe déjà.', 'warning');
          return;
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          Swal.fire('Erreur', 'Impossible de vérifier lexistence de lélève', 'error');
          return;
        }
      }
      await creerEleveEtSpecialites(fd);
    } catch (error) {
      console.error('Erreur handleSubmit:', error);
      Swal.fire('Erreur serveur', 'Une erreur s est produite.', 'error');
    }
  };

  // ─── Tabs config ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'identite', label: 'Identité', icon: '👤' },
    { id: 'militaire', label: 'Militaire', icon: '🎖️' },
    { id: 'formation', label: 'Formation', icon: '🎓', count: Object.values(formData.Diplome || {}).filter(Boolean).length || undefined },
    { id: 'aptitudes', label: 'Aptitudes', icon: '⚡', count: specialites.filter(s => s.categorie).length || undefined },
    { id: 'famille', label: 'Famille', icon: '👨‍👩‍👧‍👦' },
    { id: 'effets', label: 'Effets', icon: '👗' },
  ];

  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* ── Header de page ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '20px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Photo preview */}
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            <img
              src={imagePreview || '/images/egna.jpg'}
              alt="Photo"
              style={{
                width: '56px', height: '56px', borderRadius: '10px',
                objectFit: 'cover', border: '2px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <div style={{
              position: 'absolute', bottom: '-3px', right: '-3px',
              background: '#3b82f6', borderRadius: '50%',
              width: '20px', height: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', border: '2px solid #fff', color: '#fff'
            }}>📷</div>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} required />
          </label>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
              Nouvelle Fiche Élève Gendarme
            </h1>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
              <select
                style={{
                  fontSize: '12px', fontWeight: '600', padding: '2px 10px',
                  borderRadius: '20px', border: '1.5px solid #d1d5db',
                  background: '#f9fafb', color: '#374151', cursor: 'pointer'
                }}
                name="cour" value={formData.cour} onChange={handleChange} required
              >
                {coursList.map(item => <option key={item.id} value={item.cour}>{item.cour}</option>)}
              </select>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Cliquez sur la photo pour changer l'image</span>
            </div>
          </div>
        </div>

        {/* Bouton valider */}
        <button
          type="button" onClick={handleSubmit}
          style={{
            padding: '10px 24px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(34,197,94,0.35)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          ✅ Valider la fiche
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ background: '#fff', padding: '0 32px 0', borderBottom: '1px solid #e2e8f0' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '0' }}>
          {tabs.map(tab => <TabButton key={tab.id} {...tab} active={activeTab === tab.id} onClick={setActiveTab} />)}
        </div>
        {/* Progress */}
        <div style={{ height: '3px', background: '#e5e7eb', margin: '0 -32px' }}>
          <div style={{
            height: '100%', transition: 'width 0.3s ease',
            background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
            width: `${((currentTabIndex + 1) / tabs.length) * 100}%`
          }} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>

          {/* ═══ TAB: IDENTITÉ ════════════════════════════════════════════════ */}
          {activeTab === 'identite' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              <SectionCard title="État civil" icon="📋" accent="#3b82f6">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FieldGroup label="Nom" required>
                    <input className="form-control" name="nom" value={formData.nom} onChange={handleChange} placeholder="NOM" style={{ textTransform: 'uppercase', fontWeight: '600' }} />
                  </FieldGroup>
                  <FieldGroup label="Prénom" required>
                    <input className="form-control" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Prénom" />
                  </FieldGroup>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FieldGroup label="Date de naissance">
                    <input type="date" className="form-control" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} />
                  </FieldGroup>
                  <FieldGroup label="Lieu de naissance">
                    <input className="form-control" name="lieuNaissance" value={formData.lieuNaissance} onChange={handleChange} placeholder="Ville" />
                  </FieldGroup>
                </div>
                <FieldGroup label="Sexe">
                  <InlineRadioGroup options={['Masculin', 'Feminin']} name="sexe" value={formData.sexe} onChange={handleChange} labelMap={{ Feminin: 'Féminin' }} />
                </FieldGroup>
                <FieldGroup label="Situation de famille">
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {[{ v: 'Celibataire', l: 'Célibataire' }, { v: 'Marie', l: 'Marié(e)' }, { v: 'Divorce', l: 'Divorcé(e)' }].map(({ v, l }) => (
                      <CheckPill key={v} label={l} checked={formData.situationFamiliale === v} onChange={() => setFormData(p => ({ ...p, situationFamiliale: v }))} />
                    ))}
                  </div>
                </FieldGroup>
                <FieldGroup label="Foko (ethnie)">
                  <select className="form-select" name="fady" value={formData.fady} onChange={handleChange}>
                    <option value="">— Sélectionner —</option>
                    {["ANTAIFASY","ANTAIMORO","ANTAMBAHOAKA","ANTANDROY","ANTANOSY","ANTAKARANA","BARA","BEZANOZANO","BETSILEO","BETSIMISARAKA","MAHAFALY","MERINA","MIKEA","SAKALAVA","SIHANAKA","TANALA","TSIMIHETY","VEZO"].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </FieldGroup>
              </SectionCard>

              <div>
                <SectionCard title="Pièce d'identité (CIN)" icon="🪪" accent="#8b5cf6">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <FieldGroup label="Numéro CIN" required>
                      <input className="form-control" name="CIN" value={formData.CIN} onChange={handleChange} placeholder="N° CIN" />
                    </FieldGroup>
                    <FieldGroup label="Date de délivrance">
                      <input type="date" className="form-control" name="dateDelivrance" value={formData.dateDelivrance} onChange={handleChange} />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Lieu de délivrance">
                    <input className="form-control" name="lieuDelivrance" value={formData.lieuDelivrance} onChange={handleChange} placeholder="Lieu" />
                  </FieldGroup>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <FieldGroup label="Duplicata (date)">
                      <input type="date" className="form-control" name="duplicata" value={formData.duplicata} onChange={handleChange} />
                    </FieldGroup>
                    <FieldGroup label="Lieu duplicata">
                      <input className="form-control" name="lieuDuplicata" value={formData.lieuDuplicata} onChange={handleChange} placeholder="Lieu" />
                    </FieldGroup>
                  </div>
                </SectionCard>

                <SectionCard title="Contacts" icon="📱" accent="#10b981">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {['telephone1', 'telephone2', 'telephone3'].map((k, i) => (
                      <FieldGroup key={k} label={`Tél ${i + 1}`}>
                        <input className="form-control" placeholder="03X XX XXX XX" maxLength="11" value={formData[k] || ''} onChange={e => handlePhoneChange(e, k)} />
                      </FieldGroup>
                    ))}
                  </div>
                  <FieldGroup label="Loisirs" hint="Activités, passions, centres d'intérêt">
                    <input className="form-control" name="facebook" value={formData.facebook} onChange={handleChange} placeholder="Ex: Lecture, Musique..." />
                  </FieldGroup>
                </SectionCard>
              </div>
            </div>
          )}

          {/* ═══ TAB: MILITAIRE ═══════════════════════════════════════════════ */}
          {activeTab === 'militaire' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              <SectionCard title="Affectation & Unité" icon="🎖️" accent="#f59e0b">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <FieldGroup label="N° Candidature">
                    <input className="form-control" name="numCandidature" value={formData.numCandidature} onChange={handleChange} />
                  </FieldGroup>
                  <FieldGroup label="N° Incorporation" required>
                    <input className="form-control" name="numeroIncorporation" value={formData.numeroIncorporation} onChange={handleChange} />
                  </FieldGroup>
                  <FieldGroup label="Matricule">
                    <input className="form-control" name="matricule" value={formData.matricule} onChange={handleChange} />
                  </FieldGroup>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FieldGroup label="Escadron" required>
                    <select className="form-select" name="escadron" value={formData.escadron} onChange={handleChange}>
                      <option value="">— Sélectionner —</option>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Peloton" required>
                    <select className="form-select" name="peloton" value={formData.peloton} onChange={handleChange}>
                      <option value="">— Sélectionner —</option>
                      {[1, 2, 3].map(i => <option key={i} value={String(i)}>{i}</option>)}
                    </select>
                  </FieldGroup>
                </div>
                <FieldGroup label="Relation(s) gênante(s)" hint="Toerana tsy tokony hiasana">
                  <textarea className="form-control" name="relationGenante" rows="3" value={formData.relationGenante} onChange={handleChange} placeholder="Préciser si applicable..." />
                </FieldGroup>
              </SectionCard>

              <SectionCard title="Concours" icon="📝" accent="#ef4444">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FieldGroup label="Centre de concours">
                    <input className="form-control" name="centreConcours" value={formData.centreConcours} onChange={handleChange} />
                  </FieldGroup>
                  <FieldGroup label="Genre de concours" required>
                    <select className="form-select" name="genreConcours" value={formData.genreConcours} onChange={handleChange}>
                      <option value="">— Choisir —</option>
                      <option value="ordinaire">Ordinaire</option>
                      <option value="veuve">Veuve</option>
                      <option value="orphelin">Orphelin</option>
                      <option value="ex-militaire">Ex-militaire</option>
                      <option value="specialiste">Spécialiste</option>
                    </select>
                  </FieldGroup>
                </div>

                {formData.genreConcours === 'specialiste' && (
                  <FieldGroup label="Spécialité (concours)">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      {['Info-Telecom', 'topo', 'mecanicien', 'infrastructure', 'sport', 'plombier'].map(val => (
                        <label key={val} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '7px 12px', borderRadius: '8px',
                          border: `1.5px solid ${formData.Specialiste === val ? '#3b82f6' : '#e5e7eb'}`,
                          background: formData.Specialiste === val ? '#eff6ff' : '#fff',
                          cursor: 'pointer', fontSize: '13px',
                          fontWeight: formData.Specialiste === val ? '600' : '400',
                          userSelect: 'none'
                        }}>
                          <input type="radio" name="Specialiste" value={val} checked={formData.Specialiste === val} onChange={handleChange} style={{ accentColor: '#3b82f6' }} />
                          {val}
                        </label>
                      ))}
                    </div>
                  </FieldGroup>
                )}
              </SectionCard>
            </div>
          )}

          {/* ═══ TAB: FORMATION ═══════════════════════════════════════════════ */}
          {activeTab === 'formation' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              <SectionCard title="Niveau d'études" icon="📚" accent="#6366f1">
                <FieldGroup label="Dernière classe suivie">
                  <select className="form-select" name="niveau" value={formData.niveau} onChange={handleChange}>
                    <option value="">— Sélectionner —</option>
                    {["BACC","BACC +1","BACC +2","BACC +3","BACC +4","BACC +5","BACC +6","BACC +7","BACC +8"].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </FieldGroup>
                <FieldGroup label="Filière">
                  <input className="form-control" name="niveaufiliere" value={formData.niveaufiliere} onChange={handleChange} placeholder="Ex: Informatique, Droit..." />
                </FieldGroup>
              </SectionCard>

              <SectionCard title="Diplômes obtenus" icon="🏅" accent="#f59e0b">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { label: 'CEPE', key: 'CEPE' }, { label: 'BEPC', key: 'BEPC' },
                    { label: 'BACC S', key: 'BACC_S' }, { label: 'BACC L', key: 'BACC_L' },
                    { label: 'BACC Technique', key: 'BACC_TECHNIQUE' }, { label: 'Licence', key: 'Licence' },
                    { label: 'Master 1', key: 'MasterOne' }, { label: 'Master 2', key: 'MasterTwo' },
                    { label: 'Doctorat', key: 'Doctorat' },
                  ].map(({ label, key }) => (
                    <CheckPill key={key} label={label}
                      checked={formData.Diplome?.[key] || false}
                      onChange={e => setFormData(prev => ({ ...prev, Diplome: { ...(prev.Diplome || {}), [key]: e.target.checked } }))}
                    />
                  ))}
                </div>
                {["Licence", "MasterOne", "MasterTwo", "Doctorat"].some(k => formData.Diplome?.[k]) && (
                  <div style={{ marginTop: '16px', borderTop: '1px dashed #e5e7eb', paddingTop: '14px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px' }}>Filières associées</p>
                    {["Licence", "MasterOne", "MasterTwo", "Doctorat"].map(k =>
                      formData.Diplome?.[k] && (
                        <FieldGroup key={k} label={k.replace(/([A-Z])/g, ' $1').trim()}>
                          <input className="form-control form-control-sm" name={`Filiere.filiere${k}`} value={formData.Filiere?.[`filiere${k}`] || ''} onChange={handleChange} placeholder="Filière..." />
                        </FieldGroup>
                      )
                    )}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* ═══ TAB: APTITUDES ═══════════════════════════════════════════════ */}
          {activeTab === 'aptitudes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              <SectionCard title="Spécialités & Aptitudes" icon="⚡" accent="#8b5cf6">
                {specialites.map((sp, index) => (
                  <div key={index} style={{
                    background: '#f8fafc', border: '1.5px solid #e2e8f0',
                    borderRadius: '10px', padding: '14px', marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Spécialité {index + 1}
                      </span>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerSpecialite(index)} style={{ padding: '2px 8px', fontSize: '12px', borderRadius: '6px' }}>🗑️</button>
                    </div>
                    <FieldGroup label="Domaine">
                      <input className="form-control form-control-sm" placeholder="Ex: Informatique, BTP, Sport..." value={sp.categorie} onChange={e => handleSpecialiteChange(index, 'categorie', e.target.value)} />
                    </FieldGroup>
                    <FieldGroup label="Détail">
                      <input className="form-control form-control-sm" placeholder="Ex: Génie logiciel, Électricien..." value={sp.detail} onChange={e => handleSpecialiteChange(index, 'detail', e.target.value)} />
                    </FieldGroup>
                    <FieldGroup label="Niveau">
                      <select className="form-select form-select-sm" value={sp.niveauQualification} onChange={e => handleSpecialiteChange(index, 'niveauQualification', e.target.value)}>
                        <option value="">— Niveau de qualification —</option>
                        <option value="Licencié">Licencié (diplôme / certificat / licence sportive)</option>
                        <option value="En cours de licence">En cours de licence</option>
                        <option value="Autodidacte">Autodidacte (sans titre officiel)</option>
                      </select>
                    </FieldGroup>
                  </div>
                ))}
                <button type="button" className="btn btn-outline-primary btn-sm w-100" onClick={ajouterSpecialite} style={{ borderRadius: '8px', fontWeight: '600', borderStyle: 'dashed' }}>
                  + Ajouter une spécialité / aptitude
                </button>
              </SectionCard>

              <div>
                <SectionCard title="Sports pratiqués" icon="🏅" accent="#10b981">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {["Football", "Basketball", "Volley_ball", "Musculation", "Rugby", "Athletisme", "Tennis", "ArtsMartiaux", "Autre"].map(sport => (
                      <CheckPill key={sport} label={sport.replace('_', ' ')}
                        checked={formData.sports?.includes(sport)}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormData(prev => {
                            const s = new Set(prev.sports || []);
                            checked ? s.add(sport) : s.delete(sport);
                            return { ...prev, sports: Array.from(s) };
                          });
                        }}
                      />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Religion" icon="✝️" accent="#f59e0b">
                  <InlineRadioGroup options={["EKAR", "FJKM", "FLM", "ISLAM", "Autre"]} name="religion" value={formData.religion} onChange={handleChange} />
                </SectionCard>

                <SectionCard title="Groupe sanguin" icon="🩸" accent="#ef4444">
                  <InlineRadioGroup options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} name="groupeSaguin" value={formData.groupeSaguin} onChange={handleChange} />
                </SectionCard>
              </div>
            </div>
          )}

          {/* ═══ TAB: FAMILLE ═════════════════════════════════════════════════ */}
          {activeTab === 'famille' && (
            <div>
              {/* Membres principaux */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '4px' }}>
                <MembreFamilleCard label="Conjoint(e)" membreKey="conjointe" icon="💑" accent="#6366f1" formData={formData} setFormData={setFormData} />
                <MembreFamilleCard label="Père (Ray)" membreKey="pere" icon="👨" accent="#3b82f6" formData={formData} setFormData={setFormData} />
                <MembreFamilleCard label="Mère (Reny)" membreKey="mere" icon="👩" accent="#ec4899" formData={formData} setFormData={setFormData} />
                <MembreFamilleCard label="À prévenir en cas d'accident" membreKey="accident" icon="🚨" accent="#ef4444" formData={formData} setFormData={setFormData} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Enfants */}
                <SectionCard title="Enfants légitimes" icon="👶" accent="#10b981">
                  {formData.famille?.enfants?.map((enfant, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', minWidth: '20px', fontWeight: '600' }}>{i + 1}.</span>
                      <input className="form-control form-control-sm" name="famille.enfants.nom" value={enfant.nom} onChange={e => handleChange(e, i)} placeholder="Nom et prénoms" style={{ flex: 1 }} />
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerEnfant(i)} style={{ padding: '2px 8px' }}>🗑️</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-success btn-sm w-100 mt-1" onClick={ajouterEnfant} style={{ borderRadius: '8px', borderStyle: 'dashed' }}>+ Ajouter un enfant</button>
                </SectionCard>

                {/* Frères & Sœurs */}
                <SectionCard title="Frères & Sœurs" icon="👫" accent="#f59e0b">
                  {/* Frères */}
                  {formData.famille.frere.length > 0 && (
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>Frères</p>
                  )}
                  {formData.famille.frere.map((f, i) => {
                    const estFDS = f.estFDS === true || f.estFDS === 'true';
                    return (
                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>Frère {i + 1}</span>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerFrere(i)} style={{ padding: '1px 7px', fontSize: '12px' }}>🗑️</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Nom</label>
                            <input className="form-control form-control-sm" value={f.nom || ''} onChange={e => updateFrere(i, 'nom', e.target.value)} placeholder="Nom et prénoms" />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Profession</label>
                            <input className="form-control form-control-sm" value={f.profession || ''} onChange={e => updateFrere(i, 'profession', e.target.value)} placeholder="Profession" />
                          </div>
                        </div>
                        <label style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                          border: `1.5px solid ${estFDS ? '#dc2626' : '#d1d5db'}`,
                          background: estFDS ? '#fef2f2' : '#f9fafb', fontSize: '11px',
                          fontWeight: estFDS ? '700' : '500', color: estFDS ? '#991b1b' : '#6b7280', userSelect: 'none'
                        }}>
                          <input type="checkbox" checked={estFDS} onChange={e => updateFrere(i, 'estFDS', e.target.checked)} style={{ display: 'none' }} />
                          🎖️ {estFDS ? 'Membre FDS ✓' : 'Membre FDS ?'}
                        </label>
                        {estFDS && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px', marginTop: '6px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ fontSize: '10px', fontWeight: '600', color: '#991b1b', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Grade</label>
                                <input className="form-control form-control-sm" value={f.gradeFDS || ''} onChange={e => updateFrere(i, 'gradeFDS', e.target.value)} placeholder="Ex: Adjudant..." />
                              </div>
                              <div>
                                <label style={{ fontSize: '10px', fontWeight: '600', color: '#991b1b', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Poste</label>
                                <input className="form-control form-control-sm" value={f.posteFDS || ''} onChange={e => updateFrere(i, 'posteFDS', e.target.value)} placeholder="Affectation" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button type="button" className="btn btn-outline-primary btn-sm w-100 mb-3" onClick={ajouterFrere} style={{ borderRadius: '8px', borderStyle: 'dashed' }}>+ Frère</button>

                  {/* Sœurs */}
                  {formData.famille.soeur.length > 0 && (
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>Sœurs</p>
                  )}
                  {formData.famille.soeur.map((s, i) => {
                    const estFDS = s.estFDS === true || s.estFDS === 'true';
                    return (
                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>Sœur {i + 1}</span>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerSoeur(i)} style={{ padding: '1px 7px', fontSize: '12px' }}>🗑️</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Nom</label>
                            <input className="form-control form-control-sm" value={s.nom || ''} onChange={e => updateSoeur(i, 'nom', e.target.value)} placeholder="Nom et prénoms" />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Profession</label>
                            <input className="form-control form-control-sm" value={s.profession || ''} onChange={e => updateSoeur(i, 'profession', e.target.value)} placeholder="Profession" />
                          </div>
                        </div>
                        <label style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                          border: `1.5px solid ${estFDS ? '#dc2626' : '#d1d5db'}`,
                          background: estFDS ? '#fef2f2' : '#f9fafb', fontSize: '11px',
                          fontWeight: estFDS ? '700' : '500', color: estFDS ? '#991b1b' : '#6b7280', userSelect: 'none'
                        }}>
                          <input type="checkbox" checked={estFDS} onChange={e => updateSoeur(i, 'estFDS', e.target.checked)} style={{ display: 'none' }} />
                          🎖️ {estFDS ? 'Membre FDS ✓' : 'Membre FDS ?'}
                        </label>
                        {estFDS && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px', marginTop: '6px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ fontSize: '10px', fontWeight: '600', color: '#991b1b', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Grade</label>
                                <input className="form-control form-control-sm" value={s.gradeFDS || ''} onChange={e => updateSoeur(i, 'gradeFDS', e.target.value)} placeholder="Ex: Adjudant..." />
                              </div>
                              <div>
                                <label style={{ fontSize: '10px', fontWeight: '600', color: '#991b1b', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Poste</label>
                                <input className="form-control form-control-sm" value={s.posteFDS || ''} onChange={e => updateSoeur(i, 'posteFDS', e.target.value)} placeholder="Affectation" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button type="button" className="btn btn-outline-primary btn-sm w-100" onClick={ajouterSoeur} style={{ borderRadius: '8px', borderStyle: 'dashed' }}>+ Sœur</button>
                </SectionCard>
              </div>
            </div>
          )}

          {/* ═══ TAB: EFFETS ══════════════════════════════════════════════════ */}
          {activeTab === 'effets' && (
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
              <SectionCard title="Pointure & Effets vestimentaires" icon="👗" accent="#ec4899">

                <FieldGroup label="Chemise / T-shirt" hint="Taille du haut">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {["XS", "S", "M", "L", "XL", "XXL"].map(t => {
                      const active = formData.Pointure?.tailleChemise === t;
                      return (
                        <button key={t} type="button"
                          onClick={() => setFormData(prev => ({ ...prev, Pointure: { ...prev.Pointure, tailleChemise: t } }))}
                          style={{
                            padding: '8px 16px', borderRadius: '8px',
                            border: `2px solid ${active ? '#ec4899' : '#e5e7eb'}`,
                            background: active ? '#fdf2f8' : '#fff',
                            color: active ? '#be185d' : '#374151',
                            fontWeight: active ? '700' : '500', fontSize: '13px', cursor: 'pointer'
                          }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </FieldGroup>

                <FieldGroup label="Tour de tête (cm)">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="number" className="form-control" name="Pointure.tourTete" value={formData.Pointure?.tourTete || ''} onChange={handleChange} min="28" max="60" placeholder="Ex: 54" style={{ maxWidth: '120px' }} />
                    <span style={{ fontSize: '13px', color: '#9ca3af' }}>cm</span>
                  </div>
                </FieldGroup>

                <FieldGroup label="Pointure pantalon">
                  <select className="form-select" name="Pointure.pointurePantalon" value={formData.Pointure?.pointurePantalon || ''} onChange={handleChange}>
                    <option value="">— Choisir —</option>
                    {[28, 30, 34, 36, 38, 40, 42, 44, 46, 48, 50].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FieldGroup>

                <FieldGroup label="Pointure chaussure">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[30, 34, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50].map(t => {
                      const active = Number(formData.Pointure?.pointureChaussure) === t;
                      return (
                        <button key={t} type="button"
                          onClick={() => setFormData(prev => ({ ...prev, Pointure: { ...prev.Pointure, pointureChaussure: t } }))}
                          style={{
                            padding: '5px 10px', borderRadius: '6px',
                            border: `1.5px solid ${active ? '#3b82f6' : '#e5e7eb'}`,
                            background: active ? '#eff6ff' : '#fff',
                            color: active ? '#1d4ed8' : '#374151',
                            fontWeight: active ? '700' : '400', fontSize: '12px', cursor: 'pointer'
                          }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </FieldGroup>

              </SectionCard>
            </div>
          )}

        </form>
      </div>

      {/* ── Footer navigation ── */}
      <div style={{
        position: 'sticky', bottom: 0, background: '#fff',
        borderTop: '1px solid #e5e7eb', padding: '12px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {currentTabIndex > 0 && (
            <button type="button" className="btn btn-outline-secondary btn-sm"
              onClick={() => setActiveTab(tabs[currentTabIndex - 1].id)}
              style={{ borderRadius: '8px' }}>← Précédent</button>
          )}
          {currentTabIndex < tabs.length - 1 && (
            <button type="button" className="btn btn-outline-primary btn-sm"
              onClick={() => setActiveTab(tabs[currentTabIndex + 1].id)}
              style={{ borderRadius: '8px' }}>Suivant →</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            Onglet {currentTabIndex + 1}/{tabs.length}
          </span>
          <button type="button" onClick={handleSubmit}
            style={{
              padding: '9px 22px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
            }}>
            ✅ Valider la fiche
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElevePage;
