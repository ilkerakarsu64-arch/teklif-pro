import html2pdf from 'html2pdf.js';
export { createProposalPdfDocument, createAndSaveVectorPdf } from './pdfGenerator';

export const downloadProposalPdf = async (element: HTMLElement | null, filename: string): Promise<void> => {
  if (!element) return;

  try {
    // Resolve html2pdf function safely for both CJS and ESM bundlers (Vite)
    const html2pdfLib = (html2pdf as any)?.default || html2pdf;

    if (typeof html2pdfLib === 'function') {
      const opt = {
        margin:       [8, 8, 8, 8],
        filename:     filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: false, 
          scrollY: 0,
          windowWidth: 1200
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      const worker = html2pdfLib().set(opt).from(element);
      await worker.save();
    }
  } catch (err) {
    console.error('PDF generation error:', err);
  }
};
