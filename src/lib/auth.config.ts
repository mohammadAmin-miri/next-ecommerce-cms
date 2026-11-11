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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const isBanned = auth?.user?.isBanned;

      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      const isAuthRoute =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register');

      // ۱. مسدود کردن کامل کاربران اخراج‌شده (Banned)
      if (isLoggedIn && isBanned) {
        return Response.redirect(new URL('/login?error=AccountBanned', nextUrl));
      }

      // ۲. محافظت از مسیرهای پنل مدیریت (/admin/*)
      if (isAdminRoute) {
        if (!isLoggedIn) return false; // هدایت خودکار به /login

        const allowedAdminRoles: UserRole[] = ['ADMIN', 'DEMO_ADMIN', 'EDITOR'];
        if (!userRole || !allowedAdminRoles.includes(userRole)) {
          // اگر مشتری عادی (CUSTOMER) سعی کرد وارد /admin شود، به صفحه اصلی فروشگاه برگردد
          return Response.redirect(new URL('/?error=Forbidden', nextUrl));
        }
        return true;
      }

      // ۳. اگر کاربر لاگین است و وارد صفحه /login شد، هدایت به مقصد مناسب
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
  providers: [], // در فایل auth.ts پر می‌شود
};