import { localDb } from './localDb';
import {
  SchoolDocument,
  DocumentVersion,
  DocumentComment,
  DocumentStatus,
  SystemNotification,
  ActionType,
  UserRole,
} from '../types';

// Create a new school document record (Draft or Submitted)
export async function createDocumentRecord(
  data: Omit<SchoolDocument, 'id' | 'createdAt' | 'updatedAt' | 'currentVersion'>,
  initialNote?: string
): Promise<string> {
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newDoc: SchoolDocument = {
    ...data,
    id: docId,
    currentVersion: 1,
    createdAt: now,
    updatedAt: now,
  };

  localDb.saveDocument(newDoc);

  // Save initial version snapshot
  const initialVersion: DocumentVersion = {
    versionNumber: 1,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileSize: data.fileSize,
    storagePath: data.storagePath,
    submittedAt: now,
    submittedByUid: data.ownerUid,
    submittedByName: data.ownerName,
    notes: initialNote || data.notes || 'Nộp lần đầu (Phiên bản v1)',
  };
  localDb.addVersion(docId, initialVersion);

  // Record initial action comment
  const initialComment: DocumentComment = {
    id: `cmt-${Date.now()}`,
    authorUid: data.ownerUid,
    authorName: data.ownerName,
    authorRole: 'teacher',
    content: initialNote ? `Nộp hồ sơ: "${data.title}". Ghi chú: ${initialNote}` : `Đã nộp hồ sơ "${data.title}"`,
    actionType: 'submit',
    createdAt: now,
  };
  localDb.addComment(docId, initialComment);

  return docId;
}

// Resubmit a new version of an existing document (retains full history)
export async function resubmitDocumentVersion(
  docId: string,
  existingDoc: SchoolDocument,
  fileData: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    storagePath?: string;
  },
  newStatus: DocumentStatus,
  notes: string,
  user: { uid: string; name: string; role: UserRole }
): Promise<void> {
  const now = new Date().toISOString();
  const nextVersion = (existingDoc.currentVersion || 1) + 1;

  // 1. Add new version to versions list
  const newVersion: DocumentVersion = {
    versionNumber: nextVersion,
    fileUrl: fileData.fileUrl,
    fileName: fileData.fileName,
    fileSize: fileData.fileSize,
    storagePath: fileData.storagePath,
    submittedAt: now,
    submittedByUid: user.uid,
    submittedByName: user.name,
    notes: notes || `Nộp lại phiên bản v${nextVersion}`,
  };
  localDb.addVersion(docId, newVersion);

  // 2. Add audit comment
  const comment: DocumentComment = {
    id: `cmt-${Date.now()}`,
    authorUid: user.uid,
    authorName: user.name,
    authorRole: user.role,
    content: `Đã nộp lại phiên bản v${nextVersion}. ${notes ? `Nội dung cập nhật: ${notes}` : ''}`,
    actionType: 'resubmit',
    createdAt: now,
  };
  localDb.addComment(docId, comment);

  // 3. Update parent document
  const updatedDoc: SchoolDocument = {
    ...existingDoc,
    fileUrl: fileData.fileUrl,
    fileName: fileData.fileName,
    fileSize: fileData.fileSize,
    storagePath: fileData.storagePath || '',
    currentVersion: nextVersion,
    status: newStatus,
    updatedAt: now,
  };
  localDb.saveDocument(updatedDoc);
}

// Review a document (Approve, Request Revision, Reject, or Forward)
export async function reviewDocument(
  docId: string,
  reviewer: { uid: string; name: string; role: UserRole },
  action: ActionType,
  newStatus: DocumentStatus,
  feedback: string,
  rejectionReason?: string,
  currentDoc?: SchoolDocument
): Promise<void> {
  const now = new Date().toISOString();
  const schoolId = currentDoc?.schoolId || 'th-ba-chuc';
  const existingDocs = localDb.getDocuments(schoolId);
  const docToUpdate = currentDoc || existingDocs.find((d) => d.id === docId);

  if (docToUpdate) {
    const updatedDoc: SchoolDocument = {
      ...docToUpdate,
      status: newStatus,
      reviewedByUid: reviewer.uid,
      reviewedByName: reviewer.name,
      reviewedAt: now,
      reviewNotes: feedback,
      rejectionReason: rejectionReason || '',
      updatedAt: now,
    };
    localDb.saveDocument(updatedDoc);
  }

  // Add audit comment
  const comment: DocumentComment = {
    id: `cmt-${Date.now()}`,
    authorUid: reviewer.uid,
    authorName: reviewer.name,
    authorRole: reviewer.role,
    content: feedback || (action === 'approve' ? 'Đã phê duyệt hồ sơ đạt yêu cầu.' : 'Đã xử lý hồ sơ.'),
    actionType: action,
    createdAt: now,
  };
  localDb.addComment(docId, comment);
}

// Add a general comment to a document
export async function addDocumentComment(
  docId: string,
  author: { uid: string; name: string; role: UserRole },
  content: string,
  actionType: ActionType = 'comment'
): Promise<void> {
  const now = new Date().toISOString();
  const comment: DocumentComment = {
    id: `cmt-${Date.now()}`,
    authorUid: author.uid,
    authorName: author.name,
    authorRole: author.role,
    content,
    actionType,
    createdAt: now,
  };
  localDb.addComment(docId, comment);
}

// Fetch all historical versions for a document
export async function getDocumentVersions(docId: string): Promise<DocumentVersion[]> {
  return localDb.getVersions(docId);
}

// Fetch all comments and audit entries for a document
export async function getDocumentComments(docId: string): Promise<DocumentComment[]> {
  return localDb.getComments(docId);
}

// Delete draft document
export async function deleteDraftDocument(docId: string, schoolId: string = 'th-ba-chuc'): Promise<void> {
  localDb.deleteDocument(docId, schoolId);
}

// Send in-app notification
export async function createNotification(
  targetUid: string,
  title: string,
  message: string,
  type: SystemNotification['type'],
  linkDocId?: string
): Promise<void> {
  const notification: SystemNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    targetUid,
    title,
    message,
    type,
    linkDocId: linkDocId || '',
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  localDb.saveNotification(notification);
}
