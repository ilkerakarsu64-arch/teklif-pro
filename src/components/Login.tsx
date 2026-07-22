import React, { useState } from 'react';
import { User } from '../types';
import { DEFAULT_USERS, getRoleLabel } from '../utils/auth';
import { 
  Lock, 
  User as UserIcon, 
  LogIn, 
  Sparkles,
  KeyRound,
  AlertCircle
} from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  companyName?: string;
  logoUrl?: string;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  companyName = 'TEKLİFPRO DİJİTAL A.Ş.',
  logoUrl
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        setError(data.error || 'Giriş başarısız. Lütfen kullanıcı adı ve şifrenizi kontrol edin.');
        return;
      }

      localStorage.setItem('teklif_access_token', data.accessToken);
      localStorage.setItem('teklif_refresh_token', data.refreshToken);
      localStorage.setItem('teklif_user', JSON.stringify(data.user));
      localStorage.setItem('teklif_token_expiry', (Date.now() + (data.expiresIn || 900000)).toString());

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError('Sunucu bağlantı hatası: ' + (err.message || 'Lütfen sunucunun açık olduğundan emin olun.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoUser: User) => {
    setUsername(demoUser.username);
    setPassword(demoUser.password || demoUser.username);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-600/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200 shadow-md">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 max-w-[160px] object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                PRO
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {companyName}
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-mono font-semibold">
              Kurumsal Teklif & Hizmet Yönetim Portalı Girişi
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-xl space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Güvenli Kullanıcı Girişi</span>
            </h2>
            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              v3.0 Auth
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kullanıcı Adı veya E-Posta
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adı veya e-posta"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Giriş Şifresi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-2 border border-blue-500 active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <span>Giriş Yapılıyor...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sisteme Giriş Yap</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Selector */}
          <div className="pt-4 border-t border-slate-150 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold">
              <span>Hızlı Demo Rol Girişi Seçin:</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {DEFAULT_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(user)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer hover:scale-[1.02] ${
                    username === user.username
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-[11px] truncate">{getRoleLabel(user.role)}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{user.username}</div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 font-mono space-y-1">
          <div>© {new Date().getFullYear()} TeklifPro Yetkilendirilmiş Sistem Servisi</div>
          <div className="text-[10px] text-slate-600">SQLite Güvenli Kimlik Doğrulama Katmanı</div>
        </div>

      </div>
    </div>
  );
};
