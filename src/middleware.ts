import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // عدم اجرا روی صفحه اصلی (/) و صفحات کاتالوگ (/products)
  matcher: ['/admin/:path*', '/login', '/register'],
};