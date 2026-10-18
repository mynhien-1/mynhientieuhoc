import React, { useEffect, useState } from 'react';
import { localDb } from '../services/localDb';
import { SystemNotification } from '../types';
import { Bell, Check, Clock, AlertTriangle, FileText, CheckCircle2, X } from 'lucide-react';

interface Props {
  userUid: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument?: (docId: string) => void;
}

export const NotificationDrawer: React.FC<Props> = ({ userUid, isOpen, onClose, onSelectDocument }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userUid) return;

    const syncNotifs = () => {
      const items = localDb.getNotifications(userUid);
      setNotifications(items);
      setLoading(false);
    };

    syncNotifs();
    const unsubscribe = localDb.subscribe(syncNotifs);
    return () => unsubscribe();
  }, [userUid]);

  const markAsRead = (id: string) => {
    localDb.markNotificationAsRead(userUid, id);
  };

  const markAllAsRead = () => {
    localDb.markAllNotificationsAsRead(userUid);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-purple-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-sky-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hộp thư thông báo</h3>
              <p className="text-[11px] text-slate-500">
                {unreadCount > 0 ? `Có ${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-purple-700 hover:text-purple-900 hover:bg-purple-100/60 font-semibold px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Đánh dấu tất cả là đã đọc"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Đã đọc hết</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400 animate-pulse">
              Đang tải danh sách thông báo...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 bg-purple-50 text-purple-400 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-purple-300" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Hộp thư trống</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Bạn sẽ nhận được thông báo ngay khi có hồ sơ mới cần duyệt hoặc khi hồ sơ của bạn được phản hồi.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const iconMap: Record<string, React.ReactNode> = {
                submission: <FileText className="w-4 h-4 text-indigo-500" />,
                approval: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                rejection: <AlertTriangle className="w-4 h-4 text-rose-500" />,
                revision_request: <Clock className="w-4 h-4 text-amber-500" />,
                reminder: <Bell className="w-4 h-4 text-purple-500" />,
                deadline: <Clock className="w-4 h-4 text-amber-500" />,
                review: <FileText className="w-4 h-4 text-indigo-500" />,
                revision: <Clock className="w-4 h-4 text-amber-500" />,
                system: <Bell className="w-4 h-4 text-purple-500" />,
              };

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) markAsRead(notif.id);
                    if (notif.linkDocId && onSelectDocument) {
                      onSelectDocument(notif.linkDocId);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-2xl border transition cursor-pointer text-left ${
                    notif.isRead
                      ? 'bg-white hover:bg-slate-50 border-slate-100 shadow-2xs'
                      : 'bg-purple-50/70 hover:bg-purple-50 border-purple-200/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                      {iconMap[notif.type] || <Bell className="w-4 h-4 text-purple-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold truncate ${notif.isRead ? 'text-slate-800' : 'text-purple-950'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                        <span>{new Date(notif.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                        {notif.linkDocId && (
                          <span className="text-purple-600 font-semibold hover:underline">
                            Xem hồ sơ →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-purple-50 bg-slate-50 text-center text-[10px] text-slate-400">
          Hệ thống hồ sơ chuyên môn số • Dữ liệu cục bộ
        </div>
      </div>
    </div>
  );
};
