import { auth } from '@/lib/auth';
import { requireWriteAccess, AuthGuardError } from '@/lib/auth-guard';
import { ShieldCheck, Database, CheckCircle2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';
export const instant = false;
// متغیر موقت در حافظه سرور برای نمایش نتیجه تست گارد در صفحه
let lastTestMessage: { type: 'success' | 'error'; text: string } | null = null;

async function testWriteGuardAction() {
  'use server';
  try {
    const user = await requireWriteAccess(['ADMIN']);
    lastTestMessage = {
      type: 'success',
      text: `✅ عملیات مجاز بود! شما با نقش (${user.role}) مجوز کامل تغییر و حذف اطلاعات در دیتابیس را دارید.`,
    };
  } catch (error) {
    if (error instanceof AuthGuardError) {
      lastTestMessage = {
        type: 'error',
        text: `⛔ مسدود شد (${error.code}): ${error.message}`,
      };
    } else {
      lastTestMessage = { type: 'error', text: 'خطای ناشناخته' };
    }
  }
  revalidatePath('/admin/dashboard');
}

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">داشبورد مدیریت</h1>
        <p className="text-sm text-slate-400 mt-1">
          محیط تست فاز ۱ (بررسی نشست، نقش‌ها و گارد امنیتی DEMO_ADMIN)
        </p>
      </div>

      {/* کارت اطلاعات نشست فعلی */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 text-blue-400 font-semibold">
          <ShieldCheck className="w-5 h-5" />
          <span>اطلاعات نشست فعال شما (خوانده شده از کوکی JWT در سرور)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-xs mb-1">نام کاربر:</span>
            <span className="font-bold text-white">{session?.user?.name}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-xs mb-1">ایمیل:</span>
            <span className="font-mono text-white">{session?.user?.email}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-xs mb-1">نقش (Role):</span>
            <span className="font-mono font-bold text-emerald-400">
              {session?.user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* باکس تست عملی تابع requireWriteAccess */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 text-purple-400 font-semibold">
          <Database className="w-5 h-5" />
          <span>آزمایشگاه تست گارد نوشتن در دیتابیس (requireWriteAccess)</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          روی دکمه زیر کلیک کنید تا یک درخواست تغییر دیتابیس شبیه‌سازی شود. اگر با اکانت{' '}
          <code className="text-emerald-400">ADMIN</code> وارد شده باشید عملیات موفق می‌شود، اما اگر با{' '}
          <code className="text-amber-400">DEMO_ADMIN</code> وارد شده باشید، گارد سرور جلوی تغییر را می‌گیرد.
        </p>

        <form action={testWriteGuardAction}>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition cursor-pointer"
          >
            شبیه‌سازی ذخیره/حذف در دیتابیس (تست گارد سرور)
          </button>
        </form>

        {lastTestMessage && (
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed flex items-center gap-2 ${
              lastTestMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{lastTestMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}