'use server';

import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { slugify } from '@/lib/utils';
import { requireWriteAccess, AuthGuardError } from '@/lib/auth-guard';
import { productFormSchema, ProductFormValues } from '@/lib/validations/product.schema';
import { revalidatePath } from 'next/cache';

/**
 * ۱. ایجاد محصول جدید
 */
export async function createProduct(data: ProductFormValues) {
  try {
    await requireWriteAccess(['ADMIN', 'EDITOR']);
    await connectDB();

    const parsed = productFormSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'اطلاعات نامعتبر است.',
      };
    }

    const val = parsed.data;
    const slug = slugify(val.title);

    const totalStock = val.variants.reduce((acc, v) => acc + v.stock, 0);

    const existing = await Product.findOne({ $or: [{ slug }, { sku: val.sku.toUpperCase() }] });
    if (existing) {
      return {
        success: false,
        error: 'محصولی با این عنوان (Slug) یا کد SKU قبلاً ثبت شده است.',
      };
    }

    await Product.create({
      title: val.title,
      slug,
      sku: val.sku.toUpperCase(),
      description: val.description,
      basePrice: val.basePrice,
      discountPrice: val.discountPrice,
      categories: val.categories,
      brand: val.brand || undefined,
      images: val.images,
      variants: val.variants,
      totalStock: totalStock > 0 ? totalStock : 0,
      status: val.status,
      isFeatured: val.isFeatured,
      seo: {
        metaTitle: val.seoMetaTitle,
        metaDescription: val.seoMetaDescription,
      },
    });

    revalidatePath('/admin/products');
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: 'خطا در ثبت محصول جدید' };
  }
}

/**
 * ۲. حذف تکی محصول
 */
export async function deleteProduct(productId: string) {
  try {
    await requireWriteAccess(['ADMIN']);
    await connectDB();

    const deleted = await Product.findByIdAndDelete(productId);
    if (!deleted) {
      return { success: false, error: 'محصول مورد نظر یافت نشد.' };
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: 'خطا در حذف محصول' };
  }
}

/**
 * ۳. عملیات گروهی روی محصولات انتخاب‌شده (Bulk Delete / Bulk Status Update)
 */
export async function bulkUpdateProducts(
  productIds: string[],
  action: 'DELETE' | 'PUBLISH' | 'DRAFT' | 'ARCHIVE'
) {
  try {
    if (!productIds.length) {
      return { success: false, error: 'هیچ محصولی انتخاب نشده است.' };
    }

    // حذف گروهی فقط مخصوص سوپر ادمین است، اما تغییر وضعیت را ادیتور هم می‌تواند انجام دهد
    const allowedRoles = action === 'DELETE' ? (['ADMIN'] as const) : (['ADMIN', 'EDITOR'] as const);
    await requireWriteAccess([...allowedRoles]);
    await connectDB();

    if (action === 'DELETE') {
      await Product.deleteMany({ _id: { $in: productIds } });
    } else {
      const statusMap = {
        PUBLISH: 'PUBLISHED',
        DRAFT: 'DRAFT',
        ARCHIVE: 'ARCHIVED',
      } as const;

      await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { status: statusMap[action] } }
      );
    }

    revalidatePath('/admin/products');
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: 'خطا در اجرای عملیات گروهی' };
  }
}