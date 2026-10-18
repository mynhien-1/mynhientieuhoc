import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS, ACADEMIC_YEARS } from '../constants';
import {
  Bell,
  LogOut,
  Menu,
  Shield,
  School,
  BookOpen,
  X,
  CheckCircle2,
  ChevronRight,
  UserCog,
  FileCheck2,
  UploadCloud,
  HelpCircle,
  Users2,
  ChevronDown,
  Share2,
  Sparkles,
  Crown,
} from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';
import { ActiveTab } from './Sidebar';
import { UserSwitcherModal } from './UserSwitcherModal';
import { SchoolSwitcherModal } from './SchoolSwitcherModal';

interface Props {
  onToggleSidebar: () => void;
  onSelectDocument?: (docId: string) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<Props> = ({ onToggleSidebar, onSelectDocument, onNavigateToTab }) => {
  const {
    activeSchool,
    getSchoolShareLink,
    currentUser,
    userProfile,
    systemConfig,
    selectedAcademicYear,
    setSelectedAcademicYear,
    logout,
    isAdmin,
    isVicePrincipal,
    isLead,
    isSystemOwner,
    giftRequests,
  } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);

  const roleMeta = userProfile ? ROLE_LABELS[userProfile.role] : null;

  const navigateAndClose = (tab: ActiveTab) => {
    setShowDeptModal(false);
    setShowRoleModal(false);
    if (onNavigateToTab) {
      onNavigateToTab(tab);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100 h-16 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-purple-700 hover:bg-purple-50 lg:hidden focus:outline-hidden transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowSchoolModal(true)}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
              title="Bấm để đổi trường học hoặc tạo trường mới để tặng các trường khác"
            >
              <School className="w-5 h-5 text-amber-200" />
            </button>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setShowSchoolModal(true)}
                className="group flex items-center gap-1.5 text-left cursor-pointer max-w-full"
                title="Bấm để đổi trường học hoặc tạo trường mới để tặng các trường khác"
              >
                <h1 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-purple-700 tracking-tight leading-tight line-clamp-1 transition">
                  {activeSchool?.name || systemConfig?.schoolName || 'Trường Tiểu học Ba Chúc'}
                </h1>
                <span className="p-0.5 rounded text-purple-600 group-hover:bg-purple-100 transition shrink-0">
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </button>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className="appearance-none bg-gradient-to-r from-violet-50 to-sky-50 hover:from-violet-100 hover:to-sky-100 text-purple-900 font-bold text-xs py-0.5 pl-2 pr-5 rounded-lg border border-purple-200/90 focus:outline-hidden focus:ring-1 focus:ring-purple-400 cursor-pointer transition shadow-2xs"
                    title="Chọn năm học"
                  >
                    {ACADEMIC_YEARS.map((y) => (
                      <option key={y} value={y}>
                        Năm học {y}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-1 text-purple-600 flex items-center">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSchoolModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-950 bg-purple-100 hover:bg-purple-200/80 px-2.5 py-0.5 rounded-lg border border-purple-200 transition cursor-pointer shadow-2xs active:scale-95"
                  title="Chuyển đổi trường học hoặc tạo trường mới tặng các trường khác"
                >
                  <School className="w-3 h-3 text-purple-600" />
                  <span>Đổi / Tặng trường</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Owner Gift Approval Notification Badge */}
          {isSystemOwner && (giftRequests?.filter((r) => r.status === 'pending').length || 0) > 0 && (
            <button
              type="button"
              onClick={() => {
                if (onNavigateToTab) onNavigateToTab('users');
              }}
              className="hidden lg:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 font-extrabold shadow-sm hover:from-amber-500 hover:to-orange-500 active:scale-95 transition cursor-pointer animate-pulse"
              title="Có yêu cầu tặng app cho trường khác đang chờ bạn phê duyệt"
            >
              <Crown className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>
                {giftRequests.filter((r) => r.status === 'pending').length} yêu cầu tặng App
              </span>
            </button>
          )}

          {/* Nút 1: Đơn vị chuyên môn (Ban Giám Hiệu / Tổ Khối) - Bấm được */}
          {userProfile?.departmentName && (
            <button
              type="button"
              onClick={() => setShowDeptModal(true)}
              className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-semibold shadow-2xs hover:bg-sky-100 hover:border-sky-300 hover:shadow-xs active:scale-95 transition-all cursor-pointer group"
              title="Bấm để xem thông tin đơn vị chuyên môn & quản lý tổ khối"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
              <span>{userProfile.departmentName}</span>
            </button>
          )}

          {/* Nút 2: Vai trò người dùng (Quản trị viên / Phó Hiệu trưởng / Tổ trưởng / Giáo viên) - Bấm được */}
          {roleMeta && (
            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group ${roleMeta.badgeClass}`}
              title="Bấm để xem chi tiết quyền hạn vai trò & hướng dẫn"
            >
              <Shield className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>{roleMeta.label}</span>
            </button>
          )}

          {/* Notification Button */}
          {currentUser && (
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl text-purple-700 hover:bg-purple-50 transition focus:outline-hidden cursor-pointer"
              title="Thông báo và nhắc hạn"
            >
              <Bell className="w-5 h-5" />
            </button>
          )}

          {/* Nút Đổi tài khoản giáo viên trực tiếp */}
          <button
            type="button"
            onClick={() => setShowSwitcherModal(true)}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 via-indigo-100 to-sky-100 hover:from-purple-200 hover:to-indigo-200 text-purple-950 border border-purple-300 font-bold shadow-2xs active:scale-95 transition cursor-pointer"
            title="Bấm để chuyển đổi sang tài khoản giáo viên hoặc vai trò khác trong trường"
          >
            <Users2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
            <span className="hidden sm:inline">Đổi tài khoản</span>
            <span className="sm:hidden">Đổi vai trò</span>
          </button>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-purple-50 transition focus:outline-hidden cursor-pointer"
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Avatar'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-purple-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-200 to-sky-200 text-purple-900 flex items-center justify-center font-bold text-xs border border-purple-200 shadow-2xs">
                  {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'GV'}
                </div>
              )}
              <div className="hidden lg:block text-left text-xs">
                <p className="font-semibold text-slate-800 leading-tight flex items-center gap-1">
                  <span>{currentUser?.displayName || 'Tài khoản'}</span>
                  {isSystemOwner && <Crown className="w-3 h-3 text-amber-500 inline shrink-0" />}
                </p>
                <p className="text-purple-700/80 text-[10px] truncate max-w-[150px] font-medium">
                  {userProfile?.positionTitle || currentUser?.email}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-purple-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-purple-50">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-bold text-slate-900">{currentUser?.displayName}</p>
                    {isSystemOwner && (
                      <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-black border border-amber-300 flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 text-amber-600" />
                        Chủ sở hữu
                      </span>
                    )}
                  </div>
                  {userProfile?.positionTitle && (
                    <p className="text-[11px] font-semibold text-purple-900 mt-0.5">
                      {userProfile.positionTitle}
                    </p>
                  )}
                  <p className="text-[10px] text-purple-600/70 truncate">{currentUser?.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowRoleModal(true);
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 cursor-pointer transition"
                    >
                      {roleMeta?.label}
                    </button>
                    {userProfile?.departmentName && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowDeptModal(true);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 cursor-pointer transition"
                      >
                        {userProfile.departmentName}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSwitcherModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-purple-900 bg-purple-50/70 hover:bg-purple-100 rounded-xl transition cursor-pointer"
                  >
                    <Users2 className="w-4 h-4 text-purple-600" />
                    Chuyển đổi tài khoản giáo viên
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowRoleModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-purple-900 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-purple-500" />
                    Xem quyền hạn của tôi
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigateAndClose('guide');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-sky-500" />
                    Hướng dẫn phân quyền
                  </button>
                  <div className="my-1 border-t border-purple-50" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSwitcherModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Đổi tài khoản khác
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal 1: Thông tin Đơn Vị Chuyên Môn (khi bấm nút "Ban Giám Hiệu" hoặc "Tổ Khối") */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-sky-50 via-purple-50 to-indigo-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-2xs border border-sky-200">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{userProfile?.departmentName}</h3>
                  <p className="text-[11px] text-sky-700 font-semibold">Đơn vị chuyên môn trường học</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeptModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-slate-700 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-sky-950">
                  <School className="w-4 h-4 text-sky-600" />
                  <span>Phạm vi chuyên môn tại Trường Tiểu học Ba Chúc</span>
                </div>
                {userProfile?.departmentName === 'Ban Giám Hiệu' ? (
                  <p className="text-[12px] text-slate-600 leading-relaxed">
                    Đơn vị quản lý cấp trường. Phó Hiệu trưởng và Quản trị viên phụ trách chỉ đạo, kiểm tra toàn diện tiến độ nộp và phê duyệt hồ sơ chuyên môn của cả <strong>5 Tổ Khối (Khối 1, Khối 2, Khối 3, Khối 4, Khối 5)</strong>.
                  </p>
                ) : (
                  <p className="text-[12px] text-slate-600 leading-relaxed">
                    Bạn hiện đang trực thuộc <strong>{userProfile?.departmentName}</strong>. Tổ chuyên môn có trách nhiệm sinh hoạt định kỳ, tổ chức giảng dạy và nộp hồ sơ kế hoạch bài dạy đúng hạn cho Tổ trưởng và Ban Giám Hiệu kiểm duyệt.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {(isAdmin || isVicePrincipal) && (
                  <button
                    onClick={() => navigateAndClose('departments')}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 hover:from-purple-600 hover:to-sky-500 text-white font-bold text-xs transition cursor-pointer shadow-xs shadow-purple-200"
                  >
                    <span className="flex items-center gap-2">
                      <Users2 className="w-4 h-4" />
                      Xem danh sách & điều phối 5 Tổ Khối
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => navigateAndClose('documents')}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-purple-200 hover:bg-purple-50 text-purple-900 font-semibold text-xs transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-purple-600" />
                    Xem danh sách hồ sơ chuyên môn
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-purple-100 flex justify-end">
              <button
                onClick={() => setShowDeptModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Chi tiết Vai Trò & Quyền Hạn (khi bấm nút "Quản trị viên" hoặc vai trò tương ứng) */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-purple-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-purple-50 via-sky-50 to-indigo-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs border border-purple-200">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Thông tin Tài khoản & Vai trò</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${roleMeta?.badgeClass}`}>
                      {roleMeta?.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-600/80 font-medium">{currentUser?.displayName} ({currentUser?.email})</p>
                </div>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Status Info */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Đơn vị phân công:</span>
                  <span className="font-bold text-purple-950">{userProfile?.departmentName || 'Chưa phân tổ'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Trạng thái bảo mật:</span>
                  <span className="font-bold text-teal-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    Đã duyệt (Hoạt động)
                  </span>
                </div>
              </div>

              {/* Permissions Checklist */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5 text-purple-950">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Quyền hạn được cấp cho vai trò {roleMeta?.label}:
                </h4>

                <div className="space-y-2">
                  {userProfile?.role === 'admin' && (
                    <>
                      <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span><strong>Quản lý người dùng:</strong> Phê duyệt tài khoản mới, phân quyền 4 vai trò và điều phối giáo viên giữa 5 tổ khối.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span><strong>Cấu hình hồ sơ:</strong> Thêm, sửa, kích hoạt hoặc ẩn các danh mục hồ sơ và quy định định dạng tệp, dung lượng tối đa.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span><strong>Cấu hình năm học:</strong> Chuyển đổi và thiết lập dữ liệu theo từng năm học (2026-2027 trở đi).</span>
                      </div>
                    </>
                  )}

                  {userProfile?.role === 'vice_principal' && (
                    <>
                      <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                        <span><strong>Bao quát 5 tổ khối:</strong> Được quyền xem toàn bộ hồ sơ, giáo án của cả 5 khối lớp trong trường.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                        <span><strong>Kiểm tra & Phê duyệt:</strong> Tải tệp thực tế, ghi nhận xét, yêu cầu bổ sung hoặc phê duyệt hồ sơ theo đúng quy trình.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                        <span><strong>Báo cáo & Xuất Excel:</strong> Theo dõi tỷ lệ hoàn thành theo từng khối, từng giáo viên và xuất file báo cáo.</span>
                      </div>
                    </>
                  )}

                  {userProfile?.role === 'lead' && (
                    <>
                      <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span><strong>Quản lý trong tổ:</strong> Xem và kiểm tra hồ sơ, giáo án của các giáo viên thuộc tổ khối của mình.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span><strong>Kiểm tra ban đầu:</strong> Nhận xét và chuyển hồ sơ lên Phó Hiệu trưởng để phê duyệt cuối cùng.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span><strong>Bảo mật phạm vi:</strong> Hệ thống tự động ngăn chặn truy cập hồ sơ của các tổ khối khác.</span>
                      </div>
                    </>
                  )}

                  {userProfile?.role === 'teacher' && (
                    <>
                      <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span><strong>Nộp hồ sơ cá nhân:</strong> Tải lên giáo án, kế hoạch bài dạy theo môn học, lớp, tuần và học kỳ.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span><strong>Theo dõi trạng thái:</strong> Nhận thông báo khi hồ sơ được duyệt hoặc khi có yêu cầu chỉnh sửa kèm lý do.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span><strong>Nộp lại phiên bản mới:</strong> Cập nhật tệp mới khi cần bổ sung mà vẫn lưu lại đầy đủ lịch sử phiên bản trước.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Direct Quick Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-purple-100">
                {isAdmin && (
                  <button
                    onClick={() => navigateAndClose('users')}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 hover:from-purple-600 hover:to-sky-500 text-white font-bold text-xs transition cursor-pointer shadow-xs shadow-purple-200"
                  >
                    <span className="flex items-center gap-2">
                      <UserCog className="w-4 h-4" />
                      Mở trang Quản Lý Tài Khoản & Phân Quyền
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {(isVicePrincipal || isLead) && (
                  <button
                    onClick={() => navigateAndClose('documents')}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 hover:from-purple-600 hover:to-sky-500 text-white font-bold text-xs transition cursor-pointer shadow-xs shadow-purple-200"
                  >
                    <span className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4" />
                      Mở trang Kiểm Tra & Phê Duyệt Hồ Sơ
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {userProfile?.role === 'teacher' && (
                  <button
                    onClick={() => navigateAndClose('submit')}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 hover:from-purple-600 hover:to-sky-500 text-white font-bold text-xs transition cursor-pointer shadow-xs shadow-purple-200"
                  >
                    <span className="flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" />
                      Mở Cổng nộp hồ sơ & giáo án
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => navigateAndClose('guide')}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-purple-200 hover:bg-purple-50 text-purple-900 font-semibold text-xs transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    Xem hướng dẫn chi tiết quy trình & phân quyền
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-purple-100 flex justify-end">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Drawer */}
      {currentUser && (
        <NotificationDrawer
          userUid={currentUser.uid}
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onSelectDocument={onSelectDocument}
        />
      )}

      {/* User Switcher Modal */}
      <UserSwitcherModal
        isOpen={showSwitcherModal}
        onClose={() => setShowSwitcherModal(false)}
      />

      {/* School Switcher & Gift Modal */}
      <SchoolSwitcherModal
        isOpen={showSchoolModal}
        onClose={() => setShowSchoolModal(false)}
      />
    </>
  );
};
