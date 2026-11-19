import { 
  APIResponse, 
  MigrationProject, 
  SourceProfile, 
  RecordPreview,
  TargetField,
  FieldMappingItem,
  MappingSuggestion,
  TransformationRuleItem,
  ValidationSummary,
  DependencyPlan,
  MigrationResult
} from '../types';

const BASE_URL = '/api/v1';

export async function fetchProjects(): Promise<MigrationProject[]> {
  const res = await fetch(`${BASE_URL}/projects`);
  const json: APIResponse<MigrationProject[]> = await res.json();
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

// Zoho Connect & Metadata
export async function connectZoho(projectId: string, product: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/zoho/connect?project_id=${projectId}&product=${product}`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function discoverTargetMetadata(projectId: string, product: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/zoho/metadata/discover?project_id=${projectId}&product=${product}`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function fetchTargetMetadata(projectId: string, module?: string): Promise<TargetField[]> {
  const url = module
    ? `${BASE_URL}/zoho/metadata/${projectId}?module=${module}`
    : `${BASE_URL}/zoho/metadata/${projectId}`;
  const res = await fetch(url);
  const json: APIResponse<TargetField[]> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// Mappings
export async function suggestMappings(projectId: string, targetModule: string): Promise<{ suggestions: MappingSuggestion[] }> {
  const res = await fetch(`${BASE_URL}/mappings/suggest?project_id=${projectId}&target_module=${targetModule}`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function saveMapping(data: {
  project_id: string;
  target_module: string;
  source_field_name: string;
  target_field_name: string;
  confidence?: number;
  status?: string;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/mappings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function fetchProjectMappings(projectId: string, targetModule?: string): Promise<FieldMappingItem[]> {
  const url = targetModule
    ? `${BASE_URL}/mappings/${projectId}?target_module=${targetModule}`
    : `${BASE_URL}/mappings/${projectId}`;
  const res = await fetch(url);
  const json: APIResponse<FieldMappingItem[]> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// Transformations
export async function createTransformation(data: TransformationRuleItem): Promise<any> {
  const res = await fetch(`${BASE_URL}/transformations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function fetchTransformations(projectId: string): Promise<TransformationRuleItem[]> {
  const res = await fetch(`${BASE_URL}/transformations/${projectId}`);
  const json: APIResponse<TransformationRuleItem[]> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// Validations & Dependencies
export async function runValidation(projectId: string, fileId: string, targetModule: string): Promise<ValidationSummary> {
  const res = await fetch(`${BASE_URL}/validations/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, file_id: fileId, target_module: targetModule }),
  });
  const json: APIResponse<ValidationSummary> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function fetchDependencyPlan(projectId: string): Promise<DependencyPlan> {
  const res = await fetch(`${BASE_URL}/dependencies/${projectId}`);
  const json: APIResponse<DependencyPlan> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// Exports & Migrations
export async function generateExportPackage(projectId: string, targetModule: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/exports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, target_module: targetModule }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

export async function executeMigration(projectId: string, targetModule: string, executionMode: 'dry_run' | 'live_insert'): Promise<MigrationResult> {
  const res = await fetch(`${BASE_URL}/migrations/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, target_module: targetModule, execution_mode: executionMode }),
  });
  const json: APIResponse<MigrationResult> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}
