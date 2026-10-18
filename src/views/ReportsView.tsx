import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SchoolDocument, Department, UserProfile, DocumentCategory } from '../types';
import { BarChart3, FileSpreadsheet, Download, Filter, TrendingUp, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  documents: SchoolDocument[];
  departments: Department[];
  users: UserProfile[];
  categories: DocumentCategory[];
}

export const ReportsView: React.FC<Props> = ({
  documents,
  departments,
  users,
  categories,
}) => {
  const { userProfile, isAdmin, isVicePrincipal, isLead } = useAuth();

  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>(
    isLead && userProfile?.departmentId ? userProfile.departmentId : 'all'
  );

  // Scoped documents
  const scopedDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (isLead && userProfile?.departmentId && doc.departmentId !== userProfile.departmentId) return false;
      if (selectedDept !== 'all' && doc.departmentId !== selectedDept) return false;
      if (selectedSemester !== 'all' && doc.semester !== selectedSemester) return false;
      return true;
    });
  }, [documents, userProfile, isLead, selectedDept, selectedSemester]);

  // Department report breakdown
  const departmentStats = useMemo(() => {
    return departments
      .filter((dept) => {
        if (isLead && userProfile?.departmentId) return dept.id === userProfile.departmentId;
        if (selectedDept !== 'all') return dept.id === selectedDept;
        return true;
      })
      .map((dept) => {
        const deptDocs = scopedDocs.filter((d) => d.departmentId === dept.id);
        const teachersInDept = users.filter((u) => u.departmentId === dept.id);
        const approvedCount = deptDocs.filter((d) => d.status === 'approved').length;
        const needRevisionCount = deptDocs.filter((d) => d.status === 'need_revision').length;
        const pendingCount = deptDocs.filter(
          (d) => d.status === 'pending_lead' || d.status === 'pending_principal' || d.status === 'submitted'
        ).length;
        const rate = deptDocs.length > 0 ? Math.round((approvedCount / deptDocs.length) * 100) : 0;

        return {
          id: dept.id,
          name: dept.name,
          gradeNumber: dept.gradeNumber,
          leadName: dept.leadName || 'Chưa gán',
          teacherCount: teachersInDept.length,
          totalDocs: deptDocs.length,
          approvedCount,
          needRevisionCount,
          pendingCount,
          rate,
        };
      });
  }, [departments, scopedDocs, users, isLead, userProfile, selectedDept]);

  // Teacher breakdown report
  const teacherStats = useMemo(() => {
    const targetTeachers = users.filter((u) => {
      if (isLead && userProfile?.departmentId) return u.departmentId === userProfile.departmentId;
      if (selectedDept !== 'all') return u.departmentId === selectedDept;
      return true;
    });

    return targetTeachers.map((t) => {
      const tDocs = scopedDocs.filter((d) => d.ownerUid === t.uid);
      const approvedCount = tDocs.filter((d) => d.status === 'approved').length;
      const needRevisionCount = tDocs.filter((d) => d.status === 'need_revision').length;
      const rate = tDocs.length > 0 ? Math.round((approvedCount / tDocs.length) * 100) : 0;

      return {
        uid: t.uid,
        name: t.displayName,
        email: t.email,
        deptName: t.departmentName || 'Chưa phân tổ',
        role: t.role,
        totalDocs: tDocs.length,
        approvedCount,
        needRevisionCount,
        rate,
      };
    });
  }, [users, scopedDocs, isLead, userProfile, selectedDept]);

  // Overall totals
  const overall = useMemo(() => {
    const total = scopedDocs.length;
    const approved = scopedDocs.filter((d) => d.status === 'approved').length;
    const needRevision = scopedDocs.filter((d) => d.status === 'need_revision').length;
    const pending = scopedDocs.filter(
      (d) => d.status === 'pending_lead' || d.status === 'pending_principal' || d.status === 'submitted'
    ).length;
    const rate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return { total, approved, needRevision, pending, rate };
  }, [scopedDocs]);

  // Export to Excel
  const handleExportReportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Tổng hợp theo tổ khối
    const deptRows = departmentStats.map((d, idx) => ({
      STT: idx + 1,
      'Tổ Khối': d.name,
      'Tổ trưởng': d.leadName,
      'Số lượng giáo viên': d.teacherCount,
      'Tổng hồ sơ đã nộp': d.totalDocs,
      'Đã phê duyệt': d.approvedCount,
      'Yêu cầu bổ sung': d.needRevisionCount,
      'Chờ kiểm tra': d.pendingCount,
      'Tỷ lệ phê duyệt': `${d.rate}%`,
    }));
    const wsDept = XLSX.utils.json_to_sheet(deptRows);
    XLSX.utils.book_append_sheet(wb, wsDept, 'TongHopToKhoi');

    // Sheet 2: Chi tiết theo giáo viên
    const teacherRows = teacherStats.map((t, idx) => ({
      STT: idx + 1,
      'Họ và tên giáo viên': t.name,
      'Email': t.email,
      'Tổ chuyên môn': t.deptName,
      'Tổng hồ sơ': t.totalDocs,
      'Đã phê duyệt': t.approvedCount,
      'Cần bổ sung': t.needRevisionCount,
      'Tỷ lệ đạt': `${t.rate}%`,
    }));
    const wsTeachers = XLSX.utils.json_to_sheet(teacherRows);
    XLSX.utils.book_append_sheet(wb, wsTeachers, 'TienDoGiaoVien');

    // Sheet 3: Danh sách hồ sơ chi tiết
    const docRows = scopedDocs.map((doc, idx) => ({
      STT: idx + 1,
      'Tên hồ sơ': doc.title,
      'Tổ khối': doc.departmentName,
      'Người nộp': doc.ownerName,
      'Môn học': doc.subject || '',
      'Lớp': doc.gradeClass || '',
      'Tuần': doc.weekOrPeriod || '',
      'Loại hồ sơ': doc.categoryName,
      'Phiên bản': `v${doc.currentVersion || 1}`,
      'Trạng thái': doc.status,
      'Người duyệt': doc.reviewedByName || '',
      'Ngày nộp': new Date(doc.createdAt).toLocaleDateString('vi-VN'),
      'Đường dẫn tệp': doc.fileUrl,
    }));
    const wsDocs = XLSX.utils.json_to_sheet(docRows);
    XLSX.utils.book_append_sheet(wb, wsDocs, 'ChiTietHoSo');

    XLSX.writeFile(wb, `Bao_cao_chuyen_mon_TH_Ba_Chuc_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 p-5 rounded-2xl border border-purple-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-950 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Báo Cáo Tổng Hợp Chuyên Môn & Xuất Dữ Liệu
          </h2>
          <p className="text-xs text-purple-600/80 mt-1">
            Báo cáo tiến độ kiểm tra hồ sơ, giáo án theo 5 tổ khối và từng giáo viên. Xuất file Excel lưu trữ theo quy định.
          </p>
        </div>

        <button
          onClick={handleExportReportExcel}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-bold text-xs shadow-xs shadow-teal-200 transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Xuất Báo Cáo Excel (.xlsx)
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white/95 p-4 rounded-2xl border border-purple-100 shadow-2xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-950">
          <Filter className="w-4 h-4 text-purple-600" />
          <span>Phạm vi báo cáo:</span>
        </div>

        <div>
          <select
            value={selectedDept}
            disabled={isLead}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs font-medium rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-slate-800 disabled:bg-purple-50/50 focus:outline-hidden focus:border-purple-400"
          >
            {!isLead && <option value="all">Tất cả 5 Tổ Khối</option>}
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-xs font-medium rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-purple-400"
          >
            <option value="all">Tất cả học kỳ</option>
            <option value="HK1">Học kì 1</option>
            <option value="HK2">Học kì 2</option>
            <option value="CaNam">Cả năm</option>
          </select>
        </div>
      </div>

      {/* KPI Row - Soft Pastel Tones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 shadow-2xs">
          <span className="text-xs text-purple-700 font-semibold">Tổng hồ sơ nộp</span>
          <div className="text-2xl font-bold text-purple-950 mt-1">{overall.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 shadow-2xs">
          <span className="text-xs text-teal-800 font-semibold">Đã phê duyệt</span>
          <div className="text-2xl font-bold text-teal-950 mt-1">{overall.approved}</div>
          <span className="text-[11px] text-teal-700 font-bold">{overall.rate}% tổng số hồ sơ</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs">
          <span className="text-xs text-amber-800 font-semibold">Yêu cầu bổ sung</span>
          <div className="text-2xl font-bold text-amber-950 mt-1">{overall.needRevision}</div>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 shadow-2xs">
          <span className="text-xs text-sky-800 font-semibold">Chờ kiểm tra</span>
          <div className="text-2xl font-bold text-sky-950 mt-1">{overall.pending}</div>
        </div>
      </div>

      {/* Table 1: 5 Grade Blocks Summary */}
      <div className="bg-white/95 rounded-2xl border border-purple-100 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50/80 to-sky-50/80 flex items-center justify-between">
          <h3 className="font-bold text-purple-950 text-sm">
            1. Bảng tổng hợp theo 5 Tổ Khối chuyên môn
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gradient-to-r from-purple-50/60 to-sky-50/60 text-purple-950 font-bold border-b border-purple-100">
              <tr>
                <th className="py-3 px-4">Tổ Khối</th>
                <th className="py-3 px-4">Tổ trưởng</th>
                <th className="py-3 px-4 text-center">Số giáo viên</th>
                <th className="py-3 px-4 text-center">Tổng hồ sơ</th>
                <th className="py-3 px-4 text-center">Đã duyệt</th>
                <th className="py-3 px-4 text-center">Cần bổ sung</th>
                <th className="py-3 px-4 text-center">Chờ duyệt</th>
                <th className="py-3 px-4 text-right">Tỷ lệ đạt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {departmentStats.map((d) => (
                <tr key={d.id} className="hover:bg-purple-50/30 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{d.name}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{d.leadName}</td>
                  <td className="py-3.5 px-4 text-center text-slate-700">{d.teacherCount}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">{d.totalDocs}</td>
                  <td className="py-3.5 px-4 text-center text-teal-700 font-bold">{d.approvedCount}</td>
                  <td className="py-3.5 px-4 text-center text-amber-700 font-bold">{d.needRevisionCount}</td>
                  <td className="py-3.5 px-4 text-center text-sky-700 font-bold">{d.pendingCount}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-purple-950">
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-bold">
                      {d.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Teacher progress */}
      <div className="bg-white/95 rounded-2xl border border-purple-100 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50/80 to-sky-50/80 flex items-center justify-between">
          <h3 className="font-bold text-purple-950 text-sm">
            2. Tiến độ nộp và kiểm tra từng giáo viên
          </h3>
          <span className="text-xs text-purple-500 font-medium">Tổng số: {teacherStats.length} giáo viên</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gradient-to-r from-purple-50/60 to-sky-50/60 text-purple-950 font-bold border-b border-purple-100">
              <tr>
                <th className="py-3 px-4">Họ và tên giáo viên</th>
                <th className="py-3 px-4">Tổ chuyên môn</th>
                <th className="py-3 px-4 text-center">Tổng hồ sơ nộp</th>
                <th className="py-3 px-4 text-center">Đã phê duyệt</th>
                <th className="py-3 px-4 text-center">Cần bổ sung</th>
                <th className="py-3 px-4 text-right">Tỷ lệ hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {teacherStats.map((t) => (
                <tr key={t.uid} className="hover:bg-purple-50/30 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{t.name}</span>
                    <span className="text-[10px] text-purple-400">{t.email}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{t.deptName}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">{t.totalDocs}</td>
                  <td className="py-3.5 px-4 text-center text-teal-700 font-bold">{t.approvedCount}</td>
                  <td className="py-3.5 px-4 text-center text-amber-700 font-bold">{t.needRevisionCount}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-purple-950">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-purple-100 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-gradient-to-r from-purple-400 to-sky-400 rounded-full"
                          style={{ width: `${t.rate}%` }}
                        />
                      </div>
                      <span>{t.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
