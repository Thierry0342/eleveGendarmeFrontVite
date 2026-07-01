import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import userService from '../../services/userService'; // adapte selon ton chemin
import './index.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ⚠️ Si l'utilisateur était déjà connecté (session/token en cache),
  // on l'informe qu'une mise à jour a été déployée et on nettoie sa session.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token || user) {
      Swal.fire({
        icon: 'info',
        title: 'Mise à jour effectuée',
        html: 'Une nouvelle mise à jour de l\'application a été mise en place.<br/>Veuillez vous reconnecter pour continuer.',
        confirmButtonText: 'OK',
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(() => {
        // Nettoyage de l'ancienne session pour forcer une reconnexion propre
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
    }
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      const response = await userService.authUser({
        username: email,
        password: motDePasse,
      });

      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        toast.success("Connexion réussie !");

        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 3000);
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.error || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <div className="login-background" />
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="card shadow p-4 bg-white bg-opacity-75" style={{ maxWidth: '400px', width: '100%' }}>
          <h3 className="text-center mb-4">Connexion</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault(); // Empêche le rechargement de la page
              handleLogin();      // Lance la connexion
            }}
          >
            <div className="mb-3">
              <label className="form-label">Non d'utilisateur</label>
              <input
                type="texte"
                className="form-control"
                placeholder="Non d'utilisateur"
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

            <button
              type="submit" // Déclenche le submit du formulaire (y compris via "Entrée")
              className="btn btn-primary w-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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