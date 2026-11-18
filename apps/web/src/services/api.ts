import { APIResponse, MigrationProject, SourceProfile, RecordPreview } from '../types';

const BASE_URL = '/api/v1';

export async function fetchProjects(): Promise<MigrationProject[]> {
  const res = await fetch(`${BASE_URL}/projects`);
  const json: APIResponse<MigrationProject[]> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function fetchProject(id: string): Promise<MigrationProject> {
  const res = await fetch(`${BASE_URL}/projects/${id}`);
  const json: APIResponse<MigrationProject> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function createProject(data: {
  name: string;
  description?: string;
  source_type: string;
  target_product: string;
}): Promise<MigrationProject> {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json: APIResponse<MigrationProject> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function uploadSourceFile(projectId: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('project_id', projectId);
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/sources/upload`, {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function triggerSourceAnalysis(fileId: string): Promise<SourceProfile> {
  const res = await fetch(`${BASE_URL}/sources/${fileId}/analyse`, {
    method: 'POST',
  });
  const json: APIResponse<SourceProfile> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function fetchSourceProfile(fileId: string): Promise<SourceProfile> {
  const res = await fetch(`${BASE_URL}/sources/${fileId}/profile`);
  const json: APIResponse<SourceProfile> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function fetchRecordPreview(
  fileId: string,
  options?: { sheet?: string; page?: number; pageSize?: number; search?: string }
): Promise<RecordPreview> {
  const params = new URLSearchParams();
  if (options?.sheet) params.append('sheet', options.sheet);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.pageSize) params.append('page_size', options.pageSize.toString());
  if (options?.search) params.append('search', options.search);

  const res = await fetch(`${BASE_URL}/sources/${fileId}/preview?${params.toString()}`);
  const json: APIResponse<RecordPreview> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
