import axios from "axios";

export const BASE_URL = "http://192.168.15.13:8000";

const api = axios.create({
    baseURL: BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
})

export default api;