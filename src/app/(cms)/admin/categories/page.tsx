import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import {
  CategoryManagerClient,
  SerializedCategory,
} from '@/components/cms/CategoryManagerClient';

interface PopulatedParent {
  _id: Types.ObjectId;
  name: string;
}

interface LeanCategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  parentCategory?: PopulatedParent | null;
  isActive: boolean;
}

export default async function AdminCategoriesPage() {
  await connectDB();

  const rawCategories = await Category.find({})
    .populate<{ parentCategory: PopulatedParent | null }>('parentCategory', 'name')
    .sort({ createdAt: -1 })
    .lean<LeanCategory[]>();

  const serializedCategories: SerializedCategory[] = rawCategories.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description,
    parentName: c.parentCategory ? c.parentCategory.name : null,
    isActive: c.isActive,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          مدیریت دسته‌بندی‌های درختی
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          ایجاد دسته‌بندی‌های اصلی و زیرمجموعه‌های چندسطحی فروشگاه
        </p>
      </div>

      <CategoryManagerClient categories={serializedCategories} />
    </div>
  );
}