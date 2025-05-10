import { ENV_MODE, IP } from "../env/env"

export const IMAGE_PATH = (ENV_MODE == "dev" ? "http://localhost:3000" : IP) + "/data/uploads"

export const API_URL = ENV_MODE == "dev" ? "http://localhost:4000" : IP