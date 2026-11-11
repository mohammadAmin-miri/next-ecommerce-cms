import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  parentCategory?: mongoose.Types.ObjectId | null;
  image?: string;
  description?: string;
  isActive: boolean;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    image: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    seo: {
      metaTitle: String,
      metaDescription: String,
    },
  },
  { timestamps: true }
);

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);