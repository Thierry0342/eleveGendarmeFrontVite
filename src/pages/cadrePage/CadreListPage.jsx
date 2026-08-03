import 'bootstrap/dist/css/bootstrap.min.css';
import './cadre-theme.css';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import cadreService from '../../services/cadre-service';

// Ajuste ce chemin pour qu'il pointe vers ta page de création/édition
// (le composant CadreFormBootstrap), selon la route que tu as déclarée
// dans ton routeur (App.jsx / router.jsx).
const CADRE_FORM_ROUTE = '/cadre-form';

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

const CadreListPage = () => {
  const navigate = useNavigate();
  const [cadres, setCadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await cadreService.getAll();
        if (mounted) setCadres(response.data);
      } catch (error) {
        console.error('Erreur de chargement des cadres', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const intervalId = setInterval(load, 8000);
    return () => { mounted = false; clearInterval(intervalId); };
  }, []);

  const filtered = useMemo(() => {
    return cadres.filter((c) => {
      const matchesSearch = ["nom", "prenom", "matricule", "service", "grade"].some((key) =>
        String(c[key] || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesGrade = !gradeFilter || c.grade === gradeFilter;
      const matchesService = !serviceFilter || c.service === serviceFilter;
      return matchesSearch && matchesGrade && matchesService;
    });
  }, [cadres, searchTerm, gradeFilter, serviceFilter]);

  return (
    <div className="cadre-app py-4">
      <div className="container-fluid px-4">
        <div className="cadre-page-header">
          <div>
            <h1 className="cadre-page-title">Répertoire des cadres</h1>
            <div className="cadre-page-subtitle">
              {loading ? 'Chargement...' : `${filtered.length} cadre${filtered.length > 1 ? 's' : ''} affiché${filtered.length > 1 ? 's' : ''} sur ${cadres.length}`}
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(CADRE_FORM_ROUTE)}>
            <i className="fa fa-user-plus me-1"></i> Nouvelle fiche
          </button>
        </div>

        <div className="directory-toolbar">
          <div className="row g-2">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par nom, prénom, matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                <option value="">Tous les grades</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
                <option value="">Tous les services</option>
                {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <i className="fa fa-user-slash"></i>
            Aucun cadre ne correspond à ta recherche.
          </div>
        )}

        <div className="directory-grid">
          {filtered.map((cadre) => (
            <button
              type="button"
              key={cadre.id}
              className="directory-card"
              onClick={() => navigate(`/cadre/${cadre.matricule}`)}
            >
              {cadre.photo ? (
                <img src={cadreService.getPhotoUrl(cadre.photo)} alt="" className="cadre-avatar" style={{ width: 56, height: 66 }} />
              ) : (
                <div className="cadre-avatar-placeholder" style={{ width: 56, height: 66 }}>
                  <i className="fa fa-user"></i>
                </div>
              )}
              <div>
                <div className="name">{cadre.nom} {cadre.prenom}</div>
                <div className="meta">Matricule {cadre.matricule}</div>
                <div className="meta">{cadre.service || '—'}</div>
                {cadre.grade && <span className="badge-grade">{cadre.grade}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CadreListPage;
