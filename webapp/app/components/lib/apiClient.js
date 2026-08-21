import { getAuthToken } from "./getSessionToken";

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").trim();
const API_BASE_URL = rawApiUrl.endsWith("/api")
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, "")}/api`;

export async function apiClient(
  endpoint,
  {
    method = "GET",
    body,
    headers = {},
    token,
  } = {}
) {
  const resolvedToken = token || (await getAuthToken());

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }),
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
