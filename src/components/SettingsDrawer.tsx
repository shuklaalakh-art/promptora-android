import React from 'react';
import { 
  X, 
  FlipHorizontal, 
  FlipVertical, 
  Eye, 
  Type, 
  Volume2, 
  Sliders, 
  Palette, 
  Clock, 
  AlignLeft, 
  AlignCenter, 
  AlignRight 
} from 'lucide-react';
import { PrompterSettings, PrompterTheme, FontFamily, GuideStyle } from '../types/teleprompter';
import { PromptoraIcon } from './PromptoraLogo';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrompterSettings;
  onUpdateSettings: (settings: Partial<PrompterSettings>) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const themes: { id: PrompterTheme; label: string; bg: string; text: string }[] = [
    { id: 'studio-dark', label: 'Studio Dark', bg: 'bg-black', text: 'text-white' },
    { id: 'broadcast-green', label: 'Broadcast Green', bg: 'bg-black', text: 'text-[#00FF66]' },
    { id: 'warm-gold', label: 'Warm Gold', bg: 'bg-black', text: 'text-[#FFB703]' },
    { id: 'cyber-cyan', label: 'Cyber Cyan', bg: 'bg-black', text: 'text-[#00F0FF]' },
    { id: 'high-contrast-light', label: 'Daylight Paper', bg: 'bg-slate-100', text: 'text-slate-900' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end select-none">
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-white/10 flex flex-col justify-between overflow-y-auto p-6 space-y-6">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <PromptoraIcon size={30} />
            <div>
              <h3 className="text-base font-bold text-white">Promptora Settings</h3>
              <p className="text-[10px] text-slate-400 font-mono">Created by Alakh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Setting Groups */}
        <div className="space-y-6 flex-1">
          {/* Color & Contrast Themes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>Prompter Color Theme</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                    settings.theme === t.id
                      ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400'
                      : 'border-white/10 bg-slate-900 hover:border-white/20'
                  }`}
                >
                  <span className={t.text}>{t.label}</span>
                  <div className={`w-4 h-4 rounded-full ${t.bg} border border-white/20`} />
                </button>
              ))}
            </div>
          </div>

          {/* Typography Controls */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Type className="w-4 h-4 text-cyan-400" />
              <span>Typography & Margins</span>
            </div>

            {/* Font Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Font Size</span>
                <span className="font-mono text-cyan-400 font-bold">{settings.fontSize}px</span>
              </div>
              <input
                type="range"
                min="18"
                max="80"
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none"
              />
            </div>

            {/* Line Height */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Line Spacing</span>
                <span className="font-mono text-cyan-400 font-bold">{settings.lineHeight}x</span>
              </div>
              <input
                type="range"
                min="1.2"
                max="2.2"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => onUpdateSettings({ lineHeight: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none"
              />
            </div>

            {/* Text Margin (Eye travel restrictor) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Horizontal Margins (Eye Span Limiter)</span>
                <span className="font-mono text-cyan-400 font-bold">{settings.marginHorizontal}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                value={settings.marginHorizontal}
                onChange={(e) => onUpdateSettings({ marginHorizontal: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none"
              />
              <p className="text-[10px] text-slate-500">
                Higher margins keep text centered to eliminate eye movement across wide screens.
              </p>
            </div>

            {/* Text Alignment */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Text Alignment</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-white/10">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => onUpdateSettings({ textAlign: align })}
                    className={`p-1.5 rounded text-xs capitalize ${
                      settings.textAlign === align
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reading Guide Settings */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Reading Guide & Eye-Line</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Display Eye-Line Guide</span>
              <button
                onClick={() => onUpdateSettings({ showGuide: !settings.showGuide })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.showGuide ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.showGuide ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.showGuide && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Guide Vertical Position</span>
                  <span className="font-mono text-cyan-400 font-bold">{settings.guidePosition}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="85"
                  value={settings.guidePosition}
                  onChange={(e) => onUpdateSettings({ guidePosition: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded appearance-none"
                />
              </div>
            )}
          </div>

          {/* Optical Glass Mirroring */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <FlipHorizontal className="w-4 h-4 text-cyan-400" />
              <span>Optical Glass Mirroring</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateSettings({ mirrorX: !settings.mirrorX })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${
                  settings.mirrorX
                    ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                    : 'border-white/10 bg-slate-900 text-slate-400'
                }`}
              >
                <FlipHorizontal className="w-5 h-5" />
                <span>Flip X (Beam Splitter)</span>
              </button>

              <button
                onClick={() => onUpdateSettings({ mirrorY: !settings.mirrorY })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all ${
                  settings.mirrorY
                    ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                    : 'border-white/10 bg-slate-900 text-slate-400'
                }`}
              >
                <FlipVertical className="w-5 h-5" />
                <span>Flip Y (Ceiling Rig)</span>
              </button>
            </div>
          </div>

          {/* Countdown & Audio */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Countdown & Sound</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Start Countdown</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-white/10">
                {[0, 3, 5].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => onUpdateSettings({ countdownDuration: sec })}
                    className={`px-2.5 py-1 rounded text-xs ${
                      settings.countdownDuration === sec
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec === 0 ? 'Off' : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Countdown Audio Tones</span>
              <button
                onClick={() => onUpdateSettings({ audioCountdown: !settings.audioCountdown })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.audioCountdown ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.audioCountdown ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm"
          >
            Save & Return to Prompter
          </button>
          <div className="text-center text-[11px] text-slate-500 font-mono">
            Promptora v1.0 · Created by Alakh
          </div>
        </div>
      </div>
    </div>
  );
};
