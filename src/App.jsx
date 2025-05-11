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
          <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          <Route path="/eleve" element={<PrivateRoute><ElevePage /></PrivateRoute>} />
          <Route path="/eleve/listeEleveGendarme"element={<PrivateRoute><ListeElevePge /></PrivateRoute>} />
          <Route path="/admin/" element={<PrivateRoute><CourPage /></PrivateRoute>} />
          <Route path="/eleve/absence" element={<PrivateRoute><AbsencePage /></PrivateRoute>} />
          <Route path="/cadre" element={<PrivateRoute><CadrePage /></PrivateRoute>} />
          <Route path="/eleve/consultation" element={<PrivateRoute><ConsultationPage /></PrivateRoute>} />
          <Route path="/Statistique"  element={<PrivateRoute><StatePage /></PrivateRoute>} />
          <Route path="/eleves/diplome"  element={<PrivateRoute><DiverPage /></PrivateRoute>} />
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
