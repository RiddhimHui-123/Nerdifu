import React, { useState } from 'react';
import { Highlight, Annotation, HighlightColor } from '../../types';
import { Highlighter, StickyNote, Trash2, Edit3, X, ArrowUpRight, Search } from 'lucide-react';

interface AnnotationsListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  highlights: Highlight[];
  annotations: Annotation[];
  currentPage: number;
  onJumpToPage: (page: number) => void;
  onDeleteHighlight: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateHighlightNote: (id: string, note: string) => void;
  onUpdateAnnotation: (id: string, content: string) => void;
}

export const AnnotationsListDrawer: React.FC<AnnotationsListDrawerProps> = ({
  isOpen,
  onClose,
  highlights,
  annotations,
  currentPage,
  onJumpToPage,
  onDeleteHighlight,
  onDeleteAnnotation,
  onUpdateHighlightNote,
  onUpdateAnnotation,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'highlights' | 'notes'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  if (!isOpen) return null;

  const colorBadge = (color: HighlightColor) => {
    const map = {
      yellow: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      green: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      pink: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      blue: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      purple: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    };
    return map[color] || map.yellow;
  };

  const filteredHighlights = highlights.filter(h => {
    if (filterTab === 'notes') return false;
    if (!searchQuery) return true;
    return h.text.toLowerCase().includes(searchQuery.toLowerCase()) || (h.note && h.note.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const filteredAnnotations = annotations.filter(a => {
    if (filterTab === 'highlights') return false;
    if (!searchQuery) return true;
    return a.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalCount = highlights.length + annotations.length;

  return (
    <div className="w-80 md:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shadow-lg z-30 animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Study Notebook</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {totalCount} saved annotations &amp; highlights
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close notes drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes or highlighted quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-lg">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
              filterTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterTab('highlights')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
              filterTab === 'highlights'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Highlights ({highlights.length})
          </button>
          <button
            onClick={() => setFilterTab('notes')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
              filterTab === 'notes'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sticky Notes ({annotations.length})
          </button>
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredHighlights.length === 0 && filteredAnnotations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Highlighter className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">No entries found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Select any text in the textbook to highlight or click anywhere on the page to drop a sticky note.
            </p>
          </div>
        ) : (
          <>
            {/* Highlights Section */}
            {filteredHighlights.map((hl) => (
              <div
                key={hl.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${colorBadge(hl.color)}`} />
                    <button
                      onClick={() => onJumpToPage(hl.page)}
                      className="font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5"
                    >
                      Page {hl.page}
                      <ArrowUpRight className="w-3 h-3 opacity-60" />
                    </button>
                    {currentPage === hl.page && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">· Active</span>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteHighlight(hl.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete highlight"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <blockquote className="pl-2 border-l-2 border-amber-400/80 dark:border-amber-500 text-slate-800 dark:text-slate-200 italic mb-2 leading-relaxed">
                  "{hl.text}"
                </blockquote>

                {/* Attached note */}
                {editingId === hl.id ? (
                  <div className="mt-2 space-y-1.5">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Add an active recall note or mnemonic..."
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      rows={2}
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onUpdateHighlightNote(hl.id, editContent);
                          setEditingId(null);
                        }}
                        className="px-2.5 py-0.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                ) : hl.note ? (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start justify-between gap-1 text-slate-600 dark:text-slate-300">
                    <p className="text-[11px] leading-relaxed flex-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Note: </span>
                      {hl.note}
                    </p>
                    <button
                      onClick={() => {
                        setEditingId(hl.id);
                        setEditContent(hl.note || '');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(hl.id);
                      setEditContent('');
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    + Add note to this highlight
                  </button>
                )}
              </div>
            ))}

            {/* Annotations Section */}
            {filteredAnnotations.map((ann) => (
              <div
                key={ann.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-800 transition-all text-xs group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                    <button
                      onClick={() => onJumpToPage(ann.page)}
                      className="font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5"
                    >
                      Page {ann.page} Sticky Note
                      <ArrowUpRight className="w-3 h-3 opacity-60" />
                    </button>
                  </div>
                  <button
                    onClick={() => onDeleteAnnotation(ann.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete annotation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {editingId === ann.id ? (
                  <div className="space-y-1.5">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onUpdateAnnotation(ann.id, editContent);
                          setEditingId(null);
                        }}
                        className="px-2.5 py-0.5 text-xs font-medium text-white bg-indigo-600 rounded"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-1 text-slate-700 dark:text-slate-200">
                    <p className="text-xs leading-relaxed flex-1 whitespace-pre-wrap">{ann.content}</p>
                    <button
                      onClick={() => {
                        setEditingId(ann.id);
                        setEditContent(ann.content);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
