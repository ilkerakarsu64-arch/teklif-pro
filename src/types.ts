export type ProposalStatus = 
  | 'TASLAK' 
  | 'GONDERILDI' 
  | 'INCELENIYOR' 
  | 'ONAYLANDI' 
  | 'REDDEDILDI' 
  | 'SURESI_DOLDU';

export type UserRole = 'ADMIN' | 'SALES' | 'TECHNICIAN';

export interface UserPermissions {
  canCreateProposal: boolean;
  canEditProposal: boolean;
  canDeleteProposal: boolean;
  canManageCustomers: boolean;
  canDeleteCustomer: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  password?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DeviceItem {
  id: string;
  description: string;
  quantity: number;
  unit?: string;
}

export interface ProposalDevice {
  id: string;
  receiptNo?: string;
  modelCode?: string;
  serialNo?: string;
  items: DeviceItem[];
  deviceTotal: number;
  deviceNote?: string;
}

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unit: string; // Adet, Saat, Gün, Ay, Paket, Proje vb.
  unitPrice: number;
  taxRate: number; // 0, 1, 10, 20
  discountPercent: number;
  total: number;
}

export type InvoiceStatus = 'BEKLIYOR' | 'ODENDI' | 'GECTI' | 'IPTAL';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  proposalId?: string;
  proposalNumber?: string;
  customer: Customer;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  amount: number;
  paidAmount: number;
  currency: 'TRY' | 'USD' | 'EUR' | 'GBP';
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  taxOffice?: string;
  taxNumber?: string;
}

export interface ProposalHistoryLog {
  id: string;
  date: string;
  action: string;
  description: string;
  actor: string;
}

export interface Proposal {
  id: string;
  proposalNumber: string;
  title: string;
  receiptNo?: string;
  modelCode?: string;
  serialNo?: string;
  customer: Customer;
  items: ProposalItem[];
  devices?: ProposalDevice[];
  issueDate: string;
  validUntilDate: string;
  currency: 'TRY' | 'USD' | 'EUR' | 'GBP';
  notes: string;
  paymentTerms: string;
  status: ProposalStatus;
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  customerResponseNote?: string;
  rejectionReason?: string;
  customerSignature?: string;
  history: ProposalHistoryLog[];
}

export type NotificationType = 'ONAY' | 'RET' | 'GORUNTULEME' | 'EPOSTA_GONDERILDI' | 'SISTEM';

export interface AppNotification {
  id: string;
  proposalId: string;
  proposalNumber: string;
  customerName: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  amount?: number;
  currency?: string;
  customerNote?: string;
}

export interface EmailLog {
  id: string;
  proposalId: string;
  toEmail: string;
  subject: string;
  sentAt: string;
  status: 'GÖNDERİLDİ' | 'HATA';
  customMessage?: string;
}

export interface AppSettings {
  company: {
    name: string;
    title: string;
    address: string;
    phone: string;
    email: string;
    taxOffice: string;
    taxNumber: string;
    website: string;
    publicUrl?: string;
    logoText: string;
    logoUrl?: string;
    bankName?: string;
    bankIban?: string;
    bankAccountHolder?: string;
  };
  proposalDefaults: {
    validDays: number;
    currency: 'TRY' | 'USD' | 'EUR' | 'GBP';
    taxRate: number;
    prefix: string;
    paymentTerms: string;
    notes: string;
    deviceDefaultNote?: string;
  };
  printOptions?: {
    showLogo?: boolean;
    showSignatures?: boolean;
    showBankDetails?: boolean;
    accentColor?: 'blue' | 'slate' | 'emerald' | 'indigo';
  };
  notifications: {
    soundEnabled: boolean;
    toastEnabled: boolean;
    emailNotifications: boolean;
    senderName: string;
    emailSubjectTemplate: string;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    compactView: boolean;
  };
}

