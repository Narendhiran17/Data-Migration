import React, { useState, useEffect } from 'react';
import { ValidationSummary, DependencyPlan } from '../types';
import { runValidation, fetchDependencyPlan, createTransformation } from '../services/api';
import { 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  GitCommit, 
  AlertTriangle, 
  Wand2
} from 'lucide-react';

interface PreFlightVerificationViewProps {
  projectId: string;
  fileId?: string;
  targetProduct: string;
  onNavigateToExecution?: () => void;
}

export const PreFlightVerificationView: React.FC<PreFlightVerificationViewProps> = ({ 
  projectId, 
  fileId,
  targetProduct,
  onNavigateToExecution
}) => {
  const [valSummary, setValSummary] = useState<ValidationSummary | null>(null);
  const [depPlan, setDepPlan] = useState<DependencyPlan | null>(null);
  const [running, setRunning] = useState(false);
  const [targetModule, setTargetModule] = useState('Leads');
  const [fixingField, setFixingField] = useState<string | null>(null);
  const [fixSuccessMessage, setFixSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDependencyPlan(projectId).then(setDepPlan).catch(console.error);
  }, [projectId]);

  const handleRunValidation = async () => {
    if (!fileId) return;
    setRunning(true);
    setFixSuccessMessage(null);
    try {
      const summary = await runValidation(projectId, fileId, targetModule);
      setValSummary(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const handleApplyFixRule = async (fieldName: string, ruleType: string) => {
    setFixingField(fieldName);
    setFixSuccessMessage(null);
    try {
      let config: Record<string, any> = {};
      if (ruleType === 'phone_normalize') config = { country_code: '1' };
      if (ruleType === 'date_format') config = { output_format: '%Y-%m-%d' };

      await createTransformation({
        project_id: projectId,
        rule_type: ruleType,
        source_field: fieldName,
        target_field: fieldName,
        configuration: config,
        execution_order: 10,
        enabled: true
      });

      setFixSuccessMessage(`Rule "${ruleType}" applied to "${fieldName}". Re-run check to verify resolution.`);
    } catch (err: any) {
      console.error('Failed to apply fix rule:', err);
    } finally {
      setFixingField(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Verification Header */}
      <div className="bg-canvas border border-border-subtle rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-canvas-subtle border border-border-subtle flex items-center justify-center text-zinc-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-100">Pre-Flight Verification & Relational DAG</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Zoho {targetProduct}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Topological dependency resolution and constraint validation before committing API records.
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
            onClick={handleRunValidation}
            disabled={running || !fileId}
            className="px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition flex items-center space-x-1.5"
          >
            {running ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Run Pre-Flight Check</span>
          </button>

          {onNavigateToExecution && (
            <button
              onClick={onNavigateToExecution}
              className="px-3.5 py-1.5 rounded bg-zoho-blue hover:bg-blue-600 text-xs font-semibold text-white shadow-sm transition flex items-center space-x-1.5"
            >
              <span>Execution & Export</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {fixSuccessMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-400 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{fixSuccessMessage}</span>
          </div>
          <button
            onClick={handleRunValidation}
            className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-[11px] font-semibold text-emerald-300 transition"
          >
            Re-run Check
          </button>
        </div>
      )}

      {/* SECTION 1: Topological Dependency DAG Ordering */}
      {depPlan && (
        <div className="bg-canvas border border-border-subtle rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
                Topological Entity Dependency Sequence (Acyclic DAG)
              </h3>
            </div>
            {!depPlan.has_circular_dependency ? (
              <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Circular Dependencies</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-[11px] text-red-400 font-mono font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cycle Detected</span>
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-400">
            Enforces strict ingestion order so parent foreign keys exist before dependent children are inserted into Zoho.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {depPlan.execution_order.map((entity, idx) => (
              <React.Fragment key={entity}>
                <div className="flex items-center space-x-2 bg-canvas-subtle border border-border-subtle px-3 py-1.5 rounded-md text-xs font-mono text-zinc-200">
                  <span className="w-4 h-4 rounded-full bg-zoho-blue/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-semibold">{entity}</span>
                </div>
                {idx < depPlan.execution_order.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: Pre-Flight Summary Metrics Bar (High-Density, Zero Cliché Cards) */}
      {valSummary && (
        <div className="bg-canvas border border-border-subtle rounded-lg p-3 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-500">Total Records:</span>
              <span className="text-zinc-100 font-bold">{valSummary.total_records.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-500">Valid:</span>
              <span className="text-emerald-400 font-bold">{valSummary.valid_records.toLocaleString()}</span>
              <span className="text-zinc-500 text-[10px]">
                ({((valSummary.valid_records / (valSummary.total_records || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-500">Errors:</span>
              <span className={`font-bold ${valSummary.invalid_records > 0 ? 'text-red-400' : 'text-zinc-300'}`}>
                {valSummary.invalid_records}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-500">Warnings:</span>
              <span className={`font-bold ${valSummary.warning_records > 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
                {valSummary.warning_records}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
              valSummary.invalid_records === 0
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {valSummary.invalid_records === 0 ? 'Ready for Execution' : 'Pre-flight Blockers Detected'}
            </span>
          </div>
        </div>
      )}

      {/* SECTION 3: Actionable Error Table */}
      {valSummary && (
        <div className="bg-canvas border border-border-subtle rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-border-subtle bg-canvas-subtle flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-100">
              Pre-Flight Validation Issue Log ({valSummary.errors.length} items)
            </span>
            <span className="text-zinc-400 font-mono text-[11px]">
              Click 1-Click Fix to attach deterministic normalization rules
            </span>
          </div>

          <div className="overflow-x-auto">
            {valSummary.errors.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-canvas-subtle border-b border-border-subtle text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-16">Row #</th>
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Error Code</th>
                    <th className="py-2.5 px-3">Violation Details</th>
                    <th className="py-2.5 px-3 text-right">Actionable Fix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle bg-canvas font-mono text-xs">
                  {valSummary.errors.map((err, i) => {
                    const isPhoneError = err.error_code.includes('PHONE') || err.message.toLowerCase().includes('phone');
                    const isTrimError = err.message.toLowerCase().includes('whitespace') || err.message.toLowerCase().includes('space');
                    const isDateError = err.error_code.includes('DATE') || err.message.toLowerCase().includes('date');

                    return (
                      <tr key={i} className="hover:bg-canvas-hover transition">
                        <td className="py-2.5 px-3 text-zinc-400 font-mono">
                          {err.row_number || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-100 font-mono">
                          {err.field_name || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            err.severity === 'Error'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {err.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 font-mono">
                          {err.error_code}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <p className="text-zinc-200">{err.message}</p>
                          {err.suggested_correction && (
                            <p className="text-[11px] text-blue-400 mt-0.5 font-mono">
                              Correction: {err.suggested_correction}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {err.field_name && (isPhoneError || isTrimError || isDateError) ? (
                            <button
                              onClick={() => {
                                const ruleType = isPhoneError ? 'phone_normalize' : isDateError ? 'date_format' : 'trim';
                                handleApplyFixRule(err.field_name!, ruleType);
                              }}
                              disabled={fixingField === err.field_name}
                              className="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium text-[11px] transition inline-flex items-center space-x-1"
                              title="Click to automatically attach normalization rule"
                            >
                              {fixingField === err.field_name ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Wand2 className="w-3 h-3 text-purple-400" />
                              )}
                              <span>
                                {isPhoneError ? 'Fix E.164' : isDateError ? 'Fix Date' : 'Trim Space'}
                              </span>
                            </button>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-500 flex flex-col items-center justify-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1" />
                <span className="font-semibold text-zinc-300">Zero Pre-Flight Validation Errors</span>
                <span>Dataset satisfies all Zoho target schema constraints, picklists, and mandatory requirements.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
