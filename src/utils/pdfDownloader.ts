import html2pdf from 'html2pdf.js';
import { Proposal, AppSettings } from '../types';
import { createProposalPdfDocument, createAndSaveVectorPdf } from './pdfGenerator';

export { createProposalPdfDocument, createAndSaveVectorPdf } from './pdfGenerator';

/**
 * Renders the exact visual proposal paper element from screen into a 1-to-1 high-definition A4 PDF.
 * Opens an instant preview tab AND downloads the PDF file to disk.
 */
export const downloadProposalPdf = async (
  element: HTMLElement | null,
  filename: string = 'Teklif.pdf'
): Promise<void> => {
  const targetElement = element || document.getElementById('proposal-paper-container');
  
  if (!targetElement) {
    window.print();
    return;
  }

  try {
    const html2pdfLib = (html2pdf as any)?.default || html2pdf;

    if (typeof html2pdfLib === 'function') {
      const docName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      const opt = {
        margin:       [6, 6, 6, 6],
        filename:     docName,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: false, 
          scrollY: 0,
          windowWidth: 1200,
          letterRendering: true
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      const worker = html2pdfLib().set(opt).from(targetElement);
      
      // 1. Instant preview PDF in a new tab for display
      try {
        const pdfBlob = await worker.output('blob');
        if (pdfBlob) {
          const blobUrl = URL.createObjectURL(pdfBlob);
          window.open(blobUrl, '_blank');
        }
      } catch (e) {
        console.warn('PDF blob preview warning:', e);
      }

      // 2. Download file directly to disk
      await worker.save();
    } else {
      window.print();
    }
  } catch (err) {
    console.error('PDF generation error, falling back to window.print:', err);
    window.print();
  }
};
