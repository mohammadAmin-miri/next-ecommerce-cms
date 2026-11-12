import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Comment, CommentStatus } from '@/models/Comment';
import {
  CommentsTableClient,
  SerializedComment,
} from '@/components/cms/CommentsTableClient';

export const instant = false;

interface LeanComment {
  _id: Types.ObjectId;
  targetType: 'PRODUCT' | 'POST';
  authorName: string;
  authorEmail: string;
  rating: number;
  content: string;
  adminReply?: string;
  status: CommentStatus;
  createdAt: Date;
}

export default async function AdminCommentsPage() {
  await connection();
  await connectDB();

  const rawComments = await Comment.find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .lean<LeanComment[]>();

  const serialized: SerializedComment[] = rawComments.map((c) => ({
    _id: c._id.toString(),
    targetType: c.targetType,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    rating: c.rating,
    content: c.content,
    adminReply: c.adminReply || '',
    status: c.status,
    createdAt: new Date(c.createdAt).toLocaleDateString('fa-IR'),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت دیدگاه‌ها و نظرات</h1>
        <p className="text-sm text-slate-400 mt-1">
          بررسی، تایید و پاسخ‌گویی به نظرات ثبت شده مشتریان برای محصولات و مقالات
        </p>
      </div>

      <CommentsTableClient initialComments={serialized} />
    </div>
  );
}