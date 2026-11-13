<div dir="rtl" align="center">

# 🛍️ سیستم جامع فروشگاهی و مدیریت محتوای سازمانی (Next.js 16 E-Commerce & CMS)

[![Next.js](https://img.shields.io/badge/Next.js-16_(App_Router)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5_(RBAC)-purple?style=for-the-badge)](https://authjs.dev/)

**یک پلتفرم فول‌استک، مقیاس‌پذیر و امن برای مدیریت فروشگاه آنلاین، انبارداری اتمیک، گزارش‌گیری تحلیلی و مدیریت محتوا**

</div>

---

<div dir="rtl">

## 📌 معرفی پروژه

پروژه **next-ecommerce-cms** یک سیستم فروشگاهی و مدیریت محتوای (CMS) سطح سازمانی است که با آخرین قابلیت‌های **Next.js 16 (موتور Turbopack، قابلیت `cacheComponents` و Server Actions)**، **React 19**، **TypeScript** و دیتابیس **MongoDB** توسعه یافته است.

در طراحی این سیستم، علاوه بر پیاده‌سازی کامل ویترین فروشگاه و چرخه خرید، تمرکز ویژه‌ای بر **امنیت چندلایه (RBAC)**، **تراکنش‌های اتمیک انبار**، **ثبت وقایع امنیتی (Audit Logs)** و ارائه یک **حالت پیش‌نمایش امن (Demo Admin)** برای بررسی راحت پنل مدیریت توسط کارفرمایان بوده است.

---

## ✨ ویژگی‌ها و قابلیت‌های کلیدی

### ۱. 🔐 احراز هویت و کنترل دسترسی مبتنی بر نقش (RBAC)
* پیاده‌سازی شده با **Auth.js (NextAuth v5)**، استراتژی JWT، توسعه تایپ‌های نشست در `types/next-auth.d.ts` و محافظت در سطح Edge Middleware (`src/middleware.ts`).
* پشتیبانی از ۴ نقش مجزا:
  * **`ADMIN` (مدیر ارشد):** دسترسی کامل به تمامی عملیات خواندن، نوشتن، ویرایش و حذف.
  * **`EDITOR` (ویرایشگر محتوا):** دسترسی به مدیریت محصولات، دسته‌بندی‌ها، مقالات، کدهای تخفیف و نظرات.
  * **`DEMO_ADMIN` (حالت دمو ویژه کارفرما):** دسترسی **فقط-خواندنی (Read-Only)** به کل پنل مدیریت؛ کارفرما می‌تواند با یک کلیک وارد پنل شود و تمام نمودارها و بخش‌ها را ببیند، اما هرگونه عملیات تغییر، حذف یا ثبت در سمت سرور توسط گارد `requireWriteAccess` مسدود می‌شود.
  * **`CUSTOMER` (مشتری):** ثبت‌نام، ورود، خرید از فروشگاه و ثبت دیدگاه.

### ۲. 🛒 ویترین فروشگاه، سبد خرید و تسویه‌حساب هوشمند
* **صفحه اصلی و کاتالوگ محصولات (`/` و `/products`):** مجهز به جستجوی متنی، فیلتر بر اساس دسته‌بندی و نمایش برچسب موجودی و تخفیف.
* **مدیریت متغیرهای محصول (Variants):** امکان انتخاب رنگ، سایز/حافظه و گارانتی با محاسبه لحظه‌ای اختلاف قیمت (`priceDiff`) و موجودی مجزای هر متغیر.
* **سبد خرید پایدار (`/cart`):** مدیریت وضعیت در سمت کلاینت با **Zustand** (`src/store/cart.store.ts`) و ذخیره‌سازی در `localStorage` همراه با هوک استاندارد React 19 (`useSyncExternalStore`) برای جلوگیری کامل از خطاهای Hydration.
* **تسویه‌حساب ایمن (`/checkout`):**
  * بررسی و اعمال آنی کدهای تخفیف (`Coupon`) در سمت سرور.
  * **کسر اتمیک موجودی انبار:** کاهش هم‌زمان موجودی متغیر (`variants.stock`) و موجودی کل (`totalStock`) در لحظه ثبت سفارش.
  * **جلوگیری از سفارش تکراری:** تولید کلید یکتای `idempotencyKey` به ازای هر تراکنش.

### ۳. 🖥️ پنل مدیریت جامع (Admin Dashboard)
* **داشبورد آماری (`/admin/dashboard`):** گزارش تحلیلی فروش ۳۰ روز گذشته با **Recharts** و پایپ‌لاین‌های تجمیعی MongoDB (`Aggregation`)، نمایش کالاهای پرفروش، هشدار اتمام موجودی (`totalStock < 5`) و خروجی اکسل/CSV.
* **مدیریت دسته‌بندی‌ها و برندها (`/admin/categories`):** ساختار درختی دسته‌بندی‌ها و مدیریت برندهای کالا.
* **مدیریت محصولات (`/admin/products` و `/admin/products/[slug]/edit`):** تعریف محصول جدید، ویرایش کامل مشخصات، قیمت، موجودی و نامک (Slug).
* **مدیریت سفارش‌ها (`/admin/orders`):** تغییر وضعیت سفارش (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`) همراه با **بازگشت خودکار موجودی به انبار** در صورت لغو سفارش.
* **مدیریت کاربران (`/admin/users`):** تغییر نقش سیستمی کاربران در لحظه و امکان مسدودسازی (`Ban`) یا رفع مسدودیت حساب‌ها.
* **مدیریت کدهای تخفیف (`/admin/coupons`):** تعریف کوپن‌های تخفیف درصدی با محدودیت تعداد دفعات استفاده و تاریخ انقضا.
* **مرکز محتوا، وبلاگ و نظرات (`/admin/content`، `/admin/posts` و `/admin/comments`):** انتشار مقالات آموزشی و مدیریت یکپارچه دیدگاه‌های مشتریان (تایید، رد و ثبت پاسخ مدیر).
* **لاگ وقایع امنیتی (`/admin/logs`):** ثبت تغییرناپذیر (Immutable) تمامی فعالیت‌های مدیران سیستم با جزئیات زمان، نقش و نوع عملیات.
* **تنظیمات کل فروشگاه (`/admin/settings`):** مدیریت نام تجاری فروشگاه، هزینه پایه ارسال، سقف خرید برای ارسال رایگان، درصد مالیات و حالت تعمیر و نگهداری.

---

## 🛠️ تکنولوژی‌های استفاده‌شده

| بخش | تکنولوژی / کتابخانه |
| :--- | :--- |
| **فریم‌ورک اصلی** | Next.js 16 (App Router, Turbopack, Server Actions) |
| **کتابخانه رابط کاربری** | React 19 |
| **زبان برنامه‌نویسی** | TypeScript (Strict Mode) |
| **پایگاه داده و ODM** | MongoDB & Mongoose |
| **احراز هویت و امنیت** | Auth.js (NextAuth v5) + Bcryptjs |
| **مدیریت وضعیت کلاینت** | Zustand (Persist Middleware) |
| **استایل‌دهی و آیکون‌ها** | Tailwind CSS v4 + Lucide React |
| **نمودار و مصورسازی داده** | Recharts |
| **اعتبارسنجی داده‌ها** | Zod (`src/lib/validations`) |
| **کانتینرسازی و استقرار** | Docker (Multi-Stage Standalone) & Docker Compose |

---

## ⚙️ پیش‌نیازهای نصب

قبل از شروع، مطمئن شوید ابزارهای زیر روی سیستم شما نصب هستند:
1. **Node.js** (نسخه ۲۰ به بالا — پیشنهاد می‌شود نسخه LTS)
2. **MongoDB** (نصب‌شده به‌صورت محلی روی پورت `27017` یا یک رشته اتصال از سرویس‌های ابری مانند MongoDB Atlas)
3. **Git** برای دریافت مخزن پروژه

---

## 🚀 راهنمای گام‌به‌گام نصب و راه‌اندازی (محیط توسعه - Localhost)

### گام ۱: دریافت پروژه و نصب وابستگی‌ها
ابتدا مخزن پروژه را کلون کرده، وارد پوشه پروژه شوید و پکیج‌ها را نصب کنید:

```bash
git clone [https://github.com/mohammadAmin-miri/next-ecommerce-cms.git](https://github.com/mohammadAmin-miri/next-ecommerce-cms.git)
cd next-ecommerce-cms
npm install
```

### گام ۲: تنظیم متغیرهای محیطی (`.env.local`)
یک کپی از فایل `.env.example` با نام **`.env.local`** در ریشه پروژه بسازید و مقادیر زیر را در آن قرار دهید:

```env
# ۱. آدرس اتصال به دیتابیس MongoDB
MONGODB_URI="mongodb://127.0.0.1:27017/next-ecommerce-cms"

# ۲. کلید امنیتی رمزنگاری نشست‌ها (Auth.js)
AUTH_SECRET="super-secret-jwt-key-for-next16-ecommerce-cms"

# ۳. آدرس پایه برنامه
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ۴. اطلاعات اکانت‌های ورود سریع (هماهنگ با اسکریپت Seed)
SUPER_ADMIN_EMAIL="admin@example.com"
SUPER_ADMIN_PASSWORD="Admin@1234"
DEMO_ADMIN_EMAIL="demo@example.com"
DEMO_ADMIN_PASSWORD="Demo@1234"
```

### گام ۳: مقداردهی اولیه دیتابیس (اجرای اسکریپت Seed) 🌱
این پروژه دارای یک اسکریپت جامع **Seed** (`src/scripts/seed.ts`) است که به‌صورت خودکار دیتابیس را پاک‌سازی کرده و داده‌های اولیه زیر را ایجاد می‌کند:
* ۳ حساب کاربری پیش‌فرض (مدیر ارشد، دمو کارفرما و مشتری نمونه) با رمزهای هش‌شده (`bcrypt`)
* دسته‌بندی‌های پایه، برندها و محصولات متنوع همراه با متغیرهای رنگ، ظرفیت و موجودی مجزا
* ۱۵ سفارش نمونه توزیع‌شده در ۳۰ روز گذشته (جهت رسم نمودارهای تحلیلی داشبورد)
* مقالات وبلاگ، دیدگاه‌های مشتریان و لاگ‌های اولیه امنیتی

برای اجرای مقداردهی اولیه دیتابیس، دستور زیر را در ترمینال وارد کنید:

```bash
npm run seed
```
*(پس از مشاهده پیام موفقیت در ترمینال، دیتابیس شما آماده بهره‌برداری است).*

### گام ۴: اجرای سرور توسعه (Development Server) 💻
پس از مقداردهی اولیه دیتابیس، سرور توسعه را با موتور Turbopack اجرا کنید:

```bash
npm run dev
```

اکنون برنامه در آدرس‌های زیر در دسترس است:
* **ویترین فروشگاه (Storefront):** [http://localhost:3000](http://localhost:3000)
* **صفحه ورود و دسترسی سریع:** [http://localhost:3000/login](http://localhost:3000/login)
* **داشبورد مدیریت (Admin Panel):** [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
* **نقشه سایت داینامیک (Sitemap):** [http://localhost:3000/sitemap.xml](http://localhost:3000/sitemap.xml)

---

## 🔑 اطلاعات حساب‌های کاربری پیش‌فرض (پس از اجرای Seed)

شما می‌توانید در صفحه ورود (**[http://localhost:3000/login](http://localhost:3000/login)**) با کلیک روی دکمه‌های **«ورود سریع (بدون نیاز به تایپ رمز)»** مستقیماً وارد پنل شوید و یا از اطلاعات جدول زیر برای ورود دستی استفاده نمایید:

| نقش کاربری | ایمیل | رمز عبور | سطح دسترسی در سیستم |
| :--- | :--- | :--- | :--- |
| **مدیر ارشد (`ADMIN`)** | `admin@example.com` | `Admin@1234` | دسترسی کامل (مشاهده، ساخت، ویرایش و حذف در تمامی بخش‌ها) |
| **دمو کارفرما (`DEMO_ADMIN`)** | `demo@example.com` | `Demo@1234` | دسترسی **فقط-خواندنی (Read-Only)** به تمام صفحات و آمارهای پنل ادمین بدون امکان تغییر دیتابیس |
| **مشتری نمونه (`CUSTOMER`)** | `customer@example.com` | `Demo@1234` | دسترسی به ویترین فروشگاه، سبد خرید و ثبت سفارش |

---

## 🐳 راه‌اندازی سریع با Docker (محیط Production)

این پروژه با معماری **Multi-Stage Dockerfile** و قابلیت `output: "standalone"` در Next.js 16 بهینه‌سازی شده است. برای اجرای ایزوله کل پروژه به همراه دیتابیس MongoDB بدون نیاز به نصب پیش‌نیازها روی سیستم میزبان، مراحل زیر را دنبال کنید:

### ۱. ساخت ایمیج و اجرای کانتینرها با Docker Compose
در ریشه پروژه دستور زیر را اجرا کنید تا سرویس‌های `mongodb` و `web` ساخته و در پس‌زمینه اجرا شوند:

```bash
docker compose up -d --build
```

### ۲. مقداردهی اولیه دیتابیس در داخل کانتینر (فقط بار اول)
برای اینکه دیتابیس داخل داکر با اطلاعات اولیه (اکانت‌های ادمین/دمو و محصولات) پر شود، دستور زیر را اجرا کنید:

```bash
docker exec -it next-ecommerce-cms npm run seed
```

### ۳. مشاهده لاگ‌ها و توقف سرویس‌ها
* برای مشاهده لاگ‌های لحظه‌ای سرور Next.js در داکر:
  ```bash
  docker compose logs -f web
  ```
* برای توقف کامل کانتینرها:
  ```bash
  docker compose down
  ```

---

## 🗂️ ساختار پوشه‌ها و معماری پروژه

```text
next-ecommerce-cms/
├── public/                       # فایل‌های استاتیک و تصاویر عمومی
├── src/
│   ├── actions/                  # منطق سمت سرور (Server Actions) و عملیات دیتابیس
│   │   ├── admin-extra.actions.ts  # مدیریت کاربران، کوپن‌ها، تنظیمات کل و ویرایش محصول
│   │   ├── analytics.actions.ts    # پایپ‌لاین‌های تجمیعی (Aggregation) داشبورد و گزارش فروش
│   │   ├── auth.actions.ts         # احراز هویت، ثبت‌نام و ورود سریع یک‌کلیکی (Quick Login)
│   │   ├── category.actions.ts     # عملیات CRUD دسته‌بندی‌های درختی فروشگاه
│   │   ├── checkout.actions.ts     # اعتبارسنجی کد تخفیف و ثبت سفارش با کسر اتمیک موجودی
│   │   ├── cms.actions.ts          # مدیریت مقالات وبلاگ و تایید/رد دیدگاه‌ها
│   │   ├── order.actions.ts        # تغییر وضعیت سفارش‌ها و بازگشت خودکار موجودی به انبار
│   │   └── product.actions.ts      # ایجاد، مدیریت متغیرها (Variants) و حذف محصولات
│   │
│   ├── app/                      # مسیریابی Next.js 16 App Router
│   │   ├── (auth)/                 # گروه مسیرهای احراز هویت
│   │   │   ├── login/                # صفحه ورود مجهز به دکمه‌های دسترسی سریع کارفرما و ادمین
│   │   │   └── register/             # صفحه ثبت‌نام مشتریان جدید
│   │   │
│   │   ├── (cms)/admin/            # پنل مدیریت سازمانی محافظت‌شده با RBAC
│   │   │   ├── categories/           # مدیریت دسته‌بندی‌های فروشگاه
│   │   │   ├── comments/             # صف بررسی، تایید و پاسخ‌گویی به نظرات کاربران
│   │   │   ├── content/              # هاب یکپارچه مدیریت محتوا و وبلاگ
│   │   │   ├── coupons/              # تعریف و مدیریت کدهای تخفیف درصدی
│   │   │   ├── dashboard/            # داشبورد تحلیلی فروش ۳۰ روزه و هشدار موجودی انبار
│   │   │   ├── logs/                 # جدول گزارش وقایع امنیتی (Audit Logs)
│   │   │   ├── orders/               # مدیریت سفارش‌های ثبت‌شده و وضعیت ارسال
│   │   │   ├── posts/                # مدیریت و انتشار مقالات وبلاگ
│   │   │   ├── products/             # لیست محصولات، افزودن کالا و صفحه ویرایش ([slug]/edit)
│   │   │   ├── settings/             # تنظیمات کل فروشگاه، مالیات و هزینه ارسال
│   │   │   ├── users/                # مدیریت کاربران، تغییر نقش‌ها و مسدودسازی حساب
│   │   │   └── layout.tsx            # لایه اصلی پنل مدیریت و نوار ناوبری سایدبار
│   │   │
│   │   ├── (storefront)/           # ویترین اصلی فروشگاه (سمت مشتری)
│   │   │   ├── cart/                 # صفحه سبد خرید کلاینت
│   │   │   ├── checkout/             # صفحه تسویه‌حساب، اعمال کوپن و ثبت نهایی سفارش
│   │   │   ├── products/             # کاتالوگ محصولات با فیلتر و صفحه تکی کالا ([slug])
│   │   │   └── page.tsx              # صفحه اصلی فروشگاه (Hero، دسته‌بندی‌ها، محصولات ویژه، وبلاگ)
│   │   │
│   │   ├── api/auth/[...nextauth]/ # Route Handler داخلی Auth.js (NextAuth v5)
│   │   │   └── route.ts
│   │   ├── favicon.ico             # آیکون سایت
│   │   ├── globals.css             # استایل‌های سراسری و تنظیمات Tailwind CSS
│   │   ├── layout.tsx              # لایه ریشه برنامه (Root Layout) و فونت فارسی
│   │   └── sitemap.ts              # تولیدکننده خودکار نقشه سایت (sitemap.xml)
│   │
│   ├── components/               # کامپوننت‌های رابط کاربری تفکیک‌شده
│   │   ├── cms/                    # جداول، فرم‌ها و نمودارهای اختصاصی پنل مدیریت
│   │   ├── storefront/             # کامپوننت‌های تعاملی ویترین، کارت محصول و گالری
│   │   └── ui/                     # المان‌های پایه و مشترک رابط کاربری
│   │
│   ├── lib/                      # سرویس‌های هسته، امنیت و ابزارهای کمکی
│   │   ├── validations/            # اسکیماهای اعتبارسنجی Zod برای فرم‌ها و ورودی‌ها
│   │   ├── audit.ts                # سرویس ثبت تغییرناپذیر لاگ‌های امنیتی مدیران
│   │   ├── auth-guard.ts           # گاردهای امنیتی سرور (requireReadAccess و requireWriteAccess)
│   │   ├── auth.config.ts          # پیکربندی Edge-compatible احراز هویت
│   │   ├── auth.ts                 # تنظیمات کامل Auth.js و بررسی رمز عبور با Bcrypt
│   │   ├── db.ts                   # مدیریت اتصال کش‌شده (Singleton) به MongoDB
│   │   └── utils.ts                # توابع فرمت قیمت، تاریخ شمسی و تولید نامک (Slug)
│   │
│   ├── models/                   # مدل‌ها و اسکیماهای Mongoose
│   │   ├── AuditLog.ts             # مدل لاگ‌های امنیتی سیستم
│   │   ├── Brand.ts                # مدل برندهای تجاری محصولات
│   │   ├── Category.ts             # مدل دسته‌بندی‌های درختی
│   │   ├── Comment.ts              # مدل دیدگاه‌های چندریختی (Polymorphic)
│   │   ├── Coupon.ts               # مدل کدهای تخفیف
│   │   ├── Order.ts                # مدل سفارش‌ها و اقلام خریداری‌شده
│   │   ├── Post.ts                 # مدل مقالات وبلاگ
│   │   ├── Product.ts              # مدل محصولات و زیرمدل متغیرها (Variants)
│   │   ├── Setting.ts              # مدل تنظیمات کل فروشگاه
│   │   └── User.ts                 # مدل کاربران و نقش‌های چهارگانه (RBAC)
│   │
│   ├── scripts/
│   │   └── seed.ts               # اسکریپت جامع مقداردهی اولیه خودکار دیتابیس
│   │
│   ├── store/
│   │   └── cart.store.ts         # استور Zustand برای مدیریت پایدار سبد خرید در مرورگر
│   │
│   ├── types/
│   │   └── next-auth.d.ts        # توسعه تایپ‌های TypeScript برای Session و JWT در Auth.js
│   │
│   └── middleware.ts             # میدل‌ور امنیتی محافظت از مسیرهای پنل ادمین و صفحات ورود
│
├── .dockerignore                 # فایل‌های نادیده گرفته‌شده در بیلد داکر
├── .env.example                  # نمونه متغیرهای محیطی موردنیاز پروژه
├── .gitignore                    # فایل‌های نادیده گرفته‌شده در گیت
├── Dockerfile                    # تنظیمات بیلد چندمرحله‌ای (Multi-Stage) داکر
├── docker-compose.yml            # اجرای یکپارچه برنامه و دیتابیس MongoDB
├── next.config.ts                # تنظیمات Next.js 16، خروجی Standalone و Turbopack
├── package.json                  # وابستگی‌ها و اسکریپت‌های اجرایی پروژه
└── tsconfig.json                 # پیکربندی کامپایلر TypeScript
```

---

## 📜 اسکریپت‌های کاربردی (`package.json`)

| دستور | کاربرد |
| :--- | :--- |
| `npm run dev` | اجرای سرور توسعه با Turbopack روی پورت `3000` |
| `npm run seed` | پاک‌سازی و مقداردهی اولیه دیتابیس با داده‌های نمونه واقعی |
| `npm run build` | گرفتن خروجی نهایی (Production Build) و بررسی صحت تایپ‌ها |
| `npm run start` | اجرای نسخه بیلد شده در محیط پروداکشن |
| `npm run lint` | بررسی استانداردهای کدنویسی با ESLint |

---

## 👨‍💻 توسعه‌دهنده

طراحی و توسعه یافته توسط **محمدامین میری (Mohammad Amin Miri)**
* **گیت‌هاب:** [github.com/mohammadAmin-miri](https://github.com/mohammadAmin-miri)
* **وب‌سایت:** [viracraft.ir](https://viracraft.ir)

</div>