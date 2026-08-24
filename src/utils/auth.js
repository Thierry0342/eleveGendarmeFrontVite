// src/utils/auth.js
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getCurrentUserType = () => {
  const user = getCurrentUser();
  return user?.type || user?.role || null;
};