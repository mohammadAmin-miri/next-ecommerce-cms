import { connection } from 'next/server';
import { connectDB } from '@/lib/db';
import { Setting } from '@/models/Setting';
import { SettingsFormClient, StoreSettingsData } from '@/components/cms/SettingsFormClient';
import { Settings } from 'lucide-react';

export const instant = false;

export default async function AdminSettingsPage() {
  await connection();
  await connectDB();

  const existing = await Setting.findOne({}).lean<StoreSettingsData | null>();

  const initialData: StoreSettingsData = {
    storeName: existing?.storeName || 'نکست‌استور',
    supportPhone: existing?.supportPhone || '021-88000000',
    supportEmail: existing?.supportEmail || 'support@example.com',
    shippingCost: existing?.shippingCost ?? 45000,
    freeShippingThreshold: existing?.freeShippingThreshold ?? 5000000,
    taxPercent: existing?.taxPercent ?? 9,
    maintenanceMode: Boolean(existing?.maintenanceMode),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          تنظیمات کل فروشگاه و پیکربندی مالی
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          مدیریت مشخصات پایه، هزینه ارسال، مالیات بر ارزش افزوده و وضعیت سرویس‌دهی
        </p>
      </div>

      <SettingsFormClient initial={initialData} />
    </div>
  );
}