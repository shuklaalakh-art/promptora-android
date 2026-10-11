import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Video, 
  Square, 
  RotateCcw, 
  SwitchCamera, 
  Mic, 
  Volume2, 
  Sliders, 
  ArrowLeft, 
  Play, 
  Pause, 
  Eye, 
  Minus, 
  Plus, 
  Download, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Script, PrompterSettings, VideoRecording } from '../types/teleprompter';
import { playCountdownTone, triggerHaptic } from '../utils/audioHaptics';

interface CameraRecorderViewProps {
  script: Script;
  settings: PrompterSettings;
  onUpdateSettings: (settings: Partial<PrompterSettings>) => void;
  onBack: () => void;
  onSaveRecording: (recording: VideoRecording) => void;
}

export const CameraRecorderView: React.FC<CameraRecorderViewProps> = ({
  script,
  settings,
  onUpdateSettings,
  onBack,
  onSaveRecording,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const prompterContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number | null>(null);
  const currentScrollRef = useRef<number>(0);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isPrompterPlaying, setIsPrompterPlaying] = useState<boolean>(false);
  const [prompterOpacity, setPrompterOpacity] = useState<number>(85);
  const [overlayPosition, setOverlayPosition] = useState<'top' | 'center' | 'bottom'>('top');
  const [recentSavedVideo, setRecentSavedVideo] = useState<VideoRecording | null>(null);

  // Initialize Camera & Microphone Stream
  const initCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);

      // Setup Web Audio Analyser for microphone VU meter
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const checkAudio = () => {
          if (analyserRef.current) {
            const data = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const avg = sum / data.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          }
          animFrameRef.current = requestAnimationFrame(checkAudio);
        };
        animFrameRef.current = requestAnimationFrame(checkAudio);
      } catch {
        // audio analyzer fallback
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera or microphone permission was denied. Please allow permissions in your browser.'
          : 'Unable to access camera. Check if another app is using the webcam.'
      );
      setIsCameraActive(false);
    }
  }, []);

  useEffect(() => {
    initCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [facingMode, initCamera]);

  // Duration Timer for Recording
  useEffect(() => {
    let interval: number | null = null;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Teleprompter Scrolling loop inside camera view
  useEffect(() => {
    const scrollStep = (timestamp: number) => {
      if (!lastScrollTimeRef.current) {
        lastScrollTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastScrollTimeRef.current) / 1000;
      lastScrollTimeRef.current = timestamp;

      if (isPrompterPlaying && prompterContainerRef.current) {
        const container = prompterContainerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 0) {
          const pxPerSecond = 18 + Math.pow(settings.speed, 1.8) * 1.7;
          currentScrollRef.current += pxPerSecond * delta;
          if (currentScrollRef.current >= maxScroll) {
            currentScrollRef.current = maxScroll;
            container.scrollTop = maxScroll;
            setIsPrompterPlaying(false);
          } else {
            container.scrollTop = currentScrollRef.current;
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
  }, [isPrompterPlaying, settings.speed]);

  // Start Video Recording with 3-2-1 countdown
  const startRecordingFlow = () => {
    setIsCountingDown(true);
    setCountdownNum(3);
    playCountdownTone(false);
    triggerHaptic(40);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        playCountdownTone(false);
        triggerHaptic(30);
      } else {
        clearInterval(interval);
        setIsCountingDown(false);
        playCountdownTone(true);
        triggerHaptic([60, 40, 60]);
        startMediaRecording();
      }
    }, 1000);
  };

  const startMediaRecording = () => {
    if (!streamRef.current) return;
    try {
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let recorder: MediaRecorder;
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        recorder = new MediaRecorder(streamRef.current, options);
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/mp4' });
      } else {
        recorder = new MediaRecorder(streamRef.current);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
        const blobUrl = URL.createObjectURL(blob);
        const newRecording: VideoRecording = {
          id: `rec-${Date.now()}`,
          title: `Take ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${script.title}`,
          scriptId: script.id,
          scriptTitle: script.title,
          blobUrl,
          sizeBytes: blob.size,
          durationSecs: recordingDuration || 1,
          createdAt: new Date().toISOString(),
          resolution: '1080p',
        };
        onSaveRecording(newRecording);
        setRecentSavedVideo(newRecording);
      };

      recorder.start(1000); // 1s slice
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPrompterPlaying(true); // Auto-start teleprompter with recording
    } catch (e) {
      console.error('Failed to start MediaRecorder:', e);
    }
  };

  const stopMediaRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPrompterPlaying(false);
      triggerHaptic([50, 50]);
    }
  };

  const toggleCameraFacing = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
  };

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col select-none overflow-hidden">
      {/* Top Android App Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 h-14 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white text-xs border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        {/* Recording Status Pill */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/90 text-white text-xs font-mono font-bold animate-pulse shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <span>REC {formatSecs(recordingDuration)}</span>
          </div>
        )}

        {/* Audio Input Level Meter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white">
          <Mic className="w-3.5 h-3.5 text-cyan-400" />
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-75 ${
                audioLevel > 70 ? 'bg-rose-500' : audioLevel > 40 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Camera Video Viewport */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-md space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-cyan-400">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Camera Permission Needed</h3>
            <p className="text-xs text-slate-400">
              {cameraError || 'Promptora requires access to your front/rear camera and microphone to record video while prompting.'}
            </p>
            <button
              onClick={() => initCamera(facingMode)}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              Enable Camera & Mic
            </button>
          </div>
        )}

        {/* =========================================================================
            TRANSPARENT FLOATING TELEPROMPTER OVERLAY DIRECTLY OVER CAMERA LENS
           ========================================================================= */}
        <div
          className={`absolute left-4 right-4 z-30 transition-all pointer-events-auto ${
            overlayPosition === 'top'
              ? 'top-16 max-h-[38vh]'
              : overlayPosition === 'center'
              ? 'top-1/4 max-h-[45vh]'
              : 'bottom-24 max-h-[40vh]'
          }`}
        >
          <div
            className="rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${prompterOpacity / 100})`,
            }}
          >
            {/* Prompter Window Header */}
            <div className="h-8 px-3 bg-white/10 flex items-center justify-between text-[11px] text-white/80 border-b border-white/10">
              <span className="font-semibold truncate max-w-[180px]">{script.title}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-300">{settings.speed}x speed</span>
                <button
                  onClick={() =>
                    setOverlayPosition((prev) =>
                      prev === 'top' ? 'center' : prev === 'center' ? 'bottom' : 'top'
                    )
                  }
                  className="px-1.5 py-0.5 rounded bg-white/10 text-[10px]"
                  title="Cycle Prompter Position"
                >
                  Pos: {overlayPosition}
                </button>
              </div>
            </div>

            {/* Scrolling Prompter Text */}
            <div
              ref={prompterContainerRef}
              onClick={() => setIsPrompterPlaying(!isPrompterPlaying)}
              className="p-4 overflow-y-auto no-scrollbar max-h-56 cursor-pointer"
              style={{
                fontSize: `${Math.min(32, Math.max(16, settings.fontSize - 6))}px`,
                lineHeight: 1.5,
                color: settings.theme === 'broadcast-green' ? '#00FF66' : '#FFFFFF',
              }}
            >
              <div className="space-y-4">
                {script.content.split('\n').map((line, i) => (
                  <p key={i} className="leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Countdown Overlay */}
        {isCountingDown && (
          <div className="absolute inset-0 z-50 bg-black/75 flex flex-col items-center justify-center">
            <span className="text-9xl font-black font-mono text-cyan-400 animate-pulse">
              {countdownNum}
            </span>
            <span className="text-sm font-semibold tracking-wider text-white uppercase mt-4">
              Recording in progress...
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
          BOTTOM CAMERA CONTROLS & HUD
         ========================================================================= */}
      <div className="relative z-40 bg-slate-950/95 border-t border-white/10 px-4 py-3 flex flex-col gap-3">
        {/* Quick Prompter Controls: Speed, Opacity, Font */}
        <div className="flex items-center justify-between gap-4 text-xs text-white/80">
          <div className="flex items-center gap-2">
            <span>Speed</span>
            <button
              onClick={() => onUpdateSettings({ speed: Math.max(1, settings.speed - 1) })}
              className="w-6 h-6 rounded bg-white/10 flex items-center justify-center"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono text-cyan-400 font-bold">{settings.speed}</span>
            <button
              onClick={() => onUpdateSettings({ speed: Math.min(20, settings.speed + 1) })}
              className="w-6 h-6 rounded bg-white/10 flex items-center justify-center"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>Opacity</span>
            <input
              type="range"
              min="30"
              max="100"
              value={prompterOpacity}
              onChange={(e) => setPrompterOpacity(Number(e.target.value))}
              className="w-20 h-1 bg-white/20 rounded appearance-none"
            />
            <span className="font-mono text-[11px]">{prompterOpacity}%</span>
          </div>

          <button
            onClick={toggleCameraFacing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch</span>
          </button>
        </div>

        {/* Primary Record Button Deck */}
        <div className="flex items-center justify-center gap-6">
          {/* Play/Pause Prompter */}
          <button
            onClick={() => setIsPrompterPlaying(!isPrompterPlaying)}
            className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
            title="Play/Pause Prompter"
          >
            {isPrompterPlaying ? <Pause className="w-5 h-5 text-amber-400" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Giant CameraX Record Button */}
          {isRecording ? (
            <button
              onClick={stopMediaRecording}
              className="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-all"
              title="Stop Recording"
            >
              <Square className="w-6 h-6 fill-white text-white" />
            </button>
          ) : (
            <button
              onClick={startRecordingFlow}
              className="w-16 h-16 rounded-full bg-rose-500 border-4 border-white flex items-center justify-center shadow-lg shadow-rose-500/40 active:scale-95 transition-all"
              title="Start Recording"
            >
              <div className="w-6 h-6 rounded-full bg-white" />
            </button>
          )}

          {/* Reset Position */}
          <button
            onClick={() => {
              if (prompterContainerRef.current) {
                prompterContainerRef.current.scrollTop = 0;
                currentScrollRef.current = 0;
              }
              setIsPrompterPlaying(false);
            }}
            className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
            title="Reset Script"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Saved Recording Notification Modal */}
      {recentSavedVideo && (
        <div className="absolute bottom-24 left-4 right-4 z-50 bg-slate-900 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white">Recording Saved Successfully!</h4>
              <p className="text-[11px] text-slate-300 font-mono">
                {recentSavedVideo.title} ({formatSecs(recentSavedVideo.durationSecs)})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={recentSavedVideo.blobUrl}
              download={`${recentSavedVideo.title.replace(/[^a-zA-Z0-9]/g, '_')}.webm`}
              className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              onClick={() => setRecentSavedVideo(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
