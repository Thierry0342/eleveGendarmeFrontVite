import axios from 'axios';
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';

const cadreService = {
  // Obtenir tous les cadres
  getAll() {
    return axios.get(API_URL + "/api/cadre");
  },

  // Créer un nouveau cadre
  post(cadreData) {
    return axiosInstance.post(API_URL + "/api/cadre", cadreData);
  },

  // Supprimer un cadre
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/cadre/${id}`);
  },

  // Modifier un cadre existant
  update(id, cadreData) {
    return axiosInstance.put(`${API_URL}/api/cadre/${id}`, cadreData);
  },

  getbyMat(mat) {
    return axios.get(API_URL + `/api/cadre/${mat}`);
  },

  // Upload / remplacement de la photo d'un cadre.
  // `file` est l'objet File venant d'un <input type="file">.
  // On envoie du multipart/form-data, donc PAS de JSON.stringify ici,
  // et il ne faut pas fixer manuellement le header Content-Type
  // (le navigateur ajoute le bon "boundary" automatiquement).
  uploadPhoto(id, file) {
    const formData = new FormData();
    formData.append('photo', file);
    return axiosInstance.post(`${API_URL}/api/cadre/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Construit l'URL complète d'affichage d'une photo à partir du chemin
  // relatif stocké en base (ex: "/uploads/cadres/12-169000.jpg").
  getPhotoUrl(photoPath) {
    if (!photoPath) return null;
    return `${API_URL}${photoPath}`;
  },
};

export default cadreService;
