import React, { useState } from 'react';
import { Proposal, AppSettings } from '../types';
import { formatCurrency } from '../utils/formatters';
import { openDefaultMailClientWithPdf } from '../utils/mailClient';
import { Mail, Send, X, CheckCircle2, ExternalLink, Paperclip } from 'lucide-react';

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
  const [subject, setSubject] = useState(`${proposal.proposalNumber} - ${proposal.title}`);
  const [customMessage, setCustomMessage] = useState(
    `Sayın ${proposal.customer.name || proposal.customer.companyName},\n\n` +
    `Sizler için özenle hazırladığımız "${proposal.title}" başlıklı teklif belgemiz ve fiyatlandırma detaylarımız bilgilerinize sunulmuştur.`
  );
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sendResult, setSendResult] = useState<{ deliveryMethod?: string; testPreviewUrl?: string; errorMessage?: string } | null>(null);
  const [isOpeningMailClient, setIsOpeningMailClient] = useState(false);

  const handleOpenMailClient = async () => {
    setIsOpeningMailClient(true);
    try {
      const paperElement = document.getElementById('proposal-paper-container');
      await openDefaultMailClientWithPdf(proposal, paperElement, settings, toEmail, customMessage);
    } catch (err) {
      console.error('Mail client open error:', err);
    } finally {
      setIsOpeningMailClient(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await onSend(toEmail, subject, customMessage);
      setIsSending(false);
      setSendResult(res || {});
      setSentSuccess(true);
    } catch (err: any) {
      setIsSending(false);
      setSendResult({ errorMessage: err.message || 'Gönderim esnasında bir hata oluştu.' });
    }
  };

  const portalUrl = `${window.location.origin}${window.location.pathname}#/customer/teklif/${proposal.id}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-sm max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-blue-600 text-white flex items-center justify-center font-bold">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                Müşteriye Teklif E-Postası Gönder
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {proposal.proposalNumber} • {proposal.customer.companyName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-sm hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                E-Posta Gönderimi Başarılı!
              </h3>
              <p className="text-xs font-mono text-slate-600">
                Alıcı: <strong className="text-blue-600">{toEmail}</strong>
              </p>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Teklif e-postası ve online onay bağlantısı müşterinize iletildi. Müşteriniz e-postayı açıp teklifi onayladığında bildirim panelinizde anında görünecektir.
            </p>

            {sendResult?.testPreviewUrl && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-sm max-w-md mx-auto space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-blue-800 block">
                  🧪 Test Modu E-Posta Önizleme Bağlantısı (Ethereal)
                </span>
                <a
                  href={sendResult.testPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-xs text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Gönderilen HTML E-Postayı Gör (Test)</span>
                </a>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSentSuccess(false);
                  onClose();
                }}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-semibold border border-slate-800"
              >
                Kapat
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1 text-[10px]">
                  Alıcı E-Posta *
                </label>
                <input
                  type="email"
                  required
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm font-mono text-xs text-slate-900"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold text-slate-900"
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
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs leading-relaxed text-slate-800"
              />
            </div>

            {/* Email Visual Preview Card */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                Müşterinin Göreceği E-Posta Tasarımı Önizlemesi
              </label>
              
              <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 text-xs text-slate-800 space-y-3 font-sans">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-bold text-blue-600">TEKLİFPRO Teknoloji</span>
                  <span className="text-[10px] text-slate-400 font-mono">{proposal.proposalNumber}</span>
                </div>

                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700">
                  {customMessage}
                </p>

                {/* Offer Card inside Email */}
                <div className="bg-white p-3 rounded-sm border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{proposal.title}</div>
                    <div className="text-[11px] text-slate-500">Tutar: <strong className="font-mono text-slate-900">{formatCurrency(proposal.grandTotal, proposal.currency)}</strong></div>
                  </div>
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs border border-blue-500 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(portalUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Teklifi İncele & Onayla</span>
                  </a>
                </div>
              </div>
            </div>

            {/* PDF Attachment Info Banner */}
            <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-sm text-xs text-blue-900">
              <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Teklif PDF Belgesi:</strong> <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-950 font-bold">Teklif_{proposal.proposalNumber}.pdf</code> belgesi indirilecek ve mail programınız çalıştırılacaktır.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={isOpeningMailClient || isSending}
                onClick={handleOpenMailClient}
                className="w-full sm:w-auto px-4 py-2.5 rounded-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 border border-amber-400 shadow-xs transition-colors"
                title="Teklif PDF belgesini indirir ve bilgisayarınızdaki varsayılan mail uygulamasını (Outlook) çalıştırır"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{isOpeningMailClient ? 'Hazırlanıyor...' : 'Mail Programında Aç + PDF İndir (Outlook)'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-sm text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs border border-blue-500 flex items-center gap-2 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Gönderiliyor...' : 'Sunucudan Gönder (SMTP)'}</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
