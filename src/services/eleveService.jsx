import axios from "axios";
import { API_URL } from "../config/root/modules";
import axiosInstance from './axios-instance';
//import { header } from "./Auth.services";
class EleveService  {
    get(){
        return axios.get(API_URL + "/api/eleve");
    }
    getPaginated(limit = 500, offset = 0){
        return axios.get(`${API_URL}/api/eleve?limit=${limit}&offset=${offset}`);
    }
   
    post(data){
        return axiosInstance.post(API_URL + "/api/eleve", data,);
    }
    
    put(id, formData) {
        // Utiliser FormData pour envoyer les données du formulaire
        return axiosInstance.put(API_URL + "/api/eleve/" + id, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Nécessaire pour envoyer des fichiers
            },
        });
    }
    
    delete(id) {
        return axiosInstance.delete(`${API_URL}/api/eleve/${id}`);
      }
     getByInc(inc,cour){
        return axios.get(API_URL + `/api/eleve/incorporation/${inc}?cour=${cour}`);


      }
}

export default new EleveService ()