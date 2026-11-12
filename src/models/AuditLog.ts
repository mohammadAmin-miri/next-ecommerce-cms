import mongoose, { Schema, Document, Model } from 'mongoose';

export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'LOGIN'
  | 'SEED';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: AuditActionType;
  entityType: 'PRODUCT' | 'ORDER' | 'CATEGORY' | 'POST' | 'COMMENT' | 'SYSTEM';
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'SEED'],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['PRODUCT', 'ORDER', 'CATEGORY', 'POST', 'COMMENT', 'SYSTEM'],
      required: true,
      index: true,
    },
    entityId: { type: String },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);