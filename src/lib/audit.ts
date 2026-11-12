import { connectDB } from '@/lib/db';
import { AuditLog, AuditActionType } from '@/models/AuditLog';

interface LogParams {
  actorId?: string;
  actorName: string;
  actorRole: string;
  action: AuditActionType;
  entityType: 'PRODUCT' | 'ORDER' | 'CATEGORY' | 'POST' | 'COMMENT' | 'SYSTEM';
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function recordAuditLog(params: LogParams) {
  try {
    await connectDB();
    await AuditLog.create(params);
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}