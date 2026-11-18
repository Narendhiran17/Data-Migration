import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, FileCode, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadSourceFile, triggerSourceAnalysis } from '../services/api';
import { SourceProfile } from '../types';

interface FileUploadProps {
  projectId: string;
  onAnalysisComplete: (profile: SourceProfile) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ projectId, onAnalysisComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv', 'json'].includes(ext || '')) {
      setError('Please upload an Excel (.xlsx), CSV (.csv), or JSON (.json) file.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploading(true);

    try {
      const uploadRes = await uploadSourceFile(projectId, file);
      setUploading(false);
      setAnalysing(true);

      const profile = await triggerSourceAnalysis(uploadRes.file_id);
      setAnalysing(false);
      onAnalysisComplete(profile);
    } catch (err: any) {
      setUploading(false);
      setAnalysing(false);
      setError(err.message || 'Failed to process file');
    }
  };

  const getFormatIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (ext === 'csv') return <FileText className="w-5 h-5 text-amber-400" />;
    return <FileCode className="w-5 h-5 text-purple-400" />;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">Source File Ingestion</h3>
          <p className="text-xs text-slate-400">Upload client datasets for automated profiling & schema inference</p>
        </div>
        <div className="flex space-x-2 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">.xlsx</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">.csv</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">.json</span>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.json"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            {uploading || analysing ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              {uploading
                ? 'Uploading source file...'
                : analysing
                ? 'Profiling records & detecting anomalies...'
                : 'Click to select or drag and drop source file'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Multi-sheet Excel, CSV with auto-delimiter detection, or JSON records</p>
          </div>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            {getFormatIcon(selectedFile.name)}
            <div>
              <p className="font-medium text-slate-200">{selectedFile.name}</p>
              <p className="text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          {analysing ? (
            <span className="flex items-center space-x-1.5 text-blue-400 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready</span>
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
