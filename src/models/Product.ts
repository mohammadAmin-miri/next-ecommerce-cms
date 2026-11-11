import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVariant {
  sku: string;
  color?: string;
  size?: string;
  stock: number;
  priceDiff: number; // اختلاف قیمت نسبت به قیمت پایه
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  sku: string;
  description: string;
  basePrice: number;
  discountPrice?: number;
  categories: mongoose.Types.ObjectId[];
  brand?: mongoose.Types.ObjectId;
  images: string[];
  variants: IVariant[];
  totalStock: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>({
  sku: { type: String, required: true, uppercase: true },
  color: { type: String, trim: true },
  size: { type: String, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  priceDiff: { type: Number, default: 0 },
});

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, index: true },
    description: { type: String, required: true },
    basePrice: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', index: true },
    images: [{ type: String }],
    variants: [VariantSchema],
    totalStock: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    seo: {
      metaTitle: String,
      metaDescription: String,
      canonicalUrl: String,
    },
  },
  { timestamps: true }
);

// ایندکس ترکیبی برای جستجوی متنی سریع در عنوان و کد محصول
ProductSchema.index({ title: 'text', sku: 'text' });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);