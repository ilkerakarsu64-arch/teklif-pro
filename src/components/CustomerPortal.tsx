import React, { useState, useEffect } from 'react';
import { Proposal } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  CheckCircle2, 
  XCircle, 
  X,
  Printer,
  Building2,
  Mail,
  Download
} from 'lucide-react';
import { downloadProposalPdf } from '../utils/pdfDownloader';

interface CustomerPortalProps {
  proposalId: string;
  onApproveSuccess?: () => void;
  onRejectSuccess?: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  proposalId,
  onApproveSuccess,
  onRejectSuccess
}) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Form Inputs
  const [approvalNote, setApprovalNote] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [responseSubmitted, setResponseSubmitted] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const proposalPaperRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!proposal) return;
    setDownloadingPdf(true);
    try {
      await downloadProposalPdf(proposalPaperRef.current, `Teklif_${proposal.proposalNumber}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Fetch proposal details & trigger view notification
  useEffect(() => {
    async function loadPortalData() {
      try {
        setLoading(true);
        // Trigger viewed endpoint
        await fetch(`/api/proposals/${proposalId}/view`, { method: 'POST' });

        // Fetch proposal
        const res = await fetch(`/api/proposals/${proposalId}`);
        if (!res.ok) throw new Error('Teklif bulunamadı veya bağlantı süresi dolmuş.');
        const data = await res.json();
        setProposal(data);
        if (data.customer?.name) {
          setSignatureName(data.customer.name);
        }

        // Fetch settings
        try {
          const settingsRes = await fetch('/api/settings');
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setSettings(settingsData);
          }
        } catch (settingsErr) {
          console.error('Settings load error:', settingsErr);
        }
      } catch (err: any) {
        setError(err.message || 'Teklif yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    }

    if (proposalId) {
      loadPortalData();
    }
  }, [proposalId]);

  const handleApprove = async () => {
    if (!proposal) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/proposals/${proposal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: approvalNote,
          signatureName: signatureName || proposal.customer.name
        })
      });

      if (!res.ok) throw new Error('Onay işlemi sırasında hata oluştu.');
      const data = await res.json();
      setProposal(data.proposal);
      setResponseSubmitted('APPROVED');
      setShowApprovalModal(false);
      if (onApproveSuccess) onApproveSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!proposal) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/proposals/${proposal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason || 'Müşteri tarafından reddedildi' })
      });

      if (!res.ok) throw new Error('Red kaydı sırasında hata oluştu.');
      const data = await res.json();
      setProposal(data.proposal);
      setResponseSubmitted('REJECTED');
      setShowRejectionModal(false);
      if (onRejectSuccess) onRejectSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-mono">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent animate-spin mx-auto rounded-sm" />
          <p className="text-xs text-slate-400 uppercase tracking-widest">Müşteri Teklif Portalı Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-mono">
        <div className="max-w-md bg-slate-800 p-6 rounded-sm border border-slate-700 text-center space-y-3">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold uppercase tracking-wider">Bağlantı Geçersiz</h2>
          <p className="text-xs text-slate-400">{error || 'İstenen teklif sistemde bulunamadı.'}</p>
        </div>
      </div>
    );
  }

  const isResponded = proposal.status === 'ONAYLANDI' || proposal.status === 'REDDEDILDI';

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

  // Helper to render company branding header
  const renderHeaderBranding = (customTitle?: string) => (
    <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-200 pb-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {settings?.company?.logoUrl ? (
            <div className="h-12 max-w-[180px] overflow-hidden rounded-md flex items-center justify-center bg-white border border-slate-200 p-1.5 shadow-2xs">
              <img src={settings.company.logoUrl} alt="Logo" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-blue-600 text-white font-bold flex items-center justify-center text-base rounded-md shadow-xs">
              {settings?.company?.logoText ? settings.company.logoText.slice(0, 3).toUpperCase() : 'PRO'}
            </div>
          )}
          <div>
            <span className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Kurumsal Hizmet Sağlayıcı</span>
            <span className="font-black text-xl text-slate-900 tracking-tight uppercase">
              {settings?.company?.name || 'TEKLİFPRO DİJİTAL A.Ş.'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-650 font-medium">
          <div className="max-w-xs leading-relaxed">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">Adres</span>
            {settings?.company?.address || 'Maslak Mah. Büyükdere Cad. No: 245, Sarıyer / İstanbul'}
          </div>
          <div className="space-y-1">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">İletişim & Vergi</span>
              {settings?.company?.phone && <div>Tel: <span className="font-mono text-slate-800 font-semibold">{settings.company.phone}</span></div>}
              {settings?.company?.email && <div>E-posta: <span className="font-mono text-slate-800 font-semibold">{settings.company.email}</span></div>}
            </div>
          </div>
        </div>
      </div>

      <div className="text-left md:text-right w-full md:w-auto flex flex-col items-start md:items-end">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Müşteri Onay Portalı</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mt-0.5">
          {customTitle || 'HİZMET TEKLİFİ'}
        </h1>
        <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-blue-50 text-blue-700 font-mono font-bold text-sm border border-blue-200/50 shadow-2xs">
          {proposal?.proposalNumber}
        </div>
        <div className="text-xs text-slate-600 mt-3 space-y-1 font-semibold md:text-right">
          <div>Teklif Tarihi: <strong className="text-slate-900">{formatDate(proposal?.issueDate)}</strong></div>
          <div>Son Geçerlilik: <strong className="text-slate-900">{formatDate(proposal?.validUntilDate)}</strong></div>
        </div>
      </div>
    </div>
  );

  // Helper to render customer info grid
  const renderCustomerGrid = (subjectTitle?: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-md border-l-4 border-l-blue-600 border border-slate-200 shadow-2xs">
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>MÜŞTERİ / ALICI BİLGİLERİ</span>
        </h2>
        <div className="space-y-1.5">
          <div className="font-black text-sm text-slate-955 uppercase tracking-wide">
            {proposal?.customer?.companyName || proposal?.customer?.name}
          </div>
          <div className="text-xs text-slate-655 font-medium">
            <span className="text-slate-500">Yetkili / Alıcı:</span> <strong className="text-slate-800">{proposal?.customer?.name}</strong>
          </div>
          <div className="text-xs text-slate-655 flex items-center gap-1.5 font-mono">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{proposal?.customer?.email}</span>
          </div>
        </div>
      </div>

      <div className="sm:text-right flex flex-col justify-between space-y-4">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            TEKLİF KAPSAMI VE DURUMU
          </h2>
          <div className="font-extrabold text-sm text-blue-800 uppercase tracking-wide">
            {subjectTitle || proposal?.title}
          </div>
          <div className="text-xs text-slate-655 mt-1.5 font-semibold font-mono">
            Durum: <span className="text-blue-600 font-bold">{proposal?.status}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper to render signature block
  const renderSignaturesBlock = () => (
    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs print:break-inside-avoid">
      <div>
        <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">Teklifi Sunan</div>
        <div className="text-slate-500 font-medium">{settings?.company?.name || 'TEKLİFPRO Dijital A.Ş.'}</div>
        <div className="h-12 flex items-center justify-center font-mono italic text-blue-900 font-bold text-sm">
          [İmza / Kaşe]
        </div>
      </div>
      <div>
        <div className="font-bold text-slate-900 uppercase tracking-wide text-[10px]">Müşteri Onayı</div>
        <div className="text-slate-500 font-medium">{proposal?.customer?.companyName || proposal?.customer?.name}</div>
        <div className="h-12 flex items-center justify-center font-mono italic text-emerald-700 font-bold text-sm">
          {proposal?.status === 'ONAYLANDI' ? '✓ ONAYLANDI' : '______'}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 font-sans">
      
      {/* Container */}
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Branding & Customer Notice */}
        <div className="bg-slate-900 text-white rounded-sm p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-3">
            {settings?.company?.logoUrl ? (
              <div className="h-9 max-w-[120px] overflow-hidden rounded-sm flex items-center justify-center bg-slate-800 p-1">
                <img src={settings.company.logoUrl} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-sm bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                {settings?.company?.logoText ? settings.company.logoText.slice(0, 3).toUpperCase() : 'PRO'}
              </div>
            )}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 font-mono">
                Müşteri Teklif Onay Portalı
              </div>
              <h1 className="text-base font-bold text-white">
                {proposal.customer.companyName || proposal.customer.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3.5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-emerald-500 transition-colors print:hidden shadow-xs disabled:opacity-50"
              title="Teklifi PDF olarak indir"
            >
              <Download className="w-4 h-4 text-white" />
              <span>{downloadingPdf ? 'İndiriliyor...' : 'PDF İndir'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-sm bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors print:hidden"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>PDF / Yazdır</span>
            </button>

            <div className="text-right text-xs text-slate-400 font-mono">
              <div>Teklif No: <strong className="text-white">{proposal.proposalNumber}</strong></div>
              <div>Geçerlilik: <strong className="text-amber-400">{formatDate(proposal.validUntilDate)}</strong></div>
            </div>
          </div>
        </div>

        {/* Response Feedback Banners */}
        {(proposal.status === 'ONAYLANDI' || responseSubmitted === 'APPROVED') && (
          <div className="bg-emerald-600 text-white p-5 rounded-sm shadow-xs flex items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 shrink-0 text-emerald-200" />
              <div>
                <h3 className="font-bold text-base uppercase tracking-wider">✓ BU TEKLİF ONAYLANMIŞTIR</h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Onayınız tedarikçi firmaya anlık olarak bildirildi. Proje süreci başlatılacaktır.
                </p>
                {proposal.customerResponseNote && (
                  <p className="text-xs italic mt-1 bg-emerald-700/60 p-2 rounded-sm text-emerald-50">
                    Notunuz: &quot;{proposal.customerResponseNote}&quot;
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(proposal.status === 'REDDEDILDI' || responseSubmitted === 'REJECTED') && (
          <div className="bg-rose-600 text-white p-5 rounded-sm shadow-xs flex items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 shrink-0 text-rose-200" />
              <div>
                <h3 className="font-bold text-base uppercase tracking-wider">✕ TEKLİF REDDEDİLDİ</h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Geri bildiriminiz tedarikçi firmaya iletildi.
                </p>
                {proposal.rejectionReason && (
                  <p className="text-xs italic mt-1 bg-rose-700/60 p-2 rounded-sm text-rose-50">
                    Red Nedeni: &quot;{proposal.rejectionReason}&quot;
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Proposal Document Body */}
        <div ref={proposalPaperRef} className="bg-white rounded-sm border border-slate-200 p-8 shadow-sm space-y-6 print:shadow-none print:border-none print:p-0">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              {settings?.company?.logoUrl ? (
                <div className="h-9 max-w-[120px] overflow-hidden rounded-sm flex items-center justify-center bg-slate-805 p-1">
                  <img src={settings.company.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-sm bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                  {settings?.company?.logoText ? settings.company.logoText.slice(0, 3).toUpperCase() : 'PRO'}
                </div>
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 font-mono">
                  Müşteri Teklif Onay Portalı
                </div>
                <h1 className="text-sm font-bold text-slate-850 uppercase">
                  {settings?.company?.name || 'TEKLİFPRO DİJİTAL A.Ş.'}
                </h1>
              </div>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto">
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">{proposal.title}</h2>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                Teklif No: <strong className="text-slate-950">{proposal.proposalNumber}</strong> • Düzenlenme: <strong>{formatDate(proposal.issueDate)}</strong>
              </div>
            </div>
          </div>

          {/* Customer & Subject info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-sm border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Müşteri Bilgileri</span>
              <strong className="text-slate-900 text-xs">{proposal.customer.companyName || proposal.customer.name}</strong>
              <div className="text-slate-650 mt-0.5">Yetkili: {proposal.customer.name} • {proposal.customer.email}</div>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Para Birimi / Son Geçerlilik</span>
              <strong className="text-slate-900 text-xs">{proposal.currency || 'TRY'}</strong>
              <div className="text-slate-650 mt-0.5">Geçerlilik Tarihi: {formatDate(proposal.validUntilDate)}</div>
            </div>
          </div>

          {/* Devices Section - Exact match with ProposalForm device layout */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Cihazlar ve Hizmet Detayları ({displayDevices.length} Cihaz)
              </h2>
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

                {/* Device Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 border-b border-slate-200 text-xs font-mono">
                  <div className="bg-white p-2.5 border border-slate-200 rounded-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">FİŞ NO</span>
                    <span className="font-bold text-slate-900 text-xs">{device.receiptNo || '-'}</span>
                  </div>
                  <div className="bg-white p-2.5 border border-slate-200 rounded-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">MODEL KODU</span>
                    <span className="font-bold text-slate-900 text-xs">{device.modelCode || '-'}</span>
                  </div>
                  <div className="bg-white p-2.5 border border-slate-200 rounded-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">SERİ NO</span>
                    <span className="font-bold text-slate-900 text-xs">{device.serialNo || '-'}</span>
                  </div>
                </div>

                {/* Service Items Table */}
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

        {/* Action Buttons Box */}
        {!isResponded ? (
          <div className="bg-white p-6 rounded-sm border-l-4 border-l-blue-600 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900 block text-sm uppercase tracking-wider">
                Teklifi Yanıtlayın
              </span>
              Teklifi onayladığınızda veya reddettiğinizde tedarikçi firmaya anında bildirim iletilecektir.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowRejectionModal(true)}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-sm bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Teklifi Reddet</span>
              </button>

              <button
                onClick={() => setShowApprovalModal(true)}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-500 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Teklifi Onayla</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-sm border border-slate-200 font-mono">
            Bu teklif yanıtlanmıştır. İşlem geçmişi kayıt altına alınmıştır.
          </div>
        )}

      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Teklifi Onayla</span>
              </h3>
              <button onClick={() => setShowApprovalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{proposal.proposalNumber}</strong> numaralı ve <strong>{formatCurrency(proposal.grandTotal, proposal.currency)}</strong> tutarındaki teklifi onaylamak üzeresiniz.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1 text-[10px]">
                  Onaylayan Adı / Yetkili İmza
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm font-semibold text-slate-900"
                  placeholder="Ad Soyad"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1 text-[10px]">
                  Ek Müşteri Notu (İsteğe Bağlı)
                </label>
                <textarea
                  rows={3}
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-slate-800"
                  placeholder="Örn: Teklif şartlarını kabul ediyoruz, sözleşmeyi gönderebilirsiniz."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-sm text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                Vazgeç
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-500 shadow-xs"
              >
                {submitting ? 'İşleniyor...' : 'Onayı Tamamla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Teklifi Reddet</span>
              </h3>
              <button onClick={() => setShowRejectionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Lütfen tedarikçi firmanın durumdan haberdar olması ve revize edebilmesi için red nedeninizi belirtin.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1 text-[10px]">
                  Red Nedeni / Açıklama *
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-slate-800"
                  placeholder="Örn: Bütçemiz bu proje için yetersiz kalmaktadır veya teslim süresi uzundur."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 rounded-sm text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                Vazgeç
              </button>
              <button
                onClick={handleReject}
                disabled={submitting || !rejectionReason}
                className="px-5 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs border border-rose-500 shadow-xs disabled:opacity-50"
              >
                {submitting ? 'İşleniyor...' : 'Teklifi Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
