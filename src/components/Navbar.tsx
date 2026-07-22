import React, { useState } from 'react';
import { User } from '../types';
import { getRoleLabel, getUserPermissions } from '../utils/auth';
import { 
  FileText, 
  Plus, 
  Bell, 
  MonitorPlay, 
  Users, 
  LayoutDashboard, 
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'proposals' | 'customers' | 'reports' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'proposals' | 'customers' | 'reports' | 'settings') => void;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: 'dashboard' | 'proposals' | 'customers' | 'reports' | 'settings') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Kontrol Paneli',
      icon: LayoutDashboard,
      show: true
    },
    {
      id: 'proposals' as const,
      label: 'Teklifler',
      icon: FileText,
      show: true
    },
    {
      id: 'customers' as const,
      label: 'Müşteriler',
      icon: Users,
      show: true
    },
    {
      id: 'reports' as const,
      label: 'Detaylı Raporlar',
      icon: BarChart3,
      show: true
    },
    {
      id: 'settings' as const,
      label: 'Ayarlar',
      icon: SettingsIcon,
      show: permissions.canManageSettings
    }
  ];

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* MOBILE TOP BAR (Only visible on small screens < md)           */}
      {/* ------------------------------------------------------------- */}
      <header className="md:hidden sticky top-0 z-40 bg-white text-slate-900 border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-xs">
        <div 
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-slate-900 tracking-tight">TEKLİFPRO</span>
              <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 border border-blue-200 rounded">
                PRO
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
            aria-label="Bildirimler"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* VERTICAL LEFT SIDEBAR PANEL (Desktop fixed & Mobile drawer)    */}
      {/* ------------------------------------------------------------- */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white text-slate-800 border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-sm ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header / Logo Section */}
        <div className="p-5 border-b border-slate-150 bg-slate-50/70">
          <div 
            onClick={() => handleNavClick('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20 transition-transform group-hover:scale-105">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                  TEKLİFPRO
                </span>
                <span className="px-1.5 py-0.5 text-[9px] uppercase font-extrabold tracking-widest bg-blue-100 text-blue-700 border border-blue-200 rounded">
                  PRO
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold truncate">
                Teklif & Canlı Onay
              </p>
            </div>
          </div>
        </div>

        {/* Action Button & Main Navigation Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* New Proposal CTA Button */}
          {permissions.canCreateProposal && (
            <button
              onClick={() => {
                onNewProposal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide shadow-md shadow-blue-600/20 transition-all hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>YENİ TEKLİF OLUŞTUR</span>
            </button>
          )}

          {/* Navigation Links Group */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              MENÜ
            </p>
            <nav className="space-y-1">
              {navItems.filter(item => item.show).map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Extra Tools Section */}
          <div className="pt-4 border-t border-slate-150">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              ARAÇLAR & BİLDİRİMLER
            </p>
            <div className="space-y-1">
              
              {/* Customer Simulator Button */}
              <button
                onClick={() => {
                  onOpenCustomerSimulator();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer"
                title="Müşteri onay/ret simülatörünü başlat ve canlı bildirimi test et"
              >
                <MonitorPlay className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="flex-1 text-left truncate">Müşteri Ekranı Test</span>
              </button>

              {/* Notifications Trigger */}
              <button
                onClick={() => {
                  onOpenNotifications();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-500" />
                  <span>Bildirimler</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

            </div>
          </div>

        </div>

        {/* Footer / User Profile & Logout Section */}
        {currentUser && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/80">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-sm text-blue-700 shrink-0">
                {currentUser.name.slice(0, 1).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] font-mono font-semibold text-blue-600 uppercase tracking-wider truncate">
                  {getRoleLabel(currentUser.role)}
                </p>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors shrink-0 cursor-pointer"
                title="Sistemden Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </aside>
    </>
  );
};
