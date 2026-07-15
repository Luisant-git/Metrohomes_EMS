// src/api/dashboard.api.js
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

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
});

export const dashboard = {
  // Get dashboard overview for the current user
  async getDashboard() {
    const response = await fetch(`${VITE_API_URL}/dashboard`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get downline role counts (equivalent to the old utility function)
  async getDownlineRoleCounts() {
    const response = await fetch(`${VITE_API_URL}/dashboard/downline-role-counts`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Keep the utility function as a fallback for when the API is not available
const ROLE_ORDER = ["Regional Manager", "Branch Manager", "BDM", "Sales Manager"];

export function getDownlineRoleCounts(users = [], currentUserId) {
  if (!Array.isArray(users) || !currentUserId) return [];

  const roleCounts = {};
  const queue = users.filter((user) => user?.parentUserId === currentUserId);
  const visited = new Set([currentUserId]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;

    visited.add(current.id);

    if (current.role) {
      roleCounts[current.role] = (roleCounts[current.role] || 0) + 1;
    }

    const children = users.filter((user) => user?.parentUserId === current.id);
    queue.push(...children);
  }

  return Object.entries(roleCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => ROLE_ORDER.indexOf(a[0]) - ROLE_ORDER.indexOf(b[0]))
    .map(([role, count]) => ({ role, count }));
}