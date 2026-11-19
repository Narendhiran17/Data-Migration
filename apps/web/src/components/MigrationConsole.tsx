import React, { useState } from 'react';
import { MigrationResult } from '../types';
import { generateExportPackage, executeMigration } from '../services/api';
import { Play, Download, ShieldCheck, Loader2, FileArchive, ArrowUpRight } from 'lucide-react';

interface MigrationConsoleProps {
  projectId: string;
  targetProduct: string;
}

export const MigrationConsole: React.FC<MigrationConsoleProps> = ({ projectId, targetProduct }) => {
  const [targetModule, setTargetModule] = useState('Leads');
  const [executionMode, setExecutionMode] = useState<'dry_run' | 'live_insert'>('dry_run');
  const [executing, setExecuting] = useState(false);
  const [generatingPackage, setGeneratingPackage] = useState(false);
  const [packageResult, setPackageResult] = useState<any | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Export Package Card (Sprint 6) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileArchive className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Import-Ready Package Generator ({targetProduct})</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Creates validated, transformed ZIP packages with data CSVs, manifest, dependency plans, and manual import instructions.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={targetModule}
              onChange={(e) => setTargetModule(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="Leads">Leads</option>
              <option value="Accounts">Accounts</option>
              <option value="Contacts">Contacts</option>
              <option value="Deals">Deals</option>
            </select>

            <button
              onClick={handleGeneratePackage}
              disabled={generatingPackage}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2"
            >
              {generatingPackage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Generate ZIP Package</span>
            </button>
          </div>
        </div>

        {packageResult && (
          <div className="mt-4 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">{packageResult.filename}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Size: {(packageResult.file_size_bytes / 1024).toFixed(1)} KB • Records: {packageResult.record_count}
              </p>
            </div>
            <a
              href={packageResult.download_url}
              download
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center space-x-1"
            >
              <span>Download Archive</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Direct Migration Execution Console (Sprint 10) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Controlled API Migration Console</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Direct API execution with batch throttling, idempotency safeguards, and source-to-target ID resolution.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={executionMode}
              onChange={(e) => setExecutionMode(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="dry_run">Dry Run (Simulation)</option>
              <option value="live_insert">Live Migration (Zoho API)</option>
            </select>

            <button
              onClick={handleExecuteMigration}
              disabled={executing}
              className={`px-4 py-2 text-xs font-semibold rounded-lg text-white shadow-lg transition flex items-center space-x-2 ${
                executionMode === 'live_insert'
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              {executing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{executionMode === 'live_insert' ? 'Commit Live Migration' : 'Simulate Dry Run'}</span>
            </button>
          </div>
        </div>

        {/* Migration Results Card */}
        {migrationResult && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <p className="text-[11px] text-slate-400">Status</p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5 uppercase">{migrationResult.status}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <p className="text-[11px] text-slate-400">Total Records</p>
                <p className="text-lg font-bold text-white mt-0.5">{migrationResult.total_records}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <p className="text-[11px] text-slate-400">Success Count</p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">{migrationResult.successful_records}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <p className="text-[11px] text-slate-400">Duration</p>
                <p className="text-lg font-bold text-blue-400 mt-0.5">{migrationResult.duration_seconds}s</p>
              </div>
            </div>

            {/* Resolved ID Mappings */}
            {migrationResult.sample_mappings && migrationResult.sample_mappings.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-white mb-2 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Persisted Source-to-Target Record ID Lineage</span>
                </h4>
                <div className="divide-y divide-slate-800/40 text-xs font-mono">
                  {migrationResult.sample_mappings.map((m, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between">
                      <span className="text-slate-400">{m.source_key}</span>
                      <span className="text-slate-600">&rarr;</span>
                      <span className="text-blue-400 font-semibold">{m.target_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
