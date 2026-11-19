import React, { useState } from 'react';
import { X, Layers, Loader2 } from 'lucide-react';
import { createProject } from '../services/api';
import { MigrationProject } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: MigrationProject) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onProjectCreated 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetProduct, setTargetProduct] = useState('CRM');
  const [sourceType, setSourceType] = useState('File');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        source_type: sourceType,
        target_product: targetProduct,
      });
      onProjectCreated(project);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-canvas-panel border border-border-subtle rounded-lg max-w-md w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle bg-canvas-subtle">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-zoho-blue" />
            <h2 className="text-sm font-semibold text-zinc-100">Create Migration Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp CRM Migration"
              className="w-full bg-canvas border border-border-subtle rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zoho-blue transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Source systems, schemas, client data notes..."
              className="w-full bg-canvas border border-border-subtle rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zoho-blue transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Target Zoho Platform</label>
              <select
                value={targetProduct}
                onChange={(e) => setTargetProduct(e.target.value)}
                className="w-full bg-canvas border border-border-subtle rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zoho-blue transition"
              >
                <option value="CRM">Zoho CRM</option>
                <option value="Creator">Zoho Creator</option>
                <option value="Books">Zoho Books</option>
                <option value="Desk">Zoho Desk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Primary Source Type</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full bg-canvas border border-border-subtle rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zoho-blue transition"
              >
                <option value="File">Spreadsheet / CSV / JSON</option>
                <option value="Database">SQL Database</option>
                <option value="API">REST API Endpoint</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-canvas-subtle hover:bg-canvas text-xs text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded bg-zoho-blue hover:bg-blue-600 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center space-x-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
