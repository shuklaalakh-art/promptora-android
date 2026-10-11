import React, { useState, useEffect, useCallback } from 'react';
import { 
  Script, 
  PrompterSettings, 
  VideoRecording, 
  ActiveScreen 
} from './types/teleprompter';
import { SAMPLE_SCRIPTS } from './data/sampleScripts';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { AndroidNavBar } from './components/AndroidNavBar';
import { DashboardView } from './components/DashboardView';
import { TeleprompterCanvas } from './components/TeleprompterCanvas';
import { CameraRecorderView } from './components/CameraRecorderView';
import { ExternalDisplayView } from './components/ExternalDisplayView';
import { RemoteControlSetupView } from './components/RemoteControlSetupView';
import { ScriptEditorView } from './components/ScriptEditorView';
import { ScriptsListModal } from './components/ScriptsListModal';
import { MyRecordingsView } from './components/MyRecordingsView';
import { SettingsDrawer } from './components/SettingsDrawer';
import { RemotePairingModal } from './components/RemotePairingModal';
import { PocketRemoteController } from './components/PocketRemoteController';
import { remoteSync } from './services/remoteSync';

const DEFAULT_SETTINGS: PrompterSettings = {
  speed: 5,
  autoRestart: false,
  countdownDuration: 3,
  audioCountdown: true,
  fontSize: 38,
  lineHeight: 1.6,
  letterSpacing: 0,
  marginHorizontal: 16,
  textAlign: 'center',
  fontFamily: 'Plus Jakarta Sans',
  theme: 'studio-dark',
  isBold: false,
  mirrorX: false,
  mirrorY: false,
  externalMirrorX: true,
  externalMirrorY: false,
  showGuide: true,
  guidePosition: 35,
  guideStyle: 'line',
  showWpmCounter: true,
  targetWpm: 135,
  showAndroidFrame: true,
  hapticFeedback: true,
  overlayOpacity: 85,
  cameraFacing: 'user',
  videoResolution: '1080p',
  volumeKeyControl: true,
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('dashboard');
  const [scripts, setScripts] = useState<Script[]>(() => {
    const saved = localStorage.getItem('proprompt_scripts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return SAMPLE_SCRIPTS;
  });

  const [activeScript, setActiveScript] = useState<Script>(() => {
    const savedId = localStorage.getItem('proprompt_active_script_id');
    if (savedId) {
      const found = scripts.find((s) => s.id === savedId);
      if (found) return found;
    }
    return scripts[0] || SAMPLE_SCRIPTS[0];
  });

  const [settings, setSettings] = useState<PrompterSettings>(() => {
    const saved = localStorage.getItem('proprompt_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [recordings, setRecordings] = useState<VideoRecording[]>(() => {
    const saved = localStorage.getItem('proprompt_recordings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScriptsModalOpen, setIsScriptsModalOpen] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [isRemoteModeActive, setIsRemoteModeActive] = useState<boolean>(false);

  // Check URL params for ?mode=remote (when opened via smartphone QR code)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'remote') {
      setIsRemoteModeActive(true);
    }
  }, []);

  // Save scripts, settings, recordings
  useEffect(() => {
    localStorage.setItem('proprompt_scripts', JSON.stringify(scripts));
  }, [scripts]);

  useEffect(() => {
    localStorage.setItem('proprompt_active_script_id', activeScript.id);
    remoteSync.broadcastScript(activeScript);
  }, [activeScript]);

  useEffect(() => {
    localStorage.setItem('proprompt_settings', JSON.stringify(settings));
    remoteSync.broadcastSettings(settings);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('proprompt_recordings', JSON.stringify(recordings));
  }, [recordings]);

  const updateSettings = useCallback((partial: Partial<PrompterSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSelectScript = useCallback((s: Script) => {
    setActiveScript(s);
  }, []);

  const handleSaveScript = useCallback((updated: Script) => {
    setScripts((prev) => {
      const idx = prev.findIndex((s) => s.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
    setActiveScript(updated);
  }, []);

  const handleDeleteScript = useCallback((id: string) => {
    setScripts((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length > 0 && activeScript.id === id) {
        setActiveScript(filtered[0]);
      }
      return filtered;
    });
    if (currentScreen === 'script-editor') {
      setCurrentScreen('dashboard');
    }
  }, [activeScript.id, currentScreen]);

  const handleDuplicateScript = useCallback((source: Script) => {
    const copy: Script = {
      ...source,
      id: `script-${Date.now()}`,
      title: `${source.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setScripts((prev) => [copy, ...prev]);
    setActiveScript(copy);
  }, []);

  const handleSaveRecording = useCallback((rec: VideoRecording) => {
    setRecordings((prev) => [rec, ...prev]);
  }, []);

  const handleDeleteRecording = useCallback((id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // If opened directly in Pocket Remote mode
  if (isRemoteModeActive) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col overflow-hidden">
        <AndroidStatusBar />
        <PocketRemoteController
          activeScript={activeScript}
          onBack={() => setIsRemoteModeActive(false)}
        />
        <AndroidNavBar
          isPlaying={false}
          onTogglePlay={() => {}}
          onRestart={() => {}}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          showGestureBar
        />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Android System Status Bar (With camera notch & live telemetry) */}
      <AndroidStatusBar
        isMirroredX={settings.mirrorX}
        isMirroredY={settings.mirrorY}
        isRemoteConnected={remoteSync.isPeerConnected()}
        isPlaying={currentScreen === 'prompter'}
      />

      {/* Main Viewport Router */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
        {currentScreen === 'dashboard' && (
          <DashboardView
            scripts={scripts}
            recordings={recordings}
            settings={settings}
            activeScript={activeScript}
            onSelectScript={handleSelectScript}
            onNavigate={setCurrentScreen}
            onQuickStart={() => setCurrentScreen('prompter')}
          />
        )}

        {currentScreen === 'prompter' && (
          <div className="relative w-full h-full flex flex-col">
            <TeleprompterCanvas
              script={activeScript}
              settings={settings}
              onUpdateSettings={updateSettings}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenScriptManager={() => setIsScriptsModalOpen(true)}
              onOpenRemotePairing={() => setIsPairingModalOpen(true)}
              isRemoteConnected={remoteSync.isPeerConnected()}
            />
          </div>
        )}

        {currentScreen === 'camera-record' && (
          <CameraRecorderView
            script={activeScript}
            settings={settings}
            onUpdateSettings={updateSettings}
            onBack={() => setCurrentScreen('dashboard')}
            onSaveRecording={handleSaveRecording}
          />
        )}

        {currentScreen === 'external-display' && (
          <ExternalDisplayView
            script={activeScript}
            settings={settings}
            onUpdateSettings={updateSettings}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'remote-setup' && (
          <RemoteControlSetupView
            settings={settings}
            onUpdateSettings={updateSettings}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'script-editor' && (
          <ScriptEditorView
            script={editingScript || activeScript}
            settings={settings}
            onSave={(saved) => {
              handleSaveScript(saved);
              setEditingScript(null);
            }}
            onDelete={handleDeleteScript}
            onBack={() => {
              setEditingScript(null);
              setCurrentScreen('dashboard');
            }}
            onStartPrompterWithScript={(s) => {
              handleSaveScript(s);
              setCurrentScreen('prompter');
            }}
          />
        )}

        {currentScreen === 'scripts-list' && (
          <div className="flex-1 w-full flex flex-col">
            <ScriptsListModal
              scripts={scripts}
              activeScriptId={activeScript.id}
              onSelectScript={(s) => {
                setActiveScript(s);
                setCurrentScreen('prompter');
              }}
              onEditScript={(s) => {
                setEditingScript(s);
                setCurrentScreen('script-editor');
              }}
              onNewScript={() => {
                setEditingScript(null);
                setCurrentScreen('script-editor');
              }}
              onDeleteScript={handleDeleteScript}
              onDuplicateScript={handleDuplicateScript}
              onClose={() => setCurrentScreen('dashboard')}
            />
          </div>
        )}

        {currentScreen === 'recordings-list' && (
          <MyRecordingsView
            recordings={recordings}
            onDeleteRecording={handleDeleteRecording}
            onBack={() => setCurrentScreen('dashboard')}
            onRecordNew={() => setCurrentScreen('camera-record')}
          />
        )}
      </div>

      {/* Android System Navigation Bar (Bottom 3-buttons / gesture bar) */}
      <AndroidNavBar
        isPlaying={false}
        onTogglePlay={() => {
          if (currentScreen !== 'prompter') {
            setCurrentScreen('prompter');
          }
        }}
        onRestart={() => {
          if (currentScreen !== 'dashboard') {
            setCurrentScreen('dashboard');
          }
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Global Modals & Drawers */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      <RemotePairingModal
        isOpen={isPairingModalOpen}
        onClose={() => setIsPairingModalOpen(false)}
        onSwitchToRemoteMode={() => setIsRemoteModeActive(true)}
      />

      {isScriptsModalOpen && (
        <ScriptsListModal
          scripts={scripts}
          activeScriptId={activeScript.id}
          onSelectScript={(s) => {
            setActiveScript(s);
            setIsScriptsModalOpen(false);
          }}
          onEditScript={(s) => {
            setEditingScript(s);
            setIsScriptsModalOpen(false);
            setCurrentScreen('script-editor');
          }}
          onNewScript={() => {
            setEditingScript(null);
            setIsScriptsModalOpen(false);
            setCurrentScreen('script-editor');
          }}
          onDeleteScript={handleDeleteScript}
          onDuplicateScript={handleDuplicateScript}
          onClose={() => setIsScriptsModalOpen(false)}
        />
      )}
    </div>
  );
}
