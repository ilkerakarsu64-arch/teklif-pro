import html2pdf from 'html2pdf.js';
import { Proposal, AppSettings } from '../types';
import { createProposalPdfDocument, createAndSaveVectorPdf } from './pdfGenerator';

export { createProposalPdfDocument, createAndSaveVectorPdf } from './pdfGenerator';

/**
 * Generates, displays (previews in new tab), and downloads the PDF document.
 */
export const downloadProposalPdf = async (
  element: HTMLElement | null,
  filename: string = 'Teklif.pdf',
  proposal?: Proposal,
  settings?: AppSettings
): Promise<void> => {
  if (proposal) {
    createAndSaveVectorPdf(proposal, settings);
    return;
  }

  if (!element) return;

  try {
    const html2pdfLib = (html2pdf as any)?.default || html2pdf;

    if (typeof html2pdfLib === 'function') {
      const docName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      const opt = {
        margin:       [8, 8, 8, 8],
        filename:     docName,
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
      
      // 1. Preview PDF in a new tab for instant display
      try {
        const pdfBlob = await worker.output('blob');
        if (pdfBlob) {
          const blobUrl = URL.createObjectURL(pdfBlob);
          window.open(blobUrl, '_blank');
        }
      } catch (err) {
        console.warn('PDF blob preview warning:', err);
      }

      // 2. Save PDF file directly to disk
      await worker.save();
    }
  } catch (err) {
    console.error('PDF generation error:', err);
  }
};
