import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      username?: string;
    }
  }

  interface User {
    id: string;
    username: string;
    role: string;
    email?: string;
  }
} 