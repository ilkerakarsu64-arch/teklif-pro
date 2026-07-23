import React, { useState, useMemo } from 'react';
import { Proposal, AppNotification, Customer, User } from '../types';
import { LiveTracking } from './LiveTracking';
import { formatCurrency, formatDate, getPublicPortalUrl } from '../utils/formatters';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Sparkles,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Laptop,
  Eye,
  Settings as SettingsIcon,
  PlusCircle,
  FileBarChart2,
  Bell,
  Radio,
  ExternalLink,
  Send,
  Building2,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardStatsProps {
  proposals: Proposal[];
  notifications: AppNotification[];
  customers?: Customer[];
  onSelectProposal: (id: string) => void;
  onNewProposal: () => void;
  onOpenCustomerSimulator: () => void;
  onOpenReports?: () => void;
  onOpenSettings?: () => void;
  onSendEmail?: (proposal: Proposal) => void;
  onOpenCustomerSimulatorFor?: (proposal: Proposal) => void;
  onRefreshData?: () => Promise<void> | void;
  currentUser?: User | null;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  proposals,
  notifications,
  customers = [],
  onSelectProposal,
  onNewProposal,
  onOpenCustomerSimulator,
  onOpenReports,
  onOpenSettings,
  onSendEmail = () => {},
  onOpenCustomerSimulatorFor = (p) => onOpenCustomerSimulator(),
  onRefreshData = () => {},
  currentUser = null
}) => {
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'ONAY' | 'GORUNTULEME' | 'EPOSTA_GONDERILDI' | 'RET'>('ALL');

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'ALL') return notifications;
    return notifications.filter(n => n.type === notifFilter);
  }, [notifications, notifFilter]);

  // Key Financial Metrics
  const totalCount = proposals.length;
  const approvedProposals = proposals.filter(p => p.status === 'ONAYLANDI');
  const pendingProposals = proposals.filter(p => p.status === 'GONDERILDI' || p.status === 'INCELENIYOR');
  const rejectedProposals = proposals.filter(p => p.status === 'REDDEDILDI');
  const draftProposals = proposals.filter(p => p.status === 'TASLAK');

  const totalApprovedAmount = approvedProposals.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalPendingAmount = pendingProposals.reduce((sum, p) => sum + p.grandTotal, 0);

  const conversionRate = totalCount > 0 
    ? Math.round((approvedProposals.length / totalCount) * 100) 
    : 0;

  // Device & Item Stats
  const totalDevicesCount = proposals.reduce((sum, p) => sum + (p.devices?.length || 1), 0);
  const totalItemsCount = proposals.reduce((sum, p) => {
    if (p.devices && p.devices.length > 0) {
      return sum + p.devices.reduce((dSum, dev) => dSum + (dev.items?.length || 0), 0);
    }
    return sum + (p.items?.length || 0);
  }, 0);

  // Online Viewed Proposals Count & Rate
  const viewedProposalsCount = proposals.filter(p => p.status === 'INCELENIYOR' || p.status === 'ONAYLANDI' || p.viewedAt).length;
  const viewRate = totalCount > 0 ? Math.round((viewedProposalsCount / totalCount) * 100) : 0;

  // Expiring Soon Proposals (within 5 days)
  const expiringProposals = useMemo(() => {
    const today = new Date();
    const fiveDaysLater = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

    return proposals.filter(p => {
      if (p.status === 'ONAYLANDI' || p.status === 'REDDEDILDI') return false;
      const vDate = new Date(p.validUntilDate);
      return vDate <= fiveDaysLater && vDate >= today;
    });
  }, [proposals]);

  // 30-Day Timeline Chart Data
  const chartData = useMemo(() => {
    const result = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('tr-TR', { month: 'short' });
      const displayDate = `${dayNum} ${monthName}`;

      const dayProposals = proposals.filter(p => {
        const pDate = p.issueDate || p.createdAt?.split('T')[0];
        return pDate === dateStr;
      });

      const dayApproved = proposals.filter(p => {
        const pDate = p.issueDate || p.createdAt?.split('T')[0];
        return pDate === dateStr && p.status === 'ONAYLANDI';
      });

      const revenue = dayApproved.reduce((sum, p) => sum + p.grandTotal, 0);
      const totalVolume = dayProposals.reduce((sum, p) => sum + p.grandTotal, 0);

      result.push({
        displayDate,
        dateStr,
        ciro: revenue,
        toplamHacim: totalVolume,
        toplamTeklif: dayProposals.length,
        onaylanan: dayApproved.length
      });
    }

    return result;
  }, [proposals]);

  // Pie chart data for status breakdown
  const statusPieData = [
    { name: 'Onaylandı', value: approvedProposals.length, color: '#10b981' },
    { name: 'Onay Bekliyor', value: pendingProposals.length, color: '#f59e0b' },
    { name: 'Reddedildi', value: rejectedProposals.length, color: '#ef4444' },
    { name: 'Taslak', value: draftProposals.length, color: '#64748b' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6 antialiased animate-in fade-in slide-in-from-bottom-2 duration-500 bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
      
      {/* ------------------------------------------------------------- */}
      {/* Top Header & Quick Actions (Animated Banner)                  */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-2xs">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Yönetici Kontrol Paneli
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Müşteri tekliflerinizi, onay durumlarını, cihaz metriklerini ve finansal ciro akışınızı canlı takip edin.
          </p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={onOpenCustomerSimulator}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 flex items-center gap-1.5 border border-amber-400 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950 animate-bounce" />
            <span>Canlı Bildirimi Test Et</span>
          </button>
          <button
            onClick={onNewProposal}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 flex items-center gap-1.5 border border-blue-500 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Yeni Teklif Oluştur</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Expiring Soon Alert Bar (If Any)                              */}
      {/* ------------------------------------------------------------- */}
      {expiringProposals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 border border-amber-200 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                {expiringProposals.length} adet teklifin son geçerlilik tarihi yaklaşıyor!
              </span>
              <span className="text-slate-600">
                Müşterilerinizle iletişime geçip teklif onay durumunu hızlandırabilirsiniz.
              </span>
            </div>
          </div>
          <button
            onClick={() => onSelectProposal(expiringProposals[0].id)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-all duration-200 shrink-0 flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
          >
            <span>İncele</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Quick Action Shortcuts Bar (Animated Tiles)                   */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onNewProposal}
          className="p-3.5 bg-white border border-slate-200 hover:border-blue-500 rounded-xl shadow-xs hover:shadow-md hover:-translate-y-1 text-left transition-all duration-300 flex items-center gap-3 group cursor-pointer active:scale-95"
        >
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">Hızlı Teklif Ekle</div>
            <div className="text-[10px] text-slate-500">Yeni teklif formu aç</div>
          </div>
        </button>

        {onOpenReports && (
          <button
            onClick={onOpenReports}
            className="p-3.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl shadow-xs hover:shadow-md hover:-translate-y-1 text-left transition-all duration-300 flex items-center gap-3 group cursor-pointer active:scale-95"
          >
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <FileBarChart2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">Detaylı Raporlar</div>
              <div className="text-[10px] text-slate-500">Finansal analiz ve tablo</div>
            </div>
          </button>
        )}

        <button
          onClick={onOpenCustomerSimulator}
          className="p-3.5 bg-white border border-slate-200 hover:border-amber-500 rounded-xl shadow-xs hover:shadow-md hover:-translate-y-1 text-left transition-all duration-300 flex items-center gap-3 group cursor-pointer active:scale-95"
        >
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            <Zap className="w-4 h-4 fill-amber-500" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">Müşteri Simülatörü</div>
            <div className="text-[10px] text-slate-500">Onay bildirim testi</div>
          </div>
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-3.5 bg-white border border-slate-200 hover:border-purple-500 rounded-xl shadow-xs hover:shadow-md hover:-translate-y-1 text-left transition-all duration-300 flex items-center gap-3 group cursor-pointer active:scale-95"
          >
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-purple-600 transition-colors">Sistem Ayarları</div>
              <div className="text-[10px] text-slate-500">Firma & İnternet URL</div>
            </div>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Key Metric KPI Cards Grid (Animated Float & Scale)             */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Approved Revenue Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Onaylanan Ciro</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight group-hover:text-emerald-600 transition-colors">
              {formatCurrency(totalApprovedAmount, 'TRY')}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
              <span>{approvedProposals.length} Onaylı Teklif</span>
              <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Pending Opportunities Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-amber-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Onay Bekleyen</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 font-mono tracking-tight">
              {pendingProposals.length} Teklif
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Bekleyen Tutar</span>
              <span className="font-semibold text-slate-800 font-mono">{formatCurrency(totalPendingAmount, 'TRY')}</span>
            </div>
          </div>
        </div>

        {/* Total Proposal Volume & Conversion Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Toplam Teklif & Oran</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight group-hover:text-blue-600 transition-colors">
              {totalCount} Adet
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Kazanma Oranı</span>
              <span className="font-bold text-blue-600 font-mono">%{conversionRate}</span>
            </div>
          </div>
        </div>

        {/* Devices & Kalem Metrics Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-purple-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cihaz & İşlem Kalemi</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100 group-hover:scale-110 transition-transform duration-300">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-600 font-mono tracking-tight">
              {totalDevicesCount} Cihaz
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Toplam Hizmet Kalemi</span>
              <span className="font-bold text-purple-600 font-mono">{totalItemsCount} Kalem</span>
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* Online View Rates (Animated Bar)                             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-bold text-slate-900 uppercase tracking-wider">Müşteri Online İnceleme Etkileşimi</span>
          </div>
          <div className="font-mono text-slate-700">
            <strong className="text-amber-600 font-bold">{viewedProposalsCount}</strong> / {totalCount} Teklif İncenlendi
          </div>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-xs"
            style={{ width: `${viewRate}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Müşteri İnceleme Oranı</span>
          <span className="font-bold text-amber-600 font-mono">%{viewRate}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Analytics Charts Section (Smooth Recharts Animations)          */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Trend Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Son 30 Günlük Ciro ve Teklif Hacim Trendi</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Onaylanan teklif cirosunun gün bazlı finansal dağılım analizi
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-slate-700">Onaylanan Ciro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block"></span>
                <span className="text-slate-700">Toplam Hacim</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHacim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={3}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k₺` : `${val}₺`}
                />
                <Tooltip 
                  formatter={(val: any) => formatCurrency(Number(val) || 0, 'TRY')}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ciro" 
                  name="Onaylanan Ciro"
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorCiro)" 
                  isAnimationActive={true}
                  animationDuration={1200}
                />
                <Area 
                  type="monotone" 
                  dataKey="toplamHacim" 
                  name="Toplam Hacim"
                  stroke="#3b82f6" 
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#colorHacim)" 
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              <span>Teklif Onay & Durum Oranları</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tüm tekliflerin güncel durum dağılımı
            </p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            {statusPieData.length === 0 ? (
              <div className="text-xs text-slate-400">Veri yok</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={1000}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`${val} Adet`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {/* Inner Center Stat */}
            <div className="absolute text-center pointer-events-none">
              <div className="text-xl font-bold font-mono text-slate-900">%{conversionRate}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Onay Oranı</div>
            </div>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-semibold">{approvedProposals.length} Onaylı</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 font-semibold">{pendingProposals.length} Bekleyen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-600 font-semibold">{rejectedProposals.length} Red</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              <span className="text-slate-600 font-semibold">{draftProposals.length} Taslak</span>
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* Main Grid: Recent Proposals & Live Notifications              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Proposals (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-sm transition-shadow flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-900 text-sm tracking-tight uppercase">Son Oluşturulan Teklifler</h2>
              <p className="text-xs text-slate-400">Güncel müşteri teklif listesi ve canlı onay durumları</p>
            </div>
            <button 
              onClick={onNewProposal} 
              className="text-xs text-blue-600 font-bold uppercase tracking-widest hover:underline cursor-pointer"
            >
              + Teklif Ekle
            </button>
          </div>

          {proposals.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Henüz teklif kaydı bulunmuyor. Yeni teklif eklemek için yukarıdaki butonu kullanabilirsiniz.
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-100/50 font-bold">
                    <th className="px-6 py-3">Teklif / Müşteri</th>
                    <th className="px-6 py-3">Tarih</th>
                    <th className="px-6 py-3">Tutar</th>
                    <th className="px-6 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposals.slice(0, 6).map((proposal) => (
                    <tr
                      key={proposal.id}
                      onClick={() => onSelectProposal(proposal.id)}
                      className="hover:bg-blue-50/60 cursor-pointer transition-all duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="text-blue-600 font-mono font-bold">{proposal.proposalNumber}</span>
                          <span>•</span>
                          <span className="truncate">{proposal.customer.companyName || proposal.customer.name}</span>
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">{proposal.title}</div>
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-mono whitespace-nowrap">
                        {formatDate(proposal.issueDate)}
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(proposal.grandTotal, proposal.currency)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {proposal.status === 'ONAYLANDI' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                            Müşteri Onayladı
                          </span>
                        )}
                        {proposal.status === 'REDDEDILDI' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                            Reddedildi
                          </span>
                        )}
                        {proposal.status === 'INCELENIYOR' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                            İnceleniyor
                          </span>
                        )}
                        {proposal.status === 'GONDERILDI' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-blue-50 text-blue-600 rounded-md border border-blue-200">
                            Mail Gönderildi
                          </span>
                        )}
                        {proposal.status === 'TASLAK' && (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                            Taslak
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Real-time Notifications Feed (4 cols) */}
        <div className="lg:col-span-4 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
          
          {/* Section Header - Crisp White */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-2xs">
                <Radio className="w-4 h-4 animate-pulse text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">
                  Canlı Bildirim & Müşteri Takip
                </h3>
                <p className="text-[10px] text-slate-500 font-mono font-semibold">
                  Gerçek Zamanlı Müşteri Etkileşimleri
                </p>
              </div>
            </div>

            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>{notifications.length} HAREKET</span>
            </span>
          </div>

          {/* Quick Category Filter Pills - Light Slate */}
          <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => setNotifFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap ${
                notifFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Tümü ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setNotifFilter('ONAY')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap ${
                notifFilter === 'ONAY'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-100/60'
              }`}
            >
              ✓ Onay ({notifications.filter(n => n.type === 'ONAY').length})
            </button>
            <button
              type="button"
              onClick={() => setNotifFilter('GORUNTULEME')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap ${
                notifFilter === 'GORUNTULEME'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-blue-700 hover:bg-blue-100/60'
              }`}
            >
              👁 Görüldü ({notifications.filter(n => n.type === 'GORUNTULEME').length})
            </button>
            <button
              type="button"
              onClick={() => setNotifFilter('EPOSTA_GONDERILDI')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap ${
                notifFilter === 'EPOSTA_GONDERILDI'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-800 hover:bg-amber-100/60'
              }`}
            >
              ✉ Mail ({notifications.filter(n => n.type === 'EPOSTA_GONDERILDI').length})
            </button>
            <button
              type="button"
              onClick={() => setNotifFilter('RET')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap ${
                notifFilter === 'RET'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-100/60'
              }`}
            >
              ✕ Red ({notifications.filter(n => n.type === 'RET').length})
            </button>
          </div>

          {/* Notifications Feed Scroll Container - Pure White */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 max-h-[440px] bg-white">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Bell className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                <p className="text-xs text-slate-500 font-semibold">
                  Bu filtreye ait canlı bildirim kaydı bulunamadı.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                let badgeBg = "bg-slate-100 text-slate-700 border-slate-200";
                let typeLabel = "SİSTEM MESAJI";
                let IconComponent = Bell;
                let cardBg = "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm";

                if (notif.type === 'ONAY') {
                  badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  typeLabel = "TEKLİF ONAYLANDI";
                  IconComponent = CheckCircle2;
                  cardBg = "bg-white border-emerald-200/90 hover:border-emerald-500 shadow-2xs";
                } else if (notif.type === 'RET') {
                  badgeBg = "bg-rose-50 text-rose-700 border-rose-200";
                  typeLabel = "TEKLİF REDDEDİLDİ";
                  IconComponent = XCircle;
                  cardBg = "bg-white border-rose-200/90 hover:border-rose-500 shadow-2xs";
                } else if (notif.type === 'GORUNTULEME') {
                  badgeBg = "bg-blue-50 text-blue-700 border-blue-200";
                  typeLabel = "İNTERNETTEN İNCELENDİ";
                  IconComponent = Eye;
                  cardBg = "bg-white border-blue-200/90 hover:border-blue-500 shadow-2xs";
                } else if (notif.type === 'EPOSTA_GONDERILDI') {
                  badgeBg = "bg-amber-50 text-amber-800 border-amber-200";
                  typeLabel = "E-POSTA İLETİLDİ";
                  IconComponent = Send;
                  cardBg = "bg-white border-amber-200/90 hover:border-amber-500 shadow-2xs";
                }

                const portalUrl = getPublicPortalUrl(notif.proposalId);

                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-xl border ${cardBg} transition-all duration-200 space-y-2 group`}
                  >
                    {/* Header line */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border flex items-center gap-1 ${badgeBg}`}>
                          <IconComponent className="w-3 h-3" />
                          <span>{typeLabel}</span>
                        </span>
                        <span className="font-mono text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {notif.proposalNumber}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(notif.createdAt)}</span>
                      </span>
                    </div>

                    {/* Message Body */}
                    <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Customer Note if present */}
                    {notif.customerNote && (
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700 italic">
                        &quot;{notif.customerNote}&quot;
                      </div>
                    )}

                    {/* Bottom Metadata & Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-150 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold truncate max-w-[170px]">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{notif.customerName}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {notif.amount && (
                          <span className="font-mono font-bold text-emerald-600 text-[11px] mr-1">
                            {formatCurrency(notif.amount, (notif.currency as any) || 'TRY')}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectProposal(notif.proposalId)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold text-[10px] transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
                          title="Teklif detayını göster"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Aç</span>
                        </button>

                        <a
                          href={portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(portalUrl, '_blank');
                          }}
                          className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                          title="Müşteri internet inceleme portalını aç"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Simulator Bar - Crisp White */}
          <div className="p-3.5 bg-white border-t border-slate-200">
            <button
              onClick={onOpenCustomerSimulator}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-amber-400/80 shadow-xs cursor-pointer active:scale-98"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 animate-bounce" />
              <span>Müşteri Onayını / Etkileşimini Simüle Et</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
