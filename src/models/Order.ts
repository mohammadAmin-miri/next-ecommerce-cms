import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type OrderStatus =
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  title: string;
  variantSku: string;
  color?: string;
  size?: string;
  priceAtPurchase: number;
  quantity: number;
}

export interface IShippingAddress {
  recipientName: string;
  phone: string;
  city: string;
  fullAddress: string;
  postalCode: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user?: mongoose.Types.ObjectId | null;
  orderItems: IOrderItem[];
  shippingAddress: IShippingAddress;
  shippingMethod: string;
  shippingCost: number;
  subtotalAmount: number;
  discountAmount: number;
  couponCode?: string;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  trackingCode?: string;
  adminNote?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    variantSku: { type: String, required: true },
    color: { type: String },
    size: { type: String },
    priceAtPurchase: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    orderItems: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    shippingMethod: { type: String, default: 'پست پیشتاز' },
    shippingCost: { type: Number, default: 0, min: 0 },
    subtotalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String },
    finalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PROCESSING',
      index: true,
    },
    trackingCode: { type: String, trim: true },
    adminNote: { type: String },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);