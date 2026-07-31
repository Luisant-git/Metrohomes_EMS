// src/api/maps.js
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
    throw error;
  }
  return data;
};

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("authToken") || ""}`,
});

export const mapsApi = {
  async getAutocomplete(input) {
    if (!input || input.trim().length === 0) return { success: true, suggestions: [] };
    const response = await fetch(`${VITE_API_URL}/maps/autocomplete?input=${encodeURIComponent(input)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async geocode(address, latlng) {
    let query = "";
    if (address) query = `address=${encodeURIComponent(address)}`;
    else if (latlng) query = `latlng=${encodeURIComponent(latlng)}`;
    
    const response = await fetch(`${VITE_API_URL}/maps/geocode?${query}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async calculateDistance(pickup, drop) {
    const response = await fetch(`${VITE_API_URL}/maps/distance?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getDirections(origin, destination) {
    const response = await fetch(`${VITE_API_URL}/maps/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getApiKey() {
    const response = await fetch(`${VITE_API_URL}/maps/api-key`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  }
};
