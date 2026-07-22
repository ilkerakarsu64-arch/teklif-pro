import React from 'react';
import { User } from '../types';
import { getRoleLabel, getRoleBadgeStyle, getUserPermissions } from '../utils/auth';
import { 
  FileText, 
  Plus, 
  Bell, 
  MonitorPlay, 
  Users, 
  LayoutDashboard, 
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'proposals' | 'customers' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'proposals' | 'customers' | 'settings') => void;
  onNewProposal: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenCustomerSimulator: () => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewProposal,
  unreadCount,
  onOpenNotifications,
  onOpenCustomerSimulator,
  currentUser,
  onLogout
}) => {
  const permissions = currentUser ? getUserPermissions(currentUser.role) : getUserPermissions('ADMIN');

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-white font-bold shadow-xs transition-transform group-hover:scale-105">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tighter">TEKLİFPRO</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-sm">
                  PRO
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 hidden sm:block font-medium">Teklif & Canlı Onay Sistemi</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-slate-800 pl-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-semibold tracking-wide transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Kontrol Paneli
            </button>

            <button
              onClick={() => setActiveTab('proposals')}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-semibold tracking-wide transition-colors ${
                activeTab === 'proposals'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              Teklifler
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-semibold tracking-wide transition-colors ${
                activeTab === 'customers'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Users className="w-4 h-4" />
              Müşteriler
            </button>

            {permissions.canManageSettings && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-semibold tracking-wide transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                Ayarlar
              </button>
            )}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Customer Portal Simulator Test Button */}
          <button
            onClick={onOpenCustomerSimulator}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-slate-800 text-amber-400 border border-amber-500/30 hover:bg-slate-800/90 text-xs font-semibold tracking-wide transition-all"
            title="Müşteri onay/ret simülatörünü başlat ve canlı bildirimi test et"
          >
            <MonitorPlay className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Müşteri Ekranı Test</span>
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-sm bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
            aria-label="Bildirimler"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-sm bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Create Proposal Button */}
          {permissions.canCreateProposal && (
            <button
              onClick={onNewProposal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold tracking-wide transition-colors border border-blue-500"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Yeni Teklif Oluştur</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          )}

          {/* User Profile & Role Badge */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-100 max-w-[120px] truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>

              <div className="w-8 h-8 rounded-sm bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
                {currentUser.name.slice(0, 1).toUpperCase()}
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-sm bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 transition-colors"
                title="Sistemden Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
