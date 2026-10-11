import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Copy, 
  Upload, 
  Download, 
  Clock, 
  FileText, 
  Bookmark, 
  Plus, 
  Search, 
  Check,
  Tag
} from 'lucide-react';
import { Script, PrompterSettings } from '../types/teleprompter';
import { triggerHaptic } from '../utils/audioHaptics';

interface ScriptEditorViewProps {
  script: Script | null;
  settings: PrompterSettings;
  onSave: (script: Script) => void;
  onDelete?: (scriptId: string) => void;
  onBack: () => void;
  onStartPrompterWithScript: (script: Script) => void;
}

export const ScriptEditorView: React.FC<ScriptEditorViewProps> = ({
  script,
  settings,
  onSave,
  onDelete,
  onBack,
  onStartPrompterWithScript,
}) => {
  const [title, setTitle] = useState(script?.title || 'Untitled Presentation');
  const [category, setCategory] = useState(script?.category || 'General');
  const [content, setContent] = useState(script?.content || '');
  const [tags, setTags] = useState<string[]>(script?.tags || ['Keynote']);
  const [tagInput, setTagInput] = useState('');
  const [searchInScript, setSearchInScript] = useState('');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if script prop changes
  useEffect(() => {
    if (script) {
      setTitle(script.title);
      setCategory(script.category);
      setContent(script.content);
      setTags(script.tags || []);
    }
  }, [script]);

  // Word count & character metrics
  const wordCount = useMemo(() => {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const charCount = useMemo(() => {
    return content.length;
  }, [content]);

  const estDurationSecs = useMemo(() => {
    const wpm = settings.targetWpm || 140;
    return Math.round((wordCount / wpm) * 60);
  }, [wordCount, settings.targetWpm]);

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const handleSave = () => {
    const updated: Script = {
      id: script?.id || `script-${Date.now()}`,
      title: title.trim() || 'Untitled Script',
      category: category.trim() || 'General',
      content,
      tags,
      createdAt: script?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    setIsSavedAlert(true);
    triggerHaptic(30);
    setTimeout(() => setIsSavedAlert(false), 2000);
  };

  const insertCueMarker = (label: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const insertText = `\n[[CUE: ${label.toUpperCase()}]]\n`;
    const newContent = content.substring(0, start) + insertText + content.substring(end);
    setContent(newContent);
    triggerHaptic(20);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 50);
  };

  const insertPauseMarker = (seconds: number = 2) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const insertText = ` [PAUSE ${seconds}s] `;
    const newContent = content.substring(0, start) + insertText + content.substring(end);
    setContent(newContent);
    triggerHaptic(20);
  };

  const handleImportTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setContent(text);
        if (!title || title === 'Untitled Presentation') {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
        triggerHaptic(40);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleExportTxt = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    triggerHaptic(25);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="flex-1 w-full bg-slate-950 flex flex-col overflow-y-auto select-none p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {script && onDelete && (
            <button
              onClick={() => onDelete(script.id)}
              className="p-2 rounded-xl bg-rose-950/60 text-rose-400 hover:bg-rose-900/60 border border-rose-800/40 text-xs"
              title="Delete Script"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleExportTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs text-slate-300"
            title="Export Plain Text TXT"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export TXT</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
          >
            {isSavedAlert ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSavedAlert ? 'Saved!' : 'Save Script'}</span>
          </button>
        </div>
      </div>

      {/* Title & Metadata Inputs */}
      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Script Title (e.g. Keynote or भाषण शीर्षक)"
          className="w-full text-2xl md:text-3xl font-black bg-transparent text-white border-b border-white/15 focus:border-cyan-400 focus:outline-none pb-2 placeholder-slate-600"
        />

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono">Category:</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Speech, YouTube, Lecture"
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-cyan-400 font-medium"
            />
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-slate-400 font-mono">
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{charCount} chars</span>
            <span>·</span>
            <span className="text-cyan-400">~{formatSecs(estDurationSecs)} read time</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-900 border border-white/10 px-2 py-0.5 rounded-md text-slate-300"
            >
              <span>#{t}</span>
              <button
                onClick={() => handleRemoveTag(t)}
                className="text-slate-500 hover:text-white ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="+ tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="text-[11px] font-mono bg-transparent border-b border-white/20 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 px-1 py-0.5"
          />
        </div>
      </div>

      {/* Editor Tool Strip (Cues, Pauses, TXT Import) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-white/10">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-mono mr-1">Insert:</span>
          <button
            onClick={() => insertCueMarker('Introduction')}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-semibold text-[11px]"
          >
            <Bookmark className="w-3 h-3" />
            <span>[[CUE]]</span>
          </button>
          <button
            onClick={() => insertPauseMarker(2)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold text-[11px]"
          >
            <Clock className="w-3 h-3" />
            <span>[PAUSE 2s]</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            onChange={handleImportTxt}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-white/10"
          >
            <Upload className="w-3 h-3" />
            <span>Import .TXT</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Lingual UTF-8 Textarea */}
      <div className="flex-1 min-h-[360px] flex flex-col">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste or write your presentation script here. Full UTF-8 support for Hindi (हिंदी), Sanskrit (संस्कृतम्), English, and all Unicode alphabets with paragraphs and punctuation preserved."
          className="w-full flex-1 min-h-[360px] p-5 rounded-2xl bg-black border border-white/15 text-white font-sans text-base leading-relaxed focus:outline-none focus:border-cyan-500/50 resize-y"
          style={{
            fontFamily: settings.fontFamily,
          }}
        />
      </div>

      {/* Bottom Start Teleprompter CTA */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={() => {
            const updated: Script = {
              id: script?.id || `script-${Date.now()}`,
              title: title.trim() || 'Untitled Script',
              category: category.trim() || 'General',
              content,
              tags,
              createdAt: script?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            onStartPrompterWithScript(updated);
          }}
          className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <span>Launch Teleprompter with this Script</span>
        </button>
      </div>
    </div>
  );
};
