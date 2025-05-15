// PrivateRoute.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!token || !user || (allowedRoles.length > 0 && !allowedRoles.includes(user.type))) {
     
      navigate('/');
     
    }
  }, [token, user, allowedRoles, navigate]);

  if (!token || !user || (allowedRoles.length > 0 && !allowedRoles.includes(user.type))) {
    return null;
  }

  return children;
};

export default PrivateRoute;
