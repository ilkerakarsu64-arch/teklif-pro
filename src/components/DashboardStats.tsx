import React from 'react';
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
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  proposals,
  notifications,
  onSelectProposal,
  onNewProposal,
  onOpenCustomerSimulator
}) => {
  // Calculations
  const totalCount = proposals.length;
  const approvedProposals = proposals.filter(p => p.status === 'ONAYLANDI');
  const pendingProposals = proposals.filter(p => p.status === 'GONDERILDI' || p.status === 'INCELENIYOR');
  const rejectedProposals = proposals.filter(p => p.status === 'REDDEDILDI');

  const totalApprovedAmount = approvedProposals.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalPendingAmount = pendingProposals.reduce((sum, p) => sum + p.grandTotal, 0);

  const conversionRate = totalCount > 0 
    ? Math.round((approvedProposals.length / totalCount) * 100) 
    : 0;

  // Generate 30-day timeline chart data
  const chartData = React.useMemo(() => {
    const result = [];
    // Find the latest proposal date or use today
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

      const dayPending = proposals.filter(p => {
        const pDate = p.issueDate || p.createdAt?.split('T')[0];
        return pDate === dateStr && (p.status === 'GONDERILDI' || p.status === 'INCELENIYOR');
      });

      const dayRejected = proposals.filter(p => {
        const pDate = p.issueDate || p.createdAt?.split('T')[0];
        return pDate === dateStr && p.status === 'REDDEDILDI';
      });

      const revenue = dayApproved.reduce((sum, p) => sum + p.grandTotal, 0);
      const totalVolume = dayProposals.reduce((sum, p) => sum + p.grandTotal, 0);

      result.push({
        displayDate,
        dateStr,
        ciro: revenue,
        toplamHacim: totalVolume,
        toplamTeklif: dayProposals.length,
        onaylanan: dayApproved.length,
        bekleyen: dayPending.length,
        reddedilen: dayRejected.length
      });
    }

    return result;
  }, [proposals]);

  // Pie chart data for status breakdown
  const statusPieData = [
    { name: 'Onaylandı', value: approvedProposals.length, color: '#10b981' },
    { name: 'Onay Bekliyor', value: pendingProposals.length, color: '#f97316' },
    { name: 'Reddedildi', value: rejectedProposals.length, color: '#f43f5e' },
    { name: 'Taslak', value: proposals.filter(p => p.status === 'TASLAK').length, color: '#64748b' }
  ].filter(item => item.value > 0);

  // Custom Chart Tooltips
  const CustomRevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-sm border border-slate-700 shadow-xl text-xs space-y-1.5 font-sans">
          <p className="font-bold border-b border-slate-800 pb-1 text-slate-300 font-mono">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-400 font-semibold flex justify-between gap-6">
              <span>Onaylanan Ciro:</span>
              <span className="font-mono">{formatCurrency(payload[0]?.value || 0, 'TRY')}</span>
            </p>
            {payload[1] && (
              <p className="text-blue-400 font-semibold flex justify-between gap-6">
                <span>Toplam Teklif Hacmi:</span>
                <span className="font-mono">{formatCurrency(payload[1]?.value || 0, 'TRY')}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomCountTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-sm border border-slate-700 shadow-xl text-xs space-y-1 font-sans">
          <p className="font-bold border-b border-slate-800 pb-1 text-slate-300 font-mono">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-semibold flex justify-between gap-6">
              <span>{entry.name}:</span>
              <span className="font-mono">{entry.value} Adet</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-sm p-6 sm:p-8 border border-slate-800 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-blue-900/60 text-blue-300 border border-blue-700/50 text-[11px] font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Otomatik Onay & Bildirim Yönetimi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Teklif Performans ve Takip Paneli
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Müşterilerinize doğrudan e-posta ile teklif gönderin. Müşteriler teklifi görüntülediğinde, onayladığında veya reddettiğinde sisteminize anında canlı bildirim düşer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenCustomerSimulator}
              className="px-4 py-2.5 rounded-sm bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-xs flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Canlı Bildirimi Test Et</span>
            </button>
            <button
              onClick={onNewProposal}
              className="px-5 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide transition-colors shadow-xs"
            >
              + Yeni Teklif Oluştur
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Proposals */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Aktif Teklifler
            </p>
            <div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2 text-slate-900 font-mono">
            {totalCount}
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dönüşüm Oranı</span>
            <span className="font-bold text-blue-600">%{conversionRate}</span>
          </div>
        </div>

        {/* Onay Bekleyen */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Onay Bekleyen
            </p>
            <div className="w-8 h-8 rounded-sm bg-orange-50 flex items-center justify-center text-orange-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2 text-orange-500 font-mono">
            {pendingProposals.length}
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Bekleyen Tutar</span>
            <span className="font-semibold text-slate-700 font-mono">{formatCurrency(totalPendingAmount, 'TRY')}</span>
          </div>
        </div>

        {/* Bu Ay Onaylanan */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Onaylanan Hacim
            </p>
            <div className="w-8 h-8 rounded-sm bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2 text-emerald-600 font-mono">
            {formatCurrency(totalApprovedAmount, 'TRY')}
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600">
            <span>{approvedProposals.length} Onaylı Teklif</span>
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Reddedilen */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Reddedilen Teklifler
            </p>
            <div className="w-8 h-8 rounded-sm bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2 text-slate-900 font-mono">
            {rejectedProposals.length}
          </p>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Red Oranı</span>
            <span className="font-semibold text-rose-500">
              %{totalCount > 0 ? Math.round((rejectedProposals.length / totalCount) * 100) : 0}
            </span>
          </div>
        </div>

      </div>

      {/* Analytics Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Trend Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
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
                <span className="text-slate-600">Onaylanan Ciro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-300 inline-block"></span>
                <span className="text-slate-600">Toplam Hacim</span>
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
                    <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                <Tooltip content={<CustomRevenueTooltip />} />
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
                  stroke="#60a5fa" 
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#colorHacim)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown & Conversion Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-sm p-6 space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              <span>Teklif Onay & Durum Oranları</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tüm tekliflerin güncel durum dağılımı
            </p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
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
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '2px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
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
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-slate-600 font-semibold">{pendingProposals.length} Bekleyen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-600 font-semibold">{rejectedProposals.length} Red</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              <span className="text-slate-600 font-semibold">{proposals.filter(p => p.status === 'TASLAK').length} Taslak</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Recent Proposals & Live Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Proposals (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800 text-sm tracking-tight">Son Oluşturulan Teklifler</h2>
              <p className="text-xs text-slate-400">Güncel müşteri teklif listesi ve canlı onay durumları</p>
            </div>
            <button 
              onClick={onNewProposal} 
              className="text-xs text-blue-600 font-bold uppercase tracking-widest hover:underline cursor-pointer"
            >
              + Teklif Ekle
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 font-semibold">Teklif / Müşteri</th>
                  <th className="px-6 py-3 font-semibold">Tarih</th>
                  <th className="px-6 py-3 font-semibold">Tutar</th>
                  <th className="px-6 py-3 font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.slice(0, 6).map((proposal) => (
                  <tr
                    key={proposal.id}
                    onClick={() => onSelectProposal(proposal.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-blue-600 font-mono font-semibold">{proposal.proposalNumber}</span>
                        <span>•</span>
                        <span className="truncate">{proposal.customer.companyName || proposal.customer.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{proposal.title}</div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {formatDate(proposal.issueDate)}
                    </td>

                    <td className="px-6 py-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {formatCurrency(proposal.grandTotal, proposal.currency)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {proposal.status === 'ONAYLANDI' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 rounded-sm border border-emerald-200">
                          Müşteri Onayladı
                        </span>
                      )}
                      {proposal.status === 'REDDEDILDI' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-rose-50 text-rose-700 rounded-sm border border-rose-200">
                          Reddedildi
                        </span>
                      )}
                      {proposal.status === 'INCELENIYOR' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-amber-50 text-amber-700 rounded-sm border border-amber-200">
                          İnceleniyor
                        </span>
                      )}
                      {proposal.status === 'GONDERILDI' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-blue-50 text-blue-600 rounded-sm border border-blue-200">
                          Mail Gönderildi
                        </span>
                      )}
                      {proposal.status === 'TASLAK' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-slate-100 text-slate-600 rounded-sm border border-slate-200">
                          Taslak
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Real-time Notifications (4 cols) */}
        <div className="lg:col-span-4 flex flex-col bg-white border border-slate-200 rounded-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-sm">
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-100">Bildirim Merkezi</h3>
            <span className="bg-blue-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">CANLI</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px]">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Henüz canlı bildirim kaydedilmedi.
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
                  typeText = "E-POSTA / TEKLİF GÖRÜLDÜ";
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
                    className={`p-4 ${borderClass} rounded-r-sm cursor-pointer hover:brightness-95 transition-all text-xs`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${typeColor}`}>
                        {typeText}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-slate-800 font-medium mt-1 leading-snug">
                      {notif.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <span>{notif.customerName}</span>
                      <span className="font-mono font-semibold text-blue-600">{notif.proposalNumber}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-sm">
            <button
              onClick={onOpenCustomerSimulator}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-amber-400 font-bold text-xs rounded-sm transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Müşteri Onayını Şimdi Simüle Et</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
