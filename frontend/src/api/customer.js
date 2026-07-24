// src/api/customer.js
const VITE_API_URL = import.meta.env.VITE_API_URL;

const handleResponse = async (response) => {
  if (response.status === 204) return null;
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Request failed');
    }
    return null;
  }
  if (!response.ok) {
    const message = data?.message || (Array.isArray(data?.message) ? data.message[0] : "Something went wrong");
    const error = new Error(message);
    error.validationErrors = Array.isArray(data?.message) ? data.message : [message];
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
  async checkDuplicate(mobile, email) {
    const params = new URLSearchParams();
    if (mobile) params.append('mobile', mobile);
    if (email) params.append('email', email);
    const response = await fetch(`${VITE_API_URL}/customers/check-duplicate?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async findByMobile(mobile) {
    const response = await fetch(`${VITE_API_URL}/customers/find-by-mobile?mobile=${encodeURIComponent(mobile)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async requestOtp(mobile) {
    const response = await fetch(`${VITE_API_URL}/customers/request-otp`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ mobile }),
    });
    return handleResponse(response);
  },
  async verifyOtp(mobile, otp) {
    const response = await fetch(`${VITE_API_URL}/customers/verify-otp`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ mobile, otp }),
    });
    return handleResponse(response);
  }
};
