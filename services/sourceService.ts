import { supabase } from './supabaseClient';
import type { Source } from '../types';

export const SOURCE_BUCKET = 'project-sources';
export const MAX_SOURCE_SIZE = 20 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'application/json',
  'application/yaml',
  'text/yaml',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

interface SourceRow {
  id: string;
  project_id: string;
  title: string;
  original_file_name: string;
  mime_type: string;
  source_type: Source['sourceType'];
  version: number;
  approval_status: Source['approvalStatus'];
  authority_level: Source['authorityLevel'];
  extraction_status: Source['extractionStatus'];
  storage_path: string | null;
  source_url: string | null;
  checksum: string | null;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

const sourceColumns = 'id, project_id, title, original_file_name, mime_type, source_type, version, approval_status, authority_level, extraction_status, storage_path, source_url, checksum, uploaded_by, uploaded_at, created_at, updated_at';

const mapSource = (row: SourceRow): Source => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  originalFileName: row.original_file_name,
  mimeType: row.mime_type,
  sourceType: row.source_type,
  version: row.version,
  approvalStatus: row.approval_status,
  authorityLevel: row.authority_level,
  extractionStatus: row.extraction_status,
  storagePath: row.storage_path,
  sourceUrl: row.source_url,
  checksum: row.checksum,
  uploadedBy: row.uploaded_by,
  uploadedAt: row.uploaded_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const sourceTypeFor = (file: File): Source['sourceType'] => {
  if (file.type.includes('wordprocessingml')) return 'docx';
  if (file.type.includes('spreadsheetml')) return 'xlsx';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type === 'text/csv') return 'csv';
  if (file.type === 'application/json' || file.type.includes('yaml')) return 'json';
  if (file.type.startsWith('image/')) return 'image';
  return 'txt';
};

const checksumFor = async (file: File): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

const safeFileName = (fileName: string): string => {
  const normalized = fileName.normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g, '_');
  return normalized.slice(-180) || 'source';
};

export const listSources = async (projectId: string): Promise<Source[]> => {
  const { data, error } = await supabase.from('sources').select(sourceColumns).eq('project_id', projectId).order('created_at', { ascending: false });
  if (error) throw new Error(`Quellen konnten nicht geladen werden: ${error.message}`);
  return (data as SourceRow[]).map(mapSource);
};

export const uploadSource = async (projectId: string, file: File, title: string): Promise<Source> => {
  if (!allowedMimeTypes.has(file.type)) throw new Error('Dieser Dateityp wird nicht unterstützt.');
  if (file.size > MAX_SOURCE_SIZE) throw new Error('Die Datei darf höchstens 20 MB groß sein.');
  if (!title.trim()) throw new Error('Bitte einen Quellentitel angeben.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error('Für den Upload ist eine gültige Sitzung erforderlich.');

  const checksum = await checksumFor(file);
  const storagePath = `${projectId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from(SOURCE_BUCKET).upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Datei konnte nicht gespeichert werden: ${uploadError.message}`);

  const { data, error } = await supabase.from('sources').insert({
    project_id: projectId,
    title: title.trim(),
    original_file_name: file.name,
    mime_type: file.type,
    source_type: sourceTypeFor(file),
    storage_path: storagePath,
    checksum,
    uploaded_by: userData.user.id,
    extraction_status: 'not_applicable',
  }).select(sourceColumns).single();

  if (error) {
    await supabase.storage.from(SOURCE_BUCKET).remove([storagePath]);
    if (error.code === '23505') throw new Error('Diese Datei ist bereits als Quelle im Projekt vorhanden.');
    throw new Error(`Quellenmetadaten konnten nicht gespeichert werden: ${error.message}`);
  }
  return mapSource(data as SourceRow);
};

export const removeSource = async (source: Source): Promise<void> => {
  if (source.storagePath) {
    const { error: storageError } = await supabase.storage.from(SOURCE_BUCKET).remove([source.storagePath]);
    if (storageError) throw new Error(`Quelldatei konnte nicht gelöscht werden: ${storageError.message}`);
  }
  const { error } = await supabase.from('sources').delete().eq('id', source.id);
  if (error) throw new Error(`Quellenmetadaten konnten nicht gelöscht werden: ${error.message}`);
};

export const createSourceDownloadUrl = async (source: Source): Promise<string> => {
  if (!source.storagePath) throw new Error('Für diese Quelle ist keine Datei hinterlegt.');
  const { data, error } = await supabase.storage.from(SOURCE_BUCKET).createSignedUrl(source.storagePath, 300);
  if (error || !data?.signedUrl) throw new Error(`Download-Link konnte nicht erstellt werden: ${error?.message || 'Unbekannter Fehler'}`);
  return data.signedUrl;
};
