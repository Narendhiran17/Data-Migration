import React, { useState } from 'react';
import { SourceProfile, SheetProfile } from '../types';
import { 
  KeyRound, 
  Mail, 
  Phone, 
  Calendar, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Hash, 
  Layers,
  Search
} from 'lucide-react';

interface ProfilingReportProps {
  profile: SourceProfile;
  onPreviewSheet: (sheetName: string) => void;
}

export const ProfilingReport: React.FC<ProfilingReportProps> = ({ profile, onPreviewSheet }) => {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');

  const currentSheet: SheetProfile | undefined = profile.sheets[activeSheetIndex];
  if (!currentSheet) return null;

  const filteredColumns = currentSheet.columns.filter((col) =>
    col.column_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    col.inferred_type.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Email':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><Mail className="w-3 h-3" /><span>Email</span></span>;
      case 'Phone':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Phone className="w-3 h-3" /><span>Phone</span></span>;
      case 'Date':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Calendar className="w-3 h-3" /><span>Date</span></span>;
      case 'Integer':
      case 'Decimal':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20"><Hash className="w-3 h-3" /><span>{type}</span></span>;
      case 'Boolean':
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><span>Boolean</span></span>;
      default:
        return <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700"><span>Text</span></span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{profile.original_filename}</h2>
                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                  <span>Format: <strong className="text-slate-200">{profile.file_format}</strong></span>
                  <span>•</span>
                  <span>Total Records: <strong className="text-slate-200">{profile.total_rows.toLocaleString()}</strong></span>
                  <span>•</span>
                  <span>Total Columns: <strong className="text-slate-200">{profile.total_columns}</strong></span>
                  <span>•</span>
                  <span>Sheets: <strong className="text-slate-200">{profile.detected_sheets}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onPreviewSheet(currentSheet.sheet_name)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition flex items-center justify-center space-x-2"
          >
            <span>Preview Records</span>
          </button>
        </div>

        {/* Sheet Switcher Tabs if multiple sheets */}
        {profile.sheets.length > 1 && (
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium mr-2">Worksheets:</span>
            {profile.sheets.map((sheet, idx) => (
              <button
                key={sheet.sheet_name}
                onClick={() => setActiveSheetIndex(idx)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  activeSheetIndex === idx
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sheet.sheet_name} ({sheet.total_rows} rows)
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Sheet Records</p>
          <p className="text-2xl font-bold text-white mt-1">{currentSheet.total_rows.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Physical rows parsed</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Detected Columns</p>
          <p className="text-2xl font-bold text-white mt-1">{currentSheet.total_columns}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Schema fields</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Duplicate Rows</p>
          <p className={`text-2xl font-bold mt-1 ${currentSheet.duplicate_rows_count > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {currentSheet.duplicate_rows_count}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Identical across all fields</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Candidate Keys</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {currentSheet.columns.filter((c) => c.is_candidate_identifier).length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Unique identifiers</p>
        </div>
      </div>

      {/* Column Schema Profile Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Field Schema & Quality Profile</h3>
            <span className="text-xs text-slate-400 font-mono">({filteredColumns.length} fields)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter columns or types..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium">
              <tr>
                <th className="py-3 px-4">Column Name</th>
                <th className="py-3 px-4">Inferred Type</th>
                <th className="py-3 px-4">Nulls</th>
                <th className="py-3 px-4">Distinct / Unique</th>
                <th className="py-3 px-4">Duplicate Values</th>
                <th className="py-3 px-4">Format Anomalies</th>
                <th className="py-3 px-4">Sample Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredColumns.map((col) => (
                <tr key={col.column_name} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-200">{col.column_name}</span>
                      {col.is_candidate_identifier && (
                        <span title="Candidate Identifier Key" className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <KeyRound className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getTypeBadge(col.inferred_type)}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={col.null_count > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                          {col.null_count} nulls
                        </span>
                        <span className="text-slate-500">{col.null_percentage}%</span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${col.null_percentage > 20 ? 'bg-red-500' : col.null_percentage > 0 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          style={{ width: `${col.null_percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>
                      <span className="font-medium text-slate-200">{col.distinct_count} distinct</span>
                      <p className="text-[10px] text-slate-500">{col.unique_percentage}% unique</p>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={col.duplicate_count > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                      {col.duplicate_count}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {col.invalid_format_count > 0 ? (
                      <span className="inline-flex items-center space-x-1 text-red-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{col.invalid_format_count} invalid</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>0</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {col.sample_values && col.sample_values.length > 0 ? (
                        col.sample_values.map((val, vIdx) => (
                          <span
                            key={vIdx}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono truncate max-w-[120px]"
                            title={String(val)}
                          >
                            {String(val)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-600 italic text-[11px]">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
