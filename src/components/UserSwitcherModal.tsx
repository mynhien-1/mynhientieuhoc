import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, UserRole } from '../types';
import { ROLE_LABELS, INITIAL_ADMIN_EMAIL } from '../constants';
import {
  X,
  UserCheck,
  Search,
  School,
  Users2,
  Shield,
  Plus,
  CheckCircle2,
  Sparkles,
  Edit2,
  Trash2,
  Save,
  Crown,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSwitcherModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    activeSchool,
    staffList,
    currentUser,
    userProfile,
    switchUser,
    addNewStaffMember,
    updateStaffMember,
    deleteStaffMember,
  } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New staff form state
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('teacher');
  const [newDeptId, setNewDeptId] = useState('khoi_1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing existing staff state
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('teacher');
  const [editDeptId, setEditDeptId] = useState('khoi_1');

  if (!isOpen) return null;

  const deptLabels: Record<string, string> = {
    all: 'Tất cả',
    bgh: 'Ban Giám Hiệu',
    khoi_1: 'Tổ Khối 1',
    khoi_2: 'Tổ Khối 2',
    khoi_3: 'Tổ Khối 3',
    khoi_4: 'Tổ Khối 4',
    khoi_5: 'Tổ Khối 5',
  };

  const filteredStaff = staffList.filter((staff) => {
    // Dept filter
    if (selectedDeptFilter === 'bgh') {
      if (staff.role !== 'admin' && staff.role !== 'vice_principal') return false;
    } else if (selectedDeptFilter !== 'all') {
      if (staff.departmentId !== selectedDeptFilter) return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        staff.displayName.toLowerCase().includes(q) ||
        (staff.positionTitle && staff.positionTitle.toLowerCase().includes(q)) ||
        (staff.departmentName && staff.departmentName.toLowerCase().includes(q)) ||
        (staff.email && staff.email.toLowerCase().includes(q))
      );
    }

    return true;
  });

  const handleSelectStaff = async (staff: UserProfile) => {
    await switchUser(staff.uid);
    onClose();
  };

  const handleStartEdit = (e: React.MouseEvent, staff: UserProfile) => {
    e.stopPropagation();
    setEditingStaffId(staff.uid);
    setEditName(staff.displayName);
    setEditPosition(staff.positionTitle || '');
    setEditRole(staff.role);
    setEditDeptId(staff.departmentId || 'khoi_1');
  };

  const handleSaveEdit = async (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    if (!editName.trim()) return;

    const deptName =
      editRole === 'admin' || editRole === 'vice_principal'
        ? 'Ban Giám Hiệu'
        : deptLabels[editDeptId] || 'Tổ Khối 1';

    await updateStaffMember(uid, {
      displayName: editName.trim(),
      positionTitle: editPosition.trim(),
      role: editRole,
      departmentId: editRole === 'admin' || editRole === 'vice_principal' ? '' : editDeptId,
      departmentName: deptName,
    });
    setEditingStaffId(null);
  };

  const handleDeleteStaff = async (e: React.MouseEvent, uid: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Bạn có chắc muốn xóa giáo viên "${name}" khỏi danh sách trường?`)) {
      await deleteStaffMember(uid);
    }
  };

  const handleAddNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) return;

    setIsSubmitting(true);
    try {
      const deptName =
        newRole === 'admin' || newRole === 'vice_principal'
          ? 'Ban Giám Hiệu'
          : deptLabels[newDeptId] || 'Tổ Khối 1';

      const created = await addNewStaffMember({
        displayName: newDisplayName.trim(),
        positionTitle: newPosition.trim() || undefined,
        role: newRole,
        departmentId: newRole === 'admin' || newRole === 'vice_principal' ? '' : newDeptId,
        departmentName: deptName,
        status: 'active',
      });

      await switchUser(created.uid);
      setNewDisplayName('');
      setNewPosition('');
      setShowAddForm(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100 bg-gradient-to-r from-purple-50/80 via-white to-sky-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-purple-200">
              <Users2 className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-purple-950 flex items-center gap-2">
                <span>Nhân Sự & Giáo Viên</span>
                <span className="text-xs font-normal text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                  {activeSchool.name}
                </span>
              </h3>
              <p className="text-xs text-purple-700/80">
                Chỉnh sửa tên, chức vụ hoặc bấm vào tên để vào làm việc theo đúng phân quyền
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-violet-100/70 to-sky-100/70 border-b border-purple-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-purple-900">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Đang làm việc với tư cách:{' '}
              <strong className="font-bold text-purple-950">
                {userProfile?.displayName || currentUser?.displayName}
              </strong>{' '}
              ({ROLE_LABELS[userProfile?.role || 'teacher']?.label} •{' '}
              {userProfile?.departmentName || 'Chung'})
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã sẵn sàng
          </span>
        </div>

        {/* Search & Filters */}
        <div className="p-4 space-y-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tên giáo viên, tổ khối, chức vụ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-purple-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-400 shadow-2xs"
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm giáo viên</span>
            </button>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {Object.entries(deptLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedDeptFilter(key)}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap text-[11px] ${
                  selectedDeptFilter === key
                    ? 'bg-purple-600 text-white shadow-2xs font-bold'
                    : 'bg-white hover:bg-purple-50 text-slate-700 border border-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Staff Form (Collapsible) */}
        {showAddForm && (
          <form
            onSubmit={handleAddNewStaff}
            className="p-4 bg-purple-50/80 border-b border-purple-200 space-y-3 text-xs animate-in slide-in-from-top-2 duration-150"
          >
            <div className="font-bold text-purple-950 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-600" />
              Thêm Thầy/Cô mới vào danh sách {activeSchool.name}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Họ và tên giáo viên
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thầy Lê Văn C"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Chức vụ cụ thể
                </label>
                <input
                  type="text"
                  placeholder="VD: GV CN 2A, Tổ phó..."
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Vai trò hệ thống
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white text-xs"
                >
                  <option value="teacher">Giáo viên giảng dạy</option>
                  <option value="lead">Tổ trưởng chuyên môn</option>
                  <option value="vice_principal">Phó Hiệu trưởng</option>
                  <option value="admin">Ban Giám Hiệu (Hiệu trưởng)</option>
                </select>
              </div>
              {newRole !== 'admin' && newRole !== 'vice_principal' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tổ Khối phân công
                  </label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white text-xs"
                  >
                    <option value="khoi_1">Tổ Khối 1</option>
                    <option value="khoi_2">Tổ Khối 2</option>
                    <option value="khoi_3">Tổ Khối 3</option>
                    <option value="khoi_4">Tổ Khối 4</option>
                    <option value="khoi_5">Tổ Khối 5</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
              >
                {isSubmitting ? 'Đang thêm...' : 'Lưu và vào ứng dụng ngay'}
              </button>
            </div>
          </form>
        )}

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[50vh]">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Không tìm thấy giáo viên nào phù hợp với từ khóa "{search}".
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const isCurrent = currentUser?.uid === staff.uid;
              const roleInfo = ROLE_LABELS[staff.role];
              const isEditingThis = editingStaffId === staff.uid;

              if (isEditingThis) {
                return (
                  <div
                    key={staff.uid}
                    className="p-3.5 rounded-2xl border-2 border-purple-400 bg-purple-50/90 shadow-md space-y-3 text-xs"
                  >
                    <div className="font-bold text-purple-950 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-purple-700" />
                        Chỉnh sửa tên & chức vụ giáo viên
                      </span>
                      <button
                        onClick={() => setEditingStaffId(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          Họ và tên
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          Chức vụ cụ thể
                        </label>
                        <input
                          type="text"
                          placeholder="VD: GV CN 3A..."
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-purple-300 bg-white text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                          Vai trò
                        </label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="w-full px-2 py-1.5 rounded-lg border border-purple-300 bg-white text-xs"
                        >
                          <option value="admin">Ban Giám Hiệu (Hiệu trưởng)</option>
                          <option value="vice_principal">Phó Hiệu trưởng</option>
                          <option value="lead">Tổ trưởng chuyên môn</option>
                          <option value="teacher">Giáo viên giảng dạy</option>
                        </select>
                      </div>
                      {editRole !== 'admin' && editRole !== 'vice_principal' && (
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                            Tổ Khối
                          </label>
                          <select
                            value={editDeptId}
                            onChange={(e) => setEditDeptId(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-purple-300 bg-white text-xs"
                          >
                            <option value="khoi_1">Tổ Khối 1</option>
                            <option value="khoi_2">Tổ Khối 2</option>
                            <option value="khoi_3">Tổ Khối 3</option>
                            <option value="khoi_4">Tổ Khối 4</option>
                            <option value="khoi_5">Tổ Khối 5</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-purple-200">
                      <button
                        type="button"
                        onClick={() => setEditingStaffId(null)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSaveEdit(e, staff.uid)}
                        className="px-3.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Lưu thay đổi</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={staff.uid}
                  onClick={() => handleSelectStaff(staff)}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer group ${
                    isCurrent
                      ? 'bg-purple-50/90 border-purple-300 ring-2 ring-purple-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-purple-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                        staff.role === 'admin'
                          ? 'bg-purple-600 text-white'
                          : staff.role === 'vice_principal'
                          ? 'bg-sky-600 text-white'
                          : staff.role === 'lead'
                          ? 'bg-teal-600 text-white'
                          : 'bg-indigo-500 text-white'
                      }`}
                    >
                      {staff.displayName.charAt(
                        staff.displayName.startsWith('Cô ') || staff.displayName.startsWith('Thầy ') ? 4 : 0
                      ).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {staff.displayName}
                        </span>
                        {staff.positionTitle && (
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {staff.positionTitle}
                          </span>
                        )}
                        {staff.email.toLowerCase().trim() === INITIAL_ADMIN_EMAIL.toLowerCase().trim() && (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 shrink-0">
                            <Crown className="w-3 h-3 text-amber-600" />
                            Chủ sở hữu App
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                            Đang dùng
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700">
                          {staff.departmentName || 'Chung'}
                        </span>
                        <span>•</span>
                        <span className="truncate text-slate-400 text-[11px]">{staff.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Role Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${
                        roleInfo?.badgeClass || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {roleInfo?.label}
                    </span>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(e, staff)}
                      className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition cursor-pointer"
                      title="Chỉnh sửa tên và chức vụ người này"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button (except current admin) */}
                    {staff.uid !== 'admin_mynhien' && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteStaff(e, staff.uid, staff.displayName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                        title="Xóa giáo viên này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <span className="p-1 text-purple-600 group-hover:translate-x-0.5 transition-transform">
                      <UserCheck className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between px-5">
          <span>Tất cả thay đổi chỉ áp dụng cho <strong>{activeSchool.name}</strong>.</span>
          <span className="font-semibold text-purple-700">Hồ Sơ Chuyên Môn Số</span>
        </div>
      </div>
    </div>
  );
};
