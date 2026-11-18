import React from 'react';
import { ShieldCheck, FolderSync } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'profiling' | 'preview';
  setActiveTab: (tab: 'dashboard' | 'profiling' | 'preview') => void;
  projectName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, projectName }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white tracking-tight">Zoho Migration Assistant</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Sprint 1 Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">Developer Productivity Platform</p>
            </div>
          </div>

          {projectName && (
            <div className="hidden md:flex items-center pl-4 border-l border-slate-800 text-xs text-slate-300">
              <span className="text-slate-500 mr-1.5">Project:</span>
              <span className="font-medium bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 text-slate-200">
                {projectName}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('profiling')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'profiling'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Data Profiling
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Record Preview
          </button>
        </nav>

        {/* Status Indicators */}
        <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>API Online</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-400 border border-slate-800 bg-slate-800/40 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Encrypted Lineage</span>
          </div>
        </div>
      </div>
    </header>
  );
};
