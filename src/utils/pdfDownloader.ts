import html2pdf from 'html2pdf.js';

export const downloadProposalPdf = async (element: HTMLElement | null, filename: string): Promise<void> => {
  if (!element) {
    window.print();
    return;
  }

  try {
    const opt = {
      margin:       8,
      filename:     `${filename}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
    await html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error('PDF generation error, falling back to window.print', err);
    window.print();
  }
};
