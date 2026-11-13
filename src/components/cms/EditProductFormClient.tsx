'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProductAction } from '@/actions/admin-extra.actions';
import { Save, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export interface EditableProductData {
  _id: string;
  title: string;
  slug: string;
  basePrice: number;
  discountPrice?: number;
  totalStock: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
  description: string;
}

export function EditProductFormClient({ product }: { product: EditableProductData }) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title);
  const [slug, setSlug] = useState(product.slug);
  const [basePrice, setBasePrice] = useState(product.basePrice);
  const [discountPrice, setDiscountPrice] = useState(product.discountPrice || 0);
  const [totalStock, setTotalStock] = useState(product.totalStock);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(product.status);
  const [isFeatured, setIsFeatured] = useState(product.isFeatured);
  const [description, setDescription] = useState(product.description);

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await updateProductAction(product._id, {
        title,
        slug,
        basePrice,
        discountPrice: discountPrice > 0 ? discountPrice : undefined,
        totalStock,
        status,
        isFeatured,
        description,
      });

      if (!res.success) {
        setMessage({ type: 'error', text: res.error || 'خطا در ویرایش محصول' });
        return;
      }

      setMessage({ type: 'success', text: 'تغییرات محصول با موفقیت ذخیره شد.' });
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl text-sm border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">عنوان محصول</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">نامک (Slug)</label>
          <input
            type="text"
            required
            dir="ltr"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">قیمت پایه (تومان)</label>
          <input
            type="number"
            required
            value={basePrice}
            onChange={(e) => setBasePrice(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">قیمت با تخفیف (اختیاری - ۰ یعنی بدون تخفیف)</label>
          <input
            type="number"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">موجودی کل انبار</label>
          <input
            type="number"
            required
            value={totalStock}
            onChange={(e) => setTotalStock(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">وضعیت انتشار</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          >
            <option value="PUBLISHED">منتشر شده (PUBLISHED)</option>
            <option value="DRAFT">پیش‌نویس (DRAFT)</option>
            <option value="ARCHIVED">آرشیو شده (ARCHIVED)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">توضیحات محصول (HTML / متن)</label>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="w-4 h-4 rounded accent-blue-600"
        />
        <span>نمایش در بخش محصولات ویژه صفحه اصلی</span>
      </label>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <Link
          href="/admin/products"
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت به لیست محصولات
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          ذخیره تغییرات محصول
        </button>
      </div>
    </form>
  );
}