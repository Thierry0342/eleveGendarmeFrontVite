// src/env/env.js

const DEFAULT_IP = "https://hardhead-marbles-glass.ngrok-free.dev"; // <-- URL ngrok
const savedIP = localStorage.getItem("CUSTOM_IP");
export const ENV_MODE = "prod";
export const IP = DEFAULT_IP;
export const IMAGE_PATH = IP + "/data/uploads";
export const API_URL = "https://hardhead-marbles-glass.ngrok-free.dev";