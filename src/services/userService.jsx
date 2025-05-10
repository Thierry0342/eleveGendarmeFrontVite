import axios from 'axios';
import { API_URL } from "../config/root/modules";
const userService = {
  // Obtenir tous les user
  getAll() {
    return axios.get(API_URL + "/api/user");
  },

  // Créer un nouveau user
  post(userData) {
    return axios.post(API_URL + "/api/user", userData);
  },

  // Supprimer un user
  delete(id) {
    return axios.delete(`${API_URL}/api/user/${id}`);
  },
  update(id, data) {
    if (!id || !data || !data.username || !data.type) {
      return Promise.reject(new Error("ID ou données invalides pour la mise à jour."));
    }
    return axios.put(`${API_URL}/api/user/${id}`, data);
  }
};


export default userService;
