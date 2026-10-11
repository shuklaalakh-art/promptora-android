import React from 'react';
import { Maximize, Minimize, RotateCcw, Play, Pause } from 'lucide-react';
import { triggerHaptic } from '../utils/audioHaptics';

interface AndroidNavBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showGestureBar?: boolean;
}

export const AndroidNavBar: React.FC<AndroidNavBarProps> = ({
  isPlaying,
  onTogglePlay,
  onRestart,
  isFullscreen,
  onToggleFullscreen,
  showGestureBar = false,
}) => {
  return (
    <div className="w-full h-12 bg-black/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-6 z-30 shrink-0 select-none">
      {showGestureBar ? (
        // Modern Android Gesture Bar
        <div className="w-32 h-1 bg-white/40 rounded-full hover:bg-white/70 transition-colors cursor-pointer" />
      ) : (
        // Classic Android 3-Button Navigation with Teleprompter actions
        <>
          {/* Back / Restart */}
          <button
            onClick={() => {
              triggerHaptic(20);
              onRestart();
            }}
            title="Restart Script to Top"
            className="w-12 h-10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Home / Play-Pause Quick Toggle */}
          <button
            onClick={() => {
              triggerHaptic(30);
              onTogglePlay();
            }}
            title={isPlaying ? 'Pause Prompter' : 'Start Prompter'}
            className="w-12 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-amber-400" />
            ) : (
              <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            )}
          </button>

          {/* Recents / Fullscreen Immersive */}
          <button
            onClick={() => {
              triggerHaptic(20);
              onToggleFullscreen();
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Immersive Fullscreen'}
            className="w-12 h-10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-transform"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        </>
      )}
    </div>
  );
};
