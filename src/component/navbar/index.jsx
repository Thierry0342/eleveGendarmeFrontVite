import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 70);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'shrink' : ''}`}>
      <div className="logo">
        <Link to="/">GESTION ELEVE GENDARME</Link>
      </div>

      <ul className="nav-links">
        <li><Link to="/">Accueil</Link></li>
        <li><Link to="/eleve">Élève</Link></li>
        <li><Link to="/assiduite">Assiduité</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
