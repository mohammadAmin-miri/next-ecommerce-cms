'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/actions/product.actions';
import { VariantFormValues } from '@/lib/validations/product.schema';
import {
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  Layers,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface CategoryOption {
  _id: string;
  name: string;
}

export function ProductFormClient({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // استیت فیلدهای پایه
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [discountPrice, setDiscountPrice] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('PUBLISHED');
  const [isFeatured, setIsFeatured] = useState(false);

  // استیت گالری تصاویر (لیست URLها)
  const [imageInput, setImageInput] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
  ]);

  // استیت متغیرها (Variants: رنگ، سایز، موجودی، اختلاف قیمت)
  const [variants, setVariants] = useState<VariantFormValues[]>([
    { sku: 'VAR-01', color: 'مشکی', size: 'L', stock: 10, priceDiff: 0 },
  ]);

  // استیت سئو
  const [seoMetaTitle, setSeoMetaTitle] = useState('');
  const [seoMetaDescription, setSeoMetaDescription] = useState('');

  // محاسبه لحظه‌ای موجودی کل از جمع متغیرها
  const totalCalculatedStock = variants.reduce(
    (sum, v) => sum + (Number(v.stock) || 0),
    0
  );

  const handleAddImage = () => {
    if (!imageInput.trim()) return;
    setImages((prev) => [...prev, imageInput.trim()]);
    setImageInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: `${sku || 'PRD'}-V${prev.length + 1}`,
        color: '',
        size: '',
        stock: 5,
        priceDiff: 0,
      },
    ]);
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantFormValues,
    value: string | number
  ) => {
    setVariants((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createProduct({
        title,
        sku,
        description,
        basePrice: Number(basePrice),
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        categories: selectedCategories,
        images,
        variants: variants.map((v) => ({
          ...v,
          stock: Number(v.stock),
          priceDiff: Number(v.priceDiff),
        })),
        status,
        isFeatured,
        seoMetaTitle: seoMetaTitle || undefined,
        seoMetaDescription: seoMetaDescription || undefined,
      });

      if (!res.success) {
        setError(res.error || 'خطا در ثبت محصول');
        return;
      }

      router.push('/admin/products');
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ستون اصلی (۲ سوم عرض): مشخصات، تصاویر و متغیرها */}
        <div className="lg:col-span-2 space-y-6">
          {/* ۱. اطلاعات پایه */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              ۱. اطلاعات پایه محصول
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  عنوان محصول *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: ساعت هوشمند اپل واچ سری ۹"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  کد یکتای انبار (SKU) *
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="AW-S9-001"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                توضیحات کامل محصول (پشتیبانی از HTML / متن غنی) *
              </label>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مشخصات فنی، ویژگی‌ها و توضیحات کامل محصول را بنویسید..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* ۲. مدیریت گالری تصاویر */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-slate-800 pb-3">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <h2>۲. تصاویر و گالری محصول</h2>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                dir="ltr"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
              >
                افزودن لینک تصویر
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-square"
                >
                  <img
                    src={imgUrl}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-red-600 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ۳. متغیرها و موجودی انبار (Variants) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <Layers className="w-4 h-4 text-purple-400" />
                <h2>۳. تنوع‌ها (رنگ / سایز) و موجودی انبار</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                مجموع موجودی کل: {totalCalculatedStock} عدد
              </span>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end bg-slate-950 p-3.5 rounded-xl border border-slate-800"
                >
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      کد SKU تنوع
                    </label>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      value={v.sku}
                      onChange={(e) =>
                        handleVariantChange(idx, 'sku', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      رنگ
                    </label>
                    <input
                      type="text"
                      value={v.color || ''}
                      onChange={(e) =>
                        handleVariantChange(idx, 'color', e.target.value)
                      }
                      placeholder="مشکی"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      سایز / گارانتی
                    </label>
                    <input
                      type="text"
                      value={v.size || ''}
                      onChange={(e) =>
                        handleVariantChange(idx, 'size', e.target.value)
                      }
                      placeholder="XL"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      موجودی انبار
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={v.stock}
                      onChange={(e) =>
                        handleVariantChange(idx, 'stock', Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      اختلاف قیمت (تومان)
                    </label>
                    <input
                      type="number"
                      value={v.priceDiff}
                      onChange={(e) =>
                        handleVariantChange(
                          idx,
                          'priceDiff',
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={variants.length === 1}
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddVariant}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن ردیف تنوع جدید</span>
            </button>
          </div>
        </div>

        {/* ستون کناری (۱ سوم عرض): وضعیت، قیمت، دسته‌بندی و سئو */}
        <div className="space-y-6">
          {/* ۴. وضعیت انتشار و دکمه ذخیره */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              ۴. انتشار و قیمت‌گذاری
            </h2>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                وضعیت انتشار
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              >
                <option value="PUBLISHED">منتشر شده در فروشگاه</option>
                <option value="DRAFT">پیش‌نویس (مخفی)</option>
                <option value="ARCHIVED">آرشیو شده</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                قیمت پایه (تومان) *
              </label>
              <input
                type="number"
                min={0}
                required
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                قیمت با تخفیف (اختیاری)
              </label>
              <input
                type="number"
                min={0}
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="در صورت عدم تخفیف خالی بگذارید"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950"
              />
              <span>نمایش در بخش محصولات ویژه صفحه اصلی</span>
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>ذخیره و انتشار محصول</span>
            </button>
          </div>

          {/* ۵. انتخاب دسته‌بندی */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              ۵. دسته‌بندی محصول *
            </h2>

            {categories.length === 0 ? (
              <p className="text-xs text-amber-400">
                هیچ دسته‌بندی ثبت نشده است. ابتدا از منوی «دسته‌بندی و برندها» یک دسته بسازید.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <label
                    key={cat._id}
                    className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-white"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat._id)}
                      onChange={() => toggleCategory(cat._id)}
                      className="rounded border-slate-700 bg-slate-950"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ۶. تنظیمات SEO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-white border-b border-slate-800 pb-3">
              <Search className="w-4 h-4 text-emerald-400" />
              <h2>۶. تنظیمات SEO اختصاصی</h2>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                عنوان متا (Meta Title)
              </label>
              <input
                type="text"
                value={seoMetaTitle}
                onChange={(e) => setSeoMetaTitle(e.target.value)}
                placeholder="پیش‌فرض: همان عنوان محصول"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                توضیحات متا (Meta Description)
              </label>
              <textarea
                rows={3}
                value={seoMetaDescription}
                onChange={(e) => setSeoMetaDescription(e.target.value)}
                placeholder="توضیحات ۱۵۰ کاراکتری برای نمایش در نتایج گوگل..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}