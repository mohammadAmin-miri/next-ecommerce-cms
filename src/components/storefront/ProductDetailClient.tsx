'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import {
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Truck,
} from 'lucide-react';

export interface SerializedVariant {
  sku: string;
  color?: string;
  size?: string;
  stock: number;
  priceDiff: number;
}

export interface SerializedStoreProduct {
  _id: string;
  title: string;
  slug: string;
  sku: string;
  description: string;
  basePrice: number;
  discountPrice?: number;
  images: string[];
  variants: SerializedVariant[];
  categoryNames: string[];
}

export function ProductDetailClient({
  product,
}: {
  product: SerializedStoreProduct;
}) {
  const addItem = useCartStore((state) => state.addItem);

  const [selectedImage, setSelectedImage] = useState(
    product.images[0] || ''
  );
  const [selectedVariant, setSelectedVariant] = useState<SerializedVariant>(
    product.variants[0] || {
      sku: product.sku,
      stock: 0,
      priceDiff: 0,
    }
  );
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  const effectiveBasePrice = product.discountPrice ?? product.basePrice;
  const finalUnitPrice = effectiveBasePrice + (selectedVariant?.priceDiff || 0);
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      productId: product._id,
      title: product.title,
      slug: product.slug,
      image: product.images[0] || '',
      unitPrice: finalUnitPrice,
      variantSku: selectedVariant.sku,
      color: selectedVariant.color,
      size: selectedVariant.size,
      quantity,
      maxStock: selectedVariant.stock,
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* ستون راست: گالری تصاویر */}
      <div className="space-y-4">
        <div className="aspect-square rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
          {selectedImage ? (
            <img
              src={selectedImage}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-slate-500 text-sm">بدون تصویر</span>
          )}
        </div>

        {product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                  selectedImage === img
                    ? 'border-blue-500'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ستون چپ: اطلاعات، انتخابگر متغیر و دکمه خرید */}
      <div className="space-y-6">
        <div>
          {product.categoryNames.length > 0 && (
            <div className="text-xs font-medium text-blue-400 mb-2">
              {product.categoryNames.join(' / ')}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {product.title}
          </h1>
          <div className="text-xs font-mono text-slate-400 mt-1">
            SKU: {selectedVariant?.sku || product.sku}
          </div>
        </div>

        {/* نمایش قیمت */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">
              قیمت نهایی برای تنوع انتخاب‌شده:
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {formatPrice(finalUnitPrice)}
              </span>
              {product.discountPrice && (
                <span className="text-sm text-slate-500 line-through font-mono">
                  {formatPrice(
                    product.basePrice + (selectedVariant?.priceDiff || 0)
                  )}
                </span>
              )}
            </div>
          </div>

          <div>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>ناموجود</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>{selectedVariant.stock} عدد در انبار</span>
              </span>
            )}
          </div>
        </div>

        {/* انتخاب متغیر رنگ / سایز */}
        {product.variants.length > 0 && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              انتخاب تنوع (رنگ / سایز):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {product.variants.map((v) => {
                const isSelected = selectedVariant?.sku === v.sku;
                const noStock = v.stock <= 0;

                return (
                  <button
                    key={v.sku}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(1);
                    }}
                    className={`p-3 rounded-xl border text-right transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    } ${noStock ? 'opacity-50' : ''}`}
                  >
                    <div className="text-xs">
                      <div className="font-semibold">
                        {[v.color, v.size].filter(Boolean).join(' - ') ||
                          v.sku}
                      </div>
                      {v.priceDiff !== 0 && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {v.priceDiff > 0 ? '+' : ''}
                          {formatPrice(v.priceDiff)}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400">
                      {noStock ? 'اتمام' : `${v.stock} عدد`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* انتخاب تعداد و دکمه افزودن به سبد خرید */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 sm:w-36">
            <button
              type="button"
              disabled={isOutOfStock || quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold cursor-pointer"
            >
              -
            </button>
            <span className="font-mono font-bold text-white">{quantity}</span>
            <button
              type="button"
              disabled={isOutOfStock || quantity >= selectedVariant.stock}
              onClick={() =>
                setQuantity((q) => Math.min(selectedVariant.stock, q + 1))
              }
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {isOutOfStock ? 'این تنوع ناموجود است' : 'افزودن به سبد خرید'}
            </span>
          </button>
        </div>

        {/* نوتیفیکیشن افزودن موفق و لینک تسویه‌حساب */}
        {addedToast && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>محصول به سبد خرید اضافه شد!</span>
            </div>
            <Link
              href="/checkout"
              className="inline-flex items-center gap-1 font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition"
            >
              <span>مشاهده سبد و تسویه‌حساب</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* توضیحات محصول */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <h2 className="text-sm font-bold text-white">توضیحات و مشخصات</h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* ویژگی‌های اطمینان خرید */}
        <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>تضمین اصالت و سلامت فیزیکی کالا</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>کسر آنی موجودی با تراکنش اتمیک</span>
          </div>
        </div>
      </div>
    </div>
  );
}   