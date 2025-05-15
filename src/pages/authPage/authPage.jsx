import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import userService from '../../services/userService'; // adapte selon ton chemin
import './index.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [isLoading, setIsLoading] = useState(false);  // Etat de chargement
  const navigate = useNavigate();  // Hook pour rediriger

  const handleLogin = async () => {
    setIsLoading(true);  // Déclenche le chargement

    try {
      const response = await userService.authUser({
        username: email,
        password: motDePasse,
      });

      if (response.status === 200) {
        // Stocke le token et l'utilisateur dans localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Affiche un message de succès
        toast.success("Connexion réussie !");

        // Attends 3 secondes avant de rediriger
        setTimeout(() => {
          navigate('/');  // Redirection après 3 secondes
        }, 3000);  // 3000ms = 3 secondes
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.error || "Erreur de connexion");
    } finally {
      setIsLoading(false);  // Cache l'indicateur de chargement après la requête
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="login-background" />
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="card shadow p-4 bg-white bg-opacity-75" style={{ maxWidth: '400px', width: '100%' }}>
          <h3 className="text-center mb-4">Connexion</h3>
          <form>
            <div className="mb-3">
              <label className="form-label">Adresse e-mail</label>
              <input
                type="email"
                className="form-control"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-control"
                placeholder="Entrez votre mot de passe"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                required
              />
            </div>

            {/* Affichage du spinner ou du bouton de connexion */}
            <button 
              type="button" 
              className="btn btn-primary w-100"
              onClick={handleLogin}
              disabled={isLoading}  // Désactive le bouton pendant le chargement
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>  // Spinner de chargement
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
