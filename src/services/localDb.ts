import { supabase } from '../supabase';
import {
  SchoolDocument,
  DocumentVersion,
  DocumentComment,
  SystemNotification,
  Department,
  DocumentCategory,
  UserProfile,
  SchoolWorkspace,
  SchoolGiftRequest,
} from '../types';
import {
  DEFAULT_DEPARTMENTS,
  DEFAULT_CATEGORIES,
  DEFAULT_STAFF_MEMBERS,
  DEFAULT_SCHOOL_WORKSPACES,
  DEFAULT_GIFT_REQUESTS,
} from '../constants';

const STORAGE_KEYS = {
  DOCS_PREFIX: 'school_docs_',
  VERSIONS_PREFIX: 'school_doc_versions_',
  COMMENTS_PREFIX: 'school_doc_comments_',
  NOTIFS_PREFIX: 'school_notifs_',
  DEPTS_PREFIX: 'school_depts_',
  CATS_PREFIX: 'school_cats_',
  STAFF_PREFIX: 'school_staff_',
  WORKSPACES: 'school_workspaces_list',
  GIFT_REQUESTS: 'school_gift_requests_list',
};

const INITIAL_SAMPLE_DOCS: SchoolDocument[] = [
  {
    id: 'doc-sample-toan-2',
    schoolId: 'th-ba-chuc',
    title: 'Kế hoạch bài dạy Tuần 24: Môn Toán Lớp 2 - Bài Bảng chia 2',
    subject: 'Toán',
    grade: 2,
    gradeClass: '2A',
    academicYear: '2026-2027',
    semester: 'HK1',
    categoryId: 'khbd_tuan',
    categoryName: 'Kế hoạch bài dạy (Tuần)',
    departmentId: 'khoi_2',
    departmentName: 'Tổ Khối 2',
    ownerUid: 'gv_lethithanh',
    ownerName: 'Cô Lê Thị Thanh',
    ownerEmail: 'thanh.le@bachuc.edu.vn',
    status: 'approved',
    currentVersion: 1,
    fileName: 'KHBD_Toan2_Tuan24_BangChia2.docx',
    fileSize: 45280,
    fileUrl: 'https://docs.google.com/document/d/sample-toan2/preview',
    storagePath: 'documents/khoi_2/gv_lethithanh/KHBD_Toan2_Tuan24.docx',
    notes: 'Kính gửi Tổ trưởng duyệt kế hoạch bài dạy môn Toán tuần 24.',
    reviewedByUid: 'admin_mynhien',
    reviewedByName: 'Cô Trương Thị Mỹ Nhiên',
    reviewedAt: '2026-10-15T08:30:00.000Z',
    reviewNotes: 'Kế hoạch bài dạy xây dựng công phu, chuẩn bị đồ dùng trực quan tốt, phân hóa học sinh rõ ràng. Đạt yêu cầu phê duyệt.',
    createdAt: '2026-10-14T09:00:00.000Z',
    updatedAt: '2026-10-15T08:30:00.000Z',
  },
  {
    id: 'doc-sample-tv-2',
    schoolId: 'th-ba-chuc',
    title: 'Kế hoạch bài dạy Tuần 25: Môn Tiếng Việt Lớp 2 - Bài Mùa lúa chín',
    subject: 'Tiếng Việt',
    grade: 2,
    gradeClass: '2A',
    academicYear: '2026-2027',
    semester: 'HK1',
    categoryId: 'khbd_tuan',
    categoryName: 'Kế hoạch bài dạy (Tuần)',
    departmentId: 'khoi_2',
    departmentName: 'Tổ Khối 2',
    ownerUid: 'gv_lethithanh',
    ownerName: 'Cô Lê Thị Thanh',
    ownerEmail: 'thanh.le@bachuc.edu.vn',
    status: 'pending_lead',
    currentVersion: 1,
    fileName: 'KHBD_TiengViet2_Tuan25_MuaLuaChin.docx',
    fileSize: 51200,
    fileUrl: 'https://docs.google.com/document/d/sample-tv2/preview',
    storagePath: 'documents/khoi_2/gv_lethithanh/KHBD_TV2_Tuan25.docx',
    notes: 'Nộp kế hoạch bài dạy Tiếng Việt tuần 25, kính nhờ cô Mỹ Nhiên phê duyệt.',
    createdAt: '2026-10-16T10:15:00.000Z',
    updatedAt: '2026-10-16T10:15:00.000Z',
  },
  {
    id: 'doc-sample-tnxh-1',
    schoolId: 'th-ba-chuc',
    title: 'Kế hoạch dạy học Tuần 25: Môn Tự nhiên và Xã hội Lớp 1 - Bài Cây xung quanh em',
    subject: 'Tự nhiên và Xã hội',
    grade: 1,
    gradeClass: '1A',
    academicYear: '2026-2027',
    semester: 'HK1',
    categoryId: 'khbd_tuan',
    categoryName: 'Kế hoạch bài dạy (Tuần)',
    departmentId: 'khoi_1',
    departmentName: 'Tổ Khối 1',
    ownerUid: 'gv_nguyenthilan',
    ownerName: 'Cô Nguyễn Thị Lan',
    ownerEmail: 'lan.nguyen@bachuc.edu.vn',
    status: 'pending_principal',
    currentVersion: 1,
    fileName: 'KHBD_TNXH1_Tuan25_CayXungQuanhEm.docx',
    fileSize: 38900,
    fileUrl: 'https://docs.google.com/document/d/sample-tnxh1/preview',
    storagePath: 'documents/khoi_1/gv_nguyenthilan/KHBD_TNXH1.docx',
    notes: 'Tổ 1 đã thông qua, kính chuyển BGH phê duyệt.',
    reviewedByUid: 'lead_phamthihong',
    reviewedByName: 'Cô Phạm Thị Hồng',
    reviewedAt: '2026-10-15T14:20:00.000Z',
    reviewNotes: 'Tổ trưởng đã duyệt, kính chuyển Ban Giám Hiệu ký duyệt chung.',
    createdAt: '2026-10-15T11:00:00.000Z',
    updatedAt: '2026-10-15T14:20:00.000Z',
  },
  {
    id: 'doc-sample-shcm-k2',
    schoolId: 'th-ba-chuc',
    title: 'Biên bản Sinh hoạt chuyên môn Tổ Khối 2 - Tháng 10/2026',
    subject: 'Sinh hoạt chuyên môn',
    grade: 2,
    gradeClass: 'Khối 2',
    academicYear: '2026-2027',
    semester: 'HK1',
    categoryId: 'shcm_bb',
    categoryName: 'Biên bản sinh hoạt tổ chuyên môn',
    departmentId: 'khoi_2',
    departmentName: 'Tổ Khối 2',
    ownerUid: 'admin_mynhien',
    ownerName: 'Cô Trương Thị Mỹ Nhiên',
    ownerEmail: 'mynhienbobeo@gmail.com',
    status: 'approved',
    currentVersion: 1,
    fileName: 'BienBan_SHCM_ToKhoi2_Thang10.pdf',
    fileSize: 67200,
    fileUrl: 'https://docs.google.com/document/d/sample-bb-k2/preview',
    storagePath: 'documents/khoi_2/admin_mynhien/BienBan_SHCM.pdf',
    notes: 'Biên bản họp chuyên môn nghiên cứu bài học môn Toán và Tiếng Việt Khối 2.',
    reviewedByUid: 'bgh_hieutruong',
    reviewedByName: 'Thầy Trần Văn Hiếu',
    reviewedAt: '2026-10-16T16:00:00.000Z',
    reviewNotes: 'Biên bản đầy đủ ý kiến đóng góp, chỉ đạo sát thực tế giảng dạy khối 2.',
    createdAt: '2026-10-16T15:30:00.000Z',
    updatedAt: '2026-10-16T16:00:00.000Z',
  },
  {
    id: 'doc-sample-khgd-nam',
    schoolId: 'th-ba-chuc',
    title: 'Kế hoạch giáo dục nhà trường năm học 2026-2027 (Kèm Khung PPCT)',
    subject: 'Toàn trường',
    gradeClass: 'Toàn trường',
    academicYear: '2026-2027',
    semester: 'CaNam',
    categoryId: 'khgd_nam',
    categoryName: 'Kế hoạch giáo dục nhà trường',
    departmentId: 'bgh',
    departmentName: 'Ban Giám Hiệu',
    ownerUid: 'bgh_nguyenvannam',
    ownerName: 'Thầy Nguyễn Văn Nam',
    ownerEmail: 'nam.nguyen@bachuc.edu.vn',
    status: 'approved',
    currentVersion: 1,
    fileName: 'KeHoachGiaoDuc_2026_2027.pdf',
    fileSize: 125000,
    fileUrl: 'https://docs.google.com/document/d/sample-khgd-nam/preview',
    storagePath: 'documents/bgh/KeHoachGiaoDuc.pdf',
    notes: 'Kế hoạch giáo dục chung toàn trường đã được Hội đồng trường thông qua.',
    reviewedByUid: 'bgh_hieutruong',
    reviewedByName: 'Thầy Trần Văn Hiếu',
    reviewedAt: '2026-09-05T09:00:00.000Z',
    reviewNotes: 'Phê duyệt ban hành áp dụng toàn trường năm học 2026-2027.',
    createdAt: '2026-09-04T08:00:00.000Z',
    updatedAt: '2026-09-05T09:00:00.000Z',
  },
];

