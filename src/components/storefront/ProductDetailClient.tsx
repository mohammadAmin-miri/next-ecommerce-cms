'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart.store';
import { formatPrice } from '@/lib/utils';
import {
  ShoppingCart,
  Check,
  PackageCheck,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export interface SerializedVariant {
  sku: string;
  color: string;
  size: string;
  priceDiff: number;
  stock: number;
}

export interface SerializedProductDetail {
  _id: string;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  discountPrice?: number;
  totalStock: number;
  images: { url: string; alt: string; isPrimary: boolean }[];
  variants: SerializedVariant[];
  categories: { _id: string; name: string; slug: string }[];
}

export function ProductDetailClient({
  product,
}: {
  product: SerializedProductDetail;
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [selectedImage, setSelectedImage] = useState<string>(
    product.images[0]?.url ||
      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80'
  );

  // انتخاب اولین متغیر موجود به عنوان پیش‌فرض
  const firstAvailableVariant =
    product.variants.find((v) => v.stock > 0) || product.variants[0];

  const [selectedVariant, setSelectedVariant] = useState<SerializedVariant | undefined>(
    firstAvailableVariant
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  const effectiveBasePrice = product.discountPrice ?? product.basePrice;
  const finalUnitPrice =
    effectiveBasePrice + (selectedVariant?.priceDiff || 0);
  const currentStock = selectedVariant
    ? selectedVariant.stock
    : product.totalStock;

  const handleAddToCart = () => {
    if (!selectedVariant || currentStock <= 0) return;

    addItem({
      productId: product._id,
      title: product.title,
      slug: product.slug,
      image: selectedImage,
      variantSku: selectedVariant.sku,
      color: selectedVariant.color,
      size: selectedVariant.size,
      unitPrice: finalUnitPrice,
      quantity,
      maxStock: currentStock,
    });

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8">
      {/* گالری تصاویر محصول (۵ ستون) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="aspect-square rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
          <img
            src={selectedImage}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>

        {product.images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img.url)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                  selectedImage === img.url
                    ? 'border-blue-500'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* جزئیات و انتخاب متغیرها (۷ ستون) */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {product.categories.map((cat) => (
              <span
                key={cat._id}
                className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium"
              >
                {cat.name}
              </span>
            ))}
            {selectedVariant && (
              <span className="text-xs text-slate-500 font-mono mr-auto">
                SKU: {selectedVariant.sku}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug">
            {product.title}
          </h1>

          {/* انتخابگر متغیرها (رنگ و گارانتی/حافظه) */}
          {product.variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                انتخاب مدل / رنگ و ظرفیت:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.sku === v.sku;
                  const isOut = v.stock <= 0;
                  return (
                    <button
                      key={v.sku}
                      type="button"
                      disabled={isOut}
                      onClick={() => {
                        setSelectedVariant(v);
                        setQuantity(1);
                      }}
                      className={`p-3.5 rounded-xl border text-right transition flex items-center justify-between cursor-pointer ${
                        isOut
                          ? 'bg-slate-950/40 border-slate-800/50 opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">
                          {v.color} {v.size ? `— ${v.size}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {v.priceDiff > 0
                            ? `+ ${formatPrice(v.priceDiff)} تومان`
                            : 'قیمت پایه'}
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                        {isOut ? 'ناموجود' : `${v.stock} عدد`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* باکس قیمت و دکمه خرید */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {currentStock > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <PackageCheck className="w-4 h-4" />
                  <span>موجود در انبار ({currentStock} عدد آماده ارسال)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  <span>این متغیر در حال حاضر ناموجود است</span>
                </div>
              )}
            </div>

            <div className="text-left">
              {product.discountPrice &&
                product.discountPrice < product.basePrice && (
                  <div className="text-xs text-slate-500 line-through">
                    {formatPrice(
                      product.basePrice + (selectedVariant?.priceDiff || 0)
                    )}{' '}
                    تومان
                  </div>
                )}
              <div className="text-2xl font-extrabold text-emerald-400">
                {formatPrice(finalUnitPrice)}{' '}
                <span className="text-xs font-normal text-slate-400">تومان</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            {/* انتخابگر تعداد */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 sm:w-32">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                disabled={quantity >= currentStock}
                className="w-7 h-7 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              >
                +
              </button>
              <span className="text-sm font-bold text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              >
                -
              </button>
            </div>

            {/* دکمه افزودن به سبد خرید */}
            <button
              type="button"
              disabled={currentStock <= 0}
              onClick={handleAddToCart}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                addedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>به سبد خرید اضافه شد!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>افزودن به سبد خرید</span>
                </>
              )}
            </button>

            {addedSuccess && (
              <button
                type="button"
                onClick={() => router.push('/cart')}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition cursor-pointer"
              >
                مشاهده سبد خرید
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}