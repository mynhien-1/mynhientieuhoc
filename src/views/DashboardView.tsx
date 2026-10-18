import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SchoolDocument, Department, DocumentCategory, DocumentStatus } from '../types';
import { DocumentStatusBadge } from '../components/DocumentStatusBadge';
import { DEPARTMENT_THEMES } from '../constants';
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Filter,
  PlusCircle,
  TrendingUp,
  Award,
  Users,
  Search,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface Props {
  documents: SchoolDocument[];
  departments: Department[];
  categories: DocumentCategory[];
  onOpenSubmit: () => void;
  onSelectDocument: (doc: SchoolDocument) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<Props> = ({
  documents,
  departments,
  categories,
  onOpenSubmit,
  onSelectDocument,
  onNavigateToTab,
}) => {
  const { userProfile, isAdmin, isVicePrincipal, isLead } = useAuth();

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>(
    isLead && userProfile?.departmentId ? userProfile.departmentId : 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Role scoping: If teacher, only see own
      if (userProfile?.role === 'teacher' && doc.ownerUid !== userProfile.uid) {
        return false;
      }
      // If Lead, only see own department
      if (isLead && userProfile?.departmentId && doc.departmentId !== userProfile.departmentId) {
        return false;
      }
      // UI filters
      if (selectedDept !== 'all' && doc.departmentId !== selectedDept) return false;
      if (selectedCategory !== 'all' && doc.categoryId !== selectedCategory) return false;
      if (selectedSemester !== 'all' && doc.semester !== selectedSemester) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.ownerName.toLowerCase().includes(q) ||
          (doc.subject && doc.subject.toLowerCase().includes(q)) ||
          (doc.weekOrPeriod && doc.weekOrPeriod.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [documents, userProfile, isLead, selectedDept, selectedCategory, selectedSemester, searchQuery]);

  // Statistics
  const now = new Date();
  const stats = useMemo(() => {
    let total = filteredDocs.length;
    let submitted = 0;
    let pendingReview = 0;
    let needRevision = 0;
    let approved = 0;
    let overdue = 0;

    filteredDocs.forEach((d) => {
      if (d.status === 'submitted' || d.status === 'resubmitted') submitted++;
      if (d.status === 'pending_lead' || d.status === 'pending_principal') pendingReview++;
      if (d.status === 'need_revision') needRevision++;
      if (d.status === 'approved') approved++;

      if (d.deadline && d.status !== 'approved') {
        const dl = new Date(d.deadline);
        if (dl < now) overdue++;
      }
    });

    return { total, submitted, pendingReview, needRevision, approved, overdue };
  }, [filteredDocs]);

  // Department breakdown for VP/Admin
  const deptBreakdown = useMemo(() => {
    return departments.map((dept) => {
      const deptDocs = documents.filter((d) => d.departmentId === dept.id);
      const approvedCount = deptDocs.filter((d) => d.status === 'approved').length;
      const rate = deptDocs.length > 0 ? Math.round((approvedCount / deptDocs.length) * 100) : 0;
      return {
        ...dept,
        total: deptDocs.length,
        approved: approvedCount,
        rate,
      };
    });
  }, [departments, documents]);

  // Recent 5 documents
  const recentDocs = useMemo(() => {
    return [...filteredDocs]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [filteredDocs]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-500 via-indigo-400 to-sky-400 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        {/* Soft decorative glow */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-36 -top-10 w-36 h-36 bg-sky-200/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-100 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <span className="bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px]">Trường Tiểu học Ba Chúc</span>
              <span>•</span>
              <span className="font-bold text-sky-100">
                {isAdmin
                  ? 'Khu vực Quản trị viên'
                  : isVicePrincipal
                  ? 'Khu vực Phó Hiệu trưởng'
                  : isLead
                  ? `Khu vực Tổ trưởng ${userProfile?.departmentName || ''}`
                  : `Khu vực Giáo viên ${userProfile?.departmentName || ''}`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Quản lí hồ sơ chuyên môn
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSubmit}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-purple-900 hover:bg-purple-50 font-bold text-xs sm:text-sm shadow-sm transition transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-purple-600" />
              Nộp hồ sơ mới
            </button>
            <button
              onClick={() => onNavigateToTab('documents')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm backdrop-blur-xs border border-white/30 transition cursor-pointer"
            >
              Kiểm tra hồ sơ
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/95 p-4 rounded-2xl border border-purple-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-950">
            <Filter className="w-4 h-4 text-purple-500" />
            <span>Bộ lọc dữ liệu chuyên môn</span>
          </div>
          <span className="text-xs text-purple-600/80">
            Hiển thị <span className="font-bold text-purple-950">{filteredDocs.length}</span> hồ sơ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tổ Khối</label>
            <select
              value={selectedDept}
              disabled={isLead}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-purple-200/80 bg-white px-3 py-2 text-slate-700 focus:outline-hidden focus:border-purple-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              {!isLead && <option value="all">Tất cả 5 Tổ Khối</option>}
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Loại hồ sơ</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-purple-200/80 bg-white px-3 py-2 text-slate-700 focus:outline-hidden focus:border-purple-400"
            >
              <option value="all">Tất cả loại hồ sơ</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-purple-200/80 bg-white px-3 py-2 text-slate-700 focus:outline-hidden focus:border-purple-400"
            >
              <option value="all">Tất cả học kỳ</option>
              <option value="HK1">Học kì 1</option>
              <option value="HK2">Học kì 2</option>
              <option value="CaNam">Cả năm</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tên hồ sơ, giáo viên, tuần..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-purple-200/80 bg-white pl-8 pr-3 py-2 text-slate-700 focus:outline-hidden focus:border-purple-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - 6 Distinct Soft Pastel Tones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total: Pastel Lilac / Violet */}
        <div className="p-4 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-white via-purple-50/50 to-purple-100/50 shadow-2xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-semibold">Tổng hồ sơ</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-950">{stats.total}</div>
          <p className="text-[10px] text-purple-500 font-medium mt-1">Trong phạm vi lọc</p>
        </div>

        {/* Submitted: Pastel Sky Blue */}
        <div className="p-4 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-white via-sky-50/50 to-sky-100/50 shadow-2xs">
          <div className="flex items-center justify-between text-sky-600 mb-2">
            <span className="text-xs font-semibold">Đã nộp</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-sky-950">{stats.submitted}</div>
          <p className="text-[10px] text-sky-600/80 font-medium mt-1">Đang chờ xử lý</p>
        </div>

        {/* Pending Review: Pastel Periwinkle / Indigo */}
        <div className="p-4 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/50 to-indigo-100/50 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-semibold">Chờ kiểm tra</span>
            <AlertCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-950">{stats.pendingReview}</div>
          <p className="text-[10px] text-indigo-600/80 font-medium mt-1">Tổ trưởng & PHT</p>
        </div>

        {/* Need Revision: Pastel Peach / Apricot */}
        <div className="p-4 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/50 to-amber-100/50 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold">Cần bổ sung</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-950">{stats.needRevision}</div>
          <p className="text-[10px] text-amber-700/80 font-medium mt-1">Yêu cầu sửa đổi</p>
        </div>

        {/* Approved: Pastel Mint / Emerald */}
        <div className="p-4 rounded-2xl border border-teal-200/80 bg-gradient-to-br from-white via-teal-50/50 to-teal-100/50 shadow-2xs">
          <div className="flex items-center justify-between text-teal-700 mb-2">
            <span className="text-xs font-semibold">Đã phê duyệt</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-950">{stats.approved}</div>
          <p className="text-[10px] text-teal-700/80 font-medium mt-1">Đạt chuẩn chuyên môn</p>
        </div>

        {/* Overdue: Pastel Rose Blossom */}
        <div className="p-4 rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white via-rose-50/50 to-rose-100/50 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold">Quá hạn</span>
            <Calendar className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-950">{stats.overdue}</div>
          <p className="text-[10px] text-rose-700/80 font-medium mt-1">Cần đôn đốc nộp</p>
        </div>
      </div>

      {/* Grid: 5 Department Progress (for VP/Admin) & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 5 Department Progress */}
        <div className="lg:col-span-2 bg-white/95 p-5 rounded-2xl border border-purple-100/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-950 text-sm sm:text-base">
                Tiến độ thực hiện theo 5 Tổ khối chuyên môn
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Xem báo cáo chi tiết
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {deptBreakdown.map((dept) => {
              const theme = DEPARTMENT_THEMES[dept.id] || DEPARTMENT_THEMES.khoi_1;
              return (
                <div
                  key={dept.id}
                  className={`p-3.5 rounded-2xl border ${theme.borderBadge} bg-gradient-to-r ${theme.cardGradient} hover:shadow-xs transition`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg ${theme.iconBg} text-white flex items-center justify-center font-bold text-[11px] shadow-2xs`}>
                        K{dept.gradeNumber}
                      </span>
                      {dept.name}
                    </span>
                    <span className="text-slate-600 font-semibold text-xs">
                      {dept.approved}/{dept.total} hồ sơ đạt ({dept.rate}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${theme.iconBg} rounded-full transition-all duration-500`}
                      style={{ width: `${dept.rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Quick Tips & Info */}
        <div className="bg-gradient-to-br from-purple-50/40 via-sky-50/30 to-white p-5 rounded-2xl border border-purple-100/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-950 text-sm sm:text-base">Quy trình kiểm tra số</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Theo quy định của nhà trường, giáo án tuần cần được nộp trước 17h00 thứ Sáu hàng tuần.
            </p>
            <div className="mt-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[10px] shrink-0 border border-sky-200">
                  1
                </span>
                <span>Giáo viên tải tệp lên (Word, PDF, PowerPoint...)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[10px] shrink-0 border border-purple-200">
                  2
                </span>
                <span>Tổ trưởng rà soát nội dung theo tổ khối</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-200">
                  3
                </span>
                <span>Phó Hiệu trưởng kiểm tra & phê duyệt điện tử</span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-sky-50 border border-purple-100">
            <p className="text-[11px] text-purple-950 font-bold">Lưu ý quản lý phiên bản:</p>
            <p className="text-[11px] text-purple-800/80 mt-0.5 leading-relaxed">
              Khi được yêu cầu bổ sung, giáo viên nộp lại phiên bản mới; toàn bộ bản cũ và nhận xét đều được lưu vết đầy đủ.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white/95 rounded-2xl border border-purple-100/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-purple-100/80 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-sky-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-purple-950 text-sm">Hồ sơ cập nhật gần đây</h3>
          </div>
          <button
            onClick={() => onNavigateToTab('documents')}
            className="text-xs text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
          >
            Xem tất cả ({filteredDocs.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Chưa có hồ sơ nào phù hợp bộ lọc.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/40 text-purple-900 font-semibold border-b border-purple-100/80">
                <tr>
                  <th className="py-3 px-4">Tên hồ sơ / Giáo án</th>
                  <th className="py-3 px-4">Tổ khối</th>
                  <th className="py-3 px-4">Giáo viên</th>
                  <th className="py-3 px-4">Loại hồ sơ</th>
                  <th className="py-3 px-4">Phiên bản</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-purple-50/30 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {doc.title}
                      {doc.weekOrPeriod && (
                        <span className="block text-[10px] text-purple-400 font-normal">{doc.weekOrPeriod}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{doc.departmentName}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{doc.ownerName}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">{doc.categoryName}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs px-2 py-0.5 bg-purple-50 rounded-md text-purple-700 border border-purple-200/60 font-semibold">
                        v{doc.currentVersion || 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <DocumentStatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectDocument(doc)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-50 to-sky-50 text-purple-700 hover:from-purple-100 hover:to-sky-100 font-semibold text-xs border border-purple-200/70 transition cursor-pointer shadow-2xs"
                      >
                        Mở chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
