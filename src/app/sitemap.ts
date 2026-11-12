import { MetadataRoute } from 'next';
import { unstable_cacheLife as cacheLife } from 'next/cache';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // فعال‌سازی سیستم کشینگ جدید Next.js 16 به جای export const revalidate
  'use cache';
  cacheLife('hours');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  await connectDB();

  // دریافت تمام محصولاتی که وضعیت آن‌ها "منتشر شده" است
  const products = await Product.find({ status: 'PUBLISHED' })
    .select('slug updatedAt')
    .lean();

  // تولید لینک داینامیک محصولات
  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // تولید لینک صفحات استاتیک اصلی
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/products',
    '/cart',
    '/checkout',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...staticRoutes, ...productUrls];
}