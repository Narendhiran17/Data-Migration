import React, { useState, useEffect } from 'react';
import { MappingSuggestion, FieldMappingItem } from '../types';
import { suggestMappings, saveMapping, fetchProjectMappings, fetchTargetMetadata } from '../services/api';
import { Sparkles, Check, ArrowRight, Layers, ShieldCheck, Loader2 } from 'lucide-react';

interface MappingEngineViewProps {
  projectId: string;
  targetProduct: string;
}

export const MappingEngineView: React.FC<MappingEngineViewProps> = ({ projectId, targetProduct }) => {
  const [targetModule, setTargetModule] = useState('Leads');
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<MappingSuggestion[]>([]);
  const [approvedMappings, setApprovedMappings] = useState<FieldMappingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  const loadModuleData = async (mod: string) => {
    setLoading(true);
    try {
      const [allTargetFields, mappings] = await Promise.all([
        fetchTargetMetadata(projectId),
        fetchProjectMappings(projectId, mod)
      ]);
      setApprovedMappings(mappings);

      const mods = Array.from(new Set(allTargetFields.map((f) => f.module_or_form)));
      setAvailableModules(mods);

      const suggData = await suggestMappings(projectId, mod);
      setSuggestions(suggData.suggestions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModuleData(targetModule);
  }, [projectId, targetModule]);

  const handleApprove = async (srcField: string, tgtField: string, confidence: number) => {
    setSavingField(srcField);
    try {
      await saveMapping({
        project_id: projectId,
        target_module: targetModule,
        source_field_name: srcField,
        target_field_name: tgtField,
        confidence: confidence,
        status: 'approved'
      });
      // Refresh approved mappings
      const updated = await fetchProjectMappings(projectId, targetModule);
      setApprovedMappings(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingField(null);
    }
  };

  const isApproved = (srcField: string, tgtField: string) => {
    return approvedMappings.some(
      (m) => m.source_field_name === srcField && m.target_field_name === tgtField && m.status === 'approved'
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Schema Mapping Engine ({targetProduct})</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-signal recommendation ranking (Name, Type, Semantic Synonyms, Sample Compatibility) with human review.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xs text-slate-400">Target Module:</label>
            <select
              value={targetModule}
              onChange={(e) => setTargetModule(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {availableModules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
              {availableModules.length === 0 && <option value="Leads">Leads (Default)</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Mapping Suggestions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Source to Zoho {targetModule} Field Mappings</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {approvedMappings.length} approved
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span>Calculating mapping scores...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No source fields or target fields found. Upload a source file and discover Zoho metadata first.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {suggestions.map((sug) => {
              const top = sug.top_match;
              const approved = top ? isApproved(sug.source_field_name, top.target_field_name) : false;
              const confidencePct = top ? Math.round(top.confidence * 100) : 0;

              return (
                <div key={sug.source_schema_id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20 transition">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-white">{sug.source_field_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {sug.inferred_type}
                        </span>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-600" />

                      {top ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-blue-400">{top.target_field_name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                            {top.target_data_type}
                          </span>
                          {top.is_mandatory && (
                            <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded">
                              REQ
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No candidate match</span>
                      )}
                    </div>

                    {top && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="text-slate-500">Reason:</span>
                        <span>{top.reason}</span>
                        {top.ai_transformation_hint && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                            Auto-Rule: {top.ai_transformation_hint.rule_type}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confidence Score & Action */}
                  <div className="flex items-center space-x-4">
                    {top && (
                      <div className="text-right">
                        <span className={`text-xs font-bold ${confidencePct >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {confidencePct}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${confidencePct >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                            style={{ width: `${confidencePct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {top && (
                      <button
                        onClick={() => handleApprove(sug.source_field_name, top.target_field_name, top.confidence)}
                        disabled={approved || savingField === sug.source_field_name}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                          approved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                        }`}
                      >
                        {approved ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Approved</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
