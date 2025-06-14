import { PrismaAdapter } from '@auth/prisma-adapter';
import { Auth } from '@auth/core';
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import Credentials from '@auth/core/providers/credentials';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

export const runtime = 'edge';

export async function POST(req: Request) {
  return Auth(req, {
    adapter: PrismaAdapter(prisma),
    providers: [
      Credentials({
        name: 'Credentials',
        credentials: {
          username: { label: 'Логин', type: 'text' },
          password: { label: 'Пароль', type: 'password' },
        },
        async authorize(credentials) {
          if (
            !credentials ||
            typeof credentials.username !== 'string' ||
            typeof credentials.password !== 'string'
          ) {
            return null;
          }
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });
          if (!user || typeof user.password !== 'string') return null;
          const isValid = await compare(credentials.password, user.password);
          if (!isValid) return null;
          return {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email ?? undefined,
          };
        },
      }),
    ],
    session: { strategy: 'jwt' },
    secret: process.env.AUTH_SECRET,
    pages: {
      signIn: '/admin',
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user && typeof user === 'object') {
          const u = user as Partial<PrismaUser>;
          if (u.role) token.role = u.role;
          if (u.username) token.username = u.username;
        }
        return token;
      },
      async session({ session, token }) {
        if (token) {
          (session.user as any).role = token.role;
          (session.user as any).username = token.username;
        }
        return session;
      },
    },
  });
} 