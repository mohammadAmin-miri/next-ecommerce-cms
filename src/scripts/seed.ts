import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { AuditLog } from '../models/AuditLog';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ خطا: متغیر MONGODB_URI در فایل .env تنظیم نشده است.');
  process.exit(1);
}

async function runSeed() {
  try {
    console.log('⏳ در حال اتصال به دیتابیس MongoDB...');
    await mongoose.connect(MONGODB_URI!, { retryWrites: false });
    console.log('✅ اتصال برقرار شد. در حال پاک‌سازی داده‌های قبلی...');

    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // ۱. ایجاد کاربران (سوپر ادمین، دمو ادمین و مشتری)
    console.log('👤 در حال ایجاد اکانت‌های کاربری...');
    const adminPassword = await bcrypt.hash('Admin@1234', 10);
    const demoPassword = await bcrypt.hash('Demo@1234', 10);

    const [superAdmin, demoAdmin, sampleCustomer] = await User.create([
      {
        name: 'مدیر ارشد سیستم',
        email: 'admin@example.com',
        
        passwordHash: adminPassword,
        role: 'ADMIN' as const,
        isBanned: false,
      },
      {
        name: 'کارفرما (حالت دمو)',
        email: 'demo@example.com',
        passwordHash: demoPassword,
        role: 'DEMO_ADMIN' as const,
        isBanned: false,
      },
      {
        name: 'کاربر نمونه (مشتری)',
        email: 'customer@example.com',
        passwordHash: demoPassword,
        role: 'CUSTOMER' as const,
        isBanned: false,
      },
    ]);

    // ۲. ایجاد دسته‌بندی‌ها
    console.log('📂 در حال ایجاد دسته‌بندی‌ها...');
    const categories = await Category.create([
      {
        name: 'لپ‌تاپ و اولترابوک',
        slug: 'laptops',
        description: 'انواع لپ‌تاپ‌های مهندسی، گیمینگ و مک‌بوک',
        isActive: true,
      },
      {
        name: 'گوشی هوشمند',
        slug: 'smartphones',
        description: 'پرچمداران اپل، سامسونگ و شیائومی',
        isActive: true,
      },
      {
        name: 'لوازم جانبی و صوتی',
        slug: 'accessories',
        description: 'هدفون، ساعت هوشمند و تجهیزات جانبی',
        isActive: true,
      },
    ]);

    // ۳. ایجاد محصولات واقع‌گرایانه با متغیرها (Variants)
    console.log('📦 در حال ایجاد محصولات...');
    const products = await Product.create([
      {
        title: 'لپ‌تاپ اپل MacBook Pro M3 Pro 14 inch',
        slug: 'macbook-pro-m3-14',
        sku: 'APL-MBP-M3',
        description:
          '<p>مجهز به پردازنده قدرتمند M3 Pro، نمایشگر Liquid Retina XDR و شارژدهی فوق‌العاده برای برنامه‌نویسان و طراحان حرفه‌ای.</p>',
        basePrice: 118000000,
        discountPrice: 114500000,
        categories: [categories[0]._id],
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
        ],
        variants: [
          { sku: 'APL-MBP-M3-BLK-512', color: 'مشکی فضایی', size: '512GB / 18GB', stock: 6, priceDiff: 0 },
          { sku: 'APL-MBP-M3-SLV-1TB', color: 'نقره‌ای', size: '1TB / 18GB', stock: 3, priceDiff: 12000000 },
        ],
        totalStock: 9,
        status: 'PUBLISHED',
        isFeatured: true,
      },
      {
        title: 'گوشی سامسونگ Galaxy S24 Ultra 5G',
        slug: 'samsung-galaxy-s24-ultra',
        sku: 'SAM-S24U',
        description:
          '<p>بدنه تیتانیومی، قلم S-Pen داخلی، دوربین ۲۰۰ مگاپیکسلی و هوش مصنوعی Galaxy AI.</p>',
        basePrice: 74000000,
        discountPrice: 71900000,
        categories: [categories[1]._id],
        images: [
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
        ],
        variants: [
          { sku: 'SAM-S24U-TIT-256', color: 'خاکستری تیتانیوم', size: '256GB', stock: 12, priceDiff: 0 },
          { sku: 'SAM-S24U-BLK-512', color: 'مشکی تیتانیوم', size: '512GB', stock: 4, priceDiff: 6500000 },
        ],
        totalStock: 16,
        status: 'PUBLISHED',
        isFeatured: true,
      },
      {
        title: 'هدفون بی‌سیم سونی WH-1000XM5',
        slug: 'sony-wh-1000xm5',
        sku: 'SNY-XM5',
        description:
          '<p>بهترین هدفون حذف نویز (ANC) بازار با ۸ میکروفون و ۳۰ ساعت عمر باتری.</p>',
        basePrice: 18500000,
        discountPrice: 17200000,
        categories: [categories[2]._id],
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        ],
        variants: [
          { sku: 'SNY-XM5-BLK', color: 'مشکی مات', size: 'استاندارد', stock: 3, priceDiff: 0 },
        ],
        totalStock: 3, // زیر ۵ عدد برای فعال شدن کارت هشدار موجودی در داشبورد!
        status: 'PUBLISHED',
        isFeatured: true,
      },
      {
        title: 'کیبورد مکانیکال Keychron K2 Pro بی‌سیم',
        slug: 'keychron-k2-pro',
        sku: 'KEY-K2P',
        description:
          '<p>کیبورد مکانیکال ۷۵ درصد با قابلیت برنامه‌ریزی QMK/VIA و سوییچ‌های Red مناسب کدنویسی طولانی.</p>',
        basePrice: 6800000,
        categories: [categories[2]._id],
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
        ],
        variants: [
          { sku: 'KEY-K2P-RED', color: 'خاکستری/نارنجی', size: 'Red Switch', stock: 2, priceDiff: 0 },
        ],
        totalStock: 2, // زیر ۵ عدد برای تست هشدار اتمام موجودی
        status: 'PUBLISHED',
        isFeatured: false,
      },
    ]);

    // ۴. ایجاد سفارش‌های نمونه در بازه ۳۰ روز گذشته (برای پر شدن نمودار Recharts)
    console.log('📈 در حال تولید سفارش‌های ۳۰ روز گذشته برای نمودار داشبورد...');
    const sampleOrders = [];
    const now = new Date();

    for (let i = 12; i >= 0; i--) {
      const orderDate = new Date(now);
      orderDate.setDate(now.getDate() - i * 2);

      const pickedProduct = products[i % products.length];
      const pickedVariant = pickedProduct.variants[0];
      const qty = (i % 2) + 1;
      const itemPrice = pickedProduct.discountPrice || pickedProduct.basePrice;
      const subtotal = itemPrice * qty;

      sampleOrders.push({
        orderNumber: `ORD-${10000 + i}`,
        user: sampleCustomer._id,
        orderItems: [
          {
            product: pickedProduct._id,
            variantSku: pickedVariant.sku,
            title: pickedProduct.title,
            priceAtPurchase: itemPrice,
            quantity: qty,
          },
        ],
        shippingAddress: {
          recipientName: `مشتری نمونه ${i + 1}`,
          phone: '09120000000',
          city: 'تهران',
          fullAddress: 'خیابان ولیعصر، پلاک ۱۲۰',
          postalCode: '1415563111',
        },
        shippingMethod: 'پست پیشتاز',
        shippingCost: 45000,
        subtotalAmount: subtotal,
        discountAmount: 0,
        finalAmount: subtotal + 45000,
        paymentStatus: 'PAID',
        orderStatus: i === 0 ? 'PROCESSING' : 'DELIVERED',
        idempotencyKey: `SEED-IDEM-${i}-${Date.now()}`,
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }

    await Order.insertMany(sampleOrders);

    // ۵. ایجاد مقالات وبلاگ و نظرات نمونه
    console.log('✍️ در حال ایجاد مقالات وبلاگ و دیدگاه‌ها...');
    await Post.create([
      {
        title: 'راهنمای جامع خرید لپ‌تاپ برای برنامه‌نویسان در سال ۱۴۰۵',
        slug: 'laptop-buying-guide-for-developers',
        excerpt: 'بررسی دقیق میزان رم، پردازنده و نمایشگر مناسب برای توسعه‌دهندگان وب و موبایل.',
        content: 'در این مقاله به بررسی تفاوت پردازنده‌های سری M اپل و اینتل نسل ۱۴ می‌پردازیم...',
        author: superAdmin._id,
        tags: ['لپ‌تاپ', 'برنامه‌نویسی', 'راهنمای خرید'],
        status: 'PUBLISHED',
        viewsCount: 340,
      },
    ]);

    await Comment.create([
      {
        targetType: 'PRODUCT',
        targetId: products[0]._id,
        authorName: 'امیرحسین رضایی',
        authorEmail: 'amir@example.com',
        rating: 5,
        content: 'کیفیت ساخت و سرعت کامپایل پروژه‌های Next.js روی این مک‌بوک فوق‌العاده است!',
        adminReply: 'مبارکتان باشد امیرحسین عزیز، از خرید شما سپاسگزاریم.',
        status: 'APPROVED',
      },
      {
        targetType: 'PRODUCT',
        targetId: products[2]._id,
        authorName: 'نیما کاظمی',
        authorEmail: 'nima@example.com',
        rating: 4,
        content: 'نویز کنسلینگ عالیه، فقط کاش قابل تا شدن بود.',
        status: 'PENDING',
      },
    ]);

    // ۶. ثبت لاگ امنیتی اولیه
    await AuditLog.create({
      actorId: superAdmin._id,
      actorName: superAdmin.name,
      actorRole: 'ADMIN',
      action: 'SEED',
      entityType: 'SYSTEM',
      description: 'مقداردهی اولیه دیتابیس (Seed) با موفقیت انجام شد.',
    });

    console.log('🎉 عملیات Seed با موفقیت کامل به پایان رسید!');
    console.log('-------------------------------------------');
    console.log('🔑 اکانت سوپر ادمین: admin@example.com | رمز: Admin@1234');
    console.log('🔑 اکانت دمو کارفرما: demo@example.com  | رمز: Demo@1234');
    console.log('-------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا در اجرای Seed:', error);
    process.exit(1);
  }
}

runSeed();