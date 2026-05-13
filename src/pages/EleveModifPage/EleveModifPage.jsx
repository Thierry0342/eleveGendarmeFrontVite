import { Modal, Button, Form, Badge } from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import eleveService from '../../services/eleveService';
import specialiteService from '../../services/specialiteService';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const user = JSON.parse(localStorage.getItem('user'));

// ─── Helper : bordure orange si champ vide ────────────────────────────────────
const orangeIfEmpty = (val) => {
  const isEmpty = val === null || val === undefined || String(val).trim() === '';
  return isEmpty
    ? { borderColor: '#f97316', boxShadow: '0 0 0 0.2rem rgba(249,115,22,0.15)' }
    : {};
};

// ─── Helper : bordure orange TOUJOURS (ex : CIN) ──────────────────────────────
const alwaysOrange = () => ({
  borderColor: '#f97316',
  boxShadow: '0 0 0 0.2rem rgba(249,115,22,0.15)',
});
//

// ─── Composants UI ────────────────────────────────────────────────────────────

const SectionCard = ({ title, icon, children, accent = '#3b82f6' }) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    marginBottom: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 16px',
      background: `linear-gradient(135deg, ${accent}12, ${accent}06)`,
      borderBottom: `2px solid ${accent}28`,
    }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{ fontWeight: '700', fontSize: '12px', color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
    </div>
    <div style={{ padding: '16px' }}>{children}</div>
  </div>
);

const FieldGroup = ({ label, required, children, hint, inline }) => (
  <div style={{ marginBottom: inline ? 0 : '12px' }}>
    {label && (
      <label style={{
        display: 'block', fontSize: '10px', fontWeight: '700',
        color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px'
      }}>
        {label}{required && <span style={{ color: '#f97316', marginLeft: '3px' }}>*</span>}
      </label>
    )}
    {children}
    {hint && <small style={{ color: '#9ca3af', fontSize: '10px', marginTop: '2px', display: 'block' }}>{hint}</small>}
  </div>
);

const InlineRadioGroup = ({ options, name, value, onChange, labelMap = {} }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
    {options.map(opt => (
      <label key={opt} style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '4px 11px', borderRadius: '20px',
        border: `1.5px solid ${value === opt ? '#3b82f6' : '#d1d5db'}`,
        background: value === opt ? '#eff6ff' : '#fff',
        cursor: 'pointer', fontSize: '12px',
        fontWeight: value === opt ? '600' : '400',
        color: value === opt ? '#1d4ed8' : '#374151', transition: 'all 0.15s'
      }}>
        <input type="radio" name={name} value={opt} checked={value === opt} onChange={onChange} style={{ display: 'none' }} />
        {labelMap[opt] || opt}
      </label>
    ))}
  </div>
);

const CheckPill = ({ label, checked, onChange }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '4px 11px', borderRadius: '20px',
    border: `1.5px solid ${checked ? '#10b981' : '#d1d5db'}`,
    background: checked ? '#ecfdf5' : '#fff',
    cursor: 'pointer', fontSize: '12px',
    fontWeight: checked ? '600' : '400',
    color: checked ? '#059669' : '#374151', transition: 'all 0.15s'
  }}>
    <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
    {checked ? '✓ ' : ''}{label}
  </label>
);

