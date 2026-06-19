import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';

const GardeMaladeService = {

  // Obtenir tous les garde-malades
  getAll() {
    return axios.get(`${API_URL}/api/gardeMalade`);
  },

  // Créer un garde-malade
  post(gardeData) {
    return axiosInstance.post(`${API_URL}/api/gardeMalade`, gardeData);
  },

  // Supprimer un garde-malade
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/gardeMalade/${id}`);
  },

  // Obtenir un garde-malade par ID
  getById(id) {
    return axios.get(`${API_URL}/api/gardeMalade/${id}`);
  },

  // Mettre à jour un garde-malade
  update(id, data) {
    return axiosInstance.put(`${API_URL}/api/gardeMalade/${id}`, data);
  },
};

export default GardeMaladeService;