class LocalDatabaseManager {
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => this.notify());
    }
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn('Listener error in localDb:', e);
      }
    });
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // --- DOCUMENTS ---
  public getDocuments(schoolId: string): SchoolDocument[] {
    if (typeof window === 'undefined') return [];
    const key = `${STORAGE_KEYS.DOCS_PREFIX}${schoolId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      // If Ba Chuc school and empty, initialize with rich sample documents
      if (schoolId === 'th-ba-chuc') {
        localStorage.setItem(key, JSON.stringify(INITIAL_SAMPLE_DOCS));
        return INITIAL_SAMPLE_DOCS;
      }
      return [];
    } catch {
      return [];
    }
  }

  public saveDocument(docData: SchoolDocument): void {
    if (typeof window === 'undefined') return;
    const schoolId = docData.schoolId || 'th-ba-chuc';
    const docs = this.getDocuments(schoolId);
    const existingIndex = docs.findIndex((d) => d.id === docData.id);

    let updated: SchoolDocument[];
    if (existingIndex >= 0) {
      updated = [...docs];
      updated[existingIndex] = { ...docData, updatedAt: new Date().toISOString() };
    } else {
      updated = [docData, ...docs];
    }

    const key = `${STORAGE_KEYS.DOCS_PREFIX}${schoolId}`;
    localStorage.setItem(key, JSON.stringify(updated));
    this.notify();

    // Async sync to Supabase table 'documents'
    try {
      supabase
        .from('documents')
        .upsert({
          id: docData.id,
          school_id: schoolId,
          title: docData.title,
          category_id: docData.categoryId,
          category_name: docData.categoryName || '',
          department_id: docData.departmentId || '',
          department_name: docData.departmentName || '',
          academic_year: docData.academicYear || '2026-2027',
          semester: docData.semester || 'HK1',
          subject: docData.subject || '',
          grade: typeof docData.grade === 'number' ? docData.grade : (docData.grade ? parseInt(String(docData.grade)) : null),
          grade_class: docData.gradeClass || '',
          week_or_period: docData.weekOrPeriod || '',
          status: docData.status,
          owner_uid: docData.ownerUid,
          owner_name: docData.ownerName,
          owner_email: docData.ownerEmail,
          current_version: docData.currentVersion || 1,
          file_url: docData.fileUrl,
          file_name: docData.fileName,
          file_size: docData.fileSize || 0,
          file_type: docData.fileType || '',
          storage_path: docData.storagePath || '',
          notes: docData.notes || '',
          reviewed_by_uid: docData.reviewedByUid || null,
          reviewed_by_name: docData.reviewedByName || null,
          reviewed_at: docData.reviewedAt || null,
          review_notes: docData.reviewNotes || null,
          rejection_reason: docData.rejectionReason || null,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase Sync] document notice:', error.message);
          }
        });
    } catch {
      // offline fallback
    }
  }

  public deleteDocument(docId: string, schoolId: string): void {
    if (typeof window === 'undefined') return;
    const docs = this.getDocuments(schoolId);
    const updated = docs.filter((d) => d.id !== docId);
    const key = `${STORAGE_KEYS.DOCS_PREFIX}${schoolId}`;
    localStorage.setItem(key, JSON.stringify(updated));
    this.notify();

    // Async delete from Supabase table 'documents'
    try {
      supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase Sync] document delete notice:', error.message);
          }
        });
    } catch {
      // offline fallback
    }
  }

  // --- VERSIONS ---
  public getVersions(docId: string): DocumentVersion[] {
    if (typeof window === 'undefined') return [];
    const key = `${STORAGE_KEYS.VERSIONS_PREFIX}${docId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      return [
        {
          versionNumber: 1,
          fileUrl: '',
          fileName: 'BanGoc.docx',
          fileSize: 50000,
          submittedAt: new Date().toISOString(),
          submittedByUid: 'system',
          submittedByName: 'Người nộp',
          notes: 'Phiên bản nộp đầu tiên (v1)',
        },
      ];
    } catch {
      return [];
    }
  }

  public addVersion(docId: string, version: DocumentVersion): void {
    if (typeof window === 'undefined') return;
    const versions = this.getVersions(docId);
    const updated = [version, ...versions];
    localStorage.setItem(`${STORAGE_KEYS.VERSIONS_PREFIX}${docId}`, JSON.stringify(updated));
    this.notify();
  }

  // --- COMMENTS ---
  public getComments(docId: string): DocumentComment[] {
    if (typeof window === 'undefined') return [];
    const key = `${STORAGE_KEYS.COMMENTS_PREFIX}${docId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  }

  public addComment(docId: string, comment: DocumentComment): void {
    if (typeof window === 'undefined') return;
    const comments = this.getComments(docId);
    const updated = [...comments, { ...comment, id: `cmt-${Date.now()}` }];
    localStorage.setItem(`${STORAGE_KEYS.COMMENTS_PREFIX}${docId}`, JSON.stringify(updated));
    this.notify();
  }

  // --- NOTIFICATIONS ---
  public getNotifications(userUid: string): SystemNotification[] {
    if (typeof window === 'undefined') return [];
    const key = `${STORAGE_KEYS.NOTIFS_PREFIX}${userUid}`;
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  }

  public saveNotification(notification: SystemNotification): void {
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEYS.NOTIFS_PREFIX}${notification.targetUid}`;
    const list = this.getNotifications(notification.targetUid);
    const updated = [notification, ...list];
    localStorage.setItem(key, JSON.stringify(updated));
    this.notify();
  }

  public markNotificationAsRead(userUid: string, notifId: string): void {
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEYS.NOTIFS_PREFIX}${userUid}`;
    const list = this.getNotifications(userUid);
    const updated = list.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
    localStorage.setItem(key, JSON.stringify(updated));
    this.notify();
  }

  public markAllNotificationsAsRead(userUid: string): void {
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEYS.NOTIFS_PREFIX}${userUid}`;
    const list = this.getNotifications(userUid);
    const updated = list.map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(key, JSON.stringify(updated));
    this.notify();
  }

  // --- DEPARTMENTS ---
  public getDepartments(schoolId: string = 'th-ba-chuc'): Department[] {
    if (typeof window === 'undefined') return DEFAULT_DEPARTMENTS;
    const key = `${STORAGE_KEYS.DEPTS_PREFIX}${schoolId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      return DEFAULT_DEPARTMENTS;
    } catch {
      return DEFAULT_DEPARTMENTS;
    }
  }

  public saveDepartments(departments: Department[], schoolId: string = 'th-ba-chuc'): void {
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEYS.DEPTS_PREFIX}${schoolId}`;
    localStorage.setItem(key, JSON.stringify(departments));
    this.notify();
  }

  // --- CATEGORIES ---
  public getCategories(schoolId: string = 'th-ba-chuc'): DocumentCategory[] {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
    const key = `${STORAGE_KEYS.CATS_PREFIX}${schoolId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  public saveCategories(categories: DocumentCategory[], schoolId: string = 'th-ba-chuc'): void {
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEYS.CATS_PREFIX}${schoolId}`;
    localStorage.setItem(key, JSON.stringify(categories));
    this.notify();
  }

  // --- STAFF ---
  public getStaff(schoolId: string = 'th-ba-chuc'): UserProfile[] {
    if (typeof window === 'undefined') return DEFAULT_STAFF_MEMBERS;
    const key = `${STORAGE_KEYS.STAFF_PREFIX}${schoolId}`;
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      return DEFAULT_STAFF_MEMBERS;
    } catch {
      return DEFAULT_STAFF_MEMBERS;
    }
  }

  public saveStaff(staff: UserProfile[], schoolId: string = 'th-ba-chuc'): void {
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEYS.STAFF_PREFIX}${schoolId}`;
    localStorage.setItem(key, JSON.stringify(staff));
    this.notify();
  }
}

export const localDb = new LocalDatabaseManager();