// Carte membre famille — défini HORS du parent pour éviter le remount
const MembreFamilleCard = ({ label, membreKey, icon, accent, formData, setFormData }) => {
  const membre = formData.famille?.[membreKey] || {};
  const estFDS = membre.estFDS === true || membre.estFDS === 'true';

  const update = (field, value) => setFormData(prev => ({
    ...prev,
    famille: { ...prev.famille, [membreKey]: { ...(prev.famille?.[membreKey] || {}), [field]: value } }
  }));

  return (
    <SectionCard title={label} icon={icon} accent={accent}>
      <FieldGroup label="Nom et Prénoms">
        <input className="form-control form-control-sm" value={membre.nom || ''} onChange={e => update('nom', e.target.value)} placeholder="Nom complet"
          style={orangeIfEmpty(membre.nom)} />
      </FieldGroup>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <FieldGroup label="Téléphone">
          <input className="form-control form-control-sm" value={membre.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="Tél"
            style={orangeIfEmpty(membre.phone)} />
        </FieldGroup>
        <FieldGroup label="Adresse">
          <input className="form-control form-control-sm" value={membre.adresse || ''} onChange={e => update('adresse', e.target.value)} placeholder="Adresse"
            style={orangeIfEmpty(membre.adresse)} />
        </FieldGroup>
      </div>
      <FieldGroup label="Profession" hint="Ex: ministre, commerçant(e), enseignant(e)...">
        <input className="form-control form-control-sm" value={membre.profession || ''} onChange={e => update('profession', e.target.value)} placeholder="Profession"
          style={orangeIfEmpty(membre.profession)} />
      </FieldGroup>
      <div style={{ marginBottom: '8px' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
          border: `1.5px solid ${estFDS ? '#dc2626' : '#d1d5db'}`,
          background: estFDS ? '#fef2f2' : '#f9fafb',
          fontSize: '11px', fontWeight: estFDS ? '700' : '500',
          color: estFDS ? '#991b1b' : '#6b7280', userSelect: 'none'
        }}>
          <input type="checkbox" checked={estFDS} onChange={e => update('estFDS', e.target.checked)} style={{ display: 'none' }} />
          🎖️ {estFDS ? 'Membre FDS ✓' : 'Membre FDS ?'}
        </label>
      </div>
      {estFDS && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase', marginBottom: '8px' }}>
            🎖️ Grade & Poste FDS
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <FieldGroup label="Grade">
              <input className="form-control form-control-sm" value={membre.gradeFDS || ''} onChange={e => update('gradeFDS', e.target.value)} placeholder="Ex: Adjudant..."
                style={orangeIfEmpty(membre.gradeFDS)} />
            </FieldGroup>
            <FieldGroup label="Poste / Affectation">
              <input className="form-control form-control-sm" value={membre.posteFDS || ''} onChange={e => update('posteFDS', e.target.value)} placeholder="Ex: Gendarmerie Tana"
                style={orangeIfEmpty(membre.posteFDS)} />
            </FieldGroup>
          </div>
        </div>
      )}
    </SectionCard>
  );
};
const TuteurCard = ({ formData, setFormData }) => {
  const membre = formData.famille?.tuteur || {};
  const estFDS = membre.estFDS === true || membre.estFDS === 'true';

  const update = (field, value) => setFormData(prev => ({
    ...prev,
    famille: {
      ...prev.famille,
      tuteur: { ...(prev.famille?.tuteur || {}), [field]: value }
    }
  }));

  return (
    <SectionCard title="Tuteur légal (Mpiantoka)" icon="🧑‍⚖️" accent="#f59e0b">
      
      <FieldGroup label="Nom et Prénoms">
        <input
          className="form-control form-control-sm"
          value={membre.nom || ''}
          onChange={e => update('nom', e.target.value)}
          placeholder="Nom complet"
          style={orangeIfEmpty(membre.nom)}
        />
      </FieldGroup>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <FieldGroup label="Téléphone">
          <input
            className="form-control form-control-sm"
            value={membre.phone || ''}
            onChange={e => update('phone', e.target.value)}
            placeholder="Tél"
            style={orangeIfEmpty(membre.phone)}
          />
        </FieldGroup>
        <FieldGroup label="Adresse">
          <input
            className="form-control form-control-sm"
            value={membre.adresse || ''}
            onChange={e => update('adresse', e.target.value)}
            placeholder="Adresse"
            style={orangeIfEmpty(membre.adresse)}
          />
        </FieldGroup>
      </div>
      <FieldGroup label="Profession" hint="Ex: ministre, commerçant(e), enseignant(e)...">
        <input
          className="form-control form-control-sm"
          value={membre.profession || ''}
          onChange={e => update('profession', e.target.value)}
          placeholder="Profession"
          style={orangeIfEmpty(membre.profession)}
        />
      </FieldGroup>
      <div style={{ marginBottom: '8px' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '20px', cursor: 'pointer',
          border: `1.5px solid ${estFDS ? '#dc2626' : '#d1d5db'}`,
          background: estFDS ? '#fef2f2' : '#f9fafb',
          fontSize: '11px', fontWeight: estFDS ? '700' : '500',
          color: estFDS ? '#991b1b' : '#6b7280', userSelect: 'none'
        }}>
          <input
            type="checkbox"
            checked={estFDS}
            onChange={e => update('estFDS', e.target.checked)}
            style={{ display: 'none' }}
          />
          🎖️ {estFDS ? 'Membre FDS ✓' : 'Membre FDS ?'}
        </label>
      </div>
      {estFDS && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '8px', padding: '10px'
        }}>
          <p style={{
            fontSize: '10px', fontWeight: '700', color: '#991b1b',
            textTransform: 'uppercase', marginBottom: '8px'
          }}>
            🎖️ Grade & Poste FDS
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <FieldGroup label="Grade">
              <input
                className="form-control form-control-sm"
                value={membre.gradeFDS || ''}
                onChange={e => update('gradeFDS', e.target.value)}
                placeholder="Ex: Adjudant…"
                style={orangeIfEmpty(membre.gradeFDS)}
              />
            </FieldGroup>
            <FieldGroup label="Poste / Affectation">
              <input
                className="form-control form-control-sm"
                value={membre.posteFDS || ''}
                onChange={e => update('posteFDS', e.target.value)}
                placeholder="Ex: Gendarmerie Tana"
                style={orangeIfEmpty(membre.posteFDS)}
              />
            </FieldGroup>
          </div>
        </div>
      )}
    </SectionCard>
  );
};

// ─── TabButton ────────────────────────────────────────────────────────────────
const TabButton = ({ id, label, active, onClick, done }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '10px 16px', border: 'none',
      borderBottom: active ? '3px solid #1d4ed8' : '3px solid transparent',
      background: 'none',
      color: active ? '#1d4ed8' : done ? '#10b981' : '#6b7280',
      fontWeight: active ? '700' : '500',
      fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
      transition: 'all 0.15s',
    }}
  >
    {done && !active && <span style={{ color: '#10b981', fontSize: '11px' }}>✓</span>}
    {label}
  </button>
);

// ─── Composant principal ───────────────────────────────────────────────────────

