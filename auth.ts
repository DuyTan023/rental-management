import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email);
        const password = String(credentials.password);

        const user = await prisma.users.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          return null;
        }

        if (user.status !== "ACTIVE") {
          return null;
        }

        if (!user.password_hash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password_hash,
        );

        if (!isPasswordValid) {
          return null;
        }

        await prisma.users.update({
          where: {
            id: user.id,
          },
          data: {
            last_login_at: new Date(),
          },
        });

        return {
          id: user.id.toString(),
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;

      return session;
    },
  },
});
