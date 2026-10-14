import { getAuthToken } from "../lib/getSessionToken";

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").trim();
const API_BASE_URL = rawApiUrl.endsWith("/api")
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, "")}/api`;

/**
 * Uploads a document/image file to the backend
 * @param {File} file
 * @returns {Promise<{ success: boolean, data: { url: string, filename: string, originalName: string, size: number } }>}
 */
export async function uploadDocumentFile(file) {
  if (!file) {
    throw new Error("No file selected.");
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error("Please upload a valid image (JPG, PNG, WEBP) or PDF file.");
  }

  // 10MB limit
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("File size must be under 10MB.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const token = await getAuthToken();
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/upload/document`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "File upload failed.");
  }

  return data;
}
