import React from 'react';
import "./styles.scss";
import { FaPersonBooth, FaFilter, FaIcons } from 'react-icons/fa'
import { Link } from 'react-router-dom';

import { Icon } from 'lucide-react';




const HomePage = () => {
  return (
    <div style={{ marginLeft: "50px", marginTop: "100px" , }}>
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
      <br></br>
      <br></br>
  
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
                <p>Règles et consignes de discipline</p>
              </div>
            </div>
          </div>
          </Link>
        </div>
      </div>

      <footer className="site-footer">
      <span className="footer-left"> <h7>V1.0</h7></span>
      <div className="footer-content">
        <p>© 2025 EGNA SIT INFO</p>
        <p>ÉCOLE DE LA GENDARMERIE NATIONALE AMBOSITRA</p>
      </div>
    </footer>


    
    </div>




  );
  
};

export default HomePage;
