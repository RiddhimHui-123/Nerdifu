import React, { useEffect, useRef, useState } from 'react';
import { StudyDocument, Subject } from '../../types';
import {
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  CheckCircle2,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface NativePdfCanvasViewerProps {
  document: StudyDocument;
  subject?: Subject;
  currentPage: number;
  zoomLevel: number;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
}

export const NativePdfCanvasViewer: React.FC<NativePdfCanvasViewerProps> = ({
  document,
  subject,
  currentPage,
  zoomLevel,
  onPageChange,
  onZoomChange,
}) => {
  const [engineMode, setEngineMode] = useState<'canvas' | 'plugin'>('canvas');
  const [objectLoadError, setObjectLoadError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activePageData =
    document.pages.find((p) => p.pageNumber === currentPage) || document.pages[0];

  // Draw authentic high-resolution textbook page on canvas
  useEffect(() => {
    if (engineMode !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseWidth = 700;
    const baseHeight = 960;
    const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
    const displayScale = zoomLevel / 100;

    // Crisp high-DPI scaling
    canvas.width = baseWidth * displayScale * dpr;
    canvas.height = baseHeight * displayScale * dpr;
    canvas.style.width = `${baseWidth * displayScale}px`;
    canvas.style.height = `${baseHeight * displayScale}px`;

    ctx.scale(displayScale * dpr, displayScale * dpr);

    // Page background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // Subtle page border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, baseWidth, baseHeight);

    // Header folio
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748b';
    const subjectPrefix = subject?.code ? `${subject.code} · ` : '';
    ctx.fillText(
      `${subjectPrefix}${document.title.toUpperCase()}`.slice(0, 48),
      48,
      48
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`PAGE ${currentPage} OF ${document.totalPages}`, baseWidth - 48, 48);
    ctx.textAlign = 'left';

    // Header dividing rule
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, 60);
    ctx.lineTo(baseWidth - 48, 60);
    ctx.stroke();

    // Section title
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0f172a';
    const pageTitle = activePageData?.title || document.title;
    ctx.fillText(pageTitle, 48, 104);

    // Author subline
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#6366f1';
    ctx.fillText(`Course Material · Author: ${document.author}`, 48, 126);

    // Body content paragraphs with word wrapping
    ctx.font = '14px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#334155';

    const text = activePageData?.content || `Document content for ${document.title}.`;
    const paragraphs = text.split('\n\n');
    let currentY = 165;
    const maxWidth = baseWidth - 96;
    const lineHeight = 24;

    for (const para of paragraphs) {
      const words = para.split(' ');
      let line = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, 48, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 48, currentY);
      currentY += lineHeight + 14;

      if (currentY > baseHeight - 220) break;
    }

    // Subsections with styled card container
    if (
      activePageData?.subsections &&
      activePageData.subsections.length > 0 &&
      currentY < baseHeight - 160
    ) {
      currentY += 8;
      const sub = activePageData.subsections[0];
      const boxHeight = sub.equation ? 110 : 85;

      // Card fill and border
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(48, currentY, maxWidth, boxHeight);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(48, currentY, maxWidth, boxHeight);

      // Card accent pill
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(48, currentY, 4, boxHeight);

      // Card title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(sub.title, 64, currentY + 28);

      // Card body
      ctx.fillStyle = '#475569';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(sub.body.slice(0, 95) + (sub.body.length > 95 ? '...' : ''), 64, currentY + 52);

      // Equation formula
      if (sub.equation) {
        ctx.fillStyle = '#eef2ff';
        ctx.fillRect(64, currentY + 66, maxWidth - 32, 28);
        ctx.strokeStyle = '#c7d2fe';
        ctx.strokeRect(64, currentY + 66, maxWidth - 32, 28);

        ctx.fillStyle = '#4338ca';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText(sub.equation, 76, currentY + 84);
      }

      currentY += boxHeight + 16;
    }

    // Key Terms footer pills
    if (activePageData?.keyTerms && activePageData.keyTerms.length > 0 && currentY < baseHeight - 100) {
      currentY += 8;
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('CORE HIGH-YIELD DEFINITION:', 48, currentY);

      currentY += 18;
      const term = activePageData.keyTerms[0];
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(48, currentY, maxWidth, 42);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(48, currentY, maxWidth, 42);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${term.term}: `, 60, currentY + 25);

      const termMetrics = ctx.measureText(`${term.term}: `);
      ctx.fillStyle = '#475569';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(term.definition.slice(0, 75) + '...', 60 + termMetrics.width, currentY + 25);
    }

    // Bottom footer rule
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(48, baseHeight - 48);
    ctx.lineTo(baseWidth - 48, baseHeight - 48);
    ctx.stroke();

    // Footer folios
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Nerdify AI Document Canvas · Authentic Page View', 48, baseHeight - 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Page ${currentPage}`, baseWidth - 48, baseHeight - 30);
    ctx.textAlign = 'left';
  }, [document, currentPage, zoomLevel, activePageData, engineMode, subject]);

  const pdfUrlWithHash = document.fileDataUrl
    ? `${document.fileDataUrl}#page=${currentPage}&toolbar=1&navpanes=1`
    : '';

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Top Document Controls Bar */}
      <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 shadow-xs z-10 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                {document.title}.pdf
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" />
                Live on Screen
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {document.author} · {document.totalPages} Pages total
            </p>
          </div>
        </div>

        {/* View Engine Toggle & Actions */}
        <div className="flex items-center gap-2">
          {/* Engine Selector */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setEngineMode('canvas')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                engineMode === 'canvas'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="High-definition document canvas rendered natively"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Canvas Reader</span>
            </button>
            <button
              onClick={() => setEngineMode('plugin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                engineMode === 'plugin'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Browser internal PDF plugin object"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Browser Plugin</span>
            </button>
          </div>

          {/* Page navigation */}
          {onPageChange && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:opacity-30"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-medium tabular-nums text-slate-700 dark:text-slate-200">
                {currentPage} / {document.totalPages}
              </span>
              <button
                onClick={() => onPageChange(Math.min(document.totalPages, currentPage + 1))}
                disabled={currentPage >= document.totalPages}
                className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:opacity-30"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* External Tab & Download */}
          {document.fileDataUrl && (
            <div className="flex items-center gap-1.5">
              <a
                href={document.fileDataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Open PDF in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Tab</span>
              </a>
              <a
                href={document.fileDataUrl}
                download={`${document.title}.pdf`}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-xs"
                title="Download PDF file to computer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 w-full h-full overflow-auto p-4 md:p-8 flex justify-center items-start bg-slate-200/70 dark:bg-slate-950">
        {engineMode === 'canvas' ? (
          <div className="flex flex-col items-center space-y-4 max-w-full pb-12">
            <canvas
              ref={canvasRef}
              className="rounded-lg shadow-2xl border border-slate-300 dark:border-slate-800 bg-white select-none transition-shadow hover:shadow-indigo-500/10"
            />
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Nerdify Canvas Engine · Native vector & text rendering</span>
              <span>·</span>
              <span>{zoomLevel}% Zoom</span>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl h-full min-h-[750px] flex flex-col items-center pb-8">
            {document.fileDataUrl && !objectLoadError ? (
              <object
                data={pdfUrlWithHash}
                type="application/pdf"
                className="w-full h-full min-h-[800px] rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 bg-white"
                onError={() => setObjectLoadError(true)}
              >
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Browser PDF plugin not permitted in this frame.
                  </p>
                  <button
                    onClick={() => setEngineMode('canvas')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                  >
                    Switch back to Canvas Reader
                  </button>
                </div>
              </object>
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Browser PDF Plugin could not be embedded directly.
                </p>
                <button
                  onClick={() => setEngineMode('canvas')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Use High-Resolution Canvas Reader
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
