import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'ADMIN' | 'DEMO_ADMIN' | 'EDITOR' | 'CUSTOMER';

export interface IAddress {
  title: string;
  city: string;
  fullAddress: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isBanned: boolean;
  twoFactorEnabled: boolean;
  addresses: IAddress[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    title: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['ADMIN', 'DEMO_ADMIN', 'EDITOR', 'CUSTOMER'],
      default: 'CUSTOMER',
      index: true,
    },
    isBanned: { type: Boolean, default: false, index: true },
    twoFactorEnabled: { type: Boolean, default: false },
    addresses: { type: [AddressSchema], default: [] },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);