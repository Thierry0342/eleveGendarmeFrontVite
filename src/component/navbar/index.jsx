import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons'; // Icône de déconnexion
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate(); // pour la redirection après déconnexion

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 70);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');  // Supprime le token
    localStorage.removeItem('user');   // Supprime les infos de l'utilisateur
    navigate('/login');  // Redirige vers la page de connexion
  };
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');  // Redirige vers la page de connexion si pas de token
    }
  }, []);  // Ne se lance qu'une fois au chargement
  return (
    <nav className={`navbar ${scrolled ? 'shrink' : ''}`}>
      <div className="logo">
        <Link to="/">GESTION ELEVE GENDARME</Link>
      </div>

      <ul className="nav-links">
        <li><Link to="/">Accueil</Link></li>
        <li><Link to="/eleve">Élève</Link></li>
        <li><Link to="/assiduite">Assiduité</Link></li>
        {/* Icône de déconnexion dans le bouton */}
        <li><button onClick={handleLogout} className="btn-logout">
          <FontAwesomeIcon icon={faSignOutAlt} /> Déconnexion
        </button></li>
      </ul>
    </nav>
  );
};

export default Navbar;
