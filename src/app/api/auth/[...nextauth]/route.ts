import { Auth } from '@auth/core';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const handler = async (req: Request) => {
  return Auth(req, {
    adapter: PrismaAdapter(prisma),
    secret: process.env.AUTH_SECRET,
    session: { strategy: 'jwt' },
    providers: [
      {
        id: 'credentials',
        name: 'Credentials',
        type: 'credentials',
        credentials: {
          username: { label: 'Username', type: 'text' },
          password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {
          const username = typeof credentials?.username === 'string' ? credentials.username : '';
          const password = typeof credentials?.password === 'string' ? credentials.password : '';
          if (!username || !password) return null;
          const user = await prisma.user.findUnique({
            where: { username }
          });
          if (!user) return null;
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;
          return {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email
          };
        }
      }
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user && typeof user === 'object') {
          const u = user as { role?: string; username?: string };
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
      }
    },
    pages: {
      signIn: '/admin',
    },
    debug: true,
  });
};

export { handler as GET, handler as POST }; 