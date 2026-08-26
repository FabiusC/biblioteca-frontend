import axios from 'axios'

// URL base expuesta para mostrar en UI
export const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Instancia de axios con prefijo
export const api = axios.create({
  baseURL: `${apiBaseUrl}/api`
})
