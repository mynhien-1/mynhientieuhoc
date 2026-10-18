import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  UploadCloud,
  FileCheck2,
  CalendarClock,
  BarChart3,
  Users2,
  FolderTree,
  UserCog,
  HelpCircle,
  X,
  School,
  ExternalLink,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'submit'
  | 'documents'
  | 'reminders'
  | 'reports'
  | 'departments'
  | 'categories'
  | 'users'
  | 'guide';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { userProfile, isAdmin, isVicePrincipal, isLead } = useAuth();

  const handleNav = (tab: ActiveTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Tổng quan',
      icon: LayoutDashboard,
      roles: ['admin', 'vice_principal', 'lead', 'teacher'],
    },
    {
      id: 'documents' as const,
      label: 'Quản lí hồ sơ chuyên môn',
      icon: FileCheck2,
      roles: ['admin', 'vice_principal', 'lead', 'teacher'],
      badge: isVicePrincipal ? 'Toàn trường' : isLead ? 'Tổ khối' : 'Cá nhân',
    },
    {
      id: 'submit' as const,
      label: 'Cổng nộp hồ sơ',
      icon: UploadCloud,
      roles: ['admin', 'vice_principal', 'lead', 'teacher'],
    },
    {
      id: 'reminders' as const,
      label: 'Nhắc việc & Hạn nộp',
      icon: CalendarClock,
      roles: ['admin', 'vice_principal', 'lead', 'teacher'],
    },
    {
      id: 'reports' as const,
      label: 'Báo cáo & Thống kê',
      icon: BarChart3,
      roles: ['admin', 'vice_principal', 'lead'],
    },
    {
      section: 'QUẢN TRỊ CHUYÊN MÔN',
    },
    {
      id: 'departments' as const,
      label: '5 Tổ khối chuyên môn',
      icon: Users2,
      roles: ['admin', 'vice_principal', 'lead'],
    },
    {
      id: 'categories' as const,
      label: 'Danh mục loại hồ sơ',
      icon: FolderTree,
      roles: ['admin', 'vice_principal'],
    },
    {
      id: 'users' as const,
      label: 'Phân quyền & Tài khoản',
      icon: UserCog,
      roles: ['admin'],
      highlight: true,
    },
    {
      section: 'HỖ TRỢ',
    },
    {
      id: 'guide' as const,
      label: 'Hướng dẫn & Bảo mật',
      icon: HelpCircle,
      roles: ['admin', 'vice_principal', 'lead', 'teacher'],
    },
  ];

  const userRole = userProfile?.role || 'teacher';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-gradient-to-b from-purple-50/95 via-sky-50/80 to-indigo-50/90 text-slate-700 border-r border-purple-200/70 shadow-sm flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 backdrop-blur-md ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-purple-100/80 bg-white/70 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-400 via-indigo-400 to-sky-400 flex items-center justify-center text-white shadow-xs">
              <School className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <span className="font-bold text-purple-950 text-sm tracking-wide block leading-none">
                HỒ SƠ SỐ
              </span>
              <span className="text-[10px] text-sky-600 font-semibold tracking-wider uppercase mt-1 block">
                Tiểu học Ba Chúc
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-purple-700 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item, idx) => {
            if ('section' in item) {
              return (
                <div
                  key={`sec-${idx}`}
                  className="pt-4 pb-1 px-3 text-[10px] font-bold text-purple-400/90 uppercase tracking-wider"
                >
                  {item.section}
                </div>
              );
            }

            // Role check
            if (item.roles && !item.roles.includes(userRole) && !isAdmin) {
              return null;
            }

            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition group ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 via-indigo-400 to-sky-400 text-white font-bold shadow-xs shadow-purple-300/40'
                    : 'text-slate-600 hover:bg-white/80 hover:text-purple-700'
                } ${item.highlight ? 'border border-purple-200/80' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition ${
                      isActive ? 'text-white' : 'text-purple-400 group-hover:text-purple-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700 border border-purple-200/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom User Department Tag */}
        <div className="p-3 border-t border-purple-100/80 bg-white/60 text-xs">
          <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-sky-50 border border-purple-100/80">
            <p className="text-[10px] text-purple-500 uppercase font-semibold">Tổ phụ trách</p>
            <p className="text-purple-950 font-bold text-xs mt-0.5">
              {userProfile?.departmentName || (isAdmin ? 'Ban Giám Hiệu / Quản trị' : 'Chưa phân tổ')}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
