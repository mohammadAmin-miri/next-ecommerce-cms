import { auth } from '@/lib/auth';
import { connection } from 'next/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import { getDashboardStats, getSalesChartData, getTopProducts } from '@/actions/analytics.actions';
import { SalesChart } from '@/components/cms/SalesChart';

const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price);

// سازگاری با Next.js 16 (PPR)
export const instant = false;

export default async function DashboardPage() {
  await connection(); // جلوگیری قطعی از Prerender شدن داده‌های داینامیک
  const session = await auth();

  // اجرای موازی کوئری‌ها برای افزایش سرعت لود
  const [stats, chartData, topProducts] = await Promise.all([
    getDashboardStats(),
    getSalesChartData(),
    getTopProducts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">داشبورد مدیریت</h1>
        <p className="text-sm text-slate-400 mt-1">
          خوش آمدید، {session?.user?.name || 'مدیر عزیز'}. نمای کلی از وضعیت فروشگاه را مشاهده می‌کنید.
        </p>
      </div>

      {/* بخش ۱: کارت‌های آماری */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">درآمد کل</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatPrice(stats.totalRevenue)} <span className="text-sm font-normal text-slate-500">تومان</span></div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">کل سفارشات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">محصولات فروشگاه</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">هشدار موجودی</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-slate-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.lowStockCount}</div>
            <p className="text-xs text-slate-500 mt-1">کالا با موجودی زیر ۵ عدد</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* بخش ۲: نمودار فروش */}
        <Card className="col-span-1 lg:col-span-4 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white">روند درآمد (۳۰ روز گذشته)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={chartData} />
          </CardContent>
        </Card>

        {/* بخش ۳: محصولات پرفروش */}
        <Card className="col-span-1 lg:col-span-3 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              پرفروش‌ترین محصولات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-4">
              {topProducts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center">هنوز محصولی فروخته نشده است.</p>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-400">
                        {index + 1}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none text-white">{product.title}</p>
                        <p className="text-xs text-slate-500">
                          {product.totalSold} عدد فروخته شده
                        </p>
                      </div>
                    </div>
                    <div className="font-medium text-emerald-400 text-sm">
                      {formatPrice(product.totalRevenue)} 
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}