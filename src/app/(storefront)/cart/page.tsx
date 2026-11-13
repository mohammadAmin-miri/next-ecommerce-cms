/* eslint-disable @next/next/no-img-element */
'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { formatPrice } from '@/lib/utils';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Truck,
  ShoppingCart,
} from 'lucide-react';

// تابع استاندارد React 19 برای تشخیص رندر در کلاینت بدون نیاز به useEffect و setState
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // مقدار در سمت مرورگر (Client)
    () => false  // مقدار در سمت سرور (SSR)
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } =
    useCartStore();

  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-64 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse flex items-center justify-center text-slate-400 text-sm">
          در حال بارگذاری سبد خرید...
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const totalItems = getTotalItems();
  const freeShippingThreshold = 5000000;
  const shippingCost = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : 45000;
  const finalPayable = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">سبد خرید شما خالی است!</h1>
          <p className="text-sm text-slate-400">
            می‌توانید برای مشاهده کالاهای موجود و تخفیف‌های ویژه به بخش کاتالوگ محصولات بروید.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>مشاهده کاتالوگ محصولات</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* هدر صفحه */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
            سبد خرید شما ({totalItems} کالا)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            کالاهای موجود در سبد خرید تا پیش از ثبت نهایی سفارش رزرو نمی‌شوند
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>خالی کردن کل سبد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* لیست اقلام سبد خرید (۸ ستون) */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.variantSku}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <Link
                  href={`/products/${item.slug}`}
                  className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="space-y-1.5">
                  <Link
                    href={`/products/${item.slug}`}
                    className="text-sm font-bold text-white hover:text-blue-400 transition line-clamp-1"
                  >
                    {item.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {item.color && (
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        رنگ: {item.color}
                      </span>
                    )}
                    {item.size && (
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        مدل/ظرفیت: {item.size}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-slate-500">
                      SKU: {item.variantSku}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 pt-1">
                    قیمت واحد:{' '}
                    <span className="text-slate-200 font-semibold">
                      {formatPrice(item.unitPrice)} تومان
                    </span>
                  </div>
                </div>
              </div>

              {/* کنترل تعداد، قیمت کل ردیف و حذف */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0">
                <div className="text-left">
                  <span className="text-base font-extrabold text-emerald-400">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>{' '}
                  <span className="text-[11px] text-slate-400">تومان</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 gap-3">
                    <button
                      type="button"
                      disabled={item.quantity >= item.maxStock}
                      onClick={() => updateQuantity(item.variantSku, item.quantity + 1)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="افزایش تعداد"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-xs font-bold text-white min-w-4 text-center">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.variantSku, item.quantity - 1)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="کاهش تعداد"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.variantSku)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                    title="حذف از سبد خرید"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* فاکتور و خلاصه سفارش (۴ ستون) */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              خلاصه صورت‌حساب
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>جمع کل کالاها ({totalItems} عدد)</span>
                <span className="font-semibold">{formatPrice(subtotal)} تومان</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>هزینه ارسال پستی</span>
                {shippingCost === 0 ? (
                  <span className="text-emerald-400 font-bold text-xs">رایگان</span>
                ) : (
                  <span>{formatPrice(shippingCost)} تومان</span>
                )}
              </div>

              <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                <span className="font-bold text-white">مبلغ قابل پرداخت</span>
                <div className="text-left">
                  <span className="text-xl font-extrabold text-emerald-400">
                    {formatPrice(finalPayable)}
                  </span>{' '}
                  <span className="text-xs text-slate-400">تومان</span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
            >
              <span>ادامه جهت تسویه‌حساب و ثبت سفارش</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>تضمین اصالت کالا و کسر آنی از موجودی انبار</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>ارسال رایگان برای سفارش‌های بالای ۵ میلیون تومان</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}