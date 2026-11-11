import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/next_ecommerce_cms';

async function seedDatabase() {
  try {
    console.log('⏳ در حال اتصال به MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ اتصال به دیتابیس برقرار شد.');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@store.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@1234';

    const demoEmail = process.env.DEMO_ADMIN_EMAIL || 'demo@store.com';
    const demoPass = process.env.DEMO_ADMIN_PASSWORD || 'Demo@1234';

    const customerEmail = 'customer@store.com';
    const customerPass = 'Customer@1234';

    const [adminHash, demoHash, customerHash] = await Promise.all([
      bcrypt.hash(adminPass, 12),
      bcrypt.hash(demoPass, 12),
      bcrypt.hash(customerPass, 12),
    ]);

    // ۱. ایجاد یا به‌روزرسانی سوپر ادمین (ADMIN)
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: 'مدیر ارشد سیستم',
        email: adminEmail,
        passwordHash: adminHash,
        role: 'ADMIN',
        isBanned: false,
      },
      { upsert: true, new: true }
    );

    // ۲. ایجاد یا به‌روزرسانی ادمین نمایشی ویژه کارفرما (DEMO_ADMIN)
    await User.findOneAndUpdate(
      { email: demoEmail },
      {
        name: 'کارفرما (نسخه دمو)',
        email: demoEmail,
        passwordHash: demoHash,
        role: 'DEMO_ADMIN',
        isBanned: false,
      },
      { upsert: true, new: true }
    );

    // ۳. ایجاد مشتری نمونه (CUSTOMER)
    await User.findOneAndUpdate(
      { email: customerEmail },
      {
        name: 'مشتری آزمایشی',
        email: customerEmail,
        passwordHash: customerHash,
        role: 'CUSTOMER',
        isBanned: false,
      },
      { upsert: true, new: true }
    );

    console.log('\n🎉 کاربران اولیه با موفقیت در دیتابیس ساخته شدند:');
    console.log('------------------------------------------------');
    console.log(`🟢 Full Admin : ${adminEmail} | Pass: ${adminPass}`);
    console.log(`🟡 Demo Admin : ${demoEmail}  | Pass: ${demoPass}`);
    console.log(`🔵 Customer   : ${customerEmail} | Pass: ${customerPass}`);
    console.log('------------------------------------------------\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطا در اجرای اسکریپت Seed:', error);
    process.exit(1);
  }
}

seedDatabase();