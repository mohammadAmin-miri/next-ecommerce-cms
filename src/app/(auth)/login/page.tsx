'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ShieldCheck, Eye, Terminal, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { loginAction, quickLoginAction } from '@/actions/auth.actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDev = process.env.NODE_ENV === 'development';

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await loginAction({ email, password });
      if (res && !res.success) {
        setError(res.error || 'خطا در ورود به سیستم');
      }
    });
  };

  const handleQuickLogin = (mode: 'DEMO' | 'LOCAL_ADMIN') => {
    setError(null);
    startTransition(async () => {
      const res = await quickLoginAction(mode);
      if (res && !res.success) {
        setError(res.error || 'اکانت مورد نظر یافت نشد. آیا دستور npm run seed را اجرا کرده‌اید؟');
      }
    });
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {/* هدر فرم */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">ورود به پنل و فروشگاه</h1>
          <p className="text-sm text-slate-400 mt-1">
            سیستم مدیریت محتوا و فروشگاه سازمانی Next.js
          </p>
        </div>

        {/* نمایش پیام خطا */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* فرم ورود استاندارد */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              آدرس ایمیل
            </label>
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@store.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              رمز عبور
            </label>
            <input
              type="password"
              required
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            <span>ورود به حساب کاربری</span>
          </button>
        </form>

        {/* جداکننده ورود سریع */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900 px-3 text-slate-400">
              دسترسی سریع (بدون نیاز به تایپ رمز)
            </span>
          </div>
        </div>

        {/* دکمه‌های ورود با یک کلیک */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleQuickLogin('DEMO')}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>ورود سریع به پنل مدیریت (نسخه دمو ویژه کارفرما)</span>
          </button>

          {isDev && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleQuickLogin('LOCAL_ADMIN')}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>ورود سریع سوپر ادمین (فقط محیط Localhost)</span>
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          حساب کاربری ندارید؟{' '}
          <Link href="/register" className="text-blue-400 hover:underline">
            ثبت‌نام مشتری جدید
          </Link>
        </p>
      </div>
    </div>
  );
}