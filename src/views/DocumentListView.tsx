import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SchoolDocument, Department, DocumentCategory, DocumentStatus } from '../types';
import { DocumentStatusBadge } from '../components/DocumentStatusBadge';
import { DocumentDetailModal } from './DocumentDetailModal';
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  documents: SchoolDocument[];
  departments: Department[];
  categories: DocumentCategory[];
  onOpenSubmit: () => void;
  onRefresh: () => void;
  initialSelectedDoc?: SchoolDocument | null;
}

export const DocumentListView: React.FC<Props> = ({
  documents,
  departments,
  categories,
  onOpenSubmit,
  onRefresh,
  initialSelectedDoc,
}) => {
  const { userProfile, isAdmin, isVicePrincipal, isLead } = useAuth();

  // Tab filter
  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'need_revision' | 'resubmitted' | 'approved' | 'draft' | 'overdue'
  >('all');

  // Filters
  const [deptFilter, setDeptFilter] = useState<string>(
    isLead && userProfile?.departmentId ? userProfile.departmentId : 'all'
  );
  const [catFilter, setCatFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Selected document for modal
  const [selectedDoc, setSelectedDoc] = useState<SchoolDocument | null>(initialSelectedDoc || null);

  const now = new Date();

  // Filtered documents
  const filteredList = useMemo(() => {
    return documents.filter((doc) => {
      // Role scoping
      if (userProfile?.role === 'teacher' && doc.ownerUid !== userProfile.uid) {
        return false;
      }
      if (isLead && userProfile?.departmentId && doc.departmentId !== userProfile.departmentId) {
        return false;
      }

      // Department & Category & Semester
      if (deptFilter !== 'all' && doc.departmentId !== deptFilter) return false;
      if (catFilter !== 'all' && doc.categoryId !== catFilter) return false;
      if (semesterFilter !== 'all' && doc.semester !== semesterFilter) return false;

      // Tab logic
      if (activeTab === 'pending') {
        if (doc.status !== 'pending_lead' && doc.status !== 'pending_principal' && doc.status !== 'submitted') {
          return false;
        }
      } else if (activeTab === 'need_revision') {
        if (doc.status !== 'need_revision') return false;
      } else if (activeTab === 'resubmitted') {
        if (doc.status !== 'resubmitted') return false;
      } else if (activeTab === 'approved') {
        if (doc.status !== 'approved') return false;
      } else if (activeTab === 'draft') {
        if (doc.status !== 'draft') return false;
      } else if (activeTab === 'overdue') {
        if (!doc.deadline || doc.status === 'approved') return false;
        const dl = new Date(doc.deadline);
        if (dl >= now) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.ownerName.toLowerCase().includes(q) ||
          (doc.subject && doc.subject.toLowerCase().includes(q)) ||
          (doc.weekOrPeriod && doc.weekOrPeriod.toLowerCase().includes(q)) ||
          (doc.gradeClass && doc.gradeClass.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [documents, userProfile, isLead, deptFilter, catFilter, semesterFilter, activeTab, search]);

  // Export filtered list to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredList.map((d, index) => ({
      STT: index + 1,
      'Tên hồ sơ / Giáo án': d.title,
      'Tổ khối': d.departmentName,
      'Người nộp': d.ownerName,
      'Email người nộp': d.ownerEmail,
      'Loại hồ sơ': d.categoryName,
      'Môn học': d.subject || '',
      'Lớp': d.gradeClass || '',
      'Tuần / Giai đoạn': d.weekOrPeriod || '',
      'Học kỳ': d.semester,
      'Năm học': d.academicYear,
      'Phiên bản': `v${d.currentVersion || 1}`,
      'Trạng thái': d.status,
      'Người phê duyệt': d.reviewedByName || '',
      'Thời gian nộp': new Date(d.createdAt).toLocaleString('vi-VN'),
      'Hạn nộp': d.deadline || '',
      'Đường dẫn tệp': d.fileUrl || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHoSo');
    XLSX.writeFile(wb, `Danh_sach_ho_so_chuyen_mon_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white/95 p-5 rounded-2xl border border-purple-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-950 tracking-tight">
            Quản lí hồ sơ chuyên môn
          </h2>
          <p className="text-xs text-purple-600/80 mt-0.5">
            {isAdmin || isVicePrincipal
              ? 'Toàn bộ hồ sơ 5 tổ khối của nhà trường; kiểm tra, nhận xét và phê duyệt trực tuyến.'
              : isLead
              ? `Hồ sơ chuyên môn thuộc ${userProfile?.departmentName || 'Tổ khối'}; đôn đốc và rà soát trước khi chuyển BGH.`
              : 'Hồ sơ cá nhân của thầy/cô; theo dõi trạng thái kiểm tra và tiếp thu ý kiến bổ sung.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100 text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Xuất bảng tính Excel danh sách hiện tại"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            Xuất Excel
          </button>
          <button
            onClick={onOpenSubmit}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 hover:from-purple-600 hover:to-sky-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Nộp hồ sơ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 text-xs font-medium border-b border-purple-100/80">
        {[
          { id: 'all', label: 'Tất cả hồ sơ', count: documents.length },
          {
            id: 'pending',
            label: 'Chờ kiểm tra',
            count: documents.filter(
              (d) => d.status === 'pending_lead' || d.status === 'pending_principal' || d.status === 'submitted'
            ).length,
          },
          {
            id: 'need_revision',
            label: 'Cần bổ sung',
            count: documents.filter((d) => d.status === 'need_revision').length,
          },
          {
            id: 'resubmitted',
            label: 'Đã nộp lại',
            count: documents.filter((d) => d.status === 'resubmitted').length,
          },
          {
            id: 'approved',
            label: 'Đã phê duyệt',
            count: documents.filter((d) => d.status === 'approved').length,
          },
          {
            id: 'overdue',
            label: 'Quá hạn',
            count: documents.filter((d) => {
              if (!d.deadline || d.status === 'approved') return false;
              return new Date(d.deadline) < now;
            }).length,
          },
          {
            id: 'draft',
            label: 'Bản nháp',
            count: documents.filter((d) => d.status === 'draft').length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 via-indigo-400 to-sky-400 text-white font-bold shadow-xs shadow-purple-200/50'
                : 'text-slate-600 hover:bg-purple-50/80 hover:text-purple-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white/95 p-4 rounded-2xl border border-purple-100 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Dept */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tổ Khối</label>
          <select
            value={deptFilter}
            disabled={isLead}
            onChange={(e) => setDeptFilter(e.target.value)}
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

        {/* Category */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Loại hồ sơ</label>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
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

        {/* Semester */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Học kỳ</label>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-purple-200/80 bg-white px-3 py-2 text-slate-700 focus:outline-hidden focus:border-purple-400"
          >
            <option value="all">Tất cả học kỳ</option>
            <option value="HK1">Học kì 1</option>
            <option value="HK2">Học kì 2</option>
            <option value="CaNam">Cả năm</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tìm kiếm</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tên hồ sơ, giáo viên, tuần..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-purple-200/80 bg-white pl-8 pr-3 py-2 text-slate-700 focus:outline-hidden focus:border-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-white/95 rounded-2xl border border-purple-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredList.length === 0 ? (
            <div className="text-center py-16 px-4">
              <FileText className="w-12 h-12 text-purple-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy hồ sơ nào</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Hãy thử chọn bộ lọc khác hoặc nộp hồ sơ mới lên hệ thống.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gradient-to-r from-purple-50/70 to-sky-50/70 text-purple-950 font-bold border-b border-purple-100">
                <tr>
                  <th className="py-3.5 px-4">Tên hồ sơ / Giáo án</th>
                  <th className="py-3.5 px-4">Tổ khối</th>
                  <th className="py-3.5 px-4">Người nộp</th>
                  <th className="py-3.5 px-4">Môn & Lớp</th>
                  <th className="py-3.5 px-4">Loại hồ sơ</th>
                  <th className="py-3.5 px-4">Bản</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {filteredList.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-purple-50/30 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 truncate leading-snug">{doc.title}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-purple-500/80 mt-0.5">
                        {doc.weekOrPeriod && <span className="text-purple-600 font-semibold">{doc.weekOrPeriod}</span>}
                        {doc.weekOrPeriod && <span>•</span>}
                        <span>Nộp: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>
                        {doc.deadline && (
                          <>
                            <span>•</span>
                            <span className={new Date(doc.deadline) < now && doc.status !== 'approved' ? 'text-rose-600 font-bold' : ''}>
                              Hạn: {doc.deadline}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {doc.departmentName}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {doc.ownerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {doc.subject ? doc.subject : 'Chung'}
                      {doc.gradeClass ? ` (${doc.gradeClass})` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-[150px]">
                      {doc.categoryName}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200/60 rounded-md font-semibold">
                        v{doc.currentVersion || 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <DocumentStatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-50 to-sky-50 hover:from-purple-100 hover:to-sky-100 text-purple-700 border border-purple-200/80 font-bold text-xs transition cursor-pointer flex items-center gap-1 ml-auto shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Kiểm tra
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
