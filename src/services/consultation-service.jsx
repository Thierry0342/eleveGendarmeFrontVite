import axios from "axios";
import { API_URL } from "../config/root/modules";

const consultationService = {
  // Obtenir toutes les consultations
  getAll() {
    return axios.get(API_URL+`/api/consultation`);
  },

  // Créer une nouvelle consultation
  post(consultationData) {
    return axios.post(`${API_URL}/api/consultation`, consultationData);
  },

  // Supprimer une consultation
  delete(id) {
    return axios.delete(`${API_URL}/api/consultation/${id}`);
  },

  // Obtenir une consultation par ID
  getById(id) {
    return axios.get(`${API_URL}/api/consultation/${id}`);
  },
  //ghet by cour
  getByCour(cour) {
    return axios.get(`${API_URL}/api/consultation/cour/${cour}`);
  },


  // Mettre à jour une consultation
  update(id, data) {
    return axios.put(`${API_URL}/api/consultation/${id}`, data);
  },
};

export default consultationService;
