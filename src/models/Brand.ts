import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    logo: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Brand: Model<IBrand> =
  mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);