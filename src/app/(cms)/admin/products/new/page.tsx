import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { ProductFormClient } from '@/components/cms/ProductFormClient';

interface LeanCategoryOption {
  _id: Types.ObjectId;
  name: string;
}

export default async function NewProductPage() {
  await connectDB();

  const rawCategories = await Category.find({ isActive: true })
    .select('name')
    .sort({ name: 1 })
    .lean<LeanCategoryOption[]>();

  const categories = rawCategories.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">افزودن محصول جدید</h1>
          <p className="text-sm text-slate-400 mt-1">
            تعریف مشخصات کالا، متغیرهای رنگ/سایز، موجودی انبار و متاتگ‌های سئو
          </p>
        </div>

        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به لیست محصولات</span>
        </Link>
      </div>

      <ProductFormClient categories={categories} />
    </div>
  );
}