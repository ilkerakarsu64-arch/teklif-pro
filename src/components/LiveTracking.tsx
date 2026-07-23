import React, { useState, useEffect, useMemo } from 'react';
import { Proposal, AppNotification, Customer, User } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  Activity,
  Radio,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  FileText,
  Search,
  RefreshCw,
  Zap,
  Building2,
  User as UserIcon,
  Mail,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Filter,
  MonitorPlay,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
  Globe,
  Flame,
  Check,
  X
} from 'lucide-react';

interface LiveTrackingProps {
  proposals: Proposal[];
  notifications: AppNotification[];
  customers: Customer[];
  onSelectProposal: (id: string) => void;
  onSendEmail: (proposal: Proposal) => void;
  onOpenCustomerSimulatorFor: (proposal: Proposal) => void;
  onRefreshData: () => Promise<void> | void;
  currentUser: User | null;
}

export const LiveTracking: React.FC<LiveTrackingProps> = ({
  proposals,
  notifications,
  customers,
  onSelectProposal,
  onSendEmail,
  onOpenCustomerSimulatorFor,
  onRefreshData,
  currentUser
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'viewed' | 'approved' | 'rejected' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [simulatedActionMessage, setSimulatedActionMessage] = useState<string | null>(null);

  // Auto-refresh interval simulator (triggers parent data refresh every 5s if autoRefresh is enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(async () => {
      setIsRefreshing(true);
      await onRefreshData();
      setLastUpdatedTime(new Date());
      setTimeout(() => setIsRefreshing(false), 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, onRefreshData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshData();
    setLastUpdatedTime(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Helper to determine if a proposal is "Currently Active / Viewed Recently"
  const isProposalActive = (proposal: Proposal) => {
    if (proposal.status === 'INCELENIYOR') return true;
    if (!proposal.viewedAt) return false;
    const viewedDate = new Date(proposal.viewedAt).getTime();
    const now = new Date().getTime();
    // Active if viewed within the last 24 hours
    return (now - viewedDate) < 24 * 60 * 60 * 1000;
  };

  // Quick action: Simulate customer view
  const handleSimulateView = async (proposalId: string) => {
    try {
      setSimulatingId(proposalId);
      const res = await fetch(`/api/proposals/${proposalId}/view`, { method: 'POST' });
      if (res.ok) {
        await onRefreshData();
        setSimulatedActionMessage(`Teklif (${proposalId}) için müşteri görüntülemesi simüle edildi!`);
        setTimeout(() => setSimulatedActionMessage(null), 4000);
      }
    } catch (err) {
      console.error('Simulate view error:', err);
    } finally {
      setSimulatingId(null);
    }
  };

  // Filtered proposals list
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      // Tab filter
      if (filterTab === 'active' && !isProposalActive(p)) return false;
      if (filterTab === 'viewed' && !p.viewedAt && p.status !== 'INCELENIYOR') return false;
      if (filterTab === 'approved' && p.status !== 'ONAYLANDI') return false;
      if (filterTab === 'rejected' && p.status !== 'REDDEDILDI') return false;
      if (filterTab === 'pending' && (p.status === 'ONAYLANDI' || p.status === 'REDDEDILDI')) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const propNum = (p.proposalNumber || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        const custName = (p.customer?.name || '').toLowerCase();
        const custCompany = (p.customer?.companyName || '').toLowerCase();
        return propNum.includes(q) || title.includes(q) || custName.includes(q) || custCompany.includes(q);
      }

      return true;
    });
  }, [proposals, filterTab, searchQuery]);

  // Aggregate Stats
  const activeViewsCount = proposals.filter(isProposalActive).length;
  const totalViewsCount = proposals.filter(p => p.viewedAt || p.status === 'INCELENIYOR').length;
  const approvedProposals = proposals.filter(p => p.status === 'ONAYLANDI');
  const approvedTotalAmount = approvedProposals.reduce((sum, p) => sum + p.grandTotal, 0);
  const conversionRate = totalViewsCount > 0 
    ? Math.round((approvedProposals.length / totalViewsCount) * 100) 
    : 0;

  // Unified Live Event Stream (Combine notifications & proposal histories)
  const liveEvents = useMemo(() => {
    const events: Array<{
      id: string;
      type: 'GORUNTULEME' | 'ONAY' | 'RET' | 'EPOSTA' | 'GUNCELLEME';
      title: string;
      description: string;
      proposalId: string;
      proposalNumber: string;
      customerName: string;
      timestamp: string;
      amount?: number;
      currency?: string;
    }> = [];

    // From notifications
    notifications.forEach(n => {
      events.push({
        id: n.id,
        type: n.type === 'GORUNTULEME' ? 'GORUNTULEME' 
            : n.type === 'ONAY' ? 'ONAY' 
            : n.type === 'RET' ? 'RET' 
            : n.type === 'EPOSTA_GONDERILDI' ? 'EPOSTA' 
            : 'GUNCELLEME',
        title: n.title,
        description: n.message,
        proposalId: n.proposalId,
        proposalNumber: n.proposalNumber,
        customerName: n.customerName,
        timestamp: n.createdAt,
        amount: n.amount,
        currency: n.currency
      });
    });

    // Sort descending by timestamp
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications]);

  return (
    <div className="space-y-6">
      
      {/* ------------------------------------------------------------- */}
      {/* TOP LIVE HEADER BANNER                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        
        {/* Decorative background glow elements */}
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold tracking-wide uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                CANLI TAKİP SİSTEMİ
              </span>

              <span className="text-[11px] font-mono text-slate-400">
                Son Senkronizasyon: {lastUpdatedTime.toLocaleTimeString('tr-TR')}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Müşteri Etkileşim & Canlı İnceleme Paneli</span>
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              Müşterilerinizin teklif bağlantılarını ne zaman açtığını, hangi teklifi kaç kez incelediğini ve anlık onay/ret durumlarını gerçek zamanlı takip edin.
            </p>
          </div>

          {/* Action & Sync Controls */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title="5 saniyede bir otomatik yenileme"
            >
              <Zap className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{autoRefresh ? 'Otomatik Akış: AÇIK (5s)' : 'Otomatik Akış: KAPALI'}</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Şimdi Yenile</span>
            </button>
          </div>

        </div>

        {/* Feedback alert after simulating */}
        {simulatedActionMessage && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{simulatedActionMessage}</span>
            </div>
            <button onClick={() => setSimulatedActionMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* KPI METRICS OVERVIEW CARDS                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Views */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Anlık Aktif Takip</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5 animate-pulse text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{activeViewsCount}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Canlı İncelemede
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Son 24 saat içinde müşterilerce açılan teklifler
          </p>
        </div>

        {/* Card 2: Total Views */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Toplam Görüntüleme</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalViewsCount}</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              Teklif Açıldı
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Müşteriler tarafından tıklanan teklif bağlantıları
          </p>
        </div>

        {/* Card 3: Approved Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Onaylanan Teklif Hacmi</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight block truncate">
              {formatCurrency(approvedTotalAmount, 'TRY')}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-bold text-indigo-600">{approvedProposals.length} adet</span> teklif müşteri tarafından onaylandı
          </p>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Görüntüleme Dönüşümü</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">%{conversionRate}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              Başarı Oranı
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Açılan tekliflerin onaya dönüşme oranı
          </p>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN TWO-COLUMN SECTION: SESSION GRID & LIVE EVENT TIMELINE   */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLUMNS: PROPOSALS INTERACTION LIST */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Controls Bar: Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tümü ({proposals.length})
              </button>

              <button
                onClick={() => setFilterTab('active')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterTab === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Canlı İncelemede ({activeViewsCount})</span>
              </button>

              <button
                onClick={() => setFilterTab('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterTab === 'approved'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Onaylananlar ({approvedProposals.length})
              </button>

              <button
                onClick={() => setFilterTab('rejected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterTab === 'rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Reddedilenler ({proposals.filter(p => p.status === 'REDDEDILDI').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative shrink-0 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Teklif veya müşteri ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

          </div>

          {/* Proposals List Cards */}
          {filteredProposals.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Kayıtlı Etkileşim Bulunamadı</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Seçili filtre kriterlerine uygun teklif bulunamadı. Müşterilerinize teklif linki göndererek canlı incelemeleri başlatabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProposals.map((proposal) => {
                const isActiveNow = proposal.status === 'INCELENIYOR';
                const isApproved = proposal.status === 'ONAYLANDI';
                const isRejected = proposal.status === 'REDDEDILDI';
                const isSent = proposal.status === 'GONDERILDI';

                return (
                  <div
                    key={proposal.id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md space-y-4 ${
                      isActiveNow
                        ? 'border-emerald-300 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                        : isApproved
                        ? 'border-indigo-200 bg-indigo-50/10'
                        : isRejected
                        ? 'border-rose-200 bg-rose-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    
                    {/* Header Row: Number, Status & Grand Total */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {proposal.proposalNumber}
                        </span>

                        {/* Live Status Badge */}
                        {isActiveNow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold tracking-wide uppercase border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                            ŞU AN İNCELENİYOR
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold tracking-wide uppercase border border-indigo-200">
                            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                            MÜŞTERİ ONAYLADI
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold tracking-wide uppercase border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            REDDEDİLDİ
                          </span>
                        ) : proposal.viewedAt ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold tracking-wide uppercase border border-blue-200">
                            <Eye className="w-3 h-3 text-blue-600" />
                            GÖRÜNTÜLENDİ
                          </span>
                        ) : isSent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold tracking-wide uppercase border border-amber-200">
                            <Send className="w-3 h-3 text-amber-600" />
                            E-POSTA İLETİLDİ (BEKLEYEN)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold tracking-wide uppercase border border-slate-200">
                            TASLAK
                          </span>
                        )}
                      </div>

                      {/* Grand Total */}
                      <div className="text-right">
                        <span className="text-base font-black text-slate-900">
                          {formatCurrency(proposal.grandTotal, proposal.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Proposal Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{proposal.title}</div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">{proposal.customer?.companyName || proposal.customer?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>İlgili: {proposal.customer?.name} ({proposal.customer?.email})</span>
                        </div>
                      </div>

                      {/* Interaction Timeline Details */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                        
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Gönderim Tarihi:</span>
                          <span className="font-mono text-slate-700">
                            {proposal.sentAt ? new Date(proposal.sentAt).toLocaleString('tr-TR') : 'Henüz Gönderilmedi'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Müşteri Görüntüleme:</span>
                          <span className="font-mono font-bold text-blue-700">
                            {proposal.viewedAt ? new Date(proposal.viewedAt).toLocaleString('tr-TR') : 'Açılmadı'}
                          </span>
                        </div>

                        {proposal.respondedAt && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                            <span className="text-slate-500 font-medium">Müşteri Yanıtı:</span>
                            <span className={`font-mono font-bold ${isApproved ? 'text-indigo-700' : 'text-rose-700'}`}>
                              {new Date(proposal.respondedAt).toLocaleString('tr-TR')}
                            </span>
                          </div>
                        )}

                        {proposal.customerResponseNote && (
                          <div className="pt-1.5 border-t border-slate-200 text-slate-700 italic">
                            "{proposal.customerResponseNote}"
                          </div>
                        )}

                        {proposal.rejectionReason && (
                          <div className="pt-1.5 border-t border-slate-200 text-rose-700 italic">
                            Ret Nedeni: "{proposal.rejectionReason}"
                          </div>
                        )}

                      </div>

                    </div>

                    {/* Footer Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      
                      <div className="flex items-center gap-2">
                        {/* Simulate Customer View Button */}
                        <button
                          onClick={() => handleSimulateView(proposal.id)}
                          disabled={simulatingId === proposal.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
                          title="Müşterinin bu teklifi tıkladığını simüle et"
                        >
                          <Zap className="w-3 h-3 text-emerald-600" />
                          <span>Görüntüleme Simüle Et</span>
                        </button>

                        {/* Customer Simulator Full Modal */}
                        <button
                          onClick={() => onOpenCustomerSimulatorFor(proposal)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer"
                          title="Müşteri onay/ret test simülatörünü aç"
                        >
                          <MonitorPlay className="w-3 h-3 text-amber-600" />
                          <span>Müşteri Test Paneli</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Send Email */}
                        <button
                          onClick={() => onSendEmail(proposal)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                          title="Teklif Bağlantısını E-posta İle Gönder"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-600" />
                        </button>

                        {/* View Proposal Details */}
                        <button
                          onClick={() => onSelectProposal(proposal.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <span>Teklif Detayı</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: REAL-TIME STREAM TIMELINE */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 sticky top-6">
            
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  Canlı Etkinlik Akışı
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                SON HAREKETLER
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Sisteminizde gerçekleşen son müşteri görüntülemeleri, e-posta iletimleri ve onay bildirimleri:
            </p>

            {/* Timeline List */}
            {liveEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Henüz kayıtlı canlı bildirim yok.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {liveEvents.map((evt) => {
                  const isView = evt.type === 'GORUNTULEME';
                  const isApprove = evt.type === 'ONAY';
                  const isReject = evt.type === 'RET';
                  const isEmail = evt.type === 'EPOSTA';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => evt.proposalId && onSelectProposal(evt.proposalId)}
                      className="p-3.5 rounded-xl border border-slate-150 bg-slate-50 hover:bg-slate-100/80 transition-all cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-xs ${
                              isApprove
                                ? 'bg-emerald-600'
                                : isReject
                                ? 'bg-rose-600'
                                : isView
                                ? 'bg-blue-600'
                                : isEmail
                                ? 'bg-purple-600'
                                : 'bg-slate-600'
                            }`}
                          >
                            {isApprove ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : isReject ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : isView ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : isEmail ? (
                              <Send className="w-3.5 h-3.5" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                            {evt.title}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(evt.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                        <span>{evt.customerName}</span>
                        <span className="font-bold text-blue-600 group-hover:underline">İncele →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
