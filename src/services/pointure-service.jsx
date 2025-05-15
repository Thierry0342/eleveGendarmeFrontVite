import axios from 'axios';
import { API_URL } from '../config/root/modules'; // Assure-toi que le chemin est correct

class PointureService {
    // Méthode pour obtenir les pointures par cours avec des filtres
    get() {
        return axios.get(`${API_URL}/api/pointures`);
    }
}

export default new PointureService();
