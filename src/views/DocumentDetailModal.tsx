import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  SchoolDocument,
  DocumentVersion,
  DocumentComment,
  ActionType,
  DocumentStatus,
} from '../types';
import { DocumentStatusBadge } from '../components/DocumentStatusBadge';
import {
  getDocumentVersions,
  getDocumentComments,
  reviewDocument,
  resubmitDocumentVersion,
  addDocumentComment,
  deleteDraftDocument,
  createNotification,
} from '../services/documentService';
import { uploadSchoolDocument } from '../services/storageService';
import {
  X,
  FileText,
  Download,
  ExternalLink,
  History,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  UploadCloud,
  Layers,
  User,
  Calendar,
  Trash2,
  Share2,
} from 'lucide-react';

interface Props {
  document: SchoolDocument;
  onClose: () => void;
  onRefresh: () => void;
}

export const DocumentDetailModal: React.FC<Props> = ({ document: initialDoc, onClose, onRefresh }) => {
  const { userProfile, isAdmin, isVicePrincipal, isLead } = useAuth();
  const [docData, setDocData] = useState<SchoolDocument>(initialDoc);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  // Review states
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // General comment state
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Resubmit state for teacher
  const [showResubmitBox, setShowResubmitBox] = useState(false);
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [resubmitProgress, setResubmitProgress] = useState(0);
  const [resubmitError, setResubmitError] = useState<string | null>(null);

  const isOwner = userProfile?.uid === docData.ownerUid;
  const isDepartmentLead = isLead && userProfile?.departmentId === docData.departmentId;
  const canReview = isAdmin || isVicePrincipal || isDepartmentLead;

  // Load versions and comments
  const loadData = async () => {
    try {
      setLoadingVersions(true);
      setLoadingComments(true);
      const [vers, comms] = await Promise.all([
        getDocumentVersions(docData.id),
        getDocumentComments(docData.id),
      ]);
      setVersions(vers);
      setComments(comms);
    } catch (e) {
      console.error('Error loading versions/comments:', e);
    } finally {
      setLoadingVersions(false);
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [docData.id]);

  // Execute review action (Approve, Request Revision, Reject, Forward)
  const handleReviewAction = async (action: ActionType, targetStatus: DocumentStatus) => {
    if ((action === 'request_revision' || action === 'reject') && !reviewNote.trim()) {
      setReviewError('Vui lòng nhập lý do cụ thể khi yêu cầu bổ sung hoặc từ chối.');
      return;
    }

    if (!userProfile) return;

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      await reviewDocument(
        docData.id,
        {
          uid: userProfile.uid,
          name: userProfile.displayName || 'Người kiểm tra',
          role: userProfile.role,
        },
        action,
        targetStatus,
        reviewNote.trim() || (action === 'approve' ? 'Phê duyệt hồ sơ đạt yêu cầu.' : 'Đã rà soát hồ sơ.'),
        reviewNote.trim()
      );

      // Notify teacher
      if (docData.ownerUid !== userProfile.uid) {
        const titleMsg =
          targetStatus === 'approved'
            ? `Hồ sơ "${docData.title}" đã được phê duyệt`
            : targetStatus === 'need_revision'
            ? `Hồ sơ "${docData.title}" có yêu cầu bổ sung`
            : `Cập nhật trạng thái hồ sơ "${docData.title}"`;

        createNotification(
          docData.ownerUid,
          titleMsg,
          reviewNote.trim() || `Trạng thái mới: ${targetStatus}`,
          targetStatus === 'approved' ? 'approval' : 'revision',
          docData.id
        );
      }

      setReviewNote('');
      setIsSubmittingReview(false);
      onRefresh();
      setDocData((prev) => ({
        ...prev,
        status: targetStatus,
        reviewedByName: userProfile.displayName,
        reviewedAt: new Date().toISOString(),
        reviewNotes: reviewNote.trim(),
      }));
      await loadData();
    } catch (e: any) {
      setReviewError(e.message || 'Lỗi khi cập nhật trạng thái hồ sơ.');
      setIsSubmittingReview(false);
    }
  };

  // Add a standard feedback comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userProfile) return;

    setIsAddingComment(true);
    try {
      await addDocumentComment(
        docData.id,
        {
          uid: userProfile.uid,
          name: userProfile.displayName || 'Người dùng',
          role: userProfile.role,
        },
        newComment.trim(),
        'comment'
      );
      setNewComment('');
      await loadData();
    } catch (e) {
      console.error('Error adding comment:', e);
    } finally {
      setIsAddingComment(false);
    }
  };

  // Teacher resubmit revised file
  const handleResubmit = async () => {
    if (!resubmitFile) {
      setResubmitError('Vui lòng chọn tệp tài liệu mới đã chỉnh sửa.');
      return;
    }
    if (!userProfile) return;

    setIsSubmittingReview(true);
    setResubmitError(null);
    setResubmitProgress(0);

    try {
      const uploadRes = await uploadSchoolDocument(
        resubmitFile,
        docData.departmentId,
        userProfile.uid,
        (p) => setResubmitProgress(p.progress)
      );

      // New status: resubmitted
      await resubmitDocumentVersion(
        docData.id,
        docData,
        {
          fileUrl: uploadRes.fileUrl,
          fileName: uploadRes.fileName,
          fileSize: uploadRes.fileSize,
          storagePath: uploadRes.storagePath,
        },
        'resubmitted',
        resubmitNotes.trim() || 'Nộp lại phiên bản đã chỉnh sửa theo nhận xét',
        {
          uid: userProfile.uid,
          name: userProfile.displayName || 'Giáo viên',
          role: userProfile.role,
        }
      );

      setShowResubmitBox(false);
      setResubmitFile(null);
      setResubmitNotes('');
      setIsSubmittingReview(false);
      onRefresh();
      setDocData((prev) => ({
        ...prev,
        fileUrl: uploadRes.fileUrl,
        fileName: uploadRes.fileName,
        fileSize: uploadRes.fileSize,
        currentVersion: (prev.currentVersion || 1) + 1,
        status: 'resubmitted',
      }));
      await loadData();
    } catch (e: any) {
      setResubmitError(e.message || 'Lỗi khi nộp lại phiên bản mới.');
      setIsSubmittingReview(false);
    }
  };

  // Delete draft
  const handleDeleteDraft = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản nháp này?')) return;
    try {
      await deleteDraftDocument(docData.id);
      onRefresh();
      onClose();
    } catch (e) {
      console.error('Error deleting draft:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-purple-100/90 bg-gradient-to-r from-purple-50/80 via-sky-50/50 to-indigo-50/60 flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold border border-purple-200/70">
                Phiên bản v{docData.currentVersion || 1}
              </span>
              <DocumentStatusBadge status={docData.status} size="md" />
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                {docData.departmentName}
              </span>
              {docData.semester && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                  {docData.semester} • {docData.academicYear}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-purple-950 tracking-tight leading-snug">
              {docData.title}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              <span>Người nộp: <strong className="text-purple-950">{docData.ownerName}</strong></span>
              <span>•</span>
              <span>Thời gian: {new Date(docData.createdAt).toLocaleString('vi-VN')}</span>
              {docData.weekOrPeriod && (
                <>
                  <span>•</span>
                  <span className="font-medium text-purple-600">{docData.weekOrPeriod}</span>
                </>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-purple-700 hover:bg-purple-100/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Document & Download Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-sky-50/70 to-indigo-50/70 border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-400 via-indigo-400 to-sky-400 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-purple-950 truncate">{docData.fileName}</p>
                <p className="text-xs text-slate-500">
                  Dung lượng: {(docData.fileSize / (1024 * 1024)).toFixed(2)} MB • Loại: {docData.categoryName}
                </p>
                {docData.subject && (
                  <p className="text-xs text-purple-700 font-medium mt-0.5">
                    Môn: {docData.subject} {docData.gradeClass ? `• Lớp: ${docData.gradeClass}` : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              {docData.fileUrl ? (
                <a
                  href={docData.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white font-bold text-xs shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  Mở / Tải tệp xuống
                </a>
              ) : (
                <span className="text-xs text-slate-400 italic">Chưa có liên kết tệp</span>
              )}
            </div>
          </div>

          {/* Submission Notes */}
          {docData.notes && (
            <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
              <span className="font-bold text-purple-950 block mb-1">Ghi chú của giáo viên:</span>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{docData.notes}</p>
            </div>
          )}

          {/* Rejection / Revision reason notice if present */}
          {docData.status === 'need_revision' && docData.reviewNotes && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Yêu cầu bổ sung từ người kiểm tra ({docData.reviewedByName}):</p>
                <p className="mt-1 text-amber-900 leading-relaxed">{docData.reviewNotes}</p>
                <p className="mt-2 text-[11px] text-amber-800 font-medium">
                  Vui lòng cập nhật tài liệu đã sửa và bấm "Nộp lại phiên bản v{ (docData.currentVersion || 1) + 1 }" bên dưới.
                </p>
              </div>
            </div>
          )}

          {/* TEACHER RESUBMISSION BOX */}
          {isOwner && (docData.status === 'need_revision' || docData.status === 'rejected') && (
            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-slate-800 text-sm">
                    Nộp lại phiên bản sửa đổi (v{(docData.currentVersion || 1) + 1})
                  </h4>
                </div>
                {!showResubmitBox && (
                  <button
                    onClick={() => setShowResubmitBox(true)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs hover:from-amber-600 hover:to-orange-600 transition cursor-pointer shadow-2xs"
                  >
                    Bắt đầu nộp lại
                  </button>
                )}
              </div>

              {showResubmitBox && (
                <div className="space-y-3 pt-2">
                  <input
                    type="file"
                    id="resubmit-file"
                    accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                    onChange={(e) => setResubmitFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                  />

                  <textarea
                    rows={2}
                    value={resubmitNotes}
                    onChange={(e) => setResubmitNotes(e.target.value)}
                    placeholder="Ghi chú nội dung đã chỉnh sửa hoặc tiếp thu ý kiến..."
                    className="w-full text-xs rounded-xl border border-purple-200/80 p-2.5 text-slate-800 focus:outline-hidden focus:border-purple-400 bg-white"
                  />

                  {resubmitProgress > 0 && resubmitProgress < 100 && (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-sky-400 rounded-full" style={{ width: `${resubmitProgress}%` }} />
                    </div>
                  )}

                  {resubmitError && (
                    <p className="text-xs text-rose-600 font-medium">{resubmitError}</p>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowResubmitBox(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingReview}
                      onClick={handleResubmit}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      {isSubmittingReview ? 'Đang nộp...' : 'Xác nhận nộp bản v' + ((docData.currentVersion || 1) + 1)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DRAFT ACTIONS */}
          {isOwner && docData.status === 'draft' && (
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-950">Đây là bản nháp chưa gửi</p>
                <p className="text-[11px] text-slate-500">Người kiểm tra chưa nhìn thấy bản này.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteDraft}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa nháp
                </button>
                <button
                  onClick={() => handleReviewAction('submit', 'pending_lead')}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 rounded-xl shadow-xs cursor-pointer"
                >
                  Gửi nộp chính thức
                </button>
              </div>
            </div>
          )}

          {/* REVIEW & APPROVAL WORKFLOW ACTION PANEL (for Lead, Vice Principal, Admin) */}
          {canReview && docData.status !== 'approved' && (
            <div className="p-5 rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/60 via-sky-50/40 to-white space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span>Khu vực Kiểm tra & Phê duyệt Chuyên môn</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhận xét chuyên môn / Yêu cầu bổ sung (nếu có)
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Nhập nhận xét về nội dung giáo án, phân phối thời lượng, hình thức trình bày, yêu cầu minh chứng..."
                  className="w-full text-xs rounded-xl border border-purple-200 p-3 text-slate-800 focus:outline-hidden focus:border-purple-400 bg-white"
                />
              </div>

              {reviewError && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {reviewError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                {/* Request Revision */}
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleReviewAction('request_revision', 'need_revision')}
                  className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs transition cursor-pointer"
                >
                  Yêu cầu bổ sung / chỉnh sửa
                </button>

                {/* Lead Forwarding to Vice Principal */}
                {isDepartmentLead && docData.status !== 'pending_principal' && (
                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => handleReviewAction('comment', 'pending_principal')}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Tổ trưởng duyệt & Chuyển Phó Hiệu trưởng
                  </button>
                )}

                {/* Official Approval (Vice Principal / Admin, or Lead if configured) */}
                {(isVicePrincipal || isAdmin) && (
                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => handleReviewAction('approve', 'approved')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Phê duyệt chính thức
                  </button>
                )}

                {/* Reject */}
                {(isVicePrincipal || isAdmin) && (
                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => handleReviewAction('reject', 'rejected')}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition cursor-pointer"
                  >
                    Từ chối / Chưa đạt
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TWO-COLUMN LOWER SECTION: Version History & Activity Log */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-purple-100">
            {/* Version History */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-950 font-bold text-xs uppercase tracking-wider">
                <History className="w-4 h-4 text-purple-600" />
                <span>Lịch sử các phiên bản nộp</span>
              </div>

              {loadingVersions ? (
                <p className="text-xs text-slate-400">Đang tải lịch sử phiên bản...</p>
              ) : versions.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có lịch sử phiên bản phụ.</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((ver) => (
                    <div
                      key={ver.versionNumber}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        ver.versionNumber === docData.currentVersion
                          ? 'bg-purple-50/80 border-purple-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-950">Phiên bản v{ver.versionNumber}</span>
                          {ver.versionNumber === docData.currentVersion && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-purple-600 text-white rounded font-semibold">
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">{ver.fileName}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(ver.submittedAt).toLocaleString('vi-VN')}
                        </p>
                        {ver.notes && <p className="text-[11px] text-purple-700 mt-1 italic leading-relaxed">"{ver.notes}"</p>}
                      </div>

                      {ver.fileUrl && (
                        <a
                          href={ver.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition"
                          title="Tải phiên bản này"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments & Audit Trail */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-950 font-bold text-xs uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span>Lịch sử nhận xét & Xử lý ({comments.length})</span>
              </div>

              {/* Feed */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {loadingComments ? (
                  <p className="text-xs text-slate-400">Đang tải lịch sử...</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-slate-400">Chưa có nhận xét nào.</p>
                ) : (
                  comments.map((cm) => (
                    <div key={cm.id || cm.createdAt} className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-purple-700 mb-1">
                        <span className="font-bold text-purple-950">{cm.authorName}</span>
                        <span>{new Date(cm.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{cm.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment box */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ghi thêm trao đổi hoặc phản hồi..."
                  className="flex-1 text-xs rounded-xl border border-purple-200 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-purple-400 bg-white"
                />
                <button
                  type="submit"
                  disabled={isAddingComment || !newComment.trim()}
                  className="px-3 py-2 bg-gradient-to-r from-purple-500 to-sky-400 hover:from-purple-600 hover:to-sky-500 text-white rounded-xl text-xs font-semibold shrink-0 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-100/90 bg-gradient-to-r from-purple-50/40 to-sky-50/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
