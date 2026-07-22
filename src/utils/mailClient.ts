import { Proposal, AppSettings } from '../types';
import { formatCurrency, formatDate, getPublicPortalUrl } from './formatters';
import { downloadProposalPdf } from './pdfDownloader';

export function generateSleekEmailText(
  proposal: Proposal,
  settings?: AppSettings,
  customNote?: string
): string {
  const companyName = settings?.company?.name || 'TEKLİFPRO DİJİTAL A.Ş.';
  const companyPhone = settings?.company?.phone || '';
  const companyWebsite = settings?.company?.website || '';
  const portalUrl = getPublicPortalUrl(proposal.id, settings);

  let body = '';
  if (customNote && customNote.trim()) {
    body += `${customNote.trim()}\n\n`;
  } else {
    body += `Sayın ${proposal.customer.name || proposal.customer.companyName},\n\n`;
    body += `Sizler için hazırladığımız "${proposal.title}" projemize ait teklif belgemiz ve fiyatlandırma detaylarımız bilgilerinize sunulmuştur.\n\n`;
  }

  body += `• Teklif No       : ${proposal.proposalNumber}\n`;
  body += `• Proje Başlığı   : ${proposal.title}\n`;
  body += `• Düzenleme Tarihi: ${formatDate(proposal.issueDate)}\n`;
  body += `• Son Geçerlilik  : ${formatDate(proposal.validUntilDate)}\n`;
  body += `• Toplam Tutar    : ${formatCurrency(proposal.grandTotal, proposal.currency)} (KDV Dahil)\n\n`;

  body += `👉 Teklifi internet üzerinden incelemek ve çevrim içi onaylamak için aşağıdaki bağlantıya tıklayın:\n`;
  body += `${portalUrl}\n\n`;

  body += `(Teklif belgenizin detaylı çıktısı ekteki PDF dosyasındadır.)\n\n`;

  body += `Saygılarımızla,\n`;
  body += `${companyName}\n`;
  if (companyPhone) body += `İletişim: ${companyPhone}\n`;
  if (companyWebsite) body += `Web: ${companyWebsite}\n`;

  return body;
}

export function generateMailtoUrl(
  proposal: Proposal,
  settings?: AppSettings,
  toEmailOverride?: string,
  customNote?: string
): string {
  const recipientEmail = toEmailOverride || proposal.customer.email || '';
  const subject = `Teklif: ${proposal.proposalNumber} - ${proposal.title}`;
  const body = generateSleekEmailText(proposal, settings, customNote);

  return `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function openDefaultMailClientWithPdf(
  proposal: Proposal,
  element: HTMLElement | null,
  settings?: AppSettings,
  toEmailOverride?: string,
  customNote?: string
) {
  // 1. Download PDF asynchronously without blocking the UI
  if (element) {
    try {
      await downloadProposalPdf(element, `Teklif_${proposal.proposalNumber}`);
    } catch (e) {
      console.warn('PDF generation warning:', e);
    }
  }

  // 2. Open desktop mail client safely after brief delay to avoid tab lockup
  setTimeout(() => {
    const mailtoUrl = generateMailtoUrl(proposal, settings, toEmailOverride, customNote);
    const link = document.createElement('a');
    link.href = mailtoUrl;
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 500);
  }, 100);
}

export function openDefaultMailClient(
  proposal: Proposal,
  settings?: AppSettings,
  toEmailOverride?: string,
  customNote?: string
) {
  const mailtoUrl = generateMailtoUrl(proposal, settings, toEmailOverride, customNote);
  const link = document.createElement('a');
  link.href = mailtoUrl;
  link.target = '_self';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 500);
}
