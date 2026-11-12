import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product, IVariant } from '@/models/Product';
import '@/models/Category';
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient';
import { ChevronLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

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
  // 🔴 هماهنگ شده با مدل شما: آرایه استرینگ و IVariant
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
    return {
      title: 'محصول یافت نشد | فروشگاه آنلاین',
    };
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
      // 🔴 هماهنگ شده با آرایه متنی تصاویر
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

  // سریالایز کردن داده‌ها برای ارسال امن به Client Component
  const serializedProduct = {
    _id: product._id.toString(),
    title: product.title,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice,
    discountPrice: product.discountPrice,
    totalStock: product.totalStock,
    // 🔴 تبدیل استرینگ‌ها به فرمت مورد نیاز کلاینت کامپوننت
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

      <ProductDetailClient product={serializedProduct} />

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

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
          نقد و بررسی و مشخصات محصول
        </h2>
        <div
          className="prose prose-invert prose-slate max-w-none text-sm leading-7 text-slate-300"
          dangerouslySetInnerHTML={{ __html: serializedProduct.description }}
        />
      </div>
    </div>
  );
}