import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/signup",
  },

  callbacks: {
    async jwt({ token, user }) {
      // Runs on login
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },

    async session({ session, token }) {
      // Attach token data to session
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
