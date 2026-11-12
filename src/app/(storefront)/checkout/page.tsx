'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import {
  validateCouponAction,
  createOrderWithTransaction,
} from '@/actions/order.actions';
import {
  Trash2,
  TicketPercent,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Shield,
} from 'lucide-react';

export default function CheckoutPage() {
  const {
    items,
    coupon,
    removeItem,
    updateQuantity,
    applyCoupon,
    clearCart,
    getSubtotal,
    getFinalAmount,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // استیت فرم آدرس مشتری
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // 🔴 راه حل قطعی: ترکیب useRef و useEffect
  const idempotencyKeyRef = useRef<string>('');

  useEffect(() => {
    // چون Date.now داخل useEffect است، Next.js خطای Prerender نمی‌گیرد.
    // چون از useRef استفاده کردیم، React خطای Cascading Render نمی‌گیرد.
    idempotencyKeyRef.current = `IDEM-${Date.now()}-${Math.floor(
      Math.random() * 100000
    )}`;
  }, []);

  const [orderResult, setOrderResult] = useState<{
    orderNumber: string;
    orderId: string;
  } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const shippingCost = items.length > 0 ? 45000 : 0;
  const subtotal = getSubtotal();
  const finalAmount = getFinalAmount(shippingCost);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    setCouponMsg(null);

    startTransition(async () => {
      const res = await validateCouponAction(couponInput, subtotal);
      if (!res.success) {
        applyCoupon(null);
        setCouponMsg({ type: 'error', text: res.error || 'کد نامعتبر است' });
      } else {
        applyCoupon({
          code: res.code!,
          discountAmount: res.discountAmount!,
        });
        setCouponMsg({
          type: 'success',
          text: `کد تخفیف اعمال شد (${formatPrice(res.discountAmount!)} کسر گردید).`,
        });
      }
    });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setCheckoutError(null);

    startTransition(async () => {
      const res = await createOrderWithTransaction({
        items: items.map((i) => ({
          productId: i.productId,
          variantSku: i.variantSku,
          quantity: i.quantity,
        })),
        shippingAddress: {
          recipientName,
          phone,
          city,
          fullAddress,
          postalCode,
        },
        shippingMethod: 'پست پیشتاز',
        shippingCost,
        couponCode: coupon?.code,
        // دریافت کلید تولید شده از رفرنس:
        idempotencyKey: idempotencyKeyRef.current || `IDEM-${Date.now()}`, 
      });

      if (!res.success) {
        setCheckoutError(res.error || 'خطا در ثبت سفارش');
        return;
      }

      clearCart();
      setOrderResult({
        orderNumber: res.orderNumber!,
        orderId: res.orderId!,
      });
    });
  };

// ... بقیه کدهای صفحه بدون تغییر ...

  // صفحه رسید موفق پس از ثبت سفارش
  if (orderResult) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            سفارش شما با موفقیت ثبت شد!
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            پرداخت آزمایشی (Mock Gateway) تایید شد و موجودی کالاها به‌صورت اتمیک
            از انبار کسر گردید.
          </p>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-emerald-400">
            شماره سفارش: {orderResult.orderNumber}
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/admin/orders"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              مشاهده این سفارش در پنل مدیریت (/admin/orders)
            </Link>
            <Link
              href="/admin/products"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              بررسی کسر موجودی در جدول محصولات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-lg text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
            <span>سبد خرید و تسویه‌حساب</span>
          </h1>
          <Link
            href="/admin/products"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <Shield className="w-4 h-4 text-blue-400" />
            <span>پنل مدیریت</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <p className="text-slate-400 text-sm">سبد خرید شما خالی است.</p>
            <Link
              href="/admin/products"
              className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium"
            >
              مشاهده لیست محصولات
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ستون راست: لیست آیتم‌های سبد و فرم آدرس */}
            <div className="lg:col-span-2 space-y-6">
              {/* لیست محصولات داخل سبد */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                  ۱. اقلام سبد خرید ({items.length})
                </h2>

                <div className="divide-y divide-slate-800">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantSku}`}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-cover bg-slate-800 border border-slate-700"
                        />
                        <div>
                          <Link
                            href={`/products/${item.slug}`}
                            className="font-semibold text-white hover:text-blue-400 text-sm"
                          >
                            {item.title}
                          </Link>
                          <div className="text-xs text-slate-400 mt-1">
                            تنوع: {item.color} {item.size} ({item.variantSku})
                          </div>
                          <div className="text-xs font-mono text-emerald-400 mt-1">
                            واحد: {formatPrice(item.unitPrice)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variantSku,
                                item.quantity - 1
                              )
                            }
                            className="w-6 h-6 rounded bg-slate-800 text-white text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs px-2">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variantSku,
                                item.quantity + 1
                              )
                            }
                            className="w-6 h-6 rounded bg-slate-800 text-white text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.productId, item.variantSku)
                          }
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* فرم اطلاعات گیرنده */}
              <form
                id="checkout-form"
                onSubmit={handlePlaceOrder}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
              >
                <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                  ۲. اطلاعات و آدرس تحویل گیرنده
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      نام و نام خانوادگی گیرنده *
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="نام گیرنده"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      شماره موبایل *
                    </label>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      شهر *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="تهران"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      کد پستی ۱۰ رقمی *
                    </label>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="1456789123"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    نشانی دقیق پستی *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="خیابان، کوچه، پلاک، واحد..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                  />
                </div>
              </form>
            </div>

            {/* ستون چپ: کد تخفیف و خلاصه فاکتور */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <TicketPercent className="w-4 h-4 text-purple-400" />
                  <span>کد تخفیف دارید؟</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    placeholder="OFF20"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
                  >
                    بررسی کد
                  </button>
                </div>

                {couponMsg && (
                  <p
                    className={`text-xs ${
                      couponMsg.type === 'success'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* صورت‌حساب نهایی */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                  خلاصه صورت‌حساب
                </h2>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>جمع کل کالاها:</span>
                    <span className="font-mono">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>هزینه ارسال (پست پیشتاز):</span>
                    <span className="font-mono">
                      {formatPrice(shippingCost)}
                    </span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-emerald-400">
                      <span>کد تخفیف ({coupon.code}):</span>
                      <span className="font-mono">
                        -{formatPrice(coupon.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 pt-3 flex justify-between text-sm font-bold text-white">
                    <span>مبلغ قابل پرداخت:</span>
                    <span className="font-mono text-emerald-400">
                      {formatPrice(finalAmount)}
                    </span>
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isPending}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>پرداخت آزمایشی و ثبت سفارش</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}