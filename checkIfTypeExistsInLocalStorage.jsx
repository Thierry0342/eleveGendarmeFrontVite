function checkIfTypeExistsInLocalStorage(type) {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user')); // ou 'utilisateur' selon ta clé
      return storedUser?.type === type;
    } catch (e) {
      return false;
    }
  }
  