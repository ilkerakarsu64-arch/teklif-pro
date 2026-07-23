import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { getRoleLabel, getRoleBadgeStyle } from '../utils/auth';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Key, 
  User as UserIcon,
  ShieldAlert,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (userData: Partial<User>) => Promise<any>;
  onUpdateUser: (id: string, userData: Partial<User>) => Promise<any>;
  onDeleteUser: (id: string) => Promise<void>;
  currentUser: User | null;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('SALES');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Success toast banner
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'info'; title: string; message: string } | null>(null);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setEmail('');
    setPassword('123456');
    setShowPassword(true);
    setRole('SALES');
    setIsActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // Leave empty on edit so existing password isn't overwritten
    setShowPassword(false);
    setRole(user.role);
    setIsActive(user.isActive);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = username.trim();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !cleanName || !cleanEmail) {
      setFormError('Lütfen tüm zorunlu alanları (*) doldurun.');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const updateData: Partial<User> = {
          username: cleanUsername,
          name: cleanName,
          email: cleanEmail,
          role,
          isActive
        };

        if (password.trim()) {
          updateData.password = password.trim();
        }

        const res = await onUpdateUser(editingUser.id, updateData);
        if (res && res.success === false) {
          setFormError(res.error || 'Güncelleme başarısız.');
          return;
        }

        setShowModal(false);
        setToastMsg({
          type: 'success',
          title: 'Kullanıcı Güncellendi',
          message: password.trim()
            ? `'${cleanName}' kullanıcısı güncellendi. Yeni Giriş Şifresi: "${password.trim()}"`
            : `'${cleanName}' kullanıcısının bilgileri başarıyla güncellendi.`
        });
      } else {
        const passToUse = password.trim() || '123456';
        const res = await onAddUser({
          username: cleanUsername,
          name: cleanName,
          email: cleanEmail,
          password: passToUse,
          role,
          isActive
        });

        if (res && res.success === false) {
          setFormError(res.error || 'Kullanıcı eklenemedi.');
          return;
        }

        setShowModal(false);
        setToastMsg({
          type: 'success',
          title: 'Yeni Kullanıcı Oluşturuldu!',
          message: `'${cleanName}' sisteme eklendi. Kullanıcı Adı: "${cleanUsername}" | Giriş Şifresi: "${passToUse}"`
        });
      }

      setTimeout(() => setToastMsg(null), 6000);
    } catch (err: any) {
      setFormError(err.message || 'İşlem sırasında bir hatayla karşılaşıldı.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickResetPassword = async (user: User) => {
    if (!window.confirm(`'${user.name}' kullanıcısının şifresi '123456' olarak sıfırlansın mı?`)) return;

    try {
      const res = await onUpdateUser(user.id, { password: '123456' });
      if (res && res.success === false) {
        alert(res.error || 'Şifre sıfırlanamadı.');
      } else {
        setToastMsg({
          type: 'info',
          title: 'Şifre Sıfırlandı',
          message: `'${user.name}' kullanıcısının şifresi '123456' olarak sıfırlandı.`
        });
        setTimeout(() => setToastMsg(null), 5000);
      }
    } catch (err: any) {
      alert('Şifre sıfırlama hatası: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Banner */}
      {toastMsg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-md animate-in fade-in duration-200 ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200' 
            : 'bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${toastMsg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm">{toastMsg.title}</h4>
              <p className="text-xs mt-0.5 font-mono">{toastMsg.message}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMsg(null)}
            className="p-1 hover:bg-black/10 rounded-md text-current transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Kullanıcı Yönetimi & Yetkilendirme Matrisi</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sisteme erişimi olan personel hesaplarını tanımlayın, şifrelerini güncelleyin ve rol yetkilerini belirleyin.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 hover:scale-102 active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Yeni Kullanıcı Ekle</span>
        </button>
      </div>

      {/* Role Legend Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1">
          <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>👑 Yönetici (ADMIN)</span>
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-400">
            Sistemde tam yetkiye sahiptir. Teklif silme, müşteri yönetimi, sistem ayarları ve kullanıcı tanımlama yapabilir.
          </p>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1">
          <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
            <UserIcon className="w-4 h-4 text-blue-600" />
            <span>💼 Satış Temsilcisi (SALES)</span>
          </div>
          <p className="text-[11px] text-blue-700 dark:text-blue-400">
            Teklif oluşturabilir, müşteri ekleyebilir ve e-posta gönderebilir. Teklif silme veya sistem ayarlarını değiştirme yetkisi yoktur.
          </p>
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
          <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <span>🔧 Teknik Personel (TECHNICIAN)</span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
            Teklifleri ve cihaz hizmet detaylarını görüntüleyebilir. Teklif oluşturamaz, düzenleyemez veya silemez.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <th className="py-3.5 px-4">Kullanıcı Bilgisi</th>
              <th className="py-3.5 px-4">E-Posta</th>
              <th className="py-3.5 px-4">Sistem Rolü</th>
              <th className="py-3.5 px-4">Durum</th>
              <th className="py-3.5 px-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                      {user.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold">{user.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                  {user.email}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getRoleBadgeStyle(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Aktif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>Pasif</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Quick Reset Password Button */}
                    <button
                      type="button"
                      onClick={() => handleQuickResetPassword(user)}
                      className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200 text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Şifreyi '123456' yap"
                    >
                      <Key className="w-3 h-3 text-amber-600" />
                      <span>Şifre Sıfırla</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
                      title="Kullanıcıyı Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button (disabled for self) */}
                    {user.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`'${user.name}' kullanıcısını silmek istediğinize emin misiniz?`)) {
                            onDeleteUser(user.id);
                          }
                        }}
                        className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>{editingUser ? 'Kullanıcı Hesabını Güncelle' : 'Yeni Kullanıcı Tanımla'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Alert inside Modal */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kullanıcı Adı * <span className="text-[10px] text-slate-400 font-normal">(Girişte kullanılır)</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Örn: ahmet.yilmaz"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ad Soyad & Unvan *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz (Satış Uzmanı)"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-Posta Adresi *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ahmet@sirketiniz.com"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Giriş Şifresi {editingUser ? '(Değiştirmeyecekseniz boş bırakın)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUser ? '•••••••• (Aynı kalsın)' : 'Örn: 123456'}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!editingUser && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">
                    💡 İpucu: Varsayılan başlangıç şifresi <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">123456</code> olarak ayarlanmıştır.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sistem Rolü *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="ADMIN">Yönetici (Full)</option>
                    <option value="SALES">Satış Temsilcisi</option>
                    <option value="TECHNICIAN">Teknik Personel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hesap Durumu
                  </label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  >
                    <option value="true">Aktif (Erişebilir)</option>
                    <option value="false">Pasif (Giriş Engelli)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
