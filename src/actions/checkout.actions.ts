'use server';

import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { Coupon } from '@/models/Coupon';
import { User } from '@/models/User';
import { recordAuditLog } from '@/lib/audit';

export async function validateCouponCodeAction(code: string) {
  try {
    await connectDB();
    const normalized = code.toUpperCase().trim();
    if (!normalized) {
      return { success: false, error: 'لطفاً کد تخفیف را وارد کنید.' };
    }

    const coupon = await Coupon.findOne({
      code: normalized,
      isActive: true,
    }).lean();

    if (!coupon) {
      return { success: false, error: 'کد تخفیف وارد شده معتبر نیست.' };
    }

    if (new Date(coupon.expiresAt) < new Date()) {
      return { success: false, error: 'مهلت استفاده از این کد تخفیف به پایان رسیده است.' };
    }

    if (coupon.usedCount >= coupon.maxUsage) {
      return { success: false, error: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است.' };
    }

    return {
      success: true,
      discountPercent: coupon.discountPercent,
      code: coupon.code,
    };
  } catch {
    return { success: false, error: 'خطا در بررسی کد تخفیف' };
  }
}

export interface PlaceOrderInput {
  items: {
    productId: string;
    variantSku: string;
    title: string;
    unitPrice: number;
    quantity: number;
  }[];
  shippingAddress: {
    recipientName: string;
    phone: string;
    city: string;
    fullAddress: string;
    postalCode: string;
  };
  shippingMethod: string;
  couponCode?: string;
  idempotencyKey: string;
}

export async function placeCheckoutOrderAction(input: PlaceOrderInput) {
  try {
    await connectDB();

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'سبد خرید شما خالی است.' };
    }

    // جلوگیری از ثبت سفارش تکراری
    const duplicateOrder = await Order.findOne({
      idempotencyKey: input.idempotencyKey,
    }).lean();

    if (duplicateOrder) {
      return {
        success: true,
        orderNumber: duplicateOrder.orderNumber,
      };
    }

    const session = await auth();
    let userId: Types.ObjectId | undefined =
      session?.user?.id && Types.ObjectId.isValid(session.user.id)
        ? new Types.ObjectId(session.user.id)
        : undefined;

    if (!userId) {
      const fallbackUser = await User.findOne({}).select('_id').lean();
      userId = fallbackUser?._id as Types.ObjectId | undefined;
    }

    let subtotalAmount = 0;
    const verifiedOrderItems = [];

    for (const item of input.items) {
      const normalizedSku = item.variantSku?.trim() || '';

      // ۱. پیدا کردن محصول (ابتدا با _id، و اگر به خاطر Seed مجدد عوض شده بود، با SKU یا عنوان)
      let productDoc = Types.ObjectId.isValid(item.productId)
        ? await Product.findById(item.productId)
        : null;

      if (!productDoc && normalizedSku) {
        productDoc = await Product.findOne({
          $or: [
            { 'variants.sku': normalizedSku },
            { 'variants.sku': normalizedSku.toUpperCase() },
            { sku: normalizedSku },
          ],
        });
      }

      if (!productDoc && item.title) {
        productDoc = await Product.findOne({ title: item.title });
      }

      if (!productDoc) {
        return {
          success: false,
          error: `کالای «${item.title}» در دیتابیس یافت نشد (لطفاً سبد خرید را خالی کرده و مجدداً کالا را اضافه کنید).`,
        };
      }

      // ۲. بررسی و کسر موجودی متغیر (در صورتی که محصول دارای variants باشد)
      if (productDoc.variants && productDoc.variants.length > 0) {
        const variantIndex = productDoc.variants.findIndex(
          (v) =>
            v.sku.toLowerCase() === normalizedSku.toLowerCase()
        );

        // اگر SKU متغیر پیدا شد، موجودی همان متغیر را چک و کم کن
        if (variantIndex > -1) {
          const targetVariant = productDoc.variants[variantIndex];
          if (targetVariant.stock < item.quantity) {
            return {
              success: false,
              error: `موجودی متغیر «${targetVariant.sku}» برای کالای «${productDoc.title}» کافی نیست (موجودی فعلی: ${targetVariant.stock} عدد).`,
            };
          }
          productDoc.variants[variantIndex].stock -= item.quantity;
        } else {
          // اگر متغیر اول موجودی داشت از همان کم کن
          if (productDoc.variants[0].stock < item.quantity) {
            return {
              success: false,
              error: `موجودی انبار برای کالای «${productDoc.title}» کافی نیست.`,
            };
          }
          productDoc.variants[0].stock -= item.quantity;
        }

        // بروزرسانی جمع کل موجودی بر اساس جمع متغیرها
        productDoc.totalStock = productDoc.variants.reduce(
          (sum, v) => sum + Math.max(0, v.stock),
          0
        );
      } else {
        // ۳. اگر محصول بدون متغیر بود، مستقیماً از totalStock کم کن
        if (productDoc.totalStock < item.quantity) {
          return {
            success: false,
            error: `موجودی انبار برای کالای «${productDoc.title}» کافی نیست (موجودی فعلی: ${productDoc.totalStock} عدد).`,
          };
        }
        productDoc.totalStock -= item.quantity;
      }

      await productDoc.save();

      subtotalAmount += item.unitPrice * item.quantity;
      verifiedOrderItems.push({
        product: productDoc._id,
        variantSku: normalizedSku || productDoc.sku || 'DEFAULT-SKU',
        title: productDoc.title,
        priceAtPurchase: item.unitPrice,
        quantity: item.quantity,
      });
    }

    // محاسبه کد تخفیف
    let discountAmount = 0;
    if (input.couponCode) {
      const coupon = await Coupon.findOneAndUpdate(
        {
          code: input.couponCode.toUpperCase().trim(),
          isActive: true,
          expiresAt: { $gt: new Date() },
          $expr: { $lt: ['$usedCount', '$maxUsage'] },
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      );

      if (coupon) {
        discountAmount = Math.round((subtotalAmount * coupon.discountPercent) / 100);
      }
    }

    const freeShippingThreshold = 5000000;
    const shippingCost =
      subtotalAmount >= freeShippingThreshold
        ? 0
        : input.shippingMethod === 'پیک موتوری ویژه (تهران)'
        ? 75000
        : 45000;

    const finalAmount = Math.max(0, subtotalAmount - discountAmount + shippingCost);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const createdOrder = await Order.create({
      orderNumber,
      user: userId,
      orderItems: verifiedOrderItems,
      shippingAddress: input.shippingAddress,
      shippingMethod: input.shippingMethod,
      shippingCost,
      subtotalAmount,
      discountAmount,
      finalAmount,
      paymentStatus: 'PAID',
      orderStatus: 'PROCESSING',
      idempotencyKey: input.idempotencyKey,
    });

    await recordAuditLog({
      actorId: userId?.toString(),
      actorName: input.shippingAddress.recipientName,
      actorRole: session?.user?.role || 'CUSTOMER',
      action: 'CREATE',
      entityType: 'ORDER',
      entityId: createdOrder._id.toString(),
      description: `ثبت سفارش جدید به شماره ${orderNumber} به مبلغ ${finalAmount.toLocaleString()} تومان`,
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/orders');
    revalidatePath('/admin/products');
    revalidatePath('/products');

    return {
      success: true,
      orderNumber: createdOrder.orderNumber,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'خطای سرور در ثبت سفارش';
    console.error('❌ Checkout Error:', msg);
    return {
      success: false,
      error: `خطا در ثبت سفارش: ${msg}`,
    };
  }
}