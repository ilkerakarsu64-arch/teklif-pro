import React, { useState, useMemo } from 'react';
import { Proposal, Customer } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Calendar, 
  Filter, 
  Download, 
  FileText, 
  PieChart as PieIcon, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Printer,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface DetailedReportsProps {
  proposals: Proposal[];
  customers: Customer[];
  onSelectProposal?: (id: string) => void;
}

export const DetailedReports: React.FC<DetailedReportsProps> = ({
  proposals,
  customers,
  onSelectProposal
}) => {
  const [dateRange, setDateRange] = useState<'all' | 'thisMonth' | 'thisQuarter' | 'thisYear'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');

  const activeCurr = (currencyFilter === 'ALL' ? 'TRY' : currencyFilter) as 'TRY' | 'USD' | 'EUR' | 'GBP';

  // Filter proposals based on selection
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      // Currency Filter
      if (currencyFilter !== 'ALL' && p.currency !== currencyFilter) {
        return false;
      }

      // Date Filter
      if (dateRange === 'all') return true;

      const pDate = new Date(p.issueDate);
      const now = new Date();

      if (dateRange === 'thisMonth') {
        return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
      }
      if (dateRange === 'thisQuarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const pQuarter = Math.floor(pDate.getMonth() / 3);
        return pQuarter === currentQuarter && pDate.getFullYear() === now.getFullYear();
      }
      if (dateRange === 'thisYear') {
        return pDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [proposals, dateRange, currencyFilter]);

  // Overall Financial Calculations
  const stats = useMemo(() => {
    const totalVolume = filteredProposals.reduce((sum, p) => sum + p.grandTotal, 0);
    const approvedProposals = filteredProposals.filter(p => p.status === 'ONAYLANDI');
    const approvedVolume = approvedProposals.reduce((sum, p) => sum + p.grandTotal, 0);
    
    const pendingProposals = filteredProposals.filter(p => p.status === 'GONDERILDI' || p.status === 'INCELENIYOR');
    const pendingVolume = pendingProposals.reduce((sum, p) => sum + p.grandTotal, 0);

    const rejectedProposals = filteredProposals.filter(p => p.status === 'REDDEDILDI');
    const rejectedVolume = rejectedProposals.reduce((sum, p) => sum + p.grandTotal, 0);

    const totalCount = filteredProposals.length;
    const conversionRate = totalCount > 0 ? (approvedProposals.length / totalCount) * 100 : 0;
    const avgProposalValue = totalCount > 0 ? totalVolume / totalCount : 0;

    return {
      totalVolume,
      approvedVolume,
      pendingVolume,
      rejectedVolume,
      totalCount,
      approvedCount: approvedProposals.length,
      pendingCount: pendingProposals.length,
      rejectedCount: rejectedProposals.length,
      conversionRate,
      avgProposalValue
    };
  }, [filteredProposals]);

  // Status Distribution Chart Data
  const statusDistributionData = useMemo(() => {
    const counts = {
      ONAYLANDI: 0,
      GONDERILDI: 0,
      INCELENIYOR: 0,
      REDDEDILDI: 0,
      TASLAK: 0
    };

    filteredProposals.forEach(p => {
      if (counts[p.status as keyof typeof counts] !== undefined) {
        counts[p.status as keyof typeof counts] += 1;
      }
    });

    return [
      { name: 'Onaylandı', value: counts.ONAYLANDI, color: '#10b981' },
      { name: 'Gönderildi', value: counts.GONDERILDI, color: '#3b82f6' },
      { name: 'İnceleniyor', value: counts.INCELENIYOR, color: '#f59e0b' },
      { name: 'Reddedildi', value: counts.REDDEDILDI, color: '#ef4444' },
      { name: 'Taslak', value: counts.TASLAK, color: '#64748b' }
    ].filter(d => d.value > 0);
  }, [filteredProposals]);

  // Monthly Trend Chart Data
  const monthlyTrendData = useMemo(() => {
    const monthlyMap: { [key: string]: { month: string; Toplam: number; Onaylanan: number; Adet: number } } = {};

    filteredProposals.forEach(p => {
      const d = new Date(p.issueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('tr-TR', { month: 'short', year: '2-digit' });

      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: monthLabel, Toplam: 0, Onaylanan: 0, Adet: 0 };
      }

      monthlyMap[key].Toplam += p.grandTotal;
      monthlyMap[key].Adet += 1;
      if (p.status === 'ONAYLANDI') {
        monthlyMap[key].Onaylanan += p.grandTotal;
      }
    });

    return Object.keys(monthlyMap).sort().map(k => monthlyMap[k]);
  }, [filteredProposals]);

  // Customer Revenue Ranking Data (Top Customers)
  const topCustomersData = useMemo(() => {
    const customerMap: { [key: string]: { name: string; total: number; count: number } } = {};

    filteredProposals.forEach(p => {
      const custName = p.customer.companyName || p.customer.name || 'Bilinmeyen Müşteri';
      if (!customerMap[custName]) {
        customerMap[custName] = { name: custName, total: 0, count: 0 };
      }
      customerMap[custName].total += p.grandTotal;
      customerMap[custName].count += 1;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredProposals]);

  return (
    <div className="space-y-6">
      
      {/* ------------------------------------------------------------- */}
      {/* Page Header & Filter Controls                                */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Detaylı Raporlar & Analiz
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Teklif performansınızı, ciro hedeflerinizi ve dönüşüm oranlarınızı detaylı grafiklerle takip edin.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Date Filter Buttons */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                dateRange === 'all' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setDateRange('thisMonth')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                dateRange === 'thisMonth' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bu Ay
            </button>
            <button
              onClick={() => setDateRange('thisQuarter')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                dateRange === 'thisQuarter' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bu Çeyrek
            </button>
            <button
              onClick={() => setDateRange('thisYear')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                dateRange === 'thisYear' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bu Yıl
            </button>
          </div>

          {/* Currency Filter Dropdown */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-xs outline-none focus:border-blue-500"
          >
            <option value="ALL">Tüm Para Birimleri</option>
            <option value="TRY">₺ (TRY)</option>
            <option value="USD">$ (USD)</option>
            <option value="EUR">€ (EUR)</option>
          </select>

          {/* Export Report / Print */}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Raporu Yazdır</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Key Metric Stats Cards                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Toplam Teklif Hacmi</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(stats.totalVolume, activeCurr)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Toplam</span> <strong className="text-slate-700 font-bold">{stats.totalCount}</strong> <span>adet teklif</span>
            </div>
          </div>
        </div>

        {/* Approved Revenue Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Onaylanan Ciro</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
              {formatCurrency(stats.approvedVolume, activeCurr)}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{stats.approvedCount} Onaylı Teklif</span>
            </div>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Başarı / Dönüşüm Oranı</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-600 font-mono tracking-tight">
              %{stats.conversionRate.toFixed(1)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span>Ort. Teklif: </span>
              <strong className="font-mono text-slate-800 font-bold">
                {formatCurrency(stats.avgProposalValue, activeCurr)}
              </strong>
            </div>
          </div>
        </div>

        {/* Pending Opportunities Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bekleyen Fırsatlar</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 font-mono tracking-tight">
              {formatCurrency(stats.pendingVolume, activeCurr)}
            </div>
            <div className="text-xs text-amber-600 font-semibold mt-1">
              <span>{stats.pendingCount} Bekleyen / İncelenen</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Charts Row 1: Monthly Trend Area Chart & Status Pie Chart      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Trend Chart (Span 2) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Aylık Teklif & Ciro Trendi
              </h3>
              <p className="text-xs text-slate-400">Aylara göre toplam teklif hacmi ve onaylanan ciro karşılaştırması</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Toplam
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Onaylanan
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {monthlyTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Grafik oluşturulacak teklif verisi bulunamadı.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorToplam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOnay" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value) || 0, 'TRY')}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="Toplam" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorToplam)" />
                  <Area type="monotone" dataKey="Onaylanan" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOnay)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Teklif Durum Dağılımı
            </h3>
            <p className="text-xs text-slate-400">Tekliflerin durum yüzdeleri</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {statusDistributionData.length === 0 ? (
              <div className="text-xs text-slate-400">Veri yok</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} adet teklif`, 'Miktar']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend Table */}
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            {statusDistributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 font-mono">{item.value} Adet</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* Charts Row 2: Top Customers Ranking Bar Chart                 */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>En Yüksek Hacimli Müşteriler (Top 5)</span>
          </h3>
          <p className="text-xs text-slate-400">Toplam teklif tutarına göre sıralanmış lider müşteriler</p>
        </div>

        <div className="h-64 w-full pt-2">
          {topCustomersData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Henüz müşteri verisi bulunmuyor.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomersData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={140} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value) || 0, 'TRY'), 'Hacim']} />
                <Bar dataKey="total" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Detailed Proposals Report Table                               */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Filtrelenmiş Rapor Detay Listesi ({filteredProposals.length} Teklif)</span>
          </h3>
        </div>

        {filteredProposals.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Filtreleme kriterlerine uygun teklif bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Teklif No</th>
                  <th className="py-3 px-4">Başlık</th>
                  <th className="py-3 px-4">Müşteri</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4 text-right">Ara Toplam</th>
                  <th className="py-3 px-4 text-right">KDV</th>
                  <th className="py-3 px-4 text-right">Genel Toplam</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProposals.map((p) => (
                  <tr 
                    key={p.id}
                    onClick={() => onSelectProposal && onSelectProposal(p.id)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {p.proposalNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {p.title}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {p.customer.companyName || p.customer.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                      {formatDate(p.issueDate)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatCurrency(p.subtotal, p.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatCurrency(p.totalTax, p.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                      {formatCurrency(p.grandTotal, p.currency)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        p.status === 'ONAYLANDI' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        p.status === 'REDDEDILDI' ? 'bg-red-50 text-red-700 border-red-200' :
                        p.status === 'GONDERILDI' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        p.status === 'INCELENIYOR' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
