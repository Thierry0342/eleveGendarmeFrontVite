import axios from 'axios';
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';
const courService = {
  // Obtenir tous les cours
  getAll() {
    return axiosInstance.get(API_URL + "/api/cour");
  },

  // Créer un nouveau cours
  post(courData) {
    return axiosInstance.post(API_URL + "/api/cour", courData);
  },

  // Supprimer un cours
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/cour/${id}`);
  },
};

export default courService;
