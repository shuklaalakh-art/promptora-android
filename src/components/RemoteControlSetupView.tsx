import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  ArrowLeft, 
  Volume2, 
  Keyboard, 
  Radio, 
  CheckCircle2, 
  QrCode, 
  Copy, 
  Check, 
  Sliders, 
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import QRCode from 'qrcode';
import { PrompterSettings } from '../types/teleprompter';
import { remoteSync } from '../services/remoteSync';
import { triggerHaptic } from '../utils/audioHaptics';

interface RemoteControlSetupViewProps {
  settings: PrompterSettings;
  onUpdateSettings: (settings: Partial<PrompterSettings>) => void;
  onBack: () => void;
}

export const RemoteControlSetupView: React.FC<RemoteControlSetupViewProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);
  const [lastActionTriggered, setLastActionTriggered] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');

  useEffect(() => {
    const room = remoteSync.getRoomId();
    setRoomId(room);

    const pairingUrl = remoteSync.getPairingUrl('remote');
    QRCode.toDataURL(pairingUrl, { width: 220, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then((url) => setQrCodeDataUrl(url))
      .catch((e) => console.error('QR code error', e));
  }, []);

  // Button Tester & Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setLastKeyPressed(e.code || e.key);
      let action = 'Unbound Key';

      if (e.code === 'Space') action = 'Toggle Play/Pause';
      else if (e.code === 'ArrowUp' || e.code === 'PageUp') action = 'Increase Speed (+1)';
      else if (e.code === 'ArrowDown' || e.code === 'PageDown') action = 'Decrease Speed (-1)';
      else if (e.code === 'ArrowLeft') action = 'Jump Backward 5s';
      else if (e.code === 'ArrowRight') action = 'Jump Forward 5s';
      else if (e.key.toLowerCase() === 'r') action = 'Restart to Top';
      else if (e.key.toLowerCase() === 'm') action = 'Toggle Optical Mirror X';
      else if (e.key.toLowerCase() === 'v') action = 'Toggle Optical Mirror Y';
      else if (e.key === 'AudioVolumeUp') action = 'Volume Up (Speed +1)';
      else if (e.key === 'AudioVolumeDown') action = 'Volume Down (Pause / Slower)';

      setLastActionTriggered(action);
      triggerHaptic(15);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopyLink = () => {
    const pairingUrl = remoteSync.getPairingUrl('remote');
    navigator.clipboard.writeText(pairingUrl);
    setCopiedLink(true);
    triggerHaptic(25);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="flex-1 w-full bg-slate-950 flex flex-col overflow-y-auto select-none p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800 px-2.5 py-1 rounded-full">
          <span>Room Code: {roomId}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-cyan-400" />
          <span>Remote Control & Hardware Input Setup</span>
        </h2>
        <p className="text-xs text-slate-400">
          Control your teleprompter using Bluetooth presentation clickers, keyboards, volume keys, or a secondary smartphone.
        </p>
      </div>

      {/* Grid: Option 1 - Bluetooth HID Clicker & Keyboard | Option 2 - Dual Device Phone Remote */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Bluetooth HID Clickers & Key Tester */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Keyboard className="w-5 h-5 text-emerald-400" />
              <span>Bluetooth HID Clicker & Keyboard</span>
            </div>
            <p className="text-xs text-slate-400">
              Standard presentation clickers (Logitech R400/R800, Satechi, Baseus) send standard keyboard signals (PageUp, PageDown, Space, Enter).
            </p>

            {/* Live Key Tester Display */}
            <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                Hardware Input Monitor
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-mono text-cyan-300 font-bold">
                    {lastKeyPressed ? `Key: ${lastKeyPressed}` : 'Press any key on clicker...'}
                  </div>
                  <div className="text-xs text-emerald-400 font-medium mt-0.5">
                    {lastActionTriggered || 'Awaiting input test'}
                  </div>
                </div>
                {lastKeyPressed && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
              </div>
            </div>

            {/* Volume Key Opt-In Toggle */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">Hardware Volume Keys Control</h4>
                <p className="text-[10px] text-slate-400">
                  Use Vol+ to speed up, Vol- to pause or slow down
                </p>
              </div>
              <button
                onClick={() =>
                  onUpdateSettings({ volumeKeyControl: !settings.volumeKeyControl })
                }
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.volumeKeyControl ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.volumeKeyControl ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 space-y-1">
            <div>• Space / Enter: Start & Pause</div>
            <div>• Up / Down / PageUp / PageDn: Speed +/-</div>
            <div>• Left / Right: Jump 5 seconds</div>
            <div>• 'M' key: Toggle beam-splitter mirror</div>
          </div>
        </div>

        {/* Card 2: Phone-as-Remote via QR Code Pairing */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Radio className="w-5 h-5 text-cyan-400" />
              <span>Use Smartphone as Pocket Remote</span>
            </div>
            <p className="text-xs text-slate-400">
              Scan this QR code with any smartphone camera to open the Pocket Remote deck and control this screen wirelessly in real-time.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-black border border-white/10">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Pairing QR Code"
                  className="w-32 h-32 rounded-xl bg-white p-2 shrink-0 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-slate-800 animate-pulse shrink-0" />
              )}
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[11px] font-mono text-slate-400">Scan to Pair Instantly</span>
                <p className="text-xs text-slate-300">
                  Connects via room <strong>{roomId}</strong> with zero pairing codes or account logins needed.
                </p>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Pairing Link'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Dual-device state sync is active and listening for remote inputs.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
