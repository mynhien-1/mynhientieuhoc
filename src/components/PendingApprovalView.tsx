import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, LogOut, CheckCircle, Mail, School } from 'lucide-react';
import { INITIAL_ADMIN_EMAIL } from '../constants';

export const PendingApprovalView: React.FC = () => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100/70 via-sky-50/70 to-indigo-100/60 flex flex-col justify-center items-center px-4 py-12 text-slate-800">
      <div className="max-w-md w-full bg-white/95 rounded-3xl shadow-xl shadow-purple-100/50 border border-purple-100 overflow-hidden backdrop-blur-md">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xs rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-xs">
            <School className="w-8 h-8 text-amber-200" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Hồ Sơ Chuyên Môn Số</h2>
          <p className="text-sky-100 text-sm mt-1">Trường Tiểu Học Ba Chúc</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 mb-6">
            <Clock className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 text-sm">Tài khoản đang chờ phê duyệt</h3>
              <p className="text-amber-700 text-xs mt-0.5">
                Quản trị viên nhà trường cần kích hoạt và gán Tổ khối trước khi bạn có thể truy cập hệ thống.
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-gradient-to-br from-purple-50/50 to-sky-50/50 p-4 rounded-2xl border border-purple-100 text-sm mb-6">
            <div className="flex justify-between py-1 border-b border-purple-100/80">
              <span className="text-slate-500">Họ và tên:</span>
              <span className="font-semibold text-purple-950">{currentUser?.displayName || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-purple-100/80">
              <span className="text-slate-500">Email:</span>
              <span className="font-medium text-slate-700">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-purple-100/80">
              <span className="text-slate-500">Vai trò mong muốn:</span>
              <span className="font-medium text-purple-700">Giáo viên / Nhân viên trường</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Trạng thái:</span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-semibold border border-amber-200">
                Chờ duyệt
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 mb-6">
            <p className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              Đảm bảo bảo mật tài liệu chuyên môn và phân quyền theo 5 tổ khối.
            </p>
            <p className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-sky-500 shrink-0" />
              Email quản trị viên đầu tiên:{' '}
              <span className="font-mono text-purple-900 font-semibold">{INITIAL_ADMIN_EMAIL}</span>
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-purple-200 text-purple-700 hover:bg-purple-50 transition font-semibold text-sm cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất tài khoản
          </button>
        </div>
      </div>
    </div>
  );
};
