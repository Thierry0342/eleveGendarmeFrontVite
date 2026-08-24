// src/pages/cadrePage/CadreEntry.jsx
import React from 'react';
import CadrePage from './cadrePage';
import CadreListPage from './CadreListPage';
import { getCurrentUserType } from '../../utils/auth';

const CadreEntry = () => {
  const userType = getCurrentUserType();

  // 'user' n'a accès qu'au répertoire (lecture seule), pas au formulaire de création/édition
  if (userType === 'user') {
    return <CadreListPage />;
  }

  return <CadrePage />;
};

export default CadreEntry;