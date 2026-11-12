import { auth } from '@/lib/auth';
import { UserRole } from '@/models/User';

export class AuthGuardError extends Error {
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'DEMO_RESTRICTED';

  constructor(
    message: string,
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'DEMO_RESTRICTED'
  ) {
    super(message);
    this.name = 'AuthGuardError';
    this.code = code;
  }
}

/**
 * ۱. گارد دسترسی خواندن (Read-Only):
 * به ADMIN، EDITOR و DEMO_ADMIN اجازه مشاهده داشبورد و گزارش‌ها را می‌دهد،
 * اما جلوی کاربران عادی (CUSTOMER) یا لاگین نکرده را می‌گیرد.
 */
export async function requireReadAccess(
  allowedRoles: UserRole[] = ['ADMIN', 'EDITOR', 'DEMO_ADMIN']
) {
  const session = await auth();

  if (!session || !session.user) {
    throw new AuthGuardError(
      'لطفاً ابتدا وارد حساب کاربری خود شوید.',
      'UNAUTHORIZED'
    );
  }

  const userRole = session.user.role as UserRole;

  if (!allowedRoles.includes(userRole)) {
    throw new AuthGuardError(
      'شما مجوز دسترسی به این بخش را ندارید.',
      'FORBIDDEN'
    );
  }

  return session;
}

/**
 * ۲. گارد دسترسی نوشتن (Write / Mutation):
 * مخصوص عملیات‌های تغییر دیتابیس (Create, Update, Delete).
 * اکانت DEMO_ADMIN را به صورت کامل مهار می‌کند.
 */
export async function requireWriteAccess(
  allowedRoles: UserRole[] = ['ADMIN', 'EDITOR']
) {
  const session = await auth();

  if (!session || !session.user) {
    throw new AuthGuardError(
      'لطفاً ابتدا وارد حساب کاربری خود شوید.',
      'UNAUTHORIZED'
    );
  }

  const userRole = session.user.role as UserRole;

  // مهار کردن اکانت کارفرما (DEMO_ADMIN) قبل از هرگونه تغییر در دیتابیس
  if (userRole === 'DEMO_ADMIN') {
    throw new AuthGuardError(
      'شما با حساب پیش‌نمایش (DEMO_ADMIN) وارد شده‌اید. در نسخه دمو امکان افزودن، ویرایش یا حذف اطلاعات وجود ندارد.',
      'DEMO_RESTRICTED'
    );
  }

  if (!allowedRoles.includes(userRole)) {
    throw new AuthGuardError(
      'شما مجوز انجام این عملیات را ندارید.',
      'FORBIDDEN'
    );
  }

  return session;
}