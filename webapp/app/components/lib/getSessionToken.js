import { getSession } from "next-auth/react";

export async function getAuthToken() {
  const session = await getSession();
  console.log("sessionsession",session);
  
  return session?.accessToken;
}
