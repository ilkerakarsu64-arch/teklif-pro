import React from 'react';
import { Proposal, AppSettings, User } from '../types';
import { getUserPermissions } from '../utils/auth';
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeConfig } from '../utils/formatters';
import { 
  ArrowLeft, 
  Send, 
  Copy, 
  Check, 
  Printer, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  History,
  Zap,
  Trash2,
  Download
} from 'lucide-react';
import { downloadProposalPdf, createAndSaveVectorPdf } from '../utils/pdfDownloader';

interface ProposalDetailProps {
  proposal: Proposal;
  settings: AppSettings;
  onBack: () => void;
  onEdit: () => void;
  onSendEmail: () => void;
  onOpenCustomerSimulator: () => void;
  onDeleteProposal?: (id: string) => void;
  currentUser: User | null;
}

export const ProposalDetail: React.FC<ProposalDetailProps> = ({
  proposal,
  settings,
  onBack,
  onEdit,
  onSendEmail,
  onOpenCustomerSimulator,
  onDeleteProposal,
  currentUser
}) => {
  const permissions = currentUser ? getUserPermissions(currentUser.role) : getUserPermissions('ADMIN');
  const [copied, setCopied] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [downloadingPdf, setDownloadingPdf] = React.useState(false);
  const proposalPaperRef = React.useRef<HTMLDivElement>(null);

  const badgeConfig = getStatusBadgeConfig(proposal.status);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      if (proposalPaperRef.current) {
        await downloadProposalPdf(proposalPaperRef.current, `Teklif_${proposal.proposalNumber}`);
      } else {
        createAndSaveVectorPdf(proposal, settings);
      }
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Helper to render company branding header
  const renderHeaderBranding = (customTitle?: string) => (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
      <div>
        <div className="flex items-center gap-2.5">
          {settings.company.logoUrl ? (
            <div className="h-10 max-w-[150px] overflow-hidden rounded-sm flex items-center justify-center bg-slate-50 border border-slate-150 p-1">
              <img src={settings.company.logoUrl} alt="Logo" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 text-white font-bold flex items-center justify-center text-sm rounded-sm">
              {settings.company.logoText ? settings.company.logoText.slice(0, 3).toUpperCase() : 'PRO'}
            </div>
          )}
          <span className="font-bold text-xl text-slate-900 tracking-tighter">
            {settings.company.name || 'TEKLİFPRO DİJİTAL A.Ş.'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
          {settings.company.address || 'Maslak Mah. Büyükdere Cad. No: 245, Sarıyer / İstanbul'}<br />
          {settings.company.taxOffice ? `Vergi Dairesi: ${settings.company.taxOffice}` : ''} 
          {settings.company.taxNumber ? ` • VKN: ${settings.company.taxNumber}` : ''}
          {settings.company.phone ? ` • Tel: ${settings.company.phone}` : ''}
        </p>
      </div>

      <div className="text-right sm:text-right w-full sm:w-auto">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
          {customTitle || 'HİZMET TEKLİFİ'}
        </h1>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-slate-100 text-blue-600 font-mono font-bold text-sm border border-slate-200">
          {proposal.proposalNumber}
        </div>
        <div className="text-xs text-slate-500 mt-2 space-y-0.5 font-medium">
          <div>Teklif Tarihi: <strong>{formatDate(proposal.issueDate)}</strong></div>
          <div>Son Geçerlilik: <strong>{formatDate(proposal.validUntilDate)}</strong></div>
        </div>
      </div>
    </div>
  );

  // Helper to render customer info grid
  const renderCustomerGrid = (subjectTitle?: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-sm border border-slate-200">
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Müşteri / Firma Bilgileri</span>
        </h2>
        <div className="space-y-1">
          <div className="font-bold text-sm text-slate-900">
            {proposal.customer.companyName || proposal.customer.name}
          </div>
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Yetkili:</span> {proposal.customer.name}
          </div>
          <div className="text-xs text-slate-600 flex items-center gap-1.5 font-mono">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {proposal.customer.email}
          </div>
          {proposal.customer.phone && (
            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {proposal.customer.phone}
            </div>
          )}
          {proposal.customer.address && (
            <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {proposal.customer.address}
            </div>
          )}
        </div>
      </div>

      <div className="sm:text-right flex flex-col justify-between space-y-3">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Teklif Konusu & Durumu
          </h2>
          <div className="font-bold text-sm text-blue-700">
            {subjectTitle || proposal.title}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Para Birimi: <strong className="text-slate-900">{proposal.currency || 'TRY'}</strong>
          </div>
        </div>

        <div className="mt-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-bold border uppercase tracking-wider ${badgeConfig.bgColor} ${badgeConfig.textColor} ${badgeConfig.borderColor}`}>
            <span>Durum:</span>
            <span>{badgeConfig.label}</span>
          </span>
        </div>
      </div>
    </div>
  );

  // Helper to render signature block
  const renderSignaturesBlock = () => (
    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs print:break-inside-avoid">
      <div>
        <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">Teklifi Sunan</div>
        <div className="text-slate-500 font-medium">{settings.company.name || 'TEKLİFPRO Dijital A.Ş.'}</div>
        <div className="h-12 flex items-center justify-center font-mono italic text-blue-900 font-bold text-sm">
          [İmza / Kaşe]
        </div>
      </div>
      <div>
        <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">Müşteri Onayı</div>
        <div className="text-slate-500 font-medium">{proposal.customer.companyName || proposal.customer.name}</div>
        <div className="h-12 flex items-center justify-center font-mono italic text-emerald-700 font-bold text-sm">
          {proposal.customerSignature ? `✓ ${proposal.customerSignature}` : '______'}
        </div>
      </div>
    </div>
  );

  // Normalize devices so every proposal renders devices separately in screen and PDF/Print output
  const displayDevices = (proposal.devices && proposal.devices.length > 0)
    ? proposal.devices
    : [
        {
          id: 'dev-1',
          receiptNo: proposal.receiptNo || '',
          modelCode: proposal.modelCode || '',
          serialNo: proposal.serialNo || '',
          items: proposal.items?.map(i => ({
            id: i.id,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit
          })) || [],
          deviceTotal: proposal.grandTotal || proposal.subtotal || 0
        }
      ];

  const copyCustomerLink = () => {
    const portalUrl = `${window.location.origin}${window.location.pathname}#/customer/teklif/${proposal.id}`;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:max-w-none print:p-0">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-300 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Teklif Listesine Dön</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={onOpenCustomerSimulator}
            className="px-3.5 py-2 rounded-sm bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Müşteri onay/ret simülasyonunu başlat ve bildirimi test et"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Müşteri Gözünden Test Et</span>
          </button>

          <button
            onClick={copyCustomerLink}
            className="px-3.5 py-2 rounded-sm bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Kopyalandı!' : 'Müşteri Bağlantısı'}</span>
          </button>

          <button
            onClick={onSendEmail}
            className="px-3.5 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors border border-blue-500"
          >
            <Send className="w-4 h-4" />
            <span>E-posta Gönder</span>
          </button>

          {permissions.canEditProposal && (
            <button
              onClick={onEdit}
              className="px-3.5 py-2 rounded-sm bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Düzenle</span>
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="px-3.5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors border border-emerald-500 disabled:opacity-50"
            title="Teklifi PDF dosyası olarak bilgisayara indir"
          >
            <Download className="w-4 h-4 text-white" />
            <span>{downloadingPdf ? 'Hazırlanıyor...' : 'PDF İndir'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-sm bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors border border-slate-800"
          >
            <Printer className="w-4 h-4" />
            <span>Yazdır / PDF</span>
          </button>

          {permissions.canDeleteProposal && onDeleteProposal && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-2 rounded-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Teklifi Sil"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Sil</span>
            </button>
          )}

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-sm bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Teklifi Silme Onayı</h3>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900 font-mono">{proposal.proposalNumber}</strong> numaralı &quot;{proposal.title}&quot; teklifi silinecektir. Bu işlem geri alınamaz.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteProposal) {
                    onDeleteProposal(proposal.id);
                  }
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                Evet, Teklifi Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Response Status Banner */}
      {proposal.status === 'ONAYLANDI' && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-sm p-5 text-emerald-900 shadow-xs print:hidden">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-emerald-800 uppercase tracking-wider">
                ✓ MÜŞTERİ BU TEKLİFİ ONAYLADI
              </h3>
              <p className="text-xs text-emerald-700">
                Onay Zamanı: <strong>{formatDateTime(proposal.respondedAt)}</strong> • Onaylayan: <strong>{proposal.customerSignature || proposal.customer.name}</strong>
              </p>
              {proposal.customerResponseNote && (
                <div className="mt-2 p-3 bg-white rounded-sm border border-emerald-200 text-xs text-slate-800 italic">
                  Müşteri Notu: &quot;{proposal.customerResponseNote}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {proposal.status === 'REDDEDILDI' && (
        <div className="bg-rose-50 border-l-4 border-rose-500 rounded-r-sm p-5 text-rose-900 shadow-xs print:hidden">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-rose-800 uppercase tracking-wider">
                ✕ MÜŞTERİ BU TEKLİFİ REDDETTİ
              </h3>
              <p className="text-xs text-rose-700">
                Yanıt Tarihi: <strong>{formatDateTime(proposal.respondedAt)}</strong>
              </p>
              {proposal.rejectionReason && (
                <div className="mt-2 p-3 bg-white rounded-sm border border-rose-200 text-xs text-slate-800 italic">
                  Red Nedeni: &quot;{proposal.rejectionReason}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Printed Proposal Paper Document */}
      <div id="proposal-paper-container" ref={proposalPaperRef} className="bg-white text-slate-900 rounded-sm border border-slate-200 shadow-sm p-8 sm:p-12 space-y-8 print:shadow-none print:border-none print:p-0">
        
        {/* Header Branding */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-200 pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {settings.company.logoUrl ? (
                <div className="h-12 max-w-[180px] overflow-hidden rounded-md flex items-center justify-center bg-white border border-slate-200 p-1.5 shadow-2xs">
                  <img src={settings.company.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-blue-600 text-white font-bold flex items-center justify-center text-base rounded-md shadow-xs">
                  {settings.company.logoText ? settings.company.logoText.slice(0, 3).toUpperCase() : 'PRO'}
                </div>
              )}
              <div>
                <span className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Kurumsal Hizmet Sağlayıcı</span>
                <span className="font-black text-xl text-slate-900 tracking-tight uppercase">
                  {settings.company.name || 'TEKLİFPRO DİJİTAL A.Ş.'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-650 font-medium">
              <div className="max-w-xs leading-relaxed">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Adres</span>
                {settings.company.address || 'Maslak Mah. Büyükdere Cad. No: 245, Sarıyer / İstanbul'}
              </div>
              <div className="space-y-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">İletişim & Vergi</span>
                  {settings.company.phone && <div>Tel: <span className="font-mono text-slate-800 font-semibold">{settings.company.phone}</span></div>}
                  {settings.company.email && <div>E-posta: <span className="font-mono text-slate-800 font-semibold">{settings.company.email}</span></div>}
                  {settings.company.taxOffice && (
                    <div className="text-[11px] mt-1 text-slate-500">
                      {settings.company.taxOffice} V.D. • VKN: <span className="font-mono font-bold text-slate-700">{settings.company.taxNumber || '-'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right w-full md:w-auto flex flex-col items-start md:items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Resmi Teklif Belgesi</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mt-0.5">
              HİZMET TEKLİFİ
            </h1>
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-blue-50 text-blue-700 font-mono font-bold text-sm border border-blue-200/50 shadow-2xs">
              {proposal.proposalNumber}
            </div>
            <div className="text-xs text-slate-600 mt-3 space-y-1 font-semibold md:text-right">
              <div>Düzenleme Tarihi: <strong className="text-slate-900">{formatDate(proposal.issueDate)}</strong></div>
              <div>Son Geçerlilik: <strong className="text-slate-900">{formatDate(proposal.validUntilDate)}</strong></div>
            </div>
          </div>
        </div>

        {/* Customer & Proposal Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-md border-l-4 border-l-blue-600 border border-slate-200 shadow-2xs">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>MÜŞTERİ / ALICI BİLGİLERİ</span>
            </h2>
            <div className="space-y-1.5">
              <div className="font-black text-sm text-slate-950 uppercase tracking-wide">
                {proposal.customer.companyName || proposal.customer.name}
              </div>
              <div className="text-xs text-slate-650 font-medium">
                <span className="text-slate-500">Yetkili / Alıcı:</span> <strong className="text-slate-800">{proposal.customer.name}</strong>
              </div>
              <div className="text-xs text-slate-650 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{proposal.customer.email}</span>
              </div>
              {proposal.customer.phone && (
                <div className="text-xs text-slate-650 flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{proposal.customer.phone}</span>
                </div>
              )}
              {proposal.customer.address && (
                <div className="text-xs text-slate-650 flex items-start gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{proposal.customer.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="sm:text-right flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                TEKLİF KAPSAMI VE DURUMU
              </h2>
              <div className="font-extrabold text-sm text-blue-800 uppercase tracking-wide">
                {proposal.title}
              </div>
              <div className="text-xs text-slate-650 mt-1.5 font-semibold">
                Ödeme Para Birimi: <strong className="text-slate-900 font-mono">{proposal.currency || 'TRY'}</strong>
              </div>
            </div>

            <div className="pt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-bold border uppercase tracking-wider ${badgeConfig.bgColor} ${badgeConfig.textColor} ${badgeConfig.borderColor} shadow-2xs`}>
                <span>Teklif Durumu:</span>
                <span>{badgeConfig.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Devices Section - Exact match with ProposalForm device layout */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              Cihazlar ve Hizmet Detayları ({displayDevices.length} Cihaz)
            </h2>
            <span className="text-[11px] font-mono font-semibold text-slate-500 print:hidden">
              Her cihaz ayrı kart olarak basılır
            </span>
          </div>

          {displayDevices.map((device, devIdx) => (
            <div 
              key={device.id || devIdx} 
              className="device-print-card border border-slate-350 rounded-sm overflow-hidden bg-white shadow-xs mb-6 print:shadow-none print:break-inside-avoid print:mb-6"
            >
              {/* Card Header */}
              <div className="device-header-print bg-slate-100 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-sm bg-slate-900 text-white font-mono font-black text-xs print:bg-black print:text-white">
                    CİHAZ #{devIdx + 1}
                  </span>
                  <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                    {device.modelCode ? `CİHAZ #${devIdx + 1} - ${device.modelCode}` : `CİHAZ #${devIdx + 1}`}
                  </span>
                </div>

                <div className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-xs border border-slate-200">
                  Cihaz Kaydı #{devIdx + 1}
                </div>
              </div>

              {/* Device Metadata Grid: FİŞ NO, MODEL KODU, SERİ NO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 border-b border-slate-200 text-xs font-mono">
                <div className="bg-white p-2.5 border border-slate-200 rounded-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                    FİŞ NO
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {device.receiptNo || '-'}
                  </span>
                </div>

                <div className="bg-white p-2.5 border border-slate-200 rounded-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                    MODEL KODU
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {device.modelCode || '-'}
                  </span>
                </div>

                <div className="bg-white p-2.5 border border-slate-200 rounded-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                    SERİ NO
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    {device.serialNo || '-'}
                  </span>
                </div>
              </div>

              {/* Service & Product Items Table */}
              <div className="p-4 space-y-3 bg-white">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 w-20 text-center">SIRA</th>
                      <th className="py-2.5 px-4">HIZMET / İŞLEM AÇIKLAMASI</th>
                      <th className="py-2.5 px-4 w-32 text-center">MİKTAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {device.items.map((item, itemIdx) => (
                      <tr key={item.id || itemIdx} className={itemIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-500 bg-slate-50/80">
                          #{devIdx + 1}.{itemIdx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                          {item.description || 'Hizmet / Bakım Detayı'}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold font-mono text-slate-800">
                          {item.quantity} {item.unit || 'Adet'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {device.deviceNote && (
                  <div className="p-3 bg-blue-50/60 border-l-2 border-blue-500 rounded-r-xs text-xs text-slate-800 mb-3 whitespace-pre-line">
                    <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider mb-0.5">Cihaz Notu & Açıklama:</span>
                    {device.deviceNote}
                  </div>
                )}

                {/* Cihaz Genel Toplamı */}
                <div className="flex justify-end pt-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs shadow-2xs font-extrabold uppercase text-slate-700 tracking-wider">
                    <span>CIHAZ GENEL TOPLAMI:</span>
                    <span className="font-mono font-black text-blue-900 text-sm">
                      {formatCurrency(device.deviceTotal || 0, proposal.currency)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>



        {/* OVERALL PROPOSAL GRAND TOTAL BANNER */}
        <div className="bg-slate-900 text-white p-5 rounded-sm border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
              TEKLİF GENEL TOPLAMI
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {displayDevices.length > 1
                ? `Toplam ${displayDevices.length} adet cihazın servis ve hizmet bedeli dahil genel tutarıdır.`
                : 'Teklif kapsamındaki tüm işlemlerin genel tutarıdır.'}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono text-emerald-400">
              {formatCurrency(proposal.grandTotal, proposal.currency)}
            </div>
          </div>
        </div>

        {/* Payment Terms & Proposal Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Payment Terms */}
          <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 space-y-1.5 text-xs">
            <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px] text-slate-500">
              Ödeme Koşulları & Şartlar
            </div>
            <p className="whitespace-pre-line leading-relaxed text-slate-700 font-mono">
              {proposal.paymentTerms || '%50 Peşin Siparişte, %50 Teslimat ve Onay Sonrasında'}
            </p>
          </div>

          {/* Proposal Notes / Intro Letter */}
          <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 space-y-1.5 text-xs">
            <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px] text-slate-500">
              Teklif Notu & Sunuş Mektubu
            </div>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">
              {proposal.notes || 'Fiyatlarımıza sunucu kurulumu ve 1 yıllık teknik bakım desteği dahildir.'}
            </p>
          </div>

        </div>

        {/* Signatures */}
        {renderSignaturesBlock()}

      </div>

      {/* History Log Timeline */}
      <div className="bg-white rounded-sm border border-slate-200 p-6 space-y-4 print:hidden">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          <span>Teklif Geçmişi & Müşteri Etkileşim Logları</span>
        </h3>

        <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 ml-2">
          {proposal.history.map((log) => (
            <div key={log.id} className="relative group">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-sm bg-blue-600 ring-4 ring-white" />
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.date}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-semibold">
                    {log.actor}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">{log.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
