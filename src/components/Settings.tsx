import React, { useState } from 'react';
import { AppSettings, Proposal, Customer, User } from '../types';
import { UserManagement } from './UserManagement';
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
  Mail, 
  ShieldCheck, 
  Printer,
  Sparkles,
  CreditCard,
  Sliders,
  Check,
  Users
} from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void>;
  proposals: Proposal[];
  customers: Customer[];
  onResetData: () => Promise<void>;
  users: User[];
  onAddUser: (userData: Partial<User>) => Promise<void>;
  onUpdateUser: (id: string, userData: Partial<User>) => Promise<void>;
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

  // SMTP Test state
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testRecipientEmail, setTestRecipientEmail] = useState('');

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

  const handleSmtpChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      smtp: {
        host: prev.smtp?.host || '',
        port: prev.smtp?.port || 587,
        user: prev.smtp?.user || '',
        pass: prev.smtp?.pass || '',
        secure: prev.smtp?.secure || false,
        fromEmail: prev.smtp?.fromEmail || prev.company.email || '',
        [field]: value
      }
    }));
  };

  const handleTestSmtpConnection = async () => {
    const smtpData = formData.smtp || {
      host: '',
      port: 587,
      user: '',
      pass: '',
      secure: false,
      fromEmail: formData.company.email
    };

    setTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...smtpData,
          testRecipient: testRecipientEmail || formData.company.email
        })
      });
      const data = await res.json();
      setSmtpTestResult(data);
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'SMTP sunucusuna bağlanırken hata oluştu.'
      });
    } finally {
      setTestingSmtp(false);
    }
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
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Sistem & Firma Ayarları</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
              Detaylı Konfigürasyon
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kurumsal firma bilgilerinizi, banka IBAN hesaplarınızı, teklif şablonlarını ve baskı tercihlerini yönetin.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs border border-blue-500"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Kaydedildi!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</span>
            </>
          )}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-sm text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Sistem ve firma ayarları başarıyla güncellendi ve kaydedildi.</span>
        </div>
      )}

      {/* Main Settings Navigation & Body */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Settings Sub-Menu Navigation */}
        <div className="lg:col-span-1 space-y-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('company')}
            className={`w-full text-left px-3.5 py-2.5 rounded-sm text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'company'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Firma & Banka Bilgileri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('proposalDefaults')}
            className={`w-full text-left px-3.5 py-2.5 rounded-sm text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'proposalDefaults'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Teklif & Cihaz Parametreleri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('printOptions')}
            className={`w-full text-left px-3.5 py-2.5 rounded-sm text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'printOptions'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Baskı & Evrak Görünümü</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('notifications')}
            className={`w-full text-left px-3.5 py-2.5 rounded-sm text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'notifications'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Bildirimler & E-Posta (SMTP)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`w-full text-left px-3.5 py-2.5 rounded-sm text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'users'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Kullanıcı Yönetimi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('appearance')}
            className={`w-full text-left px-3.5 py-2.5 rounded-sm text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'appearance'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Palette className="w-4 h-4 shrink-0" />
            <span>Görünüm & Tema</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('data')}
            className={`w-full text-left px-3.5 py-2.5 rounded-sm text-xs font-semibold flex items-center gap-2.5 transition-colors ${
              activeSubTab === 'data'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Veri Tabanı & Sistem</span>
          </button>
        </div>

        {/* Sub-Tab Content Forms */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-sm border border-slate-200 dark:border-slate-800 shadow-xs">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. COMPANY & BANK DETAILS */}
            {activeSubTab === 'company' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Firma Profil & İletişim Bilgileri</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bu bilgiler çıktı alınan teklif evraklarında ve müşteriye giden e-posta antetlerinde resmi olarak görünecektir.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Logo Upload Box */}
                  <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {formData.company.logoUrl ? (
                        <img src={formData.company.logoUrl} alt="Firma Logosu" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1.5 text-left w-full">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">
                        Firma Logosu
                      </label>
                      <p className="text-[10px] text-slate-500">
                        PNG, JPG veya SVG formatında. Şeffaf arka planlı olması önerilir.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-650 rounded-sm font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Logo Seç</span>
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
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-sm font-semibold transition-colors"
                          >
                            Logoyu Kaldır
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Şirket Unvanı (Resmi) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company.name}
                      onChange={(e) => handleCompanyChange('name', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Hizmet / Slogan Alt Başlığı
                    </label>
                    <input
                      type="text"
                      value={formData.company.title}
                      onChange={(e) => handleCompanyChange('title', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Vergi Dairesi
                    </label>
                    <input
                      type="text"
                      value={formData.company.taxOffice}
                      onChange={(e) => handleCompanyChange('taxOffice', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Vergi Kimlik Numarası (VKN / TCKN)
                    </label>
                    <input
                      type="text"
                      value={formData.company.taxNumber}
                      onChange={(e) => handleCompanyChange('taxNumber', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Şirket Telefonu
                    </label>
                    <input
                      type="text"
                      value={formData.company.phone}
                      onChange={(e) => handleCompanyChange('phone', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Resmi E-Posta Adresi
                    </label>
                    <input
                      type="email"
                      value={formData.company.email}
                      onChange={(e) => handleCompanyChange('email', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Web Sitesi Adresi
                    </label>
                    <input
                      type="url"
                      value={formData.company.website}
                      onChange={(e) => handleCompanyChange('website', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Açık Adres Bilgisi
                    </label>
                    <textarea
                      rows={2}
                      value={formData.company.address}
                      onChange={(e) => handleCompanyChange('address', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Bank Account Section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Banka & Ödeme IBAN Bilgileri</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-sm border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Banka Adı
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Garanti BBVA"
                        value={formData.company.bankName || ''}
                        onChange={(e) => handleCompanyChange('bankName', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Hesap Sahibi Unvanı
                      </label>
                      <input
                        type="text"
                        placeholder="TEKLİFPRO DİJİTAL A.Ş."
                        value={formData.company.bankAccountHolder || ''}
                        onChange={(e) => handleCompanyChange('bankAccountHolder', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        IBAN Numarası
                      </label>
                      <input
                        type="text"
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        value={formData.company.bankIban || ''}
                        onChange={(e) => handleCompanyChange('bankIban', e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm font-mono font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. PROPOSAL DEFAULTS */}
            {activeSubTab === 'proposalDefaults' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Teklif & Cihaz Parametreleri</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Yeni teklif oluşturulurken varsayılan olarak seçilecek süre, para birimi, KDV ve cihaz notları.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Teklif Numarası Öneki (Prefix)
                    </label>
                    <input
                      type="text"
                      value={formData.proposalDefaults.prefix}
                      onChange={(e) => handleProposalDefaultsChange('prefix', e.target.value)}
                      placeholder="Örn: TEK"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Örnek Numaralandırma: TEK-2026-001</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Varsayılan Geçerlilik Süresi (Gün)
                    </label>
                    <select
                      value={formData.proposalDefaults.validDays}
                      onChange={(e) => handleProposalDefaultsChange('validDays', Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <option value={7}>7 Gün</option>
                      <option value={14}>14 Gün (Tavsiye Edilen)</option>
                      <option value={30}>30 Gün</option>
                      <option value={60}>60 Gün</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Varsayılan Para Birimi
                    </label>
                    <select
                      value={formData.proposalDefaults.currency}
                      onChange={(e) => handleProposalDefaultsChange('currency', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <option value="TRY">₺ - Türk Lirası (TRY)</option>
                      <option value="USD">$ - Amerikan Doları (USD)</option>
                      <option value="EUR">€ - Euro (EUR)</option>
                      <option value="GBP">£ - İngiliz Sterlini (GBP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Varsayılan KDV Oranı (%)
                    </label>
                    <select
                      value={formData.proposalDefaults.taxRate}
                      onChange={(e) => handleProposalDefaultsChange('taxRate', Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100"
                    >
                      <option value={20}>%20 KDV (Standart)</option>
                      <option value={10}>%10 KDV</option>
                      <option value={1}>%1 KDV</option>
                      <option value={0}>%0 (KDV Muaf)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Cihaz Varsayılan Teklif Notu (Garanti & Teslim Süresi)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.proposalDefaults.deviceDefaultNote || ''}
                      onChange={(e) => handleProposalDefaultsChange('deviceDefaultNote', e.target.value)}
                      placeholder="Örn: Cihaz yedek parçaları 1 yıl garantilidir. Teslim süresi 3 iş günüdür."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-800 dark:text-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Teklife eklenen her yeni cihazda bu varsayılan not otomatik gösterilir.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Varsayılan Ödeme Koşulları Metni
                    </label>
                    <textarea
                      rows={2}
                      value={formData.proposalDefaults.paymentTerms}
                      onChange={(e) => handleProposalDefaultsChange('paymentTerms', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Varsayılan Teklif Ön Sunuş Mektubu Şablonu
                    </label>
                    <textarea
                      rows={2}
                      value={formData.proposalDefaults.notes}
                      onChange={(e) => handleProposalDefaultsChange('notes', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. PRINT OPTIONS (NEW) */}
            {activeSubTab === 'printOptions' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Printer className="w-4 h-4 text-blue-600" />
                    <span>Baskı & Evrak Görünümü Tercihleri</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Yazdırılan teklif belgelerindeki görsel vurgular ve gösterilecek resmi bölümler.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">Teklif Çıktısında Kurumsal Logo</div>
                      <div className="text-[11px] text-slate-500">Logoyu antet kısmında gösterir.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.printOptions?.showLogo ?? true}
                      onChange={(e) => handlePrintOptionsChange('showLogo', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">Banka & IBAN Bilgileri Çıktısı</div>
                      <div className="text-[11px] text-slate-500">Teklif belgesinin alt kısmına banka hesap detaylarını ekler.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.printOptions?.showBankDetails ?? true}
                      onChange={(e) => handlePrintOptionsChange('showBankDetails', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">İmza & Onay Alanı Çıktısı</div>
                      <div className="text-[11px] text-slate-500">Teklifi sunan ve müşteri onay imza alanlarını görüntüler.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.printOptions?.showSignatures ?? true}
                      onChange={(e) => handlePrintOptionsChange('showSignatures', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* 4. NOTIFICATIONS & EMAIL */}
            {activeSubTab === 'notifications' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span>Canlı Bildirimler & SMTP E-Posta Servisi</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Müşteri teklifi açtığında veya onayladığında anında tetiklenen ses ve visual uyarılar.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  
                  {/* Sound Alerts */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      {formData.notifications.soundEnabled ? (
                        <Volume2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">Sesli Bildirim Uyarıları</div>
                        <div className="text-[11px] text-slate-500">Müşteri onay verdiğinde zil sesi çalınır.</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifications.soundEnabled}
                        onChange={(e) => handleNotificationsChange('soundEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Toast Popups */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">Ekran İçi Canlı Popup Bildirimler</div>
                        <div className="text-[11px] text-slate-500">Sağ alt köşede canlı bildirim kartı gösterilir.</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifications.toastEnabled}
                        onChange={(e) => handleNotificationsChange('toastEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Email Sender Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        E-Posta Gönderen Görünür Unvanı
                      </label>
                      <input
                        type="text"
                        value={formData.notifications.senderName}
                        onChange={(e) => handleNotificationsChange('senderName', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Varsayılan E-Posta Konu Şablonu
                      </label>
                      <input
                        type="text"
                        value={formData.notifications.emailSubjectTemplate}
                        onChange={(e) => handleNotificationsChange('emailSubjectTemplate', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* SMTP Server Settings */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>SMTP E-Posta Sunucu Yapılandırması</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Teklif e-postalarının kendi kurumsal e-posta adresinizden gönderilmesi için SMTP sunucu bilgilerinizi girin.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-sm border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1 text-[11px]">
                          SMTP Sunucu Adresi (Host) *
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: smtp.gmail.com veya mail.sirketiniz.com"
                          value={formData.smtp?.host || ''}
                          onChange={(e) => handleSmtpChange('host', e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1 text-[11px]">
                          SMTP Port *
                        </label>
                        <input
                          type="number"
                          placeholder="587 veya 465"
                          value={formData.smtp?.port || 587}
                          onChange={(e) => handleSmtpChange('port', Number(e.target.value))}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1 text-[11px]">
                          E-Posta Kullanıcı Adı *
                        </label>
                        <input
                          type="text"
                          placeholder="teklif@sirketiniz.com"
                          value={formData.smtp?.user || ''}
                          onChange={(e) => handleSmtpChange('user', e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1 text-[11px]">
                          E-Posta Şifresi / Uygulama Şifresi *
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          value={formData.smtp?.pass || ''}
                          onChange={(e) => handleSmtpChange('pass', e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1 text-[11px]">
                          Gönderen E-Posta Adresi (From)
                        </label>
                        <input
                          type="email"
                          placeholder={formData.company.email || 'teklif@sirketiniz.com'}
                          value={formData.smtp?.fromEmail || ''}
                          onChange={(e) => handleSmtpChange('fromEmail', e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3 flex items-center gap-2 pt-1">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={formData.smtp?.secure || false}
                            onChange={(e) => handleSmtpChange('secure', e.target.checked)}
                            className="rounded-xs border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Güvenli SSL/TLS Bağlantısı (Port 465 için işaretleyin, 587 için kapalı bırakın)</span>
                        </label>
                      </div>

                      {/* Test SMTP connection section */}
                      <div className="sm:col-span-3 pt-3 border-t border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="email"
                            placeholder="Test e-postası alıcısı (Opsiyonel)"
                            value={testRecipientEmail}
                            onChange={(e) => setTestRecipientEmail(e.target.value)}
                            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-xs w-full sm:w-64"
                          />
                          <button
                            type="button"
                            onClick={handleTestSmtpConnection}
                            disabled={testingSmtp}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-sm shrink-0 flex items-center gap-1.5 border border-slate-700 shadow-xs"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{testingSmtp ? 'Test Ediliyor...' : 'SMTP Bağlantısını Test Et'}</span>
                          </button>
                        </div>
                      </div>

                      {smtpTestResult && (
                        <div className={`sm:col-span-3 p-2.5 rounded-sm text-xs font-semibold flex items-center gap-2 ${
                          smtpTestResult.success 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                           <span>{smtpTestResult.message}</span>
                         </div>
                       )}
 
                     </div>
                   </div>
                 </div>
               </div>
             )}
 
             {/* USER MANAGEMENT TAB */}
            {activeSubTab === 'users' && (
              <div className="animate-in fade-in duration-150">
                <UserManagement
                  users={users}
                  onAddUser={onAddUser}
                  onUpdateUser={onUpdateUser}
                  onDeleteUser={onDeleteUser}
                  currentUser={currentUser}
                />
              </div>
            )}

            {/* 5. APPEARANCE */}
            {activeSubTab === 'appearance' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-600" />
                    <span>Görünüm & Tema Ayarları</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Uygulama arayüzünün renk modu ve tablo yoğunluk seçenekleri.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Arayüz Teması Modu
                    </label>
                    <select
                      value={formData.appearance.theme}
                      onChange={(e) => handleAppearanceChange('theme', e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <option value="light">Aydınlık Mod (Light)</option>
                      <option value="dark">Karanlık Mod (Dark)</option>
                      <option value="system">Otomatik (Sistem Modu)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 self-end">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">Kompakt Tablo Görünümü</div>
                      <div className="text-[11px] text-slate-500">Listelerde daha fazla teklif göster.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.appearance.compactView}
                      onChange={(e) => handleAppearanceChange('compactView', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. DATA MANAGEMENT */}
            {activeSubTab === 'data' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span>Veri Tabanı & Sistem Sıfırlama</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Teklif ve müşteri verilerinizi bilgisayarınıza dışa aktarın veya veritabanını fabrika ayarlarına döndürün.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  
                  {/* Database Info Box */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-sm border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                    <Database className="w-6 h-6 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-bold text-blue-900 dark:text-blue-200 text-xs">SQLite Veri Tabanı Aktif</div>
                      <div className="text-[11px] text-blue-700 dark:text-blue-300 font-mono mt-0.5">
                        Veri dosyası: <strong>database.sqlite</strong> (Tüm teklifler, müşteriler ve ayarlar güvenli şekilde tutulmaktadır)
                      </div>
                    </div>
                  </div>

                  {/* Export Box */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-blue-600" />
                        <span>Sistem Verilerini Dışa Aktar (JSON Yedek)</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Kayıtlı toplam <strong>{proposals.length} adet teklif</strong> ve <strong>{customers.length} müşteri</strong> verisi JSON olarak indirilir.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportData}
                      className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-sm text-xs flex items-center gap-1.5 shadow-xs shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>Yedek Dosyasını İndir</span>
                    </button>
                  </div>

                  {/* Reset Box */}
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-sm border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-rose-800 dark:text-rose-300 text-sm flex items-center gap-1.5">
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                        <span>Fabrika Ayarlarına Dön & Örnek Veri Yükle</span>
                      </div>
                      <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                        Sistemdeki tüm özel değişiklikler silinerek başlangıçtaki demo teklifler ve müşteriler geri yüklenir.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-sm text-xs flex items-center gap-1.5 shadow-xs border border-rose-500 shrink-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Sistemi Sıfırla</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Reset Modal */}
            {showResetConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-300 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-sm bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 shrink-0 border border-rose-200 dark:border-rose-800">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Sistemi Sıfırlama Onayı</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Tüm sistem verilerini başlangıçtaki örnek teklifler, müşteriler ve ayarlara döndürmek istediğinizden emin misiniz?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-4 py-2 rounded-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await onResetData();
                        setShowResetConfirm(false);
                      }}
                      className="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                    >
                      Evet, Sıfırla
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Submit Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>TeklifPro Konfigürasyon Modülü v3.0</span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs border border-blue-500"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};
