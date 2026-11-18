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
