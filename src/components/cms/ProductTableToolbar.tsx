'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, X, Loader2 } from 'lucide-react';

export function ProductTableToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialQuery = searchParams.get('q') || '';
  const currentStatus = searchParams.get('status') || 'ALL';

  const [searchTerm, setSearchTerm] = useState(initialQuery);

  // اعمال Debounce ۳۰۰ میلی‌ثانیه‌ای روی ورودی جستجو
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm === initialQuery) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) {
        params.set('q', searchTerm.trim());
      } else {
        params.delete('q');
      }
      params.set('page', '1'); // بازگشت به صفحه اول پس از هر جستجو

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, initialQuery, pathname, router, searchParams]);

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newStatus === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', newStatus);
    }
    params.set('page', '1');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
      {/* باکس جستجوی Debounce شده */}
      <div className="w-full md:w-96 relative">
        {isPending ? (
          <Loader2 className="absolute right-3.5 top-3 w-4 h-4 text-blue-400 animate-spin" />
        ) : (
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
        )}

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="جستجوی آنی عنوان یا کد محصول (SKU)..."
          className="w-full pr-10 pl-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500 transition"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* دکمه‌های فیلتر وضعیت انتشار */}
      <div className="w-full md:w-auto flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs text-slate-400">وضعیت انتشار:</span>
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'ALL', label: 'همه' },
            { id: 'PUBLISHED', label: 'منتشر شده' },
            { id: 'DRAFT', label: 'پیش‌نویس' },
            { id: 'ARCHIVED', label: 'آرشیو' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleStatusChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentStatus === tab.id
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}