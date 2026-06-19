// service/eleveDetailsService.js
import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';
const eleveDetailsService = {
    getBatchByIds(ids) {
      return axiosInstance.post(`${API_URL}/api/eleves/details`, { ids });
    }
  };
  
export default eleveDetailsService;
