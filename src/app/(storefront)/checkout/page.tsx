'use client';

import { useState, useTransition, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart.store';
import {
  placeCheckoutOrderAction,
  validateCouponCodeAction,
} from '@/actions/checkout.actions';
import { formatPrice } from '@/lib/utils';
import {
  MapPin,
  Truck,
  TicketPercent,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const mounted = useIsMounted();

  // فیلدهای آدرس گیرنده
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('تهران');
  const [fullAddress, setFullAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState('پست پیشتاز ');

  // وضعیت کد تخفیف
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    percent: number;
  } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isCheckingCoupon, startCouponTransition] = useTransition();

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-64 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse flex items-center justify-center text-slate-400 text-sm">
          در حال آماده‌سازی درگاه تسویه‌حساب...
        </div>
      </div>
    );
  }

  // 🔴 نکته کلیدی: رسید موفقیت فقط زمانی نمایش داده شود که سبد خرید خالی است!
  // اگر کاربر کالای جدیدی به سبد خرید اضافه کرده باشد (items.length > 0)، مستقیماً فرم خرید جدید باز می‌شود.
  if (completedOrderNumber && items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white">
            سفارش شما با موفقیت ثبت و پرداخت شد!
          </h1>
          <p className="text-sm text-slate-400">
            موجودی کالاها از انبار کسر گردید و سفارش شما در صف پردازش و ارسال قرار گرفت.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>شماره پیگیری سفارش:</span>
            <span className="font-mono text-base font-bold text-emerald-400">
              {completedOrderNumber}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>تحویل‌گیرنده:</span>
            <span className="text-white font-medium">{recipientName}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>روش ارسال:</span>
            <span className="text-slate-200">{shippingMethod}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => {
              setCompletedOrderNumber(null);
              router.push('/products');
            }}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition cursor-pointer"
          >
            خرید مجدد و بازگشت به فروشگاه
          </button>
          <Link
            href="/admin/orders"
            prefetch={false}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
          >
            مشاهده سفارش در پنل ادمین
          </Link>
        </div>
      </div>
    );
  }

  // اگر سبد خرید خالی است و سفارشی هم در این لحظه ثبت نشده
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <ShoppingBag className="w-12 h-12 text-slate-500 mx-auto" />
        <h1 className="text-xl font-bold text-white">
          هیچ کالایی برای تسویه‌حساب در سبد خرید نیست
        </h1>
        <Link
          href="/products"
          className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold"
        >
          مشاهده محصولات فروشگاه
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const totalItems = getTotalItems();
  const discountAmount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.percent) / 100)
    : 0;
  const freeShippingThreshold = 5000000;
  const shippingCost =
    subtotal >= freeShippingThreshold
      ? 0
      : shippingMethod === 'پیک موتوری ویژه (تهران)'
      ? 75000
      : 45000;
  const finalPayable = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyCoupon = () => {
    setCouponMsg(null);
    startCouponTransition(async () => {
      const res = await validateCouponCodeAction(couponInput);
      if (!res.success || !res.discountPercent || !res.code) {
        setAppliedCoupon(null);
        setCouponMsg({ type: 'err', text: res.error || 'کد تخفیف نامعتبر است.' });
        return;
      }
      setAppliedCoupon({ code: res.code, percent: res.discountPercent });
      setCouponMsg({
        type: 'ok',
        text: `کد تخفیف ${res.discountPercent} درصدی با موفقیت اعمال شد!`,
      });
    });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // تولید کلید یکتا به ازای هر بار ثبت سفارش جدید تا سفارش دوم با سفارش اول تداخل نکند
    const freshIdempotencyKey = `CHK-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    startTransition(async () => {
      const res = await placeCheckoutOrderAction({
        items: items.map((i) => ({
          productId: i.productId,
          variantSku: i.variantSku,
          title: i.title,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
        shippingAddress: {
          recipientName,
          phone,
          city,
          fullAddress,
          postalCode,
        },
        shippingMethod,
        couponCode: appliedCoupon?.code,
        idempotencyKey: freshIdempotencyKey,
      });

      if (!res.success) {
        setError(res.error || 'خطا در ثبت نهایی سفارش');
        return;
      }

      setAppliedCoupon(null);
      setCouponInput('');
      setCouponMsg(null);
      setCompletedOrderNumber(res.orderNumber || 'ORD-SUCCESS');
      clearCart();
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">تسویه‌حساب و ثبت نهایی سفارش</h1>
          <p className="text-xs text-slate-400 mt-1">
            اطلاعات آدرس گیرنده و شیوه ارسال مرسوله را تکمیل فرمایید
          </p>
        </div>

        <Link
          href="/cart"
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به سبد خرید</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ستون راست: اطلاعات آدرس و روش ارسال (۷ ستون) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              مشخصات و آدرس تحویل‌گیرنده
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  نام و نام خانوادگی گیرنده *
                </label>
                <input
                  type="text"
                  required
                  placeholder=" نام و نام خانوادگی گیرنده"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  شماره موبایل جهت هماهنگی *
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="09120000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">استان و شهر *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">کد پستی ۱۰ رقمی *</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="1415563111"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">نشانی دقیق پستی *</label>
              <textarea
                rows={3}
                required
                placeholder="خیابان، کوچه، پلاک، واحد..."
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Truck className="w-5 h-5 text-emerald-400" />
              شیوه ارسال مرسوله
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'پست پیشتاز ',
                  desc: 'تحویل ۲ تا ۴ روز کاری به سراسر کشور',
                },
                {
                  title: 'پیک موتوری ویژه (تهران)',
                  desc: 'ارسال فوری در همان روز کاری',
                },
              ].map((method) => (
                <label
                  key={method.title}
                  onClick={() => setShippingMethod(method.title)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    shippingMethod === method.title
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    checked={shippingMethod === method.title}
                    onChange={() => setShippingMethod(method.title)}
                    className="mt-1 accent-blue-500"
                  />
                  <div>
                    <div className="text-xs font-bold">{method.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{method.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ستون چپ: کد تخفیف و خلاصه فاکتور (۵ ستون) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              مرور اقلام و کد تخفیف
            </h2>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pl-1">
              {items.map((item) => (
                <div
                  key={item.variantSku}
                  className="flex items-center justify-between text-xs bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80"
                >
                  <div className="truncate max-w-50">
                    <span className="text-slate-200 font-medium">{item.title}</span>
                    <span className="text-slate-500 block text-[11px]">
                      {item.quantity} عدد × {formatPrice(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-bold text-slate-200">
                    {formatPrice(item.unitPrice * item.quantity)} تومان
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs text-slate-400 flex items-center gap-1.5">
                <TicketPercent className="w-4 h-4 text-amber-400" />
                کد تخفیف دارید؟
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="OOFF"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  disabled={isCheckingCoupon || !couponInput}
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-amber-300 transition cursor-pointer"
                >
                  {isCheckingCoupon ? 'بررسی...' : 'اعمال کد'}
                </button>
              </div>
              {couponMsg && (
                <p
                  className={`text-xs ${
                    couponMsg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {couponMsg.text}
                </p>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>مجموع کالاها ({totalItems} عدد)</span>
                <span>{formatPrice(subtotal)} تومان</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 text-xs font-bold">
                  <span>کسر کد تخفیف ({appliedCoupon?.code})</span>
                  <span>- {formatPrice(discountAmount)} تومان</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span>هزینه ارسال</span>
                {shippingCost === 0 ? (
                  <span className="text-emerald-400 font-bold text-xs">رایگان</span>
                ) : (
                  <span>{formatPrice(shippingCost)} تومان</span>
                )}
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                <span className="font-bold text-white">مبلغ نهایی قابل پرداخت</span>
                <div className="text-left">
                  <span className="text-xl font-extrabold text-emerald-400">
                    {formatPrice(finalPayable)}
                  </span>{' '}
                  <span className="text-xs text-slate-400">تومان</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
              <span>پرداخت آنلاین و ثبت نهایی سفارش</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}