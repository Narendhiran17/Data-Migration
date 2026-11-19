import React, { useState, useEffect } from 'react';
import { 
  MappingSuggestion, 
  FieldMappingItem, 
  TargetField, 
  TransformationRuleItem 
} from '../types';
import { 
  suggestMappings, 
  saveMapping, 
  fetchProjectMappings, 
  fetchTargetMetadata,
  fetchTransformations,
  createTransformation
} from '../services/api';
import { 
  Workflow, 
  Check, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  X, 
  Wand2, 
  Search
} from 'lucide-react';

interface MappingStudioViewProps {
  projectId: string;
  targetProduct: string;
  onNavigateToVerification?: () => void;
}

export const MappingStudioView: React.FC<MappingStudioViewProps> = ({ 
  projectId, 
  targetProduct,
  onNavigateToVerification 
}) => {
  const [targetModule, setTargetModule] = useState('Leads');
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [targetFields, setTargetFields] = useState<TargetField[]>([]);
  const [suggestions, setSuggestions] = useState<MappingSuggestion[]>([]);
  const [approvedMappings, setApprovedMappings] = useState<FieldMappingItem[]>([]);
  const [transformationRules, setTransformationRules] = useState<TransformationRuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mapped' | 'unmapped' | 'rules'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected field for inline rule configurator modal/drawer
  const [ruleModalField, setRuleModalField] = useState<{ source: string; target: string } | null>(null);
  const [ruleType, setRuleType] = useState('trim');
  const [ruleConfig, setRuleConfig] = useState<Record<string, any>>({});
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);
  const [ruleStatusMessage, setRuleStatusMessage] = useState<string | null>(null);

  const loadStudioData = async (mod: string) => {
    setLoading(true);
    try {
      const [allTargetFields, mappings, rules, suggData] = await Promise.all([
        fetchTargetMetadata(projectId),
        fetchProjectMappings(projectId, mod),
        fetchTransformations(projectId),
        suggestMappings(projectId, mod)
      ]);

      const mods = Array.from(new Set(allTargetFields.map((f) => f.module_or_form)));
      setAvailableModules(mods);
      setTargetFields(allTargetFields.filter((f) => f.module_or_form === mod));
      setApprovedMappings(mappings);
      setTransformationRules(rules);
      setSuggestions(suggData.suggestions || []);
    } catch (e) {
      console.error('Failed to load mapping studio data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudioData(targetModule);
  }, [projectId, targetModule]);

  const handleApproveMapping = async (srcField: string, tgtField: string, confidence: number = 0.95) => {
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
      const updated = await fetchProjectMappings(projectId, targetModule);
      setApprovedMappings(updated);
    } catch (e) {
      console.error('Failed to save mapping:', e);
    } finally {
      setSavingField(null);
    }
  };

  const handleAutoMapHighConfidence = async () => {
    setLoading(true);
    try {
      const highConfidenceSuggestions = suggestions.filter(
        (s) => s.top_match && s.top_match.confidence >= 0.85
      );

      for (const s of highConfidenceSuggestions) {
        if (s.top_match) {
          await saveMapping({
            project_id: projectId,
            target_module: targetModule,
            source_field_name: s.source_field_name,
            target_field_name: s.top_match.target_field_name,
            confidence: s.top_match.confidence,
            status: 'approved'
          });
        }
      }

      const updated = await fetchProjectMappings(projectId, targetModule);
      setApprovedMappings(updated);
    } catch (e) {
      console.error('Auto-map failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleModalField) return;
    setIsSubmittingRule(true);
    setRuleStatusMessage(null);

    let config: Record<string, any> = { ...ruleConfig };
    if (ruleType === 'phone_normalize' && !config.country_code) {
      config.country_code = '1';
    }
    if (ruleType === 'date_format' && !config.output_format) {
      config.output_format = '%Y-%m-%d';
    }

    try {
      await createTransformation({
        project_id: projectId,
        rule_type: ruleType,
        source_field: ruleModalField.source,
        target_field: ruleModalField.target,
        configuration: config,
        execution_order: transformationRules.length + 1,
        enabled: true
      });

      const updatedRules = await fetchTransformations(projectId);
      setTransformationRules(updatedRules);
      setRuleStatusMessage('Rule attached successfully');
      setTimeout(() => {
        setRuleModalField(null);
        setRuleStatusMessage(null);
      }, 700);
    } catch (err: any) {
      setRuleStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmittingRule(false);
    }
  };

  const getMappingForSource = (srcField: string) => {
    return approvedMappings.find((m) => m.source_field_name === srcField && m.status === 'approved');
  };

  const getRulesForField = (srcField: string) => {
    return transformationRules.filter((r) => r.source_field === srcField && r.enabled);
  };

  // Filter suggestions according to tab and search
  const filteredSuggestions = suggestions.filter((s) => {
    const isMapped = !!getMappingForSource(s.source_field_name);
    const hasRules = getRulesForField(s.source_field_name).length > 0;
    
    if (activeFilter === 'mapped' && !isMapped) return false;
    if (activeFilter === 'unmapped' && isMapped) return false;
    if (activeFilter === 'rules' && !hasRules) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSource = s.source_field_name.toLowerCase().includes(q);
      const matchTarget = s.top_match?.target_field_name.toLowerCase().includes(q) || false;
      return matchSource || matchTarget;
    }
    return true;
  });

  const totalMapped = approvedMappings.length;
  const highConfidenceCount = suggestions.filter((s) => s.top_match && s.top_match.confidence >= 0.85).length;

  return (
    <div className="space-y-4">
      {/* Studio Header & Target Module Selector */}
      <div className="bg-canvas border border-border-subtle rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-canvas-subtle border border-border-subtle flex items-center justify-center text-zinc-300">
            <Workflow className="w-4 h-4 text-zoho-blue" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-100">Bipartite Schema Mapping Studio</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Zoho {targetProduct}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Multi-signal mapping with inline deterministic transformation rule attachments.
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
              {availableModules.map((m) => (
                <option key={m} value={m} className="bg-canvas text-zinc-100">{m}</option>
              ))}
              {availableModules.length === 0 && <option value="Leads">Leads</option>}
            </select>
          </div>

          <button
            onClick={handleAutoMapHighConfidence}
            disabled={loading || highConfidenceCount === 0}
            className="px-3 py-1.5 rounded bg-canvas-subtle hover:bg-canvas-panel border border-border-subtle hover:border-border-strong disabled:opacity-40 text-xs font-medium text-blue-400 transition flex items-center space-x-1.5"
            title={`Automatically approve ${highConfidenceCount} mappings with >85% confidence`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Map High ({highConfidenceCount})</span>
          </button>

          {onNavigateToVerification && (
            <button
              onClick={onNavigateToVerification}
              className="px-3.5 py-1.5 rounded bg-zoho-blue hover:bg-blue-600 text-xs font-semibold text-white shadow-sm transition flex items-center space-x-1.5"
            >
              <span>Pre-Flight & DAG</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="bg-canvas border border-border-subtle rounded-lg overflow-hidden shadow-sm">
        {/* Filters and Search Strip */}
        <div className="p-3 border-b border-border-subtle bg-canvas-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1 bg-canvas border border-border-subtle p-1 rounded-md">
            {(['all', 'unmapped', 'mapped', 'rules'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded capitalize transition ${
                  activeFilter === filter
                    ? 'bg-canvas-subtle text-zinc-100 font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {filter === 'all' && `All (${suggestions.length})`}
                {filter === 'unmapped' && `Unmapped (${suggestions.length - totalMapped})`}
                {filter === 'mapped' && `Mapped (${totalMapped})`}
                {filter === 'rules' && `With Rules (${transformationRules.length})`}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter fields by name..."
              className="w-full bg-canvas border border-border-subtle rounded pl-8 pr-3 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zoho-blue transition"
            />
          </div>
        </div>

        {/* Bipartite Schema Mapping Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-400 flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-zoho-blue" />
              <span>Analyzing bipartite semantic mappings...</span>
            </div>
          ) : filteredSuggestions.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-canvas-subtle border-b border-border-subtle text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-1/3">Source Column</th>
                  <th className="py-2.5 px-3 w-1/4">Recommendation & Rules</th>
                  <th className="py-2.5 px-3 w-1/3">Target Zoho Field</th>
                  <th className="py-2.5 px-3 w-20 text-right">Commit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-canvas">
                {filteredSuggestions.map((sug) => {
                  const existingMapping = getMappingForSource(sug.source_field_name);
                  const isApproved = !!existingMapping;
                  const attachedRules = getRulesForField(sug.source_field_name);
                  const targetFieldName = existingMapping?.target_field_name || sug.top_match?.target_field_name || '';
                  const confidence = sug.top_match ? Math.round(sug.top_match.confidence * 100) : 0;
                  const targetDef = targetFields.find((f) => f.field_api_name === targetFieldName);

                  return (
                    <tr key={sug.source_field_name} className="hover:bg-canvas-hover transition group">
                      {/* Left: Source Column */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-medium text-zinc-100">
                              {sug.source_field_name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                              {sug.inferred_type}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Middle: Match Confidence & Inline Rules */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="space-y-1.5">
                          {sug.top_match ? (
                            <div className="flex items-center space-x-2">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                                confidence >= 85
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : confidence >= 60
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {confidence}% Match
                              </span>
                              <span className="text-[11px] text-zinc-400 truncate max-w-[150px]" title={sug.top_match.reason}>
                                {sug.top_match.reason}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-500 font-mono text-[11px]">No automatic match</span>
                          )}

                          {/* Rule Attachment Trigger */}
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => {
                                setRuleModalField({
                                  source: sug.source_field_name,
                                  target: targetFieldName || sug.source_field_name
                                });
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition flex items-center space-x-1 border ${
                                attachedRules.length > 0
                                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                  : 'bg-canvas-subtle text-zinc-400 border-border-subtle hover:text-zinc-200 hover:border-border-strong'
                              }`}
                            >
                              <Wand2 className="w-3 h-3 text-purple-400" />
                              <span>{attachedRules.length > 0 ? `${attachedRules.length} Rule(s)` : '+ Add Rule'}</span>
                            </button>
                            {attachedRules.map((r, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono text-[9px] border border-zinc-700"
                              >
                                {r.rule_type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Right: Target Zoho Field */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="space-y-1">
                          <select
                            value={targetFieldName}
                            onChange={(e) => handleApproveMapping(sug.source_field_name, e.target.value, 0.99)}
                            className={`w-full bg-canvas-subtle border rounded px-2.5 py-1 text-xs font-mono transition focus:outline-none ${
                              isApproved
                                ? 'border-emerald-500/40 text-emerald-300'
                                : 'border-border-subtle text-zinc-200 focus:border-zoho-blue'
                            }`}
                          >
                            <option value="">-- Select Target Zoho Field --</option>
                            {targetFields.map((tf) => (
                              <option key={tf.field_api_name} value={tf.field_api_name}>
                                {tf.field_api_name} {tf.is_mandatory ? '*(Required)' : ''} ({tf.data_type})
                              </option>
                            ))}
                          </select>

                          {targetDef && (
                            <div className="flex items-center space-x-2 text-[10px] text-zinc-400 font-mono">
                              <span>Label: {targetDef.field_label}</span>
                              {targetDef.is_mandatory && (
                                <span className="text-red-400 font-semibold">• MANDATORY</span>
                              )}
                              <span>• Type: {targetDef.data_type}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action: Commit / Approve */}
                      <td className="py-2.5 px-3 align-top text-right">
                        <button
                          onClick={() => handleApproveMapping(sug.source_field_name, targetFieldName, sug.top_match?.confidence || 0.9)}
                          disabled={savingField === sug.source_field_name || !targetFieldName}
                          className={`p-1.5 rounded transition ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-canvas-subtle hover:bg-canvas-panel border border-border-subtle text-zinc-300 hover:text-white'
                          }`}
                          title={isApproved ? 'Mapping saved' : 'Click to approve'}
                        >
                          {savingField === sug.source_field_name ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500">
              No schema mappings matching selected filter.
            </div>
          )}
        </div>
      </div>

      {/* Inline Transformation Rule Configurator Modal */}
      {ruleModalField && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas-panel border border-border-subtle rounded-lg max-w-md w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center space-x-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Attach Transformation Rule</h3>
              </div>
              <button
                onClick={() => setRuleModalField(null)}
                className="text-zinc-400 hover:text-zinc-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-zinc-400 space-y-1">
              <div>Source Field: <span className="font-mono text-zinc-200 font-semibold">{ruleModalField.source}</span></div>
              <div>Target Field: <span className="font-mono text-zinc-200 font-semibold">{ruleModalField.target}</span></div>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Rule Type</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value)}
                  className="w-full bg-canvas border border-border-subtle rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zoho-blue"
                >
                  <option value="trim">Trim Whitespace (Strip leading/trailing spaces)</option>
                  <option value="phone_normalize">Phone Normalization (E.164 + Country Prefix)</option>
                  <option value="date_format">Date Normalization (Convert to YYYY-MM-DD)</option>
                  <option value="uppercase">Uppercase Text</option>
                  <option value="lowercase">Lowercase Text</option>
                  <option value="fallback_value">Fallback Value (Default if Null)</option>
                </select>
              </div>

              {ruleType === 'phone_normalize' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Default Country Code</label>
                  <input
                    type="text"
                    defaultValue="1"
                    onChange={(e) => setRuleConfig({ country_code: e.target.value })}
                    placeholder="e.g. 1 for US, 91 for India"
                    className="w-full bg-canvas border border-border-subtle rounded px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zoho-blue"
                  />
                </div>
              )}

              {ruleType === 'date_format' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Target Format Specifier</label>
                  <input
                    type="text"
                    defaultValue="%Y-%m-%d"
                    onChange={(e) => setRuleConfig({ output_format: e.target.value })}
                    placeholder="%Y-%m-%d"
                    className="w-full bg-canvas border border-border-subtle rounded px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zoho-blue"
                  />
                </div>
              )}

              {ruleType === 'fallback_value' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Default Fallback String</label>
                  <input
                    type="text"
                    onChange={(e) => setRuleConfig({ default_value: e.target.value })}
                    placeholder="e.g. Unknown / N/A"
                    className="w-full bg-canvas border border-border-subtle rounded px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zoho-blue"
                  />
                </div>
              )}

              {ruleStatusMessage && (
                <div className="p-2 rounded bg-zinc-800 text-[11px] text-zinc-200">
                  {ruleStatusMessage}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setRuleModalField(null)}
                  className="px-3 py-1.5 rounded bg-canvas-subtle hover:bg-canvas text-xs text-zinc-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRule}
                  className="px-4 py-1.5 rounded bg-zoho-blue hover:bg-blue-600 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center space-x-1.5"
                >
                  {isSubmittingRule && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Attach Rule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