const ModalModificationEleve = ({ show, onClose, eleve, onChange, onSave, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({});
  const [previewImage, setPreviewImage] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);
  const [activeTab, setActiveTab] = useState('p1');
  const [specialites, setSpecialites] = useState([{ categorie: '', detail: '', niveauQualification: '' }]);

  useEffect(() => {
    if (eleve) {
      setFormData(() => {
        const baseData = {
          ...eleve,
          famille: {
            conjointe: eleve.Conjointe ?? {},
            mere: eleve.Mere ?? {},
            pere: eleve.Pere ?? {},
            accident: eleve.Accident ?? {},
            tuteur: eleve.Tuteur || eleve.tuteur || {},
            enfants: eleve.Enfants ?? [],
            frere: eleve.Freres ?? [],
            soeur: eleve.Soeurs ?? [],
          },
        };
        if (eleve.Sport) {
          const sportMapping = { Football: 'Football', Basketball: 'Basketball', Volley_ball: 'Volley_ball', Musculation: 'Musculation', Rugby: 'Rugby', Athletisme: 'Athletisme', Tennis: 'Tennis', ArtsMartiaux: 'ArtsMartiaux', Autre: 'Autre' };
          baseData.sports = Object.entries(sportMapping).filter(([k]) => eleve.Sport[k]).map(([k]) => sportMapping[k]);
        }
        return baseData;
      });

      setSpecialites(eleve.specialites?.length > 0
        ? eleve.specialites.map(sp => ({ id: sp.id, categorie: sp.categorie || '', detail: sp.detail || '', niveauQualification: sp.niveauQualification || '' }))
        : [{ categorie: '', detail: '', niveauQualification: '' }]
      );

      if (eleve.image && typeof eleve.image === 'string') setPreviewImage(eleve.image);
    }
  }, [eleve]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith('image/')) { alert('Image invalide'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 400, maxH = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxW) { h *= maxW / w; w = maxW; } } else { if (h > maxH) { w *= maxH / h; h = maxH; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const isJPEG = file.type === 'image/jpeg' || file.type === 'image/jpg';
        canvas.toBlob((blob) => {
          const resized = new File([blob], file.name, { type: isJPEG ? 'image/jpeg' : 'image/png', lastModified: Date.now() });
          setFormData(prev => ({ ...prev, image: resized }));
          setPreviewImage(URL.createObjectURL(resized));
        }, isJPEG ? 'image/jpeg' : 'image/png', isJPEG ? 0.7 : 1.0);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePhoneChange = (e, phoneKey) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, [phoneKey]: val }));
  };

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

  const ajouterSpecialite = () => setSpecialites(prev => [...prev, { categorie: '', detail: '', niveauQualification: '' }]);
  const handleSpecialiteChange = (i, field, value) => setSpecialites(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });
  const supprimerSpecialite = async (i) => {
    const sp = specialites[i];
    if (sp.id) { try { await specialiteService.delete(sp.id); } catch { Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de supprimer.' }); return; } }
    setSpecialites(prev => prev.length === 1 ? [{ categorie: '', detail: '', niveauQualification: '' }] : prev.filter((_, idx) => idx !== i));
  };

  const ajouterEnfant = () => setFormData(prev => ({ ...prev, famille: { ...prev.famille, enfants: [...prev.famille.enfants, { nom: '' }] } }));
  const supprimerEnfant = (i) => setFormData(prev => { const e = [...prev.famille.enfants]; e.splice(i, 1); return { ...prev, famille: { ...prev.famille, enfants: e } }; });
  const ajouterFrere = () => setFormData(prev => ({ ...prev, famille: { ...prev.famille, frere: [...prev.famille.frere, { nom: '', profession: '' }] } }));
  const supprimerFrere = (i) => setFormData(prev => { const f = [...prev.famille.frere]; f.splice(i, 1); return { ...prev, famille: { ...prev.famille, frere: f } }; });
  const ajouterSoeur = () => setFormData(prev => ({ ...prev, famille: { ...prev.famille, soeur: [...prev.famille.soeur, { nom: '', profession: '' }] } }));
  const supprimerSoeur = (i) => setFormData(prev => { const s = [...prev.famille.soeur]; s.splice(i, 1); return { ...prev, famille: { ...prev.famille, soeur: s } }; });

  const handleSave = async () => {
    try {
      const fd = new FormData();
      for (const key in formData) {
        if (key !== 'image' && formData[key] != null) {
          if (['famille', 'Diplome', 'sports', 'Filiere', 'Pointure'].includes(key)) fd.append(key, JSON.stringify(formData[key]));
          else fd.append(key, formData[key]);
        }
      }
      if (formData.image && typeof formData.image === 'object') fd.append('image', formData.image);

      const response = await eleveService.put(eleve.id, fd);

      const supprimees = specialites.filter(sp => sp.id && sp.categorie.trim() === '');
      for (const sp of supprimees) await specialiteService.delete(sp.id);
      const filtrees = specialites.filter(sp => sp.categorie.trim() !== '');
      for (const sp of filtrees.filter(sp => sp.id)) await specialiteService.put(sp.id, { categorie: sp.categorie, detail: sp.detail || '', niveauQualification: sp.niveauQualification || '' });
      const nouvelles = filtrees.filter(sp => !sp.id);
      if (nouvelles.length > 0) await specialiteService.bulkCreate(eleve.id, { specialites: nouvelles });

      if (response.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Succès', text: 'Élève mis à jour !', timer: 2000, showConfirmButton: false });
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de la mise à jour.' });
      }
    } catch (error) {
      console.error('handleSave:', error);
      Swal.fire({ icon: 'error', title: 'Erreur serveur', text: 'Erreur serveur lors de la mise à jour.' });
    }
  };

  const tabs = [
    { id: 'p1', label: 'Partie 1 — Identification' },
    { id: 'p2', label: 'Partie 2 — Famille' },
    { id: 'p3', label: 'Partie 3 — Formation & Aptitudes' },
    { id: 'p4', label: 'Partie 4 — Effets' },
  ];

  if (!eleve) return null;
  const nomComplet = `${eleve.nom || '—'} ${eleve.prenom || ''}`.trim();
  const tabIdx = tabs.findIndex(t => t.id === activeTab);
// --- Fonction de remplissage automatique ---
  const remplirAccidentDepuis = (type) => {
    // On va chercher dans formData.famille.pere, .mere ou .tuteur
    const infosSource = formData.famille?.[type];

    if (!infosSource || !infosSource.nom) {
      Swal.fire({
        icon: 'info',
        title: 'Source vide',
        text: `Les informations du ${type} ne sont pas encore remplies.`,
        timer: 2000
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      famille: {
        ...prev.famille,
        accident: {
          ...prev.famille.accident, // On garde l'ID s'il existe déjà
          nom: infosSource.nom || '',
          phone: infosSource.phone || '', // Note: dans ton code tu utilises 'phone' et non 'telephone'
          adresse: infosSource.adresse || '',
          profession: infosSource.profession || '',
          lien: type.charAt(0).toUpperCase() + type.slice(1) // "Pere", "Mere" ou "Tuteur"
        }
      }
    }));
    
    toast.success(`Données copiées depuis : ${type}`);
  };
  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal show={show} onHide={onClose} size="xl" className="modal-overlay">

        {/* ── Header ── */}
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e5e7eb', padding: '14px 22px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowFullImage(true)}>
              <img src={previewImage || formData.image || '/placeholder.png'} alt="Photo"
                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
              <div style={{
                position: 'absolute', bottom: '-3px', right: '-3px', background: '#3b82f6',
                borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '7px', border: '2px solid #fff'
              }}>🔍</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#111827' }}>{nomComplet || 'Modifier un élève'}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                {eleve.matricule && <Badge bg="secondary" style={{ fontSize: '10px' }}>#{eleve.matricule}</Badge>}
                {eleve.escadron && <Badge bg="primary" style={{ fontSize: '10px' }}>ESC {eleve.escadron}</Badge>}
                {eleve.peloton && <Badge bg="info" style={{ fontSize: '10px' }}>PEL {eleve.peloton}</Badge>}
                {eleve.sexe && <Badge bg={eleve.sexe === 'Masculin' ? 'primary' : 'danger'} style={{ fontSize: '10px' }}>{eleve.sexe}</Badge>}
              </div>
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
              background: '#fff', border: '1.5px solid #d1d5db', borderRadius: '8px',
              cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: '#374151'
            }}>
              📷 Photo
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          </div>
        </Modal.Header>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #e5e7eb', background: '#fff', paddingLeft: '8px' }}>
          {tabs.map((tab, i) => (
            <TabButton key={tab.id} id={tab.id} label={tab.label} active={activeTab === tab.id} onClick={setActiveTab} done={i < tabIdx} />
          ))}
        </div>

        {/* ── Body ── */}
        <Modal.Body style={{ background: '#f1f5f9', padding: '20px', overflowY: 'auto', maxHeight: 'calc(100vh - 210px)' }}>
          <Form>

            {/* ══════════════════════════════════════════════════════════════════
                PARTIE 1 — IDENTIFICATION & AFFECTATION
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'p1' && (
              <div>

                {/* 1.1 Numéros & Affectation */}
                <SectionCard title="Numéros & Affectation (Escadron / Peloton)" icon="🔢" accent="#f59e0b">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                    <FieldGroup label="N° Incorporation">
                      <input
                        className="form-control form-control-sm"
                        name="numeroIncorporation"
                        value={formData.numeroIncorporation || ''}
                        onChange={handleChange}
                        style={orangeIfEmpty(formData.numeroIncorporation)}
                      />
                    </FieldGroup>
                    <FieldGroup label="Escadron">
                      <select
                        className="form-select form-select-sm"
                        name="escadron"
                        value={formData.escadron || ''}
                        onChange={handleChange}
                        style={orangeIfEmpty(formData.escadron)}
                      >
                        <option value="">—</option>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Peloton">
                      <select
                        className="form-select form-select-sm"
                        name="peloton"
                        value={formData.peloton || ''}
                        onChange={handleChange}
                        style={orangeIfEmpty(formData.peloton)}
                      >
                        <option value="">—</option>
                        {[1, 2, 3].map(i => <option key={i} value={String(i)}>{i}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="N° Candidature">
                      <input
                        className="form-control form-control-sm"
                        name="numCandidature"
                        value={formData.numCandidature || ''}
                        onChange={handleChange}
                        style={orangeIfEmpty(formData.numCandidature)}
                      />
                    </FieldGroup>
                    <FieldGroup label="Matricule">
                      <input
                        className="form-control form-control-sm"
                        name="matricule"
                        value={formData.matricule || ''}
                        onChange={handleChange}
                        style={orangeIfEmpty(formData.matricule)}
                      />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Centre de concours">
                    <input
                      className="form-control form-control-sm"
                      name="centreConcours"
                      value={formData.centreConcours || ''}
                      onChange={handleChange}
                      style={orangeIfEmpty(formData.centreConcours)}
                    />
                  </FieldGroup>
                </SectionCard>

                {/* 1.2 État civil */}
                <SectionCard title="Nom et Prénoms — État civil" icon="📋" accent="#3b82f6">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <FieldGroup label="Nom (Anarana)" required>
                      <input
                        className="form-control"
                        name="nom"
                        value={formData.nom || ''}
                        onChange={handleChange}
                        placeholder="NOM"
                        style={{ textTransform: 'uppercase', fontWeight: '600', ...orangeIfEmpty(formData.nom) }}
                      />
                    </FieldGroup>
                    <FieldGroup label="Prénoms (Fanampiny)" required>
                      <input
                        className="form-control"
                        name="prenom"
                        value={formData.prenom || ''}
                        onChange={handleChange}
                        placeholder="Prénoms"
                        style={orangeIfEmpty(formData.prenom)}
                      />
                    </FieldGroup>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <FieldGroup label="Date de naissance">
                      <input
                        type="date"
                        className="form-control"
                        name="dateNaissance"
                        value={formData.dateNaissance || ''}
                        onChange={handleChange}
                        style={orangeIfEmpty(formData.dateNaissance)}
                      />
                    </FieldGroup>
                    <FieldGroup label="Lieu de naissance">
                      <input
                        className="form-control"
                        name="lieuNaissance"
                        value={formData.lieuNaissance || ''}
                        onChange={handleChange}
                        placeholder="Ville"
                        style={orangeIfEmpty(formData.lieuNaissance)}
                      />
                    </FieldGroup>
                    <FieldGroup label="Adresse exacte">
                      <input
                        className="form-control"
                        name="adresseExacte"
                        value={formData.adresseExacte || ''}
                        onChange={handleChange}
                        placeholder="Adresse"
                        style={orangeIfEmpty(formData.adresseExacte)}
                      />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Sexe">
                    <InlineRadioGroup options={['Masculin', 'Feminin']} name="sexe" value={formData.sexe} onChange={handleChange} labelMap={{ Feminin: 'Féminin' }} />
                  </FieldGroup>
                  <FieldGroup label="Situation de famille (Fanambadiana)">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {[
                        { val: 'Celibataire', label: 'Célibataire (Mpitovo)' },
                        { val: 'Marie', label: 'Marié(e) (Manambady)' },
                        { val: 'Divorce', label: 'Divorcé(e) (Nisara-bady)' },
                        { val: 'Veuf', label: 'Veuf/ve (Maty vady)' },
                      ].map(({ val, label }) => (
                        <CheckPill key={val} label={label} checked={formData.situationFamiliale === val} onChange={() => handleChange({ target: { name: 'situationFamiliale', value: val } })} />
                      ))}
                    </div>
                  </FieldGroup>
                </SectionCard>

                {/* 1.3 CIN — toujours orange */}
                <SectionCard title="N° CIN — Pièce d'identité" icon="🪪" accent="#8b5cf6">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <FieldGroup label="Numéro CIN">
                      <input
                        className="form-control"
                        name="CIN"
                        value={formData.CIN || ''}
                        onChange={handleChange}
                        placeholder="N° CIN"
                        style={alwaysOrange()}
                      />
                    </FieldGroup>
                    <FieldGroup label="Délivrée le">
                      <input
                        type="date"
                        className="form-control"
                        name="dateDelivrance"
                        value={formData.dateDelivrance || ''}
                        onChange={handleChange}
                        style={orangeIfEmpty(formData.dateDelivrance)}
                      />
                    </FieldGroup>
                    <FieldGroup label="Lieu de délivrance">
                      <input
                        className="form-control"
                        name="lieuDelivrance"
                        value={formData.lieuDelivrance || ''}
                        onChange={handleChange}
                        placeholder="Lieu"
                        style={orangeIfEmpty(formData.lieuDelivrance)}
                      />
                    </FieldGroup>
                    <FieldGroup label="Duplicata du">
                      <input
                        type="date"
                        className="form-control"
                        name="duplicata"
                        value={formData.duplicata || ''}
                        onChange={handleChange}
                        style={orangeIfEmpty(formData.duplicata)}
                      />
                    </FieldGroup>
                    <FieldGroup label="Lieu duplicata">
                      <input
                        className="form-control"
                        name="lieuDuplicata"
                        value={formData.lieuDuplicata || ''}
                        onChange={handleChange}
                        placeholder="Lieu"
                        style={orangeIfEmpty(formData.lieuDuplicata)}
                      />
                    </FieldGroup>
                  </div>
                </SectionCard>

                {/* 1.4 Contacts */}
                <SectionCard title="N° Téléphone & Réseaux sociaux" icon="📱" accent="#10b981">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    {['telephone1', 'telephone2', 'telephone3'].map((k, i) => (
                      <FieldGroup key={k} label={`Tél ${i + 1} (03…)`}>
                        <input
                          className="form-control"
                          placeholder="03X XX XXX XX"
                          maxLength="11"
                          value={formData[k] || ''}
                          onChange={e => handlePhoneChange(e, k)}
                          style={orangeIfEmpty(formData[k])}
                        />
                      </FieldGroup>
                    ))}
                  </div>
                  
                </SectionCard>

              </div>
            )}
            

            {/* ══════════════════════════════════════════════════════════════════
                PARTIE 2 — RENSEIGNEMENTS FAMILIAUX
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'p2' && (
              <div>

                {/* 2.1 Conjoint */}
                <MembreFamilleCard label="Conjoint(e)" membreKey="conjointe" icon="💑" accent="#6366f1" formData={formData} setFormData={setFormData} />

                {/* 2.2 Enfants légitimes */}
                <SectionCard title="Noms et Prénoms des enfants légitimes (Zanaka ara-dalàna)" icon="👶" accent="#10b981">
                  {formData.famille?.enfants?.map((enfant, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', minWidth: '20px', fontWeight: '600' }}>{i + 1}.</span>
                      <input className="form-control form-control-sm" name="famille.enfants.nom" value={enfant.nom} onChange={e => handleChange(e, i)} placeholder="Nom et prénoms de l'enfant"
                        style={{ flex: 1, ...orangeIfEmpty(enfant.nom) }} />
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerEnfant(i)} style={{ padding: '2px 8px' }}>🗑️</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-success btn-sm w-100 mt-1" onClick={ajouterEnfant} style={{ borderRadius: '8px', borderStyle: 'dashed' }}>
                    + Ajouter un enfant
                  </button>
                </SectionCard>

                {/* 2.3 Père */}
                <MembreFamilleCard label="Père (Ray)" membreKey="pere" icon="👨" accent="#3b82f6" formData={formData} setFormData={setFormData} />

                {/* 2.4 Mère */}
                <MembreFamilleCard label="Mère (Reny)" membreKey="mere" icon="👩" accent="#ec4899" formData={formData} setFormData={setFormData} />
                   <TuteurCard formData={formData} setFormData={setFormData} />
{/* Petit bandeau de boutons pour le remplissage automatique */}
<div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    marginBottom: '10px',
    background: '#f8fafc',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px dashed #cbd5e1'
}}>
  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
    Remplir l'accident via :
  </span>
  <div className="btn-group">
    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => remplirAccidentDepuis('pere')}>👨 Père</button>
    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => remplirAccidentDepuis('mere')}>👩 Mère</button>
    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => remplirAccidentDepuis('tuteur')}>🛡️ Tuteur</button>
  </div>
