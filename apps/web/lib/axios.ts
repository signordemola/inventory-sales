import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/backend',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
