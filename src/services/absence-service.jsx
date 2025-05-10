import axios from 'axios';
import { API_URL } from "../config/root/modules";
const absenceService = {
  // Obtenir 
  getAll() {
    return axios.get(API_URL + "/api/absence");
  },

  // Créer un 
  post(data) {
    return axios.post(API_URL + "/api/absence", data);
  },

  // Supprimer 
  delete(id) {
    return axios.delete(`${API_URL}/api/absence/${id}`);
  },

};

export default absenceService;
