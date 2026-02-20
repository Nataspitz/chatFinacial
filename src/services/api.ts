import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL_DEV ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})
