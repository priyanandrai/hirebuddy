import { getAuthToken } from "./getSessionToken";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export async function apiClient(
  endpoint,
  {
    method = "GET",
    body,
    headers = {},
  } = {}
) {
    const token = await getAuthToken();
  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
}
