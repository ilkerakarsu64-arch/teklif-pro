import React, { useState } from 'react';
import { Proposal, AppSettings } from '../types';
import { formatCurrency, getPublicPortalUrl } from '../utils/formatters';
import { openDefaultMailClientWithPdf } from '../utils/mailClient';
import { downloadProposalPdf } from '../utils/pdfDownloader';
import { Mail, X, CheckCircle2, ExternalLink, Paperclip, Check, Download, FileText, MessageSquare, Phone } from 'lucide-react';

interface EmailModalProps {
  proposal: Proposal;
  settings?: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSend: (toEmail: string, subject: string, customMessage: string) => Promise<any>;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  proposal,
  settings,
  isOpen,
  onClose,
  onSend
}) => {
  const [toEmail, setToEmail] = useState(proposal.customer.email || '');
  const [phone, setPhone] = useState(proposal.customer.phone || '');
  const [subject, setSubject] = useState(`${proposal.proposalNumber} - ${proposal.title}`);
  const [customMessage, setCustomMessage] = useState(
    `Sayın ${proposal.customer.name || proposal.customer.companyName},\n\n` +
    `Sizler için özenle hazırladığımız "${proposal.title}" başlıklı teklif belgemiz ve fiyatlandırma detaylarımız bilgilerinize sunulmuştur.`
  );
  const [isSaving, setIsSaving] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isOpeningMailClient, setIsOpeningMailClient] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  if (!isOpen) return null;

  const handleDirectPdfDownload = async () => {
    try {
      const paperElement = document.getElementById('proposal-paper-container');
      await downloadProposalPdf(paperElement, `Teklif_${proposal.proposalNumber}`);
    } catch (err) {
      console.error('PDF download error:', err);
    }
  };

  // Open Installed Default Desktop Mail Client (Outlook, Thunderbird, etc.)
  const handleOpenMailClient = async () => {
    setIsOpeningMailClient(true);
    try {
      const paperElement = document.getElementById('proposal-paper-container');
      await openDefaultMailClientWithPdf(proposal, paperElement, settings, toEmail, customMessage);
      
      // Update proposal status to GONDERILDI and log activity
      await onSend(toEmail, subject, customMessage);
      setSentSuccess(true);
    } catch (err) {
      console.error('Mail client open error:', err);
      setSentSuccess(true);
    } finally {
      setIsOpeningMailClient(false);
    }
  };

  // Send PDF & Message via WhatsApp
  const handleSendWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    try {
      // 1. Download PDF to user device automatically
      await handleDirectPdfDownload();

      // 2. Format phone number for WhatsApp
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length === 10 && cleanPhone.startsWith('5')) {
        cleanPhone = '90' + cleanPhone;
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith('05')) {
        cleanPhone = '90' + cleanPhone.slice(1);
      }

      // 3. Construct WhatsApp Message text
      const portalUrl = getPublicPortalUrl(proposal.id, settings);
      const waText = 
        `Sayın ${proposal.customer.name || proposal.customer.companyName},\n\n` +
        `"${proposal.title}" başlıklı teklif belgeniz ve detayları bilgilerinize sunulmuştur.\n\n` +
        `👉 Teklifi dijital ortamda incelemek ve onaylamak için tıklayın:\n${portalUrl}\n\n` +
        `(Teklifinizin A4 PDF belgesi cihazınıza indirilmiştir, bu sohbete ekleyebilirsiniz.)\n\n` +
        `Saygılarımızla,\n${settings?.company?.name || 'TEKLİFPRO DİJİTAL A.Ş.'}`;

      const waUrl = cleanPhone 
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waText)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

      // 4. Open WhatsApp Web or App
      window.open(waUrl, '_blank');

      // 5. Update proposal status to GONDERILDI
      await onSend(toEmail, subject, customMessage);
      setSentSuccess(true);
    } catch (err) {
      console.error('WhatsApp send error:', err);
      setSentSuccess(true);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Mark as Sent / Save Draft without SMTP network call
  const handleSaveAsSent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSend(toEmail, subject, customMessage);
      setIsSaving(false);
      setSentSuccess(true);
    } catch (err) {
      setIsSaving(false);
      setSentSuccess(true);
    }
  };

  const portalUrl = getPublicPortalUrl(proposal.id, settings);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <span>Teklif Gönderimi (E-Posta & WhatsApp)</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {proposal.proposalNumber} • {proposal.customer.companyName || proposal.customer.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                Teklif Gönderim Kaydı Güncellendi!
              </h3>
              <p className="text-xs font-mono text-slate-600">
                Teklif Durumu: <strong className="text-emerald-600 font-bold uppercase">Gönderildi</strong>
              </p>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Teklif durumu sisteminizde <strong>Gönderildi</strong> olarak güncellendi. Müşteriniz teklifi incelediğinde Canlı Takip panelinizde anında bildirim alacaksınız.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSentSuccess(false);
                  onClose();
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold border border-slate-800 shadow-xs cursor-pointer"
              >
                Tamam / Kapat
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveAsSent} className="p-6 space-y-4 text-xs">
            
            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1 text-[10px]">
                  Alıcı E-Posta *
                </label>
                <input
                  type="email"
                  required
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1 text-[10px] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>WhatsApp Tel *</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xx xxx xx xx"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1 text-[10px]">
                  E-Posta Konusu *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1 text-[10px]">
                Özel Mesaj Notu
              </label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Email Visual Preview Card */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                Müşterinizin Göreceği Mesaj Önizlemesi
              </label>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-3 font-sans">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-bold text-blue-600">TEKLİFPRO Teknoloji</span>
                  <span className="text-[10px] text-slate-400 font-mono">{proposal.proposalNumber}</span>
                </div>

                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700">
                  {customMessage}
                </p>

                {/* Offer Card inside Email */}
                <div className="bg-slate-900 p-3.5 rounded-xl text-white space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{proposal.title}</div>
                      <div className="text-xs text-slate-300">Tutar: <strong className="font-mono text-emerald-400 text-sm">{formatCurrency(proposal.grandTotal, proposal.currency)}</strong></div>
                    </div>
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-md border border-blue-400 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(portalUrl, '_blank');
                      }}
                      title="Müşteri dijital teklif inceleme portal ekranını açar"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Teklifi İncele</span>
                    </a>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Doğrudan Tıklanabilir Bağlantı:</span>
                    <a 
                      href={portalUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-400 font-mono underline hover:text-blue-300 truncate max-w-[280px]"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(portalUrl, '_blank');
                      }}
                    >
                      {portalUrl}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Button 1: Mail Gönder */}
                <button
                  type="button"
                  disabled={isOpeningMailClient || isSendingWhatsApp}
                  onClick={handleOpenMailClient}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-500 shadow-sm transition-colors cursor-pointer active:scale-95"
                  title="E-posta istemciniz üzerinden mail gönderir"
                >
                  <Mail className="w-4 h-4 text-white" />
                  <span>{isOpeningMailClient ? 'Mail Hazırlanıyor...' : 'Mail Gönder'}</span>
                </button>

                {/* Button 2: WhatsApp ile Gönder (+ PDF İndir) */}
                <button
                  type="button"
                  disabled={isOpeningMailClient || isSendingWhatsApp}
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-500 shadow-sm transition-colors cursor-pointer active:scale-95"
                  title="WhatsApp uygulamasını/web ekranını açar ve teklif PDF belgesini cihazınıza indirir"
                >
                  <MessageSquare className="w-4 h-4 text-white fill-white" />
                  <span>{isSendingWhatsApp ? 'PDF Hazırlanıyor...' : 'WhatsApp ile Gönder (+ PDF)'}</span>
                </button>
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                İptal
              </button>

            </div>

          </form>
        )}

      </div>
    </div>
  );
};
