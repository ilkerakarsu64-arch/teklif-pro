import { Proposal, AppSettings } from '../types';
import { formatCurrency, formatDate } from './formatters';
import { downloadProposalPdf } from './pdfDownloader';

export function generateSleekEmailText(
  proposal: Proposal,
  settings?: AppSettings,
  customNote?: string
): string {
  const companyName = settings?.company?.name || 'TEKLİFPRO DİJİTAL A.Ş.';
  const companyPhone = settings?.company?.phone || '';
  const companyWebsite = settings?.company?.website || '';
  const portalUrl = `${window.location.origin}${window.location.pathname}#/customer/teklif/${proposal.id}`;

  let body = `Sayın ${proposal.customer.name || proposal.customer.companyName},\n\n`;

  if (customNote && customNote.trim()) {
    body += `${customNote.trim()}\n\n`;
  } else {
    body += `Sizler için özenle hazırladığımız "${proposal.title}" projemize ait teklif belgemiz ve fiyatlandırma detaylarımız bilgilerinize sunulmuştur.\n\n`;
  }

  body += `──────────────────────────────────────────────────\n`;
  body += `📋 TEKLİF ÖZETİ\n`;
  body += `──────────────────────────────────────────────────\n`;
  body += `• Teklif No       : ${proposal.proposalNumber}\n`;
  body += `• Proje Başlığı   : ${proposal.title}\n`;
  body += `• Düzenleme Tarihi: ${formatDate(proposal.issueDate)}\n`;
  body += `• Son Geçerlilik  : ${formatDate(proposal.validUntilDate)}\n`;
  body += `• Toplam Tutar    : ${formatCurrency(proposal.grandTotal, proposal.currency)} (KDV Dahil)\n`;
  body += `──────────────────────────────────────────────────\n\n`;

  body += `🌐 Teklifi internet üzerinden incelemek ve çevrim içi onaylamak için tıklayın:\n`;
  body += `${portalUrl}\n\n`;

  body += `Detaylı hizmet kalemlerini ekteki PDF dosyasından inceleyebilirsiniz.\n\n`;

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
  // 1. Trigger PDF download automatically so user has the attached PDF ready
  if (element) {
    try {
      await downloadProposalPdf(element, `Teklif_${proposal.proposalNumber}`);
    } catch (e) {
      console.warn('PDF generation warning:', e);
    }
  }

  // 2. Open desktop mail software with clean, sleek pre-filled email
  const mailtoUrl = generateMailtoUrl(proposal, settings, toEmailOverride, customNote);
  window.location.href = mailtoUrl;
}

export function openDefaultMailClient(
  proposal: Proposal,
  settings?: AppSettings,
  toEmailOverride?: string,
  customNote?: string
) {
  const mailtoUrl = generateMailtoUrl(proposal, settings, toEmailOverride, customNote);
  window.location.href = mailtoUrl;
}
