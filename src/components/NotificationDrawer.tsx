import React from 'react';
import { AppNotification } from '../types';
import { formatDateTime, formatCurrency } from '../utils/formatters';
import { Bell, CheckCircle2, XCircle, Eye, Send, Trash2, CheckCheck, X } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onSelectProposal: (proposalId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onMarkAsRead,
  onClearAll,
  onSelectProposal
}) => {
  if (!isOpen) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'ONAY':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'RET':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'GORUNTULEME':
        return <Eye className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'EPOSTA_GONDERILDI':
        return <Send className="w-4 h-4 text-blue-600 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-blue-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              )}
            </div>
            <h2 className="font-bold text-white text-sm uppercase tracking-widest">
              Bildirim Merkezi
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-sm font-mono">
                {unreadCount} YENİ
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-sm hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tümünü Okundu İşaretle
            </button>
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 hover:text-rose-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Temizle
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-sm bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-slate-700 font-bold text-xs uppercase tracking-wider">Henüz bir bildirim yok</p>
              <p className="text-xs text-slate-400 mt-1">Müşterileriniz teklifleri açtığında veya onayladığında burada gözükecektir.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  onMarkAsRead(notif.id);
                  onSelectProposal(notif.proposalId);
                  onClose();
                }}
                className={`p-4 cursor-pointer transition-colors flex gap-3 ${
                  !notif.isRead 
                    ? 'bg-blue-50/60 hover:bg-blue-50 border-l-4 border-blue-600' 
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="pt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-xs font-bold truncate ${
                      !notif.isRead ? 'text-slate-900' : 'text-slate-700'
                    }`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {formatDateTime(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.customerNote && (
                    <div className="mt-2 p-2 rounded-sm bg-slate-50 border border-slate-200 text-xs italic text-slate-700">
                      &quot;{notif.customerNote}&quot;
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono font-bold text-blue-600">
                      {notif.proposalNumber}
                    </span>
                    {notif.amount !== undefined && (
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(notif.amount, (notif.currency as any) || 'TRY')}
                      </span>
                    )}
                  </div>
                </div>

                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-sm bg-blue-600 shrink-0 self-center" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-500 font-mono">
          Websocket Canlı Bildirim Aktif
        </div>
      </div>
    </div>
  );
};
