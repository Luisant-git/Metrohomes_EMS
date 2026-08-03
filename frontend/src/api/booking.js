// src/api/booking.js
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

export const booking = {
  async create(payload) {
    const response = await fetch(`${VITE_API_URL}/bookings`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
  async getAll() {
    const response = await fetch(`${VITE_API_URL}/bookings`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async getOne(id) {
    const response = await fetch(`${VITE_API_URL}/bookings/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async update(id, data) {
    const response = await fetch(`${VITE_API_URL}/bookings/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async remove(id) {
    const response = await fetch(`${VITE_API_URL}/bookings/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async getStats() {
    const response = await fetch(`${VITE_API_URL}/bookings/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async findByInvoiceNo(invoiceNo) {
    const response = await fetch(`${VITE_API_URL}/bookings/invoice/${encodeURIComponent(invoiceNo)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async createReceipt(data) {
    const response = await fetch(`${VITE_API_URL}/bookings/receipts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async getReceipts(bookingId) {
    const response = await fetch(`${VITE_API_URL}/bookings/${bookingId}/receipts`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async findByMobile(mobile) {
    const response = await fetch(`${VITE_API_URL}/bookings/mobile/${encodeURIComponent(mobile)}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async sendReceiptWhatsApp(receiptId) {
    const response = await fetch(`${VITE_API_URL}/bookings/receipts/${receiptId}/send-whatsapp`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  async cancel(id, data) {
    const response = await fetch(`${VITE_API_URL}/bookings/${id}/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  async downloadReceiptPdf(receiptId) {
    const response = await fetch(`${VITE_API_URL}/bookings/receipts/${receiptId}/pdf`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Failed to download PDF');
    }
    return response.blob();
  },
};
