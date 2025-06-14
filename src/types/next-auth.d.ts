

declare module 'next-auth' {
  interface User {
    id: number;
    username: string;
    role: string;
    email?: string;
  }

  interface Session {
    user: User & {
      role: string;
      username: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    username: string;
  }
} 