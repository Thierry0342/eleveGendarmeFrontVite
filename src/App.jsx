import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './component/navbar/index';
import HomePage from './pages/HomePge/homePage'; 
import ElevePage from './pages/ElevePage/ElevePage';
import ListeElevePge from './pages/ListeEleve/ListeElevePage';
import CourPage from './pages/CourPage/CourPage';
import NotFoundPage from './pages/NotFoundPage';
import AbsencePage from './pages/AbsencePage/absencePage';
import CadrePage from './pages/cadrePage/cadrePage';
import ConsultationPage from './pages/consultationPage/consultationPage';
import StatePage from './pages/StatPage/StatePage';
import AuthPage from './pages/authPage/authPage';
import DiverPage from './pages/DiverPage/DiverPage';
import ParametreIpPage from './pages/ParametreIpPage/ParametreIpPage';
import PermissionPage from './pages/permissioPage/permissionPage';
import PrivateRoute from '../PrivateRoute'; 


import '@fortawesome/fontawesome-free/css/all.min.css';

import './index.css';

function AppRoutes() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/auth';
  
  

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<PrivateRoute allowedRoles={['admin','user','saisie']}><HomePage /></PrivateRoute>} />
          <Route path="/eleve" element={<PrivateRoute allowedRoles={['admin']}><ElevePage /></PrivateRoute>} />
          <Route path="/eleve/listeEleveGendarme"element={<PrivateRoute allowedRoles={['admin','user','saisie']}> <ListeElevePge /></PrivateRoute>} />
          <Route path="/admin/" element={<PrivateRoute allowedRoles={['admin']}><CourPage /></PrivateRoute>} />
          <Route path="/eleve/absence" element={<PrivateRoute allowedRoles={['user','saisie','admin']}><AbsencePage /></PrivateRoute>} />
          <Route path="/cadre" element={<PrivateRoute allowedRoles={['admin']} ><CadrePage /></PrivateRoute>} />
          <Route path="/eleve/consultation" element={<PrivateRoute allowedRoles={['admin']}><ConsultationPage /></PrivateRoute>} />
          <Route path="/Statistique"  element={<PrivateRoute allowedRoles={['user','admin']}><StatePage /></PrivateRoute>} />
          <Route path="/eleves/diplome"  element={<PrivateRoute allowedRoles={['admin','user']}><DiverPage /></PrivateRoute>} />
          <Route path="/parametres-ip" element={<PrivateRoute allowedRoles={['admin']}><ParametreIpPage /></PrivateRoute>} />
          <Route path="/eleve/permission" element={<PrivateRoute allowedRoles={['admin']}><PermissionPage /></PrivateRoute>} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
