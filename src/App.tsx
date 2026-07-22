import React, { useState, useEffect, useRef } from 'react';
import { Proposal, Customer, AppNotification, AppSettings, User } from './types';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { ProposalList } from './components/ProposalList';
import { ProposalForm } from './components/ProposalForm';
import { ProposalDetail } from './components/ProposalDetail';
import { EmailModal } from './components/EmailModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { CustomerPortal } from './components/CustomerPortal';
import { CustomerSimulatorModal } from './components/CustomerSimulatorModal';
import { CustomerList } from './components/CustomerList';
import { Settings } from './components/Settings';
import { DetailedReports } from './components/DetailedReports';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { playNotificationSound, formatCurrency } from './utils/formatters';
import { Bell, Sparkles, CheckCircle2, XCircle, Eye, Users, Plus, Mail, Building2, Phone, MapPin } from 'lucide-react';

function getCustomerPortalId(): string | null {
  const hash = window.location.hash;
  const path = window.location.pathname;
  
  if (hash.includes('/customer/teklif/')) {
    return hash.split('/customer/teklif/')[1];
  }
  if (path.includes('/customer/teklif/')) {
    return path.split('/customer/teklif/')[1];
  }
  return null;
}

const defaultPermissions = {
  canCreateProposal: true,
  canEditProposal: true,
  canDeleteProposal: true,
  canManageCustomers: true,
  canDeleteCustomer: true,
  canManageSettings: true,
  canManageUsers: true
};

function getUserPermissions(role: string) {
  switch (role) {
    case 'ADMIN':
      return {
        canCreateProposal: true,
        canEditProposal: true,
        canDeleteProposal: true,
        canManageCustomers: true,
        canDeleteCustomer: true,
        canManageSettings: true,
        canManageUsers: true
      };
    case 'SALES':
      return {
        canCreateProposal: true,
        canEditProposal: true,
        canDeleteProposal: false,
        canManageCustomers: true,
        canDeleteCustomer: false,
        canManageSettings: false,
        canManageUsers: false
      };
    case 'TECHNICIAN':
      return {
        canCreateProposal: false,
        canEditProposal: false,
        canDeleteProposal: false,
        canManageCustomers: false,
        canDeleteCustomer: false,
        canManageSettings: false,
        canManageUsers: false
      };
    default:
      return defaultPermissions;
  }
}

