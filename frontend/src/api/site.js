// src/api/site.js
const VITE_API_URL = import.meta.env.VITE_API_URL;

const handleResponse = async (response) => {
    // No content (204) — nothing to parse
    if (response.status === 204) return null;

    // Try to parse JSON if any content exists
    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        // If parsing fails and response is not ok, throw a generic error
        if (!response.ok) {
            throw new Error('Request failed');
        }
        // If parsing fails but response is ok, return null
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

export const site = {
    // Create Site (Admin/Director only)
    async create(siteData) {
        const response = await fetch(`${VITE_API_URL}/sites`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(siteData),
        });
        return handleResponse(response);
    },

    // Get All Sites (with filters)
    async getAll(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${VITE_API_URL}/sites?${queryString}` : `${VITE_API_URL}/sites`;

        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // Get Site Statistics
    async getStats() {
        const response = await fetch(`${VITE_API_URL}/sites/stats`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // Get Site by ID
    async getById(siteId) {
        const response = await fetch(`${VITE_API_URL}/sites/${siteId}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // Update Site (Admin/Director only)
    async update(siteId, siteData) {
        const response = await fetch(`${VITE_API_URL}/sites/${siteId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(siteData),
        });
        return handleResponse(response);
    },

    // Delete Site (Admin/Director only)
    async delete(siteId) {
        const response = await fetch(`${VITE_API_URL}/sites/${siteId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },
};