import * as pdfjsLib from 'pdfjs-dist';

// Configure worker using cdnjs or local worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
  viewportWidth: number;
  viewportHeight: number;
}

export interface ParsedPdfDocument {
  title: string;
  totalPages: number;
  pages: ExtractedPdfPage[];
  pdfDoc: any;
}

export async function loadPdfFromArrayBuffer(arrayBuffer: ArrayBuffer, fileName: string): Promise<ParsedPdfDocument> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const pages: ExtractedPdfPage[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item: any) => item.str || '').join(' ');
    const viewport = page.getViewport({ scale: 1.0 });

    pages.push({
      pageNumber: i,
      text: textItems.trim() || `Page ${i} of ${fileName}`,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
    });
  }

  return {
    title: fileName.replace(/\.pdf$/i, ''),
    totalPages,
    pages,
    pdfDoc,
  };
}

export async function renderPdfPageToCanvas(
  pdfDoc: any,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): Promise<{ width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const canvasContext = canvas.getContext('2d');
  if (!canvasContext) throw new Error('Canvas context not available');

  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext,
    viewport,
  };

  await page.render(renderContext).promise;

  return { width: viewport.width, height: viewport.height };
}
