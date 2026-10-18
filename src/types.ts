export type UserRole = 'admin' | 'vice_principal' | 'lead' | 'teacher';

export type UserStatus = 'pending' | 'active' | 'disabled';

export interface SchoolWorkspace {
  id: string; // e.g. 'th-ba-chuc', 'th-nguyen-du'
  name: string; // 'Trường Tiểu học Ba Chúc'
  code: string; // 'TH-BACHUC'
  principalName?: string;
  phone?: string;
  address?: string;
  currentAcademicYear?: string;
  isGifted?: boolean;
  status?: 'active' | 'pending';
  approvedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export type GiftRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SchoolGiftRequest {
  id: string;
  schoolName: string;
  schoolCode: string;
  principalName?: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  academicYear?: string;
  reasonOrNote?: string;
  status: GiftRequestStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string; // 'mynhienbobeo@gmail.com'
  createdSchoolId?: string;
  rejectionReason?: string;
}

export interface UserProfile {
  uid: string;
  schoolId?: string; // Multi-school partition
  email: string;
  displayName: string;
  positionTitle?: string; // e.g. "Hiệu trưởng", "Phó Hiệu trưởng", "Tổ trưởng Tổ 1", "Giáo viên CN lớp 3A"...
  photoURL?: string;
  role: UserRole;
  departmentId?: string; // 'khoi_1' | 'khoi_2' | 'khoi_3' | 'khoi_4' | 'khoi_5'
  departmentName?: string;
  status: UserStatus;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Department {
  id: string; // 'khoi_1', 'khoi_2', 'khoi_3', 'khoi_4', 'khoi_5'
  schoolId?: string;
  name: string; // 'Khối 1', 'Khối 2', ...
  gradeNumber: number; // 1 - 5
  leadUid?: string;
  leadName?: string;
  description?: string;
  teacherCount?: number;
  updatedAt?: string;
}

export type WorkflowType = 'direct_to_principal' | 'via_lead_then_principal';

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  workflowType: WorkflowType;
  allowedExtensions: string; // e.g. "doc, docx, pdf, xls, xlsx, ppt, pptx"
  maxSizeMb: number; // e.g. 25
  isActive: boolean;
  order: number;
}

export type DocumentStatus =
  | 'draft'               // Bản nháp
  | 'submitted'           // Đã nộp
  | 'pending_lead'        // Chờ tổ trưởng kiểm tra
  | 'pending_principal'   // Chờ Phó Hiệu trưởng kiểm tra
  | 'need_revision'       // Yêu cầu bổ sung
  | 'resubmitted'         // Đã nộp lại
  | 'approved'            // Đã phê duyệt
  | 'rejected';           // Từ chối / Không đạt

export interface DocumentVersion {
  versionNumber: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  storagePath?: string;
  submittedAt: string;
  submittedByUid: string;
  submittedByName: string;
  notes?: string;
}

export type ActionType =
  | 'comment'
  | 'request_revision'
  | 'approve'
  | 'reject'
  | 'submit'
  | 'resubmit';

export interface DocumentComment {
  id?: string;
  authorUid: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  actionType: ActionType;
  createdAt: string;
}

export interface SchoolDocument {
  id: string;
  schoolId?: string; // Multi-school partition
  title: string;
  categoryId: string;
  categoryName: string;
  departmentId: string; // khoi_1 to khoi_5
  departmentName: string;
  academicYear: string; // e.g. "2025-2026"
  semester: 'HK1' | 'HK2' | 'CaNam';
  subject?: string;
  grade?: number | string;
  gradeClass?: string;
  weekOrPeriod?: string; // Tuần 1, Tuần 2, ...
  notes?: string;
  deadline?: string;
  status: DocumentStatus;
  ownerUid: string;
  ownerName: string;
  ownerEmail: string;
  currentVersion: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  storagePath?: string;
  reviewedByUid?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemNotification {
  id: string;
  schoolId?: string;
  targetUid: string;
  title: string;
  message: string;
  type: 'deadline' | 'review' | 'revision' | 'approval' | 'system';
  linkDocId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemConfig {
  schoolId?: string;
  schoolName: string;
  currentAcademicYear: string;
  currentSemester: string;
  allowSelfRegistration: boolean;
  updatedAt?: string;
}
