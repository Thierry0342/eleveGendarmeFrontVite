// HomePage.jsx
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import './styles.scss';

const APP_VERSION = '2.1.1';

// (Optionnel) lit l'utilisateur depuis le localStorage si besoin
const readUserFromLocalStorage = () => {
  try {
    const raw =
      localStorage.getItem('user') ||
      localStorage.getItem('auth:user') ||
      localStorage.getItem('currentUser');
    if (raw) return JSON.parse(raw);
  } catch {}
  const type =
    localStorage.getItem('user.type') ||
    localStorage.getItem('role') ||
    localStorage.getItem('roleName');
  return type ? { type } : null;
};

const HomePage = ({ user: propUser }) => {
  const [user, setUser] = useState(propUser || null);
  const shownRef = useRef(false); // évite double affichage en mode Strict

  useEffect(() => {
    if (propUser) setUser(propUser);
    else setUser((u) => u ?? readUserFromLocalStorage());
  }, [propUser]);

 
  // Affiche le message à chaque ouverture (une fois par montage)
  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    showChangelog();
  }, [showChangelog]);

  return (
    <div style={{ marginLeft: '50px', marginTop: '100px' }}>
      {/* Première ligne de 3 cartes */}
      <div className="row justify-content-center">
        <div className="col-sm-4 col-md-3 club_cc">
          <Link to="/eleve/listeEleveGendarme" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card mb-4 club_ca">
              <div className="card-body">
                <div className="club_ao">
                  <i className="fas fa-user-secret ico fa-2x"></i>
                </div>
                <div className="club_aa">
                  <h2 className="mb-4">
                    <i className="ti-filter text-primary"></i>
                  </h2>
                  <h3 className="card-title">ELEVE GENDARME</h3>
                  <p>Liste des élèves gendarmes</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-sm-4 col-md-3 club_cc">
          <div className="card mb-4 club_ca">
            <Link to="/eleve/consultation" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card-body">
                <div className="club_ao">
                  <i className="fas fa-ambulance ico fa-2x"></i>
                </div>
                <div className="club_aa">
                  <h2 className="mb-4">
                    <i className="ti-filter text-primary"></i>
                  </h2>
                  <h3 className="card-title">CONSULTATION EXTERNE</h3>
                  <p>Consultation medical externe</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="col-sm-4 col-md-3 club_cc">
          <Link to="/eleve/absence" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card mb-4 club_ca">
              <div className="card-body">
                <div className="club_ao">
                  <i className="fas fa-calendar-times ico fa-2x"></i>
                </div>
                <div className="club_aa">
                  <h2 className="mb-4">
                    <i className="ti-filter text-primary"></i>
                  </h2>
                  <h3 className="card-title">ABSENCE</h3>
                  <p>Absence au progression par les élèves gendarme</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <br />
      <br />

      {/* Deuxième ligne de 3 cartes */}
      <div className="row justify-content-center">
        <div className="col-sm-4 col-md-3 club_cc">
          <Link to="/statistique" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card mb-4 club_ca">
              <div className="card-body">
                <div className="club_ao">
                  <i className="fas fa-chart-bar ico fa-2x"></i>
                </div>
                <div className="club_aa">
                  <h3 className="card-title">STATISTIQUES</h3>
                  <p>Tableau de bord ...</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-sm-4 col-md-3 club_cc">
          <Link to="/eleves/diplome" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card mb-4 club_ca">
              <div className="card-body">
                <div className="club_ao">
                  <i className="fas fa-calendar-alt ico fa-2x"></i>
                </div>
                <div className="club_aa">
                  <h3 className="card-title">DIVERS</h3>
                  <p>Diplome,Specialiste,Réligion,Sport</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-sm-4 col-md-3 club_cc">
          <Link to="/cadre" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card mb-4 club_ca">
              <div className="card-body">
                <div className="club_ao">
                  <i className="fas fa-user-shield ico fa-2x"></i>
                </div>
                <div className="club_aa">
                  <h3 className="card-title">CADRE EGNA</h3>
                  <p>cadre EGNA</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <footer className="site-footer">
        <span className="footer-left">
          <h6>V{APP_VERSION}</h6>
        </span>
        <div className="footer-content">
          <p>© 2025 EGNA SIT INFO</p>
          <p>ÉCOLE DE LA GENDARMERIE NATIONALE AMBOSITRA</p>
         
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
