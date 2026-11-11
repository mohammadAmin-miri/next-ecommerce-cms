import { auth } from '@/lib/auth';
import { UserRole } from '@/models/User';

export class AuthGuardError extends Error {
  code: 'UNAUTHORIZED' | 'DEMO_RESTRICTED' | 'FORBIDDEN';

  constructor(
    message: string,
    code: 'UNAUTHORIZED' | 'DEMO_RESTRICTED' | 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'AuthGuardError';
    this.code = code;
  }
}

/**
 * گارد امنیتی برای Server Actions که دیتابیس را تغییر می‌دهند (Create / Update / Delete)
 */
export async function requireWriteAccess(
  allowedRoles: UserRole[] = ['ADMIN', 'EDITOR']
) {
  const session = await auth();

  if (!session || !session.user) {
    throw new AuthGuardError(
      'برای انجام این عملیات ابتدا باید وارد حساب کاربری خود شوید.',
      'UNAUTHORIZED'
    );
  }

  // مهار کردن اکانت کارفرما (DEMO_ADMIN) قبل از هرگونه تغییر در دیتابیس
  if (session.user.role === 'DEMO_ADMIN') {
    throw new AuthGuardError(
      'شما با حساب پیش‌نمایش (DEMO_ADMIN) وارد شده‌اید. در نسخه دمو امکان افزودن، ویرایش یا حذف اطلاعات وجود ندارد.',
      'DEMO_RESTRICTED'
    );
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new AuthGuardError(
      'شما سطح دسترسی لازم برای انجام این عملیات را ندارید.',
      'FORBIDDEN'
    );
  }

  return session.user;
}