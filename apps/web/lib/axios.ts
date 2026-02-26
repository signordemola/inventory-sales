import axios from "axios";

// In the browser, requests go through Vercel's rewrite proxy (/backend/*)
// to keep everything same-origin (no cross-domain cookie issues).
const apiClient = axios.create({
  baseURL: "/backend/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
