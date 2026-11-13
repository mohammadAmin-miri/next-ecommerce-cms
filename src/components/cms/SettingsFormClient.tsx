'use client';

import { useState, useTransition } from 'react';
import { saveSettingsAction } from '@/actions/admin-extra.actions';
import { Save, Loader2 } from 'lucide-react';

export interface StoreSettingsData {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  shippingCost: number;
  freeShippingThreshold: number;
  taxPercent: number;
  maintenanceMode: boolean;
}

export function SettingsFormClient({ initial }: { initial: StoreSettingsData }) {
  const [form, setForm] = useState<StoreSettingsData>(initial);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await saveSettingsAction(form);
      if (!res.success) {
        setFeedback({ type: 'err', text: res.error || 'خطا در ذخیره تنظیمات' });
        return;
      }
      setFeedback({ type: 'ok', text: 'تنظیمات کل فروشگاه با موفقیت بروزرسانی شد.' });
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-3xl"
    >
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm border ${
            feedback.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">نام تجاری فروشگاه</label>
          <input
            type="text"
            required
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">شماره تماس پشتیبانی</label>
          <input
            type="text"
            dir="ltr"
            value={form.supportPhone}
            onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">ایمیل رسمی فروشگاه</label>
          <input
            type="email"
            dir="ltr"
            value={form.supportEmail}
            onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">هزینه پایه ارسال پستی (تومان)</label>
          <input
            type="number"
            value={form.shippingCost}
            onChange={(e) => setForm({ ...form, shippingCost: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">سقف خرید برای ارسال رایگان (تومان)</label>
          <input
            type="number"
            value={form.freeShippingThreshold}
            onChange={(e) =>
              setForm({ ...form, freeShippingThreshold: Number(e.target.value) })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">درصد مالیات بر ارزش افزوده (%)</label>
          <input
            type="number"
            min={0}
            max={50}
            value={form.taxPercent}
            onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white"
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-amber-300 cursor-pointer pt-2">
        <input
          type="checkbox"
          checked={form.maintenanceMode}
          onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
          className="w-4 h-4 rounded accent-amber-500"
        />
        <span>فعال‌سازی حالت تعمیر و نگهداری (Maintenance Mode) در ویترین</span>
      </label>

      <div className="pt-4 border-t border-slate-800 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 cursor-pointer"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          ذخیره تنظیمات فروشگاه
        </button>
      </div>
    </form>
  );
}