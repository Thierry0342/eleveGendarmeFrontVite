import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons'; // Icône de déconnexion
import './Navbar.css';
import Swal from 'sweetalert2';


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
    Swal.fire({
      title: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      text: "Vous devrez vous reconnecter pour accéder à l'application.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, déconnecter',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        // Supprimer les infos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
  
        // Toast de confirmation
        Swal.fire({
          icon: 'success',
          title: 'Déconnexion réussie',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
  
        // Attente de 2 secondes avant redirection
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    });
  };
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');  // Redirige vers la page de connexion si pas de token
    }
  }, []);  // Ne se lance qu'une fois au chargement
  return (
    <nav className={`navbar ${scrolled ? 'shrink transparent' : ''}`}>

      <div className="logo">
        <Link to="/">GESTION ELEVE GENDARME</Link>
      </div>

      <ul className="nav-links">
        <li><Link to="/">Accueil</Link></li>
        <li><Link to="/eleve">Élève</Link></li>
        <li><Link to="/assiduite">Assiduité</Link></li>
        {/* Icône de déconnexion dans le bouton */}
        <li><button onClick={handleLogout} className="btn-logout">
          <FontAwesomeIcon icon={faSignOutAlt} /> 
        </button></li>
      </ul>
    </nav>
  );
};

export default Navbar;
