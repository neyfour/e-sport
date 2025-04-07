// src/api.tsx

const API_URL = import.meta.env.REACT_APP_API_URL || "http://localhost:8000"

export const api = {
  url: API_URL,
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

