'use client';

import { useState, useTransition } from 'react';
import { createCouponAction, deleteCouponAction } from '@/actions/admin-extra.actions';
import { TicketPercent, Plus, Trash2, Loader2 } from 'lucide-react';

export interface SerializedCoupon {
  _id: string;
  code: string;
  discountPercent: number;
  maxUsage: number;
  usedCount: number;
  expiresAt: string;
}

export function CouponsManagerClient({ initialCoupons }: { initialCoupons: SerializedCoupon[] }) {
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [maxUsage, setMaxUsage] = useState(50);
  const [daysValid, setDaysValid] = useState(14);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createCouponAction({ code, discountPercent, maxUsage, daysValid });
      if (!res.success) {
        setError(res.error || 'خطا در ساخت کوپن');
        return;
      }
      setCode('');
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteCouponAction(id);
      if (!res.success) setError(res.error || 'خطا در حذف کوپن');
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form
        onSubmit={handleCreate}
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 h-fit"
      >
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          تعریف کد تخفیف جدید
        </h2>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs text-slate-400 mb-1">کد تخفیف (لاتین)</label>
          <input
            type="text"
            required
            dir="ltr"
            placeholder="NOROUZ1405"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">درصد تخفیف (۱ تا ۱۰۰)</label>
          <input
            type="number"
            min={1}
            max={100}
            required
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">سقف دفعات مجاز استفاده</label>
          <input
            type="number"
            min={1}
            required
            value={maxUsage}
            onChange={(e) => setMaxUsage(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">مدت اعتبار (روز)</label>
          <input
            type="number"
            min={1}
            required
            value={daysValid}
            onChange={(e) => setDaysValid(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          ثبت و فعال‌سازی کوپن
        </button>
      </form>

      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">کد تخفیف</th>
              <th className="p-4">میزان تخفیف</th>
              <th className="p-4">تعداد استفاده</th>
              <th className="p-4">انقضا</th>
              <th className="p-4 text-left">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {initialCoupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  هنوز هیچ کد تخفیفی ثبت نشده است.
                </td>
              </tr>
            ) : (
              initialCoupons.map((c) => (
                <tr key={c._id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-mono font-bold text-amber-400 flex items-center gap-2">
                    <TicketPercent className="w-4 h-4" />
                    {c.code}
                  </td>
                  <td className="p-4 text-emerald-400 font-bold">{c.discountPercent}%</td>
                  <td className="p-4 text-slate-300">
                    {c.usedCount} از {c.maxUsage}
                  </td>
                  <td className="p-4 text-xs text-slate-400">{c.expiresAt}</td>
                  <td className="p-4 text-left">
                    <button
                      onClick={() => handleDelete(c._id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}