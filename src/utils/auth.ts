export const getAuthToken = (): string | null => {
    // Implementation for getting the auth token
    return localStorage.getItem("authToken");
  }