function AppContent() {
  const [customerPortalProposalId, setCustomerPortalProposalId] = useState<string | null>(getCustomerPortalId());

  const { user, isAuthenticated, isLoading, login, logout, updateUser, setSession } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'proposals' | 'customers' | 'reports' | 'settings'>('dashboard');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const handleHashChange = () => {
      setCustomerPortalProposalId(getCustomerPortalId());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Users fetch error:', err);
    }
  };

  const handleAddUser = async (userData: Partial<User>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        await loadUsers();
      }
    } catch (err) {
      console.error('Add user error:', err);
    }
  };

  const handleUpdateUser = async (id: string, userData: Partial<User>) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        await loadUsers();
        if (user && user.id === id) {
          const updated = await res.json();
          if (updated) {
            updateUser(updated);
          }
        }
      }
    } catch (err) {
      console.error('Update user error:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadUsers();
        if (user && user.id === id) {
          await handleLogout();
        }
      }
    } catch (err) {
      console.error('Delete user error:', err);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setSession(
      localStorage.getItem('teklif_access_token') || '',
      localStorage.getItem('teklif_refresh_token') || '',
      loggedInUser
    );
  };

  const handleLogout = async () => {
    await logout();
  };

  const [settings, setSettings] = useState<AppSettings>({
    company: {
      name: "TEKLİFPRO DİJİTAL A.Ş.",
      title: "Yazılım, Bilişim ve Kurumsal Dijital Danışmanlık Hizmetleri",
      address: "Maslak Mah. Büyükdere Cad. No: 245, Maslak Plaza K: 12, Sarıyer / İstanbul",
      phone: "+90 (212) 800 90 00",
      email: "teklif@teklifpro.com.tr",
      taxOffice: "Maslak",
      taxNumber: "8390123456",
      website: "https://teklifpro.com.tr",
      logoText: "TEKLİFPRO"
    },
    proposalDefaults: {
      validDays: 14,
      currency: "TRY",
      taxRate: 20,
      prefix: "TEK",
      paymentTerms: "%50 Peşin Siparişte, %50 Teslimat ve Onay Sonrasında",
      notes: "Fiyatlarımıza sunucu kurulumu ve 1 yıllık teknik bakım desteği dahildir."
    },
    notifications: {
      soundEnabled: true,
      toastEnabled: true,
      emailNotifications: true,
      senderName: "TeklifPro Otomasyonu",
      emailSubjectTemplate: "{TEKLIF_NO} - {TEKLIF_BASLIK}"
    },
    appearance: {
      theme: "light",
      compactView: false
    }
  });

  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

  const [emailModalProposal, setEmailModalProposal] = useState<Proposal | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorProposal, setSimulatorProposal] = useState<Proposal | null>(null);

  const [toastNotif, setToastNotif] = useState<AppNotification | null>(null);

  const prevUnreadCountRef = useRef<number>(0);

  const loadProposals = async () => {
    try {
      const res = await fetch('/api/proposals');
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.error('Proposals fetch error:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Customers fetch error:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const list: AppNotification[] = data.notifications || [];
        const count: number = data.unreadCount || 0;

        if (count > prevUnreadCountRef.current && list.length > 0) {
          const latest = list[0];
          if (settings.notifications.soundEnabled) {
            playNotificationSound(latest.type as any);
          }
          if (settings.notifications.toastEnabled) {
            setToastNotif(latest);
            setTimeout(() => setToastNotif(null), 6000);
          }
        }

        prevUnreadCountRef.current = count;
        setNotifications(list);
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Notifications fetch error:', err);
    }
  };

  useEffect(() => {
    loadProposals();
    loadCustomers();
    loadNotifications();
    loadSettings();
  }, []);

  useEffect(() => {
    if (customerPortalProposalId) return;

    const interval = setInterval(() => {
      loadNotifications();
      loadProposals();
    }, 3000);

    return () => clearInterval(interval);
  }, [customerPortalProposalId]);

  const handleSaveProposal = async (proposalData: Partial<Proposal>, sendEmailAfter: boolean = false) => {
    try {
      if (editingProposal && editingProposal.id) {
        const res = await fetch(`/api/proposals/${editingProposal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(proposalData)
        });
        if (res.ok) {
          const updated = await res.json();
          await loadProposals();
          setIsFormOpen(false);
          setEditingProposal(null);
          setSelectedProposalId(updated.id);

          if (sendEmailAfter) {
            setEmailModalProposal(updated);
          }
        }
      } else {
        const res = await fetch('/api/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(proposalData)
        });
        if (res.ok) {
          const created = await res.json();
          await loadProposals();
          setIsFormOpen(false);
          setSelectedProposalId(created.id);

          if (sendEmailAfter) {
            setEmailModalProposal(created);
          }
        }
      }
    } catch (err) {
      console.error('Save proposal error:', err);
    }
  };

  const handleDeleteProposal = async (id: string) => {
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadProposals();
        if (selectedProposalId === id) setSelectedProposalId(null);
      }
    } catch (err) {
      console.error('Delete proposal error:', err);
    }
  };

  const handleSendEmail = async (toEmail: string, subject: string, customMessage: string) => {
    if (!emailModalProposal) return null;
    try {
      const res = await fetch(`/api/proposals/${emailModalProposal.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail, subject, customMessage })
      });
      const data = await res.json();
      if (res.ok) {
        await loadProposals();
        await loadNotifications();
        return data;
      } else {
        throw new Error(data.error || 'E-posta gönderilemedi');
      }
    } catch (err: any) {
      console.error('Send email error:', err);
      throw err;
    }
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PUT' });
    await loadNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    await loadNotifications();
  };

  const handleClearAllNotifs = async () => {
    await fetch('/api/notifications', { method: 'DELETE' });
    await loadNotifications();
  };

  const handleAddNewCustomer = async (newCustomer: Customer) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      });
      if (res.ok) {
        await loadCustomers();
      }
    } catch (err) {
      console.error('Add customer error:', err);
    }
  };

  const handleAddCustomer = async (customerData: Omit<Customer, 'id'>) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      if (res.ok) {
        await loadCustomers();
      }
    } catch (err) {
      console.error('Add customer error:', err);
    }
  };

  const handleUpdateCustomer = async (id: string, customerData: Partial<Customer>) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      if (res.ok) {
        await loadCustomers();
        await loadProposals();
      }
    } catch (err) {
      console.error('Update customer error:', err);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadCustomers();
      }
    } catch (err) {
      console.error('Delete customer error:', err);
    }
  };

  const handleGenerateAiText = async (title: string, customerName: string, itemsSummary: string): Promise<string> => {
    try {
      const res = await fetch('/api/ai/generate-proposal-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, customerName, itemsSummary })
      });
      if (res.ok) {
        const data = await res.json();
        return data.text || '';
      }
    } catch (err) {
      console.error('AI generation error:', err);
    }
    return '';
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error('Save settings error:', err);
    }
  };

  const handleResetData = async () => {
    try {
      const res = await fetch('/api/settings/reset-data', { method: 'POST' });
      if (res.ok) {
        await loadProposals();
        await loadCustomers();
        await loadNotifications();
        await loadSettings();
      }
    } catch (err) {
      console.error('Reset data error:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.company) {
          setSettings(data);
        }
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
    }
  };

  if (customerPortalProposalId) {
    return (
      <CustomerPortal
        proposalId={customerPortalProposalId}
        onApproveSuccess={() => {
          loadNotifications();
          loadProposals();
        }}
        onRejectSuccess={() => {
          loadNotifications();
          loadProposals();
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Oturum yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        companyName={settings.company.name}
        logoUrl={settings.company.logoUrl}
      />
    );
  }

  const userPermissions = getUserPermissions(user.role);
  const selectedProposal = proposals.find(p => p.id === selectedProposalId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col md:flex-row antialiased">
      
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedProposalId(null);
          setIsFormOpen(false);
        }}
        onNewProposal={() => {
          setEditingProposal(null);
          setIsFormOpen(true);
        }}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenCustomerSimulator={() => {
          setSimulatorProposal(selectedProposal || proposals[0] || null);
          setIsSimulatorOpen(true);
        }}
        currentUser={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 min-w-0 md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {isFormOpen ? (
          <ProposalForm
            initialProposal={editingProposal}
            customers={customers}
            settings={settings}
            onSave={handleSaveProposal}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingProposal(null);
            }}
            onAddNewCustomer={handleAddNewCustomer}
            onGenerateAiText={handleGenerateAiText}
          />
        ) : selectedProposalId && selectedProposal ? (
          /* Detail View Mode */
          <ProposalDetail
            proposal={selectedProposal}
            settings={settings}
            onBack={() => setSelectedProposalId(null)}
            onEdit={() => {
              setEditingProposal(selectedProposal);
              setIsFormOpen(true);
            }}
            onSendEmail={() => setEmailModalProposal(selectedProposal)}
            onOpenCustomerSimulator={() => {
              setSimulatorProposal(selectedProposal);
              setIsSimulatorOpen(true);
            }}
            onDeleteProposal={(id) => {
              handleDeleteProposal(id);
              setSelectedProposalId(null);
            }}
            currentUser={user}
          />
        ) : activeTab === 'dashboard' ? (
          /* Dashboard Tab */
          <DashboardStats
            proposals={proposals}
            notifications={notifications}
            onSelectProposal={(id) => setSelectedProposalId(id)}
            onNewProposal={() => {
              setEditingProposal(null);
              setIsFormOpen(true);
            }}
            onOpenCustomerSimulator={() => {
              setSimulatorProposal(proposals[0] || null);
              setIsSimulatorOpen(true);
            }}
          />
        ) : activeTab === 'proposals' ? (
          /* Proposals Tab */
          <ProposalList
            proposals={proposals}
            onSelectProposal={(id) => setSelectedProposalId(id)}
            onNewProposal={() => {
              setEditingProposal(null);
              setIsFormOpen(true);
            }}
            onSendEmail={(proposal) => setEmailModalProposal(proposal)}
            onDeleteProposal={handleDeleteProposal}
            onOpenCustomerSimulatorFor={(proposal) => {
              setSimulatorProposal(proposal);
              setIsSimulatorOpen(true);
            }}
            currentUser={user}
          />
        ) : activeTab === 'customers' ? (
          /* Customers Tab */
          <CustomerList
            customers={customers}
            proposals={proposals}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectProposal={(id) => {
              setSelectedProposalId(id);
              setActiveTab('proposals');
            }}
            currentUser={user}
            onCreateProposalForCustomer={(cust) => {
              setEditingProposal({
                id: '',
                proposalNumber: '',
                title: `${cust.companyName} - Hizmet Teklifi`,
                customer: cust,
                items: [{ id: `item-${Date.now()}`, description: '', quantity: 1, unit: 'Adet', unitPrice: 0, taxRate: 20, discountPercent: 0, total: 0 }],
                issueDate: new Date().toISOString().split('T')[0],
                validUntilDate: new Date(Date.now() + (settings.proposalDefaults.validDays || 14) * 24 * 3600 * 1000).toISOString().split('T')[0],
                currency: settings.proposalDefaults.currency || 'TRY',
                notes: settings.proposalDefaults.notes || '',
                paymentTerms: settings.proposalDefaults.paymentTerms || '',
                status: 'TASLAK',
                subtotal: 0,
                totalTax: 0,
                totalDiscount: 0,
                grandTotal: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                history: []
              });
              setIsFormOpen(true);
              setActiveTab('proposals');
            }}
          />
        ) : activeTab === 'reports' ? (
          /* Detailed Reports Tab */
          <DetailedReports
            proposals={proposals}
            customers={customers}
            onSelectProposal={(id) => {
              setSelectedProposalId(id);
              setActiveTab('proposals');
            }}
          />
        ) : (
          /* Settings Tab */
          <Settings
            settings={settings}
            onSaveSettings={handleSaveSettings}
            proposals={proposals}
            customers={customers}
            onResetData={handleResetData}
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            currentUser={user}
          />
        )}


      </main>
      </div>

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllAsRead={handleMarkAllRead}
        onMarkAsRead={handleMarkRead}
        onClearAll={handleClearAllNotifs}
        onSelectProposal={(id) => {
          setSelectedProposalId(id);
          setIsFormOpen(false);
        }}
      />

      {/* Email Sending Modal */}
      {emailModalProposal && (
        <EmailModal
          proposal={emailModalProposal}
          settings={settings}
          isOpen={!!emailModalProposal}
          onClose={() => setEmailModalProposal(null)}
          onSend={handleSendEmail}
        />
      )}

      {/* Customer Action Simulator Modal */}
      <CustomerSimulatorModal
        proposal={simulatorProposal}
        proposals={proposals}
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onResponseSubmitted={async () => {
          await loadProposals();
          await loadNotifications();
        }}
      />

      {/* Realtime Toast Notification Banner */}
      {toastNotif && (
        <div 
          onClick={() => {
            setSelectedProposalId(toastNotif.proposalId);
            setToastNotif(null);
          }}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border-2 border-indigo-500 max-w-sm w-full cursor-pointer animate-in slide-in-from-bottom duration-300 flex items-start gap-3"
        >
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
            {toastNotif.type === 'ONAY' ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <Bell className="w-5 h-5 text-amber-300" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-white flex items-center justify-between">
              <span>{toastNotif.title}</span>
              <span className="text-[10px] text-indigo-300 font-mono">ŞİMDİ</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {toastNotif.message}
            </p>
            <div className="text-[10px] text-indigo-400 mt-2 font-medium">
              Detayları İncelemek İçin Tıklayın →
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}