import React from 'react';
import { FolderSync } from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'profiling'
  | 'preview'
  | 'metadata'
  | 'mapping'
  | 'transformation'
  | 'validation'
  | 'migration';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  projectName?: string;
  targetProduct?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, projectName, targetProduct }) => {
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'dashboard', label: '1. Dashboard' },
    { id: 'profiling', label: '2. Source Profiling' },
    { id: 'preview', label: '3. Data Preview' },
    { id: 'metadata', label: '4. Target Metadata' },
    { id: 'mapping', label: '5. Schema Mapping' },
    { id: 'transformation', label: '6. Transformations' },
    { id: 'validation', label: '7. Pre-Flight Check' },
    { id: 'migration', label: '8. Export & Migrate' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <FolderSync className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white tracking-tight text-sm">Zoho Migration Assistant</span>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                All Sprints Ready
              </span>
            </div>
            {projectName && (
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                {projectName} ({targetProduct || 'CRM'})
              </p>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-xs">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-2.5 py-1.5 font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Status Pill */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>FastAPI Monolith Online</span>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Subnav */}
      <div className="lg:hidden border-t border-slate-800 px-4 py-2 overflow-x-auto flex space-x-1 bg-slate-950/80">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </header>
  );
};
