import axios from 'axios';
import { API_URL } from "../config/root/modules";
const courService = {
  // Obtenir tous les cours
  getAll() {
    return axios.get(API_URL + "/api/cour");
  },

  // Créer un nouveau cours
  post(courData) {
    return axios.post(API_URL + "/api/cour", courData);
  },

  // Supprimer un cours
  delete(id) {
    return axios.delete(`${API_URL}/api/cour/${id}`);
  },
};

export default courService;
