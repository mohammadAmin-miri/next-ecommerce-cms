'use client';

import { useState, useTransition } from 'react';
import { moderateCommentAction } from '@/actions/cms.actions';
import { CommentStatus } from '@/models/Comment';
import { Check, X, MessageSquareReply, Star, Loader2 } from 'lucide-react';

export interface SerializedComment {
  _id: string;
  targetType: 'PRODUCT' | 'POST';
  authorName: string;
  authorEmail: string;
  rating: number;
  content: string;
  adminReply: string;
  status: CommentStatus;
  createdAt: string;
}

export function CommentsTableClient({
  initialComments,
}: {
  initialComments: SerializedComment[];
}) {
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleModerate = (commentId: string, status: CommentStatus) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await moderateCommentAction({
        commentId,
        status,
        adminReply: replyText[commentId],
      });
      if (!res.success) {
        setFeedback(res.error || 'خطا در عملیات');
      } else {
        setActiveReplyId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {feedback}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">نویسنده</th>
              <th className="p-4">امتیاز</th>
              <th className="p-4">متن دیدگاه</th>
              <th className="p-4">وضعیت</th>
              <th className="p-4">تاریخ</th>
              <th className="p-4 text-left">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {initialComments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  هیچ دیدگاهی ثبت نشده است.
                </td>
              </tr>
            ) : (
              initialComments.map((c) => (
                <tr key={c._id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4">
                    <div className="font-medium text-white">{c.authorName}</div>
                    <div className="text-xs text-slate-500">{c.authorEmail}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{c.rating}</span>
                    </div>
                  </td>
                  <td className="p-4 max-w-md">
                    <p className="text-slate-200 leading-relaxed">{c.content}</p>
                    {c.adminReply && (
                      <div className="mt-2 p-2 rounded bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300">
                        <strong>پاسخ مدیر:</strong> {c.adminReply}
                      </div>
                    )}
                    {activeReplyId === c._id && (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          placeholder="پاسخ مدیریت را بنویسید..."
                          defaultValue={c.adminReply}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [c._id]: e.target.value,
                            }))
                          }
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                        <button
                          onClick={() => handleModerate(c._id, 'APPROVED')}
                          disabled={isPending}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs"
                        >
                          ثبت و تایید
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        c.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : c.status === 'REJECTED'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {c.status === 'APPROVED'
                        ? 'تایید شده'
                        : c.status === 'REJECTED'
                        ? 'رد شده'
                        : 'در انتظار بررسی'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-xs">{c.createdAt}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleModerate(c._id, 'APPROVED')}
                        disabled={isPending}
                        title="تایید دیدگاه"
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleModerate(c._id, 'REJECTED')}
                        disabled={isPending}
                        title="رد دیدگاه"
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveReplyId(activeReplyId === c._id ? null : c._id)
                        }
                        title="پاسخ به دیدگاه"
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                      >
                        <MessageSquareReply className="w-4 h-4" />
                      </button>
                    </div>
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