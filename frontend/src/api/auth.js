// src/api/auth.api.js
const VITE_API_URL = import.meta.env.VITE_API_URL;

const handleResponse = async (response) => {
  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) throw new Error('Request failed');
    return null;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
};

const getAuthToken = () => localStorage.getItem("authToken");
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getAuthToken()}`,
});

export const auth = {
  // Register Admin (First Time Only)
  async registerAdmin(userData) {
    const response = await fetch(`${VITE_API_URL}/auth/register-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Login with identifier (employeeCode, email, or mobile)
  async login(identifier, pin) {
    const response = await fetch(`${VITE_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, pin }),
    });

    const data = await handleResponse(response);
    localStorage.setItem("authToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  // Get current user profile
  async getProfile() {
    const response = await fetch(`${VITE_API_URL}/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Logout
  logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:logout"));
  },

  // Check if authenticated
  isAuthenticated() {
    return !!localStorage.getItem("authToken");
  },

  // Get current user from localStorage
  getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Get auth token
  getToken() {
    return localStorage.getItem("authToken");
  },

  // Update user in localStorage
  updateUser(userData) {
    localStorage.setItem("user", JSON.stringify(userData));
  },
};