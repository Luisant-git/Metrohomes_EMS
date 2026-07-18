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

  async uploadImages(files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const response = await fetch(`${VITE_API_URL}/upload/images`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload images");
    }

    return response.json();
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${VITE_API_URL}/upload/file`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    return response.json();
  },

  async uploadFiles(files) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(`${VITE_API_URL}/upload/files`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload files");
    }

    return response.json();
  },
};