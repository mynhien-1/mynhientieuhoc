import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Department, DocumentCategory, DocumentStatus, SchoolDocument } from '../types';
import { PRIMARY_SUBJECTS, ACADEMIC_YEARS } from '../constants';
import { uploadSchoolDocument } from '../services/storageService';
import { createDocumentRecord, createNotification } from '../services/documentService';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  Clock,
  X,
  Link2,
} from 'lucide-react';

interface Props {
  departments: Department[];
  categories: DocumentCategory[];
  onSuccess: (newDocId: string) => void;
  onCancel: () => void;
}

export const SubmissionPortalView: React.FC<Props> = ({
  departments,
  categories,
  onSuccess,
  onCancel,
}) => {
  const { activeSchool, userProfile, systemConfig, selectedAcademicYear, isAdmin, isVicePrincipal, isLead } = useAuth();

  // Form states
  const [academicYear, setAcademicYear] = useState(selectedAcademicYear || systemConfig?.currentAcademicYear || '2026-2027');
  const [semester, setSemester] = useState<'HK1' | 'HK2' | 'CaNam'>('HK1');
  const [departmentId, setDepartmentId] = useState<string>(
    userProfile?.departmentId || (departments[0]?.id ?? 'khoi_1')
  );
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || 'giao-an-tuan');
  const [subject, setSubject] = useState<string>('Tiếng Việt');
  const [gradeClass, setGradeClass] = useState<string>('');
  const [weekOrPeriod, setWeekOrPeriod] = useState<string>('Tuần 1');
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storageFallbackUrl, setStorageFallbackUrl] = useState<string>('');
  const [showFallbackLinkInput, setShowFallbackLinkInput] = useState(false);

  // Selected Category details
  const activeCategory = categories.find((c) => c.id === categoryId) || categories[0];
  const selectedDept = departments.find((d) => d.id === departmentId);

  // Sync department when userProfile changes
  React.useEffect(() => {
    if (userProfile?.departmentId) {
      setDepartmentId(userProfile.departmentId);
    }
  }, [userProfile?.departmentId]);

  // Auto-generate title helper
  const handleAutoTitle = () => {
    if (!title && activeCategory) {
      const generated = `${activeCategory.name} - ${subject || 'Chung'} - ${weekOrPeriod} - Năm học ${academicYear}`;
      setTitle(generated);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate size
    const maxMb = activeCategory?.maxSizeMb || 25;
    if (file.size > maxMb * 1024 * 1024) {
      setUploadError(`Tệp vượt quá dung lượng tối đa cho phép (${maxMb}MB).`);
      setSelectedFile(null);
      return;
    }

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = (activeCategory?.allowedExtensions || 'doc, docx, pdf, xls, xlsx, ppt, pptx')
      .split(',')
      .map((s) => s.trim().toLowerCase());

    if (ext && !allowed.includes(ext)) {
      setUploadError(`Định dạng tệp .${ext} không thuộc danh mục được phép (${allowed.join(', ')}).`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!title.trim()) {
      setUploadError('Vui lòng nhập tiêu đề hồ sơ / giáo án.');
      return;
    }

    if (!selectedFile && !storageFallbackUrl.trim()) {
      setUploadError('Vui lòng chọn tệp tài liệu từ thiết bị hoặc dán đường dẫn lưu trữ.');
      return;
    }

    if (!userProfile) {
      setUploadError('Không tìm thấy thông tin tài khoản người dùng.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      let fileUrl = storageFallbackUrl.trim();
      let storagePath = '';
      let fileName = selectedFile?.name || 'tai_lieu_chuyen_mon.pdf';
      let fileSize = selectedFile?.size || 0;
      let fileType = selectedFile?.type || 'application/pdf';

      if (selectedFile) {
        try {
          const result = await uploadSchoolDocument(
            selectedFile,
            departmentId,
            userProfile.uid,
            (p) => setUploadProgress(p.progress)
          );
          fileUrl = result.fileUrl;
          storagePath = result.storagePath;
          fileName = result.fileName;
          fileSize = result.fileSize;
          fileType = result.fileType;
        } catch (storageErr: any) {
          console.error('Storage upload failed:', storageErr);
          setUploadError(
            `${storageErr.message || 'Lỗi tải tệp lên Cloud Storage.'} Nếu dự án chưa bật Cloud Storage, bạn có thể chuyển sang chế độ "Dán link lưu trữ đám mây" (Google Drive / OneDrive) bên dưới.`
          );
          setShowFallbackLinkInput(true);
          setIsUploading(false);
          return;
        }
      }

      // Determine initial status based on category workflow
      let initialStatus: DocumentStatus = 'draft';
      if (!isDraft) {
        if (activeCategory?.workflowType === 'via_lead_then_principal') {
          initialStatus = 'pending_lead';
        } else {
          initialStatus = 'pending_principal';
        }
      }

      const newDocId = await createDocumentRecord(
        {
          schoolId: activeSchool.id,
          title: title.trim(),
          categoryId,
          categoryName: activeCategory?.name || 'Hồ sơ chuyên môn',
          departmentId,
          departmentName: selectedDept?.name || 'Tổ Khối',
          academicYear,
          semester,
          subject,
          gradeClass,
          weekOrPeriod,
          notes: notes.trim(),
          deadline: deadline || '',
          status: initialStatus,
          ownerUid: userProfile.uid,
          ownerName: userProfile.displayName || 'Giáo viên',
          ownerEmail: userProfile.email,
          fileUrl,
          fileName,
          fileSize,
          fileType,
          storagePath,
        },
        notes
      );

      // Create notification to reviewer if submitted officially
      if (!isDraft && selectedDept?.leadUid) {
        createNotification(
          selectedDept.leadUid,
          'Có hồ sơ chuyên môn mới cần kiểm tra',
          `Giáo viên ${userProfile.displayName} vừa nộp hồ sơ "${title}" thuộc ${selectedDept.name}.`,
          'review',
          newDocId
        );
      }

      setIsUploading(false);
      onSuccess(newDocId);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setUploadError(err.message || 'Có lỗi xảy ra khi lưu hồ sơ vào cơ sở dữ liệu.');
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white/95 p-6 rounded-2xl border border-purple-100/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-purple-950 tracking-tight">
              Cổng Nộp Hồ Sơ & Giáo Án Chuyên Môn
            </h2>
            <p className="text-xs text-purple-600/80 mt-1">
              Tải kế hoạch bài dạy, giáo án, hồ sơ chuyên môn cá nhân hoặc tổ lên hệ thống số của nhà trường.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-xl border border-purple-200 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition cursor-pointer"
          >
            Hủy / Quay lại
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white/95 p-6 rounded-2xl border border-purple-100/90 shadow-2xs space-y-6">
        {/* Section 1: Classification */}
        <div>
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            1. Phân loại hồ sơ & Thời gian áp dụng
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Academic Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Năm học <span className="text-rose-500">*</span>
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 bg-white"
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    Năm học {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Học kỳ <span className="text-rose-500">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as any)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 bg-white"
              >
                <option value="HK1">Học kì 1</option>
                <option value="HK2">Học kì 2</option>
                <option value="CaNam">Cả năm</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tổ Khối <span className="text-rose-500">*</span>
              </label>
              <select
                value={departmentId}
                disabled={!isAdmin && !isVicePrincipal && !!userProfile?.departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại hồ sơ chuyên môn <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setUploadError(null);
                }}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.workflowType === 'direct_to_principal' ? '(PHT duyệt trực tiếp)' : '(Qua Tổ trưởng rà soát)'}
                  </option>
                ))}
              </select>
              {activeCategory?.description && (
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {activeCategory.description}
                </p>
              )}
            </div>

            {/* Week or Period */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tuần / Giai đoạn áp dụng <span className="text-rose-500">*</span>
              </label>
              <select
                value={weekOrPeriod}
                onChange={(e) => setWeekOrPeriod(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 bg-white"
              >
                {Array.from({ length: 35 }, (_, i) => `Tuần ${i + 1}`).map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
                <option value="Tháng 9">Tháng 9</option>
                <option value="Tháng 10">Tháng 10</option>
                <option value="Tháng 11">Tháng 11</option>
                <option value="Tháng 12">Tháng 12</option>
                <option value="Tháng 1">Tháng 1</option>
                <option value="Tháng 2">Tháng 2</option>
                <option value="Tháng 3">Tháng 3</option>
                <option value="Tháng 4">Tháng 4</option>
                <option value="Tháng 5">Tháng 5</option>
                <option value="Cả năm học">Cả năm học</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học (nếu có)</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 bg-white"
              >
                <option value="Tất cả các môn / Không áp dụng">Tất cả các môn / Không áp dụng</option>
                {PRIMARY_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp giảng dạy</label>
              <input
                type="text"
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                placeholder="Ví dụ: 1A1, 2A3, Khối 3..."
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn nộp quy định (nếu có)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Details & Title */}
        <div className="pt-4 border-t border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              2. Tiêu đề & Ghi chú hồ sơ
            </h3>
            <button
              type="button"
              onClick={handleAutoTitle}
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
            >
              Gợi ý tên chuẩn
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên hồ sơ / Kế hoạch bài dạy <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Kế hoạch bài dạy Tuần 3 - Môn Tiếng Việt - Lớp 2A1"
                className="w-full text-xs font-medium rounded-xl border border-purple-200/80 px-3.5 py-2.5 text-slate-800 focus:outline-hidden focus:border-purple-400 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú hoặc lời nhắn đến người kiểm tra</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập nội dung cần lưu ý (ví dụ: đã bổ sung tiết ôn tập theo kế hoạch nhà trường)..."
                className="w-full text-xs font-medium rounded-xl border border-purple-200/80 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Section 3: File Upload */}
        <div className="pt-4 border-t border-purple-100">
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-purple-600" />
            3. Tệp đính kèm (Lưu trữ trực tuyến)
          </h3>

          <div className="p-5 border-2 border-dashed border-purple-200/90 rounded-2xl bg-gradient-to-br from-purple-50/40 via-sky-50/30 to-indigo-50/30 hover:bg-purple-50/50 transition text-center">
            <input
              type="file"
              id="file-upload"
              onChange={handleFileChange}
              accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-400 to-sky-400 text-white flex items-center justify-center shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-purple-700 hover:text-purple-900">Chọn tệp từ máy tính / điện thoại</span>
                <span className="text-slate-500"> hoặc kéo thả vào đây</span>
              </div>
              <p className="text-[11px] text-purple-500/80">
                Định dạng: {activeCategory?.allowedExtensions || 'DOC, DOCX, PDF, XLS, XLSX, PPT, PPTX'} (Tối đa {activeCategory?.maxSizeMb || 25}MB)
              </p>
            </label>

            {selectedFile && (
              <div className="mt-4 p-3 bg-white rounded-xl border border-purple-100 flex items-center justify-between text-left max-w-md mx-auto shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-purple-950 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-purple-500/80 font-medium">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Tệp tài liệu'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Bỏ chọn tệp"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Fallback Cloud Storage link option */}
          <div className="mt-3">
            {!showFallbackLinkInput ? (
              <button
                type="button"
                onClick={() => setShowFallbackLinkInput(true)}
                className="text-[11px] text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                Hoặc sử dụng đường dẫn lưu trữ trực tuyến (Google Drive, OneDrive)
              </button>
            ) : (
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 mt-2 space-y-1.5">
                <label className="block text-xs font-semibold text-purple-900">
                  Đường dẫn tệp trên Google Drive / OneDrive
                </label>
                <input
                  type="url"
                  value={storageFallbackUrl}
                  onChange={(e) => setStorageFallbackUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full text-xs rounded-xl border border-purple-200 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-purple-400 bg-white"
                />
                <p className="text-[10px] text-slate-500">
                  Lưu ý cấp quyền "Người có đường liên kết có thể xem" khi dùng Google Drive.
                </p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-950">
                <span>Đang tải tệp lên Firebase Cloud Storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-sky-400 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Banner */}
          {uploadError && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 leading-relaxed">
                <p className="font-bold">Lỗi xử lý nộp hồ sơ:</p>
                <p>{uploadError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-purple-200 text-purple-800 hover:bg-purple-50 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
          >
            Lưu bản nháp
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white font-bold text-xs shadow-md shadow-purple-200/50 transition cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {activeCategory?.workflowType === 'via_lead_then_principal'
              ? 'Nộp hồ sơ (Chuyển Tổ trưởng kiểm tra)'
              : 'Nộp hồ sơ (Chuyển Phó Hiệu trưởng)'}
          </button>
        </div>
      </div>
    </div>
  );
};
