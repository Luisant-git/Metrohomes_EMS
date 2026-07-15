const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const uploadAPI = {
  async uploadImage(photoFile) {
    const formData = new FormData();
    formData.append("image", photoFile);

    const response = await fetch(`${VITE_API_URL}/upload/image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    return response.json();
  },
};
