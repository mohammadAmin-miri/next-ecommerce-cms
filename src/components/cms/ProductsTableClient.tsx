'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { deleteProduct, bulkUpdateProducts } from '@/actions/product.actions';
import {
  AlertTriangle,
  Trash2,
  Edit,
  CheckSquare,
  Download,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export interface SerializedProduct {
  _id: string;
  title: string;
  slug: string;
  sku: string;
  basePrice: number;
  discountPrice?: number;
  totalStock: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  images: string[];
  categoryNames: string[];
}

export function ProductsTableClient({
  products,
}: {
  products: SerializedProduct[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p._id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSingleDelete = (id: string, title: string) => {
    if (!window.confirm(`آیا از حذف محصول «${title}» مطمئن هستید؟`)) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'خطا در حذف' });
      } else {
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        setFeedback({ type: 'success', message: 'محصول با موفقیت حذف شد.' });
      }
    });
  };

  const handleBulkAction = (action: 'DELETE' | 'PUBLISH' | 'DRAFT' | 'ARCHIVE') => {
    if (
      action === 'DELETE' &&
      !window.confirm(`آیا از حذف ${selectedIds.length} محصول انتخاب‌شده مطمئن هستید؟`)
    ) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await bulkUpdateProducts(selectedIds, action);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'خطا در عملیات گروهی' });
      } else {
        setSelectedIds([]);
        setFeedback({
          type: 'success',
          message: 'عملیات گروهی با موفقیت روی محصولات اعمال شد.',
        });
      }
    });
  };

  // خروجی آنی CSV از محصولات صفحه فعلی
  const handleExportCSV = () => {
    const headers = ['Title,SKU,BasePrice,TotalStock,Status'];
    const rows = products.map(
      (p) => `"${p.title}",${p.sku},${p.basePrice},${p.totalStock},${p.status}`
    );
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `products-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* نمایش پیام نتیجه یا هشدار DEMO_ADMIN */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* نوار عملیات گروهی (فقط در صورت انتخاب حداقل یک محصول ظاهر می‌شود) */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-blue-300 font-medium">
            <CheckSquare className="w-4 h-4" />
            <span>{selectedIds.length} محصول انتخاب شده است</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkAction('PUBLISH')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 transition cursor-pointer"
            >
              تغییر به منتشر شده
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkAction('DRAFT')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              تغییر به پیش‌نویس
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkAction('DELETE')}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 transition cursor-pointer flex items-center gap-1"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>حذف گروهی</span>
            </button>
          </div>
        </div>
      )}

      {/* جدول اصلی */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>خروجی اکسل / CSV از این صفحه</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-xs uppercase">
              <tr>
                <th className="px-5 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      products.length > 0 && selectedIds.length === products.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 bg-slate-900 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4">محصول</th>
                <th className="px-4 py-4">کد (SKU)</th>
                <th className="px-4 py-4">دسته‌بندی</th>
                <th className="px-4 py-4">قیمت</th>
                <th className="px-4 py-4">موجودی کل</th>
                <th className="px-4 py-4">وضعیت</th>
                <th className="px-4 py-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    هیچ محصولی مطابق با فیلتر شما یافت نشد.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product._id)}
                        onChange={() => toggleSelectOne(product._id)}
                        className="rounded border-slate-700 bg-slate-900 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4 font-medium text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 shrink-0 overflow-hidden flex items-center justify-center text-xs text-slate-500">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          'تصویر'
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {product.title}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          /{product.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-300">
                      {product.sku}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-300">
                      {product.categoryNames.length > 0
                        ? product.categoryNames.join('، ')
                        : '—'}
                    </td>
                    <td className="px-4 py-4 font-mono text-slate-200">
                      {formatPrice(product.discountPrice ?? product.basePrice)}
                    </td>
                    <td className="px-4 py-4">
                      {product.totalStock <= 5 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{product.totalStock} عدد</span>
                        </span>
                      ) : (
                        <span className="font-mono text-slate-300">
                          {product.totalStock} عدد
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${
                          product.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : product.status === 'ARCHIVED'
                            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {product.status === 'PUBLISHED'
                          ? 'منتشر شده'
                          : product.status === 'ARCHIVED'
                          ? 'آرشیو'
                          : 'پیش‌نویس'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/products/${product._id}/edit`}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                          title="ویرایش محصول"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleSingleDelete(product._id, product.title)
                          }
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                          title="حذف محصول"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}