import axios from 'axios';
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';
const userService = {
  // Obtenir tous les user
  getAll() {
    return axios.get(API_URL + "/api/user");
  },

  // Créer un nouveau user
  post(userData) {
    return axiosInstance.post(API_URL + "/api/user", userData);
  },

  // Supprimer un user
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/user/${id}`);
  },
  update(id, data) {
    if (!id || !data || !data.username || !data.type) {
      return Promise.reject(new Error("ID ou données invalides pour la mise à jour."));
    }
  
    // Préparer les données à envoyer
    const payload = {
      username: data.username,
      type: data.type,
    };
    
    if (data.currentPassword && data.newPassword && data.confirmPassword) {
      payload.currentPassword = data.currentPassword;
      payload.newPassword = data.newPassword;
      payload.confirmPassword = data.confirmPassword;
    }
    
  
    return axiosInstance.put(`${API_URL}/api/user/${id}`, payload);
    
  },
  
  authUser(credentials) {
    return axios.post(`${API_URL}/api/user/auth`, credentials);
  }
  
  
};


export default userService;
