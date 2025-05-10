import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '80vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: '6rem', fontWeight: 'bold', color: '#dc3545' }}>404</h1>
      <h2 className="mb-3">Oups ! Page non trouvée</h2>
      <p className="mb-4">La page que vous recherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn btn-primary">
        Retour à l'accueil
      </Link>
    </div>
  );
};

export default NotFoundPage;
