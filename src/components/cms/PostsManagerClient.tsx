'use client';

import { useState, useTransition } from 'react';
import { createPostAction, deletePostAction } from '@/actions/cms.actions';
import { Plus, Trash2, FileText, Loader2 } from 'lucide-react';

export interface SerializedPost {
  _id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  viewsCount: number;
  createdAt: string;
}

export function PostsManagerClient({
  initialPosts,
}: {
  initialPosts: SerializedPost[];
}) {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createPostAction({
        title,
        excerpt,
        content,
        status,
      });

      if (!res.success) {
        setError(res.error || 'خطا در ثبت مقاله');
        return;
      }

      setTitle('');
      setExcerpt('');
      setContent('');
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deletePostAction(id);
      if (!res.success) {
        setError(res.error || 'خطا در حذف مقاله');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* فرم انتشار مقاله جدید */}
      <form
        onSubmit={handleCreate}
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 h-fit"
      >
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          انتشار مقاله جدید
        </h2>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs text-slate-400 mb-1">عنوان مقاله</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            placeholder="مثلاً: راهنمای خرید بهترین..."
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">خلاصه مقاله (Excerpt)</label>
          <textarea
            rows={2}
            required
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            placeholder="توضیح کوتاه برای کارت مقاله و سئو..."
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">متن کامل مقاله</label>
          <textarea
            rows={5}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
            placeholder="محتوای کامل مقاله..."
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">وضعیت انتشار</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="PUBLISHED">انتشار عمومی (Published)</option>
            <option value="DRAFT">پیش‌نویس (Draft)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          ذخیره و انتشار مقاله
        </button>
      </form>

      {/* لیست مقالات ثبت شده */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">عنوان مقاله</th>
              <th className="p-4">وضعیت</th>
              <th className="p-4">بازدید</th>
              <th className="p-4">تاریخ</th>
              <th className="p-4 text-left">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {initialPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  هنوز مقاله‌ای در وبلاگ ثبت نشده است.
                </td>
              </tr>
            ) : (
              initialPosts.map((post) => (
                <tr key={post._id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-medium text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {post.title}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        post.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {post.status === 'PUBLISHED' ? 'منتشر شده' : 'پیش‌نویس'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{post.viewsCount}</td>
                  <td className="p-4 text-slate-400 text-xs">{post.createdAt}</td>
                  <td className="p-4 text-left">
                    <button
                      onClick={() => handleDelete(post._id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}