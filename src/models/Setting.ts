import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISetting extends Document {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  shippingCost: number;
  freeShippingThreshold: number;
  taxPercent: number;
  maintenanceMode: boolean;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    storeName: { type: String, default: 'نکست‌استور' },
    supportPhone: { type: String, default: '021-88000000' },
    supportEmail: { type: String, default: 'support@example.com' },
    shippingCost: { type: Number, default: 45000 },
    freeShippingThreshold: { type: Number, default: 2000000 },
    taxPercent: { type: Number, default: 9 },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Setting: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);