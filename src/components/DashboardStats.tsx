import React, { useMemo } from 'react';
import { Proposal, AppNotification } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
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
  Bell
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
  onSelectProposal: (id: string) => void;
  onNewProposal: () => void;
  onOpenCustomerSimulator: () => void;
  onOpenReports?: () => void;
  onOpenSettings?: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  proposals,
  notifications,
  onSelectProposal,
  onNewProposal,
  onOpenCustomerSimulator,
  onOpenReports,
  onOpenSettings
}) => {
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

  // Target Revenue Goal (Mock Goal for Progress Display)
  const monthlyGoal = 500000;
  const goalProgressPercent = Math.min(100, Math.round((totalApprovedAmount / monthlyGoal) * 100));

  return (
    <div className="space-y-6 antialiased">
      
      {/* ------------------------------------------------------------- */}
      {/* Top Header & Quick Actions (Matches DetailedReports Style)     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4 h-4" />
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
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 border border-amber-400 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Canlı Bildirimi Test Et</span>
          </button>
          <button
            onClick={onNewProposal}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 border border-blue-500 cursor-pointer"
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 border border-amber-200">
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
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <span>İncele</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Quick Action Shortcuts Bar                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onNewProposal}
          className="p-3.5 bg-white border border-slate-200 hover:border-blue-500 rounded-xl shadow-xs text-left transition-all flex items-center gap-3 group cursor-pointer"
        >
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">Hızlı Teklif Ekle</div>
            <div className="text-[10px] text-slate-500">Yeni teklif formu aç</div>
          </div>
        </button>

        {onOpenReports && (
          <button
            onClick={onOpenReports}
            className="p-3.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl shadow-xs text-left transition-all flex items-center gap-3 group cursor-pointer"
          >
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 group-hover:scale-105 transition-transform">
              <FileBarChart2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Detaylı Raporlar</div>
              <div className="text-[10px] text-slate-500">Finansal analiz ve tablo</div>
            </div>
          </button>
        )}

        <button
          onClick={onOpenCustomerSimulator}
          className="p-3.5 bg-white border border-slate-200 hover:border-amber-500 rounded-xl shadow-xs text-left transition-all flex items-center gap-3 group cursor-pointer"
        >
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 fill-amber-500" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900">Müşteri Simülatörü</div>
            <div className="text-[10px] text-slate-500">Onay bildirim testi</div>
          </div>
        </button>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-3.5 bg-white border border-slate-200 hover:border-purple-500 rounded-xl shadow-xs text-left transition-all flex items-center gap-3 group cursor-pointer"
          >
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100 group-hover:scale-105 transition-transform">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Sistem Ayarları</div>
              <div className="text-[10px] text-slate-500">Firma & İnternet URL</div>
            </div>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Key Metric KPI Cards Grid (Matches DetailedReports Style)      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Approved Revenue Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Onaylanan Ciro</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(totalApprovedAmount, 'TRY')}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
              <span>{approvedProposals.length} Onaylı Teklif</span>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Pending Opportunities Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Onay Bekleyen</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Toplam Teklif & Oran</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {totalCount} Adet
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Kazanma Oranı</span>
              <span className="font-bold text-blue-600 font-mono">%{conversionRate}</span>
            </div>
          </div>
        </div>

        {/* Devices & Kalem Metrics Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cihaz & İşlem Kalemi</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
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
      {/* Target Revenue Progress & Online View Rates                   */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Monthly Target Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-900 uppercase tracking-wider">Aylık Ciro Hedefi Performansı</span>
            </div>
            <div className="font-mono text-slate-700">
              <strong className="text-emerald-600 font-bold">{formatCurrency(totalApprovedAmount, 'TRY')}</strong> / {formatCurrency(monthlyGoal, 'TRY')}
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${goalProgressPercent}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Hedef Tamamlanma Oranı</span>
            <span className="font-bold text-slate-900 font-mono">%{goalProgressPercent}</span>
          </div>
        </div>

        {/* Customer Online View Rate Meter */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-900 uppercase tracking-wider">Müşteri Online İnceleme Etkileşimi</span>
            </div>
            <div className="font-mono text-slate-700">
              <strong className="text-amber-600 font-bold">{viewedProposalsCount}</strong> / {totalCount} Teklif İncenlendi
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${viewRate}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Müşteri İnceleme Oranı</span>
            <span className="font-bold text-amber-600 font-mono">%{viewRate}</span>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* Analytics Charts Section (Recharts)                           */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Trend Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
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
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col overflow-hidden">
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
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
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
        <div className="lg:col-span-4 flex flex-col bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Canlı Bildirim Akışı</span>
            </h3>
            <span className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">CANLI</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px]">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Henüz canlı bildirim kaydı yok.
              </div>
            ) : (
              notifications.slice(0, 6).map((notif) => {
                let borderClass = "border-l-4 border-slate-300 bg-slate-50";
                let typeText = "SİSTEM MESAJI";
                let typeColor = "text-slate-600";

                if (notif.type === 'ONAY') {
                  borderClass = "border-l-4 border-emerald-500 bg-emerald-50/50";
                  typeText = "TEKLİF ONAYLANDI";
                  typeColor = "text-emerald-700";
                } else if (notif.type === 'RET') {
                  borderClass = "border-l-4 border-rose-500 bg-rose-50/50";
                  typeText = "TEKLİF REDDEDİLDİ";
                  typeColor = "text-rose-700";
                } else if (notif.type === 'GORUNTULEME') {
                  borderClass = "border-l-4 border-blue-500 bg-blue-50/50";
                  typeText = "TEKLİF GÖRÜLDÜ";
                  typeColor = "text-blue-700";
                } else if (notif.type === 'EPOSTA_GONDERILDI') {
                  borderClass = "border-l-4 border-amber-500 bg-amber-50/50";
                  typeText = "E-POSTA İLETİLDİ";
                  typeColor = "text-amber-700";
                }

                return (
                  <div
                    key={notif.id}
                    onClick={() => onSelectProposal(notif.proposalId)}
                    className={`p-3.5 ${borderClass} rounded-r-lg cursor-pointer hover:brightness-95 transition-all text-xs space-y-1`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${typeColor}`}>
                        {typeText}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-slate-800 font-medium leading-snug">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <span>{notif.customerName}</span>
                      <span className="font-mono font-bold text-blue-600">{notif.proposalNumber}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <button
              onClick={onOpenCustomerSimulator}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-amber-400 shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Müşteri Onayını Şimdi Simüle Et</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
