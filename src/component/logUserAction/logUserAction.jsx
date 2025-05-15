import logService from "../../services/logs-service"; 


const logUserAction = async (action, details = "") => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const log = {
    userId: user.id,
    action,
    details,
    timestamp: new Date().toISOString(),
  };

  try {
    await logService.post(log);
  } catch (err) {
    console.error("Erreur lors de l'enregistrement du log :", err);
  }
};

export default logUserAction;
