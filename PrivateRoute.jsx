import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Si pas de token, redirige vers la page de login
    if (!token) {
      navigate('/Login');
    }
  }, [token, navigate]);

  return token ? children : null; // Si token existe, on affiche les enfants, sinon rien
};

export default PrivateRoute;
