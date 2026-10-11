import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  ArrowLeft, 
  FlipHorizontal, 
  FlipVertical, 
  Monitor, 
  Smartphone, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Info, 
  CheckCircle2, 
  ExternalLink,
  Minus,
  Plus
} from 'lucide-react';
import { Script, PrompterSettings } from '../types/teleprompter';
import { triggerHaptic } from '../utils/audioHaptics';

interface ExternalDisplayViewProps {
  script: Script;
  settings: PrompterSettings;
  onUpdateSettings: (settings: Partial<PrompterSettings>) => void;
  onBack: () => void;
}

export const ExternalDisplayView: React.FC<ExternalDisplayViewProps> = ({
  script,
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [externalMirrorX, setExternalMirrorX] = useState<boolean>(true); // Glass prompters need mirror X by default
  const [externalMirrorY, setExternalMirrorY] = useState<boolean>(false);
  const [phoneControllerMirror, setPhoneControllerMirror] = useState<boolean>(false); // Phone stays unmirrored so speaker can read controls!
  
  const externalRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number | null>(null);
  const currentScrollRef = useRef<number>(0);

  // Synchronized scroll loop for external display
  useEffect(() => {
    const scrollStep = (timestamp: number) => {
      if (!lastScrollTimeRef.current) {
        lastScrollTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastScrollTimeRef.current) / 1000;
      lastScrollTimeRef.current = timestamp;

      if (isPlaying && externalRef.current) {
        const container = externalRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 0) {
          const pxPerSecond = 18 + Math.pow(settings.speed, 1.8) * 1.7;
          currentScrollRef.current += pxPerSecond * delta;
          if (currentScrollRef.current >= maxScroll) {
            currentScrollRef.current = maxScroll;
            container.scrollTop = maxScroll;
            setIsPlaying(false);
          } else {
            container.scrollTop = currentScrollRef.current;
          }
          if (controllerRef.current) {
            controllerRef.current.scrollTop = currentScrollRef.current;
          }
        }
      }
      scrollAnimRef.current = requestAnimationFrame(scrollStep);
    };

    scrollAnimRef.current = requestAnimationFrame(scrollStep);
    return () => {
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
      }
      lastScrollTimeRef.current = null;
    };
  }, [isPlaying, settings.speed]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    triggerHaptic(30);
  };

  const restartPrompter = () => {
    currentScrollRef.current = 0;
    if (externalRef.current) externalRef.current.scrollTop = 0;
    if (controllerRef.current) controllerRef.current.scrollTop = 0;
    setIsPlaying(false);
    triggerHaptic([20, 20]);
  };

  return (
    <div className="flex-1 w-full bg-slate-950 flex flex-col overflow-y-auto select-none p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400">
            External Display Engine Active
          </span>
        </div>
      </div>

      {/* Overview & Capability Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white">Dual-Display Teleprompter Architecture</h4>
            <p className="text-slate-400 mt-0.5">
              In Android, Promptora uses <code className="text-cyan-300 font-mono">android.app.Presentation</code> to project clean, mirrored text to external HDMI/USB-C or Miracast displays while keeping your device unmirrored as a full controller.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded bg-slate-800 border border-white/10 font-mono text-[11px] text-slate-300">
            Target: 70/30 Beam Splitter
          </span>
        </div>
      </div>

      {/* Side-by-Side Dual Display Simulation Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: External Teleprompter Screen (Mirrored for Glass) */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Tv className="w-4 h-4" />
              <span>External Monitor (Rig Screen)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExternalMirrorX(!externalMirrorX)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  externalMirrorX
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-white/10 text-slate-400'
                }`}
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Flip X {externalMirrorX ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setExternalMirrorY(!externalMirrorY)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  externalMirrorY
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-white/10 text-slate-400'
                }`}
              >
                <FlipVertical className="w-3.5 h-3.5" />
                <span>Flip Y</span>
              </button>
            </div>
          </div>

          <div className="relative h-80 sm:h-96 rounded-2xl bg-black border-2 border-cyan-500/30 overflow-hidden shadow-2xl flex flex-col">
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/80 border border-white/10 text-[10px] font-mono text-cyan-400">
              Beam-Splitter Preview (Reflected view)
            </div>

            <div
              ref={externalRef}
              className="flex-1 p-6 overflow-y-hidden text-center"
              style={{
                transform: `scale(${externalMirrorX ? -1 : 1}, ${externalMirrorY ? -1 : 1})`,
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                color: settings.theme === 'broadcast-green' ? '#00FF66' : '#FFFFFF',
              }}
            >
              <div className="space-y-6 pt-12">
                {script.content.split('\n').map((line, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Phone Controller (Unmirrored for Speaker) */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Device Controller (Your Hand/Podium)</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">
              Unmirrored Controls
            </span>
          </div>

          <div className="h-80 sm:h-96 rounded-2xl bg-slate-900 border border-white/15 p-5 flex flex-col justify-between shadow-2xl">
            {/* Live Synchronized Script Snippet */}
            <div
              ref={controllerRef}
              className="flex-1 overflow-y-auto no-scrollbar p-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-slate-300 font-sans leading-relaxed mb-4"
            >
              <div className="text-[10px] font-mono text-slate-500 uppercase mb-2">
                Live Prompter Script Monitor
              </div>
              {script.content.split('\n').map((line, idx) => (
                <p key={idx} className="mb-2">
                  {line}
                </p>
              ))}
            </div>

            {/* Controller Action Deck */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Speed Control</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateSettings({ speed: Math.max(1, settings.speed - 1) })}
                    className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-white"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-cyan-400 font-bold text-sm w-6 text-center">
                    {settings.speed}
                  </span>
                  <button
                    onClick={() => onUpdateSettings({ speed: Math.min(20, settings.speed + 1) })}
                    className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause External Screen</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start External Screen</span>
                    </>
                  )}
                </button>
                <button
                  onClick={restartPrompter}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Android Hardware Compatibility & Wiring Guide */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
        <h3 className="text-sm font-bold text-white">Android Hardware Compatibility Notes</h3>
        <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
          <li>
            <strong>USB-C to HDMI / DisplayPort Alt Mode:</strong> Supported on Google Pixel 8+, Samsung Galaxy (DeX or Screen Mirror), and select modern Android flagships.
          </li>
          <li>
            <strong>Wireless Cast / Miracast:</strong> Available via Android Quick Settings → Cast / Smart View.
          </li>
          <li>
            <strong>Beam-Splitter Glass:</strong> With 70/30 optical glass hoods, enable <em>Flip X</em> so the reflection appears correctly oriented to the speaker.
          </li>
        </ul>
      </div>
    </div>
  );
};
