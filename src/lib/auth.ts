import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authConfig } from '@/lib/auth.config';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

const loginSchema = z.object({
  email: z.string().email('فرمت ایمیل معتبر نیست.'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد.'),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        await connectDB();

        // واکشی کاربر به همراه فیلد مخفی passwordHash
        const user = await User.findOne({ email: email.toLowerCase() }).select(
          '+passwordHash'
        );

        if (!user) {
          return null;
        }

        if (user.isBanned) {
          throw new Error('حساب کاربری شما مسدود شده است.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        // ثبت زمان آخرین ورود
        await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isBanned: user.isBanned,
        };
      },
    }),
  ],
});