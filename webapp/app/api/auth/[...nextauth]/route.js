import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const getBackendApiBase = () => {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:8080/api";
  const normalized = raw.trim().replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

const loginOrCreateGoogleUser = async (user) => {
  if (!user?.email) {
    throw new Error("Google account email is required");
  }

  const res = await fetch(`${getBackendApiBase()}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      name: user.name,
      image: user.image,
    }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Backend Google auth failed");
  }

  return data;
};

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/signup",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const data = await loginOrCreateGoogleUser(user);
          user.backendToken = data.token;
          user.appUser = data.user;
        } catch (error) {
          console.error("Google sign-in backend sync failed:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      // Runs on login
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.backendToken = user.backendToken;
        token.appUser = user.appUser;
      }
      return token;
    },

    async session({ session, token }) {
      // Attach token data to session
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
      session.backendToken = token.backendToken;
      session.appUser = token.appUser;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
