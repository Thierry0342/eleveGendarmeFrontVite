import axios from 'axios';
import { API_URL } from "../config/root/modules";
const cadreService = {
  // Obtenir tous les cours
  getAll() {
    return axios.get(API_URL + "/api/cadre");
  },

  // Créer un nouveau cours
  post(cadreData) {
    return axios.post(API_URL + "/api/cadre", cadreData);
  },

  // Supprimer un cours
  delete(id) {
    return axios.delete(`${API_URL}/api/cadre/${id}`);
  },
   // Modifier un cadre existant
   update(id, cadreData) {
    return axios.put(`${API_URL}/api/cadre/${id}`, cadreData);
  },
  getbyMat(mat){
    return axios.get(API_URL + `/api/cadre/${mat}`);
  }
  
};

export default cadreService;
