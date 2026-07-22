import React, { useState } from 'react';
import { Proposal, AppSettings } from '../types';
import { formatCurrency, getPublicPortalUrl } from '../utils/formatters';
import { openDefaultMailClientWithPdf } from '../utils/mailClient';
import { Mail, X, CheckCircle2, ExternalLink, Paperclip, Check } from 'lucide-react';

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
  const [isSaving, setIsSaving] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isOpeningMailClient, setIsOpeningMailClient] = useState(false);

  if (!isOpen) return null;

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
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                Müşteriye Teklif E-Postası Hazırla
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
                E-Posta Durumu & Kaydı Güncellendi!
              </h3>
              <p className="text-xs font-mono text-slate-600">
                Alıcı: <strong className="text-blue-600">{toEmail}</strong>
              </p>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Teklif durumu <strong>Gönderildi</strong> olarak güncellendi. Mail uygulamanızdan gönderilen teklif müşteriniz tarafından incelendiğinde bildirim panelinizde anında görünecektir.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1 text-[10px]">
                  Alıcı E-Posta Adresi *
                </label>
                <input
                  type="email"
                  required
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-600"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
                Müşterinizin Göreceği E-Posta Önizlemesi
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
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Teklifi İncele & Onayla</span>
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

            {/* PDF Attachment Info Banner */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Teklif PDF Belgesi:</strong> <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-950 font-bold">Teklif_{proposal.proposalNumber}.pdf</code> belgesi bilgisayarınıza indirilir ve yerel mail programınız (Outlook vb.) çalıştırılır.
              </span>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-200">
              
              {/* Button 1: Open Default Computer Desktop Mail App (Outlook etc.) */}
              <button
                type="button"
                disabled={isOpeningMailClient || isSaving}
                onClick={handleOpenMailClient}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 border border-amber-400 shadow-xs transition-colors cursor-pointer active:scale-95"
                title="Bilgisayarınızda yüklü olan varsayılan e-posta uygulamasını (Outlook vb.) çalıştırır"
              >
                <Mail className="w-4 h-4 text-slate-950" />
                <span>{isOpeningMailClient ? 'Mail Programı Hazırlanıyor...' : 'Mail Programını Aç + PDF İndir (Outlook vb.)'}</span>
              </button>

              {/* Button 2: Save as Sent / Save Draft */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border border-blue-500 flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Kaydediliyor...' : 'Gönderildi / Taslak Olarak Kaydet'}</span>
                </button>
              </div>

            </div>

          </form>
        )}

      </div>
    </div>
  );
};
