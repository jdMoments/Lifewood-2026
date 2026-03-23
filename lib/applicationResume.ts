import { supabase } from './supabase';

export const APPLICATION_RESUME_BUCKET = 'application-resumes';
export const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];
const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const getFileExtension = (fileName: string) => {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

const sanitizeFileName = (fileName: string) =>
  fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const validateResumeFile = (file: File | null) => {
  if (!file) return;

  const extension = getFileExtension(file.name);
  const isAllowedExtension = ALLOWED_RESUME_EXTENSIONS.includes(extension);
  const isAllowedMimeType = !file.type || ALLOWED_RESUME_MIME_TYPES.includes(file.type);

  if (!isAllowedExtension || !isAllowedMimeType) {
    throw new Error('Only PDF, DOC, and DOCX files are allowed for resume upload.');
  }

  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    throw new Error('Resume file is too large. Maximum allowed size is 10 MB.');
  }
};

export const uploadResumeFile = async (file: File) => {
  validateResumeFile(file);

  const extension = getFileExtension(file.name) || 'pdf';
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const normalizedName = sanitizeFileName(file.name) || `resume.${extension}`;
  const filePath = `applications/${Date.now()}-${randomPart}-${normalizedName}`;

  const { error: uploadError } = await supabase.storage
    .from(APPLICATION_RESUME_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(APPLICATION_RESUME_BUCKET).getPublicUrl(filePath);
  return {
    filePath,
    publicUrl: data.publicUrl,
    fileName: file.name,
  };
};

export const isMissingResumeBucketError = (error: any) => {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    message.includes('bucket not found') ||
    message.includes('does not exist') && message.includes('bucket') ||
    error?.statusCode === '404'
  );
};
