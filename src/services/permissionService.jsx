import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';

const PermissionService = {

  getAll() {
    return axiosInstance.get(API_URL+`/api/permission`);
  },

  post(permissionData) {
    return axiosInstance.post(`${API_URL}/api/permission`, permissionData);
  },


  delete(id) {
    return axiosInstance.delete(`${API_URL}/api/permission/${id}`);
  },


  getById(id) {
    return axiosInstance.get(`${API_URL}/api/permission/${id}`);
  },

  getByCour(cour) {
    return axiosInstance.get(`${API_URL}/api/permission/cour/${cour}`);
  },



  update(id, data) {
    return axiosInstance.put(`${API_URL}/api/permission/${id}`, data);
  },
};

export default PermissionService;
