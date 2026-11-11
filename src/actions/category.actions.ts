'use server';

import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { slugify } from '@/lib/utils';
import { requireWriteAccess, AuthGuardError } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';

export async function getCategories() {
  await connectDB();
  return await Category.find({}).populate('parentCategory', 'name slug').lean();
}

export async function createCategory(formData: {
  name: string;
  parentCategory?: string;
  description?: string;
  image?: string;
}) {
  try {
    await requireWriteAccess(['ADMIN', 'EDITOR']);
    await connectDB();

    const slug = slugify(formData.name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      return { success: false, error: 'دسته‌بندی با این عنوان قبلاً ثبت شده است.' };
    }

    await Category.create({
      name: formData.name,
      slug,
      parentCategory: formData.parentCategory || null,
      description: formData.description,
      image: formData.image,
    });

    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'خطا در ایجاد دسته‌بندی' };
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    await requireWriteAccess(['ADMIN']);
    await connectDB();

    // بررسی اینکه آیا زیرمجموعه‌ای دارد یا خیر
    const hasChildren = await Category.findOne({ parentCategory: categoryId });
    if (hasChildren) {
      return { success: false, error: 'ابتدا باید زیرمجموعه‌های این دسته‌بندی را حذف کنید.' };
    }

    await Category.findByIdAndDelete(categoryId);
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'خطا در حذف دسته‌بندی' };
  }
}