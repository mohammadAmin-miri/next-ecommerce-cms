/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { Post } from '@/models/Post';
import { formatPrice } from '@/lib/utils';
import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Headphones,
  LayoutDashboard,
  ShoppingBag,
  BookOpen,
  Layers,
} from 'lucide-react';

export const instant = false;

interface LeanCategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
}

interface LeanProduct {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  basePrice: number;
  discountPrice?: number;
  images: string[];
  totalStock: number;
}

interface LeanPost {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  createdAt: Date;
}

export default async function HomePage() {
  await connection();
  await connectDB();

  // واکشی موازی دسته‌بندی‌ها، محصولات ویژه و آخرین مقالات از دیتابیس
  const [categories, featuredProducts, latestPosts] = await Promise.all([
    Category.find({ isActive: true }).limit(4).lean<LeanCategory[]>(),
    Product.find({ status: 'PUBLISHED' })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(4)
      .lean<LeanProduct[]>(),
    Post.find({ status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean<LeanPost[]>(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* ۱. بخش Hero (بنر اصلی ویترین و دسترسی سریع به پنل ادمین) */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-blue-950/60 border border-slate-800 p-8 md:p-14">
        <div className="max-w-2xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نسل جدید سیستم فروشگاهی و CMS سازمانی با Next.js 16</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
            تجربه خرید هوشمند با{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-l from-blue-400 to-emerald-400">
              بالاترین سرعت و امنیت
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            بررسی و خرید جدیدترین لپ‌تاپ‌های مهندسی، پرچمداران موبایل و تجهیزات تخصصی با ضمانت اصالت کالا و مدیریت موجودی لحظه‌ای انبار.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/products"
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-blue-600/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>مشاهده کاتالوگ محصولات</span>
            </Link>

            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-amber-300 font-medium text-sm flex items-center gap-2 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>دموی پنل مدیریت (ویژه کارفرما)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ۲. نوار مزیت‌های رقابتی فروشگاه */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">تضمین اصالت و گارانتی معتبر</h3>
            <p className="text-xs text-slate-400 mt-1">تمامی کالاها با شناسه رسمی و گارانتی شرکتی عرضه می‌شوند</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">پردازش و ارسال اکسپرس</h3>
            <p className="text-xs text-slate-400 mt-1">کسر آنی از انبار و تحویل سریع به سراسر کشور</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">مشاوره تخصصی پیش از خرید</h3>
            <p className="text-xs text-slate-400 mt-1">پشتیبانی فنی برای انتخاب بهترین کانفیگ سخت‌افزاری</p>
          </div>
        </div>
      </section>

      {/* ۳. دسته‌بندی‌های فروشگاه */}
      {categories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              دسته‌بندی‌های تخصصی
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id.toString()}
                href={`/products?category=${cat._id.toString()}`}
                className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between"
              >
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {cat.description}
                    </p>
                  )}
                </div>
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:-translate-x-1 transition" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ۴. محصولات ویژه و پرفروش */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              محصولات منتخب فروشگاه
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              جدیدترین کالاهای موجود در انبار با تخفیف ویژه
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => {
            const finalPrice = product.discountPrice ?? product.basePrice;
            const cover =
              product.images?.[0] ||
              'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80';

            return (
              <Link
                key={product._id.toString()}
                href={`/products/${product.slug}`}
                className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition"
              >
                <div>
                  <div className="aspect-square bg-slate-950 overflow-hidden">
                    <img
                      src={cover}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-6 group-hover:text-blue-400 transition">
                      {product.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {product.totalStock > 0 ? `${product.totalStock} عدد موجود` : 'ناموجود'}
                  </span>
                  <div className="text-left">
                    {product.discountPrice && (
                      <div className="text-xs text-slate-500 line-through">
                        {formatPrice(product.basePrice)}
                      </div>
                    )}
                    <div className="text-sm font-bold text-emerald-400">
                      {formatPrice(finalPrice)} تومان
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ۵. آخرین مقالات وبلاگ */}
      {latestPosts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              آخرین مقالات و راهنمای خرید
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestPosts.map((post) => (
              <div
                key={post._id.toString()}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}