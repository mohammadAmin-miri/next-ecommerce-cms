'use server';

import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { requireWriteAccess, AuthGuardError } from '@/lib/auth-guard';
import { Product } from '@/models/Product';
import { Order, OrderStatus, PaymentStatus, IShippingAddress } from '@/models/Order';
import { Coupon } from '@/models/Coupon';

export interface CheckoutItemInput {
  productId: string;
  variantSku: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: CheckoutItemInput[];
  shippingAddress: IShippingAddress;
  shippingMethod?: string;
  shippingCost?: number;
  couponCode?: string;
  idempotencyKey: string;
}

/**
 * ۱. بررسی اعتبار کد تخفیف در سبد خرید
 */
export async function validateCouponAction(code: string, subtotal: number) {
  try {
    await connectDB();
    const cleanCode = code.trim().toUpperCase();

    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true }).lean();
    if (!coupon) {
      return { success: false, error: 'کد تخفیف وارد شده معتبر نیست.' };
    }

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.expiresAt)) {
      return { success: false, error: 'مهلت استفاده از این کد تخفیف به پایان رسیده است.' };
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return { success: false, error: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است.' };
    }

    if (subtotal < coupon.minOrderAmount) {
      return {
        success: false,
        error: `حداقل مبلغ سبد خرید برای این کد ${coupon.minOrderAmount.toLocaleString('fa-IR')} تومان است.`,
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.floor((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    return {
      success: true,
      code: coupon.code,
      discountAmount: Math.min(discountAmount, subtotal),
    };
  } catch {
    return { success: false, error: 'خطا در بررسی کد تخفیف' };
  }
}

/**
 * ۲. ثبت سفارش و کسر اتمیک موجودی انبار با MongoDB Transaction
 */
export async function createOrderWithTransaction(input: CreateOrderInput) {
  await connectDB();

  // الف) بررسی Idempotency برای جلوگیری از ثبت سفارش تکراری در دابل‌کلیک
  const existingOrder = await Order.findOne({
    idempotencyKey: input.idempotencyKey,
  }).lean();

  if (existingOrder) {
    return {
      success: true,
      orderId: existingOrder._id.toString(),
      orderNumber: existingOrder.orderNumber,
      duplicate: true,
    };
  }

  const authSession = await auth();
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    let subtotalAmount = 0;
    const processedItems = [];

    // ب) کسر اتمیک موجودی هر متغیر (Variant) فقط در صورت کافی بودن موجودی
    for (const item of input.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          status: 'PUBLISHED',
          variants: {
            $elemMatch: {
              sku: item.variantSku,
              stock: { $gte: item.quantity },
            },
          },
        },
        {
          $inc: {
            'variants.$.stock': -item.quantity,
            totalStock: -item.quantity,
          },
        },
        { new: true, session: dbSession }
      );

      if (!updatedProduct) {
        throw new Error(
          `موجودی کالا با کد تنوع (${item.variantSku}) در انبار کافی نیست یا محصول غیرفعال شده است.`
        );
      }

      const matchedVariant = updatedProduct.variants.find(
        (v) => v.sku === item.variantSku
      );

      const baseUnit = updatedProduct.discountPrice ?? updatedProduct.basePrice;
      const unitPrice = baseUnit + (matchedVariant?.priceDiff || 0);

      subtotalAmount += unitPrice * item.quantity;

      processedItems.push({
        product: updatedProduct._id,
        title: updatedProduct.title,
        variantSku: item.variantSku,
        color: matchedVariant?.color,
        size: matchedVariant?.size,
        priceAtPurchase: unitPrice,
        quantity: item.quantity,
      });
    }

    // ج) بررسی و اعمال کوپن تخفیف در داخل همان تراکنش
    let discountAmount = 0;
    if (input.couponCode) {
      const coupon = await Coupon.findOneAndUpdate(
        {
          code: input.couponCode.toUpperCase(),
          isActive: true,
          expiresAt: { $gt: new Date() },
          $expr: { $lt: ['$usedCount', '$usageLimit'] },
        },
        { $inc: { usedCount: 1 } },
        { new: true, session: dbSession }
      );

      if (coupon && subtotalAmount >= coupon.minOrderAmount) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = Math.floor((subtotalAmount * coupon.discountValue) / 100);
          if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const shippingCost = input.shippingCost ?? 0;
    const finalAmount = Math.max(0, subtotalAmount - discountAmount + shippingCost);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    // د) ایجاد سند سفارش (با پرداخت آزمایشی موفق PAID در درگاه Mock)
    const [createdOrder] = await Order.create(
      [
        {
          orderNumber,
          user: authSession?.user?.id ? authSession.user.id : null,
          orderItems: processedItems,
          shippingAddress: input.shippingAddress,
          shippingMethod: input.shippingMethod || 'پست پیشتاز',
          shippingCost,
          subtotalAmount,
          discountAmount,
          couponCode: input.couponCode,
          finalAmount,
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          idempotencyKey: input.idempotencyKey,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    revalidatePath('/admin/orders');
    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath('/products');

    return {
      success: true,
      orderId: createdOrder._id.toString(),
      orderNumber: createdOrder.orderNumber,
    };
  } catch (error) {
    await dbSession.abortTransaction();
    const message =
      error instanceof Error ? error.message : 'خطا در ثبت سفارش و تراکنش انبار';
    return { success: false, error: message };
  } finally {
    dbSession.endSession();
  }
}

/**
 * ۳. تغییر وضعیت سفارش، ثبت کد رهگیری و بازگشت خودکار موجودی به انبار در صورت لغو
 */
export async function updateOrderStatusAction(params: {
  orderId: string;
  orderStatus: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingCode?: string;
  adminNote?: string;
}) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    await requireWriteAccess(['ADMIN', 'EDITOR']);
    await connectDB();

    const order = await Order.findById(params.orderId).session(dbSession);
    if (!order) {
      throw new Error('سفارش مورد نظر یافت نشد.');
    }

    const wasCancelled = order.orderStatus === 'CANCELLED';
    const isNowCancelled = params.orderStatus === 'CANCELLED';

    // اگر سفارش برای اولین بار به وضعیت CANCELLED تغییر کرد، موجودی کالاها به انبار برگردانده شود
    if (!wasCancelled && isNowCancelled) {
      for (const item of order.orderItems) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'variants.sku': item.variantSku },
          {
            $inc: {
              'variants.$.stock': item.quantity,
              totalStock: item.quantity,
            },
          },
          { session: dbSession }
        );
      }
    }

    order.orderStatus = params.orderStatus;
    if (params.paymentStatus) order.paymentStatus = params.paymentStatus;
    if (params.trackingCode !== undefined) order.trackingCode = params.trackingCode;
    if (params.adminNote !== undefined) order.adminNote = params.adminNote;

    await order.save({ session: dbSession });
    await dbSession.commitTransaction();

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${params.orderId}`);
    revalidatePath('/admin/products');

    return { success: true };
  } catch (error) {
    await dbSession.abortTransaction();
    if (error instanceof AuthGuardError) {
      return { success: false, error: error.message, code: error.code };
    }
    const message =
      error instanceof Error ? error.message : 'خطا در بروزرسانی وضعیت سفارش';
    return { success: false, error: message };
  } finally {
    dbSession.endSession();
  }
}