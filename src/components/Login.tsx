import React, { useState } from 'react';
import { User } from '../types';
import { 
  Lock, 
  User as UserIcon, 
  LogIn, 
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Lütfen kullanıcı adı ve şifrenizi girin.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword })
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Dynamic Animated Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none animate-pulse duration-700" />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-11 max-w-[180px] object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                PRO
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {companyName}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono font-semibold flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Kurumsal Teklif & Hizmet Portalı</span>
            </p>
          </div>
        </div>

        {/* Modern Glassmorphic Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          
          {/* Top Subtle Card Highlight */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                <Lock className="w-4 h-4" />
              </div>
              <span>Güvenli Portal Girişi</span>
            </h2>
            
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>SSL Korumalı</span>
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 text-rose-200 rounded-xl text-xs font-semibold flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150 shadow-inner">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 tracking-wide">
                Kullanıcı Adı veya E-Posta
              </label>
              <div className="relative group/input">
                <UserIcon className="w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Kullanıcı adı veya e-posta girin"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 tracking-wide">
                Giriş Şifresi
              </label>
              <div className="relative group/input">
                <KeyRound className="w-4 h-4 text-slate-500 group-focus-within/input:text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 border border-blue-400/30 active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-3"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Doğrulanıyor...</span>
                </div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sisteme Giriş Yap</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-slate-500 font-mono space-y-1">
          <div>© {new Date().getFullYear()} {companyName} • Tüm Hakları Saklıdır.</div>
          <div className="text-[10px] text-slate-600">256-Bit SSL Uçtan Uca Güvenlik Katmanı</div>
        </div>

      </div>
    </div>
  );
};
