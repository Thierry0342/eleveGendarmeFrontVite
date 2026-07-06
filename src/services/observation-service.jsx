import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';

const observationService = {
  // Obtenir toutes les observations
  getAll() {
    return axiosInstance.get(API_URL + "/api/observations");
  },

  // Obtenir par élève
  getByEleveId(eleveId) {
    return axiosInstance.get(API_URL + `/api/observations/eleve/${eleveId}`);
  },

  // Obtenir par numéro d'incorporation
 

  // Créer
  post(data) {
    return axiosInstance.post(API_URL + "/api/observations", data);
  },

  // Mettre à jour
  update(id, data) {
    return axiosInstance.put(`${API_URL}/api/observations/${id}`, data);
  },

  // Supprimer
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/observations/${id}`);
  },
  // dans observation-service.js
getByNumeroIncorporation(numeroIncorporation, cour) {
  const q = cour ? `?cour=${cour}` : '';
  return axiosInstance.get(API_URL + `/api/observations/incorp/${numeroIncorporation}${q}`);
},
};

export default observationService;