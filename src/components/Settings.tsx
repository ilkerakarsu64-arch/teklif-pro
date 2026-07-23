import React, { useState } from 'react';
import { AppSettings, Proposal, Customer, User } from '../types';
import { UserManagement } from './UserManagement';
import { getPublicPortalUrl } from '../utils/formatters';
import { 
  Building2, 
  FileText, 
  Bell, 
  Palette, 
  Database, 
  Save, 
  CheckCircle2, 
  RotateCcw, 
  Download, 
  Upload, 
  Volume2, 
  VolumeX, 
  Printer,
  Sparkles,
  CreditCard,
  Users,
  Globe,
  Sliders,
  ShieldCheck,
  Check,
  Zap
} from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void>;
  proposals: Proposal[];
  customers: Customer[];
  onResetData: () => Promise<void>;
  users: User[];
  onAddUser: (userData: Partial<User>) => Promise<any>;
  onUpdateUser: (id: string, userData: Partial<User>) => Promise<any>;
  onDeleteUser: (id: string) => Promise<void>;
  currentUser: User | null;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  proposals,
  customers,
  onResetData,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'proposalDefaults' | 'printOptions' | 'notifications' | 'users' | 'appearance' | 'data'>('company');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync state if settings prop updates
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleCompanyChange = (field: keyof AppSettings['company'], value: string) => {
    setFormData(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value }
    }));
  };

  const handleProposalDefaultsChange = (field: keyof AppSettings['proposalDefaults'], value: any) => {
    setFormData(prev => ({
      ...prev,
      proposalDefaults: { ...prev.proposalDefaults, [field]: value }
    }));
  };

  const handlePrintOptionsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      printOptions: {
        showLogo: prev.printOptions?.showLogo ?? true,
        showSignatures: prev.printOptions?.showSignatures ?? true,
        showBankDetails: prev.printOptions?.showBankDetails ?? true,
        accentColor: prev.printOptions?.accentColor || 'blue',
        [field]: value
      }
    }));
  };

  const handleNotificationsChange = (field: keyof AppSettings['notifications'], value: any) => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }));
  };

  const handleAppearanceChange = (field: keyof AppSettings['appearance'], value: any) => {
    setFormData(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSaveSettings(formData);
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export JSON file
  const handleExportData = () => {
    const exportObject = {
      exportDate: new Date().toISOString(),
      version: '2.5',
      settings: formData,
      customers,
      proposals
    };
    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teklifpro_yedek_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto antialiased">
      
      {/* Vibrant Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">
                Sistem & Firma Konfigürasyonu
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-bold backdrop-blur-xs border border-white/30">
                v2.5 Aktif
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              Kurumsal firma bilgilerinizi, IBAN hesaplarınızı, teklif parametrelerinizi ve arayüz seçeneklerinizi yönetin.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/30 border border-emerald-400 cursor-pointer active:scale-95 shrink-0"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
              <span>Ayarlar Kaydedildi!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}</span>
            </>
          )}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-2 border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-md animate-in fade-in zoom-in-95 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Sistem ve kurumsal firma ayarları başarıyla güncellendi ve veritabanına kaydedildi.</span>
        </div>
      )}

      {/* Main Settings Navigation & Form Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Colorful Sub-Menu Navigation Tiles */}
        <div className="lg:col-span-1 space-y-2">
          
          {/* 1. Firma Bilgileri */}
          <button
            type="button"
            onClick={() => setActiveSubTab('company')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeSubTab === 'company'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                : 'bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/80 hover:border-blue-300 hover:translate-x-1'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${activeSubTab === 'company' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'}`}>
              <Building2 className="w-4 h-4" />
            </div>
            <span>Firma & Banka Bilgileri</span>
          </button>

          {/* 2. Teklif Parametreleri */}
          <button
            type="button"
            onClick={() => setActiveSubTab('proposalDefaults')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeSubTab === 'proposalDefaults'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
                : 'bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700/80 hover:border-indigo-300 hover:translate-x-1'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${activeSubTab === 'proposalDefaults' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'}`}>
              <FileText className="w-4 h-4" />
            </div>
            <span>Teklif Parametreleri</span>
          </button>

          {/* 3. Baskı Görünümü */}
          <button
            type="button"
            onClick={() => setActiveSubTab('printOptions')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeSubTab === 'printOptions'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
                : 'bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700/80 hover:border-emerald-300 hover:translate-x-1'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${activeSubTab === 'printOptions' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'}`}>
              <Printer className="w-4 h-4" />
            </div>
            <span>Baskı & Evrak Şablonu</span>
          </button>

          {/* 4. Bildirimler */}
          <button
            type="button"
            onClick={() => setActiveSubTab('notifications')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeSubTab === 'notifications'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                : 'bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700/80 hover:border-amber-300 hover:translate-x-1'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${activeSubTab === 'notifications' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'}`}>
              <Bell className="w-4 h-4" />
            </div>
            <span>Bildirimler & Sesler</span>
          </button>

          {/* 5. Kullanıcı Yönetimi */}
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/25 scale-[1.02]'
                : 'bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-700/80 hover:border-purple-300 hover:translate-x-1'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${activeSubTab === 'users' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'}`}>
              <Users className="w-4 h-4" />
            </div>
            <span>Kullanıcı Yönetimi</span>
          </button>

          {/* 6. Görünüm & Tema */}
          <button
            type="button"
            onClick={() => setActiveSubTab('appearance')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeSubTab === 'appearance'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25 scale-[1.02]'
                : 'bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-700/80 hover:border-rose-300 hover:translate-x-1'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${activeSubTab === 'appearance' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400'}`}>
              <Palette className="w-4 h-4" />
            </div>
            <span>Görünüm & Tema</span>
          </button>

          {/* 7. Veri Tabanı & Sistem */}
          <button
            type="button"
            onClick={() => setActiveSubTab('data')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 cursor-pointer ${
              activeSubTab === 'data'
                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-md shadow-slate-900/25 scale-[1.02]'
                : 'bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:border-slate-400 hover:translate-x-1'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${activeSubTab === 'data' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
              <Database className="w-4 h-4" />
            </div>
            <span>Veri Tabanı & Sistem</span>
          </button>

        </div>

        {/* Form Content Display Card */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
          
          <div className="space-y-6">
            
            {/* 1. COMPANY & BANK DETAILS */}
            {activeSubTab === 'company' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Firma Profil & İletişim Bilgileri
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bu bilgiler teklif çıktılarında, müşteri ekranında ve resmi yazışmalarda görüntülenecektir.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Logo Upload Box */}
                  <div className="sm:col-span-2 bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {formData.company.logoUrl ? (
                        <img src={formData.company.logoUrl} alt="Firma Logosu" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="w-8 h-8 text-blue-500/60" />
                      )}
                    </div>
                    <div className="space-y-1.5 text-left w-full">
                      <label className="block font-bold text-slate-800 dark:text-slate-200">
                        Kurumsal Firma Logosu
                      </label>
                      <p className="text-[11px] text-slate-500">
                        PNG, JPG veya SVG formatında varsayılan teklif başlığında gösterilecek logo.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Logo Yükle / Seç</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  handleCompanyChange('logoUrl', reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {formData.company.logoUrl && (
                          <button
                            type="button"
                            onClick={() => handleCompanyChange('logoUrl', '')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Logoyu Kaldır
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Resmi Şirket Unvanı *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company.name}
                      onChange={(e) => handleCompanyChange('name', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hizmet & Slogan Alt Başlığı
                    </label>
                    <input
                      type="text"
                      value={formData.company.title}
                      onChange={(e) => handleCompanyChange('title', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                    />
                  </div>

                  {/* Public Web Link System Settings */}
                  <div className="sm:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50/80 dark:bg-blue-950/40 p-4.5 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="font-extrabold text-blue-950 dark:text-blue-300 text-xs flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                        <span>Çevrim İçi Müşteri Teklif Bağlantısı (Akıllı Web Link Sistemi)</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const detected = window.location.origin;
                          handleCompanyChange('publicUrl', detected);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Mevcut Alan Adını Otomatik Algıla</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Müşterilerinizin teklifi internetten incelemesi için özel bir web adresi girebilir veya boş bırakabilirsiniz. <strong>Boş bırakıldığında sistem aktif alan adını otomatik kullanır.</strong>
                    </p>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://sirketiniz.com (Boş bırakılırsa otomatik algılanır)"
                        value={formData.company.publicUrl || ''}
                        onChange={(e) => handleCompanyChange('publicUrl', e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl font-mono text-xs text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500/30 outline-none pr-20"
                      />
                      {formData.company.publicUrl && (
                        <button
                          type="button"
                          onClick={() => handleCompanyChange('publicUrl', '')}
                          className="absolute right-2 top-2 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold cursor-pointer"
                        >
                          Sıfırla
                        </button>
                      )}
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-blue-200/80 dark:border-blue-900/80 text-[11px] space-y-1">
                      <div className="text-slate-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Aktif Üretilen Çevrim İçi Kısa Teklif Bağlantısı Örneği:</span>
                      </div>
                      <a
                        href={getPublicPortalUrl(proposals[0]?.id || 'TKL-2026-1690', { company: formData.company })}
                        target="_blank"
                        rel="noreferrer"
                        className="block font-mono font-black text-blue-600 dark:text-blue-400 underline hover:text-blue-800 break-all"
                      >
                        {getPublicPortalUrl(proposals[0]?.id || 'TKL-2026-1690', { company: formData.company })}
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Vergi Dairesi
                    </label>
                    <input
                      type="text"
                      value={formData.company.taxOffice}
                      onChange={(e) => handleCompanyChange('taxOffice', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Vergi Numarası (VKN / TCKN)
                    </label>
                    <input
                      type="text"
                      value={formData.company.taxNumber}
                      onChange={(e) => handleCompanyChange('taxNumber', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Telefon
                    </label>
                    <input
                      type="text"
                      value={formData.company.phone}
                      onChange={(e) => handleCompanyChange('phone', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Resmi E-Posta
                    </label>
                    <input
                      type="email"
                      value={formData.company.email}
                      onChange={(e) => handleCompanyChange('email', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Web Sitesi
                    </label>
                    <input
                      type="url"
                      value={formData.company.website}
                      onChange={(e) => handleCompanyChange('website', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Adres
                    </label>
                    <textarea
                      rows={2}
                      value={formData.company.address}
                      onChange={(e) => handleCompanyChange('address', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                </div>

                {/* Bank Account Section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Banka & Ödeme IBAN Hesap Bilgileri</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-emerald-50/50 dark:bg-slate-800/60 p-4 rounded-xl border border-emerald-200 dark:border-slate-700">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Banka Adı
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Garanti BBVA"
                        value={formData.company.bankName || ''}
                        onChange={(e) => handleCompanyChange('bankName', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hesap Sahibi Unvanı
                      </label>
                      <input
                        type="text"
                        placeholder="TEKLİFPRO DİJİTAL A.Ş."
                        value={formData.company.bankAccountHolder || ''}
                        onChange={(e) => handleCompanyChange('bankAccountHolder', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        IBAN Numarası
                      </label>
                      <input
                        type="text"
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        value={formData.company.bankIban || ''}
                        onChange={(e) => handleCompanyChange('bankIban', e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-slate-700 rounded-lg font-mono font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/30 outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. PROPOSAL DEFAULTS */}
            {activeSubTab === 'proposalDefaults' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Teklif & Cihaz Parametreleri
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Yeni teklif oluşturulurken varsayılan geçerlilik süresi, para birimi, KDV oranı ve varsayılan notlar.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Teklif Numarası Öneki (Prefix)
                    </label>
                    <input
                      type="text"
                      value={formData.proposalDefaults.prefix}
                      onChange={(e) => handleProposalDefaultsChange('prefix', e.target.value)}
                      placeholder="Örn: TEK"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Örnek Numaralandırma: TEK-2026-001</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Varsayılan Geçerlilik Süresi (Gün)
                    </label>
                    <select
                      value={formData.proposalDefaults.validDays}
                      onChange={(e) => handleProposalDefaultsChange('validDays', Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <option value={7}>7 Gün</option>
                      <option value={14}>14 Gün (Tavsiye Edilen)</option>
                      <option value={30}>30 Gün</option>
                      <option value={60}>60 Gün</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Varsayılan Para Birimi
                    </label>
                    <select
                      value={formData.proposalDefaults.currency}
                      onChange={(e) => handleProposalDefaultsChange('currency', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <option value="TRY">₺ - Türk Lirası (TRY)</option>
                      <option value="USD">$ - Amerikan Doları (USD)</option>
                      <option value="EUR">€ - Euro (EUR)</option>
                      <option value="GBP">£ - İngiliz Sterlini (GBP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Varsayılan KDV Oranı (%)
                    </label>
                    <select
                      value={formData.proposalDefaults.taxRate}
                      onChange={(e) => handleProposalDefaultsChange('taxRate', Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                    >
                      <option value={20}>%20 KDV (Standart)</option>
                      <option value={10}>%10 KDV</option>
                      <option value={1}>%1 KDV</option>
                      <option value={0}>%0 (KDV Muaf)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cihaz Varsayılan Teklif Notu (Garanti & Teslimat Bilgisi)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.proposalDefaults.deviceDefaultNote || ''}
                      onChange={(e) => handleProposalDefaultsChange('deviceDefaultNote', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Varsayılan Ödeme Koşulları Şablonu
                    </label>
                    <textarea
                      rows={2}
                      value={formData.proposalDefaults.paymentTerms}
                      onChange={(e) => handleProposalDefaultsChange('paymentTerms', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. PRINT & DOCUMENT OPTIONS */}
            {activeSubTab === 'printOptions' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Baskı & Evrak Şablon Ayarları
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      İndirilen ve yazdırılan PDF evraklarındaki alan görünürlükleri.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">Firma Logosu Gösterilsin</div>
                      <div className="text-[11px] text-slate-500">PDF başında firma logosunu konumlandır.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.printOptions?.showLogo ?? true}
                      onChange={(e) => handlePrintOptionsChange('showLogo', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded-md cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">Banka & IBAN Bilgileri Gösterilsin</div>
                      <div className="text-[11px] text-slate-500">Ödeme bilgisi kutucuğunu teklif alt kısmına ekle.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.printOptions?.showBankDetails ?? true}
                      onChange={(e) => handlePrintOptionsChange('showBankDetails', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded-md cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">İmza & Kaşe Alanı Gösterilsin</div>
                      <div className="text-[11px] text-slate-500">Firma yetkilisi ve müşteri onay imza çizgisi ekle.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.printOptions?.showSignatures ?? true}
                      onChange={(e) => handlePrintOptionsChange('showSignatures', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. NOTIFICATIONS */}
            {activeSubTab === 'notifications' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Canlı Bildirimler & Ses Tercihleri
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Müşteri teklifi açtığında veya onayladığında anında tetiklenen sesli ve görsel uyarılar.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  
                  {/* Sound Alerts */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      {formData.notifications.soundEnabled ? (
                        <Volume2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">Sesli Bildirim Uyarıları</div>
                        <div className="text-[11px] text-slate-500">Müşteri teklifi onayladığında bildirim sesi çalınır.</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifications.soundEnabled}
                        onChange={(e) => handleNotificationsChange('soundEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Toast Popups */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">Ekran İçi Canlı Popup Bildirimler</div>
                        <div className="text-[11px] text-slate-500">Ekranın sağ alt köşesinde anlık canlı uyarı kartı gösterilir.</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifications.toastEnabled}
                        onChange={(e) => handleNotificationsChange('toastEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Email Sender Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        E-Posta Gönderen Görünür Unvanı
                      </label>
                      <input
                        type="text"
                        value={formData.notifications.senderName}
                        onChange={(e) => handleNotificationsChange('senderName', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Varsayılan E-Posta Konu Şablonu
                      </label>
                      <input
                        type="text"
                        value={formData.notifications.emailSubjectTemplate}
                        onChange={(e) => handleNotificationsChange('emailSubjectTemplate', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 5. USER MANAGEMENT TAB */}
            {activeSubTab === 'users' && (
              <div className="animate-in fade-in duration-200">
                <UserManagement
                  users={users}
                  onAddUser={onAddUser}
                  onUpdateUser={onUpdateUser}
                  onDeleteUser={onDeleteUser}
                  currentUser={currentUser}
                />
              </div>
            )}

            {/* 6. APPEARANCE */}
            {activeSubTab === 'appearance' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Görünüm & Tema Ayarları
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Uygulama arayüzünün renk modu ve liste yoğunluk seçenekleri.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Arayüz Teması Modu
                    </label>
                    <select
                      value={formData.appearance.theme}
                      onChange={(e) => handleAppearanceChange('theme', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <option value="light">Aydınlık Mod (Light)</option>
                      <option value="dark">Karanlık Mod (Dark)</option>
                      <option value="system">Otomatik (Sistem Modu)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-end">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">Kompakt Tablo Görünümü</div>
                      <div className="text-[11px] text-slate-500">Listelerde daha sıkıştırılmış teklif satırları.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.appearance.compactView}
                      onChange={(e) => handleAppearanceChange('compactView', e.target.checked)}
                      className="w-5 h-5 text-rose-600 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. DATA MANAGEMENT */}
            {activeSubTab === 'data' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Veri Tabanı & Sistem Yedekleme
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Teklif ve müşteri verilerinizi JSON formatında dışa aktarın veya veritabanını fabrika ayarlarına döndürün.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  
                  {/* Database Info Box */}
                  <div className="p-4 bg-cyan-50/70 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800 flex items-center gap-3 shadow-2xs">
                    <Database className="w-6 h-6 text-cyan-600 shrink-0" />
                    <div>
                      <div className="font-bold text-cyan-950 dark:text-cyan-200 text-xs">SQLite Yerel Veri Tabanı Aktif</div>
                      <div className="text-[11px] text-cyan-700 dark:text-cyan-300 font-mono mt-0.5">
                        Tüm verileriniz SQLite <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded font-bold">teklif_pro.db</code> veritabanı dosyasında güvendedir.
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-2">
                        <Download className="w-4 h-4 text-blue-600" />
                        <span>Sistem Verilerini Dışa Aktar (Backup)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Tüm müşterilerinizi, tekliflerinizi ve sistem ayarlarınızı bilgisayarınıza <code className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200">.json</code> formatında yedekleyin.
                      </p>
                      <button
                        type="button"
                        onClick={handleExportData}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Yedek Dosyası İndir (.json)</span>
                      </button>
                    </div>

                    <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-3">
                      <div className="font-bold text-rose-950 dark:text-rose-300 text-xs flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                        <span>Fabrika Ayarlarına Dönüş</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Veritabanındaki demo verileri sıfırlar ve uygulamayı varsayılan ilk kurulum durumuna getirir.
                      </p>
                      {!showResetConfirm ? (
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(true)}
                          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Veritabanını Sıfırla</span>
                        </button>
                      ) : (
                        <div className="p-3 bg-white dark:bg-slate-900 border border-rose-300 rounded-lg space-y-2">
                          <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Emin misiniz? Tüm veriler silinecektir.</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await onResetData();
                                setShowResetConfirm(false);
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-md shadow-xs cursor-pointer"
                            >
                              Evet, Sıfırla
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowResetConfirm(false)}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-md cursor-pointer"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
