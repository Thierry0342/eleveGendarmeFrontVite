import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from "./axios-instance";

const NotefrancaisService = {
  // Récupérer toutes les notes
  getAll() {
    return axios.get(`${API_URL}/api/notefrancais`);
  },

  // Créer une nouvelle note
  post(noteData) {
    return axiosInstance.post(`${API_URL}/api/notefrancais`, noteData);
  },

  // Supprimer une note par ID
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/notefrancais/${id}`);
  },

  // Récupérer une note spécifique par ID
  getById(id) {
    return axios.get(`${API_URL}/api/notefrancais/${id}`);
  },

  // Mettre à jour une note existante
  update(id, data) {
    return axiosInstance.put(`${API_URL}/api/notefrancais/${id}`, data);
  },
  getbyEleveId(id){
    return axios.get(`${API_URL}/api/notefrancais/eleve/${id}`);

  }
};

export default NotefrancaisService;
