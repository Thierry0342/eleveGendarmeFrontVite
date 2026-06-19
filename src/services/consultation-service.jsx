import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';

const consultationService = {
  // Obtenir toutes les consultations
  getAll() {
    return axios.get(API_URL+`/api/consultation`);
  },

  // Créer une nouvelle consultation
  post(consultationData) {
    return axiosInstance.post(`${API_URL}/api/consultation`, consultationData);
  },

  // Supprimer une consultation
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/consultation/${id}`);
  },
  // Obtenir les consultations par élève
getByEleveId(eleveId) {
  return axios.get(`${API_URL}/api/consultation/eleve/${eleveId}`);
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
    return axiosInstance.put(`${API_URL}/api/consultation/${id}`, data);
  },
};

export default consultationService;
