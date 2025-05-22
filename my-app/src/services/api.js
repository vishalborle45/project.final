import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_SERVER_API_URL + "/api";
console.log(API_URL)

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add authorization header interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const register = async (userData) => {
  return api.post("/auth/register", userData);
};

export const login = async (credentials) => {
  return api.post("/auth/login", credentials);
};

export const getProfile = async () => {
  return api.get("/auth/profile");
};

export default api;
