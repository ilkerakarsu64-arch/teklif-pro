import { Proposal, AppSettings } from '../types';
import { formatCurrency, formatDate } from './formatters';

export function generateMailtoUrl(
  proposal: Proposal,
  settings?: AppSettings,
  toEmailOverride?: string,
  customNote?: string
): string {
  const recipientEmail = toEmailOverride || proposal.customer.email || '';
  const subject = `${proposal.proposalNumber} - ${proposal.title}`;
  
  const portalUrl = `${window.location.origin}${window.location.pathname}#/customer/teklif/${proposal.id}`;

  const itemsFormatted = proposal.items.map((item, idx) => {
    const desc = item.description || 'Hizmet / Ürün Kalemi';
    const qty = item.quantity;
    const unit = item.unit || 'Adet';
    const price = formatCurrency(item.unitPrice, proposal.currency);
    const total = formatCurrency(item.total, proposal.currency);
    return `${idx + 1}. ${desc}\n   Miktar: ${qty} ${unit} | Birim Fiyat: ${price} | Toplam: ${total}`;
  }).join('\n\n');

  const companyName = settings?.company?.name || 'TEKLİFPRO DİJİTAL A.Ş.';
  const companyPhone = settings?.company?.phone || '';
  const companyEmail = settings?.company?.email || '';

  let body = `Sayın ${proposal.customer.companyName || proposal.customer.name},\n\n`;
  
  if (customNote && customNote.trim()) {
    body += `${customNote.trim()}\n\n`;
  } else {
    body += `Sizler için özel olarak hazırladığımız "${proposal.title}" başlıklı teklif detaylarımız aşağıda bilgilerinize sunulmuştur.\n\n`;
  }

  body += `==================================================\n`;
  body += `📄 TEKLİF BİLGİLERİ\n`;
  body += `==================================================\n`;
  body += `Teklif No       : ${proposal.proposalNumber}\n`;
  body += `Tarih           : ${formatDate(proposal.issueDate)}\n`;
  body += `Geçerlilik Tarihi: ${formatDate(proposal.validUntilDate)}\n`;
  body += `Müşteri Firma   : ${proposal.customer.companyName || proposal.customer.name}\n\n`;

  body += `--------------------------------------------------\n`;
  body += `📦 TEKLİF KALEMLERİ VE HİZMET KAPSAMI\n`;
  body += `--------------------------------------------------\n`;
  body += `${itemsFormatted}\n\n`;

  body += `--------------------------------------------------\n`;
  body += `💰 FİYATLANDIRMA ÖZETİ\n`;
  body += `--------------------------------------------------\n`;
  body += `Ara Toplam   : ${formatCurrency(proposal.subtotal, proposal.currency)}\n`;
  if (proposal.totalDiscount > 0) {
    body += `İndirim      : -${formatCurrency(proposal.totalDiscount, proposal.currency)}\n`;
  }
  body += `KDV Toplamı  : ${formatCurrency(proposal.totalTax, proposal.currency)}\n`;
  body += `GENEL TOPLAM : ${formatCurrency(proposal.grandTotal, proposal.currency)}\n`;
  body += `==================================================\n\n`;

  if (proposal.paymentTerms) {
    body += `ÖDEME ŞARTLARI:\n${proposal.paymentTerms}\n\n`;
  }

  if (proposal.notes) {
    body += `NOTLAR:\n${proposal.notes}\n\n`;
  }

  body += `🔗 TEKLİFİ İNCELENMEK VE ONAYLAMAK İÇİN LİNKİ TIKLAYIN:\n`;
  body += `${portalUrl}\n\n`;

  body += `Saygılarımızla,\n`;
  body += `${companyName}\n`;
  if (companyPhone) body += `Tel: ${companyPhone}\n`;
  if (companyEmail) body += `E-posta: ${companyEmail}\n`;

  return `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
