import React, { useState, useRef, useEffect } from 'react';
import { 
  SourceProfile, 
  SheetProfile, 
  RecordPreview as RecordPreviewType,
  MigrationProject 
} from '../types';
import { 
  uploadSourceFile, 
  triggerSourceAnalysis, 
  fetchRecordPreview,
  fetchSourceProfile 
} from '../services/api';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  AlertCircle, 
  Loader2, 
  Search, 
  Table2, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Phone, 
  Calendar, 
  Hash, 
  Plus, 
  ArrowRight, 
  FileCheck
} from 'lucide-react';

interface SourceIngestionViewProps {
  activeProject: MigrationProject;
  currentProfile: SourceProfile | null;
  onProfileLoaded: (profile: SourceProfile) => void;
  onNavigateToMapping: () => void;
}

export const SourceIngestionView: React.FC<SourceIngestionViewProps> = ({
  activeProject,
  currentProfile,
  onProfileLoaded,
  onNavigateToMapping,
}) => {
  const [viewMode, setViewMode] = useState<'profiling' | 'records'>('profiling');
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [columnSearch, setColumnSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw Record Explorer state
  const [recordPage, setRecordPage] = useState(1);
  const [recordSearch, setRecordSearch] = useState('');
  const [previewData, setPreviewData] = useState<RecordPreviewType | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const activeSheet: SheetProfile | undefined = currentProfile?.sheets?.[activeSheetIndex];

  // Load record preview when switching to 'records' view or changing sheets/page
  useEffect(() => {
    if (viewMode === 'records' && currentProfile && activeSheet) {
      loadRecords();
    }
  }, [viewMode, currentProfile?.file_id, activeSheet?.sheet_name, recordPage]);

  const loadRecords = async () => {
    if (!currentProfile || !activeSheet) return;
    setRecordsLoading(true);
    try {
      const data = await fetchRecordPreview(currentProfile.file_id, {
        sheet: activeSheet.sheet_name,
        page: recordPage,
        pageSize: 25,
        search: recordSearch.trim() || undefined,
      });
      setPreviewData(data);
    } catch (err: any) {
      console.error('Failed to preview records:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv', 'json'].includes(ext || '')) {
      setUploadError('Unsupported format. Allowed formats: .xlsx, .csv, .json');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const uploadRes = await uploadSourceFile(activeProject.id, file);
      setIsUploading(false);
      setIsAnalysing(true);

      const profile = await triggerSourceAnalysis(uploadRes.file_id);
      setIsAnalysing(false);
      onProfileLoaded(profile);
      setActiveSheetIndex(0);
      setRecordPage(1);
    } catch (err: any) {
      setIsUploading(false);
      setIsAnalysing(false);
      setUploadError(err.message || 'File upload and analysis failed');
    }
  };

  const handleSelectExistingFile = async (fileId: string) => {
    try {
      const profile = await fetchSourceProfile(fileId);
      onProfileLoaded(profile);
      setActiveSheetIndex(0);
      setRecordPage(1);
    } catch (err: any) {
      console.error('Failed to load profile for file:', err);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Email':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
            <Mail className="w-3 h-3" />
            <span>Email</span>
          </span>
        );
      case 'Phone':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            <Phone className="w-3 h-3" />
            <span>Phone</span>
          </span>
        );
      case 'Date':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
            <Calendar className="w-3 h-3" />
            <span>Date</span>
          </span>
        );
      case 'Integer':
      case 'Decimal':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
            <Hash className="w-3 h-3" />
            <span>{type}</span>
          </span>
        );
      case 'Boolean':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            <span>Boolean</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
            <span>Text</span>
          </span>
        );
    }
  };

  const filteredColumns = activeSheet?.columns?.filter((col) =>
    col.column_name.toLowerCase().includes(columnSearch.toLowerCase()) ||
    col.inferred_type.toLowerCase().includes(columnSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      {/* Workspace Operational Bar */}
      <div className="bg-canvas border border-border-subtle rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3 overflow-x-auto">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-400">Source Datasets:</span>
            {activeProject.source_files && activeProject.source_files.length > 0 ? (
              <div className="flex items-center space-x-1.5">
                {activeProject.source_files.map((file) => {
                  const isCurrent = currentProfile?.file_id === file.id;
                  return (
                    <button
                      key={file.id}
                      onClick={() => handleSelectExistingFile(file.id)}
                      className={`px-2.5 py-1 rounded text-xs font-mono flex items-center space-x-1.5 border transition ${
                        isCurrent
                          ? 'bg-zoho-blue/20 text-blue-300 border-zoho-blue/40 font-medium'
                          : 'bg-canvas-subtle text-zinc-400 border-border-subtle hover:text-zinc-200 hover:border-border-strong'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="truncate max-w-[140px]">{file.original_filename}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${file.status === 'analysed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-zinc-500 italic text-xs">No dataset ingested yet</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isAnalysing}
            className="px-3 py-1.5 rounded bg-canvas-subtle hover:bg-canvas-panel border border-border-subtle hover:border-border-strong text-xs font-medium text-zinc-200 transition flex items-center space-x-1.5"
          >
            {isUploading || isAnalysing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : (
              <Plus className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{isUploading ? 'Uploading...' : isAnalysing ? 'Profiling...' : 'Ingest New File'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.json"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          {currentProfile && (
            <button
              onClick={onNavigateToMapping}
              className="px-3.5 py-1.5 rounded bg-zoho-blue hover:bg-blue-600 text-xs font-semibold text-white shadow-sm transition flex items-center space-x-1.5"
            >
              <span>Schema Mapping Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* No Dataset State: Technical Ingestion Dropzone */}
      {!currentProfile && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-zoho-blue bg-zoho-blue/5'
              : 'border-border-strong hover:border-zinc-500 bg-canvas'
          }`}
        >
          <div className="max-w-md mx-auto flex flex-col items-center space-y-3">
            <div className="w-10 h-10 rounded-lg bg-canvas-subtle border border-border-subtle flex items-center justify-center text-zinc-300">
              {isUploading || isAnalysing ? (
                <Loader2 className="w-5 h-5 animate-spin text-zoho-blue" />
              ) : (
                <UploadCloud className="w-5 h-5 text-zinc-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {isUploading ? 'Transferring file to migration buffer...' : isAnalysing ? 'Executing zero-copy quality profiling...' : 'Select or drop client source file'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Supports Excel (.xlsx, multi-sheet), CSV (.csv, RFC 4180), and JSON datasets up to 100MB.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono text-[11px]">.XLSX</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono text-[11px]">.CSV</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono text-[11px]">.JSON</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Dataset Profiling & Record Explorer */}
      {currentProfile && (
        <div className="bg-canvas border border-border-subtle rounded-lg overflow-hidden shadow-sm">
          {/* Dataset Specs Strip */}
          <div className="px-4 py-3 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3 bg-canvas-subtle">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 rounded bg-canvas border border-border-subtle text-zinc-300">
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-zinc-100">{currentProfile.original_filename}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                    {currentProfile.file_format}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-0.5 font-mono">
                  <span>{currentProfile.total_rows.toLocaleString()} records</span>
                  <span>•</span>
                  <span>{currentProfile.total_columns} columns</span>
                  <span>•</span>
                  <span>{currentProfile.detected_sheets} worksheet{currentProfile.detected_sheets > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Mode Switcher: Quality Profiling vs Raw Records */}
            <div className="flex items-center space-x-1 bg-canvas border border-border-subtle p-1 rounded-md">
              <button
                onClick={() => setViewMode('profiling')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  viewMode === 'profiling'
                    ? 'bg-canvas-subtle text-zinc-100 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Quality Profile
              </button>
              <button
                onClick={() => setViewMode('records')}
                className={`px-3 py-1 rounded text-xs font-medium transition flex items-center space-x-1.5 ${
                  viewMode === 'records'
                    ? 'bg-canvas-subtle text-zinc-100 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Raw Physical Records</span>
              </button>
            </div>
          </div>

          {/* Multi-Sheet Tabs Bar (if multi-sheet) */}
          {currentProfile.sheets && currentProfile.sheets.length > 1 && (
            <div className="px-4 py-2 border-b border-border-subtle bg-canvas flex items-center space-x-2 overflow-x-auto text-xs">
              <span className="text-zinc-500 font-mono text-[11px]">Sheets:</span>
              {currentProfile.sheets.map((sh, idx) => (
                <button
                  key={sh.sheet_name}
                  onClick={() => {
                    setActiveSheetIndex(idx);
                    setRecordPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
                    activeSheetIndex === idx
                      ? 'bg-zoho-blue text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 bg-canvas-subtle border border-border-subtle'
                  }`}
                >
                  <span>{sh.sheet_name}</span>
                  <span className="ml-1.5 opacity-70 font-mono text-[10px]">({sh.total_rows})</span>
                </button>
              ))}
            </div>
          )}

          {/* SUB-VIEW 1: Quality Profiling Table */}
          {viewMode === 'profiling' && activeSheet && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    placeholder="Search columns or data types..."
                    className="w-full bg-canvas-subtle border border-border-subtle rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zoho-blue transition"
                  />
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Showing {filteredColumns.length} of {activeSheet.columns.length} columns
                </div>
              </div>

              <div className="overflow-x-auto border border-border-subtle rounded-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas-subtle border-b border-border-subtle text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Column Name</th>
                      <th className="py-2.5 px-3">Inferred Type</th>
                      <th className="py-2.5 px-3">Candidate Role</th>
                      <th className="py-2.5 px-3">Completeness</th>
                      <th className="py-2.5 px-3">Distinct Values</th>
                      <th className="py-2.5 px-3">Sample Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle bg-canvas">
                    {filteredColumns.map((col) => {
                      const filledPercentage = 100 - col.null_percentage;
                      return (
                        <tr key={col.column_name} className="hover:bg-canvas-hover transition group">
                          {/* Column Name */}
                          <td className="py-2 px-3 font-mono font-medium text-zinc-200">
                            {col.column_name}
                          </td>

                          {/* Inferred Type */}
                          <td className="py-2 px-3">
                            {getTypeBadge(col.inferred_type)}
                          </td>

                          {/* Candidate Role */}
                          <td className="py-2 px-3">
                            <div className="flex items-center space-x-1">
                              {col.is_candidate_identifier && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  Primary Key
                                </span>
                              )}
                              {col.is_candidate_email && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  Email
                                </span>
                              )}
                              {col.is_candidate_phone && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Phone
                                </span>
                              )}
                              {col.is_candidate_date && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Date
                                </span>
                              )}
                              {!col.is_candidate_identifier && !col.is_candidate_email && !col.is_candidate_phone && !col.is_candidate_date && (
                                <span className="text-zinc-600 font-mono text-[11px]">—</span>
                              )}
                            </div>
                          </td>

                          {/* Completeness / Null Rate */}
                          <td className="py-2 px-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${filledPercentage > 90 ? 'bg-emerald-500' : filledPercentage > 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${filledPercentage}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] text-zinc-300">
                                {filledPercentage.toFixed(0)}%
                              </span>
                              {col.null_count > 0 && (
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  ({col.null_count} nulls)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Distinct Count */}
                          <td className="py-2 px-3 font-mono text-zinc-300">
                            <span>{col.distinct_count.toLocaleString()}</span>
                            <span className="text-[10px] text-zinc-500 ml-1">
                              ({col.unique_percentage.toFixed(0)}%)
                            </span>
                          </td>

                          {/* Sample Values */}
                          <td className="py-2 px-3">
                            <div className="flex items-center space-x-1.5 max-w-sm overflow-hidden">
                              {col.sample_values && col.sample_values.length > 0 ? (
                                col.sample_values.slice(0, 3).map((val, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded bg-canvas-subtle border border-border-subtle font-mono text-[10px] text-zinc-400 truncate max-w-[100px]"
                                    title={String(val)}
                                  >
                                    {String(val)}
                                  </span>
                                ))
                              ) : (
                                <span className="text-zinc-600 text-[11px] font-mono">None</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: Raw Physical Records Data Grid */}
          {viewMode === 'records' && (
            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setRecordPage(1);
                    loadRecords();
                  }}
                  className="flex items-center space-x-2"
                >
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={recordSearch}
                      onChange={(e) => setRecordSearch(e.target.value)}
                      placeholder="Filter cell text..."
                      className="bg-canvas-subtle border border-border-subtle rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zoho-blue transition w-60"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded bg-canvas-subtle hover:bg-canvas-panel border border-border-subtle text-xs font-medium text-zinc-200 transition"
                  >
                    Filter
                  </button>
                </form>

                {previewData && (
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-zinc-400 font-mono">
                      Page {previewData.page} of {previewData.total_pages || 1} ({previewData.total_rows} records)
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setRecordPage((p) => Math.max(1, p - 1))}
                        disabled={recordPage <= 1 || recordsLoading}
                        className="p-1 rounded bg-canvas-subtle border border-border-subtle disabled:opacity-30 hover:border-border-strong text-zinc-300"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRecordPage((p) => (previewData.total_pages ? Math.min(previewData.total_pages, p + 1) : p + 1))}
                        disabled={previewData ? recordPage >= previewData.total_pages : true || recordsLoading}
                        className="p-1 rounded bg-canvas-subtle border border-border-subtle disabled:opacity-30 hover:border-border-strong text-zinc-300"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {recordsLoading ? (
                <div className="p-12 text-center text-xs text-zinc-400 flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-zoho-blue" />
                  <span>Loading source records...</span>
                </div>
              ) : previewData && previewData.records && previewData.records.length > 0 ? (
                <div className="overflow-x-auto border border-border-subtle rounded-md max-h-[500px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-canvas-subtle border-b border-border-subtle text-zinc-400 text-[11px] font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3 border-r border-border-subtle w-12 font-mono text-zinc-500">#</th>
                        {previewData.columns.map((col) => (
                          <th key={col} className="py-2 px-3 border-r border-border-subtle font-mono text-zinc-300 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-canvas font-mono text-[11px]">
                      {previewData.records.map((row, idx) => (
                        <tr key={idx} className="hover:bg-canvas-hover transition">
                          <td className="py-1.5 px-3 border-r border-border-subtle text-zinc-500 font-mono text-center">
                            {(recordPage - 1) * 25 + idx + 1}
                          </td>
                          {previewData.columns.map((col) => {
                            const val = row[col];
                            return (
                              <td key={col} className="py-1.5 px-3 border-r border-border-subtle text-zinc-300 whitespace-nowrap max-w-[200px] truncate">
                                {val !== null && val !== undefined ? String(val) : <span className="text-zinc-600 italic">null</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-zinc-500 border border-border-subtle rounded-md">
                  No records found matching criteria.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
