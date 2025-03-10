import NextAuth from "next-auth";
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
  
          // Find user in Prisma
          const user = await prisma.user.findUnique({
            where: { email }
          });
  
          if (!user) {
            throw new Error("No user found with this email");
          }
  
          // Compare hashed password
          const isValidPassword = await bcrypt.compare(password, user.password);
  
          if (!isValidPassword) {
            throw new Error("Invalid password");
          }
  
          // Return user object to include in JWT
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            timeZone: user.timeZone // ✅ Ensure we return this
          };
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
        // First time JWT callback is run, user object is available
        if (user) {
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.timeZone = user.timeZone; // ✅ Pass timeZone here
        }
        return token;
      },
  
      async session({ session, token }) {
        if (token) {
          session.user.id = token.id;
          session.user.name = token.name;
          session.user.email = token.email;
          session.user.timeZone = token.timeZone; // ✅ Pass timeZone to session here
        }
        return session;
      }
    },
  
    secret: process.env.NEXTAUTH_SECRET
  };
  

// Create NextAuth handler
const handler = NextAuth(authOptions);

// For Next.js 13+ App Router, export `handlers`
export { handler as GET, handler as POST };
