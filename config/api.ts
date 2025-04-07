// config/api.ts

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

export const api = {
  url: API_URL,

  // Function to create headers with authentication token
  getHeaders: (token?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return headers
  },
}

