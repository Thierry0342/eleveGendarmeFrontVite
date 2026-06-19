import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';

class SpecialiteService {

  // Récupérer toutes les spécialités d'un élève
  getByEleve(eleveId) {
    return axiosInstance.get(API_URL + `/api/specialites/eleve/${eleveId}`);
  }

  // Ajouter une seule spécialité
  post(eleveId, data) {
    return axiosInstance.post(API_URL + `/api/specialites/eleve/${eleveId}`, data);
  }

  // Ajouter plusieurs spécialités en une fois
  bulkCreate(eleveId, data) {
    return axiosInstance.post(API_URL + `/api/specialites/eleve/${eleveId}/bulk`, data);
  }

  // Modifier une spécialité
  put(id, data) {
    return axiosInstance.put(API_URL + `/api/specialites/${id}`, data);
  }

  // Supprimer une spécialité
  delete(id) {
    return axiosInstance.delete(API_URL + `/api/specialites/${id}`);
  }
}

export default new SpecialiteService();