import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { AuditLog, AuditActionType } from '@/models/AuditLog';
import { ShieldAlert, Activity } from 'lucide-react';

export const instant = false;

interface LeanAuditLog {
  _id: Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: AuditActionType;
  entityType: string;
  entityId?: string;
  description: string;
  createdAt: Date;
}

export default async function AuditLogsPage() {
  await connection();
  await connectDB();

  const logs = await AuditLog.find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .lean<LeanAuditLog[]>();

  const getBadgeStyle = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'UPDATE':
      case 'STATUS_CHANGE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            گزارش وقایع امنیتی (Audit Logs)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            رصد لحظه‌ای تمامی تغییرات، حذف‌ها و فعالیت‌های مدیران سیستم
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">انجام‌دهنده</th>
              <th className="p-4">نوع عملیات</th>
              <th className="p-4">بخش</th>
              <th className="p-4">توضیحات دقیق</th>
              <th className="p-4">تاریخ و ساعت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  هنوز هیچ لاگ امنیتی ثبت نشده است.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id.toString()} className="hover:bg-slate-800/30 transition">
                  <td className="p-4">
                    <div className="font-medium text-white">{log.actorName}</div>
                    <div className="text-xs text-slate-500">{log.actorRole}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeStyle(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 font-mono text-xs">
                    {log.entityType}
                  </td>
                  <td className="p-4 text-slate-200 max-w-md">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{log.description}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400 text-xs">
                    {new Date(log.createdAt).toLocaleString('fa-IR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}