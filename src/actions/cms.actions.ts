'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { Post } from '@/models/Post';
import { Comment, CommentStatus } from '@/models/Comment';
import { requireWriteAccess, AuthGuardError } from '@/lib/auth-guard';
import { slugify } from '@/lib/utils';

export interface CreatePostInput {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  status: 'DRAFT' | 'PUBLISHED';
  metaTitle?: string;
  metaDescription?: string;
}

/**
 * ۱. ایجاد مقاله جدید توسط ادمین یا نویسنده
 */
export async function createPostAction(input: CreatePostInput) {
  try {
    const session = await requireWriteAccess(['ADMIN', 'EDITOR']);
    await connectDB();

    const finalSlug = input.slug ? slugify(input.slug) : slugify(input.title);

    const existing = await Post.findOne({ slug: finalSlug }).lean();
    if (existing) {
      return { success: false, error: 'مقاله‌ای با این نامک (Slug) قبلاً ثبت شده است.' };
    }

    const post = await Post.create({
      title: input.title,
      slug: finalSlug,
      excerpt: input.excerpt,
      content: input.content,
      coverImage: input.coverImage || '',
      author: session.id,
      tags: input.tags || [],
      status: input.status,
      seo: {
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
      },
    });

    revalidatePath('/admin/posts');
    revalidatePath('/blog');

    return { success: true, postId: post._id.toString() };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'خطا در ثبت مقاله جدید' };
  }
}

/**
 * ۲. حذف مقاله
 */
export async function deletePostAction(postId: string) {
  try {
    await requireWriteAccess(['ADMIN', 'EDITOR']);
    await connectDB();

    await Post.findByIdAndDelete(postId);
    revalidatePath('/admin/posts');
    revalidatePath('/blog');

    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'خطا در حذف مقاله' };
  }
}

/**
 * ۳. ثبت دیدگاه جدید توسط کاربر در صفحه محصول یا مقاله
 */
export async function submitCommentAction(input: {
  targetType: 'PRODUCT' | 'POST';
  targetId: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  content: string;
}) {
  try {
    await connectDB();

    if (!input.authorName.trim() || !input.content.trim()) {
      return { success: false, error: 'لطفاً نام و متن دیدگاه را وارد کنید.' };
    }

    await Comment.create({
      targetType: input.targetType,
      targetId: input.targetId,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      rating: Math.min(5, Math.max(1, Number(input.rating) || 5)),
      content: input.content,
      status: 'PENDING', // نیازمند تایید مدیر
    });

    revalidatePath('/admin/comments');
    return {
      success: true,
      message: 'دیدگاه شما ثبت شد و پس از تایید مدیریت نمایش داده می‌شود.',
    };
  } catch {
    return { success: false, error: 'خطا در ثبت دیدگاه' };
  }
}

/**
 * ۴. تغییر وضعیت دیدگاه (تایید / رد / ثبت پاسخ مدیر)
 */
export async function moderateCommentAction(params: {
  commentId: string;
  status: CommentStatus;
  adminReply?: string;
}) {
  try {
    await requireWriteAccess(['ADMIN', 'EDITOR']);
    await connectDB();

    const updated = await Comment.findByIdAndUpdate(
      params.commentId,
      {
        status: params.status,
        ...(params.adminReply !== undefined && { adminReply: params.adminReply }),
      },
      { new: true }
    );

    if (!updated) {
      return { success: false, error: 'دیدگاه یافت نشد.' };
    }

    revalidatePath('/admin/comments');
    revalidatePath('/products');
    revalidatePath('/blog');

    return { success: true };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'خطا در بروزرسانی وضعیت دیدگاه' };
  }
}