const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const googleBackendLogin = async (session) => {
    console.log("calling api");
    
  const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    }),
  });

  if (!res.ok) {
    throw new Error("Backend Google auth failed");
  }

  return res.json();
};
