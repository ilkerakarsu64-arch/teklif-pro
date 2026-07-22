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
  X
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

  // Filtered Invoices
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

  // Overall Financial Stats
  const stats = useMemo(() => {
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

  const handleProposalSelect = (propId: string) => {
    setSelectedProposalId(propId);
    if (!propId) return;
    const prop = proposals.find(p => p.id === propId);
    if (prop) {
      if (prop.customer?.id) setSelectedCustomerId(prop.customer.id);
      setAmount(prop.grandTotal);
      setCurrency(prop.currency);
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
              Fatura & Tahsilat Takip Modülü
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kesilen faturalarınızı, tahsilat durumlarını ve vadesi geçen ödemelerinizi anlık takip edin.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-2 border border-blue-500 shadow-xs cursor-pointer active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Yeni Fatura Kes</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Financial KPI Cards                                           */}
      {/* ------------------------------------------------------------- */}
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
              {formatCurrency(stats.totalInvoiced, 'TRY')}
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
              {formatCurrency(stats.totalPaid, 'TRY')}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center justify-between">
              <span>{stats.paidCount} Tahsil Edildi</span>
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
              {formatCurrency(stats.totalPending, 'TRY')}
            </div>
            <div className="text-xs text-amber-700 font-semibold mt-1">
              {stats.pendingCount} Bekleyen Fatura
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
              {formatCurrency(stats.totalOverdue, 'TRY')}
            </div>
            <div className="text-xs text-rose-600 font-semibold mt-1">
              {stats.overdueCount} Gecikmiş Ödeme
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* Search & Filter Bar                                           */}
      {/* ------------------------------------------------------------- */}
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
          {/* Status Filter */}
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

          {/* Currency Filter */}
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

      {/* ------------------------------------------------------------- */}
      {/* Invoice Data Table                                            */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p>Kayıtlı fatura bulunamadı. Yeni bir fatura kesmek için yukarıdaki butonu kullanabilirsiniz.</p>
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
                          <span className="truncate">{inv.customer.companyName || inv.customer.name}</span>
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">Yetkili: {inv.customer.name}</div>
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

      {/* ------------------------------------------------------------- */}
      {/* Create / Edit Invoice Modal                                    */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>{editingInvoice ? 'Fatura Düzenle' : 'Yeni Fatura Kes'}</span>
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
                  <label className="block text-slate-700 mb-1 font-semibold">Bağlı Teklif (Opsiyonel)</label>
                  <select
                    value={selectedProposalId}
                    onChange={(e) => handleProposalSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="">-- Teklif Bağlama --</option>
                    {proposals.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.proposalNumber} - {p.customer.companyName || p.customer.name} ({formatCurrency(p.grandTotal, p.currency)})
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
                  <label className="block text-slate-700 mb-1 font-semibold">Fatura Tarihi *</label>
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
                <label className="block text-slate-700 mb-1 font-semibold">Açıklama / Notlar</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Banka havale notu veya fatura açıklaması..."
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
                  Faturayı Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
