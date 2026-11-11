import { DefaultSession } from 'next-auth';
import { UserRole } from '@/models/User';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      isBanned: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    role: UserRole;
    isBanned: boolean;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    isBanned: boolean;
  }
}