import html2pdf from 'html2pdf.js';

export const downloadProposalPdf = async (element: HTMLElement | null, filename: string): Promise<void> => {
  if (!element) {
    window.print();
    return;
  }

  try {
    // Resolve html2pdf function safely for both CJS and ESM bundlers (Vite)
    const html2pdfLib = (html2pdf as any)?.default || html2pdf;

    if (typeof html2pdfLib === 'function') {
      const opt = {
        margin:       [8, 8, 8, 8],
        filename:     `${filename}.pdf`,
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
    } else {
      console.warn('html2pdf function could not be resolved, falling back to window.print');
      window.print();
    }
  } catch (err) {
    console.error('PDF generation error, falling back to window.print:', err);
    window.print();
  }
};
