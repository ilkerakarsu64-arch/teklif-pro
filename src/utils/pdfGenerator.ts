import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Proposal, AppSettings } from '../types';
import { formatCurrency, formatDate } from './formatters';

export function createProposalPdfDocument(proposal: Proposal, settings?: AppSettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const currency = proposal.currency || 'TRY';
  const company = settings?.company;
  const companyName = company?.name || 'TEKLİFPRO DİJİTAL A.Ş.';
  const companyTitle = company?.title || 'Kurumsal Yazılım ve Bilişim Hizmetleri';
  const companyAddress = company?.address || '';
  const companyPhone = company?.phone || '';
  const companyEmail = company?.email || '';

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 34, 'F');

  // Company Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 14, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(companyTitle, 14, 19);
  
  const contactText = [companyPhone ? `Tel: ${companyPhone}` : '', companyEmail ? `E-posta: ${companyEmail}` : ''].filter(Boolean).join(' | ');
  if (contactText) {
    doc.text(contactText, 14, 24);
  }
  if (companyAddress) {
    doc.text(companyAddress.slice(0, 80), 14, 29);
  }

  // Right Title Badge
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.roundedRect(142, 8, 54, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FİYAT TEKLİFİ', 169, 19, { align: 'center' });

  // Metadata Boxes Layout
  const startY = 40;

  // Customer Card (Left Side)
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(14, startY, 90, 36, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105); // Slate 600
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('MÜŞTERİ BİLGİLERİ', 18, startY + 6);

  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  const custName = proposal.customer.companyName || proposal.customer.name;
  doc.text(custName.slice(0, 36), 18, startY + 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  let custLineY = startY + 19;
  if (proposal.customer.name) {
    doc.text(`Yetkili Kişi: ${proposal.customer.name}`, 18, custLineY);
    custLineY += 5;
  }
  if (proposal.customer.phone) {
    doc.text(`Telefon: ${proposal.customer.phone}`, 18, custLineY);
    custLineY += 5;
  }
  if (proposal.customer.email) {
    doc.text(`E-Posta: ${proposal.customer.email}`, 18, custLineY);
  }

  // Proposal Info Card (Right Side)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(106, startY, 90, 36, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TEKLİF DETAYLARI', 110, startY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Teklif Numarası : ${proposal.proposalNumber}`, 110, startY + 13);
  doc.text(`Düzenleme Tarihi: ${formatDate(proposal.issueDate)}`, 110, startY + 19);
  doc.text(`Son Geçerlilik  : ${formatDate(proposal.validUntilDate)}`, 110, startY + 25);
  doc.text(`Teklif Durumu   : ${proposal.status}`, 110, startY + 31);

  // Proposal Title Header Line
  const titleY = startY + 43;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Konu / Proje: ${proposal.title}`, 14, titleY);

  // Itemized Products / Services Table
  const tableData = proposal.items.map((item, idx) => [
    (idx + 1).toString(),
    item.description || 'Hizmet Kalemi',
    item.quantity.toString(),
    item.unit || 'Adet',
    formatCurrency(item.unitPrice, currency),
    `%${item.taxRate || 20}`,
    formatCurrency(item.total, currency)
  ]);

  autoTable(doc, {
    startY: titleY + 4,
    head: [['#', 'Açıklama / Hizmet Kapsamı', 'Miktar', 'Birim', 'Birim Fiyat', 'KDV', 'Toplam']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 32, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Financial Summary Box (Right Aligned)
  const summaryX = 118;
  const summaryY = finalY;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, summaryY, 78, 34, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Ara Toplam:', summaryX + 4, summaryY + 7);
  doc.text(formatCurrency(proposal.subtotal, currency), summaryX + 74, summaryY + 7, { align: 'right' });

  let offset = 13;
  if (proposal.totalDiscount > 0) {
    doc.text('İndirim:', summaryX + 4, summaryY + offset);
    doc.text(`-${formatCurrency(proposal.totalDiscount, currency)}`, summaryX + 74, summaryY + offset, { align: 'right' });
    offset += 6;
  }

  doc.text('KDV Toplamı:', summaryX + 4, summaryY + offset);
  doc.text(formatCurrency(proposal.totalTax, currency), summaryX + 74, summaryY + offset, { align: 'right' });

  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 4, summaryY + offset + 3, summaryX + 74, summaryY + offset + 3);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('GENEL TOPLAM:', summaryX + 4, summaryY + offset + 9);
  doc.setTextColor(37, 99, 235);
  doc.text(formatCurrency(proposal.grandTotal, currency), summaryX + 74, summaryY + offset + 9, { align: 'right' });

  // Terms & Conditions (Left Side)
  if (proposal.paymentTerms || proposal.notes) {
    let notesY = finalY;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    
    if (proposal.paymentTerms) {
      doc.text('ÖDEME ŞARTLARI:', 14, notesY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(proposal.paymentTerms.slice(0, 60), 14, notesY + 10);
      notesY += 14;
    }

    if (proposal.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('NOTLAR:', 14, notesY + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(proposal.notes.slice(0, 80), 14, notesY + 10);
    }
  }

  // Footer Signatures
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 28;

  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, 196, footerY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Teklifi Hazırlayan', 30, footerY + 6);
  doc.text('Müşteri Onayı', 150, footerY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(companyName.slice(0, 30), 30, footerY + 11);
  doc.text(custName.slice(0, 30), 150, footerY + 11);

  doc.text('Kaşe / İmza', 30, footerY + 19);
  doc.text('Tarih / İmza', 150, footerY + 19);

  return doc;
}

export function createAndSaveVectorPdf(proposal: Proposal, settings?: AppSettings) {
  const doc = createProposalPdfDocument(proposal, settings);
  const fileName = `Teklif_${proposal.proposalNumber}.pdf`;

  // 1. Preview PDF in a new tab for instant display
  try {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
  } catch (err) {
    console.warn('PDF preview popup warning:', err);
  }

  // 2. Download PDF file directly to disk
  doc.save(fileName);
}
