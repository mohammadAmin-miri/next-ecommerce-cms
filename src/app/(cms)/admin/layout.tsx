import { redirect } from 'next/navigation';
import { Eye, ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/auth';
import { AdminSidebar } from '@/components/cms/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const isDemoAdmin = session.user.role === 'DEMO_ADMIN';

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* منوی کناری */}
      <AdminSidebar />

      {/* بخش محتوای اصلی */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* بنر هشدار ویژه کارفرما در حالت DEMO_ADMIN */}
        {isDemoAdmin && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>حالت پیش‌نمایش (DEMO_ADMIN):</strong> شما امکان مشاهده تمام صفحات، نمودارها و فرم‌ها را دارید، اما عملیات افزودن، ویرایش و حذف در دیتابیس غیرفعال است.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 font-mono text-[11px]">
              READ-ONLY MODE
            </span>
          </div>
        )}

        {/* هدر بالای پنل */}
        <header className="h-16 bg-slate-900/60 border-b border-slate-800 px-8 flex items-center justify-between">
          <div className="text-sm text-slate-300">
            خوش آمدید، <span className="font-semibold text-white">{session.user.name}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>نقش فعال:</span>
            <span className="font-mono font-bold text-blue-400">
              {session.user.role}
            </span>
          </div>
        </header>

        {/* محتوای صفحات داخلی ادمین */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}