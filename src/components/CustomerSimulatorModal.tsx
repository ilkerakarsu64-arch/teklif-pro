import React, { useState } from 'react';
import { Proposal } from '../types';
import { formatCurrency } from '../utils/formatters';
import { MonitorPlay, CheckCircle2, XCircle, X, Sparkles } from 'lucide-react';

interface CustomerSimulatorModalProps {
  proposal: Proposal | null;
  proposals: Proposal[];
  isOpen: boolean;
  onClose: () => void;
  onResponseSubmitted: (type: 'ONAY' | 'RET') => void;
}

export const CustomerSimulatorModal: React.FC<CustomerSimulatorModalProps> = ({
  proposal,
  proposals,
  isOpen,
  onClose,
  onResponseSubmitted
}) => {
  const [selectedPropId, setSelectedPropId] = useState<string>(
    proposal?.id || proposals[0]?.id || ''
  );
  const [note, setNote] = useState('Teklif şartları uygun, onaylıyoruz. Çalışmayı başlatabilirsiniz.');
  const [reason, setReason] = useState('Bütçe kısıtları nedeniyle bu teklifi ertelemek durumundayız.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentProp = proposals.find(p => p.id === selectedPropId) || proposal || proposals[0];

  const handleApprove = async () => {
    if (!currentProp) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/proposals/${currentProp.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: note,
          signatureName: currentProp.customer.name
        })
      });
      if (res.ok) {
        onResponseSubmitted('ONAY');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!currentProp) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/proposals/${currentProp.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason
        })
      });
      if (res.ok) {
        onResponseSubmitted('RET');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 text-white rounded-sm max-w-lg w-full border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <MonitorPlay className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-white flex items-center gap-2">
                <span>Müşteri Ekranı Simülatörü</span>
                <span className="px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">CANLI TEST</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Müşteriniz e-postadaki linke tıklayıp onay verdiğinde canlı bildirimin gelişini test edin.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Proposal Selector */}
          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1 text-[10px]">
              Test Edilecek Teklif Seçin:
            </label>
            <select
              value={selectedPropId}
              onChange={(e) => setSelectedPropId(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-sm text-white font-medium focus:ring-2 focus:ring-blue-500/30"
            >
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.proposalNumber} - {p.customer.companyName || p.customer.name} ({formatCurrency(p.grandTotal, p.currency)})
                </option>
              ))}
            </select>
          </div>

          {currentProp && (
            <div className="p-3 bg-slate-800/80 rounded-sm border border-slate-700 space-y-1">
              <div className="font-bold text-blue-400">{currentProp.title}</div>
              <div className="text-slate-300">Müşteri: {currentProp.customer.companyName} ({currentProp.customer.email})</div>
              <div className="text-slate-400">Durum: <span className="text-amber-300 font-bold uppercase tracking-wider">{currentProp.status}</span></div>
            </div>
          )}

          {/* Action Simulation Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            
            {/* Approve Box */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-sm space-y-3">
              <div className="font-bold text-emerald-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Müşteri Onayı</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">Onay Notu:</label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-sm text-[11px] text-slate-200"
                />
              </div>

              <button
                onClick={handleApprove}
                disabled={loading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs border border-emerald-500"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Onayla & Bildir</span>
              </button>
            </div>

            {/* Reject Box */}
            <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-sm space-y-3">
              <div className="font-bold text-rose-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Müşteri Reddi</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">Red Nedeni:</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-sm text-[11px] text-slate-200"
                />
              </div>

              <button
                onClick={handleReject}
                disabled={loading}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs border border-rose-500"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reddet & Bildir</span>
              </button>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-400 font-mono">
          Gerçek veritabanı durumunu günceller ve üstteki bildirim çanına anında sesli & görsel uyarı düşürür.
        </div>

      </div>
    </div>
  );
};
