// src/pages/ParametreIpPage.jsx
import React, { useState } from "react";

export default function ParametreIpPage() {
  const [ip, setIp] = useState(localStorage.getItem("CUSTOM_IP") || "");

  const handleSave = () => {
    localStorage.setItem("CUSTOM_IP", ip);
    alert("Nouvelle IP enregistrée ! Rafraîchissez la page pour appliquer les changements.");
  };
console.log(localStorage.getItem("CUSTOM_IP"));
  return (
    <div className="container mt-5">
      <h2>Paramètres Réseau</h2>
      <div className="mb-3">
        <label htmlFor="ipInput" className="form-label">Adresse IP du serveur :</label>
        <input
          id="ipInput"
          type="text"
          className="form-control"
          placeholder="http://192.168.1.100:4000"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        Enregistrer
      </button>
    </div>
  );
}
