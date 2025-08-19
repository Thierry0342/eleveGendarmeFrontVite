import axios from "axios";
import axiosInstance from "./axios-instance";
import { API_URL } from "../config/root/modules";

const sanctionService = {
  getByEleveId(eleveId) {
    return axios.get(`${API_URL}/api/sanctions/eleve/${eleveId}`);
  },
  post(data) {
    return axiosInstance.post(`${API_URL}/api/sanctions`, data);
  },
  update(id, data) {
    return axiosInstance.put(`${API_URL}/api/sanctions/${id}`, data);
  },
  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/sanctions/${id}`);
  },
};

export default sanctionService;