</div>
                {/* 2.5 À prévenir en cas d'accident */}
                <MembreFamilleCard label="À prévenir en cas d'accident (Olona ilazàna raha misy loza)" membreKey="accident" icon="🚨" accent="#ef4444" formData={formData} setFormData={setFormData} />

                {/* 2.6 Frères & Sœurs */}
                <SectionCard title="Frères & Sœurs légitimes (Mpiray tampo ara-dalàna)" icon="👫" accent="#f59e0b">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                    {/* Frères */}
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.04em' }}>
                        Frères (Anadahy) + Profession
                      </p>
                      {formData.famille?.frere?.map((f, i) => (
                        <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>{i + 1}.</span>
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerFrere(i)} style={{ padding: '1px 7px', fontSize: '11px' }}>🗑️</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <input className="form-control form-control-sm" name="famille.frere.nom" value={f.nom || ''} onChange={e => handleChange(e, i)} placeholder="Nom et prénoms"
                              style={orangeIfEmpty(f.nom)} />
                            <input className="form-control form-control-sm" name="famille.frere.profession" value={f.profession || ''} onChange={e => handleChange(e, i)} placeholder="Profession"
                              style={orangeIfEmpty(f.profession)} />
                          </div>
                        </div>
                      ))}
                      <button type="button" className="btn btn-outline-primary btn-sm w-100" onClick={ajouterFrere} style={{ borderRadius: '8px', borderStyle: 'dashed' }}>+ Frère</button>
                    </div>

                    {/* Sœurs */}
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.04em' }}>
                        Sœurs (Rahavavy) + Profession
                      </p>
                      {formData.famille?.soeur?.map((s, i) => (
                        <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>{i + 1}.</span>
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerSoeur(i)} style={{ padding: '1px 7px', fontSize: '11px' }}>🗑️</button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            <input className="form-control form-control-sm" name="famille.soeur.nom" value={s.nom || ''} onChange={e => handleChange(e, i)} placeholder="Nom et prénoms"
                              style={orangeIfEmpty(s.nom)} />
                            <input className="form-control form-control-sm" name="famille.soeur.profession" value={s.profession || ''} onChange={e => handleChange(e, i)} placeholder="Profession"
                              style={orangeIfEmpty(s.profession)} />
                          </div>
                        </div>
                      ))}
                      <button type="button" className="btn btn-outline-primary btn-sm w-100" onClick={ajouterSoeur} style={{ borderRadius: '8px', borderStyle: 'dashed' }}>+ Sœur</button>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                PARTIE 3 — FORMATION, CONCOURS & APTITUDES
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'p3' && (
              <div>

                {/* 3.1 Motif & Genre de concours */}
                <SectionCard title="Motif de candidature au concours" icon="📝" accent="#ef4444">
                  <FieldGroup label="Genre de concours (1) : Ordinaire, Spécialiste, Orphelin, Veuve, Ex-militaire">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {[
                        { val: 'ordinaire', label: 'Ordinaire' },
                        { val: 'specialiste', label: 'Spécialiste' },
                        { val: 'orphelin', label: 'Orphelin(e)' },
                        { val: 'veuve', label: 'Veuve' },
                        { val: 'ex-militaire', label: 'Ex-militaire' },
                      ].map(({ val, label }) => (
                        <CheckPill key={val} label={label} checked={formData.genreConcours === val} onChange={() => handleChange({ target: { name: 'genreConcours', value: val } })} />
                      ))}
                    </div>
                  </FieldGroup>

                  {formData.genreConcours === 'specialiste' && (
                    <FieldGroup label="Mentionner la spécialité (ex : Informatique, Sport, Infirmière…)">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {['Info-Telecom', 'Topo', 'Mecanicien', 'Infrastructure', 'Sport', 'Plombier', 'Infirmier'].map(val => (
                          <label key={val} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                            borderRadius: '8px', border: `1.5px solid ${formData.Specialiste === val ? '#3b82f6' : '#e5e7eb'}`,
                            background: formData.Specialiste === val ? '#eff6ff' : '#fff',
                            cursor: 'pointer', fontSize: '12px', fontWeight: formData.Specialiste === val ? '600' : '400'
                          }}>
                            <input type="radio" name="Specialiste" value={val} checked={formData.Specialiste === val} onChange={handleChange} style={{ accentColor: '#3b82f6' }} />
                            {val}
                          </label>
                        ))}
                      </div>
                    </FieldGroup>
                  )}
                </SectionCard>

                {/* 3.2 Spécialités & Aptitudes particulières */}
                <SectionCard title="Spécialité ou Aptitudes particulières (Fahaizana manokana) — avec ou sans diplôme" icon="⚡" accent="#8b5cf6">
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>
                    Ex : BTP, mécanicien, sport, musique, informatique… (plusieurs réponses possibles)
                  </p>

                  {formData.SpecialisteAptitude && (
                    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
                      <small style={{ color: '#92400e', fontWeight: '600', fontSize: '11px' }}>⚠️ Ancienne donnée (à migrer)</small>
                      <input className="form-control form-control-sm mt-1" name="SpecialisteAptitude" value={formData.SpecialisteAptitude || ''} onChange={handleChange} />
                    </div>
                  )}

                  {/* Tableau style fiche mère */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 3fr auto', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Domaine / Spécialité', 'Détails', 'Niveau de qualification', ''].map((h, i) => (
                        <div key={i} style={{ padding: '8px 10px', fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
                      ))}
                    </div>
                    {specialites.map((sp, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 3fr auto', borderBottom: index < specialites.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                        <div style={{ padding: '8px 10px' }}>
                          <input className="form-control form-control-sm" placeholder="Ex: Informatique, BTP…" value={sp.categorie}
                            onChange={e => handleSpecialiteChange(index, 'categorie', e.target.value)}
                            style={orangeIfEmpty(sp.categorie)} />
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <input className="form-control form-control-sm" placeholder="Ex: Génie logiciel, Électricien…" value={sp.detail}
                            onChange={e => handleSpecialiteChange(index, 'detail', e.target.value)}
                            style={orangeIfEmpty(sp.detail)} />
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <select className="form-select form-select-sm" value={sp.niveauQualification}
                            onChange={e => handleSpecialiteChange(index, 'niveauQualification', e.target.value)}
                            style={orangeIfEmpty(sp.niveauQualification)}>
                            <option value="">— Niveau —</option>
                            <option value="Licencié">Licencié (diplôme / certificat / licence sportive)</option>
                            <option value="En cours de licence">En cours de licence</option>
                            <option value="Autodidacte">Autodidacte (sans titre officiel)</option>
                          </select>
                        </div>
                        <div style={{ padding: '8px' }}>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerSpecialite(index)} style={{ padding: '2px 8px' }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn btn-outline-primary btn-sm w-100 mt-2" onClick={ajouterSpecialite} style={{ borderRadius: '8px', borderStyle: 'dashed', fontWeight: '600' }}>
                    + Ajouter une spécialité / aptitude
                  </button>
                </SectionCard>

                {/* 3.3 Loisirs & Sports */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <SectionCard title="Loisirs (Fialam-boly)" icon="🎭" accent="#06b6d4">
                    <textarea className="form-control" name="facebook" rows="3" value={formData.facebook || ''} onChange={handleChange} placeholder="Ex: Lecture, Musique, Cinéma, Jardinage…"
                      style={orangeIfEmpty(formData.facebook)} />
                  </SectionCard>

                  <SectionCard title="Sports pratiqués (Fanatanjahantena atao)" icon="🏅" accent="#10b981">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                      {['Football', 'Basketball', 'Volley_ball', 'Musculation', 'Rugby', 'Athletisme', 'Tennis', 'ArtsMartiaux', 'Autre'].map(sport => (
                        <CheckPill
                          key={sport}
                          label={sport.replace('_', ' ')}
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
                </div>

                {/* 3.4 Religion + Groupe sanguin */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <SectionCard title="Religion (Finoana arahina)" icon="✝️" accent="#f59e0b">
                    <InlineRadioGroup options={['EKAR', 'FJKM', 'FLM', 'ISLAM', 'Autre']} name="religion" value={formData.religion || ''} onChange={handleChange} />
                  </SectionCard>
                  <SectionCard title="Groupe sanguin" icon="🩸" accent="#ef4444">
                    <InlineRadioGroup options={['A+','A-','B+','B-','AB+','AB-','O+','O-']} name="groupeSaguin" value={formData.groupeSaguin || ''} onChange={handleChange} />
                  </SectionCard>
                </div>

                {/* 3.4b Ethnie / Fady */}
                <SectionCard title="Ethnie / Foko (Fady)" icon="🌍" accent="#10b981">
                  <select
                    className="form-select"
                    name="fady"
                    value={formData.fady || ''}
                    onChange={handleChange}
                    style={orangeIfEmpty(formData.fady)}
                  >
                    <option value="">— Sélectionner —</option>
                    {['ANTAIFASY','ANTAIMORO','ANTAMBAHOAKA','ANTANDROY','ANTANOSY','ANTAKARANA','ANTESAKA','BARA','BEZANOZANO','BETSILEO','BETSIMISARAKA','MAHAFALY','MASOKORO','MERINA','MIKEA','SAKALAVA','SIHANAKA','TANALA','TSIMIHETY','VEZO'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </SectionCard>

                {/* 3.5 Diplômes */}
                <SectionCard title="Diplômes avec filières pour études supérieures (3)" icon="🏅" accent="#6366f1">
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px' }}>
                    Souligner la bonne réponse — (3) : pour les études supérieures, préciser la filière
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {[
                      { label: 'CEPE', key: 'CEPE' }, { label: 'BEPC', key: 'BEPC' },
                      { label: 'BAC S', key: 'BACC_S' }, { label: 'BAC L', key: 'BACC_L' },
                      { label: 'BAC Technique', key: 'BACC_TECHNIQUE' },
                    ].map(({ label, key }) => (
                      <CheckPill key={key} label={label} checked={formData.Diplome?.[key] || false}
                        onChange={e => setFormData(prev => ({ ...prev, Diplome: { ...(prev.Diplome || {}), [key]: e.target.checked } }))} />
                    ))}
                  </div>

                  {/* Tableau diplômes supérieurs */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    {[
                      { label: 'Licence', key: 'Licence' },
                      { label: 'Master I', key: 'MasterOne' },
                      { label: 'Master II', key: 'MasterTwo' },
                      { label: 'Doctorat', key: 'Doctorat' },
                    ].map(({ label, key }, i, arr) => (
                      <div key={key} style={{
                        display: 'grid', gridTemplateColumns: '160px 1fr',
                        borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                        alignItems: 'center'
                      }}>
                        <div style={{ padding: '10px 12px', borderRight: '1px solid #f1f5f9' }}>
                          <CheckPill label={label} checked={formData.Diplome?.[key] || false}
                            onChange={e => setFormData(prev => ({ ...prev, Diplome: { ...(prev.Diplome || {}), [key]: e.target.checked } }))} />
                        </div>
                        <div style={{ padding: '8px 12px' }}>
                          <input
                            className="form-control form-control-sm"
                            name={`Filiere.filiere${key}`}
                            value={formData.Filiere?.[`filiere${key}`] || ''}
                            onChange={handleChange}
                            placeholder={formData.Diplome?.[key] ? 'Préciser la filière…' : '—'}
                            disabled={!formData.Diplome?.[key]}
                            style={{
                              background: formData.Diplome?.[key] ? '#fff' : '#f8fafc',
                              ...(formData.Diplome?.[key] ? orangeIfEmpty(formData.Filiere?.[`filiere${key}`]) : {})
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* 3.6 Niveau d'études */}
                <SectionCard title="Niveau d'études — Dernière classe suivie avec année" icon="📚" accent="#3b82f6">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <FieldGroup label="Dernière classe suivie (Kilasy farany nijanonana)">
                      <select
                        className="form-select"
                        name="niveau"
                        value={formData.niveau || 'BACC'}
                        onChange={handleChange}
                      >
                        {['BACC','BACC +1','BACC +2','BACC +3','BACC +4','BACC +5','BACC +6','BACC +7','BACC +8'].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Filière">
                      <input
                        className="form-control"
                        name="niveaufiliere"
                        value={formData.niveaufiliere || ''}
                        onChange={handleChange}
                        placeholder="Ex: Informatique, Droit, Médecine…"
                        style={orangeIfEmpty(formData.niveaufiliere)}
                      />
                    </FieldGroup>
                  </div>
                </SectionCard>

                {/* 3.7 Relations gênantes */}
                <SectionCard title="Relations gênantes (Toerana tsy tokony hiasàna)" icon="⚠️" accent="#ef4444">
                  <textarea className="form-control" name="relationGenante" rows="3" value={formData.relationGenante || ''} onChange={handleChange} placeholder="Préciser les lieux ou personnes…"
                    style={orangeIfEmpty(formData.relationGenante)} />
                </SectionCard>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                PARTIE 4 — EFFETS VESTIMENTAIRES
            ══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'p4' && (
              <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                <SectionCard title="Pointures & Effets vestimentaires" icon="👗" accent="#ec4899">

                  <FieldGroup label="Chemise / T-shirt (Taille du haut)">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(t => {
                        const active = formData.Pointure?.tailleChemise === t;
                        return (
                          <button key={t} type="button"
                            onClick={() => setFormData(prev => ({ ...prev, Pointure: { ...prev.Pointure, tailleChemise: t } }))}
                            style={{
                              padding: '8px 18px', borderRadius: '8px',
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
                      <input
                        type="number"
                        className="form-control"
                        name="Pointure.tourTete"
                        value={formData.Pointure?.tourTete || ''}
                        onChange={handleChange}
                        min="28" max="65"
                        placeholder="Ex: 54"
                        style={{ maxWidth: '120px', ...orangeIfEmpty(formData.Pointure?.tourTete) }}
                      />
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>cm</span>
                    </div>
                  </FieldGroup>

                  <FieldGroup label="Pantalon (tour de taille)">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[28, 30, 34, 36, 38, 40, 42, 44, 46, 48, 50].map(t => {
                        const active = Number(formData.Pointure?.pointurePantalon) === t;
                        return (
                          <button key={t} type="button"
                            onClick={() => setFormData(prev => ({ ...prev, Pointure: { ...prev.Pointure, pointurePantalon: t } }))}
                            style={{
                              padding: '6px 12px', borderRadius: '6px',
                              border: `1.5px solid ${active ? '#8b5cf6' : '#e5e7eb'}`,
                              background: active ? '#f5f3ff' : '#fff',
                              color: active ? '#6d28d9' : '#374151',
                              fontWeight: active ? '700' : '400', fontSize: '12px', cursor: 'pointer'
                            }}>
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </FieldGroup>

                  <FieldGroup label="Chaussures (pointure)">
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

          </Form>
        </Modal.Body>

        {/* ── Footer ── */}
        <Modal.Footer style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', padding: '12px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {tabIdx > 0 && (
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveTab(tabs[tabIdx - 1].id)} style={{ borderRadius: '8px' }}>
                ← Précédent
              </button>
            )}
            {tabIdx < tabs.length - 1 && (
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setActiveTab(tabs[tabIdx + 1].id)} style={{ borderRadius: '8px' }}>
                Suivant →
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Partie {tabIdx + 1} / {tabs.length}</span>
            <Button variant="outline-secondary" onClick={onClose} style={{ borderRadius: '8px' }}>Annuler</Button>
            {user?.type === 'admin' && (
              <Button variant="primary" onClick={handleSave} style={{
                borderRadius: '8px', fontWeight: '600', padding: '7px 18px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none'
              }}>
                💾 Enregistrer les modifications
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>

      {/* ── Lightbox ── */}
      {showFullImage && ReactDOM.createPortal(
        <div onClick={() => setShowFullImage(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999, backdropFilter: 'blur(6px)'
        }}>
          <img src={previewImage || formData.image} alt="Aperçu"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: '16px', border: '3px solid rgba(255,255,255,0.25)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
          />
          <button onClick={() => setShowFullImage(false)} style={{
            position: 'absolute', top: '24px', right: '24px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50%', width: '42px', height: '42px',
            color: '#fff', fontSize: '20px', cursor: 'pointer', backdropFilter: 'blur(4px)', lineHeight: 1
          }}>✕</button>
        </div>,
        document.body
      )}
    </>
  );
};

export default ModalModificationEleve;
