import { supabase } from '../supabase';

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export interface UploadResult {
  fileUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export async function uploadSchoolDocument(
  file: File,
  departmentId: string,
  userUid: string,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `documents/${departmentId}/${userUid}/${timestamp}_${sanitizedName}`;

  // 1. First attempt: Supabase Storage (if configured)
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

      if (urlData?.publicUrl) {
        if (onProgress) onProgress({ progress: 100, bytesTransferred: file.size, totalBytes: file.size });
        return {
          fileUrl: urlData.publicUrl,
          storagePath: data.path,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || file.name.split('.').pop() || 'unknown',
        };
      }
    }
  } catch {
    // Supabase optional fallback
  }

  // 2. High-speed Local In-Browser Storage (Disconnected from Firebase)
  return new Promise((resolve) => {
    if (onProgress) {
      onProgress({ progress: 50, bytesTransferred: Math.round(file.size / 2), totalBytes: file.size });
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (onProgress) {
        onProgress({ progress: 100, bytesTransferred: file.size, totalBytes: file.size });
      }

      const fileUrl = (reader.result as string) || URL.createObjectURL(file);
      resolve({
        fileUrl,
        storagePath: `local/${departmentId}/${sanitizedName}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || file.name.split('.').pop() || 'unknown',
      });
    };

    reader.onerror = () => {
      const objectUrl = URL.createObjectURL(file);
      if (onProgress) {
        onProgress({ progress: 100, bytesTransferred: file.size, totalBytes: file.size });
      }
      resolve({
        fileUrl: objectUrl,
        storagePath: `local/${departmentId}/${sanitizedName}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || file.name.split('.').pop() || 'unknown',
      });
    };

    // If file is smaller than 10MB, store as data URL for persistent download/preview
    if (file.size < 10 * 1024 * 1024) {
      reader.readAsDataURL(file);
    } else {
      const objectUrl = URL.createObjectURL(file);
      if (onProgress) {
        onProgress({ progress: 100, bytesTransferred: file.size, totalBytes: file.size });
      }
      resolve({
        fileUrl: objectUrl,
        storagePath: `local/${departmentId}/${sanitizedName}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || file.name.split('.').pop() || 'unknown',
      });
    }
  });
}
