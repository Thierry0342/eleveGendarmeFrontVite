import axios from 'axios';
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';
const cadreService = {
  // Obtenir tous les cours
  getAll() {
    return axiosInstance.get(API_URL + "/api/cadre");
  },

  // Créer un nouveau cours
  post(cadreData) {
    return axiosInstance.post(API_URL + "/api/cadre", cadreData);
  },

  // Supprimer un cours
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/cadre/${id}`);
  },
   // Modifier un cadre existant
   update(id, cadreData) {
    return axiosInstance.put(`${API_URL}/api/cadre/${id}`, cadreData);
  },
  getbyMat(mat){
    return axiosInstance.get(API_URL + `/api/cadre/${mat}`);
  }
  
};

export default cadreService;
