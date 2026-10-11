import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  Minus, 
  Plus, 
  FlipHorizontal, 
  FlipVertical, 
  Bookmark, 
  Type, 
  Sliders, 
  Radio, 
  Sparkles, 
  ArrowLeft 
} from 'lucide-react';
import { PlaybackState, PrompterSettings, Script } from '../types/teleprompter';
import { remoteSync } from '../services/remoteSync';
import { triggerHaptic } from '../utils/audioHaptics';
import { PromptoraIcon } from './PromptoraLogo';

interface PocketRemoteControllerProps {
  onBack?: () => void;
  activeScript?: Script;
}

export const PocketRemoteController: React.FC<PocketRemoteControllerProps> = ({
  onBack,
  activeScript,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(5);
  const [fontSize, setFontSize] = useState<number>(38);
  const [mirrorX, setMirrorX] = useState<boolean>(false);
  const [mirrorY, setMirrorY] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [activeTextSnippet, setActiveTextSnippet] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    remoteSync.setRole(false); // We are the remote controller

    const unsubscribe = remoteSync.subscribe((msg) => {
      setIsConnected(true);

      if (msg.type === 'STATE_SYNC' && msg.state) {
        if (msg.state.isPlaying !== undefined) setIsPlaying(msg.state.isPlaying);
        if (msg.state.scrollProgress !== undefined) setProgress(msg.state.scrollProgress);
        if (msg.state.activeLineText !== undefined) setActiveTextSnippet(msg.state.activeLineText);
      } else if (msg.type === 'SETTINGS_SYNC' && msg.settings) {
        if (msg.settings.speed !== undefined) setSpeed(msg.settings.speed);
        if (msg.settings.fontSize !== undefined) setFontSize(msg.settings.fontSize);
        if (msg.settings.mirrorX !== undefined) setMirrorX(msg.settings.mirrorX);
        if (msg.settings.mirrorY !== undefined) setMirrorY(msg.settings.mirrorY);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const sendCmd = (cmd: any, payload?: any) => {
    remoteSync.sendCommand(cmd, payload);
    triggerHaptic(25);
  };

  const handleTogglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    sendCmd(next ? 'PLAY' : 'PAUSE');
    triggerHaptic([30, 20]);
  };

  const handleSpeedChange = (delta: number) => {
    const next = Math.min(20, Math.max(1, speed + delta));
    setSpeed(next);
    sendCmd('SET_SPEED', next);
  };

  const handleFontChange = (delta: number) => {
    const next = Math.min(84, Math.max(18, fontSize + delta));
    setFontSize(next);
    sendCmd('SET_FONT_SIZE', next);
  };

  const handleToggleMirrorX = () => {
    const next = !mirrorX;
    setMirrorX(next);
    sendCmd('TOGGLE_MIRROR_X');
  };

  const handleToggleMirrorY = () => {
    const next = !mirrorY;
    setMirrorY(next);
    sendCmd('TOGGLE_MIRROR_Y');
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col justify-between p-4 max-w-md mx-auto select-none overflow-y-auto no-scrollbar">
      {/* Remote Status Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <PromptoraIcon size={24} />
          <span className="text-xs font-bold text-white tracking-wider">
            Promptora Remote
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
          <span>{remoteSync.getRoomId()}</span>
        </div>
      </div>

      {/* Live Prompter Monitor: Active Line Snippet & Progress */}
      <div className="my-4 p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-2 shadow-lg">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>PROMPTER EYE-LINE</span>
          <span className="text-cyan-400 font-bold">{progress}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-white/90 font-medium line-clamp-2 min-h-[32px] pt-1 leading-snug">
          {activeTextSnippet || 'Prompter standing by. Press Start to begin scrolling.'}
        </p>
      </div>

      {/* Main Giant Thumb Zone: Start / Pause Button */}
      <div className="flex flex-col items-center justify-center my-4">
        <button
          onClick={handleTogglePlay}
          className={`w-36 h-36 rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl active:scale-90 transition-all duration-150 ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30 ring-8 ring-amber-500/20'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30 ring-8 ring-emerald-500/20'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-12 h-12 fill-current" />
              <span className="text-xs font-black uppercase tracking-wider mt-1">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-12 h-12 fill-current ml-1" />
              <span className="text-xs font-black uppercase tracking-wider mt-1">Start</span>
            </>
          )}
        </button>
      </div>

      {/* Secondary Controls: Speed Slider & Stepper */}
      <div className="space-y-4">
        {/* Speed Cluster */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Scroll Speed</span>
            <span className="font-mono text-sm font-bold text-cyan-400">{speed}x</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSpeedChange(-1)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="20"
              value={speed}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSpeed(val);
                sendCmd('SET_SPEED', val);
              }}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none"
            />
            <button
              onClick={() => handleSpeedChange(1)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Font Size & Jump Actions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Font Size */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Type className="w-4 h-4 text-cyan-400" />
              <span>Font</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFontChange(-3)}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-mono text-white px-1">{fontSize}</span>
              <button
                onClick={() => handleFontChange(3)}
                className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Restart to Beginning */}
          <button
            onClick={() => sendCmd('RESTART')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-white active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset Script</span>
          </button>
        </div>

        {/* Cue Navigation & Mirror Toggles */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => sendCmd('PREV_CUE')}
            className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1 active:scale-95"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Prev Cue</span>
          </button>

          <button
            onClick={() => sendCmd('NEXT_CUE')}
            className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1 active:scale-95"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Next Cue</span>
          </button>

          <button
            onClick={handleToggleMirrorX}
            className={`py-2.5 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors active:scale-95 ${
              mirrorX
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-white/10 text-slate-300'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Mirror X</span>
          </button>
        </div>
      </div>
    </div>
  );
};
