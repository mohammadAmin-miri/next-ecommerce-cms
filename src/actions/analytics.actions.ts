'use server';

import { connectDB } from '@/lib/db';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { requireReadAccess } from '@/lib/auth-guard';

export async function getDashboardStats() {
  await requireReadAccess(['ADMIN', 'EDITOR', 'DEMO_ADMIN']);
  await connectDB();

  const revenueResult = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'CANCELLED' } } },
    { $group: { _id: null, total: { $sum: '$finalAmount' } } },
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  const totalOrders = await Order.countDocuments({
    orderStatus: { $ne: 'CANCELLED' },
  });

  const totalProducts = await Product.countDocuments();

  const lowStockCount = await Product.countDocuments({
    totalStock: { $lt: 5 },
  });

  return { totalRevenue, totalOrders, totalProducts, lowStockCount };
}

// ۲. دریافت داده‌های نمودار فروش ۳۰ روز اخیر
export async function getSalesChartData() {
  await requireReadAccess(['ADMIN', 'EDITOR', 'DEMO_ADMIN']);
  await connectDB();

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const sales = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: last30Days },
        orderStatus: { $ne: 'CANCELLED' },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$finalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return sales.map((s) => ({
    date: s._id,
    revenue: s.revenue,
    orders: s.orders,
  }));
}

// ۳. دریافت ۵ محصول پرفروش
export async function getTopProducts() {
  await requireReadAccess(['ADMIN', 'EDITOR', 'DEMO_ADMIN']);
  await connectDB();

  const topProducts = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'CANCELLED' } } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        title: { $first: '$orderItems.title' },
        totalSold: { $sum: '$orderItems.quantity' },
        totalRevenue: {
          $sum: {
            $multiply: ['$orderItems.priceAtPurchase', '$orderItems.quantity'],
          },
        },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  return topProducts.map((p) => ({
    id: p._id.toString(),
    title: p.title,
    totalSold: p.totalSold,
    totalRevenue: p.totalRevenue,
  }));
}