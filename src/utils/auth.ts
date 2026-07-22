import { User, UserRole, UserPermissions } from '../types';

export const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'İlker (Sistem Yöneticisi)',
    email: 'admin@teklifpro.com.tr',
    role: 'ADMIN',
    password: 'admin',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-sales',
    username: 'satis',
    name: 'Ahmet Yılmaz (Satış Uzmanı)',
    email: 'satis@teklifpro.com.tr',
    role: 'SALES',
    password: 'satis',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-tech',
    username: 'teknik',
    name: 'Mehmet Demir (Teknik Servis)',
    email: 'teknik@teklifpro.com.tr',
    role: 'TECHNICIAN',
    password: 'teknik',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const getUserPermissions = (role: UserRole): UserPermissions => {
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
      return {
        canCreateProposal: false,
        canEditProposal: false,
        canDeleteProposal: false,
        canManageCustomers: false,
        canDeleteCustomer: false,
        canManageSettings: false,
        canManageUsers: false
      };
  }
};

export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN': return 'Yönetici';
    case 'SALES': return 'Satış Temsilcisi';
    case 'TECHNICIAN': return 'Teknik Personel';
    default: return 'Kullanıcı';
  }
};

export const getRoleBadgeStyle = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN': return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    case 'SALES': return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    case 'TECHNICIAN': return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    default: return 'bg-slate-100 text-slate-700';
  }
};
