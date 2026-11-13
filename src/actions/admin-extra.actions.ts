'use server';

import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { Coupon } from '@/models/Coupon';
import { Setting } from '@/models/Setting';
import { Product } from '@/models/Product';
import { requireWriteAccess, AuthGuardError } from '@/lib/auth-guard';
import { recordAuditLog } from '@/lib/audit';

/**
 * ۱. ویرایش محصول موجود (بر اساس ID یا Slug)
 */
export async function updateProductAction(
  productId: string,
  input: {
    title: string;
    slug: string;
    basePrice: number;
    discountPrice?: number;
    totalStock: number;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isFeatured: boolean;
    description: string;
  }
) {
  try {
    const session = await requireWriteAccess(['ADMIN', 'EDITOR']);
    await connectDB();

    const updated = await Product.findByIdAndUpdate(
      productId,
      {
        title: input.title,
        slug: input.slug,
        basePrice: Number(input.basePrice),
        discountPrice: input.discountPrice ? Number(input.discountPrice) : undefined,
        totalStock: Number(input.totalStock),
        status: input.status,
        isFeatured: input.isFeatured,
        description: input.description,
      },
      { new: true }
    );

    if (!updated) {
      return { success: false, error: 'محصول مورد نظر یافت نشد.' };
    }

    await recordAuditLog({
      actorId: session.user.id,
      actorName: session.user.name || 'مدیر',
      actorRole: String(session.user.role),
      action: 'UPDATE',
      entityType: 'PRODUCT',
      entityId: productId,
      description: `ویرایش محصول: ${input.title}`,
    });

    revalidatePath('/admin/products');
    revalidatePath(`/products/${updated.slug}`);
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) return { success: false, error: error.message };
    return { success: false, error: 'خطا در ویرایش اطلاعات محصول' };
  }
}

/**
 * ۲. تغییر نقش یا مسدودسازی کاربر
 */
export async function updateUserAccessAction(params: {
  userId: string;
  role: UserRole;
  isBanned: boolean;
}) {
  try {
    const session = await requireWriteAccess(['ADMIN']);
    await connectDB();

    await User.findByIdAndUpdate(params.userId, {
      role: params.role,
      isBanned: params.isBanned,
    });

    await recordAuditLog({
      actorId: session.user.id,
      actorName: session.user.name || 'مدیر ارشد',
      actorRole: String(session.user.role),
      action: 'STATUS_CHANGE',
      entityType: 'SYSTEM',
      entityId: params.userId,
      description: `تغییر دسترسی کاربر به نقش ${params.role} (مسدود: ${params.isBanned})`,
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) return { success: false, error: error.message };
    return { success: false, error: 'خطا در بروزرسانی وضعیت کاربر' };
  }
}

/**
 * ۳. ایجاد و حذف کد تخفیف
 */
export async function createCouponAction(input: {
  code: string;
  discountPercent: number;
  maxUsage: number;
  daysValid: number;
}) {
  try {
    await requireWriteAccess(['ADMIN', 'EDITOR']);
    await connectDB();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (Number(input.daysValid) || 7));

    await Coupon.create({
      code: input.code.toUpperCase().trim(),
      discountPercent: Number(input.discountPercent),
      maxUsage: Number(input.maxUsage),
      expiresAt,
      isActive: true,
    });

    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) return { success: false, error: error.message };
    return { success: false, error: 'خطا در ثبت کد تخفیف (احتمال تکراری بودن کد)' };
  }
}

export async function deleteCouponAction(id: string) {
  try {
    await requireWriteAccess(['ADMIN', 'EDITOR']);
    await connectDB();

    if (Types.ObjectId.isValid(id)) {
      await Coupon.findByIdAndDelete(id);
    }
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) return { success: false, error: error.message };
    return { success: false, error: 'خطا در حذف کد تخفیف' };
  }
}

/**
 * ۴. ذخیره تنظیمات کل فروشگاه
 */
export async function saveSettingsAction(input: {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  shippingCost: number;
  freeShippingThreshold: number;
  taxPercent: number;
  maintenanceMode: boolean;
}) {
  try {
    const session = await requireWriteAccess(['ADMIN']);
    await connectDB();

    const existing = await Setting.findOne({});
    if (existing) {
      await Setting.findByIdAndUpdate(existing._id, input);
    } else {
      await Setting.create(input);
    }

    await recordAuditLog({
      actorId: session.user.id,
      actorName: session.user.name || 'مدیر ارشد',
      actorRole: String(session.user.role),
      action: 'UPDATE',
      entityType: 'SYSTEM',
      description: 'بروزرسانی تنظیمات کل فروشگاه و نرخ ارسال/مالیات',
    });

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) return { success: false, error: error.message };
    return { success: false, error: 'خطا در ذخیره تنظیمات فروشگاه' };
  }
}