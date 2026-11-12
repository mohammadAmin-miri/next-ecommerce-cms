import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product, IVariant } from '@/models/Product';
import { Comment } from '@/models/Comment';
import '@/models/Category';
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient';
import {
  ChevronLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageSquare,
  Star,
} from 'lucide-react';

export const instant = false;

interface PopulatedCategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

interface LeanProductDetail {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  discountPrice?: number;
  images: string[];
  variants: IVariant[];
  categories: PopulatedCategory[];
  totalStock: number;
  status: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

interface LeanApprovedComment {
  _id: Types.ObjectId;
  authorName: string;
  rating: number;
  content: string;
  adminReply?: string;
  createdAt: Date;
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: ProductPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  await connectDB();
  const product = await Product.findOne({
    slug: decodedSlug,
    status: 'PUBLISHED',
  }).lean<LeanProductDetail>();

  if (!product) {
    return { title: 'محصول یافت نشد | فروشگاه آنلاین' };
  }

  const plainDescription = product.description
    ? product.description.replace(/<[^>]*>?/gm, '').slice(0, 155)
    : product.title;

  const metaTitle = product.seo?.metaTitle || `${product.title} | فروشگاه آنلاین`;
  const metaDescription = product.seo?.metaDescription || plainDescription;
  const previousImages = (await parent).openGraph?.images || [];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: `${baseUrl}/products/${product.slug}`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: `${baseUrl}/products/${product.slug}`,
      siteName: 'فروشگاه آنلاین',
      images:
        product.images && product.images.length > 0
          ? [
              {
                url: product.images[0],
                width: 800,
                height: 800,
                alt: product.title,
              },
              ...previousImages,
            ]
          : previousImages,
      locale: 'fa_IR',
      type: 'website',
    },
  };
}

export default async function SingleProductPage({ params }: ProductPageProps) {
  await connection();
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  await connectDB();

  const product = await Product.findOne({
    slug: decodedSlug,
    status: 'PUBLISHED',
  })
    .populate<{ categories: PopulatedCategory[] }>('categories', 'name slug')
    .lean<LeanProductDetail>();

  if (!product) {
    notFound();
  }

  // دریافت دیدگاه‌های تایید شده این محصول
  const approvedComments = await Comment.find({
    targetType: 'PRODUCT',
    targetId: product._id,
    status: 'APPROVED',
  })
    .sort({ createdAt: -1 })
    .lean<LeanApprovedComment[]>();

  const serializedProduct = {
    _id: product._id.toString(),
    title: product.title,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice,
    discountPrice: product.discountPrice,
    totalStock: product.totalStock,
    images: product.images.map((imgUrl, index) => ({
      url: imgUrl,
      alt: product.title,
      isPrimary: index === 0,
    })),
    variants: product.variants.map((v) => ({
      sku: v.sku,
      color: v.color || '',
      size: v.size || '',
      priceDiff: v.priceDiff || 0,
      stock: v.stock,
    })),
    categories: (product.categories || []).map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      slug: c.slug,
    })),
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: product.description.replace(/<[^>]*>?/gm, '').slice(0, 200),
    sku: product.variants[0]?.sku || product._id.toString(),
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${product.slug}`,
      priceCurrency: 'IRR',
      price: (product.discountPrice ?? product.basePrice) * 10,
      availability:
        product.totalStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* مسیر راهنما (Breadcrumb) */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-white transition">
          صفحه اصلی
        </Link>
        <ChevronLeft className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-white transition">
          محصولات
        </Link>
        {serializedProduct.categories[0] && (
          <>
            <ChevronLeft className="w-3.5 h-3.5" />
            <Link
              href={`/products?category=${serializedProduct.categories[0]._id}`}
              className="hover:text-white transition"
            >
              {serializedProduct.categories[0].name}
            </Link>
          </>
        )}
        <ChevronLeft className="w-3.5 h-3.5" />
        <span className="text-slate-200 font-medium truncate max-w-[200px]">
          {serializedProduct.title}
        </span>
      </nav>

      {/* کامپوننت کلاینت انتخاب متغیر و خرید */}
      <ProductDetailClient product={serializedProduct} />

      {/* ویژگی‌های اطمینان خرید */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-white">ضمانت اصالت و سلامت کالا</h4>
            <p className="text-xs text-slate-400 mt-0.5">بررسی دقیق کیفیت پیش از ارسال</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <Truck className="w-6 h-6 text-blue-400 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-white">ارسال سریع به سراسر کشور</h4>
            <p className="text-xs text-slate-400 mt-0.5">بسته‌بندی ایمن با کد رهگیری پستی</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <RotateCcw className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-white">۷ روز ضمانت بازگشت وجه</h4>
            <p className="text-xs text-slate-400 mt-0.5">در صورت عدم تطابق مشخصات فنی</p>
          </div>
        </div>
      </div>

      {/* توضیحات تخصصی محصول */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
          نقد و بررسی و مشخصات محصول
        </h2>
        <div
          className="prose prose-invert prose-slate max-w-none text-sm leading-7 text-slate-300"
          dangerouslySetInnerHTML={{ __html: serializedProduct.description }}
        />
      </div>

      {/* بخش دیدگاه‌های خریداران */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          دیدگاه و امتیاز خریداران ({approvedComments.length})
        </h2>

        {approvedComments.length === 0 ? (
          <p className="text-sm text-slate-400">
            هنوز دیدگاهی برای این محصول ثبت نشده است.
          </p>
        ) : (
          <div className="space-y-4">
            {approvedComments.map((c) => (
              <div
                key={c._id.toString()}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    {c.authorName}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{c.rating} از ۵</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {c.content}
                </p>
                {c.adminReply && (
                  <div className="mt-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
                    <strong>پاسخ فروشگاه:</strong> {c.adminReply}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}