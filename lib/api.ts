import axios from "axios"
import { ApiLink } from "./constants/links"

const adminApi = axios.create({
  baseURL: ApiLink,
  headers: {
    "Content-Type": "application/json",
  },
})

adminApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("admin_token="))
      ?.split("=")[1]
    if (token) {
      config.headers.Authorization = `Bearer ${decodeURIComponent(token)}`
    }
  }
  return config
})

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default adminApi
