import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Type, 
  Sliders, 
  Bookmark, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Flame, 
  Sparkles,
  Maximize2,
  Minimize2,
  Minus,
  Plus
} from 'lucide-react';
import { PrompterSettings, Script, PlaybackState, PrompterTheme } from '../types/teleprompter';
import { playCountdownTone, triggerHaptic } from '../utils/audioHaptics';
import { remoteSync } from '../services/remoteSync';

interface TeleprompterCanvasProps {
  script: Script;
  settings: PrompterSettings;
  onUpdateSettings: (settings: Partial<PrompterSettings>) => void;
  onOpenSettings: () => void;
  onOpenScriptManager: () => void;
  onOpenRemotePairing: () => void;
  isRemoteConnected?: boolean;
}

const THEME_CLASSES: Record<PrompterTheme, { bg: string; text: string; guide: string; badge: string }> = {
  'studio-dark': {
    bg: 'bg-black',
    text: 'text-white',
    guide: 'bg-cyan-500/30 border-cyan-400',
    badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
  },
  'broadcast-green': {
    bg: 'bg-black',
    text: 'text-[#00FF66]',
    guide: 'bg-[#00FF66]/25 border-[#00FF66]',
    badge: 'bg-emerald-950/80 text-[#00FF66] border-emerald-600',
  },
  'warm-gold': {
    bg: 'bg-black',
    text: 'text-[#FFB703]',
    guide: 'bg-[#FFB703]/25 border-[#FFB703]',
    badge: 'bg-amber-950/80 text-[#FFB703] border-amber-600',
  },
  'cyber-cyan': {
    bg: 'bg-black',
    text: 'text-[#00F0FF]',
    guide: 'bg-[#00F0FF]/25 border-[#00F0FF]',
    badge: 'bg-cyan-950/80 text-[#00F0FF] border-cyan-500',
  },
  'high-contrast-light': {
    bg: 'bg-slate-50',
    text: 'text-slate-950 font-semibold',
    guide: 'bg-blue-600/15 border-blue-600',
    badge: 'bg-slate-200 text-slate-900 border-slate-300',
  },
};

