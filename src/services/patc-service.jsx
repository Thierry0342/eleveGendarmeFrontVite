import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';

const PatcService = {

  // Récupérer tous les PATC
  getAll(includeEleve = false) {
    return axios.get(`${API_URL}/api/patc${includeEleve ? '?includeEleve=true' : ''}`);
  },

  // Créer un PATC
  post(patcData) {
    return axiosInstance.post(`${API_URL}/api/patc`, patcData);
  },

  // Supprimer un PATC
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/patc/${id}`);
  },

  // Récupérer un PATC par ID
  getById(id, includeEleve = false) {
    return axios.get(`${API_URL}/api/patc/${id}${includeEleve ? '?includeEleve=true' : ''}`);
  },

  // Récupérer les PATC par cours
  getByCour(cour, includeEleve = false) {
    return axios.get(`${API_URL}/api/patc/cour/${cour}${includeEleve ? '?includeEleve=true' : ''}`);
  },

  // Mettre à jour un PATC
  update(id, data) {
    return axiosInstance.put(`${API_URL}/api/patc/${id}`, data);
  },
  // Récupérer PATC par eleveId
getByEleveId(eleveId, includeEleve = false) {
    return axios.get(`${API_URL}/api/patc/eleve/${eleveId}${includeEleve ? '?includeEleve=true' : ''}`);
  },
  // patc-service.js
  getByEleves: (eleveIds) => {
    return axios.post(`${API_URL}/eleves`, { eleveIds });
  },
  
  

};

export default PatcService;
