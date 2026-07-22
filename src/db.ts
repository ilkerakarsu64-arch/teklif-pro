import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import bcrypt from "bcrypt";
import { Customer, Proposal, AppNotification, EmailLog, AppSettings, User, Invoice } from "./types";
import { initialCustomers, initialProposals, initialNotifications } from "./data/mockData";
import { DEFAULT_USERS } from "./utils/auth";

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;
const dbPath = path.join(process.cwd(), "teklif.db");

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const ACCESS_TOKEN_TTL = 15 * 60 * 1000; // 15 minutes

export async function getDb() {
  if (db) return db;

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await db.run("PRAGMA foreign_keys = ON");

  await initializeDatabase();
  return db;
}

async function initializeDatabase() {
  const d = db!;

  // 1. Settings Table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // 2. Customers Table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      companyName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      taxOffice TEXT,
      taxNumber TEXT
    )
  `);

  // 3. Proposals Table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      proposalNumber TEXT NOT NULL,
      title TEXT NOT NULL,
      customerId TEXT,
      customerJson TEXT NOT NULL,
      itemsJson TEXT NOT NULL,
      devicesJson TEXT,
      issueDate TEXT NOT NULL,
      validUntilDate TEXT NOT NULL,
      currency TEXT NOT NULL,
      notes TEXT NOT NULL,
      paymentTerms TEXT NOT NULL,
      status TEXT NOT NULL,
      subtotal REAL NOT NULL,
      totalTax REAL NOT NULL,
      totalDiscount REAL NOT NULL,
      grandTotal REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      sentAt TEXT,
      viewedAt TEXT,
      respondedAt TEXT,
      customerResponseNote TEXT,
      rejectionReason TEXT,
      customerSignature TEXT,
      historyJson TEXT NOT NULL
    )
  `);

  // 4. Notifications Table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      proposalId TEXT NOT NULL,
      proposalNumber TEXT NOT NULL,
      customerName TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      isRead INTEGER NOT NULL DEFAULT 0,
      amount REAL,
      currency TEXT,
      customerNote TEXT
    )
  `);

  // 5. Email Logs Table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      proposalId TEXT NOT NULL,
      toEmail TEXT NOT NULL,
      subject TEXT NOT NULL,
      sentAt TEXT NOT NULL,
      status TEXT NOT NULL,
      customMessage TEXT
    )
  `);

  // 6. Users Table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      password TEXT NOT NULL,
      avatarUrl TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    )
  `);

  // 7. Auth Tokens Table (for refresh tokens)
  await d.exec(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      refreshTokenHash TEXT NOT NULL,
      accessTokenJti TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      revokedAt TEXT,
      lastUsedAt TEXT,
      userAgent TEXT,
      ipAddress TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 8. Auth Audit Log Table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS auth_audit_log (
      id TEXT PRIMARY KEY,
      userId TEXT,
      username TEXT,
      action TEXT NOT NULL,
      success INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      details TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  // 9. Invoices Table
  await d.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoiceNumber TEXT NOT NULL,
      proposalId TEXT,
      proposalNumber TEXT,
      customerJson TEXT NOT NULL,
      issueDate TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      status TEXT NOT NULL,
      amount REAL NOT NULL,
      paidAmount REAL NOT NULL,
      currency TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  // Index for auth_tokens lookup
  await d.exec(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_userid ON auth_tokens(userId)`);
  await d.exec(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expiresAt)`);
  await d.exec(`CREATE INDEX IF NOT EXISTS idx_auth_audit_userid ON auth_audit_log(userId)`);
  await d.exec(`CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(createdAt)`);

  // ----------------------------------------------------
  // Seed Database if Empty
  // ----------------------------------------------------
  
  // Seed Settings
  const defaultSettings: AppSettings = {
    company: {
      name: "TEKLİFPRO DİJİTAL A.Ş.",
      title: "Yazılım, Bilişim ve Kurumsal Dijital Danışmanlık Hizmetleri",
      address: "Maslak Mah. Büyükdere Cad. No: 245, Maslak Plaza K: 12, Sarıyer / İstanbul",
      phone: "+90 (212) 800 90 00",
      email: "teklif@teklifpro.com.tr",
      taxOffice: "Maslak",
      taxNumber: "8390123456",
      website: "https://teklifpro.com.tr",
      logoText: "TEKLİFPRO",
      bankName: "Garanti BBVA",
      bankIban: "TR56 0006 2000 0000 1234 5678 90",
      bankAccountHolder: "TEKLİFPRO DİJİTAL A.Ş."
    },
    proposalDefaults: {
      validDays: 14,
      currency: "TRY",
      taxRate: 20,
      prefix: "TEK",
      paymentTerms: "%50 Peşin Siparişte, %50 Teslimat ve Onay Sonrasında",
      notes: "Fiyatlarımıza sunucu kurulumu ve 1 yıllık teknik bakım desteği dahildir.",
      deviceDefaultNote: "Cihaz yedek parçaları 1 yıl garantilidir. Teslim süresi 3 iş günüdür."
    },
    printOptions: {
      showLogo: true,
      showSignatures: true,
      showBankDetails: true,
      accentColor: "blue"
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
  };

  const settingsCheck = await d.get("SELECT key FROM settings WHERE key = 'system_settings'");
  if (!settingsCheck) {
    await d.run(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
      "system_settings",
      JSON.stringify(defaultSettings)
    );
  }

  // Seed Customers
  const customerCount = await d.get("SELECT COUNT(*) as count FROM customers");
  if ((customerCount as any).count === 0) {
    for (const c of initialCustomers) {
      await d.run(
        `INSERT INTO customers (id, name, companyName, email, phone, address, taxOffice, taxNumber) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        c.id, c.name, c.companyName, c.email, c.phone, c.address, c.taxOffice || null, c.taxNumber || null
      );
    }
  }

  // Demo proposals and notifications seeding removed permanently.

  // Seed Users
  const userCount = await d.get("SELECT COUNT(*) as count FROM users");
  if ((userCount as any).count === 0) {
    for (const u of DEFAULT_USERS) {
      const passwordHash = await bcrypt.hash(u.password || '123456', BCRYPT_ROUNDS);
      await d.run(
        `INSERT INTO users (id, username, name, email, role, password, avatarUrl, isActive, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        u.id, u.username, u.name, u.email, u.role, passwordHash, u.avatarUrl || null, u.isActive ? 1 : 0, u.createdAt
      );
    }
  }
}

// ----------------------------------------------------
// DATABASE OPERATION WRAPPERS
// ----------------------------------------------------

export async function resetDatabase() {
  const d = await getDb();
  await d.run("DROP TABLE IF EXISTS settings");
  await d.run("DROP TABLE IF EXISTS customers");
  await d.run("DROP TABLE IF EXISTS proposals");
  await d.run("DROP TABLE IF EXISTS notifications");
  await d.run("DROP TABLE IF EXISTS email_logs");
  await initializeDatabase();
}

// Settings
export async function getSettings(): Promise<AppSettings> {
  const d = await getDb();
  const row = await d.get("SELECT value FROM settings WHERE key = 'system_settings'");
  return JSON.parse(row.value);
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  const d = await getDb();
  await d.run("UPDATE settings SET value = ? WHERE key = 'system_settings'", JSON.stringify(settings));
}

// Customers
export async function getAllCustomers(): Promise<Customer[]> {
  const d = await getDb();
  return d.all("SELECT * FROM customers");
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const d = await getDb();
  return d.get("SELECT * FROM customers WHERE id = ?", id);
}

export async function insertCustomer(c: Customer): Promise<void> {
  const d = await getDb();
  await d.run(
    `INSERT INTO customers (id, name, companyName, email, phone, address, taxOffice, taxNumber) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    c.id, c.name, c.companyName, c.email, c.phone, c.address, c.taxOffice || null, c.taxNumber || null
  );
}

export async function updateCustomer(id: string, c: Partial<Customer>): Promise<void> {
  const d = await getDb();
  const existing = await getCustomerById(id);
  if (!existing) return;

  const merged = { ...existing, ...c };
  await d.run(
    `UPDATE customers SET name = ?, companyName = ?, email = ?, phone = ?, address = ?, taxOffice = ?, taxNumber = ? 
     WHERE id = ?`,
    merged.name, merged.companyName, merged.email, merged.phone, merged.address, merged.taxOffice || null, merged.taxNumber || null,
    id
  );
}

export async function deleteCustomer(id: string): Promise<void> {
  const d = await getDb();
  await d.run("DELETE FROM customers WHERE id = ?", id);
}

// Proposals
export async function getAllProposals(): Promise<Proposal[]> {
  const d = await getDb();
  const rows = await d.all("SELECT * FROM proposals ORDER BY createdAt DESC");
  return rows.map(r => ({
    id: r.id,
    proposalNumber: r.proposalNumber,
    title: r.title,
    customer: JSON.parse(r.customerJson),
    items: JSON.parse(r.itemsJson),
    devices: r.devicesJson ? JSON.parse(r.devicesJson) : undefined,
    issueDate: r.issueDate,
    validUntilDate: r.validUntilDate,
    currency: r.currency,
    notes: r.notes,
    paymentTerms: r.paymentTerms,
    status: r.status,
    subtotal: r.subtotal,
    totalTax: r.totalTax,
    totalDiscount: r.totalDiscount,
    grandTotal: r.grandTotal,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    sentAt: r.sentAt || undefined,
    viewedAt: r.viewedAt || undefined,
    respondedAt: r.respondedAt || undefined,
    customerResponseNote: r.customerResponseNote || undefined,
    rejectionReason: r.rejectionReason || undefined,
    customerSignature: r.customerSignature || undefined,
    history: JSON.parse(r.historyJson)
  }));
}

export async function getProposalById(id: string): Promise<Proposal | undefined> {
  const d = await getDb();
  const r = await d.get("SELECT * FROM proposals WHERE id = ?", id);
  if (!r) return undefined;
  return {
    id: r.id,
    proposalNumber: r.proposalNumber,
    title: r.title,
    customer: JSON.parse(r.customerJson),
    items: JSON.parse(r.itemsJson),
    devices: r.devicesJson ? JSON.parse(r.devicesJson) : undefined,
    issueDate: r.issueDate,
    validUntilDate: r.validUntilDate,
    currency: r.currency,
    notes: r.notes,
    paymentTerms: r.paymentTerms,
    status: r.status,
    subtotal: r.subtotal,
    totalTax: r.totalTax,
    totalDiscount: r.totalDiscount,
    grandTotal: r.grandTotal,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    sentAt: r.sentAt || undefined,
    viewedAt: r.viewedAt || undefined,
    respondedAt: r.respondedAt || undefined,
    customerResponseNote: r.customerResponseNote || undefined,
    rejectionReason: r.rejectionReason || undefined,
    customerSignature: r.customerSignature || undefined,
    history: JSON.parse(r.historyJson)
  };
}

export async function insertProposal(p: Proposal): Promise<void> {
  const d = await getDb();
  await d.run(
    `INSERT INTO proposals (
      id, proposalNumber, title, customerId, customerJson, itemsJson, devicesJson,
      issueDate, validUntilDate, currency, notes, paymentTerms, status, subtotal,
      totalTax, totalDiscount, grandTotal, createdAt, updatedAt, sentAt, viewedAt,
      respondedAt, customerResponseNote, rejectionReason, customerSignature, historyJson
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    p.id,
    p.proposalNumber,
    p.title,
    p.customer.id,
    JSON.stringify(p.customer),
    JSON.stringify(p.items),
    p.devices ? JSON.stringify(p.devices) : null,
    p.issueDate,
    p.validUntilDate,
    p.currency,
    p.notes,
    p.paymentTerms,
    p.status,
    p.subtotal,
    p.totalTax,
    p.totalDiscount,
    p.grandTotal,
    p.createdAt,
    p.updatedAt,
    p.sentAt || null,
    p.viewedAt || null,
    p.respondedAt || null,
    p.customerResponseNote || null,
    p.rejectionReason || null,
    p.customerSignature || null,
    JSON.stringify(p.history)
  );
}

export async function updateProposal(id: string, p: Partial<Proposal>): Promise<void> {
  const d = await getDb();
  const existing = await getProposalById(id);
  if (!existing) return;

  const merged = { ...existing, ...p };
  await d.run(
    `UPDATE proposals SET 
      proposalNumber = ?, title = ?, customerId = ?, customerJson = ?, itemsJson = ?, devicesJson = ?,
      issueDate = ?, validUntilDate = ?, currency = ?, notes = ?, paymentTerms = ?, status = ?, subtotal = ?,
      totalTax = ?, totalDiscount = ?, grandTotal = ?, createdAt = ?, updatedAt = ?, sentAt = ?, viewedAt = ?,
      respondedAt = ?, customerResponseNote = ?, rejectionReason = ?, customerSignature = ?, historyJson = ?
     WHERE id = ?`,
    merged.proposalNumber,
    merged.title,
    merged.customer.id,
    JSON.stringify(merged.customer),
    JSON.stringify(merged.items),
    merged.devices ? JSON.stringify(merged.devices) : null,
    merged.issueDate,
    merged.validUntilDate,
    merged.currency,
    merged.notes,
    merged.paymentTerms,
    merged.status,
    merged.subtotal,
    merged.totalTax,
    merged.totalDiscount,
    merged.grandTotal,
    merged.createdAt,
    merged.updatedAt,
    merged.sentAt || null,
    merged.viewedAt || null,
    merged.respondedAt || null,
    merged.customerResponseNote || null,
    merged.rejectionReason || null,
    merged.customerSignature || null,
    JSON.stringify(merged.history),
    id
  );
}

export async function deleteProposal(id: string): Promise<void> {
  const d = await getDb();
  await d.run("DELETE FROM proposals WHERE id = ?", id);
}

// Customers update inside existing proposals
export async function updateCustomerInAllProposals(customerId: string, c: Partial<Customer>): Promise<void> {
  const d = await getDb();
  const rows = await d.all("SELECT id, customerJson FROM proposals WHERE customerId = ?", customerId);
  for (const r of rows) {
    const custObj: Customer = JSON.parse(r.customerJson);
    const updatedCust = { ...custObj, ...c };
    await d.run("UPDATE proposals SET customerJson = ? WHERE id = ?", JSON.stringify(updatedCust), r.id);
  }
}

// Notifications
export async function getNotifications(): Promise<{ notifications: AppNotification[], unreadCount: number }> {
  const d = await getDb();
  const rows = await d.all("SELECT * FROM notifications ORDER BY createdAt DESC");
  const notifications: AppNotification[] = rows.map(r => ({
    id: r.id,
    proposalId: r.proposalId,
    proposalNumber: r.proposalNumber,
    customerName: r.customerName,
    type: r.type as any,
    title: r.title,
    message: r.message,
    createdAt: r.createdAt,
    isRead: r.isRead === 1,
    amount: r.amount || undefined,
    currency: r.currency || undefined,
    customerNote: r.customerNote || undefined
  }));
  const unreadCount = notifications.filter(n => !n.isRead).length;
  return { notifications, unreadCount };
}

export async function insertNotification(n: AppNotification): Promise<void> {
  const d = await getDb();
  await d.run(
    `INSERT INTO notifications (
      id, proposalId, proposalNumber, customerName, type, title, message, createdAt, isRead, amount, currency, customerNote
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    n.id,
    n.proposalId,
    n.proposalNumber,
    n.customerName,
    n.type,
    n.title,
    n.message,
    n.createdAt,
    n.isRead ? 1 : 0,
    n.amount || null,
    n.currency || null,
    n.customerNote || null
  );
}

export async function readAllNotifications(): Promise<void> {
  const d = await getDb();
  await d.run("UPDATE notifications SET isRead = 1");
}

export async function readNotification(id: string): Promise<void> {
  const d = await getDb();
  await d.run("UPDATE notifications SET isRead = 1 WHERE id = ?", id);
}

export async function clearNotifications(): Promise<void> {
  const d = await getDb();
  await d.run("DELETE FROM notifications");
}

// Email Logs
export async function getEmailLogs(): Promise<EmailLog[]> {
  const d = await getDb();
  const rows = await d.all("SELECT * FROM email_logs ORDER BY sentAt DESC");
  return rows.map(r => ({
    id: r.id,
    proposalId: r.proposalId,
    toEmail: r.toEmail,
    subject: r.subject,
    sentAt: r.sentAt,
    status: r.status as any,
    customMessage: r.customMessage || undefined
  }));
}

export async function insertEmailLog(e: EmailLog): Promise<void> {
  const d = await getDb();
  await d.run(
    `INSERT INTO email_logs (id, proposalId, toEmail, subject, sentAt, status, customMessage) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    e.id, e.proposalId, e.toEmail, e.subject, e.sentAt, e.status, e.customMessage || null
  );
}

// ----------------------------------------------------
// Users CRUD & Auth
// ----------------------------------------------------
export async function getAllUsers(): Promise<User[]> {
  const d = await getDb();
  const rows = await d.all("SELECT * FROM users ORDER BY createdAt ASC");
  return rows.map(r => ({
    id: r.id,
    username: r.username,
    name: r.name,
    email: r.email,
    role: r.role as any,
    avatarUrl: r.avatarUrl || undefined,
    password: r.password,
    isActive: Boolean(r.isActive),
    createdAt: r.createdAt
  }));
}

export async function getUserById(id: string): Promise<User | null> {
  const d = await getDb();
  const r = await d.get("SELECT * FROM users WHERE id = ?", id);
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    name: r.name,
    email: r.email,
    role: r.role as any,
    avatarUrl: r.avatarUrl || undefined,
    password: r.password,
    isActive: Boolean(r.isActive),
    createdAt: r.createdAt
  };
}

export async function insertUser(u: User): Promise<void> {
  const d = await getDb();
  const passwordHash = await bcrypt.hash(u.password || '123456', BCRYPT_ROUNDS);
  await d.run(
    `INSERT INTO users (id, username, name, email, role, password, avatarUrl, isActive, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    u.id, u.username, u.name, u.email, u.role, passwordHash, u.avatarUrl || null, u.isActive ? 1 : 0, u.createdAt
  );
}

export async function updateUser(id: string, u: Partial<User>): Promise<void> {
  const d = await getDb();
  const current = await getUserById(id);
  if (!current) return;
  const updated = { ...current, ...u };
  let passwordHash = updated.password;
  if (u.password && u.password !== current.password) {
    passwordHash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
  }
  await d.run(
    `UPDATE users SET username = ?, name = ?, email = ?, role = ?, password = ?, avatarUrl = ?, isActive = ? WHERE id = ?`,
    updated.username, updated.name, updated.email, updated.role, passwordHash, updated.avatarUrl || null, updated.isActive ? 1 : 0, id
  );
}

export async function deleteUser(id: string): Promise<void> {
  const d = await getDb();
  await d.run("DELETE FROM users WHERE id = ?", id);
  // Also revoke all tokens for this user
  await d.run("UPDATE auth_tokens SET revokedAt = ? WHERE userId = ? AND revokedAt IS NULL", new Date().toISOString(), id);
}

export async function authenticateUser(usernameOrEmail: string, pass: string): Promise<User | null> {
  const d = await getDb();
  const r = await d.get(
    "SELECT * FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND isActive = 1",
    usernameOrEmail, usernameOrEmail
  );
  if (!r) return null;
  
  const valid = await bcrypt.compare(pass, r.password);
  if (!valid) return null;
  
  return {
    id: r.id,
    username: r.username,
    name: r.name,
    email: r.email,
    role: r.role as any,
    avatarUrl: r.avatarUrl || undefined,
    isActive: Boolean(r.isActive),
    createdAt: r.createdAt
  };
}

// ============================================================
// AUTH TOKENS (JWT Refresh Token Storage)
// ============================================================

export interface AuthToken {
  id: string;
  userId: string;
  refreshTokenHash: string;
  accessTokenJti: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  lastUsedAt?: string;
}

async function initializeAuthTokensTable() {
  const d = await getDb();
  await d.exec(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      refreshTokenHash TEXT NOT NULL,
      accessTokenJti TEXT NOT NULL,
      userAgent TEXT,
      ipAddress TEXT,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      revokedAt TEXT,
      lastUsedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await d.exec(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(userId)`);
  await d.exec(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_jti ON auth_tokens(accessTokenJti)`);
  await d.exec(`CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expiresAt)`);
}

export async function storeRefreshToken(
  userId: string,
  refreshTokenHash: string,
  accessTokenJti: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  await initializeAuthTokensTable();
  const d = await getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL);
  await d.run(
    `INSERT INTO auth_tokens (id, userId, refreshTokenHash, accessTokenJti, userAgent, ipAddress, createdAt, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    `tok-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    userId,
    refreshTokenHash,
    accessTokenJti,
    userAgent || null,
    ipAddress || null,
    now.toISOString(),
    expiresAt.toISOString()
  );
}

export async function validateRefreshToken(
  refreshTokenHash: string
): Promise<AuthToken | null> {
  await initializeAuthTokensTable();
  const d = await getDb();
  const r = await d.get(
    `SELECT * FROM auth_tokens WHERE refreshTokenHash = ? AND revokedAt IS NULL AND expiresAt > ?`,
    refreshTokenHash,
    new Date().toISOString()
  );
  if (!r) return null;
  return {
    id: r.id,
    userId: r.userId,
    refreshTokenHash: r.refreshTokenHash,
    accessTokenJti: r.accessTokenJti,
    userAgent: r.userAgent,
    ipAddress: r.ipAddress,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    revokedAt: r.revokedAt,
    lastUsedAt: r.lastUsedAt
  };
}

export async function revokeRefreshToken(refreshTokenHash: string): Promise<void> {
  await initializeAuthTokensTable();
  const d = await getDb();
  await d.run(
    `UPDATE auth_tokens SET revokedAt = ? WHERE refreshTokenHash = ?`,
    new Date().toISOString(),
    refreshTokenHash
  );
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await initializeAuthTokensTable();
  const d = await getDb();
  await d.run(
    `UPDATE auth_tokens SET revokedAt = ? WHERE userId = ? AND revokedAt IS NULL`,
    new Date().toISOString(),
    userId
  );
}

export async function revokeAccessTokenJti(accessTokenJti: string): Promise<void> {
  await initializeAuthTokensTable();
  const d = await getDb();
  await d.run(
    `UPDATE auth_tokens SET revokedAt = ? WHERE accessTokenJti = ?`,
    new Date().toISOString(),
    accessTokenJti
  );
}

export async function updateTokenLastUsed(refreshTokenHash: string): Promise<void> {
  await initializeAuthTokensTable();
  const d = await getDb();
  await d.run(
    `UPDATE auth_tokens SET lastUsedAt = ? WHERE refreshTokenHash = ?`,
    new Date().toISOString(),
    refreshTokenHash
  );
}

export async function cleanupExpiredTokens(): Promise<void> {
  await initializeAuthTokensTable();
  const d = await getDb();
  await d.run(`DELETE FROM auth_tokens WHERE expiresAt < ?`, new Date().toISOString());
}

// ============================================================
// AUTH AUDIT LOG
// ============================================================

export interface AuthAuditLog {
  id: string;
  userId?: string;
  username?: string;
  email?: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'TOKEN_REFRESH' | 'TOKEN_REVOKED' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET_COMPLETE' | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'ROLE_CHANGED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED';
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  createdAt: string;
}

async function initializeAuthAuditTable() {
  const d = await getDb();
  await d.exec(`
    CREATE TABLE IF NOT EXISTS auth_audit_log (
      id TEXT PRIMARY KEY,
      userId TEXT,
      username TEXT,
      action TEXT NOT NULL,
      success INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      details TEXT,
      createdAt TEXT NOT NULL
    )
  `);
  await d.exec(`CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_log(userId)`);
  await d.exec(`CREATE INDEX IF NOT EXISTS idx_auth_audit_action ON auth_audit_log(action)`);
  await d.exec(`CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(createdAt)`);
}

export async function logAuthEvent(
  action: AuthAuditLog['action'],
  success: boolean,
  options: {
    userId?: string;
    username?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: string;
  } = {}
): Promise<void> {
  await initializeAuthAuditTable();
  const d = await getDb();
  await d.run(
    `INSERT INTO auth_audit_log (id, userId, username, action, success, ipAddress, userAgent, details, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    options.userId || null,
    options.username || null,
    action,
    success ? 1 : 0,
    options.ipAddress || null,
    options.userAgent || null,
    options.details || null,
    new Date().toISOString()
  );
}

export async function getAuthAuditLogs(
  options: {
    userId?: string;
    action?: AuthAuditLog['action'];
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ logs: AuthAuditLog[]; total: number }> {
  await initializeAuthAuditTable();
  const d = await getDb();
  
  const conditions: string[] = [];
  const params: any[] = [];
  
  if (options.userId) {
    conditions.push('userId = ?');
    params.push(options.userId);
  }
  if (options.action) {
    conditions.push('action = ?');
    params.push(options.action);
  }
  if (options.startDate) {
    conditions.push('createdAt >= ?');
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push('createdAt <= ?');
    params.push(options.endDate);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const countResult = await d.get(`SELECT COUNT(*) as count FROM auth_audit_log ${whereClause}`, params);
  const total = countResult?.count || 0;
  
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  
  const rows = await d.all(
    `SELECT * FROM auth_audit_log ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  
  const logs: AuthAuditLog[] = rows.map(r => ({
    id: r.id,
    userId: r.userId,
    username: r.username,
    action: r.action,
    success: r.success === 1,
    ipAddress: r.ipAddress,
    userAgent: r.userAgent,
    details: r.details,
    createdAt: r.createdAt
  }));
  
  return { logs, total };
}

export async function getAuthAuditStats(days: number = 30): Promise<{
  totalLogins: number;
  failedLogins: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
}> {
  await initializeAuthAuditTable();
  const d = await getDb();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const totalResult = await d.get(
    `SELECT COUNT(*) as count FROM auth_audit_log WHERE createdAt >= ? AND action IN ('LOGIN_SUCCESS', 'LOGIN_FAILED')`,
    since
  );
  const failedResult = await d.get(
    `SELECT COUNT(*) as count FROM auth_audit_log WHERE createdAt >= ? AND action = 'LOGIN_FAILED'`,
    since
  );
  const uniqueUsersResult = await d.get(
    `SELECT COUNT(DISTINCT userId) as count FROM auth_audit_log WHERE createdAt >= ? AND userId IS NOT NULL`,
    since
  );
  const topActions = await d.all(
    `SELECT action, COUNT(*) as count FROM auth_audit_log WHERE createdAt >= ? GROUP BY action ORDER BY count DESC LIMIT 10`,
    since
  );
  
  return {
    totalLogins: totalResult?.count || 0,
    failedLogins: failedResult?.count || 0,
    uniqueUsers: uniqueUsersResult?.count || 0,
    topActions: topActions.map(r => ({ action: r.action, count: r.count }))
  };
}

// ----------------------------------------------------
// INVOICE DB HELPERS
// ----------------------------------------------------
export async function getAllInvoices(): Promise<Invoice[]> {
  const d = await getDb();
  const rows = await d.all('SELECT * FROM invoices ORDER BY createdAt DESC');
  return rows.map(r => ({
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    proposalId: r.proposalId || undefined,
    proposalNumber: r.proposalNumber || undefined,
    customer: JSON.parse(r.customerJson),
    issueDate: r.issueDate,
    dueDate: r.dueDate,
    status: r.status,
    amount: r.amount,
    paidAmount: r.paidAmount,
    currency: r.currency,
    notes: r.notes || undefined,
    createdAt: r.createdAt
  }));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const d = await getDb();
  const r = await d.get('SELECT * FROM invoices WHERE id = ?', id);
  if (!r) return null;
  return {
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    proposalId: r.proposalId || undefined,
    proposalNumber: r.proposalNumber || undefined,
    customer: JSON.parse(r.customerJson),
    issueDate: r.issueDate,
    dueDate: r.dueDate,
    status: r.status,
    amount: r.amount,
    paidAmount: r.paidAmount,
    currency: r.currency,
    notes: r.notes || undefined,
    createdAt: r.createdAt
  };
}

export async function insertInvoice(invoice: Invoice): Promise<void> {
  const d = await getDb();
  await d.run(
    `INSERT INTO invoices (id, invoiceNumber, proposalId, proposalNumber, customerJson, issueDate, dueDate, status, amount, paidAmount, currency, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoice.id,
      invoice.invoiceNumber,
      invoice.proposalId || null,
      invoice.proposalNumber || null,
      JSON.stringify(invoice.customer),
      invoice.issueDate,
      invoice.dueDate,
      invoice.status,
      invoice.amount,
      invoice.paidAmount,
      invoice.currency,
      invoice.notes || null,
      invoice.createdAt
    ]
  );
}

export async function updateInvoice(id: string, invoice: Partial<Invoice>): Promise<void> {
  const d = await getDb();
  const existing = await getInvoiceById(id);
  if (!existing) return;

  const merged = { ...existing, ...invoice };

  await d.run(
    `UPDATE invoices 
     SET invoiceNumber = ?, proposalId = ?, proposalNumber = ?, customerJson = ?, issueDate = ?, dueDate = ?, status = ?, amount = ?, paidAmount = ?, currency = ?, notes = ?
     WHERE id = ?`,
    [
      merged.invoiceNumber,
      merged.proposalId || null,
      merged.proposalNumber || null,
      JSON.stringify(merged.customer),
      merged.issueDate,
      merged.dueDate,
      merged.status,
      merged.amount,
      merged.paidAmount,
      merged.currency,
      merged.notes || null,
      id
    ]
  );
}

export async function deleteInvoice(id: string): Promise<void> {
  const d = await getDb();
  await d.run('DELETE FROM invoices WHERE id = ?', id);
}
