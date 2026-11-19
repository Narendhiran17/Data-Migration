import React, { useState, useEffect } from 'react';
import { TargetField } from '../types';
import { connectZoho, discoverTargetMetadata, fetchTargetMetadata } from '../services/api';
import { Server, Sparkles, CheckCircle2, KeyRound, Loader2, Layers } from 'lucide-react';

interface MetadataExplorerProps {
  projectId: string;
  targetProduct: string;
}

export const MetadataExplorer: React.FC<MetadataExplorerProps> = ({ projectId, targetProduct }) => {
  const [fields, setFields] = useState<TargetField[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadDiscoveredFields = async () => {
    setLoading(true);
    try {
      const allFields = await fetchTargetMetadata(projectId);
      setFields(allFields);
      const mods = Array.from(new Set(allFields.map((f) => f.module_or_form)));
      setAvailableModules(mods);
      if (mods.length > 0 && !selectedModule) {
        setSelectedModule(mods[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscoveredFields();
  }, [projectId]);

  const handleDiscover = async () => {
    setDiscovering(true);
    setStatusMessage(null);
    try {
      await connectZoho(projectId, targetProduct);
      const res = await discoverTargetMetadata(projectId, targetProduct);
      setStatusMessage(`Successfully discovered ${res.modules_count} modules and ${res.fields_count} fields from Zoho ${targetProduct}`);
      await loadDiscoveredFields();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setDiscovering(false);
    }
  };

  const filteredFields = fields.filter((f) => !selectedModule || f.module_or_form === selectedModule);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Zoho {targetProduct} Metadata Connector</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dynamic schema discovery inspecting actual organization modules, layouts, picklists, and mandatory constraints.
            </p>
          </div>

          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition flex items-center space-x-2"
          >
            {discovering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{fields.length > 0 ? 'Refresh Target Metadata' : 'Discover Target Schema'}</span>
          </button>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Module Switcher Tabs */}
        {availableModules.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Target Modules:</span>
            {availableModules.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedModule(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  selectedModule === m
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Target Fields Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">
              {selectedModule ? `Discovered Fields for ${selectedModule}` : 'Discovered Fields'}
            </h3>
            <span className="text-xs text-slate-500 font-mono">({filteredFields.length} fields)</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading target schema...</div>
        ) : filteredFields.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No metadata discovered yet. Click "Discover Target Schema" to inspect Zoho {targetProduct}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4">Field Label</th>
                  <th className="py-3 px-4">API Name</th>
                  <th className="py-3 px-4">Data Type</th>
                  <th className="py-3 px-4">Mandatory</th>
                  <th className="py-3 px-4">Unique</th>
                  <th className="py-3 px-4">Constraints & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredFields.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">{f.field_label}</td>
                    <td className="py-3 px-4 text-blue-400">{f.field_api_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                        {f.data_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {f.is_mandatory ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="text-slate-600">Optional</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {f.is_unique ? (
                        <span className="inline-flex items-center space-x-1 text-amber-400 font-sans">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Unique</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 max-w-xs truncate">
                      {f.constraints?.allowed_values ? (
                        <span className="text-[11px]">
                          Picklist: {f.constraints.allowed_values.slice(0, 3).join(', ')}...
                        </span>
                      ) : f.constraints?.lookup_module ? (
                        <span className="text-[11px] text-blue-400">
                          Lookup &rarr; {f.constraints.lookup_module}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
