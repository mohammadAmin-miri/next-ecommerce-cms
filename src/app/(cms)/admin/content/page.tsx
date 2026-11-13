import Link from 'next/link';
import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Post } from '@/models/Post';
import { Comment } from '@/models/Comment';
import { PostsManagerClient, SerializedPost } from '@/components/cms/PostsManagerClient';
import { FileText, MessageSquare, Globe } from 'lucide-react';

export const instant = false;

export default async function AdminContentHubPage() {
  await connection();
  await connectDB();

  const [rawPosts, pendingCommentsCount] = await Promise.all([
    Post.find({})
      .sort({ createdAt: -1 })
      .lean<{
        _id: Types.ObjectId;
        title: string;
        slug: string;
        status: 'DRAFT' | 'PUBLISHED';
        viewsCount: number;
        createdAt: Date;
      }[]>(),
    Comment.countDocuments({ status: 'PENDING' }),
  ]);

  const serializedPosts: SerializedPost[] = rawPosts.map((p) => ({
    _id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    status: p.status,
    viewsCount: p.viewsCount,
    createdAt: new Date(p.createdAt).toLocaleDateString('fa-IR'),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            مرکز مدیریت محتوا، وبلاگ و نظرات (CMS)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            مدیریت یکپارچه مقالات وبلاگ، صفحات محتوایی و بررسی دیدگاه‌های کاربران
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/comments"
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>مدیریت نظرات ({pendingCommentsCount} در انتظار تایید)</span>
          </Link>

          <Link
            href="/sitemap.xml"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>مشاهده Sitemap.xml</span>
          </Link>
        </div>
      </div>

      <PostsManagerClient initialPosts={serializedPosts} />
    </div>
  );
}