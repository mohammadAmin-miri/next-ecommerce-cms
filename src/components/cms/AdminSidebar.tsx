'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  TicketPercent,
  FileText,
  ShieldAlert,
  Settings,
  Store,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/actions/auth.actions';

const navItems = [
  { title: 'داشبورد و آمار', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'مدیریت محصولات', href: '/admin/products', icon: Package },
  { title: 'دسته‌بندی و برندها', href: '/admin/categories', icon: FolderTree },
  { title: 'سفارش‌ها و انبار', href: '/admin/orders', icon: ShoppingCart },
  { title: 'مشتریان و کاربران', href: '/admin/users', icon: Users },
  { title: 'تخفیف‌ها و کوپن', href: '/admin/coupons', icon: TicketPercent },
  { title: 'مدیریت محتوا و سئو', href: '/admin/content', icon: FileText },
  { title: 'گزارش فعالیت (Audit)', href: '/admin/logs', icon: ShieldAlert },
  { title: 'تنظیمات فروشگاه', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col justify-between min-h-screen">
      <div>
        {/* لوگو و عنوان پنل */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <span className="font-bold text-lg text-white tracking-tight">
            پنل مدیریت <span className="text-blue-500">CMS</span>
          </span>
        </div>

        {/* لینک‌های منو */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* فوتر سایدبار: مشاهده فروشگاه و خروج */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
        >
          <Store className="w-4 h-4 text-emerald-400" />
          <span>مشاهده ویترین فروشگاه</span>
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب کاربری</span>
          </button>
        </form>
      </div>
    </aside>
  );
}