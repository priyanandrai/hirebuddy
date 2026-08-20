import { getSession } from "next-auth/react";

export async function getAuthToken() {
  if (typeof window !== "undefined") {
    const localToken = localStorage.getItem("token");
    if (localToken) {
      return localToken;
    }
  }

  const session = await getSession();
  return session?.accessToken || session?.token || null;
}
