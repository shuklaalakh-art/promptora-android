import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Edit3, 
  Play, 
  X, 
  ArrowLeft,
  Clock
} from 'lucide-react';
import { Script } from '../types/teleprompter';
import { triggerHaptic } from '../utils/audioHaptics';

interface ScriptsListModalProps {
  scripts: Script[];
  activeScriptId: string;
  onSelectScript: (script: Script) => void;
  onEditScript: (script: Script) => void;
  onNewScript: () => void;
  onDeleteScript: (id: string) => void;
  onDuplicateScript: (script: Script) => void;
  onClose: () => void;
}

export const ScriptsListModal: React.FC<ScriptsListModalProps> = ({
  scripts,
  activeScriptId,
  onSelectScript,
  onEditScript,
  onNewScript,
  onDeleteScript,
  onDuplicateScript,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    scripts.forEach((s) => set.add(s.category));
    return ['all', ...Array.from(set)];
  }, [scripts]);

  const filtered = useMemo(() => {
    return scripts.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [scripts, search, selectedCategory]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">My Scripts Library</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewScript}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>New Script</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 bg-slate-900/60 border-b border-white/10 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, keywords or speech text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Script Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {filtered.map((s) => {
            const count = s.content.trim().split(/\s+/).filter(Boolean).length;
            const isCurrent = s.id === activeScriptId;
            return (
              <div
                key={s.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isCurrent
                    ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/40 hover:bg-slate-900 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{s.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{s.content}</p>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 shrink-0">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span>{s.category}</span>
                    <span>·</span>
                    <span>{count} words</span>
                    <span>·</span>
                    <span>~{Math.max(1, Math.round(count / 140))}m</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDuplicateScript(s)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Duplicate script"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditScript(s)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Edit text"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectScript(s);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1 text-xs"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Prompt</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
