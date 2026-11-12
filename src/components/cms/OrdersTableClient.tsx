'use client';

import { useState, useTransition } from 'react';
import { formatPrice } from '@/lib/utils';
import { updateOrderStatusAction } from '@/actions/order.actions';
import { OrderStatus } from '@/models/Order';
import {
  Truck,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  PackageCheck,
} from 'lucide-react';

export interface SerializedOrder {
  _id: string;
  orderNumber: string;
  recipientName: string;
  phone: string;
  city: string;
  finalAmount: number;
  paymentStatus: string;
  orderStatus: OrderStatus;
  trackingCode: string;
  createdAt: string;
  itemsSummary: string;
}

export function OrdersTableClient({ orders }: { orders: SerializedOrder[] }) {
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(orders.map((o) => [o._id, o.trackingCode || '']))
  );
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdateOrder = (orderId: string, newStatus: OrderStatus) => {
    if (
      newStatus === 'CANCELLED' &&
      !window.confirm(
        'با لغو این سفارش، موجودی تمام اقلام آن به‌طور خودکار به انبار برگردانده می‌شود. ادامه می‌دهید؟'
      )
    ) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await updateOrderStatusAction({
        orderId,
        orderStatus: newStatus,
        trackingCode: trackingInputs[orderId],
      });

      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error || 'خطا در بروزرسانی سفارش',
        });
      } else {
        setFeedback({
          type: 'success',
          message:
            newStatus === 'CANCELLED'
              ? 'سفارش لغو شد و موجودی کالاها با موفقیت به انبار بازگشت.'
              : 'وضعیت سفارش و کد رهگیری با موفقیت بروزرسانی شد.',
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-xs">
              <tr>
                <th className="px-4 py-4">شماره سفارش</th>
                <th className="px-4 py-4">مشتری و مقصد</th>
                <th className="px-4 py-4">اقلام خریداری‌شده</th>
                <th className="px-4 py-4">مبلغ کل</th>
                <th className="px-4 py-4">کد رهگیری پستی</th>
                <th className="px-4 py-4">وضعیت و عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400 text-xs"
                  >
                    هنوز سفارشی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-blue-400 font-bold">
                      {order.orderNumber}
                      <div className="text-[11px] text-slate-500 font-normal mt-1">
                        {order.createdAt}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="font-semibold text-white">
                        {order.recipientName}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {order.city} | {order.phone}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-300 max-w-xs">
                      {order.itemsSummary}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-emerald-400 font-semibold">
                      {formatPrice(order.finalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          dir="ltr"
                          value={trackingInputs[order._id] || ''}
                          onChange={(e) =>
                            setTrackingInputs((prev) => ({
                              ...prev,
                              [order._id]: e.target.value,
                            }))
                          }
                          placeholder="کد ۲۴ رقمی پست..."
                          className="w-36 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                        />
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleUpdateOrder(order._id, order.orderStatus)
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                          title="ذخیره کد رهگیری"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          disabled={isPending}
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleUpdateOrder(
                              order._id,
                              e.target.value as OrderStatus
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                            order.orderStatus === 'DELIVERED'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : order.orderStatus === 'SHIPPED'
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                              : order.orderStatus === 'CANCELLED'
                              ? 'bg-red-500/10 border-red-500/30 text-red-300'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          }`}
                        >
                          <option value="PROCESSING" className="bg-slate-900">
                            در حال پردازش
                          </option>
                          <option value="SHIPPED" className="bg-slate-900">
                            ارسال شده
                          </option>
                          <option value="DELIVERED" className="bg-slate-900">
                            تحویل شده
                          </option>
                          <option value="CANCELLED" className="bg-slate-900">
                            لغو شده (بازگشت موجودی)
                          </option>
                        </select>
                        {isPending && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}