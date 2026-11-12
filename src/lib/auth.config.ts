import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/models/User';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // ۳۰ روز
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl, headers } = request;

      // 🔴 جلوگیری از اجرای ریدایرکت روی درخواست‌های Prefetch پس‌زمینه Next.js
      if (
        headers.get('purpose') === 'prefetch' ||
        headers.get('next-router-prefetch') === '1'
      ) {
        return true;
      }

      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role as UserRole | undefined;
      const isBanned = auth?.user?.isBanned;

      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      const isAuthRoute =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register');

      // ۱. مسدود کردن کاربران اخراج‌شده (فقط اگر از قبل در صفحه /login نباشند تا حلقه نسازد)
      if (isLoggedIn && isBanned) {
        if (isAuthRoute) return true;
        return Response.redirect(new URL('/login?error=AccountBanned', nextUrl));
      }

      // ۲. محافظت از مسیرهای پنل مدیریت (/admin/*)
      if (isAdminRoute) {
        if (!isLoggedIn) return false; // هدایت به /login

        const allowedAdminRoles: UserRole[] = ['ADMIN', 'DEMO_ADMIN', 'EDITOR'];
        if (!userRole || !allowedAdminRoles.includes(userRole)) {
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      // ۳. اگر کاربر لاگین است و خودش مستقیماً وارد /login شد
      if (isAuthRoute && isLoggedIn) {
        const redirectUrl =
          userRole === 'CUSTOMER' ? '/' : '/admin/dashboard';
        return Response.redirect(new URL(redirectUrl, nextUrl));
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
        token.role = user.role;
        token.isBanned = user.isBanned;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isBanned = token.isBanned as boolean;
      }
      return session;
    },
  },
  providers: [],
};