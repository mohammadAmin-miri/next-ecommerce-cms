'use client';

import { useState, useTransition } from 'react';
import { createCategory, deleteCategory } from '@/actions/category.actions';
import {
  FolderPlus,
  Trash2,
  FolderTree,
  Loader2,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export interface SerializedCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentName?: string | null;
  isActive: boolean;
}

export function CategoryManagerClient({
  categories,
}: {
  categories: SerializedCategory[];
}) {
  const [name, setName] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await createCategory({
        name,
        parentCategory: parentCategory || undefined,
        description: description || undefined,
      });

      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error || 'خطا در ایجاد دسته‌بندی',
        });
        return;
      }

      setName('');
      setParentCategory('');
      setDescription('');
      setFeedback({
        type: 'success',
        message: 'دسته‌بندی جدید با موفقیت ایجاد شد.',
      });
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`آیا از حذف دسته‌بندی «${title}» مطمئن هستید؟`)) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteCategory(id);
      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error || 'خطا در حذف دسته‌بندی',
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'دسته‌بندی با موفقیت حذف شد.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ستون راست: فرم افزودن دسته‌بندی */}
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit"
        >
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-2">
            <FolderPlus className="w-4 h-4" />
            <span>افزودن دسته‌بندی جدید</span>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5">
              عنوان دسته‌بندی *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: کالای دیجیتال"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5">
              دسته‌بندی والد (اختیاری - برای زیرمجموعه)
            </label>
            <select
              value={parentCategory}
              onChange={(e) => setParentCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">— بدون والد (دسته‌بندی اصلی) —</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5">
              توضیحات کوتاه
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات برای سئو و صفحه دسته‌بندی..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FolderPlus className="w-4 h-4" />
            )}
            <span>ثبت دسته‌بندی</span>
          </button>
        </form>

        {/* ستون چپ: جدول دسته‌بندی‌های درختی */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2 text-sm font-semibold text-white">
            <FolderTree className="w-4 h-4 text-blue-400" />
            <span>ساختار درختی دسته‌بندی‌ها ({categories.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-xs">
                <tr>
                  <th className="px-5 py-3.5">نام دسته‌بندی</th>
                  <th className="px-5 py-3.5">آدرس (Slug)</th>
                  <th className="px-5 py-3.5">دسته‌بندی والد</th>
                  <th className="px-5 py-3.5 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-slate-400 text-xs"
                    >
                      هنوز دسته‌بندی ثبت نشده است. از فرم سمت راست اولین دسته‌بندی را بسازید.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr
                      key={cat._id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="px-5 py-3.5 font-medium text-white">
                        {cat.name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                        /{cat.slug}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {cat.parentName ? (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
                            زیرمجموعه: {cat.parentName}
                          </span>
                        ) : (
                          <span className="text-slate-500">دسته مادر (اصلی)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(cat._id, cat.name)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                          title="حذف دسته‌بندی"
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
      </div>
    </div>
  );
}