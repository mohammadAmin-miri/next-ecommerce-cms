import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Order, IOrderItem, IShippingAddress, OrderStatus } from '@/models/Order';
import {
  OrdersTableClient,
  SerializedOrder,
} from '@/components/cms/OrdersTableClient';

interface LeanOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  orderItems: IOrderItem[];
  shippingAddress: IShippingAddress;
  finalAmount: number;
  paymentStatus: string;
  orderStatus: OrderStatus;
  trackingCode?: string;
  createdAt: Date;
}

export default async function AdminOrdersPage() {
  await connectDB();

  const rawOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .lean<LeanOrder[]>();

  const serializedOrders: SerializedOrder[] = rawOrders.map((o) => ({
    _id: o._id.toString(),
    orderNumber: o.orderNumber,
    recipientName: o.shippingAddress.recipientName,
    phone: o.shippingAddress.phone,
    city: o.shippingAddress.city,
    finalAmount: o.finalAmount,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    trackingCode: o.trackingCode || '',
    createdAt: new Date(o.createdAt).toLocaleDateString('fa-IR'),
    itemsSummary: o.orderItems
      .map((i) => `${i.title} (${i.variantSku}) × ${i.quantity}`)
      .join(' ، '),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          مدیریت سفارش‌ها و انبار
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          بررسی فاکتورها، ثبت کد رهگیری مرسولات پستی و مدیریت بازگشت کالا به انبار
        </p>
      </div>

      <OrdersTableClient orders={serializedOrders} />
    </div>
  );
}