import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SchoolDocument, Department, UserProfile } from '../types';
import { DocumentStatusBadge } from '../components/DocumentStatusBadge';
import { createNotification } from '../services/documentService';
import {
  CalendarClock,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BellRing,
  Send,
  Eye,
  Filter,
} from 'lucide-react';

interface Props {
  documents: SchoolDocument[];
  departments: Department[];
  users: UserProfile[];
  onSelectDocument: (doc: SchoolDocument) => void;
}

export const RemindersView: React.FC<Props> = ({
  documents,
  departments,
  users,
  onSelectDocument,
}) => {
  const { userProfile, isAdmin, isVicePrincipal, isLead } = useAuth();

  const [selectedDept, setSelectedDept] = useState<string>(
    isLead && userProfile?.departmentId ? userProfile.departmentId : 'all'
  );
  const [sentNoticeDocId, setSentNoticeDocId] = useState<string | null>(null);

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Filter docs in scope
  const scopedDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (userProfile?.role === 'teacher' && doc.ownerUid !== userProfile.uid) return false;
      if (isLead && userProfile?.departmentId && doc.departmentId !== userProfile.departmentId) return false;
      if (selectedDept !== 'all' && doc.departmentId !== selectedDept) return false;
      return true;
    });
  }, [documents, userProfile, isLead, selectedDept]);

  // Categories of reminders
  const overdueDocs = useMemo(() => {
    return scopedDocs.filter((d) => {
      if (!d.deadline || d.status === 'approved') return false;
      return new Date(d.deadline) < now;
    });
  }, [scopedDocs, now]);

  const upcomingDocs = useMemo(() => {
    return scopedDocs.filter((d) => {
      if (!d.deadline || d.status === 'approved') return false;
      const dl = new Date(d.deadline);
      return dl >= now && dl <= threeDaysFromNow;
    });
  }, [scopedDocs, now, threeDaysFromNow]);

  const pendingRevisionDocs = useMemo(() => {
    return scopedDocs.filter((d) => d.status === 'need_revision');
  }, [scopedDocs]);

  const waitingReviewDocs = useMemo(() => {
    return scopedDocs.filter(
      (d) => d.status === 'pending_lead' || d.status === 'pending_principal' || d.status === 'submitted'
    );
  }, [scopedDocs]);

  // Send in-app nudge
  const handleSendNudge = async (doc: SchoolDocument) => {
    if (!doc.ownerUid) return;
    try {
      await createNotification(
        doc.ownerUid,
        `Nhắc hạn hồ sơ: ${doc.title}`,
        `Hồ sơ của thầy/cô đã đến hoặc quá hạn nộp quy định (${doc.deadline || 'Hạn nộp tuần'}). Vui lòng kiểm tra và hoàn thành trên hệ thống.`,
        'deadline',
        doc.id
      );
      setSentNoticeDocId(doc.id);
      setTimeout(() => setSentNoticeDocId(null), 3000);
    } catch (e) {
      console.error('Error sending reminder:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 p-5 rounded-2xl border border-purple-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-950 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-purple-600" />
            Nhắc Việc & Theo Dõi Tiến Độ Hạn Nộp
          </h2>
          <p className="text-xs text-purple-600/80 mt-1">
            Tổng hợp hồ sơ sắp đến hạn, quá hạn, cần bổ sung và hồ sơ đang chờ kiểm duyệt.
          </p>
        </div>

        {!isLead && (isAdmin || isVicePrincipal) && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-purple-900">Lọc theo Tổ:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs font-medium rounded-xl border border-purple-200/80 bg-white px-3 py-1.5 text-slate-800 focus:outline-hidden focus:border-purple-400"
            >
              <option value="all">Tất cả 5 Tổ Khối</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4 Summary Stat Cards - Soft Pastel Tones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-950 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-rose-700">Đã quá hạn</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-950">{overdueDocs.length}</div>
          <p className="text-[10px] text-rose-600/80 mt-1 font-medium">Hồ sơ chưa hoàn thành</p>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 text-sky-950 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-sky-700">Sắp đến hạn (3 ngày)</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-950">{upcomingDocs.length}</div>
          <p className="text-[10px] text-sky-600/80 mt-1 font-medium">Cần nộp trước hạn</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-700">Yêu cầu bổ sung</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-950">{pendingRevisionDocs.length}</div>
          <p className="text-[10px] text-amber-700/80 mt-1 font-medium">Đang chờ giáo viên sửa đổi</p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-950 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-purple-700">Đang chờ kiểm duyệt</span>
            <BellRing className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-950">{waitingReviewDocs.length}</div>
          <p className="text-[10px] text-purple-600/80 mt-1 font-medium">Cần Tổ trưởng & BGH xử lý</p>
        </div>
      </div>

      {/* Overdue Section */}
      <div className="bg-white/95 rounded-2xl border border-purple-100 shadow-2xs overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-rose-50/70 to-pink-50/40 border-b border-rose-100 flex items-center justify-between">
          <h3 className="font-bold text-rose-950 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Danh sách hồ sơ quá hạn quy định ({overdueDocs.length})
          </h3>
        </div>

        <div className="divide-y divide-purple-50">
          {overdueDocs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Không có hồ sơ nào bị quá hạn.</div>
          ) : (
            overdueDocs.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-purple-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{doc.title}</span>
                    <DocumentStatusBadge status={doc.status} size="sm" />
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Giáo viên: <strong className="text-slate-700">{doc.ownerName}</strong> • {doc.departmentName} • {doc.categoryName}
                  </p>
                  <p className="text-rose-600 font-semibold text-[11px]">
                    Hạn nộp: {doc.deadline} (Đã quá hạn {Math.ceil((now.getTime() - new Date(doc.deadline!).getTime()) / (1000 * 60 * 60 * 24))} ngày)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(isAdmin || isVicePrincipal || isLead) && (
                    <button
                      onClick={() => handleSendNudge(doc)}
                      className="px-3 py-1.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5 text-purple-600" />
                      {sentNoticeDocId === doc.id ? 'Đã nhắc!' : 'Nhắc giáo viên'}
                    </button>
                  )}
                  <button
                    onClick={() => onSelectDocument(doc)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 hover:from-purple-600 hover:to-sky-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Xem hồ sơ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Needs Revision Section */}
      <div className="bg-white/95 rounded-2xl border border-purple-100 shadow-2xs overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-amber-50/70 to-orange-50/40 border-b border-amber-100 flex items-center justify-between">
          <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Hồ sơ có yêu cầu bổ sung / chỉnh sửa ({pendingRevisionDocs.length})
          </h3>
        </div>

        <div className="divide-y divide-purple-50">
          {pendingRevisionDocs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Không có hồ sơ nào đang chờ bổ sung.</div>
          ) : (
            pendingRevisionDocs.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-purple-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 text-xs">{doc.title}</span>
                  <p className="text-slate-500 text-[11px]">
                    Giáo viên: <strong className="text-slate-700">{doc.ownerName}</strong> • {doc.departmentName}
                  </p>
                  {doc.reviewNotes && (
                    <p className="text-amber-900 text-[11px] bg-amber-50/80 p-2 rounded-xl border border-amber-200">
                      Ý kiến người kiểm tra: "{doc.reviewNotes}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onSelectDocument(doc)}
                  className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Mở nộp lại
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
