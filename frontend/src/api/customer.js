// src/api/customer.js
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
    const error = new Error(
      Array.isArray(data?.message) ? data.message[0] : (data?.message || "Something went wrong")
    );
    error.validationErrors = Array.isArray(data?.message) ? data.message : [data?.message || "Something went wrong"];
    throw error;
  }
  return data;
};

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
});

export const customer = {
  async registerCustomer(payload) {
    const response = await fetch(`${VITE_API_URL}/customers`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
  async getAll() {
    const response = await fetch(`${VITE_API_URL}/customers`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async getOne(id) {
    const response = await fetch(`${VITE_API_URL}/customers/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${VITE_API_URL}/customers/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async remove(id) {
    const response = await fetch(`${VITE_API_URL}/customers/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
