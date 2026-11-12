import Link from 'next/link';
import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, Search, Tag, Sparkles, Filter } from 'lucide-react';

export const instant = false;

interface LeanCategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

interface LeanProductItem {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  basePrice: number;
  discountPrice?: number;
  images: string[];
  totalStock: number;
  isFeatured: boolean;
  categories: LeanCategory[];
}

interface ProductsCatalogProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
}

export default async function StorefrontProductsPage({
  searchParams,
}: ProductsCatalogProps) {
  await connection();
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams.q?.trim() || '';
  const selectedCategory = resolvedParams.category || '';

  await connectDB();

  // ساخت فیلتر کوئری MongoDB
  const filter: Record<string, unknown> = { status: 'PUBLISHED' };

  if (searchQuery) {
    filter.title = { $regex: searchQuery, $options: 'i' };
  }

  if (selectedCategory && Types.ObjectId.isValid(selectedCategory)) {
    filter.categories = new Types.ObjectId(selectedCategory);
  }

  const [products, categories] = await Promise.all([
    Product.find(filter)
      .populate<{ categories: LeanCategory[] }>('categories', 'name slug')
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean<LeanProductItem[]>(),
    Category.find({ isActive: true }).select('name slug').lean<LeanCategory[]>(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* هدر کاتالوگ و فرم جستجو */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-blue-400" />
            کاتالوگ محصولات فروشگاه
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            نمایش {products.length} کالای موجود با ضمانت اصالت و ارسال فوری
          </p>
        </div>

        <form action="/products" method="GET" className="flex items-center gap-2 w-full md:w-80">
          {selectedCategory && (
            <input type="hidden" name="category" value={selectedCategory} />
          )}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="جستجوی نام محصول..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition cursor-pointer"
          >
            بگرد
          </button>
        </form>
      </div>

      {/* نوار فیلتر دسته‌بندی‌ها */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs text-slate-400 flex items-center gap-1 ml-2 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          دسته‌بندی:
        </span>
        <Link
          href="/products"
          className={`px-4 py-2 rounded-xl text-xs font-medium transition shrink-0 ${
            !selectedCategory
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
          }`}
        >
          همه کالاها
        </Link>
        {categories.map((cat) => {
          const idStr = cat._id.toString();
          const isActive = selectedCategory === idStr;
          return (
            <Link
              key={idStr}
              href={`/products?category=${idStr}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* شبکه کارت‌های محصول */}
      {products.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-base text-slate-300 font-medium">
            هیچ محصولی مطابق با فیلتر شما یافت نشد.
          </p>
          <Link
            href="/products"
            className="inline-block text-xs text-blue-400 hover:underline"
          >
            پاک کردن فیلترها و نمایش همه محصولات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const finalPrice = product.discountPrice ?? product.basePrice;
            const hasDiscount =
              product.discountPrice && product.discountPrice < product.basePrice;
            const coverImage =
              product.images?.[0] ||
              'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80';

            return (
              <Link
                key={product._id.toString()}
                href={`/products/${product.slug}`}
                className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition duration-300 hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div>
                  {/* تصویر محصول */}
                  <div className="relative aspect-square bg-slate-950 overflow-hidden">
                    <img
                      src={coverImage}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {product.isFeatured && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 text-[11px] font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        ویژه
                      </span>
                    )}
                    {product.totalStock === 0 && (
                      <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold">
                          ناموجود
                        </span>
                      </div>
                    )}
                  </div>

                  {/* اطلاعات محصول */}
                  <div className="p-4 space-y-2">
                    {product.categories?.[0] && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Tag className="w-3 h-3 text-blue-400" />
                        {product.categories[0].name}
                      </span>
                    )}
                    <h2 className="text-sm font-bold text-white line-clamp-2 leading-6 group-hover:text-blue-400 transition">
                      {product.title}
                    </h2>
                  </div>
                </div>

                {/* قیمت و وضعیت موجودی */}
                <div className="p-4 pt-0 border-t border-slate-800/60 mt-2 flex items-end justify-between">
                  <div>
                    {product.totalStock > 0 && product.totalStock < 5 ? (
                      <span className="text-[11px] text-amber-400 font-medium">
                        تنها {product.totalStock} عدد در انبار
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        آماده ارسال
                      </span>
                    )}
                  </div>

                  <div className="text-left">
                    {hasDiscount && (
                      <div className="text-xs text-slate-500 line-through">
                        {formatPrice(product.basePrice)}
                      </div>
                    )}
                    <div className="text-base font-bold text-emerald-400">
                      {formatPrice(finalPrice)}{' '}
                      <span className="text-[11px] font-normal text-slate-400">
                        تومان
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}