export const TeleprompterCanvas: React.FC<TeleprompterCanvasProps> = ({
  script,
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenScriptManager,
  onOpenRemotePairing,
  isRemoteConnected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const currentScrollRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [showHud, setShowHud] = useState<boolean>(true);
  const [activeCueLabel, setActiveCueLabel] = useState<string>('');
  const [activeLineSnippet, setActiveLineSnippet] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [totalEstimatedSecs, setTotalEstimatedSecs] = useState<number>(0);
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);

  const hudTimerRef = useRef<number | null>(null);

  // Parse cues from script content
  const parsedParagraphs = useMemo(() => {
    const rawLines = script.content.split('\n');
    return rawLines.map((line, idx) => {
      const isCue = line.trim().startsWith('[[CUE:') || line.trim().startsWith('#');
      let cueText = '';
      if (isCue) {
        cueText = line.replace(/\[\[CUE:|\#|\]\]/g, '').trim();
      }
      const isPause = line.trim().startsWith('[PAUSE');
      let pauseText = '';
      if (isPause) {
        pauseText = line.replace(/[\[\]]/g, '').trim();
      }
      return {
        id: `line-${idx}`,
        text: line,
        isCue,
        cueText,
        isPause,
        pauseText,
        isEmpty: line.trim() === '',
      };
    });
  }, [script.content]);

  // Word count & estimate duration
  const wordCount = useMemo(() => {
    return script.content.trim().split(/\s+/).filter(Boolean).length;
  }, [script.content]);

  useEffect(() => {
    const wpm = settings.targetWpm || 140;
    const minutes = wordCount / wpm;
    setTotalEstimatedSecs(Math.round(minutes * 60));
  }, [wordCount, settings.targetWpm]);

  // Elapsed timer when playing
  useEffect(() => {
    let interval: number | null = null;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setElapsedSecs((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Calculate current active text under the guide
  const updateActiveTextUnderGuide = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const container = containerRef.current;
    const guidePx = (container.clientHeight * settings.guidePosition) / 100;
    
    // Find paragraph closest to guide position
    const paragraphs = contentRef.current.children;
    for (let i = 0; i < paragraphs.length; i++) {
      const el = paragraphs[i] as HTMLElement;
      const rect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = rect.top - containerRect.top;
      const relativeBottom = rect.bottom - containerRect.top;

      if (relativeTop <= guidePx && relativeBottom >= guidePx) {
        const text = el.innerText.trim();
        if (text) {
          setActiveLineSnippet(text.slice(0, 60));
          // Check if cue
          if (text.startsWith('CUE:') || el.getAttribute('data-cue')) {
            setActiveCueLabel(el.getAttribute('data-cue') || '');
          }
        }
        break;
      }
    }
  }, [settings.guidePosition]);

  // Sync state with paired remote
  const broadcastCurrentState = useCallback(() => {
    if (!containerRef.current) return;
    const max = containerRef.current.scrollHeight - containerRef.current.clientHeight;
    const progress = max > 0 ? (currentScrollRef.current / max) * 100 : 0;
    setProgressPercent(Math.min(100, Math.max(0, Math.round(progress))));

    remoteSync.broadcastState({
      isPlaying,
      scrollPosition: Math.round(currentScrollRef.current),
      scrollProgress: Math.min(100, Math.max(0, Math.round(progress))),
      maxScroll: max,
      isCountingDown,
      countdownSeconds: countdownNum,
      currentWpm: settings.targetWpm,
      elapsedSeconds: elapsedSecs,
      totalWords: wordCount,
      estimatedRemainingSeconds: Math.max(0, totalEstimatedSecs - elapsedSecs),
      activeLineText: activeLineSnippet,
    });
  }, [
    isPlaying,
    isCountingDown,
    countdownNum,
    settings.targetWpm,
    elapsedSecs,
    wordCount,
    totalEstimatedSecs,
    activeLineSnippet,
  ]);

  // Main 60fps / 120fps Subpixel Smooth Animation Frame Loop
  useEffect(() => {
    const scrollStep = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlaying && containerRef.current) {
        const container = containerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;

        if (maxScroll > 0) {
          // Speed formula: scale from 20px/s (speed 1) to 450px/s (speed 20)
          const pxPerSecond = 18 + Math.pow(settings.speed, 1.8) * 1.7;
          const increment = pxPerSecond * delta;

          currentScrollRef.current += increment;

          if (currentScrollRef.current >= maxScroll) {
            currentScrollRef.current = maxScroll;
            container.scrollTop = maxScroll;
            if (settings.autoRestart) {
              currentScrollRef.current = 0;
              container.scrollTop = 0;
            } else {
              setIsPlaying(false);
            }
          } else {
            container.scrollTop = currentScrollRef.current;
          }

          updateActiveTextUnderGuide();
        }
      }

      animFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animFrameRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [isPlaying, settings.speed, settings.autoRestart, updateActiveTextUnderGuide]);

  // Periodic state sync broadcast to remote (every 250ms)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      broadcastCurrentState();
    }, 250);
    return () => clearInterval(syncInterval);
  }, [broadcastCurrentState]);

  // Handle manual scroll (touch swipe or mouse drag)
  const handleScroll = () => {
    if (containerRef.current) {
      currentScrollRef.current = containerRef.current.scrollTop;
      updateActiveTextUnderGuide();
    }
  };

  // Start with optional countdown
  const startPrompter = useCallback(() => {
    if (settings.countdownDuration > 0 && !isPlaying) {
      setIsCountingDown(true);
      setCountdownNum(settings.countdownDuration);
      if (settings.audioCountdown) {
        playCountdownTone(false);
      }
      triggerHaptic(40);

      let count = settings.countdownDuration;
      const countTimer = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdownNum(count);
          if (settings.audioCountdown) {
            playCountdownTone(false);
          }
          triggerHaptic(30);
        } else {
          clearInterval(countTimer);
          setIsCountingDown(false);
          if (settings.audioCountdown) {
            playCountdownTone(true);
          }
          triggerHaptic([60, 40, 60]);
          setIsPlaying(true);
        }
      }, 1000);
    } else {
      setIsPlaying(true);
      triggerHaptic(30);
    }
  }, [settings.countdownDuration, settings.audioCountdown, isPlaying]);

  const pausePrompter = useCallback(() => {
    setIsPlaying(false);
    setIsCountingDown(false);
    triggerHaptic(20);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying || isCountingDown) {
      pausePrompter();
    } else {
      startPrompter();
    }
  }, [isPlaying, isCountingDown, pausePrompter, startPrompter]);

  const restartScript = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      currentScrollRef.current = 0;
    }
    setElapsedSecs(0);
    setIsPlaying(false);
    setIsCountingDown(false);
    triggerHaptic([30, 30]);
    broadcastCurrentState();
  }, [broadcastCurrentState]);

  const jumpSeconds = useCallback((sec: number) => {
    if (!containerRef.current) return;
    const pxPerSecond = 18 + Math.pow(settings.speed, 1.8) * 1.7;
    const deltaPx = pxPerSecond * sec;
    const target = Math.max(0, currentScrollRef.current + deltaPx);
    currentScrollRef.current = target;
    containerRef.current.scrollTop = target;
    triggerHaptic(20);
    broadcastCurrentState();
  }, [settings.speed, broadcastCurrentState]);

  const jumpToNextCue = useCallback(() => {
    if (!contentRef.current || !containerRef.current) return;
    const cueElements = contentRef.current.querySelectorAll('[data-is-cue="true"]');
    const currentTop = containerRef.current.scrollTop;
    for (let i = 0; i < cueElements.length; i++) {
      const el = cueElements[i] as HTMLElement;
      if (el.offsetTop > currentTop + 30) {
        containerRef.current.scrollTop = el.offsetTop - 80;
        currentScrollRef.current = el.offsetTop - 80;
        triggerHaptic(30);
        return;
      }
    }
  }, []);

  const jumpToPrevCue = useCallback(() => {
    if (!contentRef.current || !containerRef.current) return;
    const cueElements = contentRef.current.querySelectorAll('[data-is-cue="true"]');
    const currentTop = containerRef.current.scrollTop;
    for (let i = cueElements.length - 1; i >= 0; i--) {
      const el = cueElements[i] as HTMLElement;
      if (el.offsetTop < currentTop - 30) {
        containerRef.current.scrollTop = Math.max(0, el.offsetTop - 80);
        currentScrollRef.current = Math.max(0, el.offsetTop - 80);
        triggerHaptic(30);
        return;
      }
    }
    // Fallback to top
    restartScript();
  }, [restartScript]);

  // Listen to remote commands from paired remote
  useEffect(() => {
    const unsubscribe = remoteSync.subscribe((msg) => {
      if (msg.type === 'COMMAND' && msg.command) {
        switch (msg.command) {
          case 'PLAY':
            startPrompter();
            break;
          case 'PAUSE':
            pausePrompter();
            break;
          case 'TOGGLE_PLAY':
            togglePlay();
            break;
          case 'SET_SPEED':
            if (typeof msg.payload === 'number') {
              onUpdateSettings({ speed: Math.min(20, Math.max(1, msg.payload)) });
            }
            break;
          case 'SPEED_UP':
            onUpdateSettings({ speed: Math.min(20, settings.speed + 1) });
            break;
          case 'SPEED_DOWN':
            onUpdateSettings({ speed: Math.max(1, settings.speed - 1) });
            break;
          case 'SET_FONT_SIZE':
            if (typeof msg.payload === 'number') {
              onUpdateSettings({ fontSize: Math.min(84, Math.max(18, msg.payload)) });
            }
            break;
          case 'FONT_UP':
            onUpdateSettings({ fontSize: Math.min(84, settings.fontSize + 4) });
            break;
          case 'FONT_DOWN':
            onUpdateSettings({ fontSize: Math.max(18, settings.fontSize - 4) });
            break;
          case 'SEEK':
            if (containerRef.current && typeof msg.payload === 'number') {
              const max = containerRef.current.scrollHeight - containerRef.current.clientHeight;
              const target = (msg.payload / 100) * max;
              currentScrollRef.current = target;
              containerRef.current.scrollTop = target;
            }
            break;
          case 'RESTART':
            restartScript();
            break;
          case 'JUMP_FORWARD':
            jumpSeconds(5);
            break;
          case 'JUMP_BACKWARD':
            jumpSeconds(-5);
            break;
          case 'TOGGLE_MIRROR_X':
            onUpdateSettings({ mirrorX: !settings.mirrorX });
            break;
          case 'TOGGLE_MIRROR_Y':
            onUpdateSettings({ mirrorY: !settings.mirrorY });
            break;
          case 'NEXT_CUE':
            jumpToNextCue();
            break;
          case 'PREV_CUE':
            jumpToPrevCue();
            break;
          default:
            break;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    startPrompter,
    pausePrompter,
    togglePlay,
    restartScript,
    jumpSeconds,
    jumpToNextCue,
    jumpToPrevCue,
    onUpdateSettings,
    settings.speed,
    settings.fontSize,
    settings.mirrorX,
    settings.mirrorY,
  ]);

  // Keyboard shortcuts (Space, Arrow keys, M, V, R, F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        onUpdateSettings({ speed: Math.min(20, settings.speed + 1) });
        triggerHaptic(15);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        onUpdateSettings({ speed: Math.max(1, settings.speed - 1) });
        triggerHaptic(15);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        jumpSeconds(5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        jumpSeconds(-5);
      } else if (e.key.toLowerCase() === 'm') {
        onUpdateSettings({ mirrorX: !settings.mirrorX });
        triggerHaptic(20);
      } else if (e.key.toLowerCase() === 'v') {
        onUpdateSettings({ mirrorY: !settings.mirrorY });
        triggerHaptic(20);
      } else if (e.key.toLowerCase() === 'r') {
        restartScript();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, jumpSeconds, restartScript, settings.speed, settings.mirrorX, settings.mirrorY, onUpdateSettings]);

  // Reset HUD auto-hide timer on user interaction
  const triggerUserActivity = () => {
    setShowHud(true);
    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current);
    }
    if (isPlaying) {
      hudTimerRef.current = window.setTimeout(() => {
        setShowHud(false);
      }, 3500);
    }
  };

  const themeStyle = THEME_CLASSES[settings.theme] || THEME_CLASSES['studio-dark'];

  // Mirror transform style
  const mirrorTransform = useMemo(() => {
    const scaleX = settings.mirrorX ? -1 : 1;
    const scaleY = settings.mirrorY ? -1 : 1;
    return `scale(${scaleX}, ${scaleY})`;
  }, [settings.mirrorX, settings.mirrorY]);

  // Formatted duration
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className={`relative w-full h-full flex flex-col overflow-hidden select-none ${themeStyle.bg}`}
      onMouseMove={triggerUserActivity}
      onTouchStart={triggerUserActivity}
    >
      {/* =========================================================================
          TELEPROMPTER SCROLL CONTAINER (WITH MIRRORING TRANSFORMS)
         ========================================================================= */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onClick={togglePlay}
        className="relative flex-1 w-full h-full overflow-y-scroll overflow-x-hidden no-scrollbar cursor-pointer"
        style={{
          transform: mirrorTransform,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* Top spacer so script starts right at eye-line guide */}
        <div style={{ height: `${settings.guidePosition}vh` }} />

        {/* Script Content Area with custom typography & margins */}
        <div
          ref={contentRef}
          className="mx-auto transition-all"
          style={{
            paddingLeft: `${Math.max(4, settings.marginHorizontal)}%`,
            paddingRight: `${Math.max(4, settings.marginHorizontal)}%`,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            letterSpacing: `${settings.letterSpacing}px`,
            textAlign: settings.textAlign,
            fontFamily: settings.fontFamily,
          }}
        >
          {parsedParagraphs.map((p, index) => {
            if (p.isEmpty) {
              return <div key={p.id} className="h-6" />;
            }

            if (p.isCue) {
              return (
                <div
                  key={p.id}
                  data-is-cue="true"
                  data-cue={p.cueText}
                  className="my-6 inline-flex items-center gap-2 px-3 py-1 text-sm font-bold tracking-wider rounded-md border shadow-sm"
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    borderColor: 'rgba(56, 189, 248, 0.5)',
                    color: '#38bdf8',
                  }}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{p.cueText}</span>
                </div>
              );
            }

            if (p.isPause) {
              return (
                <div
                  key={p.id}
                  className="my-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{p.pauseText}</span>
                </div>
              );
            }

            return (
              <p
                key={p.id}
                className={`mb-6 transition-colors duration-150 ${themeStyle.text}`}
              >
                {p.text}
              </p>
            );
          })}
        </div>

        {/* Bottom spacer so presenter can scroll all the way to the end */}
        <div style={{ height: `${100 - settings.guidePosition}vh` }} />
      </div>

      {/* =========================================================================
          EYE-LINE READING GUIDE OVERLAY (UNMIRRORED FOR ACCURATE ALIGNMENT)
         ========================================================================= */}
      {settings.showGuide && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-20 flex items-center justify-between"
          style={{
            top: `${settings.guidePosition}%`,
            transform: 'translateY(-50%)',
          }}
        >
          {/* Left Arrow Pointer */}
          <div className="flex items-center gap-1 pl-2">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-cyan-400 drop-shadow" />
            <div className="h-0.5 w-6 bg-cyan-400/80" />
          </div>

          {/* Center Guide Line / Focus Band */}
          <div
            className={`flex-1 mx-2 transition-all ${
              settings.guideStyle === 'band'
                ? 'h-16 bg-cyan-500/10 border-y border-cyan-400/30'
                : 'h-0.5 bg-gradient-to-r from-cyan-400/30 via-cyan-400 to-cyan-400/30 shadow-[0_0_8px_rgba(34,211,238,0.7)]'
            }`}
          />

          {/* Right Arrow Pointer */}
          <div className="flex items-center gap-1 pr-2">
            <div className="h-0.5 w-6 bg-cyan-400/80" />
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-cyan-400 drop-shadow" />
          </div>
        </div>
      )}

      {/* =========================================================================
          COUNTDOWN ANIMATION OVERLAY
         ========================================================================= */}
      {isCountingDown && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
          <div className="text-[120px] sm:text-[180px] font-black tracking-tighter text-white animate-pulse font-mono drop-shadow-[0_0_35px_rgba(56,189,248,0.8)]">
            {countdownNum}
          </div>
          <div className="text-sm font-semibold tracking-widest text-cyan-400 uppercase mt-2">
            Get Ready to Present
          </div>
          <button
            onClick={pausePrompter}
            className="mt-8 px-5 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 text-xs font-medium border border-white/20"
          >
            Cancel Countdown
          </button>
        </div>
      )}

      {/* =========================================================================
          HEADS-UP DISPLAY (HUD) & RAPID ON-SCREEN CONTROLS
         ========================================================================= */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 z-30 flex flex-col justify-between p-4 ${
          showHud ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Control Bar: Title, Mirror Badges, Script Switcher */}
        <div className="flex items-center justify-between gap-3 pointer-events-auto">
          {/* Script Name & Category */}
          <button
            onClick={onOpenScriptManager}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-white/15 backdrop-blur-md transition-colors text-left max-w-[240px] sm:max-w-xs truncate"
          >
            <span className="text-xs font-semibold truncate">{script.title}</span>
            <span className="text-[10px] text-cyan-400 font-mono shrink-0">Change</span>
          </button>

          {/* Quick Stats: Words & Reading Time */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/15 backdrop-blur-md text-xs font-mono text-white/80">
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{formatTime(elapsedSecs)} / ~{formatTime(totalEstimatedSecs)}</span>
          </div>

          {/* Right Header CTAs: Settings & Remote Mirroring */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRemotePairing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-colors ${
                isRemoteConnected
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900/80 text-white/90 border-white/15 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Remote Sync</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-white/15 backdrop-blur-md transition-colors"
              title="Prompter Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Floating Control Deck: Speed, Play/Pause, Mirror, Font Size */}
        <div className="flex flex-col gap-2 pointer-events-auto max-w-2xl mx-auto w-full">
          {/* Timeline / Progress Scrubber */}
          <div className="w-full flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-lg border border-white/10 shadow-2xl">
            <span className="text-[11px] font-mono text-white/70 w-8">{progressPercent}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progressPercent}
              onChange={(e) => {
                const pct = Number(e.target.value);
                setProgressPercent(pct);
                if (containerRef.current) {
                  const max = containerRef.current.scrollHeight - containerRef.current.clientHeight;
                  const target = (pct / 100) * max;
                  currentScrollRef.current = target;
                  containerRef.current.scrollTop = target;
                }
              }}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[11px] font-mono text-white/70">
              {formatTime(Math.max(0, totalEstimatedSecs - elapsedSecs))} left
            </span>
          </div>

          {/* Primary Quick Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-lg border border-white/15 shadow-2xl">
            {/* Speed Control Cluster */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-white/70 ml-1">Speed</span>
              <button
                onClick={() => onUpdateSettings({ speed: Math.max(1, settings.speed - 1) })}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Slower (Speed -1)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-mono text-sm font-bold text-cyan-400">
                {settings.speed}
              </span>
              <button
                onClick={() => onUpdateSettings({ speed: Math.min(20, settings.speed + 1) })}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Faster (Speed +1)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cue Jumper Controls */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={jumpToPrevCue}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white/80 flex items-center gap-1"
                title="Previous Cue Point"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Prev Cue</span>
              </button>
              <button
                onClick={jumpToNextCue}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white/80 flex items-center gap-1"
                title="Next Cue Point"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Next Cue</span>
              </button>
            </div>

            {/* Central Giant Play / Pause Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={restartScript}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 active:scale-95 transition-transform"
                title="Reset to Beginning (R)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg active:scale-95 transition-all ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start</span>
                  </>
                )}
              </button>
            </div>

            {/* Optical Mirroring Toggles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateSettings({ mirrorX: !settings.mirrorX })}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                  settings.mirrorX
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-white/10 border-transparent text-white/70 hover:bg-white/20'
                }`}
                title="Mirror Horizontal (X) for Glass Beam-Splitters"
              >
                <FlipHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Flip X</span>
              </button>

              <button
                onClick={() => onUpdateSettings({ mirrorY: !settings.mirrorY })}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                  settings.mirrorY
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-white/10 border-transparent text-white/70 hover:bg-white/20'
                }`}
                title="Mirror Vertical (Y)"
              >
                <FlipVertical className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Flip Y</span>
              </button>
            </div>

            {/* Font Size Quick Stepper */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateSettings({ fontSize: Math.max(18, settings.fontSize - 3) })}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Smaller Font"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono text-xs text-white/90 px-1">{settings.fontSize}px</span>
              <button
                onClick={() => onUpdateSettings({ fontSize: Math.min(84, settings.fontSize + 3) })}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Larger Font"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
