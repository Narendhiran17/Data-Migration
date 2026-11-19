import React, { useState, useEffect } from 'react';
import { TargetField } from '../types';
import { connectZoho, discoverTargetMetadata, fetchTargetMetadata } from '../services/api';
import { 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  Loader2, 
  Search 
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mandatory' | 'lookups' | 'custom'>('all');

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
      setStatusMessage(`Discovered ${res.modules_count || 'active'} modules and ${res.fields_count || 'all'} fields from Zoho ${targetProduct}`);
      await loadDiscoveredFields();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setDiscovering(false);
    }
  };

  const moduleFields = fields.filter((f) => !selectedModule || f.module_or_form === selectedModule);

  const filteredFields = moduleFields.filter((f) => {
    const matchesSearch = 
      f.field_api_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.field_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.data_type.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'mandatory') return f.is_mandatory;
    if (filterType === 'lookups') return f.data_type.toLowerCase().includes('lookup') || !!f.constraints?.lookup_module;
    if (filterType === 'custom') return f.field_api_name.startsWith('cf_') || f.field_api_name.includes('_custom');
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Target Organization Header */}
      <div className="bg-canvas border border-border-subtle rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-canvas-subtle border border-border-subtle flex items-center justify-center text-zinc-300">
            <Server className="w-4 h-4 text-zoho-blue" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-100">Zoho {targetProduct} Schema Discovery</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Inspecting dynamic API layouts, mandatory constraints, and relationship lookups.
            </p>
          </div>
        </div>

        <button
          onClick={handleDiscover}
          disabled={discovering}
          className="px-3.5 py-1.5 rounded bg-zoho-blue hover:bg-blue-600 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition flex items-center space-x-1.5 shrink-0"
        >
          {discovering ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          <span>{fields.length > 0 ? 'Resync Target Schema' : 'Discover Zoho Schema'}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Metadata Workspace */}
      <div className="bg-canvas border border-border-subtle rounded-lg overflow-hidden shadow-sm">
        {/* Module Switcher Sub-nav */}
        {availableModules.length > 0 && (
          <div className="px-4 py-2.5 border-b border-border-subtle bg-canvas-subtle flex items-center space-x-2 overflow-x-auto text-xs">
            <span className="text-zinc-500 font-mono text-[11px] mr-1">Modules:</span>
            {availableModules.map((m) => {
              const count = fields.filter((f) => f.module_or_form === m).length;
              const isSelected = selectedModule === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedModule(m)}
                  className={`px-3 py-1 rounded text-xs font-medium transition whitespace-nowrap flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-zoho-blue text-white shadow-xs font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 bg-canvas border border-border-subtle'
                  }`}
                >
                  <span>{m}</span>
                  <span className="font-mono text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="p-3 border-b border-border-subtle bg-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search API name or label..."
              className="w-full bg-canvas-subtle border border-border-subtle rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zoho-blue transition"
            />
          </div>

          <div className="flex items-center space-x-1 bg-canvas-subtle border border-border-subtle p-1 rounded-md text-xs">
            {(['all', 'mandatory', 'lookups', 'custom'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-0.5 rounded capitalize transition ${
                  filterType === type
                    ? 'bg-canvas text-zinc-100 font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {type === 'mandatory' ? 'Required Only' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Fields Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-400 flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-zoho-blue" />
              <span>Querying Zoho target metadata...</span>
            </div>
          ) : filteredFields.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-canvas-subtle border-b border-border-subtle text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Field API Name</th>
                  <th className="py-2.5 px-3">Display Label</th>
                  <th className="py-2.5 px-3">Data Type</th>
                  <th className="py-2.5 px-3">Requirements</th>
                  <th className="py-2.5 px-3">Field Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-canvas font-mono text-xs">
                {filteredFields.map((field) => {
                  const isLookup = field.data_type.toLowerCase().includes('lookup') || !!field.constraints?.lookup_module;
                  const lookupTarget = field.constraints?.lookup_module;
                  const isCustom = field.field_api_name.startsWith('cf_') || field.field_api_name.includes('_custom');

                  return (
                    <tr key={field.id || field.field_api_name} className="hover:bg-canvas-hover transition">
                      {/* API Name */}
                      <td className="py-2 px-3 font-mono font-medium text-zinc-200">
                        {field.field_api_name}
                      </td>

                      {/* Display Label */}
                      <td className="py-2 px-3 font-sans text-zinc-300">
                        {field.field_label}
                      </td>

                      {/* Data Type */}
                      <td className="py-2 px-3">
                        {isLookup ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                            <span>Lookup &rarr; {lookupTarget || 'Reference'}</span>
                          </span>
                        ) : field.data_type.toLowerCase() === 'picklist' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                            <span>Picklist</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                            <span>{field.data_type}</span>
                          </span>
                        )}
                      </td>

                      {/* Requirements */}
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-1.5">
                          {field.is_mandatory && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              MANDATORY
                            </span>
                          )}
                          {field.is_unique && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              UNIQUE
                            </span>
                          )}
                          {!field.is_mandatory && !field.is_unique && (
                            <span className="text-zinc-600 text-[11px] font-mono">Optional</span>
                          )}
                        </div>
                      </td>

                      {/* System vs Custom */}
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          isCustom
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {isCustom ? 'Custom Field' : 'System Field'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500">
              No schema fields found matching criteria. Click "Resync Target Schema" to fetch latest Zoho metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
