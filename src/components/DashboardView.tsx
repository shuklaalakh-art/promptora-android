import React, { useState, useMemo } from 'react';
import { 
  Play, 
  Video, 
  FileText, 
  FolderPlus, 
  Tv, 
  Film, 
  Settings as SettingsIcon, 
  Gamepad2, 
  Search, 
  Clock, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { Script, VideoRecording, PrompterSettings, ActiveScreen } from '../types/teleprompter';
import { PromptoraLogo, PromptoraIcon } from './PromptoraLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface DashboardViewProps {
  scripts: Script[];
  recordings: VideoRecording[];
  settings: PrompterSettings;
  activeScript: Script;
  onSelectScript: (script: Script) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onQuickStart: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  scripts,
  recordings,
  settings,
  activeScript,
  onSelectScript,
  onNavigate,
  onQuickStart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter scripts based on search query
  const filteredScripts = useMemo(() => {
    if (!searchQuery.trim()) return scripts;
    const q = searchQuery.toLowerCase();
    return scripts.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q)
    );
  }, [scripts, searchQuery]);

  const activeWords = useMemo(() => {
    return activeScript.content.trim().split(/\s+/).filter(Boolean).length;
  }, [activeScript]);

  const activeDurationMinutes = Math.max(1, Math.round(activeWords / (settings.targetWpm || 140)));

  return (
    <div className="flex-1 w-full overflow-y-auto px-4 py-6 md:px-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Brand Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <PromptoraLogo variant="header" showTagline={true} showCreatedBy={true} />
          <p className="text-xs text-slate-400 mt-2">
            Professional teleprompter, CameraX video recorder, optical glass mirroring & speech reading studio
          </p>
        </div>

        {/* Actions: Install App & Remote Setup */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <PWAInstallButton />
          <button
            onClick={() => onNavigate('remote-setup')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/50 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          >
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            <span>Bluetooth & Remote</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Prominent Quick-Start Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-cyan-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ready to Present · Last Used Script</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {activeScript.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                {activeWords} words
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                ~{activeDurationMinutes} min read
              </span>
              <span>·</span>
              <span className="font-mono text-cyan-300">Speed {settings.speed}x</span>
              <span>·</span>
              <span className="font-mono text-slate-400">{settings.theme}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onQuickStart}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-slate-950 font-bold text-base shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Teleprompter</span>
            </button>
            <button
              onClick={() => onNavigate('camera-record')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold text-sm border border-white/10 transition-all"
            >
              <Video className="w-4 h-4 text-emerald-400" />
              <span>Record with Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* Core Action Grid (6 Professional Actions) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Core Studio Modules
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* New Script */}
          <button
            onClick={() => onNavigate('script-editor')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-cyan-500/40 active:scale-95 transition-all group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
              <FolderPlus className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-white">New Script</span>
            <span className="text-[10px] text-slate-400 mt-0.5">UTF-8 & TXT</span>
          </button>

          {/* My Scripts */}
          <button
            onClick={() => onNavigate('scripts-list')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-blue-500/40 active:scale-95 transition-all group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-white">My Scripts</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{scripts.length} Saved</span>
          </button>

          {/* Start Teleprompter */}
          <button
            onClick={() => onNavigate('prompter')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-emerald-500/40 active:scale-95 transition-all group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <span className="text-xs font-semibold text-white">Teleprompter</span>
            <span className="text-[10px] text-slate-400 mt-0.5">60fps Smooth</span>
          </button>

          {/* Record Video */}
          <button
            onClick={() => onNavigate('camera-record')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-rose-500/40 active:scale-95 transition-all group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-white">Record Video</span>
            <span className="text-[10px] text-slate-400 mt-0.5">CameraX Lens</span>
          </button>

          {/* External Display */}
          <button
            onClick={() => onNavigate('external-display')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-purple-500/40 active:scale-95 transition-all group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-110 transition-transform">
              <Tv className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-white">External Display</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Glass Mirroring</span>
          </button>

          {/* My Recordings */}
          <button
            onClick={() => onNavigate('recordings-list')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-amber-500/40 active:scale-95 transition-all group text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-white">Recordings</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{recordings.length} Videos</span>
          </button>
        </div>
      </div>

      {/* Recent Scripts Section with Live Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Recent Scripts</h3>
            <span className="text-xs font-mono text-slate-400">({scripts.length})</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredScripts.map((s) => {
            const count = s.content.trim().split(/\s+/).filter(Boolean).length;
            const isSelected = s.id === activeScript.id;
            return (
              <div
                key={s.id}
                onClick={() => onSelectScript(s)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/50 hover:bg-slate-900/80 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-white line-clamp-1">{s.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{s.content}</p>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 shrink-0">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400 font-mono">
                  <span>{s.category}</span>
                  <div className="flex items-center gap-2">
                    <span>{count} words</span>
                    <span>·</span>
                    <span>~{Math.max(1, Math.round(count / 140))}m</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Promptora Branding Footer */}
      <div className="pt-8 pb-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <PromptoraIcon size={24} />
          <span className="font-bold text-slate-300">Promptora</span>
          <span>·</span>
          <span>Read Naturally. Record Confidently.</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <span>Designed & Created by</span>
          <span className="text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
            Alakh
          </span>
        </div>
      </div>
    </div>
  );
};
