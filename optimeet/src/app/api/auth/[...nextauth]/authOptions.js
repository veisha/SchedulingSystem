import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "novae@domain.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const { email, password } = credentials;
      
        try {
          const user = await prisma.user.findUnique({
            where: { email }
          });
      
          if (!user) {
            throw new Error("No user found with this email");
          }
      
          const isValidPassword = await bcrypt.compare(password, user.password);
      
          if (!isValidPassword) {
            throw new Error("Invalid password");
          }
      
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            timeZone: user.timeZone
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw new Error("Authorization failed");
        }
      }
    })
  ],

  session: {
    strategy: "jwt"
  },

  pages: {
    signIn: "/login",
    error: "/login"
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.timeZone = user.timeZone;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.timeZone = token.timeZone;
      }
      return session;
    }
  },

  secret: process.env.NEXTAUTH_SECRET
};
