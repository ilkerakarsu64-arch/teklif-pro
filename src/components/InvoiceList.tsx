import React, { useState, useMemo } from 'react';
import { Invoice, Customer, Proposal } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Receipt, 
  Search, 
  Filter, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Printer, 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign,
  Trash2,
  Edit,
  ArrowRight,
  TrendingUp,
  X,
  Sparkles,
  FileCheck,
  Plus
} from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  customers: Customer[];
  proposals: Proposal[];
  onSaveInvoice: (invoice: Partial<Invoice>) => void;
  onDeleteInvoice: (id: string) => void;
  onSelectProposal?: (id: string) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  customers,
  proposals,
  onSaveInvoice,
  onDeleteInvoice,
  onSelectProposal
}) => {
  // Main Sub-Tab: 'approved_proposals' (Onaylanan Teklifler) vs 'all_invoices' (Tüm Faturalar)
  const [activeSubTab, setActiveSubTab] = useState<'approved_proposals' | 'all_invoices'>('approved_proposals');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<'TRY' | 'USD' | 'EUR' | 'GBP'>('TRY');
  const [status, setStatus] = useState<'BEKLIYOR' | 'ODENDI' | 'GECTI' | 'IPTAL'>('BEKLIYOR');
  const [notes, setNotes] = useState('');

  // -------------------------------------------------------------
  // Approved Proposals Calculation & Invoicing Status
  // -------------------------------------------------------------
  const approvedProposals = useMemo(() => {
    return proposals.filter(p => p.status === 'ONAYLANDI');
  }, [proposals]);

  const approvedProposalsWithInvoiceStatus = useMemo(() => {
    return approvedProposals.map(prop => {
      const linkedInv = invoices.find(inv => inv.proposalId === prop.id || inv.proposalNumber === prop.proposalNumber);
      return {
        proposal: prop,
        invoice: linkedInv || null,
        isInvoiced: !!linkedInv
      };
    });
  }, [approvedProposals, invoices]);

  const filteredApprovedProposals = useMemo(() => {
    return approvedProposalsWithInvoiceStatus.filter(item => {
      const prop = item.proposal;
      const custName = prop.customer?.companyName || prop.customer?.name || '';
      const matchesSearch = 
        prop.proposalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        custName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [approvedProposalsWithInvoiceStatus, searchTerm]);

  // Approved proposals stats
  const approvedStats = useMemo(() => {
    const totalCount = approvedProposalsWithInvoiceStatus.length;
    const invoicedCount = approvedProposalsWithInvoiceStatus.filter(i => i.isInvoiced).length;
    const pendingInvoicingCount = totalCount - invoicedCount;

    const totalApprovedAmount = approvedProposalsWithInvoiceStatus.reduce((sum, i) => sum + i.proposal.grandTotal, 0);
    const invoicedAmount = approvedProposalsWithInvoiceStatus
      .filter(i => i.isInvoiced)
      .reduce((sum, i) => sum + i.proposal.grandTotal, 0);
    const pendingInvoicedAmount = totalApprovedAmount - invoicedAmount;

    return {
      totalCount,
      invoicedCount,
      pendingInvoicingCount,
      totalApprovedAmount,
      invoicedAmount,
      pendingInvoicedAmount
    };
  }, [approvedProposalsWithInvoiceStatus]);

  // Filtered All Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const custName = inv.customer?.companyName || inv.customer?.name || '';
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.proposalNumber && inv.proposalNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchesCurrency = currencyFilter === 'ALL' || inv.currency === currencyFilter;

      return matchesSearch && matchesStatus && matchesCurrency;
    });
  }, [invoices, searchTerm, statusFilter, currencyFilter]);

  // Overall Financial Stats for Invoices
  const invoiceStats = useMemo(() => {
    const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + i.amount, 0);
    const paidInvoices = filteredInvoices.filter(i => i.status === 'ODENDI');
    const totalPaid = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
    
    const pendingInvoices = filteredInvoices.filter(i => i.status === 'BEKLIYOR');
    const totalPending = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);

    const overdueInvoices = filteredInvoices.filter(i => {
      if (i.status === 'ODENDI' || i.status === 'IPTAL') return false;
      return new Date(i.dueDate) < new Date();
    });
    const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);

    return {
      totalInvoiced,
      totalPaid,
      totalPending,
      totalOverdue,
      overdueCount: overdueInvoices.length,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length
    };
  }, [filteredInvoices]);

  // -------------------------------------------------------------
  // Modal Handlers
  // -------------------------------------------------------------
  const handleOpenCreateModal = () => {
    setEditingInvoice(null);
    setSelectedCustomerId(customers[0]?.id || '');
    const year = new Date().getFullYear();
    setInvoiceNumber(`FTR-${year}-${String(invoices.length + 1).padStart(3, '0')}`);
    setSelectedProposalId('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setAmount(0);
    setCurrency('TRY');
    setStatus('BEKLIYOR');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleCreateInvoiceForApprovedProposal = (prop: Proposal) => {
    setEditingInvoice(null);
    if (prop.customer?.id) {
      setSelectedCustomerId(prop.customer.id);
    } else if (customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
    const year = new Date().getFullYear();
    setInvoiceNumber(`FTR-${year}-${String(invoices.length + 1).padStart(3, '0')}`);
    setSelectedProposalId(prop.id);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setAmount(prop.grandTotal);
    setCurrency(prop.currency);
    setStatus('BEKLIYOR');
    setNotes(`${prop.proposalNumber} nolu Onaylı Teklif Faturası: ${prop.title}`);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setSelectedCustomerId(inv.customer.id);
    setInvoiceNumber(inv.invoiceNumber);
    setSelectedProposalId(inv.proposalId || '');
    setIssueDate(inv.issueDate);
    setDueDate(inv.dueDate);
    setAmount(inv.amount);
    setCurrency(inv.currency);
    setStatus(inv.status);
    setNotes(inv.notes || '');
    setIsModalOpen(true);
  };

  const handleProposalSelectInModal = (propId: string) => {
    setSelectedProposalId(propId);
    if (!propId) return;
    const prop = proposals.find(p => p.id === propId);
    if (prop) {
      if (prop.customer?.id) setSelectedCustomerId(prop.customer.id);
      setAmount(prop.grandTotal);
      setCurrency(prop.currency);
      setNotes(`${prop.proposalNumber} nolu Teklif Faturası: ${prop.title}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const custObj = customers.find(c => c.id === selectedCustomerId) || customers[0];
    const linkedProp = proposals.find(p => p.id === selectedProposalId);

    const invoiceData: Partial<Invoice> = {
      ...(editingInvoice ? { id: editingInvoice.id } : {}),
      invoiceNumber,
      proposalId: selectedProposalId || undefined,
      proposalNumber: linkedProp?.proposalNumber || undefined,
      customer: custObj,
      issueDate,
      dueDate,
      status,
      amount,
      paidAmount: status === 'ODENDI' ? amount : 0,
      currency,
      notes: notes || undefined
    };

    onSaveInvoice(invoiceData);
    setIsModalOpen(false);
  };

  const handleMarkAsPaid = (inv: Invoice) => {
    onSaveInvoice({
      ...inv,
      status: 'ODENDI',
      paidAmount: inv.amount
    });
  };

  return (
    <div className="space-y-6 antialiased animate-in fade-in duration-300">
      
      {/* ------------------------------------------------------------- */}
      {/* Header Banner                                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Fatura & Tahsilat Yönetim Merkezi
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Müşteri tarafından onaylanmış tekliflerinizin fatura bilgilerini girin ve tahsilatlarını anlık takip edin.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-2 border border-blue-500 shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Manuel Fatura Kes</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Dual Tab Navigation                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl border border-slate-300/50 w-fit text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('approved_proposals')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'approved_proposals'
              ? 'bg-white text-blue-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span>Onaylanan Teklifler & Fatura Girişi</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 text-blue-700 border border-blue-200">
            {approvedProposals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('all_invoices')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'all_invoices'
              ? 'bg-white text-blue-700 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span>Kesilen Faturalar & Tahsilat Takibi</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
            {invoices.length}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: APPROVED PROPOSALS FOR INVOICING                      */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'approved_proposals' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Approved Proposals Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Approved Proposals */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Müşteri Onaylı Teklifler</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {formatCurrency(approvedStats.totalApprovedAmount, 'TRY')}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  <span>Toplam</span> <strong className="text-slate-800">{approvedStats.totalCount} adet</strong> <span>onaylanmış teklif</span>
                </div>
              </div>
            </div>

            {/* Invoiced Approved Proposals */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Faturalandırılan Tutar</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                  {formatCurrency(approvedStats.invoicedAmount, 'TRY')}
                </div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">
                  {approvedStats.invoicedCount} Teklif Faturalandırıldı
                </div>
              </div>
            </div>

            {/* Pending Invoicing */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fatura Kesilmeyi Bekleyen</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-600 font-mono tracking-tight">
                  {formatCurrency(approvedStats.pendingInvoicedAmount, 'TRY')}
                </div>
                <div className="text-xs text-amber-700 font-semibold mt-1">
                  {approvedStats.pendingInvoicingCount} Teklif İçin Fatura Kesilmesi Gerekiyor
                </div>
              </div>
            </div>

          </div>

          {/* Search bar for Approved Proposals */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Onaylı Teklif No, Konu veya Müşteri Ara..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              * Müşterisi tarafından onaylanmış tekliflerin yanındaki <strong>&quot;Fatura Kes / Bilgi Gir&quot;</strong> butonuna basarak anında faturalandırabilirsiniz.
            </p>
          </div>

          {/* Approved Proposals Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredApprovedProposals.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Onaylanmış teklif bulunamadı.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 font-bold">
                      <th className="px-5 py-3.5">Teklif No & Başlık</th>
                      <th className="px-5 py-3.5">Müşteri Firma</th>
                      <th className="px-5 py-3.5">Teklif Tutarı</th>
                      <th className="px-5 py-3.5">Fatura Durumu</th>
                      <th className="px-5 py-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApprovedProposals.map(({ proposal, invoice, isInvoiced }) => (
                      <tr key={proposal.id} className="hover:bg-blue-50/50 transition-colors">
                        
                        {/* Proposal Info */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() => onSelectProposal && onSelectProposal(proposal.id)}
                            className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{proposal.proposalNumber}</span>
                          </button>
                          <div className="font-semibold text-slate-900 truncate mt-0.5">{proposal.title}</div>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 truncate">
                            {proposal.customer?.companyName || proposal.customer?.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">Yetkili: {proposal.customer?.name}</div>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap text-sm">
                          {formatCurrency(proposal.grandTotal, proposal.currency)}
                        </td>

                        {/* Invoiced Badge Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isInvoiced && invoice ? (
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Faturalandırıldı ({invoice.invoiceNumber})
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Fatura Tarihi: {formatDate(invoice.issueDate)}
                              </div>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-amber-50 text-amber-700 rounded-md border border-amber-200 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Fatura Kesilmedi
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          {isInvoiced && invoice ? (
                            <button
                              onClick={() => handleOpenEditModal(invoice)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-300 cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Faturayı Gör / Düzenle</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCreateInvoiceForApprovedProposal(proposal)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5 ml-auto border border-emerald-500"
                            >
                              <Receipt className="w-4 h-4 text-white" />
                              <span>📄 Fatura Kes / Bilgi Gir</span>
                            </button>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ALL INVOICES & COLLECTION TRACKING                     */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'all_invoices' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Invoiced */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Toplam Faturalandırılan</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {formatCurrency(invoiceStats.totalInvoiced, 'TRY')}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  <span>Toplam</span> <strong className="text-slate-800">{filteredInvoices.length} adet</strong> <span>fatura</span>
                </div>
              </div>
            </div>

            {/* Paid / Collected */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tahsil Edilen (Ödendi)</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                  {formatCurrency(invoiceStats.totalPaid, 'TRY')}
                </div>
                <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center justify-between">
                  <span>{invoiceStats.paidCount} Tahsil Edildi</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Pending Collection */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tahsilat Bekleyen</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-600 font-mono tracking-tight">
                  {formatCurrency(invoiceStats.totalPending, 'TRY')}
                </div>
                <div className="text-xs text-amber-700 font-semibold mt-1">
                  {invoiceStats.pendingCount} Bekleyen Fatura
                </div>
              </div>
            </div>

            {/* Overdue Payments */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Vadesi Geçmiş Ödeme</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-rose-600 font-mono tracking-tight">
                  {formatCurrency(invoiceStats.totalOverdue, 'TRY')}
                </div>
                <div className="text-xs text-rose-600 font-semibold mt-1">
                  {invoiceStats.overdueCount} Gecikmiş Ödeme
                </div>
              </div>
            </div>

          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Fatura No, Müşteri veya Teklif Arayın..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">Tüm Durumlar</option>
                <option value="BEKLIYOR">Ödeme Bekliyor</option>
                <option value="ODENDI">Tahsil Edildi (Ödendi)</option>
                <option value="GECTI">Vadesi Geçti</option>
                <option value="IPTAL">İptal Edildi</option>
              </select>

              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">Tüm Para Birimleri</option>
                <option value="TRY">₺ (TRY)</option>
                <option value="USD">$ (USD)</option>
                <option value="EUR">€ (EUR)</option>
                <option value="GBP">£ (GBP)</option>
              </select>

              <button
                onClick={() => window.print()}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors"
                title="Yazdır"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Invoice Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredInvoices.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Kayıtlı fatura bulunamadı. Onaylanan teklifler sekmesinden veya manuel fatura kesebilirsiniz.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50 font-bold">
                      <th className="px-5 py-3.5">Fatura / Müşteri</th>
                      <th className="px-5 py-3.5">Bağlı Teklif</th>
                      <th className="px-5 py-3.5">Fatura Tarihi</th>
                      <th className="px-5 py-3.5">Vade Tarihi</th>
                      <th className="px-5 py-3.5">Tutar</th>
                      <th className="px-5 py-3.5">Durum</th>
                      <th className="px-5 py-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((inv) => {
                      const isOverdue = inv.status !== 'ODENDI' && inv.status !== 'IPTAL' && new Date(inv.dueDate) < new Date();

                      return (
                        <tr key={inv.id} className="hover:bg-blue-50/50 transition-colors">
                          
                          {/* Invoice & Customer */}
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="text-blue-600 font-mono font-bold">{inv.invoiceNumber}</span>
                              <span>•</span>
                              <span className="truncate">{inv.customer?.companyName || inv.customer?.name}</span>
                            </div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">Yetkili: {inv.customer?.name}</div>
                          </td>

                          {/* Linked Proposal */}
                          <td className="px-5 py-4">
                            {inv.proposalNumber ? (
                              <button
                                onClick={() => inv.proposalId && onSelectProposal && onSelectProposal(inv.proposalId)}
                                className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{inv.proposalNumber}</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">-</span>
                            )}
                          </td>

                          {/* Dates */}
                          <td className="px-5 py-4 font-mono text-slate-600 whitespace-nowrap">
                            {formatDate(inv.issueDate)}
                          </td>

                          <td className="px-5 py-4 font-mono whitespace-nowrap">
                            <span className={isOverdue ? "text-rose-600 font-bold" : "text-slate-600"}>
                              {formatDate(inv.dueDate)}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap text-sm">
                            {formatCurrency(inv.amount, inv.currency)}
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {inv.status === 'ODENDI' && (
                              <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Tahsil Edildi
                              </span>
                            )}
                            {inv.status === 'BEKLIYOR' && !isOverdue && (
                              <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-amber-50 text-amber-700 rounded-md border border-amber-200 flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Ödeme Bekliyor
                              </span>
                            )}
                            {(inv.status === 'GECTI' || isOverdue) && inv.status !== 'ODENDI' && inv.status !== 'IPTAL' && (
                              <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-rose-50 text-rose-700 rounded-md border border-rose-200 flex items-center gap-1 w-fit animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Vadesi Geçti
                              </span>
                            )}
                            {inv.status === 'IPTAL' && (
                              <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-slate-100 text-slate-600 rounded-md border border-slate-200 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3 text-slate-500" />
                                İptal
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {inv.status !== 'ODENDI' && (
                                <button
                                  onClick={() => handleMarkAsPaid(inv)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                                  title="Ödendi ve Tahsil Edildi İşaretle"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Tahsil Et</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEditModal(inv)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 rounded-md hover:bg-blue-50 border border-slate-200 transition-colors"
                                title="Faturayı Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm('Bu faturayı silmek istediğinizden emin misiniz?')) {
                                    onDeleteInvoice(inv.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                                title="Faturayı Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Create / Edit Invoice Modal                                    */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>{editingInvoice ? 'Fatura Bilgilerini Düzenle' : 'Fatura Bilgilerini Gir / Kes'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Fatura Numarası *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Bağlı Teklif</label>
                  <select
                    value={selectedProposalId}
                    onChange={(e) => handleProposalSelectInModal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="">-- Teklif Bağlama --</option>
                    {proposals.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.proposalNumber} - {p.customer?.companyName || p.customer?.name} ({formatCurrency(p.grandTotal, p.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Müşteri / Firma *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.name} - {c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Fatura Düzenleme Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Son Vade Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Fatura Tutarı *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-right"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Para Birimi & Durum</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    >
                      <option value="TRY">₺ TRY</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                      <option value="GBP">£ GBP</option>
                    </select>

                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                    >
                      <option value="BEKLIYOR">Bekliyor</option>
                      <option value="ODENDI">Ödendi</option>
                      <option value="GECTI">Gecikti</option>
                      <option value="IPTAL">İptal</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Fatura Notu / Açıklama</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Fatura açıklaması veya banka havale notu..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border border-blue-500 shadow-md shadow-blue-600/20"
                >
                  Fatura Bilgilerini Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
