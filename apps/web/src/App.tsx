import { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { FileUpload } from './components/FileUpload';
import { ProfilingReport } from './components/ProfilingReport';
import { RecordPreview } from './components/RecordPreview';
import { MetadataExplorer } from './components/MetadataExplorer';
import { MappingEngineView } from './components/MappingEngineView';
import { TransformationView } from './components/TransformationView';
import { ValidationView } from './components/ValidationView';
import { MigrationConsole } from './components/MigrationConsole';
import { CreateProjectModal } from './components/CreateProjectModal';
import { fetchProjects, fetchSourceProfile } from './services/api';
import { MigrationProject, SourceProfile } from './types';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [projects, setProjects] = useState<MigrationProject[]>([]);
  const [activeProject, setActiveProject] = useState<MigrationProject | null>(null);
  const [currentProfile, setCurrentProfile] = useState<SourceProfile | null>(null);
  const [previewSheetName, setPreviewSheetName] = useState<string>('default');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjects();
      setProjects(data);
      if (data.length > 0 && !activeProject) {
        setActiveProject(data[0]);
        if (data[0].source_files && data[0].source_files.length > 0) {
          loadProfile(data[0].source_files[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend API');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async (fileId: string) => {
    try {
      const profile = await fetchSourceProfile(fileId);
      setCurrentProfile(profile);
      if (profile.sheets && profile.sheets.length > 0) {
        setPreviewSheetName(profile.sheets[0].sheet_name);
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSelectFile = async (fileId: string) => {
    await loadProfile(fileId);
    setActiveTab('profiling');
  };

  const handleAnalysisComplete = (profile: SourceProfile) => {
    setCurrentProfile(profile);
    if (profile.sheets && profile.sheets.length > 0) {
      setPreviewSheetName(profile.sheets[0].sheet_name);
    }
    setActiveTab('profiling');
    loadProjects();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projectName={activeProject?.name}
        targetProduct={activeProject?.target_product}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {isLoading && projects.length === 0 && (
          <div className="flex items-center justify-center p-12 text-slate-400 space-x-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span>Connecting to Migration Assistant Workspace...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-xs text-red-400">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadProjects}
              className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <Dashboard
              projects={projects}
              activeProject={activeProject}
              onSelectProject={(p) => setActiveProject(p)}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onSelectFile={handleSelectFile}
            />

            {activeProject && (
              <FileUpload
                projectId={activeProject.id}
                onAnalysisComplete={handleAnalysisComplete}
              />
            )}
          </div>
        )}

        {/* Tab 2: Profiling Report */}
        {activeTab === 'profiling' && (
          <div>
            {currentProfile ? (
              <ProfilingReport
                profile={currentProfile}
                onPreviewSheet={(sheetName) => {
                  setPreviewSheetName(sheetName);
                  setActiveTab('preview');
                }}
              />
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
                No file analyzed yet. Select a project and upload a file from the Dashboard to view its profiling report.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Record Explorer */}
        {activeTab === 'preview' && (
          <div>
            {currentProfile ? (
              <RecordPreview
                fileId={currentProfile.file_id}
                initialSheet={previewSheetName}
                availableSheets={currentProfile.sheets.map((s) => s.sheet_name)}
              />
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
                No file available for preview. Please upload and analyze a file first.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Target Metadata Explorer */}
        {activeTab === 'metadata' && activeProject && (
          <MetadataExplorer
            projectId={activeProject.id}
            targetProduct={activeProject.target_product}
          />
        )}

        {/* Tab 5: Schema Mapping */}
        {activeTab === 'mapping' && activeProject && (
          <MappingEngineView
            projectId={activeProject.id}
            targetProduct={activeProject.target_product}
          />
        )}

        {/* Tab 6: Transformations */}
        {activeTab === 'transformation' && activeProject && (
          <TransformationView projectId={activeProject.id} />
        )}

        {/* Tab 7: Pre-Flight Validation & Dependencies */}
        {activeTab === 'validation' && activeProject && (
          <ValidationView
            projectId={activeProject.id}
            fileId={currentProfile?.file_id}
          />
        )}

        {/* Tab 8: Export & Direct Migration Console */}
        {activeTab === 'migration' && activeProject && (
          <MigrationConsole
            projectId={activeProject.id}
            targetProduct={activeProject.target_product}
          />
        )}
      </main>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          setActiveProject(newProj);
        }}
      />
    </div>
  );
}
export default App;
