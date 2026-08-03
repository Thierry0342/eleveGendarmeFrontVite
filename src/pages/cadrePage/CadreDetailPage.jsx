import 'bootstrap/dist/css/bootstrap.min.css';
import './cadre-theme.css';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import cadreService from '../../services/cadre-service';

// Ajuste selon la route réelle de ta page de création/édition.
const CADRE_FORM_ROUTE = '/cadre-form';

const SECTION_ANCHORS = [
  { id: 'identite', label: 'Identification' },
  { id: 'etat-civil', label: 'État civil' },
  { id: 'epoux', label: 'Époux(se)' },
  { id: 'enfants', label: 'Enfants' },
  { id: 'carriere', label: 'Carrière' },
  { id: 'distinctions', label: 'Distinctions & punitions' },
  { id: 'diplomes', label: 'Diplômes' },
  { id: 'sanitaire', label: 'Sanitaire' },
  { id: 'divers', label: 'Divers' },
];

// ----- Petits composants d'affichage -----

const InfoRow = ({ label, value, colClass = "col-md-4" }) => (
  <div className={`info-row ${colClass}`}>
    <div className="info-label">{label}</div>
    <div className={`info-value ${!value ? 'empty' : ''}`}>{value || 'Non renseigné'}</div>
  </div>
);

const SectionCard = ({ id, numeral, title, children }) => (
  <div id={id} className="cadre-section-panel mb-4">
    <div className="section-eyebrow">
      {numeral && <span className="numeral">{numeral}</span>}
      <span className="title">{title}</span>
    </div>
    {children}
  </div>
);

