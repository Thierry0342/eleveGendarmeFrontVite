import axios from 'axios';
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';

const dateService = {
  // Obtenir la date du serveur
  getServerDate() {
    return axiosInstance.get(`${API_URL}/api/date`);
  }
};

export default dateService;
