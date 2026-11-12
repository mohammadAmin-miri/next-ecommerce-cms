import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import '@/models/Category'; // اطمینان از رجیستر شدن مدل Category برای populate
import { ProductTableToolbar } from '@/components/cms/ProductTableToolbar';
import {
  ProductsTableClient,
  SerializedProduct,
} from '@/components/cms/ProductsTableClient';
import { connection } from 'next/server';

export const instant = false;

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}

// تعریف اینترفیس دقیق و مستقل برای کوئری فیلتر MongoDB (بدون نیاز به any یا FilterQuery)
interface ProductQueryFilter {
  $or?: Array<{
    title?: { $regex: string; $options: string };
    sku?: { $regex: string; $options: string };
  }>;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

// تعریف اینترفیس دقیق برای خروجی .lean() محصول به همراه دسته‌بندی‌های Populate شده
interface PopulatedCategory {
  _id: Types.ObjectId;
  name: string;
}

interface LeanPopulatedProduct {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  sku: string;
  basePrice: number;
  discountPrice?: number;
  totalStock: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  images?: string[];
  categories?: PopulatedCategory[];
}

export default async function AdminProductsPage({
  searchParams,
}: ProductsPageProps) {
  await connection();
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const statusFilter = resolvedParams.status || 'ALL';
  const currentPage = Math.max(1, Number(resolvedParams.page) || 1);
  const limit = 10;

  await connectDB();

  const filterQuery: ProductQueryFilter = {};

  if (query) {
    filterQuery.$or = [
      { title: { $regex: query, $options: 'i' } },
      { sku: { $regex: query, $options: 'i' } },
    ];
  }

  if (
    statusFilter === 'DRAFT' ||
    statusFilter === 'PUBLISHED' ||
    statusFilter === 'ARCHIVED'
  ) {
    filterQuery.status = statusFilter;
  }

  const skip = (currentPage - 1) * limit;

  const [rawProducts, totalProducts] = await Promise.all([
    Product.find(filterQuery)
      .populate<{ categories: PopulatedCategory[] }>('categories', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<LeanPopulatedProduct[]>(),
    Product.countDocuments(filterQuery),
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  const serializedProducts: SerializedProduct[] = rawProducts.map((p) => ({
    _id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    sku: p.sku,
    basePrice: p.basePrice,
    discountPrice: p.discountPrice,
    totalStock: p.totalStock,
    status: p.status,
    images: p.images || [],
    categoryNames: Array.isArray(p.categories)
      ? p.categories.map((c) => c.name).filter(Boolean)
      : [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت محصولات</h1>
          <p className="text-sm text-slate-400 mt-1">
            مجموعاً {totalProducts} محصول یافت شد.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن محصول جدید</span>
        </Link>
      </div>

      {/* نوار جستجوی Debounce شده و فیلترها */}
      <ProductTableToolbar />

      {/* جدول تعاملی با قابلیت انتخاب گروهی و خروجی CSV */}
      <ProductsTableClient products={serializedProducts} />

      {/* صفحه‌بندی (Pagination) */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
          <div>
            صفحه {currentPage} از {totalPages}
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/products?page=${currentPage - 1}${
                  query ? `&q=${query}` : ''
                }${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}`}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white transition"
              >
                قبلی
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/admin/products?page=${currentPage + 1}${
                  query ? `&q=${query}` : ''
                }${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}`}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white transition"
              >
                بعدی
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}