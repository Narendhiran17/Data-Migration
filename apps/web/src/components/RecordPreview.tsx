import React, { useState, useEffect } from 'react';
import { fetchRecordPreview } from '../services/api';
import { RecordPreview as RecordPreviewType } from '../types';
import { Search, ChevronLeft, ChevronRight, Loader2, Table2 } from 'lucide-react';

interface RecordPreviewProps {
  fileId: string;
  initialSheet?: string;
  availableSheets?: string[];
}

export const RecordPreview: React.FC<RecordPreviewProps> = ({ fileId, initialSheet, availableSheets = [] }) => {
  const [selectedSheet, setSelectedSheet] = useState<string>(initialSheet || 'default');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [previewData, setPreviewData] = useState<RecordPreviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecordPreview(fileId, {
        sheet: selectedSheet,
        page,
        pageSize,
        search: search.trim() || undefined,
      });
      setPreviewData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load record preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fileId, selectedSheet, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-4 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Table2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Record Explorer</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspecting physical source rows with real-time text filter and cell inspection
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search values..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition w-56"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Sheet Tabs if available */}
      {availableSheets.length > 1 && (
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-medium mr-1">Worksheet:</span>
          {availableSheets.map((sh) => (
            <button
              key={sh}
              onClick={() => { setSelectedSheet(sh); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                selectedSheet === sh
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sh}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="border border-slate-800 rounded-lg overflow-x-auto min-h-[300px]">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading records...</span>
          </div>
        ) : !previewData || previewData.records.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
            No matching records found.
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-2.5 px-3 w-12 text-slate-600 border-r border-slate-800/60 font-sans">#</th>
                {previewData.columns.map((col) => (
                  <th key={col} className="py-2.5 px-4 font-semibold text-slate-300 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {previewData.records.map((row, rIdx) => {
                const rowNum = (previewData.page - 1) * previewData.page_size + rIdx + 1;
                return (
                  <tr key={rIdx} className="hover:bg-slate-800/20 transition">
                    <td className="py-2.5 px-3 text-slate-600 text-right border-r border-slate-800/60 font-sans select-none">
                      {rowNum}
                    </td>
                    {previewData.columns.map((col) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined || val === '';
                      return (
                        <td key={col} className="py-2.5 px-4 whitespace-nowrap">
                          {isNull ? (
                            <span className="text-slate-600 italic select-none">null</span>
                          ) : (
                            <span className="text-slate-200">{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {previewData && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-2">
          <div>
            Showing <strong className="text-slate-200">{previewData.records.length}</strong> of{' '}
            <strong className="text-slate-200">{previewData.total_rows.toLocaleString()}</strong> rows (Page{' '}
            <strong className="text-slate-200">{previewData.page}</strong> of{' '}
            <strong className="text-slate-200">{previewData.total_pages}</strong>)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={previewData.page <= 1 || loading}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono">
              {previewData.page} / {previewData.total_pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(previewData.total_pages, p + 1))}
              disabled={previewData.page >= previewData.total_pages || loading}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
