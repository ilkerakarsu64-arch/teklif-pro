import React, { useState } from 'react';
import { Proposal, User } from '../types';
import { getUserPermissions } from '../utils/auth';
import { formatCurrency, formatDate, getStatusBadgeConfig } from '../utils/formatters';
import { createAndSaveVectorPdf } from '../utils/pdfDownloader';
import { 
  Search, 
  Plus, 
  Send, 
  Eye, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink,
  FileText,
  Mail,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react';

interface ProposalListProps {
  proposals: Proposal[];
  onSelectProposal: (id: string) => void;
  onNewProposal: () => void;
  onSendEmail: (proposal: Proposal) => void;
  onDeleteProposal: (id: string) => void;
  onOpenCustomerSimulatorFor: (proposal: Proposal) => void;
  currentUser: User | null;
}

export const ProposalList: React.FC<ProposalListProps> = ({
  proposals,
  onSelectProposal,
  onNewProposal,
  onSendEmail,
  onDeleteProposal,
  onOpenCustomerSimulatorFor,
  currentUser
}) => {
  const permissions = currentUser ? getUserPermissions(currentUser.role) : getUserPermissions('ADMIN');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingProposalId, setDeletingProposalId] = useState<string | null>(null);

  const proposalToDelete = proposals.find(p => p.id === deletingProposalId);

  // Filter logic
  const filteredProposals = proposals.filter((prop) => {
    const matchesSearch = 
      prop.proposalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.customer.companyName.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedStatus === 'ALL') return matchesSearch;
    return matchesSearch && prop.status === selectedStatus;
  });

  const copyCustomerLink = (prop: Proposal, e: React.MouseEvent) => {
    e.stopPropagation();
    const portalUrl = `${window.location.origin}${window.location.pathname}#/customer/teklif/${prop.id}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedId(prop.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs = [
    { id: 'ALL', label: 'Tüm Teklifler', count: proposals.length },
    { id: 'TASLAK', label: 'Taslak', count: proposals.filter(p => p.status === 'TASLAK').length },
    { id: 'GONDERILDI', label: 'Gönderildi', count: proposals.filter(p => p.status === 'GONDERILDI').length },
    { id: 'INCELENIYOR', label: 'İnceleniyor', count: proposals.filter(p => p.status === 'INCELENIYOR').length },
    { id: 'ONAYLANDI', label: 'Onaylandı', count: proposals.filter(p => p.status === 'ONAYLANDI').length },
    { id: 'REDDEDILDI', label: 'Reddedildi', count: proposals.filter(p => p.status === 'REDDEDILDI').length },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header & New Proposal Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Teklif Yönetim Kataloğu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hazırladığınız tüm teklifleri listeleyin, müşterilerinize e-posta atın ve canlı onay takip edin.
          </p>
        </div>

        {permissions.canCreateProposal && (
          <button
            onClick={onNewProposal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide transition-colors border border-blue-500 shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Teklif Oluştur</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-sm border border-slate-200 p-4 space-y-4">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                selectedStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-mono ${
                selectedStatus === tab.id
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Firma adı, teklif numarası veya proje başlığı ara..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-sm text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
          />
        </div>

      </div>

      {/* Proposals List Table */}
      <div className="bg-white rounded-sm border border-slate-200 overflow-hidden">
        {filteredProposals.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-sm bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3 border border-slate-200">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Teklif Bulunamadı</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Arama kriterlerinize uygun teklif bulunmuyor veya henüz teklif oluşturmadınız.
            </p>
            <button
              onClick={onNewProposal}
              className="mt-4 px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              + İlk Teklifi Oluştur
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Teklif No & Başlık</th>
                  <th className="py-3.5 px-6 font-semibold">Müşteri / Firma</th>
                  <th className="py-3.5 px-6 font-semibold">Tarih / Geçerlilik</th>
                  <th className="py-3.5 px-6 text-right font-semibold">Toplam Tutar</th>
                  <th className="py-3.5 px-6 text-center font-semibold">Durum</th>
                  <th className="py-3.5 px-6 text-right font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProposals.map((prop) => {
                  const badgeConfig = getStatusBadgeConfig(prop.status);

                  return (
                    <tr
                      key={prop.id}
                      onClick={() => onSelectProposal(prop.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Proposal No & Title */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-blue-600 font-mono text-xs">
                          {prop.proposalNumber}
                        </div>
                        <div className="font-semibold text-slate-900 mt-0.5 max-w-xs truncate">
                          {prop.title}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 truncate max-w-xs">
                          {prop.customer.companyName || prop.customer.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                          {prop.customer.email}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                        <div>{formatDate(prop.issueDate)}</div>
                        <div className="text-[11px] text-slate-400">
                          Son: {formatDate(prop.validUntilDate)}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(prop.grandTotal, prop.currency)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase border ${badgeConfig.bgColor} ${badgeConfig.textColor} ${badgeConfig.borderColor}`}>
                          {prop.status === 'ONAYLANDI' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {prop.status === 'REDDEDILDI' && <XCircle className="w-3.5 h-3.5" />}
                          {prop.status === 'INCELENIYOR' && <Eye className="w-3.5 h-3.5" />}
                          {prop.status === 'GONDERILDI' && <Send className="w-3.5 h-3.5" />}
                          {prop.status === 'TASLAK' && <FileText className="w-3.5 h-3.5" />}
                          <span>{badgeConfig.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Quick PDF Creation */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              createAndSaveVectorPdf(prop);
                            }}
                            title="Vektörel PDF Oluştur ve İndir"
                            className="p-1.5 rounded-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-colors"
                          >
                            <Download className="w-4 h-4 text-emerald-600" />
                          </button>

                          {/* Send Email */}
                          <button
                            onClick={() => onSendEmail(prop)}
                            title="Müşteriye e-posta gönder"
                            className="p-1.5 rounded-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          {/* Customer Portal Link */}
                          <button
                            onClick={(e) => copyCustomerLink(prop, e)}
                            title="Müşteri onay bağlantısını kopyala"
                            className="p-1.5 rounded-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-colors"
                          >
                            {copiedId === prop.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>

                          {/* Test / Simulator button */}
                          <button
                            onClick={() => onOpenCustomerSimulatorFor(prop)}
                            title="Müşteri onay/ret simülatörünü aç"
                            className="p-1.5 rounded-sm text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          {permissions.canDeleteProposal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingProposalId(prop.id);
                              }}
                              title="Teklifi Sil"
                              className="p-1.5 rounded-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProposalId && proposalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-sm bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Teklifi Silme Onayı</h3>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900 font-mono">{proposalToDelete.proposalNumber}</strong> numaralı &quot;{proposalToDelete.title}&quot; teklifi silinecektir. Bu işlem geri alınamaz.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingProposalId(null)}
                className="px-4 py-2 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProposal(proposalToDelete.id);
                  setDeletingProposalId(null);
                }}
                className="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                Evet, Teklifi Sil
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
