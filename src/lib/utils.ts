import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * ترکیب هوشمند کلاس‌های Tailwind CSS بدون تداخل
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * فرمت کردن اعداد به قیمت خوانا (مثلاً ۲۵۰,۰۰۰ تومان)
 */
export function formatPrice(price: number, currencyLabel = 'تومان'): string {
  return `${new Intl.NumberFormat('fa-IR').format(price)} ${currencyLabel}`;
}

/**
 * تولید خودکار Slug استاندارد برای سئو (پشتیبانی از حروف انگلیسی و فارسی)
 */
export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // تبدیل فاصله‌ها به خط تیره
    .replace(/[^\w\u0600-\u06FF-]+/g, '') // حذف کاراکترهای خاص با حفظ حروف فارسی و انگلیسی
    .replace(/--+/g, '-') // حذف خط تیره‌های تکراری
    .replace(/^-+/, '') // حذف خط تیره از ابتدا
    .replace(/-+$/, ''); // حذف خط تیره از انتها
}