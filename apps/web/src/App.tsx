import { useState, useEffect } from 'react';
import { Navbar, WorkspacePhase } from './components/Navbar';
import { SourceIngestionView } from './components/SourceIngestionView';
import { MetadataExplorer } from './components/MetadataExplorer';
import { MappingStudioView } from './components/MappingStudioView';
import { PreFlightVerificationView } from './components/PreFlightVerificationView';
import { ExecutionConsoleView } from './components/ExecutionConsoleView';
import { CreateProjectModal } from './components/CreateProjectModal';
import { fetchProjects, fetchSourceProfile } from './services/api';
import { MigrationProject, SourceProfile } from './types';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

export function App() {
  const [currentPhase, setCurrentPhase] = useState<WorkspacePhase>('ingestion');
  const [projects, setProjects] = useState<MigrationProject[]>([]);
  const [activeProject, setActiveProject] = useState<MigrationProject | null>(null);
  const [currentProfile, setCurrentProfile] = useState<SourceProfile | null>(null);
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
      setError(err.message || 'Failed to connect to migration assistant backend API');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async (fileId: string) => {
    try {
      const profile = await fetchSourceProfile(fileId);
      setCurrentProfile(profile);
    } catch (err: any) {
      console.error('Failed to load profile for file:', err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProfileLoaded = (profile: SourceProfile) => {
    setCurrentProfile(profile);
    loadProjects();
  };

  return (
    <div className="min-h-screen bg-canvas-subtle flex flex-col font-sans text-zinc-100 antialiased selection:bg-zoho-blue selection:text-white">
      <Navbar
        currentPhase={currentPhase}
        onSelectPhase={setCurrentPhase}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(p) => {
          setActiveProject(p);
          if (p.source_files && p.source_files.length > 0) {
            loadProfile(p.source_files[0].id);
          } else {
            setCurrentProfile(null);
          }
        }}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {isLoading && projects.length === 0 && (
          <div className="flex items-center justify-center p-16 text-zinc-400 space-x-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-zoho-blue" />
            <span>Connecting to Migration Workspace...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center justify-between text-xs text-red-400">
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

        {/* Phase 1: Source Ingestion & Profiling Workspace */}
        {currentPhase === 'ingestion' && activeProject && (
          <SourceIngestionView
            activeProject={activeProject}
            currentProfile={currentProfile}
            onProfileLoaded={handleProfileLoaded}
            onNavigateToMapping={() => setCurrentPhase('mapping')}
          />
        )}

        {/* Phase 2: Zoho Target Schema Metadata Explorer */}
        {currentPhase === 'metadata' && activeProject && (
          <MetadataExplorer
            projectId={activeProject.id}
            targetProduct={activeProject.target_product}
          />
        )}

        {/* Phase 3: Bipartite Schema Mapping & Transformation Rules Studio */}
        {currentPhase === 'mapping' && activeProject && (
          <MappingStudioView
            projectId={activeProject.id}
            targetProduct={activeProject.target_product}
            onNavigateToVerification={() => setCurrentPhase('verification')}
          />
        )}

        {/* Phase 4: Pre-Flight Verification & Relational DAG Studio */}
        {currentPhase === 'verification' && activeProject && (
          <PreFlightVerificationView
            projectId={activeProject.id}
            fileId={currentProfile?.file_id}
            targetProduct={activeProject.target_product}
            onNavigateToExecution={() => setCurrentPhase('execution')}
          />
        )}

        {/* Phase 5: Controlled API Execution & Package Lineage Studio */}
        {currentPhase === 'execution' && activeProject && (
          <ExecutionConsoleView
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
          setCurrentPhase('ingestion');
        }}
      />
    </div>
  );
}

export default App;
