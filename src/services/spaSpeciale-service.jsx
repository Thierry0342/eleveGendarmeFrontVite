import axios from 'axios';
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';
const absenceService = {
  // Obtenir 
  getAll() {
    return axiosInstance.get(API_URL + "/api/spaSpeciale");
  },

  // Créer un 
  post(data) {
    return axiosInstance.post(API_URL + "/api/spaSpeciale", data);
  },

  // Supprimer 
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/spaSpeciale/${id}`);
  },
  update(id, spaData) {
    return axiosInstance.put(`${API_URL}/api/spaSpeciale/${id}`, cadreData);
  },

};

export default absenceService;
