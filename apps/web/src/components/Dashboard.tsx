import React from 'react';
import { MigrationProject } from '../types';
import { 
  Plus, 
  FolderGit2, 
  FileText, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Server,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  projects: MigrationProject[];
  activeProject: MigrationProject | null;
  onSelectProject: (project: MigrationProject) => void;
  onOpenCreateModal: () => void;
  onSelectFile: (fileId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenCreateModal,
  onSelectFile,
}) => {
  const totalFiles = projects.reduce((acc, p) => acc + (p.source_files?.length || 0), 0);
  const analysedFiles = projects.reduce(
    (acc, p) => acc + (p.source_files?.filter((f) => f.status === 'analysed').length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sprint 1 Baseline Active</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Developer Migration Workspace
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Ingest, profile, and detect anomalies in client datasets before mapping to Zoho CRM and Creator.
            Every column and record maintains complete transformation lineage and data immutability.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Migration Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Migration Projects</span>
            <FolderGit2 className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{projects.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Configured workspaces</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Uploaded Files</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalFiles}</p>
          <p className="text-[11px] text-slate-500 mt-1">Excel, CSV, JSON</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Analysed Sources</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{analysedFiles}</p>
          <p className="text-[11px] text-slate-500 mt-1">Schemas extracted</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Target Platforms</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">CRM & Creator</p>
          <p className="text-[11px] text-slate-500 mt-1">Initial phase support</p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Migration Projects</h2>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No projects created yet. Click "Create Migration Project" to begin.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {projects.map((proj) => {
              const isSelected = activeProject?.id === proj.id;
              return (
                <div
                  key={proj.id}
                  className={`p-5 transition hover:bg-slate-800/30 ${
                    isSelected ? 'bg-blue-950/20 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-sm font-semibold text-white">{proj.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          Target: Zoho {proj.target_product}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          proj.status === 'analysed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {proj.status.toUpperCase()}
                        </span>
                      </div>
                      {proj.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{proj.description}</p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-1.5 flex items-center space-x-1.5">
                        <Clock className="w-3 h-3" />
                        <span>Created {new Date(proj.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{proj.source_files?.length || 0} source file(s) uploaded</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectProject(proj)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <span>{isSelected ? 'Active Workspace' : 'Select Project'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* List of files within this project */}
                  {proj.source_files && proj.source_files.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex flex-wrap gap-2">
                      {proj.source_files.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => onSelectFile(f.id)}
                          className="px-2.5 py-1 rounded bg-slate-950/80 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 flex items-center space-x-1.5 transition"
                        >
                          <FileText className="w-3 h-3 text-blue-400" />
                          <span>{f.original_filename}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({f.file_format})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
