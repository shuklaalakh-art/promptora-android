import React, { useState } from 'react';
import { 
  Film, 
  ArrowLeft, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Clock, 
  HardDrive, 
  Video, 
  CheckCircle2 
} from 'lucide-react';
import { VideoRecording } from '../types/teleprompter';
import { triggerHaptic } from '../utils/audioHaptics';

interface MyRecordingsViewProps {
  recordings: VideoRecording[];
  onDeleteRecording: (id: string) => void;
  onBack: () => void;
  onRecordNew: () => void;
}

export const MyRecordingsView: React.FC<MyRecordingsViewProps> = ({
  recordings,
  onDeleteRecording,
  onBack,
  onRecordNew,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoRecording | null>(
    recordings.length > 0 ? recordings[0] : null
  );

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 w-full bg-slate-950 flex flex-col overflow-y-auto select-none p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={onRecordNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
        >
          <Video className="w-4 h-4" />
          <span>Record New Take</span>
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Film className="w-6 h-6 text-amber-400" />
          <span>My Video Recordings (MediaStore)</span>
        </h2>
        <p className="text-xs text-slate-400">
          Takes recorded with CameraX pipeline and synchronized prompter overlay.
        </p>
      </div>

      {recordings.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900 border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No Recordings Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Record your first presentation video using the CameraX video pipeline with live teleprompter text.
          </p>
          <button
            onClick={onRecordNew}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
          >
            Start Video Recording
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Player Player (Media3 style) */}
          <div className="lg:col-span-2 space-y-3">
            {selectedVideo && (
              <div className="rounded-2xl bg-black border border-white/15 overflow-hidden shadow-2xl flex flex-col">
                <video
                  src={selectedVideo.blobUrl}
                  controls
                  className="w-full aspect-video bg-black object-contain"
                />

                <div className="p-4 bg-slate-900 border-t border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {selectedVideo.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                      <span>{formatSecs(selectedVideo.durationSecs)}</span>
                      <span>·</span>
                      <span>{selectedVideo.resolution}</span>
                      <span>·</span>
                      <span>{formatBytes(selectedVideo.sizeBytes)}</span>
                    </div>
                  </div>

                  <a
                    href={selectedVideo.blobUrl}
                    download={`${selectedVideo.title.replace(/[^a-zA-Z0-9]/g, '_')}.webm`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Recordings List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recorded Takes ({recordings.length})
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
              {recordings.map((rec) => {
                const isSelected = rec.id === selectedVideo?.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setSelectedVideo(rec);
                      triggerHaptic(15);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400 shrink-0">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-semibold text-white truncate">
                          {rec.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatSecs(rec.durationSecs)} · {formatBytes(rec.sizeBytes)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecording(rec.id);
                        if (selectedVideo?.id === rec.id) {
                          setSelectedVideo(recordings.find((r) => r.id !== rec.id) || null);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                      title="Delete recording"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
