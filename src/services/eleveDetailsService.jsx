// service/eleveDetailsService.js
import axios from "axios";
import { API_URL } from "../config/root/modules";

const eleveDetailsService = {
    getBatchByIds(ids) {
      return axios.post(`${API_URL}/api/eleves/details`, { ids });
    }
  };
  
export default eleveDetailsService;
