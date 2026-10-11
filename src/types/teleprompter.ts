export type PrompterTheme = 
  | 'studio-dark'       // Pure black #000, white text
  | 'broadcast-green'   // Pure black #000, green text #00FF66
  | 'warm-gold'         // Pure black #000, gold amber #FFB703
  | 'cyber-cyan'        // Pure black #000, cyan text #00F0FF
  | 'high-contrast-light'; // Clean white #FFF, black text #000

export type FontFamily = 
  | 'Plus Jakarta Sans'
  | 'JetBrains Mono'
  | 'Oswald'
  | 'system-ui';

export type GuideStyle = 'line' | 'band' | 'arrows';

export interface PrompterSettings {
  // Speed & Scrolling
  speed: number;              // 1 to 20
  autoRestart: boolean;
  countdownDuration: number;  // 0, 3, 5, 10
  audioCountdown: boolean;

  // Typography & Layout
  fontSize: number;           // 18px to 80px
  lineHeight: number;         // 1.2 to 2.2
  letterSpacing: number;      // -1 to 4px
  marginHorizontal: number;   // 0% to 40% (eye span limiter)
  textAlign: 'left' | 'center' | 'right';
  fontFamily: FontFamily;
  theme: PrompterTheme;
  isBold: boolean;

  // Mirroring
  mirrorX: boolean;           // Optical flip horizontal (70/30 beam splitter glass)
  mirrorY: boolean;           // Optical flip vertical (periscope / ceiling)
  externalMirrorX: boolean;   // Mirror only on external monitor
  externalMirrorY: boolean;

  // Reading Guide
  showGuide: boolean;
  guidePosition: number;      // 15% to 85% from top
  guideStyle: GuideStyle;

  // Pacing
  showWpmCounter: boolean;
  targetWpm: number;          // e.g. 130
  showAndroidFrame: boolean;
  hapticFeedback: boolean;

  // Camera Overlay
  overlayOpacity: number;     // 30% to 100%
  cameraFacing: 'user' | 'environment';
  videoResolution: '1080p' | '720p' | '4k';
  volumeKeyControl: boolean;
}

export interface CuePoint {
  id: string;
  label: string;
  lineIndex: number;
}

export interface Script {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  cuePoints?: CuePoint[];
  lastReadPosition?: number;
}

export interface VideoRecording {
  id: string;
  title: string;
  scriptId?: string;
  scriptTitle?: string;
  blobUrl: string;
  sizeBytes: number;
  durationSecs: number;
  createdAt: string;
  resolution: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  scrollPosition: number;      // in pixels
  scrollProgress: number;      // 0 to 100 percentage
  maxScroll: number;           // in pixels
  isCountingDown: boolean;
  countdownSeconds: number;
  currentWpm: number;
  elapsedSeconds: number;
  totalWords: number;
  estimatedRemainingSeconds: number;
  activeLineText: string;
}

export type RemoteCommandType = 
  | 'PLAY'
  | 'PAUSE'
  | 'TOGGLE_PLAY'
  | 'SET_SPEED'
  | 'SPEED_UP'
  | 'SPEED_DOWN'
  | 'SET_FONT_SIZE'
  | 'FONT_UP'
  | 'FONT_DOWN'
  | 'SEEK'
  | 'RESTART'
  | 'JUMP_FORWARD'
  | 'JUMP_BACKWARD'
  | 'TOGGLE_MIRROR_X'
  | 'TOGGLE_MIRROR_Y'
  | 'SET_SCRIPT'
  | 'NEXT_CUE'
  | 'PREV_CUE'
  | 'SET_MARGIN'
  | 'SET_THEME';

export interface RemoteSyncMessage {
  type: 'COMMAND' | 'STATE_SYNC' | 'SETTINGS_SYNC' | 'HEARTBEAT';
  sender: 'PROMPTER' | 'REMOTE';
  roomId: string;
  timestamp: number;
  command?: RemoteCommandType;
  payload?: any;
  state?: Partial<PlaybackState>;
  settings?: Partial<PrompterSettings>;
  script?: Script;
}

export type ActiveScreen = 
  | 'dashboard'
  | 'prompter'
  | 'camera-record'
  | 'external-display'
  | 'scripts-list'
  | 'script-editor'
  | 'recordings-list'
  | 'remote-setup'
  | 'settings';
