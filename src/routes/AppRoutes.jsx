import React from 'react';
import { Route } from 'react-router-dom';
import HomePage from '../pages/homePage';
import ElevePage from '../pages/ElevePage/ElevePage';
import CadrePage from '../pages/cadrePage/cadrePage';

const AppRoutes = () => {
  return (
    <>
      <Route path="/" element={<HomePage />} />
      <Route path="/eleve" element={<ElevePage />} />
     
     
    </>
  );
};

export default AppRoutes;
