import React from 'react';
import { HighlightColor } from '../../types';
import { Sparkles, MessageSquareQuote, Highlighter, StickyNote, HelpCircle, Check, Copy } from 'lucide-react';

interface PdfTextSelectionMenuProps {
  position: { top: number; left: number };
  selectedText: string;
  onHighlight: (color: HighlightColor) => void;
  onAskAI: (text: string) => void;
  onExplainSimply: (text: string) => void;
  onQuizMe: (text: string) => void;
  onAddStickyNote: (text: string) => void;
  onClose: () => void;
}

export const PdfTextSelectionMenu: React.FC<PdfTextSelectionMenuProps> = ({
  position,
  selectedText,
  onHighlight,
  onAskAI,
  onExplainSimply,
  onQuizMe,
  onAddStickyNote,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  const colors: Array<{ color: HighlightColor; hex: string; label: string }> = [
    { color: 'yellow', hex: 'bg-amber-300 dark:bg-amber-400', label: 'Yellow' },
    { color: 'green', hex: 'bg-emerald-300 dark:bg-emerald-400', label: 'Green' },
    { color: 'pink', hex: 'bg-rose-300 dark:bg-rose-400', label: 'Pink' },
    { color: 'blue', hex: 'bg-sky-300 dark:bg-sky-400', label: 'Blue' },
    { color: 'purple', hex: 'bg-purple-300 dark:bg-purple-400', label: 'Purple' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 800);
  };

  return (
    <div
      style={{
        top: `${Math.max(12, position.top - 52)}px`,
        left: `${Math.max(16, position.left)}px`,
      }}
      className="fixed z-50 flex items-center gap-1.5 p-1.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700/60 animate-in fade-in zoom-in-95 duration-150 transform -translate-x-1/2"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Highlight Color Pickers */}
      <div className="flex items-center gap-1 pr-1.5 border-r border-slate-700">
        <Highlighter className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
        {colors.map((c) => (
          <button
            key={c.color}
            title={`Highlight in ${c.label}`}
            onClick={() => onHighlight(c.color)}
            className={`w-4.5 h-4.5 rounded-full ${c.hex} transition-transform hover:scale-125 focus:ring-2 focus:ring-white/40`}
          />
        ))}
      </div>

      {/* Ask Nerdify AI button */}
      <button
        onClick={() => onAskAI(selectedText)}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-200 hover:text-white bg-amber-500/20 hover:bg-amber-500/40 rounded-lg transition-colors whitespace-nowrap"
        title="Send text to Ask Nerdify AI tutor panel"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Ask Nerdify</span>
      </button>

      {/* Explain Simply */}
      <button
        onClick={() => onExplainSimply(selectedText)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
        title="Explain using simple everyday analogies (Feynman mode)"
      >
        <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
        <span>Simplify</span>
      </button>

      {/* Quiz me */}
      <button
        onClick={() => onQuizMe(selectedText)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
        title="Generate test questions from this text using Quiz Buster"
      >
        <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-400" />
        <span>Quiz Buster</span>
      </button>

      {/* Sticky note */}
      <button
        onClick={() => onAddStickyNote(selectedText)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
        title="Attach a sticky note annotation"
      >
        <StickyNote className="w-3.5 h-3.5 text-rose-400" />
        <span>Note</span>
      </button>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="p-1 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
        title="Copy text"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
