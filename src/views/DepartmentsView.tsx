import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Department, UserProfile } from '../types';
import { localDb } from '../services/localDb';
import { DEPARTMENT_THEMES } from '../constants';
import { Users2, UserCheck, ArrowRightLeft, Shield, School, Edit2, Check, X, AlertCircle } from 'lucide-react';

interface Props {
  departments: Department[];
  users: UserProfile[];
  onRefresh: () => void;
}

export const DepartmentsView: React.FC<Props> = ({ departments, users, onRefresh }) => {
  const { isAdmin, isVicePrincipal, activeSchool } = useAuth();

  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [selectedLeadUid, setSelectedLeadUid] = useState<string>('');
  const [deptDesc, setDeptDesc] = useState('');
  const [transferUser, setTransferUser] = useState<UserProfile | null>(null);
  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditDept = (dept: Department) => {
    setEditingDept(dept);
    setSelectedLeadUid(dept.leadUid || '');
    setDeptDesc(dept.description || '');
    setError(null);
  };

  const handleSaveDept = async () => {
    if (!editingDept) return;
    setSaving(true);
    setError(null);

    try {
      const selectedLead = users.find((u) => u.uid === selectedLeadUid);
      const updatedDepartments = departments.map((d) =>
        d.id === editingDept.id
          ? {
              ...d,
              leadUid: selectedLeadUid || '',
              leadName: selectedLead?.displayName || '',
              description: deptDesc.trim(),
              updatedAt: new Date().toISOString(),
            }
          : d
      );

      localDb.saveDepartments(updatedDepartments, activeSchool?.id || 'th-ba-chuc');

      // If a new lead was selected, update their user role to 'lead' and department
      if (selectedLead && selectedLead.role !== 'admin' && selectedLead.role !== 'vice_principal') {
        const updatedUsers = users.map((u) =>
          u.uid === selectedLead.uid
            ? {
                ...u,
                role: 'lead' as const,
                departmentId: editingDept.id,
                departmentName: editingDept.name,
                updatedAt: new Date().toISOString(),
              }
            : u
        );
        localDb.saveStaff(updatedUsers, activeSchool?.id || 'th-ba-chuc');
      }

      setEditingDept(null);
      onRefresh();
    } catch (e: any) {
      setError(e.message || 'Lỗi lưu thông tin tổ chuyên môn');
    } finally {
      setSaving(false);
    }
  };

  const handleTransferTeacher = async () => {
    if (!transferUser || !targetDeptId) return;
    const targetDept = departments.find((d) => d.id === targetDeptId);
    if (!targetDept) return;

    setSaving(true);
    try {
      const updatedUsers = users.map((u) =>
        u.uid === transferUser.uid
          ? {
              ...u,
              departmentId: targetDept.id,
              departmentName: targetDept.name,
              updatedAt: new Date().toISOString(),
            }
          : u
      );
      localDb.saveStaff(updatedUsers, activeSchool?.id || 'th-ba-chuc');
      setTransferUser(null);
      onRefresh();
    } catch (e: any) {
      setError(e.message || 'Lỗi chuyển giáo viên');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 p-5 rounded-2xl border border-purple-100 shadow-2xs">
        <h2 className="text-xl font-bold text-purple-950 tracking-tight flex items-center gap-2">
          <Users2 className="w-5 h-5 text-purple-600" />
          Quản Lý 5 Tổ Khối Chuyên Môn
        </h2>
        <p className="text-xs text-purple-600/80 mt-1">
          Cơ cấu tổ chuyên môn Khối 1 đến Khối 5 của trường tiểu học. Phân công Tổ trưởng chuyên môn và điều phối nhân sự giáo viên.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5 Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => {
          const deptTeachers = users.filter((u) => u.departmentId === dept.id);
          const currentLead = users.find((u) => u.uid === dept.leadUid);
          const theme = DEPARTMENT_THEMES[dept.id] || DEPARTMENT_THEMES.khoi_1;

          return (
            <div
              key={dept.id}
              className={`rounded-3xl border ${theme.borderBadge} bg-gradient-to-br ${theme.cardGradient} shadow-2xs p-5 flex flex-col justify-between hover:shadow-xs transition`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-2xl ${theme.iconBg} text-white flex items-center justify-center font-bold text-xs shadow-2xs`}>
                      K{dept.gradeNumber}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{dept.name}</h3>
                      <p className={`text-[10px] font-semibold ${theme.accentColor}`}>Khối lớp {dept.gradeNumber}</p>
                    </div>
                  </div>

                  {(isAdmin || isVicePrincipal) && (
                    <button
                      onClick={() => startEditDept(dept)}
                      className="p-1.5 text-purple-400 hover:text-purple-700 hover:bg-white/80 rounded-xl transition cursor-pointer"
                      title="Phân công Tổ trưởng / Sửa mô tả"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Lead info */}
                <div className="p-3 rounded-2xl bg-white/80 border border-white/70 mb-3 shadow-2xs">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-1">
                    Tổ trưởng chuyên môn
                  </span>
                  {currentLead ? (
                    <div className="flex items-center gap-2 text-xs">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-purple-950">{currentLead.displayName}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-600 font-medium italic">Chưa phân công Tổ trưởng</span>
                  )}
                </div>

                {/* Description */}
                {dept.description && (
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{dept.description}</p>
                )}

                {/* Teachers in this block */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span>Thành viên trong tổ ({deptTeachers.length})</span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {deptTeachers.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Chưa có giáo viên nào trong tổ.</p>
                    ) : (
                      deptTeachers.map((tc) => (
                        <div
                          key={tc.uid}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/80 text-xs border border-white/80 shadow-2xs"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-slate-800 block truncate">{tc.displayName}</span>
                            <span className="text-[10px] text-purple-400 truncate block">{tc.email}</span>
                          </div>
                          {(isAdmin || isVicePrincipal) && (
                            <button
                              onClick={() => {
                                setTransferUser(tc);
                                setTargetDeptId(dept.id);
                              }}
                              className="text-[10px] text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 font-semibold px-2 py-1 rounded-lg shrink-0 cursor-pointer transition border border-purple-200/60"
                              title="Chuyển tổ chuyên môn"
                            >
                              Chuyển tổ
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100 space-y-4">
            <h3 className="font-bold text-purple-950 text-base">Phân công {editingDept.name}</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tổ trưởng chuyên môn (chọn từ danh sách giáo viên)
              </label>
              <select
                value={selectedLeadUid}
                onChange={(e) => setSelectedLeadUid(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-400"
              >
                <option value="">-- Chưa gán Tổ trưởng --</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.displayName} ({u.email}) - Hiện tại: {u.departmentName || 'Chưa phân tổ'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả / Ghi chú tổ</label>
              <textarea
                rows={2}
                value={deptDesc}
                onChange={(e) => setDeptDesc(e.target.value)}
                className="w-full text-xs rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-purple-50 rounded-xl font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveDept}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-purple-200"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Teacher Modal */}
      {transferUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-purple-100 space-y-4">
            <h3 className="font-bold text-purple-950 text-base flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-purple-600" />
              Chuyển Tổ Khối
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Chuyển giáo viên <strong className="text-purple-950">{transferUser.displayName}</strong> sang tổ chuyên môn mới:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn Tổ Khối đích</label>
              <select
                value={targetDeptId}
                onChange={(e) => setTargetDeptId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-400"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferUser(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-purple-50 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleTransferTeacher}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-purple-200"
              >
                {saving ? 'Đang chuyển...' : 'Xác nhận chuyển'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
