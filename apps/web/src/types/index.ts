export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    details: any;
  } | null;
  request_id: string;
}

export interface SourceFileSummary {
  id: string;
  original_filename: string;
  file_format: string;
  file_size: number;
  status: string;
  uploaded_at: string;
}

export interface MigrationProject {
  id: string;
  name: string;
  description?: string;
  source_type: string;
  target_product: string;
  status: string;
  created_at: string;
  updated_at: string;
  source_files: SourceFileSummary[];
}

export interface ColumnProfile {
  column_name: string;
  inferred_type: string;
  nullable: boolean;
  null_count: number;
  null_percentage: number;
  distinct_count: number;
  unique_percentage: number;
  duplicate_count: number;
  invalid_format_count: number;
  min_value?: string;
  max_value?: string;
  is_candidate_identifier: boolean;
  is_candidate_email: boolean;
  is_candidate_phone: boolean;
  is_candidate_date: boolean;
  sample_values: any[];
}

export interface SheetProfile {
  sheet_name: string;
  total_rows: number;
  total_columns: number;
  columns: ColumnProfile[];
  duplicate_rows_count: number;
}

export interface SourceProfile {
  file_id: string;
  original_filename: string;
  file_format: string;
  status: string;
  total_rows: number;
  total_columns: number;
  detected_sheets: number;
  sheets: SheetProfile[];
}

export interface RecordPreview {
  file_id: string;
  sheet_name: string;
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
  columns: string[];
  records: Record<string, any>[];
}

export interface TargetField {
  id: string;
  product: string;
  module_or_form: string;
  field_api_name: string;
  field_label: string;
  data_type: string;
  is_mandatory: boolean;
  is_unique: boolean;
  constraints: Record<string, any>;
}

export interface FieldMappingItem {
  id?: string;
  source_field_name: string;
  target_field_name: string;
  target_module: string;
  confidence: number;
  status: string;
  mapping_type?: string;
}

export interface MappingSuggestion {
  source_schema_id: string;
  source_field_name: string;
  inferred_type: string;
  top_match?: {
    target_field_id: string;
    target_field_name: string;
    target_field_label: string;
    target_data_type: string;
    is_mandatory: boolean;
    confidence: number;
    reason: string;
    ai_transformation_hint?: any;
  };
  all_candidates: any[];
}

export interface TransformationRuleItem {
  id?: string;
  project_id: string;
  rule_type: string;
  source_field: string;
  target_field: string;
  configuration: Record<string, any>;
  execution_order: number;
  enabled: boolean;
}

export interface ValidationErrorItem {
  row_number?: number;
  field_name?: string;
  error_code: string;
  severity: string;
  message: string;
  suggested_correction?: string;
}

export interface ValidationSummary {
  job_id: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  warning_records: number;
  errors_count: number;
  errors: ValidationErrorItem[];
}

export interface DependencyPlan {
  entities: string[];
  relationships: { parent: string; child: string }[];
  execution_order: string[];
  has_circular_dependency: boolean;
  detected_cycles: string[][];
}

export interface MigrationResult {
  job_id: string;
  project_id: string;
  target_product: string;
  target_module: string;
  execution_mode: string;
  status: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  duration_seconds: number;
  id_mappings_created: number;
  sample_mappings: { source_key: string; target_id: string }[];
}
