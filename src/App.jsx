import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './component/navbar/index';
import HomePage from './pages/HomePge/homePage'; 
import ElevePage from './pages/ElevePage/ElevePage';
import ListeElevePge from './pages/ListeEleve/ListeElevePage';
import CourPage from './pages/CourPage/CourPage';
import NotFoundPage from './pages/NotFoundPage';
import AbsencePage from './pages/AbsencePage/absencePage';
import CadrePage from './pages/cadrePage/cadrePage';
import ConsultationPage from './pages/consultationPage/consultationPage'
import StatePage from './pages/StatPage/StatePage';
import '@fortawesome/fontawesome-free/css/all.min.css';

import './index.css'


function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/eleve" element={<ElevePage />} />
          <Route path="/eleve/listeEleveGendarme" element={<ListeElevePge />} />
          <Route path="/admin/" element={<CourPage />} />
          <Route path="/eleve/absence" element={<AbsencePage />} />
          <Route path="/cadre" element={<CadrePage />} />
          <Route path="/eleve/consultation" element={<ConsultationPage />} />
          <Route path="/Statistique" element={<StatePage />} />


          <Route path="*" element={<NotFoundPage />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;
