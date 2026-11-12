import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product, IVariant } from '@/models/Product';
import '@/models/Category';
import {
  ProductDetailClient,
  SerializedStoreProduct,
} from '@/components/storefront/ProductDetailClient';
import { ShoppingCart, Shield } from 'lucide-react';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

interface PopulatedCat {
  _id: Types.ObjectId;
  name: string;
}

interface LeanStoreProduct {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  sku: string;
  description: string;
  basePrice: number;
  discountPrice?: number;
  images: string[];
  variants: IVariant[];
  categories?: PopulatedCat[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();

  const decodedSlug = decodeURIComponent(slug);
  const product = await Product.findOne({
    slug: decodedSlug,
    status: 'PUBLISHED',
  })
    .select('title description seo')
    .lean<LeanStoreProduct | null>();

  if (!product) {
    return { title: 'محصول یافت نشد' };
  }

  return {
    title: product.seo?.metaTitle || `${product.title} | فروشگاه آنلاین`,
    description:
      product.seo?.metaDescription || product.description.slice(0, 155),
  };
}

export default async function StoreProductDetailPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  await connectDB();

  const rawProduct = await Product.findOne({
    slug: decodedSlug,
    status: 'PUBLISHED',
  })
    .populate<{ categories: PopulatedCat[] }>('categories', 'name')
    .lean<LeanStoreProduct | null>();

  if (!rawProduct) {
    notFound();
  }

  const serializedProduct: SerializedStoreProduct = {
    _id: rawProduct._id.toString(),
    title: rawProduct.title,
    slug: rawProduct.slug,
    sku: rawProduct.sku,
    description: rawProduct.description,
    basePrice: rawProduct.basePrice,
    discountPrice: rawProduct.discountPrice,
    images: rawProduct.images || [],
    variants: (rawProduct.variants || []).map((v) => ({
      sku: v.sku,
      color: v.color,
      size: v.size,
      stock: v.stock,
      priceDiff: v.priceDiff,
    })),
    categoryNames: Array.isArray(rawProduct.categories)
      ? rawProduct.categories.map((c) => c.name).filter(Boolean)
      : [],
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100">
      {/* هدر سریع فروشگاه */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-lg text-white">
              فروشگاه <span className="text-blue-500">NextCMS</span>
            </Link>
            <Link
              href="/admin/products"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>بازگشت به پنل ادمین</span>
            </Link>
          </div>

          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>سبد خرید و تسویه‌حساب</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <ProductDetailClient product={serializedProduct} />
      </main>
    </div>
  );
}