import React, { useState, useRef, useEffect } from 'react';
import { StudyDocument, Highlight, Annotation, HighlightColor, Subject } from '../../types';
import { PdfTextSelectionMenu } from './PdfTextSelectionMenu';
import { AnnotationsListDrawer } from './AnnotationsListDrawer';
import { NativePdfCanvasViewer } from './NativePdfCanvasViewer';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Bookmark,
  Search,
  BookOpen,
  Upload,
  Highlighter,
  Sparkles,
  HelpCircle,
  FileText,
  Pin,
  X,
  CheckCircle2,
  Share2,
  Users,
  Download,
  ExternalLink,
  Eye,
  LayoutTemplate,
} from 'lucide-react';

interface PdfViewerProps {
  document: StudyDocument;
  subject: Subject;
  currentPage: number;
  onPageChange: (page: number) => void;
  highlights: Highlight[];
  annotations: Annotation[];
  onAddHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt'>) => void;
  onDeleteHighlight: (id: string) => void;
  onUpdateHighlightNote: (id: string, note: string) => void;
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, content: string) => void;
  onAskAI: (selectedText: string, pageNum: number) => void;
  onTriggerQuiz: (topic: string, pageRange: string, textSnippet?: string) => void;
  onUploadCustomPdf: (file: File) => void;
  onToggleBookmark: (page: number) => void;
  onShareViewWithGroup?: () => void;
  isGroupConnected?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  document,
  subject,
  currentPage,
  onPageChange,
  highlights,
  annotations,
  onAddHighlight,
  onDeleteHighlight,
  onUpdateHighlightNote,
  onAddAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotation,
  onAskAI,
  onTriggerQuiz,
  onUploadCustomPdf,
  onToggleBookmark,
  onShareViewWithGroup,
  isGroupConnected,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);

  // View Mode: 'actual_pdf' (Native browser PDF embed) or 'studio' (Interactive highlighting canvas)
  const [viewMode, setViewMode] = useState<'actual_pdf' | 'studio'>(() => {
    return document.fileDataUrl ? 'actual_pdf' : 'studio';
  });

  useEffect(() => {
    if (document.fileDataUrl) {
      setViewMode('actual_pdf');
    }
  }, [document.id, document.fileDataUrl]);

  // Selection popup state
  const [selectionMenu, setSelectionMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
  }>({ visible: false, x: 0, y: 0, text: '' });

  // Quick Explain Modal state
  const [quickExplainModal, setQuickExplainModal] = useState<{
    isOpen: boolean;
    text: string;
    loading: boolean;
    explanation: string;
  }>({ isOpen: false, text: '', loading: false, explanation: '' });

  // Adding sticky note modal state
  const [pendingStickyNote, setPendingStickyNote] = useState<{
    x: number;
    y: number;
    textExcerpt?: string;
  } | null>(null);
  const [stickyNoteInput, setStickyNoteInput] = useState('');

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePageData = document.pages.find((p) => p.pageNumber === currentPage) || document.pages[0];
  const isBookmarked = document.bookmarks.includes(currentPage);

  // Filter highlights and annotations for the active page
  const pageHighlights = highlights.filter((h) => h.docId === document.id && h.page === currentPage);
  const pageAnnotations = annotations.filter((a) => a.docId === document.id && a.page === currentPage);

  // Handle text selection on the page
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionMenu((prev) => ({ ...prev, visible: false }));
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 2) {
      setSelectionMenu((prev) => ({ ...prev, visible: false }));
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectionMenu({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top,
      text,
    });
  };

  // Close selection menu on clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.pdf-selection-menu')) return;
      // Do not clear immediately on mouseup because handleMouseUp will run
    };
    window.addEventListener('mousedown', handleDocumentClick);
    return () => window.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const handleApplyHighlight = (color: HighlightColor) => {
    if (!selectionMenu.text) return;
    onAddHighlight({
      docId: document.id,
      page: currentPage,
      text: selectionMenu.text,
      color,
    });
    setSelectionMenu((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  };

  const handleExplainSimply = async (text: string) => {
    setSelectionMenu((prev) => ({ ...prev, visible: false }));
    setQuickExplainModal({
      isOpen: true,
      text,
      loading: true,
      explanation: '',
    });

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          context: {
            subject: subject.name,
            docTitle: document.title,
            pageNum: currentPage,
          },
          type: 'feynman',
        }),
      });
      const data = await res.json();
      setQuickExplainModal({
        isOpen: true,
        text,
        loading: false,
        explanation: data.result || 'No explanation generated.',
      });
    } catch (err) {
      setQuickExplainModal({
        isOpen: true,
        text,
        loading: false,
        explanation: 'Could not load explanation. Please check your Gemini connection.',
      });
    }
  };

  const handleTriggerQuizFromSelection = (text: string) => {
    setSelectionMenu((prev) => ({ ...prev, visible: false }));
    onTriggerQuiz(
      activePageData?.title || `Page ${currentPage} Core Concepts`,
      `Page ${currentPage}`,
      text
    );
  };

  const handleStartStickyNote = (text?: string) => {
    setSelectionMenu((prev) => ({ ...prev, visible: false }));
    setPendingStickyNote({
      x: 75, // default upper right margin
      y: 25,
      textExcerpt: text,
    });
    setStickyNoteInput(text ? `Regarding "${text.slice(0, 45)}...": ` : '');
  };

  const handleSaveStickyNote = () => {
    if (!pendingStickyNote || !stickyNoteInput.trim()) return;
    onAddAnnotation({
      docId: document.id,
      page: currentPage,
      x: pendingStickyNote.x,
      y: pendingStickyNote.y,
      content: stickyNoteInput.trim(),
      color: '#eab308',
    });
    setPendingStickyNote(null);
    setStickyNoteInput('');
  };

  // Click on page canvas to add a note directly
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only if alt key is held or special click
    if (e.altKey && pageContainerRef.current) {
      const rect = pageContainerRef.current.getBoundingClientRect();
      const xPercent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const yPercent = Math.round(((e.clientY - rect.top) / rect.height) * 100);

      setPendingStickyNote({
        x: Math.max(5, Math.min(90, xPercent)),
        y: Math.max(5, Math.min(90, yPercent)),
      });
      setStickyNoteInput('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCustomPdf(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/80 dark:bg-slate-950 overflow-hidden relative">
      {/* Top PDF Reader Toolbar */}
      <div className="h-13 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-4 z-20 shrink-0 shadow-xs">
        {/* Document Information & Page Jump */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </span>
            <div className="truncate">
              <h2 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {document.title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>{subject.name}</span>
                <span aria-hidden="true">·</span>
                <span>{document.author}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Pagination Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-600"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 px-2 tabular-nums">
            Page {currentPage} of {document.totalPages}
          </span>

          <button
            onClick={() => onPageChange(Math.min(document.totalPages, currentPage + 1))}
            disabled={currentPage >= document.totalPages}
            className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-600"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Toggle: Actual PDF vs Studio Canvas */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setViewMode('actual_pdf')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'actual_pdf'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Show actual uploaded PDF file on screen"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Actual PDF File</span>
          </button>
          <button
            onClick={() => setViewMode('studio')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'studio'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="Switch to interactive highlighting and annotation studio"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Annotation Studio</span>
          </button>
        </div>

        {/* Right Utility Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 px-1">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(currentPage)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isBookmarked
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'Page bookmarked' : 'Bookmark this page'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-1.5 rounded-lg border transition-colors ${
              searchOpen
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-600'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Search inside textbook"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Share View with Group Button */}
          {onShareViewWithGroup && (
            <button
              onClick={onShareViewWithGroup}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              title="Share this page view with your study group"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Share Page View</span>
            </button>
          )}

          {/* Open Notes Drawer Toggle */}
          <button
            onClick={() => setIsNotesDrawerOpen(!isNotesDrawerOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="View all highlights & sticky notes"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Notebook</span>
            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 text-[11px] font-semibold rounded-full">
              {highlights.length + annotations.length}
            </span>
          </button>

          {/* Upload Custom PDF */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-lg transition-colors whitespace-nowrap"
            title="Upload your own course PDF file"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload PDF</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            className="hidden"
          />
        </div>
      </div>

      {/* In-text Search Bar */}
      {searchOpen && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center gap-3 z-10 shadow-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords across this page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-xs bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setSearchOpen(false)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Done
          </button>
        </div>
      )}

      {/* Main Reading Viewport & Notes Drawer layout */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'actual_pdf' && document.fileDataUrl ? (
          <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
            <NativePdfCanvasViewer
              document={document}
              subject={subject}
              currentPage={currentPage}
              zoomLevel={zoomLevel}
              onPageChange={onPageChange}
              onZoomChange={setZoomLevel}
            />
          </div>
        ) : (
          /* PDF Page Stage (Interactive Studio) */
          <div
            className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start"
            onMouseUp={handleMouseUp}
          >
          {/* Realistic High-Res Textbook Page Canvas */}
          <div
            ref={pageContainerRef}
            onClick={handlePageClick}
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full max-w-3xl min-h-[920px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg shadow-xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-14 relative select-text mb-12"
          >
            {/* Header Folio */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
              <span className="truncate">{document.title}</span>
              <span>{subject.code} · Page {currentPage}</span>
            </div>

            {/* Page Title */}
            <h1 className="text-xl md:text-2xl font-bold font-display text-slate-900 dark:text-white mb-6 leading-tight">
              {activePageData.title}
            </h1>

            {/* Body Content with Highlight and Search Match Rendering */}
            <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 text-[15px]">
              {activePageData.content.split('\n\n').map((paragraph, idx) => {
                // Check if this paragraph contains highlighted snippets
                return (
                  <p key={idx} className="relative">
                    {paragraph}
                  </p>
                );
              })}

              {/* Subsections if available */}
              {activePageData.subsections && activePageData.subsections.length > 0 && (
                <div className="mt-8 space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  {activePageData.subsections.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2"
                    >
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {sub.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {sub.body}
                      </p>
                      {sub.equation && (
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-indigo-600 dark:text-indigo-400 text-center font-medium">
                          {sub.equation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Key Terms Vocabulary Box */}
              {activePageData.keyTerms && activePageData.keyTerms.length > 0 && (
                <div className="mt-8 p-5 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Key High-Yield Concepts (Memorize)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activePageData.keyTerms.map((term, tIdx) => (
                      <div
                        key={tIdx}
                        className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-50 dark:border-indigo-900/30 text-xs"
                      >
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {term.term}:{' '}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {term.definition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Render In-Page Highlights Box for this Page */}
            {pageHighlights.length > 0 && (
              <div className="mt-10 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Highlighter className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Highlights on Page {currentPage} ({pageHighlights.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {pageHighlights.map((hl) => (
                    <div
                      key={hl.id}
                      className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        {hl.authorName && (
                          <div className="mb-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                              Shared by {hl.authorName}
                            </span>
                          </div>
                        )}
                        <p className="font-medium text-slate-800 dark:text-slate-200 italic">
                          "{hl.text}"
                        </p>
                        {hl.note && (
                          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                            <span className="font-semibold">Note:</span> {hl.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onAskAI(hl.text, currentPage)}
                          className="px-2 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded"
                          title="Ask AI about this highlight"
                        >
                          Ask AI
                        </button>
                        <button
                          onClick={() => onDeleteHighlight(hl.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                          title="Delete highlight"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Render In-Page Sticky Annotation Pins */}
            {pageAnnotations.map((ann) => (
              <div
                key={ann.id}
                style={{
                  top: `${ann.y}%`,
                  left: `${ann.x}%`,
                }}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group"
              >
                {/* Pin Icon with Author's Color */}
                <div
                  style={{ backgroundColor: ann.color || ann.authorColor || '#eab308' }}
                  className="w-7 h-7 rounded-full text-slate-900 shadow-md flex items-center justify-center cursor-pointer transform group-hover:scale-110 transition-transform"
                >
                  <Pin className="w-3.5 h-3.5 text-slate-900" />
                </div>

                {/* Hover / Click Note Card */}
                <div className="hidden group-hover:block absolute left-8 top-0 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs z-30 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-700 text-[10px] text-slate-400">
                    <span>
                      Sticky Note · Page {ann.page} {ann.authorName && `· By ${ann.authorName}`}
                    </span>
                    <button
                      onClick={() => onDeleteAnnotation(ann.id)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                </div>
              </div>
            ))}

            {/* Footer Folio */}
            <div className="mt-12 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Nerdify Interactive Study Edition</span>
              <span>
                Tip: Select any sentence to highlight, ask the AI tutor, or generate quiz questions.
              </span>
            </div>
          </div>
        </div>
        )}

        {/* Notebook & Annotations Sidebar */}
        <AnnotationsListDrawer
          isOpen={isNotesDrawerOpen}
          onClose={() => setIsNotesDrawerOpen(false)}
          highlights={highlights.filter((h) => h.docId === document.id)}
          annotations={annotations.filter((a) => a.docId === document.id)}
          currentPage={currentPage}
          onJumpToPage={(p) => {
            onPageChange(p);
          }}
          onDeleteHighlight={onDeleteHighlight}
          onDeleteAnnotation={onDeleteAnnotation}
          onUpdateHighlightNote={onUpdateHighlightNote}
          onUpdateAnnotation={onUpdateAnnotation}
        />
      </div>

      {/* Floating Text Selection Context Menu */}
      {selectionMenu.visible && (
        <div className="pdf-selection-menu">
          <PdfTextSelectionMenu
            position={{ top: selectionMenu.y, left: selectionMenu.x }}
            selectedText={selectionMenu.text}
            onHighlight={handleApplyHighlight}
            onAskAI={(text) => {
              setSelectionMenu((prev) => ({ ...prev, visible: false }));
              onAskAI(text, currentPage);
            }}
            onExplainSimply={handleExplainSimply}
            onQuizMe={handleTriggerQuizFromSelection}
            onAddStickyNote={handleStartStickyNote}
            onClose={() => setSelectionMenu((prev) => ({ ...prev, visible: false }))}
          />
        </div>
      )}

      {/* Modal for "Explain Simply" (Feynman breakdown) */}
      {quickExplainModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Feynman Concept Simplifier
                </h3>
              </div>
              <button
                onClick={() => setQuickExplainModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <blockquote className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 border-l-2 border-indigo-500 italic">
              "{quickExplainModal.text}"
            </blockquote>

            {quickExplainModal.loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Nerdify is translating into plain English analogies...</p>
              </div>
            ) : (
              <div className="text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                {quickExplainModal.explanation}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  onAskAI(
                    `Tell me more about this concept: "${quickExplainModal.text}"`,
                    currentPage
                  );
                  setQuickExplainModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Continue exploring in Ask Nerdify chat
              </button>
              <button
                onClick={() => setQuickExplainModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding a new sticky note */}
      {pendingStickyNote && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Pin className="w-4 h-4 text-amber-500" />
                Add Sticky Note on Page {currentPage}
              </h3>
              <button
                onClick={() => setPendingStickyNote(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={stickyNoteInput}
              onChange={(e) => setStickyNoteInput(e.target.value)}
              placeholder="Write your study note, active recall reminder, or formula here..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              rows={4}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingStickyNote(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStickyNote}
                className="px-4 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
              >
                Save Sticky Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
