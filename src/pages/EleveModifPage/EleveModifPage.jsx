import { Modal, Button, Form, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import eleveService from '../../services/eleveService';
import specialiteService from '../../services/specialiteService';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const user = JSON.parse(localStorage.getItem('user'));

// ─── Composants UI réutilisables ───────────────────────────────────────────────

const SectionCard = ({ title, icon, children, accent = '#3b82f6' }) => (
  <div style={{
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    marginBottom: '20px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 18px',
      background: `linear-gradient(135deg, ${accent}10, ${accent}05)`,
      borderBottom: `2px solid ${accent}25`,
    }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontWeight: '700', fontSize: '13px', color: '#374151', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
    </div>
    <div style={{ padding: '18px' }}>
      {children}
    </div>
  </div>
);

const FieldGroup = ({ label, required, children, hint }) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={{
      display: 'block',
      fontSize: '11px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '5px'
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
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        borderRadius: '20px',
        border: `1.5px solid ${value === opt ? '#3b82f6' : '#d1d5db'}`,
        background: value === opt ? '#eff6ff' : '#fff',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: value === opt ? '600' : '400',
        color: value === opt ? '#1d4ed8' : '#374151',
        transition: 'all 0.15s ease'
      }}>
        <input type="radio" name={name} value={opt} checked={value === opt} onChange={onChange} style={{ display: 'none' }} />
        {labelMap[opt] || opt}
      </label>
    ))}
  </div>
);

const CheckPill = ({ label, checked, onChange }) => (
  <label style={{
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: '20px',
    border: `1.5px solid ${checked ? '#10b981' : '#d1d5db'}`,
    background: checked ? '#ecfdf5' : '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: checked ? '600' : '400',
    color: checked ? '#059669' : '#374151',
    transition: 'all 0.15s ease'
  }}>
    <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
    {checked ? '✓ ' : ''}{label}
  </label>
);

// ─── MembreFamilleCard — défini HORS du composant parent pour éviter le remount ─
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
      <div style={{ marginBottom: '10px' }}>
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
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
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

const TabButton = ({ id, label, icon, active, onClick, count }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      padding: '10px 18px',
      border: 'none',
      borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent',
      background: 'none',
      color: active ? '#1d4ed8' : '#6b7280',
      fontWeight: active ? '700' : '500',
      fontSize: '13px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s ease',
    }}
  >
    <span>{icon}</span>
    <span>{label}</span>
    {count !== undefined && (
      <span style={{
        background: active ? '#3b82f6' : '#e5e7eb',
        color: active ? '#fff' : '#6b7280',
        borderRadius: '10px',
        fontSize: '10px',
        fontWeight: '700',
        padding: '1px 6px',
        minWidth: '18px',
        textAlign: 'center'
      }}>{count}</span>
    )}
  </button>
);

// ─── Composant principal ───────────────────────────────────────────────────────

