import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';

// کش کردن نقشه سایت برای ۱ ساعت (کاهش فشار روی دیتابیس)
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // اگر روی سرور اصلی دیپلوی کردید، آدرس سایت جایگزین می‌شود
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  await connectDB();

  // دریافت تمام محصولاتی که وضعیت آن‌ها "منتشر شده" است
  const products = await Product.find({ status: 'PUBLISHED' })
    .select('slug updatedAt')
    .lean();

  // تولید لینک داینامیک محصولات
  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
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