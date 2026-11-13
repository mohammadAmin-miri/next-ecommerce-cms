'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

const registerSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد.'),
  email: z.string().email('فرمت ایمیل معتبر نیست.'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد.'),
});

/**
 * ۱. ورود با ایمیل و رمز عبور
 */
export async function loginAction(formData: { email: string; password: string }) {
  try {
    await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirectTo: '/admin/dashboard',
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'ایمیل یا رمز عبور اشتباه است.' };
        default:
          return { success: false, error: 'خطایی در فرآیند ورود رخ داد.' };
      }
    }
    // خطای Redirect در Next.js باید مجدداً پرتاب شود تا تغییر مسیر انجام گیرد
    throw error;
  }
}

/**
 * ۲. ورود سریع با یک کلیک (ویژه کارفرما در نسخه آنلاین و ادمین در لوکال)
 */
export async function quickLoginAction(mode: 'DEMO' | 'LOCAL_ADMIN') {
  if (mode === 'LOCAL_ADMIN' && process.env.NODE_ENV !== 'development') {
    return {
      success: false,
      error: 'ورود سریع سوپر ادمین فقط در محیط توسعه (Localhost) فعال است.',
    };
  }

  const email =
    mode === 'DEMO'
      ? process.env.DEMO_ADMIN_EMAIL || 'demo@example.com'
      : process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';

  const password =
    mode === 'DEMO'
      ? process.env.DEMO_ADMIN_PASSWORD || 'Demo@1234'
      : process.env.SUPER_ADMIN_PASSWORD || 'Admin@1234';

  return loginAction({ email, password });
}

/**
 * ۳. ثبت‌نام کاربر جدید (به‌صورت پیش‌فرض با نقش CUSTOMER)
 */
export async function registerAction(formData: {
  name: string;
  email: string;
  password: string;
}) {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'اطلاعات وارد شده نامعتبر است.',
    };
  }

  const { name, email, password } = parsed.data;

  try {
    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { success: false, error: 'این ایمیل قبلاً ثبت شده است.' };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'CUSTOMER',
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: `خطا در ثبت‌نام کاربر جدید.${error}` };
  }
}

/**
 * ۴. خروج از حساب کاربری
 */
export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}