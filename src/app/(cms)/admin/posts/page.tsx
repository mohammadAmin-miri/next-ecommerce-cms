import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Post } from '@/models/Post';
import {
  PostsManagerClient,
  SerializedPost,
} from '@/components/cms/PostsManagerClient';

export const instant = false;

interface LeanPost {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  viewsCount: number;
  createdAt: Date;
}

export default async function AdminPostsPage() {
  await connection();
  await connectDB();

  const rawPosts = await Post.find({})
    .sort({ createdAt: -1 })
    .lean<LeanPost[]>();

  const serialized: SerializedPost[] = rawPosts.map((p) => ({
    _id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    status: p.status,
    viewsCount: p.viewsCount,
    createdAt: new Date(p.createdAt).toLocaleDateString('fa-IR'),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت وبلاگ و مقالات</h1>
        <p className="text-sm text-slate-400 mt-1">
          نگارش و انتشار مقالات آموزشی برای بهبود سئو و جذب ترافیک ارگانیک
        </p>
      </div>

      <PostsManagerClient initialPosts={serialized} />
    </div>
  );
}