const DataTableView = ({ columns, rows, emptyLabel }) => {
  if (!rows || rows.length === 0) {
    return <div className="empty-state" style={{ padding: '1.5rem' }}><i className="fa fa-inbox"></i>{emptyLabel}</div>;
  }
  return (
    <div className="table-responsive">
      <table className="detail-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => <td key={c.key}>{row[c.key] || '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CadreDetailPage = () => {
  const { matricule } = useParams();
  const navigate = useNavigate();
  const [cadre, setCadre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setNotFound(false);
    cadreService.getbyMat(matricule)
      .then((response) => {
        if (!mounted) return;
        if (!response.data) {
          setNotFound(true);
        } else {
          setCadre(response.data);
        }
      })
      .catch((error) => {
        console.error('Erreur de chargement du cadre', error);
        if (mounted) setNotFound(true);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [matricule]);

  const handleDelete = async () => {
    if (!cadre) return;
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: `Supprimer définitivement la fiche de ${cadre.nom} ${cadre.prenom} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });
    if (result.isConfirmed) {
      try {
        await cadreService.delete(cadre.id);
        Swal.fire('Supprimé !', 'Le cadre a été supprimé.', 'success');
        navigate('/cadre');
      } catch (error) {
        console.error('Erreur lors de la suppression :', error);
        Swal.fire('Erreur', "La suppression a échoué.", 'error');
      }
    }
  };

  const handleEdit = () => {
    // Transmet la fiche au formulaire via l'état de navigation, pour
    // pré-remplir directement le mode édition (voir CadreFormBootstrap).
    navigate(CADRE_FORM_ROUTE, { state: { editCadre: cadre } });
  };

  if (loading) {
    return (
      <div className="cadre-app py-5 text-center">
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Chargement...</span></div>
      </div>
    );
  }

  if (notFound || !cadre) {
    return (
      <div className="cadre-app py-5">
        <div className="container-fluid px-4">
          <div className="empty-state">
            <i className="fa fa-user-slash"></i>
            Aucun cadre trouvé pour le matricule <strong>{matricule}</strong>.
            <div className="mt-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/cadre-form')}>
                <i className="fa fa-arrow-left me-1"></i> Retour au répertoire
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const photoUrl = cadreService.getPhotoUrl(cadre.photo);

  return (
    <div className="cadre-app py-4">
      <div className="container-fluid px-4">
        <div className="cadre-page-header">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/cadre-form')}>
            <i className="fa fa-arrow-left me-1"></i> Retour au répertoire
          </button>
          <div className="d-flex gap-2">
            <button className="btn btn-warning btn-sm" onClick={handleEdit}>
              <i className="fa fa-edit me-1"></i> Modifier
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
              <i className="fa fa-trash me-1"></i> Supprimer
            </button>
          </div>
        </div>

        {/* ----- En-tête profil ----- */}
        <div className="detail-hero">
          {photoUrl ? (
            <img src={photoUrl} alt={`${cadre.nom} ${cadre.prenom}`} className="cadre-avatar" />
          ) : (
            <div className="cadre-avatar-placeholder"><i className="fa fa-user fa-2x"></i></div>
          )}
          <div>
            <h2>{cadre.nom} {cadre.prenom}</h2>
            <div className="matricule">Matricule n° {cadre.matricule}</div>
            <div className="mt-2 d-flex gap-2 align-items-center flex-wrap">
              {cadre.grade && <span className="badge-grade">{cadre.grade}</span>}
              {cadre.service && <span className="badge-grade">{cadre.service}</span>}
            </div>
          </div>
        </div>

        {/* ----- Navigation rapide ----- */}
        <div className="detail-nav">
          {SECTION_ANCHORS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>{s.label}</a>
          ))}
        </div>

        {/* ----- Identification ----- */}
        <SectionCard id="identite" title="Identification & Position">
          <div className="info-grid mb-3">
            <InfoRow label="Téléphone" value={cadre.phone} />
            <InfoRow label="Grade actuel" value={cadre.grade} />
            <InfoRow label="Service / Unité" value={cadre.service} />
          </div>
          <p className="subgroup-label">Position effective</p>
          <div className="info-grid mb-3">
            <InfoRow label="Unité d'affectation" value={cadre.positionEffectiveUnite} />
            <InfoRow label="Fonction" value={cadre.positionEffectiveFonction} />
            <InfoRow label="Compter du" value={cadre.positionEffectiveDepuisLe} />
            <InfoRow label="Disponible à/c du" value={cadre.positionEffectiveDisponibleLe} />
          </div>
          <p className="subgroup-label">Position théorique</p>
          <div className="info-grid">
            <InfoRow label="Unité d'affectation" value={cadre.positionTheoriqueUnite} />
            <InfoRow label="Fonction" value={cadre.positionTheoriqueFonction} />
            <InfoRow label="Compter du" value={cadre.positionTheoriqueDepuisLe} />
            <InfoRow label="Disponible à/c du" value={cadre.positionTheoriqueDisponibleLe} />
          </div>
        </SectionCard>

        {/* ----- Etat civil ----- */}
        <SectionCard id="etat-civil" numeral="I" title="État civil">
          <div className="info-grid mb-3">
            <InfoRow label="Date de naissance" value={cadre.dateNaissance} />
            <InfoRow label="Lieu de naissance" value={cadre.lieuNaissance} />
            <InfoRow label="Sexe" value={cadre.sexe} />
            <InfoRow label="Groupe sanguin" value={cadre.groupeSanguin} />
            <InfoRow label="Taille" value={cadre.taille ? `${cadre.taille} m` : ''} />
            <InfoRow label="Groupe ethnique" value={cadre.groupeEthnique} />
            <InfoRow label="Religion" value={cadre.religion} />
            <InfoRow label="Fils/Fille de (père)" value={cadre.pereNomPrenom} />
            <InfoRow label="Et de (mère)" value={cadre.mereNomPrenom} />
          </div>
          <p className="subgroup-label">Carte d'identité</p>
          <div className="info-grid mb-3">
            <InfoRow label="C.I.N n°" value={cadre.cin} />
            <InfoRow label="Délivrée le" value={cadre.cinDelivreLe} />
            <InfoRow label="Délivrée à" value={cadre.cinDelivreA} />
          </div>
          <p className="subgroup-label">Situation matrimoniale</p>
          <div className="info-grid">
            <InfoRow label="Marié(e) le" value={cadre.dateMariage} />
            <InfoRow label="Autorisation de mariage" value={cadre.autorisationMariage} />
            <InfoRow label="Mariage rompu le" value={cadre.mariageRompuLe} />
            <InfoRow label="Motif" value={cadre.motifRompuMariage} />
            <InfoRow label="Remarié le" value={cadre.remarieLe} />
            <InfoRow label="2ème autorisation" value={cadre.deuxiemeAutorisationMariage} />
          </div>
        </SectionCard>

        {/* ----- Epoux(se) ----- */}
        <SectionCard id="epoux" numeral="II" title="Époux(se) actuel(le)">
          <div className="info-grid">
            <InfoRow label="Nom et prénoms" value={cadre.epouxNomPrenom} colClass="col-md-12" />
            <InfoRow label="Fonction" value={cadre.epouxFonction} />
            <InfoRow label="Matricule" value={cadre.epouxMatricule} />
            <InfoRow label="C.I.N n°" value={cadre.epouxCin} />
            <InfoRow label="Organisme employeur" value={cadre.epouxOrganismeEmployeur} />
            <InfoRow label="Référence décision incorporation" value={cadre.epouxRefDecisionIncorporation} />
            <InfoRow label="Délivrée le / à" value={[cadre.epouxDelivreLe, cadre.epouxDelivreA].filter(Boolean).join(' à ')} />
          </div>
        </SectionCard>

        {/* ----- Enfants ----- */}
        <SectionCard id="enfants" numeral="III" title="Enfants">
          <DataTableView
            emptyLabel="Aucun enfant enregistré."
            columns={[
              { key: 'numero', label: 'N°' },
              { key: 'nomPrenom', label: 'Nom et prénoms' },
              { key: 'dateNaissance', label: 'Date naissance' },
              { key: 'lieuNaissance', label: 'Lieu naissance' },
              { key: 'qualite', label: 'Qualité' },
              { key: 'sexe', label: 'Sexe' },
              { key: 'observation', label: 'Observation' },
            ]}
            rows={cadre.enfants}
          />
        </SectionCard>

        {/* ----- Carrière (services militaires, incorporation, grades, affectations) ----- */}
        <SectionCard id="carriere" numeral="IV—VI, XII" title="Carrière">
          <p className="subgroup-label">Services militaire effectué</p>
          <DataTableView
            emptyLabel="Aucun service militaire enregistré."
            columns={[
              { key: 'typeService', label: 'Type' },
              { key: 'dateDebut', label: 'Début' },
              { key: 'dateFin', label: 'Fin' },
              { key: 'promoClasse', label: 'Promo/Classe' },
              { key: 'mleSN', label: 'Mle SN' },
            ]}
            rows={cadre.servicesMilitaires}
          />
          <p className="subgroup-label">Incorporation</p>
          <div className="info-grid mb-2">
            <InfoRow label="Date d'incorporation" value={cadre.dateIncorporation} />
            <InfoRow label="Diplôme / décision" value={cadre.diplomeDecisionIncorporation} colClass="col-md-8" />
          </div>
          <p className="subgroup-label">Grades successifs</p>
          <DataTableView
            emptyLabel="Aucun grade enregistré."
            columns={[
              { key: 'grade', label: 'Grade' },
              { key: 'dateNomination', label: 'Date nomination' },
              { key: 'refDecision', label: 'Réf décision' },
            ]}
            rows={cadre.gradesSuccessifs}
          />
          <p className="subgroup-label">Affectations successives</p>
          <DataTableView
            emptyLabel="Aucune affectation enregistrée."
            columns={[
              { key: 'unite', label: 'Unité' },
              { key: 'fonction', label: 'Fonction' },
              { key: 'acDuLe', label: 'À/C du' },
              { key: 'refDecision', label: 'Réf décision' },
              { key: 'motif', label: 'Motif' },
              { key: 'dateDisponibilite', label: 'Disponibilité' },
            ]}
            rows={cadre.affectations}
          />
          <p className="subgroup-label">Serments</p>
          <DataTableView
            emptyLabel="Aucun serment enregistré."
            columns={[
              { key: 'typePrestation', label: 'Type' },
              { key: 'datePrestation', label: 'Date' },
              { key: 'lieu', label: 'Lieu' },
              { key: 'observations', label: 'Observations' },
            ]}
            rows={cadre.serments}
          />
        </SectionCard>

        {/* ----- Distinctions & punitions ----- */}
        <SectionCard id="distinctions" numeral="VII—IX" title="Distinctions & punitions">
          <p className="subgroup-label">Décorations successives</p>
          <DataTableView
            emptyLabel="Aucune décoration enregistrée."
            columns={[
              { key: 'nature', label: 'Nature' },
              { key: 'refAttribution', label: 'Réf attribution' },
              { key: 'datePriseEffet', label: 'Date effet' },
            ]}
            rows={cadre.decorations}
          />
          <p className="subgroup-label">Félicitations</p>
          <DataTableView
            emptyLabel="Aucune félicitation enregistrée."
            columns={[
              { key: 'nature', label: 'Nature' },
              { key: 'reference', label: 'Référence' },
              { key: 'libelle', label: 'Libellé' },
              { key: 'autorite', label: 'Autorité' },
            ]}
            rows={cadre.felicitations}
          />
          <p className="subgroup-label">Punitions</p>
          <DataTableView
            emptyLabel="Aucune punition enregistrée."
            columns={[
              { key: 'taux', label: 'Taux' },
              { key: 'type', label: 'Type' },
              { key: 'dpe', label: 'D.P.E.' },
              { key: 'autoriteInfligeante', label: 'Autorité' },
              { key: 'reference', label: 'Référence' },
              { key: 'libelle', label: 'Libellé' },
            ]}
            rows={cadre.punitions}
          />
        </SectionCard>

        {/* ----- Diplômes ----- */}
        <SectionCard id="diplomes" numeral="X" title="Diplômes et brevets">
          <DataTableView
            emptyLabel="Aucun diplôme enregistré."
            columns={[
              { key: 'categorie', label: 'Catégorie' },
              { key: 'intitule', label: 'Intitulé' },
              { key: 'reference', label: 'Référence' },
              { key: 'entite', label: 'Entité' },
            ]}
            rows={cadre.diplomes}
          />
        </SectionCard>

        {/* ----- Sanitaire ----- */}
        <SectionCard id="sanitaire" numeral="XIII" title="Renseignements sanitaires">
          <p className="subgroup-label">PATC</p>
          <div className="info-grid mb-3">
            <InfoRow label="Référence" value={cadre.sanitairePATC?.reference} />
            <InfoRow label="Médecin traitant" value={cadre.sanitairePATC?.medecinTraitant} />
            <InfoRow label="Nombre PATC" value={cadre.sanitairePATC?.nombrePATC} />
            <InfoRow label="Date début" value={cadre.sanitairePATC?.dateDebutPATC} />
            <InfoRow label="Renouvelable" value={cadre.sanitairePATC?.renouvelable} />
          </div>
          <p className="subgroup-label">CREFA</p>
          <div className="info-grid">
            <InfoRow label="Référence" value={cadre.sanitaireCREFA?.reference} />
            <InfoRow label="Type" value={cadre.sanitaireCREFA?.type} />
            <InfoRow label="Référence envoi CREFA" value={cadre.sanitaireCREFA?.referenceEnvoiCREFA} />
            <InfoRow label="Référence envoi finance" value={cadre.sanitaireCREFA?.referenceEnvoiFinance} />
            <InfoRow label="Observation" value={cadre.sanitaireCREFA?.observation} colClass="col-md-12" />
          </div>
        </SectionCard>

        {/* ----- Divers ----- */}
        <SectionCard id="divers" numeral="XIV" title="Relations gênantes & pièces jointes">
          <p className="subgroup-label">Relations ou intérêts gênants</p>
          <DataTableView
            emptyLabel="Aucune relation gênante déclarée."
            columns={[
              { key: 'type', label: 'Type' },
              { key: 'districtRegion', label: 'District / région' },
            ]}
            rows={cadre.relationsInterets}
          />
          <p className="subgroup-label">Pièces jointes</p>
          <div className="info-grid">
            <InfoRow label="Nombre pièces jointes" value={cadre.nombrePiecesJointes} />
            <InfoRow label="Nombre feuilles supplémentaires" value={cadre.nombreFeuillesSupplementaires} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default CadreDetailPage;
