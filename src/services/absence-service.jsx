import axios from 'axios';
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';

const absenceService = {
  // Obtenir
  getAll() {
    return axios.get(API_URL + "/api/absence");
  },

  // 🔹 Obtenir par élève
  getByEleveId(eleveId) {
    return axios.get(API_URL + `/api/absence/eleve/${eleveId}`);
  },

  // Créer
  post(data) {
    return axiosInstance.post(API_URL + "/api/absence", data);
  },

  // Supprimer
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/absence/${id}`);
  },
};

export default absenceService;
