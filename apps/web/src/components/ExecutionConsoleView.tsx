import React, { useState } from 'react';
import { MigrationResult } from '../types';
import { generateExportPackage, executeMigration } from '../services/api';
import { 
  Play, 
  Download, 
  ShieldCheck, 
  Loader2, 
  FileArchive, 
  CheckCircle2, 
  Copy, 
  Check
} from 'lucide-react';

interface ExecutionConsoleViewProps {
  projectId: string;
  targetProduct: string;
}

export const ExecutionConsoleView: React.FC<ExecutionConsoleViewProps> = ({ 
  projectId, 
  targetProduct 
}) => {
  const [targetModule, setTargetModule] = useState('Leads');
  const [executionMode, setExecutionMode] = useState<'dry_run' | 'live_insert'>('dry_run');
  const [executing, setExecuting] = useState(false);
  const [generatingPackage, setGeneratingPackage] = useState(false);
  const [packageResult, setPackageResult] = useState<any | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGeneratePackage = async () => {
    setGeneratingPackage(true);
    setPackageResult(null);
    try {
      const res = await generateExportPackage(projectId, targetModule);
      setPackageResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPackage(false);
    }
  };

  const handleExecuteMigration = async () => {
    setExecuting(true);
    setMigrationResult(null);
    try {
      const res = await executeMigration(projectId, targetModule, executionMode);
      setMigrationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setExecuting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Execution Header */}
      <div className="bg-canvas border border-border-subtle rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-canvas-subtle border border-border-subtle flex items-center justify-center text-zinc-300">
            <Play className="w-4 h-4 text-zoho-blue" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-100">API Execution & Export Studio</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Zoho {targetProduct}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Execute rate-throttled API migration or build standalone deployable ZIP packages.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 bg-canvas-subtle border border-border-subtle rounded px-2.5 py-1 text-xs">
            <span className="text-zinc-400 font-mono text-[11px]">Module:</span>
            <select
              value={targetModule}
              onChange={(e) => setTargetModule(e.target.value)}
              className="bg-transparent text-zinc-100 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Leads" className="bg-canvas text-zinc-100">Leads</option>
              <option value="Accounts" className="bg-canvas text-zinc-100">Accounts</option>
              <option value="Contacts" className="bg-canvas text-zinc-100">Contacts</option>
              <option value="Deals" className="bg-canvas text-zinc-100">Deals</option>
            </select>
          </div>

          <button
            onClick={handleGeneratePackage}
            disabled={generatingPackage}
            className="px-3.5 py-1.5 rounded bg-canvas-subtle hover:bg-canvas-panel border border-border-subtle hover:border-border-strong text-xs font-semibold text-zinc-200 transition flex items-center space-x-1.5"
          >
            {generatingPackage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <FileArchive className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Build ZIP Package</span>
          </button>
        </div>
      </div>

      {/* ZIP Export Notification Banner */}
      {packageResult && (
        <div className="p-3.5 bg-canvas border border-emerald-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-zinc-100">{packageResult.filename}</span>
              <span className="text-zinc-400 ml-2 font-mono text-[11px]">
                ({(packageResult.file_size_bytes / 1024).toFixed(1)} KB • {packageResult.record_count} records)
              </span>
            </div>
          </div>
          <a
            href={packageResult.download_url}
            download
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center space-x-1.5 transition self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP Package</span>
          </a>
        </div>
      )}

      {/* Direct API Migration Controlled Console */}
      <div className="bg-canvas border border-border-subtle rounded-lg p-4 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
              Controlled API Execution Engine
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Executes with Zoho 100-record batch chunking, token refresh, and persisted source-to-target ID lineage.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-canvas-subtle border border-border-subtle rounded p-0.5 text-xs">
              <button
                onClick={() => setExecutionMode('dry_run')}
                className={`px-3 py-1 rounded font-medium transition ${
                  executionMode === 'dry_run'
                    ? 'bg-canvas text-blue-400 font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Dry Run (Simulation)
              </button>
              <button
                onClick={() => setExecutionMode('live_insert')}
                className={`px-3 py-1 rounded font-medium transition ${
                  executionMode === 'live_insert'
                    ? 'bg-red-600 text-white font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Live Insert (Zoho API)
              </button>
            </div>

            <button
              onClick={handleExecuteMigration}
              disabled={executing}
              className={`px-4 py-1.5 rounded text-xs font-semibold text-white shadow-sm transition flex items-center space-x-1.5 ${
                executionMode === 'live_insert'
                  ? 'bg-red-600 hover:bg-red-500'
                  : 'bg-zoho-blue hover:bg-blue-600'
              }`}
            >
              {executing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{executionMode === 'live_insert' ? 'Commit Live Migration' : 'Simulate Dry Run'}</span>
            </button>
          </div>
        </div>

        {/* Execution Results Strip & Lineage Log */}
        {migrationResult && (
          <div className="space-y-4">
            {/* Dense Metrics Summary Strip */}
            <div className="bg-canvas-subtle border border-border-subtle rounded-md p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <span className="text-zinc-500">Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">{migrationResult.status}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-zinc-500">Total:</span>
                  <span className="text-zinc-100 font-bold">{migrationResult.total_records.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-zinc-500">Success:</span>
                  <span className="text-emerald-400 font-bold">{migrationResult.successful_records.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-zinc-500">Failed:</span>
                  <span className={`font-bold ${migrationResult.failed_records > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                    {migrationResult.failed_records}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-zinc-500">Duration:</span>
                  <span className="text-blue-400 font-bold">{migrationResult.duration_seconds}s</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] font-mono border border-zinc-700">
                  Mode: {migrationResult.execution_mode}
                </span>
              </div>
            </div>

            {/* Lineage Table */}
            {migrationResult.sample_mappings && migrationResult.sample_mappings.length > 0 && (
              <div className="border border-border-subtle rounded-md overflow-hidden">
                <div className="px-3 py-2 bg-canvas-subtle border-b border-border-subtle flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold text-zinc-100">
                      Persisted Source-to-Target Record ID Lineage
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {migrationResult.id_mappings_created} total IDs linked
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-canvas border-b border-border-subtle text-zinc-400 text-[11px] font-mono sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Source Primary Key</th>
                        <th className="py-2 px-3 text-center">&rarr;</th>
                        <th className="py-2 px-3">Zoho Generated Record ID</th>
                        <th className="py-2 px-3 text-right">Copy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-canvas font-mono text-xs">
                      {migrationResult.sample_mappings.map((m, idx) => (
                        <tr key={idx} className="hover:bg-canvas-hover transition">
                          <td className="py-1.5 px-3 text-zinc-300 font-medium">
                            {m.source_key}
                          </td>
                          <td className="py-1.5 px-3 text-zinc-600 text-center">
                            &rarr;
                          </td>
                          <td className="py-1.5 px-3 text-blue-400 font-semibold">
                            {m.target_id}
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            <button
                              onClick={() => copyToClipboard(m.target_id)}
                              className="text-zinc-500 hover:text-zinc-300 transition"
                              title="Copy Target ID"
                            >
                              {copiedId === m.target_id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
