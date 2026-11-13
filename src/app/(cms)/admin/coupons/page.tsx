import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Coupon } from '@/models/Coupon';
import { CouponsManagerClient, SerializedCoupon } from '@/components/cms/CouponsManagerClient';

export const instant = false;

export default async function AdminCouponsPage() {
  await connection();
  await connectDB();

  const rawCoupons = await Coupon.find({})
    .sort({ createdAt: -1 })
    .lean<{
      _id: Types.ObjectId;
      code: string;
      discountPercent: number;
      maxUsage: number;
      usedCount: number;
      expiresAt: Date;
    }[]>();

  const serialized: SerializedCoupon[] = rawCoupons.map((c) => ({
    _id: c._id.toString(),
    code: c.code,
    discountPercent: c.discountPercent,
    maxUsage: c.maxUsage,
    usedCount: c.usedCount,
    expiresAt: new Date(c.expiresAt).toLocaleDateString('fa-IR'),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت کدهای تخفیف (Coupons)</h1>
        <p className="text-sm text-slate-400 mt-1">
          ایجاد و مدیریت کمپین‌های تخفیفی و کدهای هدیه مشتریان
        </p>
      </div>

      <CouponsManagerClient initialCoupons={serialized} />
    </div>
  );
}