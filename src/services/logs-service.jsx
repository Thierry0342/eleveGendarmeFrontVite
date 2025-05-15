import axios from 'axios';
import { API_URL } from '../config/root/modules';

// Centralisation de la configuration de l'API
const apiClient = axios.create({
  baseURL: API_URL, 
  timeout: 5000, 
});

// Fonction utilitaire pour gérer les erreurs
const handleError = (error) => {
  if (error.response) {
   
    console.error('Réponse du serveur:', error.response);
    return { error: error.response.data || 'Erreur inconnue du serveur' };
  } else if (error.request) {
    // La requête a été faite mais aucune réponse n'a été reçue
    console.error('Problème avec la requête:', error.request);
    return { error: 'Aucune réponse du serveur' };
  } else {
    // Quelque chose s'est passé lors de la configuration de la requête
    console.error('Erreur lors de la configuration:', error.message);
    return { error: error.message || 'Erreur inconnue' };
  }
};

// Service log
const logService = {
  // Récupérer tous les logs
  async getAll() {
    try {
      const response = await apiClient.get(API_URL + '/api/logs');
      return { data: response.data };  
    } catch (error) {
      return handleError(error); 
    }
  },

  // Créer un log
  async post(logs) {
    try {
      const response = await apiClient.post(API_URL + '/api/logs', logs);
      return { data: response.data }; 
    } catch (error) {
      return handleError(error);  
    }
  },

  // Supprimer un log
  async delete(id) {
    try {
      const response = await apiClient.delete(API_URL + `/api/logs/${id}`);
      return { data: response.data };  
    } catch (error) {
      return handleError(error); 
    }
  },
};

export default logService;
