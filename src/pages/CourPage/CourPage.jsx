import React, { useState, useEffect } from 'react';
import courService from '../../services/courService';
import userService from '../../services/userService'; 
import Swal from 'sweetalert2';

const CourPage = () => {
  const [cour, setCour] = useState('');
  const [message, setMessage] = useState('');
  const [coursList, setCoursList] = useState([]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [utilisateurs, setUtilisateurs] = useState([]);

  // Charger les cours et utilisateurs
  useEffect(() => {
    fetchCours();
    fetchUtilisateurs();
  }, []);

  const fetchCours = async () => {
    try {
      const response = await courService.getAll();
      setCoursList(response.data);
    } catch (error) {
      console.error('Erreur de chargement des cours', error);
    }
  };

  const fetchUtilisateurs = async () => {
    try {
      const response = await userService.getAll();
      setUtilisateurs(response.data);
    } catch (error) {
      console.error('Erreur de chargement des utilisateurs', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cour || Number(cour) < 77 || Number(cour) > 999) {
      setMessage('Le cours doit être un nombre entre 77 et 999.');
      return;
    }

    try {
      await courService.post({ cour: Number(cour) });
      setMessage('Cours ajouté avec succès !');
      setCour('');
      setTimeout(() => setMessage(''), 5000);
      fetchCours();
    } catch (error) {
      console.error('Erreur lors de l’ajout du cours', error);
      setMessage("Erreur lors de l'ajout.");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Confirmation',
      text: "Voulez-vous vraiment supprimer ce cours ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });
  
    if (!result.isConfirmed) return;
  
    try {
      await courService.delete(id);
      setMessage('Cours supprimé.');
      fetchCours();
      Swal.fire('Supprimé !', 'Le cours a été supprimé.', 'success');
    } catch (error) {
      console.error('Erreur de suppression', error);
      setMessage("Erreur lors de la suppression.");
      Swal.fire('Erreur', 'Impossible de supprimer le cours.', 'error');
    }
  };
  
  //add user
  const handleAddUser = async (e) => {
    e.preventDefault();
  
    const result = await Swal.fire({
      title: 'Confirmation',
      text: "Voulez-vous vraiment ajouter cet utilisateur ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, ajouter',
      cancelButtonText: 'Annuler',
    });
  
    if (!result.isConfirmed) return; // Si l'utilisateur annule, ne pas procéder à l'ajout
  
    try {
      await userService.post({ username, password, type });
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Utilisateur ajouté avec succès.',
      });
      setUsername('');
      setPassword('');
      setType('');
      fetchUtilisateurs();
    } catch (error) {
      console.error('Erreur ajout utilisateur', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Erreur lors de l'ajout de l'utilisateur.",
      });
    }
  };
  
  
  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action supprimera l'utilisateur définitivement.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });
  
    if (!result.isConfirmed) return;
  
    try {
      await userService.delete(id);
      await fetchUtilisateurs();
      Swal.fire({
        icon: 'success',
        title: 'Supprimé',
        text: 'Utilisateur supprimé avec succès.',
      });
    } catch (error) {
      console.error('Erreur de suppression utilisateur', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Impossible de supprimer l'utilisateur.",
      });
    }
  };
  //pour modifier user 
  const handleEditUser = async (user) => {
    const { value: formValues } = await Swal.fire({
      title: 'Modifier l’utilisateur',
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="Nom d'utilisateur" value="${user.username}">` +
        `<select id="swal-input2" class="swal2-input">
           <option value="user" ${user.type === 'user' ? 'selected' : ''}>user</option>
           <option value="saisie" ${user.type === 'saisie' ? 'selected' : ''}>saisie</option>
           <option value="admin" ${user.type === 'admin' ? 'selected' : ''}>admin</option>
         </select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const username = document.getElementById('swal-input1').value;
        const type = document.getElementById('swal-input2').value;
        if (!username || username.trim().length < 3) {
          Swal.showValidationMessage('Nom invalide (min. 3 caractères)');
          return false;
        }
        return { username, type };
      }
    });
  
    if (formValues) {
      try {
        await userService.update(user.id, formValues); // Assure-toi que userService a une méthode `.update`
        fetchUtilisateurs();
        Swal.fire('Modifié', 'Utilisateur mis à jour avec succès', 'success');
      } catch (error) {
        console.error('Erreur modification utilisateur', error);
        Swal.fire('Erreur', 'La mise à jour a échoué', 'error');
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Formulaire cours */}
        <div className="col-md-6">
          <h4>Ajouter un nouveau cours</h4>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="cour" className="form-label">Numéro du cours</label>
              <input
                type="number"
                className="form-control"
                id="cour"
                value={cour}
                onChange={(e) => setCour(e.target.value)}
                placeholder="Ex: 79"
                required
                min={77}
                max={999}
              />
            </div>
            <button type="submit" className="btn btn-primary">Ajouter</button>
          </form>
          {message && <div className="alert alert-info mt-3">{message}</div>}
        </div>

        {/* Liste des cours */}
        <div className="col-md-6">
          <h4>Liste des cours</h4>
          {coursList.length === 0 ? (
            <p>Aucun cours enregistré.</p>
          ) : (
            <table className="table table-bordered table-sm">
              <thead className="table-light">
                <tr>
                  <th>Numéro</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {coursList.map((item) => (
                  <tr key={item.id}>
                    <td>{item.cour}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <hr className="my-4" />

      <div className="row">
        {/* Formulaire utilisateur */}
        <div className="col-md-6">
          <h4>Ajouter un utilisateur</h4>
          <form onSubmit={handleAddUser}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Nom d'utilisateur</label>
              <input
                type="text"
                className="form-control"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="mb-3">
                <label htmlFor="type" className="form-label">Type</label>
                <select
                  className="form-select"
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner un type --</option>
                  <option value="user">User</option>
                  <option value="saisie">Saisie</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            <button type="submit" className="btn btn-success">Ajouter l'utilisateur</button>
          </form>
          {userMessage && <div className="alert alert-info mt-2">{userMessage}</div>}
        </div>

        {/* Liste des utilisateurs */}
        <div className="col-md-6">
          <h4>Liste des utilisateurs</h4>
          {utilisateurs.length === 0 ? (
            <p>Aucun utilisateur enregistré.</p>
          ) : (
            <table className="table table-bordered table-sm">
              <thead className="table-light">
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.type}</td>
                    
                    <td>
                          <button
                              className="btn btn-warning btn-sm me-2"
                              onClick={() => handleEditUser(user)}
                          >
                               Modifier
                          </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                            Supprimer
                          </button>
                        </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourPage;
