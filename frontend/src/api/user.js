
const VITE_API_URL = import.meta.env.VITE_API_URL;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
};

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
});

export const user = {
  // Create User (Admin/Director only)
  async create(userData) {
    const response = await fetch(`${VITE_API_URL}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Get All Users (with filters)
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${VITE_API_URL}/users?${queryString}` : `${VITE_API_URL}/users`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get User Statistics
  async getStats() {
    const response = await fetch(`${VITE_API_URL}/users/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get Organization Hierarchy
  async getHierarchy() {
    const response = await fetch(`${VITE_API_URL}/users/hierarchy`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get Team Members
  async getTeam(userId) {
    const response = await fetch(`${VITE_API_URL}/users/team/${userId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get Creatable Roles
  async getCreatableRoles(role) {
    const response = await fetch(`${VITE_API_URL}/users/roles/creatable?role=${role}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Search Users
  async search(query) {
    const response = await fetch(`${VITE_API_URL}/users/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get User by ID
  async getById(userId) {
    const response = await fetch(`${VITE_API_URL}/users/${userId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Update User
  async update(userId, userData) {
    const response = await fetch(`${VITE_API_URL}/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Update PIN
  async updatePin(userId, oldPin, newPin) {
    const response = await fetch(`${VITE_API_URL}/users/${userId}/pin`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ oldPin, newPin }),
    });
    return handleResponse(response);
  },

  // Reset PIN (Admin only)
  async resetPin(userId, newPin) {
    const response = await fetch(`${VITE_API_URL}/users/${userId}/reset-pin`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPin }),
    });
    return handleResponse(response);
  },

  // Update User Status
  async updateStatus(userId, status) {
    const response = await fetch(`${VITE_API_URL}/users/${userId}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // Delete User (Admin/Director only)
  async delete(userId) {
    const response = await fetch(`${VITE_API_URL}/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};