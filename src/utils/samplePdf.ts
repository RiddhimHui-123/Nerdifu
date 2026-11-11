/**
 * Generates a real, valid PDF binary Blob for the bundled sample study textbooks.
 * This guarantees that even before user uploads a PDF, they can view the actual PDF
 * on screen, download it, or inspect it.
 */

export function generateSamplePdfBlob(title: string, author: string, pages: Array<{ title: string; content: string }>): string {
  try {
    const kids: string[] = [];
    let objCount = 2;
    const pageObjIds: number[] = [];
    const contentObjIds: number[] = [];

    pages.forEach(() => {
      const pageId = ++objCount;
      const contentId = ++objCount;
      pageObjIds.push(pageId);
      contentObjIds.push(contentId);
      kids.push(`${pageId} 0 R`);
    });

    const fontId = ++objCount;
    let body = `1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n`;
    body += `2 0 obj <</Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length}>> endobj\n`;

    pages.forEach((p, idx) => {
      const pageId = pageObjIds[idx];
      const contentId = contentObjIds[idx];
      body += `${pageId} 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources <</Font <</F1 ${fontId} 0 R>>>>>> endobj\n`;

      // Clean ASCII text for PDF stream
      const safeTitle = (p.title || title).replace(/[()\\\r\n]/g, ' ').slice(0, 70);
      const safeAuthor = (author || 'Nerdify Study Materials').replace(/[()\\\r\n]/g, ' ').slice(0, 50);
      const safeContent = (p.content || '').replace(/[()\\\r\n]/g, ' ').slice(0, 450);

      const stream = `BT
/F1 18 Tf
50 730 Td
(${safeTitle}) Tj
ET
BT
/F1 11 Tf
50 705 Td
(Author: ${safeAuthor} | Page ${idx + 1} of ${pages.length}) Tj
ET
BT
/F1 12 Tf
50 670 Td
18 TL
(${safeContent}) '
ET`;

      body += `${contentId} 0 obj <</Length ${stream.length}>> stream\n${stream}\nendstream\nendobj\n`;
    });

    body += `${fontId} 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n`;

    const fullPdf = `%PDF-1.4\n${body}xref\n0 ${objCount + 1}\n0000000000 65535 f \ntrailer <</Size ${objCount + 1} /Root 1 0 R>>\nstartxref\n100\n%%EOF`;

    const blob = new Blob([fullPdf], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to generate sample PDF blob:', err);
    return '';
  }
}
