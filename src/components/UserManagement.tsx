import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { getRoleLabel, getRoleBadgeStyle, getUserPermissions } from '../utils/auth';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Mail, 
  User as UserIcon,
  ShieldAlert,
  X
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (userData: Partial<User>) => Promise<void>;
  onUpdateUser: (id: string, userData: Partial<User>) => Promise<void>;
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
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SALES');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('SALES');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setName(user.name);
    setEmail(user.email);
    setPassword(user.password || '');
    setRole(user.role);
    setIsActive(user.isActive);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !name || !email) return;

    setSaving(true);
    try {
      if (editingUser) {
        await onUpdateUser(editingUser.id, {
          username,
          name,
          email,
          password: password || editingUser.password,
          role,
          isActive
        });
      } else {
        await onAddUser({
          username,
          name,
          email,
          password: password || '123456',
          role,
          isActive
        });
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Kullanıcı Yönetimi & Yetkilendirme Matrisi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sisteme erişimi olan personel hesaplarını tanımlayın, şifrelerini güncelleyin ve rol yetkilerini belirleyin.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-sm flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Yeni Kullanıcı Ekle</span>
        </button>
      </div>

      {/* Role Legend Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-sm border border-purple-200 dark:border-purple-800 space-y-1">
          <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>👑 Yönetici (ADMIN)</span>
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-400">
            Sistemde tam yetkiye sahiptir. Teklif silme, müşteri yönetimi, sistem ayarları ve kullanıcı tanımlama yapabilir.
          </p>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-sm border border-blue-200 dark:border-blue-800 space-y-1">
          <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
            <UserIcon className="w-4 h-4 text-blue-600" />
            <span>💼 Satış Temsilcisi (SALES)</span>
          </div>
          <p className="text-[11px] text-blue-700 dark:text-blue-400">
            Teklif oluşturabilir, müşteri ekleyebilir ve e-posta gönderebilir. Teklif silme veya sistem ayarlarını değiştirme yetkisi yoktur.
          </p>
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-sm border border-emerald-200 dark:border-emerald-800 space-y-1">
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
      <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <th className="py-3 px-4">Kullanıcı Bilgisi</th>
              <th className="py-3 px-4">E-Posta</th>
              <th className="py-3 px-4">Sistem Rolü</th>
              <th className="py-3 px-4">Durum</th>
              <th className="py-3 px-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                      {user.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div>{user.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                  {user.email}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-[11px] font-bold border ${getRoleBadgeStyle(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {user.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Aktif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>Pasif</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className="p-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 transition-colors"
                      title="Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => onDeleteUser(user.id)}
                        className="p-1.5 rounded-sm bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-800 transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-300 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>{editingUser ? 'Kullanıcı Hesabını Güncelle' : 'Yeni Kullanıcı Tanımla'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kullanıcı Adı *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Örn: ahmet.yilmaz"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono font-bold text-slate-900 dark:text-slate-100"
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
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm text-slate-900 dark:text-slate-100 font-semibold"
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
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Giriş Şifresi {editingUser && '(Değiştirmeyecekseniz boş bırakın)'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sistem Rolü *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-semibold text-slate-900 dark:text-slate-100"
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
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm font-semibold text-slate-900 dark:text-slate-100"
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
                  className="px-4 py-2 rounded-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
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
