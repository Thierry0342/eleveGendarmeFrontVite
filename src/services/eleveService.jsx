import axios from "axios";
import { API_URL } from "../config/root/modules";
//import { header } from "./Auth.services";
class EleveService  {
    get(){
        return axios.get(API_URL + "/api/eleve");
    }
   
    post(data){
        return axios.post(API_URL + "/api/eleve", data,);
    }
    put(id, formData) {
        // Utiliser FormData pour envoyer les données du formulaire
        return axios.put(API_URL + "/api/eleve/" + id, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Nécessaire pour envoyer des fichiers
            },
        });
    }
    delete(id) {
        return axios.delete(`${API_URL}/api/eleve/${id}`);
      }
     getByInc(inc,cour){
        return axios.get(API_URL + `/api/eleve/incorporation/${inc}?cour=${cour}`);


      }
}

export default new EleveService ()