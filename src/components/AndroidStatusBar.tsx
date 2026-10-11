import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Radio, Eye } from 'lucide-react';

interface AndroidStatusBarProps {
  isMirroredX?: boolean;
  isMirroredY?: boolean;
  isRemoteConnected?: boolean;
  isPlaying?: boolean;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({
  isMirroredX,
  isMirroredY,
  isRemoteConnected,
  isPlaying,
}) => {
  const [timeStr, setTimeStr] = useState<string>('12:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-8 px-5 flex items-center justify-between text-xs text-white/70 select-none z-30 pointer-events-none shrink-0 bg-transparent">
      {/* Left: Clock */}
      <div className="flex items-center gap-2 font-medium tracking-tight">
        <span>{timeStr}</span>
        {isPlaying && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 bg-emerald-950/80 rounded border border-emerald-500/30">
            PROMPTING
          </span>
        )}
      </div>

      {/* Center: Android Camera Punch Hole Simulator */}
      <div className="flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-black border border-white/20 flex items-center justify-center shadow-inner">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-700/50" />
        </div>
      </div>

      {/* Right: Teleprompter & System Status */}
      <div className="flex items-center gap-2">
        {isMirroredX && (
          <span className="text-[10px] font-mono tracking-tight text-amber-400 font-bold bg-amber-950/60 px-1 rounded border border-amber-500/30">
            MIRROR X
          </span>
        )}
        {isMirroredY && (
          <span className="text-[10px] font-mono tracking-tight text-amber-400 font-bold bg-amber-950/60 px-1 rounded border border-amber-500/30">
            MIRROR Y
          </span>
        )}
        {isRemoteConnected ? (
          <div className="flex items-center gap-1 text-[10px] text-cyan-400">
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">REMOTE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] text-white/40">
            <Radio className="w-3.5 h-3.5" />
          </div>
        )}
        <Wifi className="w-3.5 h-3.5 text-white/80" />
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-mono">92%</span>
          <BatteryMedium className="w-4 h-4 text-white/80" />
        </div>
      </div>
    </div>
  );
};
