import React, { useState } from 'react';
import { Customer, Proposal, User } from '../types';
import { getUserPermissions } from '../utils/auth';
import { formatCurrency, formatDate, getStatusBadgeConfig } from '../utils/formatters';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  X, 
  Receipt, 
  LayoutGrid, 
  List,
  ChevronRight,
  Filter
} from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  proposals: Proposal[];
  onAddCustomer: (customerData: Omit<Customer, 'id'>) => Promise<void>;
  onUpdateCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onCreateProposalForCustomer: (customer: Customer) => void;
  onSelectProposal: (proposalId: string) => void;
  currentUser: User | null;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  proposals,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onCreateProposalForCustomer,
  onSelectProposal,
  currentUser
}) => {
  const permissions = currentUser ? getUserPermissions(currentUser.role) : getUserPermissions('ADMIN');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'turnover' | 'proposals' | 'name' | 'newest'>('turnover');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTaxOffice, setFormTaxOffice] = useState('');
  const [formTaxNumber, setFormTaxNumber] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormCompanyName('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormTaxOffice('');
    setFormTaxNumber('');
    setIsAddEditModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormName(cust.name || '');
    setFormCompanyName(cust.companyName || '');
    setFormEmail(cust.email || '');
    setFormPhone(cust.phone || '');
    setFormAddress(cust.address || '');
    setFormTaxOffice(cust.taxOffice || '');
    setFormTaxNumber(cust.taxNumber || '');
    setIsAddEditModalOpen(true);
  };

  // Handle Submit (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompanyName.trim() || !formName.trim()) {
      alert('Lütfen firma adını ve yetkili kişi adını doldurun.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        companyName: formCompanyName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        taxOffice: formTaxOffice.trim(),
        taxNumber: formTaxNumber.trim()
      };

      if (editingCustomer) {
        await onUpdateCustomer(editingCustomer.id, payload);
      } else {
        await onAddCustomer(payload);
      }

      setIsAddEditModalOpen(false);
    } catch (err) {
      console.error('Müşteri kaydedilemedi:', err);
      alert('İşlem sırasında bir hata oluştu.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Helper to compute stats per customer
  const getCustomerStats = (cust: Customer) => {
    const custProposals = proposals.filter(
      p => p.customer.id === cust.id || (cust.email && p.customer.email === cust.email)
    );
    const approvedProposals = custProposals.filter(p => p.status === 'ONAYLANDI');
    const totalCount = custProposals.length;
    const approvedCount = approvedProposals.length;
    const totalVolume = approvedProposals.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
    const totalQuoted = custProposals.reduce((sum, p) => sum + (p.grandTotal || 0), 0);

    return {
      custProposals,
      approvedProposals,
      totalCount,
      approvedCount,
      totalVolume,
      totalQuoted
    };
  };

  // General KPIs
  const totalCustomers = customers.length;
  const activeCustomersCount = customers.filter(c => getCustomerStats(c).approvedCount > 0).length;
  const grandTotalRevenue = proposals
    .filter(p => p.status === 'ONAYLANDI')
    .reduce((sum, p) => sum + (p.grandTotal || 0), 0);
  const avgTurnoverPerCust = totalCustomers > 0 ? grandTotalRevenue / totalCustomers : 0;

  // Search & Sorting Filter
  const filteredCustomers = customers.filter(c => {
    const query = searchTerm.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone && c.phone.toLowerCase().includes(query)) ||
      (c.taxNumber && c.taxNumber.toLowerCase().includes(query))
    );
  }).sort((a, b) => {
    const statsA = getCustomerStats(a);
    const statsB = getCustomerStats(b);

    if (sortBy === 'turnover') {
      return statsB.totalVolume - statsA.totalVolume;
    }
    if (sortBy === 'proposals') {
      return statsB.totalCount - statsA.totalCount;
    }
    if (sortBy === 'name') {
      return a.companyName.localeCompare(b.companyName, 'tr');
    }
    if (sortBy === 'newest') {
      return b.id.localeCompare(a.id);
    }
    return 0;
  });

  const deletingCustomer = customers.find(c => c.id === deletingCustomerId);

  return (
    <div className="space-y-6">

      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Müşteri Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kayıtlı kurumsal müşterileriniz, vergi bilgileri ve teklif geçmişi
          </p>
        </div>

        {permissions.canManageCustomers && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Müşteri Ekle</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Toplam Müşteri</div>
            <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">{totalCustomers}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aktif Müşteri</div>
            <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">{activeCustomersCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Toplam Onaylı Ciro</div>
            <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{formatCurrency(grandTotalRevenue, 'TRY')}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 font-extrabold text-xl font-mono">
            ₺
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ortalama Hacim</div>
            <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{formatCurrency(avgTurnoverPerCust, 'TRY')}</div>
          </div>
        </div>

      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white p-3 rounded-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Firma, yetkili, e-posta veya vergi no ara..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* Sorting */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold px-2.5 py-1.5 text-slate-700"
            >
              <option value="turnover">Sırala: En Yüksek Ciro</option>
              <option value="proposals">Sırala: En Çok Teklif</option>
              <option value="name">Sırala: Firma Adı (A-Z)</option>
              <option value="newest">Sırala: En Yeni Eklene</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-300 rounded-sm overflow-hidden bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 text-xs ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 text-xs ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Liste Tablosu"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-sm border border-slate-200 space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Müşteri Bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'Arama kriterlerinize uygun müşteri kaydı bulunamadı.' : 'Henüz sisteme eklenmiş bir müşteri bulunmuyor.'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenAdd}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Müşteriyi Ekle</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const stats = getCustomerStats(cust);
            const initial = cust.companyName ? cust.companyName.substring(0, 2).toUpperCase() : 'MÜ';

            return (
              <div 
                key={cust.id} 
                className="bg-white rounded-sm border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="p-4 space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 tracking-wider">
                        {initial}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight line-clamp-1" title={cust.companyName}>
                          {cust.companyName}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> {cust.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-sm transition-colors"
                        title="Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCustomerId(cust.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tax Info Pills if available */}
                  {(cust.taxOffice || cust.taxNumber) && (
                    <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-[11px] font-mono text-slate-700 flex items-center justify-between">
                      <span>V.D.: {cust.taxOffice || '-'}</span>
                      <span className="font-bold">VN: {cust.taxNumber || '-'}</span>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="text-xs space-y-1 text-slate-600 pt-1">
                    {cust.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`mailto:${cust.email}`} className="hover:underline truncate">{cust.email}</a>
                      </div>
                    )}
                    {cust.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${cust.phone}`} className="font-mono hover:underline">{cust.phone}</a>
                      </div>
                    )}
                    {cust.address && (
                      <div className="flex items-start gap-2 text-slate-500 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{cust.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Stats Box */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-sm border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Teklif Sayısı</div>
                      <div className="font-mono font-bold text-slate-900 mt-0.5">
                        {stats.totalCount} <span className="text-emerald-600 text-[10px]">({stats.approvedCount} Onay)</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-sm border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Onaylı Ciro</div>
                      <div className="font-mono font-extrabold text-blue-700 mt-0.5">
                        {formatCurrency(stats.totalVolume, 'TRY')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setHistoryCustomer(cust)}
                    className="flex-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Teklif Geçmişi ({stats.totalCount})</span>
                  </button>

                  <button
                    onClick={() => onCreateProposalForCustomer(cust)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                    title="Bu müşteriye yeni teklif hazırla"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Teklif Ver</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Firma & Yetkili</th>
                  <th className="py-3 px-3">İletişim</th>
                  <th className="py-3 px-3">Vergi Bilgileri</th>
                  <th className="py-3 px-3 text-center">Teklif Sayısı</th>
                  <th className="py-3 px-3 text-right">Onaylı Ciro</th>
                  <th className="py-3 px-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const stats = getCustomerStats(cust);
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{cust.companyName}</div>
                        <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-slate-400" /> {cust.name}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-700 font-mono text-[11px]">{cust.email || '-'}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{cust.phone || '-'}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        <div>{cust.taxOffice ? `V.D: ${cust.taxOffice}` : '-'}</div>
                        <div className="font-bold text-slate-800">{cust.taxNumber ? `VN: ${cust.taxNumber}` : ''}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {stats.totalCount} <span className="text-emerald-600 text-[10px]">({stats.approvedCount} Onay)</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-blue-700 text-xs">
                        {formatCurrency(stats.totalVolume, 'TRY')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setHistoryCustomer(cust)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-sm font-semibold text-[11px] flex items-center gap-1"
                            title="Tekliflerini Gör"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Teklifler</span>
                          </button>
                          <button
                            onClick={() => onCreateProposalForCustomer(cust)}
                            className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-sm font-semibold text-[11px] flex items-center gap-1"
                            title="Yeni Teklif Oluştur"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-sm"
                            title="Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCustomerId(cust.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                {editingCustomer ? 'Müşteri Bilgilerini Düzenle' : 'Yeni Müşteri Ekle'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Firma Unvanı */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Firma / Kurum Unvanı *
                </label>
                <input
                  type="text"
                  required
                  value={formCompanyName}
                  onChange={(e) => setFormCompanyName(e.target.value)}
                  placeholder="Örn: ABC Teknoloji ve A.Ş."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold text-slate-900"
                />
              </div>

              {/* Yetkili Adı */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Yetkili Kişi Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold text-slate-900"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ahmet@abcteknoloji.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Telefon Numarası
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0532 000 00 00"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Vergi Dairesi & Vergi No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Vergi Dairesi
                  </label>
                  <input
                    type="text"
                    value={formTaxOffice}
                    onChange={(e) => setFormTaxOffice(e.target.value)}
                    placeholder="Örn: Maslak V.D."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Vergi Numarası / T.C.
                  </label>
                  <input
                    type="text"
                    value={formTaxNumber}
                    onChange={(e) => setFormTaxNumber(e.target.value)}
                    placeholder="1234567890"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Adres
                </label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Açık adres bilgisi..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs text-slate-900"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs disabled:opacity-50"
                >
                  {formSubmitting ? 'Kaydediliyor...' : editingCustomer ? 'Güncelle' : 'Müşteriyi Kaydet'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Customer Proposal History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-slate-300 shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Müşteri Teklif Geçmişi
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  <strong className="text-slate-800">{historyCustomer.companyName}</strong> ({historyCustomer.name}) firmasına ait tüm kayıtlı teklifler
                </p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary KPIs */}
            {(() => {
              const stats = getCustomerStats(historyCustomer);
              return (
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-sm border border-slate-200 text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Toplam Teklif</div>
                    <div className="font-extrabold text-slate-900 text-sm mt-0.5">{stats.totalCount} Adet</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Onaylanan Teklif</div>
                    <div className="font-extrabold text-emerald-600 text-sm mt-0.5">{stats.approvedCount} Adet</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Toplam Onaylı Ciro</div>
                    <div className="font-extrabold text-blue-700 text-sm mt-0.5">{formatCurrency(stats.totalVolume, 'TRY')}</div>
                  </div>
                </div>
              );
            })()}

            {/* Proposals List Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-sm">
              {(() => {
                const custProps = proposals.filter(
                  p => p.customer.id === historyCustomer.id || (historyCustomer.email && p.customer.email === historyCustomer.email)
                );

                if (custProps.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Bu müşteriye henüz hiç teklif oluşturulmamış.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Teklif No & Konu</th>
                        <th className="py-2.5 px-3">Tarih</th>
                        <th className="py-2.5 px-3 text-center">Durum</th>
                        <th className="py-2.5 px-3 text-right">Tutar</th>
                        <th className="py-2.5 px-3 text-right">Aç</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {custProps.map((p) => {
                        const badge = getStatusBadgeConfig(p.status);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-bold text-blue-700">{p.proposalNumber}</div>
                              <div className="text-slate-800 font-medium truncate max-w-xs">{p.title}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {formatDate(p.issueDate)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold border uppercase ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(p.grandTotal, p.currency)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  onSelectProposal(p.id);
                                  setHistoryCustomer(null);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-sm border border-slate-300 text-[11px] font-bold flex items-center gap-1 transition-colors ml-auto"
                              >
                                <span>İncele</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  onCreateProposalForCustomer(historyCustomer);
                  setHistoryCustomer(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Bu Müşteriye Yeni Teklif Oluştur</span>
              </button>

              <button
                type="button"
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-semibold"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustomerId && deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-sm bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Müşteriyi Silme Onayı</h3>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900">{deletingCustomer.companyName}</strong> firması silinecektir. Bu işlem geri alınamaz.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingCustomerId(null)}
                className="px-4 py-2 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteCustomer(deletingCustomer.id);
                  setDeletingCustomerId(null);
                }}
                className="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                Evet, Müşteriyi Sil
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
