import axios from 'axios';
import { API_URL } from "../config/root/modules";

const dateService = {
  // Obtenir la date du serveur
  getServerDate() {
    return axios.get(`${API_URL}/api/date`);
  }
};

export default dateService;
