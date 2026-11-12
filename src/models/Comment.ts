import mongoose, { Schema, Document, Model } from 'mongoose';

export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IComment extends Document {
  targetType: 'PRODUCT' | 'POST';
  targetId: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  authorName: string;
  authorEmail: string;
  rating: number; // امتیاز ۱ تا ۵
  content: string;
  adminReply?: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    targetType: {
      type: String,
      enum: ['PRODUCT', 'POST'],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true, trim: true },
    authorEmail: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    content: { type: String, required: true, trim: true },
    adminReply: { type: String, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
  },
  { timestamps: true }
);

export const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);