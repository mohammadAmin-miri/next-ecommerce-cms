import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { UsersTableClient, SerializedUser } from '@/components/cms/UsersTableClient';
import { Users } from 'lucide-react';

export const instant = false;

export default async function AdminUsersPage() {
  await connection();
  await connectDB();

  const rawUsers = await User.find({})
    .sort({ createdAt: -1 })
    .lean<{
      _id: Types.ObjectId;
      name: string;
      email: string;
      role: UserRole;
      isBanned: boolean;
      createdAt: Date;
    }[]>();

  const serialized: SerializedUser[] = rawUsers.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    isBanned: Boolean(u.isBanned),
    createdAt: new Date(u.createdAt).toLocaleDateString('fa-IR'),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          مدیریت کاربران و سطوح دسترسی (RBAC)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          مشاهده اعضای فروشگاه، ارتقای نقش کاربری و مدیریت حساب‌های مسدود شده
        </p>
      </div>

      <UsersTableClient users={serialized} />
    </div>
  );
}