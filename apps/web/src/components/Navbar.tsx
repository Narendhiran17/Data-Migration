import React from 'react';
import { MigrationProject } from '../types';
import { 
  FolderSync, 
  ChevronDown, 
  Plus, 
  Layers, 
  Server, 
  Workflow, 
  ShieldCheck, 
  Play
} from 'lucide-react';

export type WorkspacePhase = 'ingestion' | 'metadata' | 'mapping' | 'verification' | 'execution';

interface NavbarProps {
  currentPhase: WorkspacePhase;
  onSelectPhase: (phase: WorkspacePhase) => void;
  projects: MigrationProject[];
  activeProject: MigrationProject | null;
  onSelectProject: (p: MigrationProject) => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPhase,
  onSelectPhase,
  projects,
  activeProject,
  onSelectProject,
  onOpenCreateModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const phases: { id: WorkspacePhase; label: string; icon: any; summary: string }[] = [
    { id: 'ingestion', label: 'Source Ingestion', icon: Layers, summary: 'Excel, CSV, JSON profiling' },
    { id: 'metadata', label: 'Zoho Metadata', icon: Server, summary: 'Dynamic schema discovery' },
    { id: 'mapping', label: 'Mapping & Rules', icon: Workflow, summary: 'Bipartite mapping studio' },
    { id: 'verification', label: 'Pre-Flight & DAG', icon: ShieldCheck, summary: 'Relational ordering & checks' },
    { id: 'execution', label: 'Execution & Export', icon: Play, summary: 'Dry-run, API & ZIP packages' },
  ];

  return (
    <header className="bg-canvas-subtle border-b border-border-subtle sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Branding & Project Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-zoho-blue flex items-center justify-center text-white font-bold shadow-sm">
              <FolderSync className="w-4 h-4" />
            </div>
            <span className="font-semibold text-zinc-100 text-sm tracking-tight hidden sm:inline">
              Zoho Migration Assistant
            </span>
          </div>

          <span className="text-zinc-600 hidden sm:inline">/</span>

          {/* Project Picker Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md bg-canvas border border-border-subtle hover:border-border-strong text-xs font-medium text-zinc-200 transition"
            >
              <span className="truncate max-w-[140px] sm:max-w-[180px]">
                {activeProject ? activeProject.name : 'Select Project'}
              </span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                {activeProject ? activeProject.target_product : 'CRM'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-canvas-panel border border-border-subtle rounded-lg shadow-2xl py-1 z-50 animate-in fade-in duration-100">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                  Migration Workspaces
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-canvas-hover transition ${
                      activeProject?.id === p.id ? 'bg-canvas text-white font-medium' : 'text-zinc-300'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Zoho {p.target_product}</span>
                  </button>
                ))}
                <div className="border-t border-border-subtle mt-1 pt-1">
                  <button
                    onClick={() => {
                      onOpenCreateModal();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1.5 hover:bg-canvas-hover transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Project</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Workflow Pipeline Navigator */}
        <nav className="hidden md:flex items-center space-x-1">
          {phases.map((ph, idx) => {
            const isActive = currentPhase === ph.id;
            return (
              <button
                key={ph.id}
                onClick={() => onSelectPhase(ph.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-canvas border border-border-strong text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-canvas-hover/60'
                }`}
                title={ph.summary}
              >
                <span className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-mono ${
                  isActive ? 'bg-zoho-blue text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {idx + 1}
                </span>
                <span>{ph.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Environment & System Status */}
        <div className="flex items-center space-x-2.5 text-xs">
          <div className="flex items-center space-x-1.5 text-zinc-400 font-mono text-[11px] bg-canvas px-2.5 py-1 rounded border border-border-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>API Active</span>
          </div>
        </div>
      </div>

      {/* Mobile Workflow Stepper Sub-bar */}
      <div className="md:hidden border-t border-border-subtle px-3 py-1.5 flex items-center space-x-1 overflow-x-auto bg-canvas">
        {phases.map((ph, idx) => (
          <button
            key={ph.id}
            onClick={() => onSelectPhase(ph.id)}
            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap flex items-center space-x-1.5 ${
              currentPhase === ph.id
                ? 'bg-zoho-blue text-white font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="font-mono text-[10px]">{idx + 1}.</span>
            <span>{ph.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
