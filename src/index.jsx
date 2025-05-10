import React from 'react';
import ReactDOM from 'react-dom/client'; // pour la création du point d'entrée
import './index.css'; // pour appliquer ton CSS global
import App from './App'; //  App.js principal
import reportWebVitals from './reportWebVitals'; // pour mesurer les performances (optionnel)
import './index.css'
import "bootstrap/dist/js/bootstrap";
const root = ReactDOM.createRoot(document.getElementById('root')); // où ton app est injectée dans index.html
root.render(
  <React.StrictMode>
    <App/> 
  </React.StrictMode>
);
reportWebVitals();
