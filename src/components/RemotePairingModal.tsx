import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  Smartphone, 
  Radio, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import { remoteSync } from '../services/remoteSync';
import { triggerHaptic } from '../utils/audioHaptics';

interface RemotePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRemoteMode: () => void;
}

export const RemotePairingModal: React.FC<RemotePairingModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRemoteMode,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const room = remoteSync.getRoomId();
      setRoomId(room);
      const url = remoteSync.getPairingUrl('remote');
      QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
        .then((dataUrl) => setQrCodeDataUrl(dataUrl))
        .catch((e) => console.error(e));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    const url = remoteSync.getPairingUrl('remote');
    navigator.clipboard.writeText(url);
    setCopied(true);
    triggerHaptic(20);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Pair Wireless Remote</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black border border-white/10 space-y-3">
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt="Pairing QR Code"
              className="w-44 h-44 rounded-xl bg-white p-2 shadow-xl"
            />
          ) : (
            <div className="w-44 h-44 rounded-xl bg-slate-900 animate-pulse" />
          )}
          <span className="text-xs font-mono text-cyan-400 font-bold">
            Room Code: {roomId}
          </span>
          <p className="text-[11px] text-slate-400 text-center max-w-xs">
            Open camera on any smartphone or tablet to control this prompter wirelessly.
          </p>
        </div>

        {/* Copy Link & Switch to Remote on this device */}
        <div className="space-y-3">
          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Remote Web Link'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onSwitchToRemoteMode();
            }}
            className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>Switch this Device to Pocket Remote Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
};