const ModalModificationEleve = ({ show, onClose, eleve, onChange, onSave, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({});
  const [previewImage, setPreviewImage] = useState("");
  const [showFullImage, setShowFullImage] = useState(false);
  const [activeTab, setActiveTab] = useState('identite');
  const [specialites, setSpecialites] = useState([{ categorie: '', detail: '', niveauQualification: '' }]);
  const [showFamille, setShowFamille] = useState(false);

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
          const sportMapping = { Football: "Football", Basketball: "Basketball", Volley_ball: "Volley_ball", Musculation: "Musculation", Rugby: "Rugby", Athletisme: "Athletisme", Tennis: "Tennis", ArtsMartiaux: "ArtsMartiaux", Autre: "Autre" };
          baseData.sports = Object.entries(sportMapping).filter(([key]) => eleve.Sport[key]).map(([key]) => sportMapping[key]);
        }
        return baseData;
      });

      if (eleve.specialites?.length > 0) {
        setSpecialites(eleve.specialites.map(sp => ({ id: sp.id, categorie: sp.categorie || '', detail: sp.detail || '', niveauQualification: sp.niveauQualification || '' })));
      } else {
        setSpecialites([{ categorie: '', detail: '', niveauQualification: '' }]);
      }

      if (eleve.image && typeof eleve.image === "string") setPreviewImage(eleve.image);
    }
  }, [eleve]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
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
            setFormData({ ...formData, image: resized });
            setPreviewImage(URL.createObjectURL(resized));
          }, isJPEG ? 'image/jpeg' : 'image/png', isJPEG ? 0.7 : 1.0);
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

  const handleChange = (e, index = null) => {
    const { name, value } = e.target;
    if (name.startsWith('famille.enfants')) {
      const field = name.split('.')[2];
      const newEnfants = [...formData.famille.enfants];
      newEnfants[index][field] = value;
      setFormData(prev => ({ ...prev, famille: { ...prev.famille, enfants: newEnfants } }));
    } else if (name.startsWith('famille.soeur')) {
      const field = name.split('.')[2];
      const newSoeur = [...formData.famille.soeur];
      newSoeur[index][field] = value;
      setFormData(prev => ({ ...prev, famille: { ...prev.famille, soeur: newSoeur } }));
    } else if (name.startsWith('famille.frere')) {
      const field = name.split('.')[2];
      const newFrere = [...formData.famille.frere];
      newFrere[index][field] = value;
      setFormData(prev => ({ ...prev, famille: { ...prev.famille, frere: newFrere } }));
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
  const handleSpecialiteChange = (index, field, value) => setSpecialites(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });

  const supprimerSpecialite = async (index) => {
    const sp = specialites[index];
    if (specialites.length === 1) {
      if (sp.id) { try { await specialiteService.delete(sp.id); } catch { Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de supprimer la spécialité.' }); return; } }
      setSpecialites([{ categorie: '', detail: '', niveauQualification: '' }]);
      return;
    }
    if (sp.id) { try { await specialiteService.delete(sp.id); } catch { Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de supprimer la spécialité.' }); return; } }
    setSpecialites(prev => prev.filter((_, i) => i !== index));
  };

  const supprimerEnfant = (index) => setFormData(prev => { const e = [...prev.famille.enfants]; e.splice(index, 1); return { ...prev, famille: { ...prev.famille, enfants: e } }; });
  const ajouterEnfant = () => setFormData(prev => ({ ...prev, famille: { ...prev.famille, enfants: [...prev.famille.enfants, { nom: '', prenom: '', dateNaissance: '', sexe: '' }] } }));
  const ajouterFrere = () => setFormData(prev => ({ ...prev, famille: { ...prev.famille, frere: [...prev.famille.frere, { nom: '', profession: '' }] } }));
  const ajouterSoeur = () => setFormData(prev => ({ ...prev, famille: { ...prev.famille, soeur: [...prev.famille.soeur, { nom: '', profession: '' }] } }));
  const supprimerFrere = (index) => setFormData(prev => { const f = [...prev.famille.frere]; f.splice(index, 1); return { ...prev, famille: { ...prev.famille, frere: f } }; });
  const supprimerSoeur = (index) => setFormData(prev => { const s = [...prev.famille.soeur]; s.splice(index, 1); return { ...prev, famille: { ...prev.famille, soeur: s } }; });

  const handleSave = async () => {
    try {
      const fd = new FormData();
      for (const key in formData) {
        if (key !== "image" && formData[key] !== undefined && formData[key] !== null) {
          if (["famille", "Diplome", "sports", "Filiere", "Pointure"].includes(key)) fd.append(key, JSON.stringify(formData[key]));
          else fd.append(key, formData[key]);
        }
      }
      if (formData.image && typeof formData.image === "object") fd.append("image", formData.image);

      const response = await eleveService.put(eleve.id, fd);

      const supprimees = specialites.filter(sp => sp.id && sp.categorie.trim() === '');
      for (const sp of supprimees) await specialiteService.delete(sp.id);

      const filtrees = specialites.filter(sp => sp.categorie.trim() !== '');
      for (const sp of filtrees.filter(sp => sp.id)) await specialiteService.put(sp.id, { categorie: sp.categorie, detail: sp.detail || '', niveauQualification: sp.niveauQualification || '' });

      const nouvelles = filtrees.filter(sp => !sp.id);
      if (nouvelles.length > 0) await specialiteService.bulkCreate(eleve.id, { specialites: nouvelles });

      if (response.status === 200) {
        await Swal.fire({ icon: 'success', title: 'Succès', text: 'Élève mis à jour avec succès !', timer: 2000, showConfirmButton: false });
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Erreur lors de la mise à jour.' });
      }
    } catch (error) {
      console.error("Erreur handleSave :", error);
      Swal.fire({ icon: 'error', title: 'Erreur serveur', text: 'Erreur serveur lors de la mise à jour.' });
    }
  };

  // ─── Tabs config ──────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'identite', label: 'Identité', icon: '👤' },
    { id: 'militaire', label: 'Militaire', icon: '🎖️' },
    { id: 'formation', label: 'Formation', icon: '🎓', count: Object.values(formData.Diplome || {}).filter(Boolean).length || undefined },
    { id: 'aptitudes', label: 'Aptitudes', icon: '⚡', count: specialites.filter(s => s.categorie).length || undefined },
    { id: 'famille', label: 'Famille', icon: '👨‍👩‍👧‍👦' },
    { id: 'effets', label: 'Effets', icon: '👗' },
  ];

  if (!eleve) return null;

  const nomComplet = `${eleve.nom || '—'} ${eleve.prenom || ''}`.trim();

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Modal show={show} onHide={onClose} size="xl" className="modal-overlay">
        {/* ── Header ── */}
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 24px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            {/* Photo + nom */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowFullImage(true)}>
              <img
                src={previewImage || formData.image || '/placeholder.png'}
                alt="Photo élève"
                style={{
                  width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover',
                  border: '2px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              />
              <div style={{
                position: 'absolute', bottom: '-3px', right: '-3px', background: '#3b82f6',
                borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '8px', border: '2px solid #fff'
              }}>🔍</div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
                {nomComplet || 'Modifier un élève'}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                {eleve.matricule && <Badge bg="secondary" style={{ fontSize: '10px' }}>#{eleve.matricule}</Badge>}
                {eleve.escadron && <Badge bg="primary" style={{ fontSize: '10px' }}>ESC {eleve.escadron}</Badge>}
                {eleve.peloton && <Badge bg="info" style={{ fontSize: '10px' }}>PEL {eleve.peloton}</Badge>}
                {eleve.sexe && <Badge bg={eleve.sexe === 'Masculin' ? 'primary' : 'danger'} style={{ fontSize: '10px' }}>{eleve.sexe}</Badge>}
              </div>
            </div>

            {/* Upload photo */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
              background: '#fff', border: '1.5px solid #d1d5db', borderRadius: '8px',
              cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#374151'
            }}>
              📷 Photo
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          </div>
        </Modal.Header>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', overflowX: 'auto', borderBottom: '1px solid #e5e7eb',
          background: '#fff', paddingLeft: '8px', gap: '0'
        }}>
          {tabs.map(tab => (
            <TabButton key={tab.id} {...tab} active={activeTab === tab.id} onClick={setActiveTab} />
          ))}
        </div>

        {/* ── Body ── */}
        <Modal.Body style={{ background: '#f1f5f9', padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
          <Form>

            {/* ═══ TAB: IDENTITÉ ══════════════════════════════════════════════ */}
            {activeTab === 'identite' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                <SectionCard title="État civil" icon="📋" accent="#3b82f6">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <FieldGroup label="Nom" required>
                      <input className="form-control" name="nom" value={eleve.nom || ''} onChange={onChange} placeholder="NOM" style={{ textTransform: 'uppercase', fontWeight: '600' }} />
                    </FieldGroup>
                    <FieldGroup label="Prénom" required>
                      <input className="form-control" name="prenom" value={eleve.prenom || ''} onChange={onChange} placeholder="Prénom" />
                    </FieldGroup>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <FieldGroup label="Date de naissance">
                      <input type="date" className="form-control" name="dateNaissance" value={eleve.dateNaissance || ''} onChange={onChange} />
                    </FieldGroup>
                    <FieldGroup label="Lieu de naissance">
                      <input className="form-control" name="lieuNaissance" value={eleve.lieuNaissance || ''} onChange={onChange} placeholder="Ville" />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Sexe">
                    <InlineRadioGroup options={['Masculin', 'Feminin']} name="sexe" value={eleve.sexe} onChange={onChange} labelMap={{ Feminin: 'Féminin' }} />
                  </FieldGroup>
                  <FieldGroup label="Situation de famille">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {['Celibataire', 'Marie', 'Divorce'].map(s => (
                        <CheckPill key={s} label={s} checked={eleve.situationFamiliale === s} onChange={() => onChange({ target: { name: 'situationFamiliale', value: s } })} />
                      ))}
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Foko (ethnie)">
                    <select className="form-select" name="fady" value={eleve.fady || ''} onChange={onChange}>
                      <option value="">— Sélectionner —</option>
                      {["ANTAIFASY","ANTAIMORO","ANTAMBAHOAKA","ANTANDROY","ANTANOSY","ANTAKARANA","BARA","BEZANOZANO","BETSILEO","BETSIMISARAKA","MAHAFALY","MERINA","MIKEA","SAKALAVA","SIHANAKA","TANALA","TSIMIHETY","VEZO"].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </FieldGroup>
                </SectionCard>

                <div>
                  <SectionCard title="Pièce d'identité (CIN)" icon="🪪" accent="#8b5cf6">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <FieldGroup label="Numéro CIN">
                        <input className="form-control" name="CIN" value={eleve.CIN || ''} onChange={onChange} placeholder="N° CIN" />
                      </FieldGroup>
                      <FieldGroup label="Date de délivrance">
                        <input type="date" className="form-control" name="dateDelivrance" value={eleve.dateDelivrance || ''} onChange={onChange} />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="Lieu de délivrance">
                      <input className="form-control" name="lieuDelivrance" value={eleve.lieuDelivrance || ''} onChange={onChange} placeholder="Lieu" />
                    </FieldGroup>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <FieldGroup label="Duplicata (date)">
                        <input type="date" className="form-control" name="duplicata" value={eleve.duplicata || ''} onChange={onChange} />
                      </FieldGroup>
                      <FieldGroup label="Lieu duplicata">
                        <input className="form-control" name="lieuDuplicata" value={eleve.lieuDuplicata || ''} onChange={onChange} placeholder="Lieu" />
                      </FieldGroup>
                    </div>
                  </SectionCard>

                  <SectionCard title="Contacts" icon="📱" accent="#10b981">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      {['telephone1', 'telephone2', 'telephone3'].map((k, i) => (
                        <FieldGroup key={k} label={`Tél ${i + 1}`}>
                          <input className="form-control" placeholder={`03X XX XXX XX`} maxLength="11" value={formData[k] || ''} onChange={e => handlePhoneChange(e, k)} />
                        </FieldGroup>
                      ))}
                    </div>
                    <FieldGroup label="Loisirs" hint="Activités, passions, centres d'intérêt">
                      <input className="form-control" name="facebook" value={eleve.facebook || ''} onChange={onChange} placeholder="Ex: Lecture, Musique..." />
                    </FieldGroup>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* ═══ TAB: MILITAIRE ═════════════════════════════════════════════ */}
            {activeTab === 'militaire' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                <SectionCard title="Affectation & Unité" icon="🎖️" accent="#f59e0b">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <FieldGroup label="N° Candidature">
                      <input className="form-control" name="numCandidature" value={eleve.numCandidature || ''} onChange={onChange} />
                    </FieldGroup>
                    <FieldGroup label="N° Incorporation">
                      <input className="form-control" name="numeroIncorporation" value={eleve.numeroIncorporation || ''} onChange={onChange} />
                    </FieldGroup>
                    <FieldGroup label="Matricule">
                      <input className="form-control" name="matricule" value={eleve.matricule || ''} onChange={onChange} />
                    </FieldGroup>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <FieldGroup label="Escadron">
                      <select className="form-select" name="escadron" value={formData.escadron || ''} onChange={handleChange}>
                        <option value="">— Sélectionner —</option>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Peloton">
                      <select className="form-select" name="peloton" value={formData.peloton || ''} onChange={handleChange}>
                        <option value="">— Sélectionner —</option>
                        {[1, 2, 3].map(i => <option key={i} value={String(i)}>{i}</option>)}
                      </select>
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Relation(s) gênante(s)" hint="Toerana tsy tokony hiasana">
                    <textarea className="form-control" name="relationGenante" rows="3" value={formData.relationGenante || ''} onChange={handleChange} placeholder="Préciser si applicable..." />
                  </FieldGroup>
                </SectionCard>

                <SectionCard title="Concours" icon="📝" accent="#ef4444">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <FieldGroup label="Centre de concours">
                      <input className="form-control" name="centreConcours" value={eleve.centreConcours || ''} onChange={onChange} />
                    </FieldGroup>
                    <FieldGroup label="Genre de concours">
                      <select className="form-select" name="genreConcours" value={eleve.genreConcours || ''} onChange={onChange}>
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
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px',
                            borderRadius: '8px', border: `1.5px solid ${formData.Specialiste === val ? '#3b82f6' : '#e5e7eb'}`,
                            background: formData.Specialiste === val ? '#eff6ff' : '#fff',
                            cursor: 'pointer', fontSize: '13px', fontWeight: formData.Specialiste === val ? '600' : '400'
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

            {/* ═══ TAB: FORMATION ═════════════════════════════════════════════ */}
            {activeTab === 'formation' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                <SectionCard title="Niveau d'études" icon="📚" accent="#6366f1">
                  <FieldGroup label="Dernière classe suivie">
                    <select className="form-select" name="niveau" value={formData.niveau || ''} onChange={handleChange}>
                      <option value="">— Sélectionner —</option>
                      {["BACC", "BACC +1", "BACC +2", "BACC +3", "BACC +4", "BACC +5", "BACC +6", "BACC +7", "BACC +8"].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Filière">
                    <input className="form-control" name="niveaufiliere" value={eleve.niveaufiliere || ''} onChange={onChange} placeholder="Ex: Informatique, Droit..." />
                  </FieldGroup>
                </SectionCard>

                <SectionCard title="Diplômes obtenus" icon="🏅" accent="#f59e0b">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { label: "CEPE", key: "CEPE" }, { label: "BEPC", key: "BEPC" },
                      { label: "BACC S", key: "BACC_S" }, { label: "BACC L", key: "BACC_L" },
                      { label: "BACC Technique", key: "BACC_TECHNIQUE" }, { label: "Licence", key: "Licence" },
                      { label: "Master 1", key: "MasterOne" }, { label: "Master 2", key: "MasterTwo" },
                      { label: "Doctorat", key: "Doctorat" },
                    ].map(({ label, key }) => (
                      <CheckPill
                        key={key}
                        label={label}
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

            {/* ═══ TAB: APTITUDES ═════════════════════════════════════════════ */}
            {activeTab === 'aptitudes' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                <SectionCard title="Spécialités & Aptitudes" icon="⚡" accent="#8b5cf6">
                  {formData.SpecialisteAptitude && (
                    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px', marginBottom: '14px' }}>
                      <small style={{ color: '#92400e', fontWeight: '600', fontSize: '11px' }}>⚠️ Ancienne donnée</small>
                      <input className="form-control form-control-sm mt-1" name="SpecialisteAptitude" value={formData.SpecialisteAptitude || ''} onChange={handleChange} />
                    </div>
                  )}

                  {specialites.map((sp, index) => (
                    <div key={index} style={{
                      background: '#f8fafc', border: '1.5px solid #e2e8f0',
                      borderRadius: '10px', padding: '14px', marginBottom: '12px', position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Spécialité {index + 1}
                        </span>
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerSpecialite(index)}
                          style={{ padding: '2px 8px', fontSize: '12px', borderRadius: '6px' }}>
                          🗑️
                        </button>
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

                  <button type="button" className="btn btn-outline-primary btn-sm w-100" onClick={ajouterSpecialite}
                    style={{ borderRadius: '8px', fontWeight: '600', borderStyle: 'dashed' }}>
                    + Ajouter une spécialité / aptitude
                  </button>
                </SectionCard>

                <div>
                  <SectionCard title="Sports pratiqués" icon="🏅" accent="#10b981">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {["Football", "Basketball", "Volley_ball", "Musculation", "Rugby", "Athletisme", "Tennis", "ArtsMartiaux", "Autre"].map(sport => (
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

                  <SectionCard title="Religion" icon="✝️" accent="#f59e0b">
                    <InlineRadioGroup options={["EKAR", "FJKM", "FLM", "ISLAM", "Autre"]} name="religion" value={formData.religion || ''} onChange={handleChange} />
                  </SectionCard>

                  <SectionCard title="Groupe sanguin" icon="🩸" accent="#ef4444">
                    <InlineRadioGroup options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} name="groupeSaguin" value={formData.groupeSaguin || ''} onChange={handleChange} />
                  </SectionCard>
                </div>
              </div>
            )}

            {/* ═══ TAB: FAMILLE ═══════════════════════════════════════════════ */}
            {activeTab === 'famille' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '4px' }}>
                  <MembreFamilleCard label="Conjoint(e)" membreKey="conjointe" icon="💑" accent="#6366f1" formData={formData} setFormData={setFormData} />
                  <MembreFamilleCard label="Père (Ray)" membreKey="pere" icon="👨" accent="#3b82f6" formData={formData} setFormData={setFormData} />
                  <MembreFamilleCard label="Mère (Reny)" membreKey="mere" icon="👩" accent="#ec4899" formData={formData} setFormData={setFormData} />
                  <MembreFamilleCard label="À prévenir en cas d'accident" membreKey="accident" icon="🚨" accent="#ef4444" formData={formData} setFormData={setFormData} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <SectionCard title="Enfants légitimes" icon="👶" accent="#10b981">
                    {formData.famille?.enfants?.map((enfant, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#9ca3af', minWidth: '20px', fontWeight: '600' }}>{i + 1}.</span>
                        <input className="form-control form-control-sm" name="famille.enfants.nom" value={enfant.nom} onChange={e => handleChange(e, i)} placeholder="Nom et prénoms" style={{ flex: 1 }} />
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerEnfant(i)} style={{ padding: '2px 8px' }}>🗑️</button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline-success btn-sm w-100 mt-1" onClick={ajouterEnfant} style={{ borderRadius: '8px', borderStyle: 'dashed' }}>
                      + Ajouter un enfant
                    </button>
                  </SectionCard>

                  <SectionCard title="Frères & Sœurs" icon="👫" accent="#f59e0b">
                    {/* ── Frères ── */}
                    {formData.famille?.frere?.length > 0 && (
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                        Frères
                      </p>
                    )}
                    {formData.famille?.frere?.map((f, i) => (
                      <div key={i} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: '8px', padding: '10px', marginBottom: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>Frère {i + 1}</span>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerFrere(i)} style={{ padding: '1px 7px', fontSize: '12px' }}>🗑️</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Nom</label>
                            <input
                              className="form-control form-control-sm"
                              name={`famille.frere.nom`}
                              value={f.nom || ''}
                              onChange={e => handleChange(e, i)}
                              placeholder="Nom et prénoms"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Profession</label>
                            <input
                              className="form-control form-control-sm"
                              name={`famille.frere.profession`}
                              value={f.profession || ''}
                              onChange={e => handleChange(e, i)}
                              placeholder="Profession"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline-primary btn-sm w-100 mb-3" onClick={ajouterFrere} style={{ borderRadius: '8px', borderStyle: 'dashed' }}>+ Frère</button>

                    {/* ── Sœurs ── */}
                    {formData.famille?.soeur?.length > 0 && (
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                        Sœurs
                      </p>
                    )}
                    {formData.famille?.soeur?.map((s, i) => (
                      <div key={i} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: '8px', padding: '10px', marginBottom: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>Sœur {i + 1}</span>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => supprimerSoeur(i)} style={{ padding: '1px 7px', fontSize: '12px' }}>🗑️</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Nom</label>
                            <input
                              className="form-control form-control-sm"
                              name={`famille.soeur.nom`}
                              value={s.nom || ''}
                              onChange={e => handleChange(e, i)}
                              placeholder="Nom et prénoms"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Profession</label>
                            <input
                              className="form-control form-control-sm"
                              name={`famille.soeur.profession`}
                              value={s.profession || ''}
                              onChange={e => handleChange(e, i)}
                              placeholder="Profession"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline-primary btn-sm w-100" onClick={ajouterSoeur} style={{ borderRadius: '8px', borderStyle: 'dashed' }}>+ Sœur</button>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* ═══ TAB: EFFETS ════════════════════════════════════════════════ */}
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
                              padding: '8px 16px', borderRadius: '8px', border: `2px solid ${active ? '#ec4899' : '#e5e7eb'}`,
                              background: active ? '#fdf2f8' : '#fff', color: active ? '#be185d' : '#374151',
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
                              padding: '5px 10px', borderRadius: '6px', border: `1.5px solid ${active ? '#3b82f6' : '#e5e7eb'}`,
                              background: active ? '#eff6ff' : '#fff', color: active ? '#1d4ed8' : '#374151',
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
        <Modal.Footer style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Navigation entre onglets */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {tabs.findIndex(t => t.id === activeTab) > 0 && (
              <button type="button" className="btn btn-outline-secondary btn-sm"
                onClick={() => setActiveTab(tabs[tabs.findIndex(t => t.id === activeTab) - 1].id)}
                style={{ borderRadius: '8px' }}>
                ← Précédent
              </button>
            )}
            {tabs.findIndex(t => t.id === activeTab) < tabs.length - 1 && (
              <button type="button" className="btn btn-outline-primary btn-sm"
                onClick={() => setActiveTab(tabs[tabs.findIndex(t => t.id === activeTab) + 1].id)}
                style={{ borderRadius: '8px' }}>
                Suivant →
              </button>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              Onglet {tabs.findIndex(t => t.id === activeTab) + 1}/{tabs.length}
            </span>
            <Button variant="outline-secondary" onClick={onClose} style={{ borderRadius: '8px' }}>
              Annuler
            </Button>
            {user?.type === 'admin' && (
              <Button variant="primary" onClick={handleSave}
                style={{ borderRadius: '8px', fontWeight: '600', padding: '8px 20px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none' }}>
                💾 Enregistrer les modifications
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>

      {/* ── Lightbox photo — rendu hors du modal via portal ── */}
      {showFullImage && ReactDOM.createPortal(
        <div
          onClick={() => setShowFullImage(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999999,
            backdropFilter: 'blur(6px)'
          }}
        >
          <img
            src={previewImage || formData.image}
            alt="Aperçu en grand"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '80vw', maxHeight: '80vh',
              borderRadius: '16px',
              border: '3px solid rgba(255,255,255,0.25)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)'
            }}
          />
          <button
            onClick={() => setShowFullImage(false)}
            style={{
              position: 'absolute', top: '24px', right: '24px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%', width: '42px', height: '42px',
              color: '#fff', fontSize: '20px', cursor: 'pointer',
              backdropFilter: 'blur(4px)', lineHeight: 1
            }}
          >✕</button>
        </div>,
        document.body
      )}
    </>
  );
};

export default ModalModificationEleve;
