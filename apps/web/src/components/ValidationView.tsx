import React, { useState, useEffect } from 'react';
import { ValidationSummary, DependencyPlan } from '../types';
import { runValidation, fetchDependencyPlan } from '../services/api';
import { ShieldAlert, CheckCircle2, ArrowRight, Loader2, GitCommit } from 'lucide-react';

interface ValidationViewProps {
  projectId: string;
  fileId?: string;
}

export const ValidationView: React.FC<ValidationViewProps> = ({ projectId, fileId }) => {
  const [valSummary, setValSummary] = useState<ValidationSummary | null>(null);
  const [depPlan, setDepPlan] = useState<DependencyPlan | null>(null);
  const [running, setRunning] = useState(false);
  const [targetModule, setTargetModule] = useState('Leads');

  useEffect(() => {
    fetchDependencyPlan(projectId).then(setDepPlan).catch(console.error);
  }, [projectId]);

  const handleRunValidation = async () => {
    if (!fileId) return;
    setRunning(true);
    try {
      const summary = await runValidation(projectId, fileId, targetModule);
      setValSummary(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pre-flight Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-semibold text-white">Pre-Flight Validation & Dependency Engine</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify required fields, picklists, and relational integrity before committing records into Zoho.
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
              onClick={handleRunValidation}
              disabled={running || !fileId}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white shadow-lg shadow-amber-600/20 transition flex items-center space-x-2"
            >
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Run Pre-Flight Validation</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      {valSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400">Total Validated</p>
            <p className="text-2xl font-bold text-white mt-1">{valSummary.total_records}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400">Valid Records</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{valSummary.valid_records}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400">Errors (Blocking)</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{valSummary.invalid_records}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400">Warnings</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{valSummary.warning_records}</p>
          </div>
        </div>
      )}

      {/* Dependency Order Graph */}
      {depPlan && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-3">
            <GitCommit className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Topological Dependency Ordering</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Prevents lookup failures by cascading imports from parent entities to dependent children.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {depPlan.execution_order.map((entity, idx) => (
              <React.Fragment key={entity}>
                <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{entity}</span>
                </div>
                {idx < depPlan.execution_order.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Validation Error Table */}
      {valSummary && valSummary.errors.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40">
            <h3 className="text-sm font-semibold text-white">Detailed Error Log</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2.5 px-4">Row #</th>
                  <th className="py-2.5 px-4">Field</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Issue Code</th>
                  <th className="py-2.5 px-4">Message & Suggested Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {valSummary.errors.map((err, i) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-4 text-slate-400 font-sans">{err.row_number || '—'}</td>
                    <td className="py-3 px-4 text-white">{err.field_name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        err.severity === 'Error'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {err.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{err.error_code}</td>
                    <td className="py-3 px-4 font-sans">
                      <p className="text-slate-200">{err.message}</p>
                      {err.suggested_correction && (
                        <p className="text-[11px] text-blue-400 mt-0.5">
                          Tip: {err.suggested_correction}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
