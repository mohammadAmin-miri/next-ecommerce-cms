'use client';

import { useState, useTransition } from 'react';
import { updateUserAccessAction } from '@/actions/admin-extra.actions';
import { UserRole } from '@/models/User';
import {  Ban, CheckCircle2, Loader2 } from 'lucide-react';

export interface SerializedUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
  createdAt: string;
}

export function UsersTableClient({ users }: { users: SerializedUser[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = (userId: string, role: UserRole, isBanned: boolean) => {
    setError(null);
    startTransition(async () => {
      const res = await updateUserAccessAction({ userId, role, isBanned });
      if (!res.success) setError(res.error || 'خطا در تغییر وضعیت کاربر');
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">نام و ایمیل</th>
              <th className="p-4">نقش سیستمی (RBAC)</th>
              <th className="p-4">وضعیت حساب</th>
              <th className="p-4">تاریخ عضویت</th>
              <th className="p-4 text-left">تغییر وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-slate-800/30 transition">
                <td className="p-4">
                  <div className="font-bold text-white">{u.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                </td>
                <td className="p-4">
                  <select
                    disabled={isPending}
                    defaultValue={u.role}
                    onChange={(e) =>
                      handleUpdate(u._id, e.target.value as UserRole, u.isBanned)
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="ADMIN">ADMIN (مدیر ارشد)</option>
                    <option value="EDITOR">EDITOR (نویسنده)</option>
                    <option value="DEMO_ADMIN">DEMO_ADMIN (کارفرما)</option>
                    <option value="CUSTOMER">CUSTOMER (مشتری)</option>
                  </select>
                </td>
                <td className="p-4">
                  {u.isBanned ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-red-500/10 text-red-400">
                      <Ban className="w-3.5 h-3.5" /> مسدود شده
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> فعال
                    </span>
                  )}
                </td>
                <td className="p-4 text-xs text-slate-400">{u.createdAt}</td>
                <td className="p-4 text-left">
                  <button
                    disabled={isPending}
                    onClick={() => handleUpdate(u._id, u.role, !u.isBanned)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      u.isBanned
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : u.isBanned ? (
                      'رفع مسدودیت'
                    ) : (
                      'مسدود کردن'
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}