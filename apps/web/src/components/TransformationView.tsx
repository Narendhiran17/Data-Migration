import React, { useState, useEffect } from 'react';
import { TransformationRuleItem } from '../types';
import { createTransformation, fetchTransformations } from '../services/api';
import { Wand2, Plus, Layers } from 'lucide-react';

interface TransformationViewProps {
  projectId: string;
}

export const TransformationView: React.FC<TransformationViewProps> = ({ projectId }) => {
  const [rules, setRules] = useState<TransformationRuleItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [ruleType, setRuleType] = useState('trim');
  const [sourceField, setSourceField] = useState('');
  const [targetField, setTargetField] = useState('');

  const loadRules = async () => {
    try {
      const data = await fetchTransformations(projectId);
      setRules(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRules();
  }, [projectId]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceField.trim() || !targetField.trim()) return;

    let config: Record<string, any> = {};
    if (ruleType === 'phone_normalize') config = { country_code: '1' };
    if (ruleType === 'date_format') config = { output_format: '%Y-%m-%d' };

    try {
      await createTransformation({
        project_id: projectId,
        rule_type: ruleType,
        source_field: sourceField.trim(),
        target_field: targetField.trim(),
        configuration: config,
        execution_order: rules.length + 1,
        enabled: true
      });
      setShowAddForm(false);
      setSourceField('');
      setTargetField('');
      await loadRules();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-semibold text-white">Deterministic Transformation Rules</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Apply declarative data conversion (phone standardizing, date formatting, picklist mapping, trimming) without arbitrary script execution.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transformation Rule</span>
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAddRule} className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Rule Type</label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="trim">Trim Whitespace</option>
                <option value="phone_normalize">Phone Normalize (E.164)</option>
                <option value="date_format">Date Format (YYYY-MM-DD)</option>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Source Field</label>
              <input
                type="text"
                required
                placeholder="e.g. Phone or Contact_Date"
                value={sourceField}
                onChange={(e) => setSourceField(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Field</label>
              <input
                type="text"
                required
                placeholder="e.g. Phone or Closing_Date"
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg h-9"
            >
              Save Rule
            </button>
          </form>
        )}
      </div>

      {/* Rules Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Active Transformation Pipeline</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">({rules.length} rules)</span>
        </div>

        {rules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No custom rules configured yet. Click "Add Transformation Rule" to register data cleaning rules.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {rules.map((r, i) => (
              <div key={r.id || i} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-mono font-semibold text-slate-400">
                    {r.execution_order}
                  </span>
                  <div>
                    <span className="font-semibold text-white font-mono">{r.rule_type}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {r.source_field} &rarr; <span className="text-blue-400">{r.target_field}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    ACTIVE
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
