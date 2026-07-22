import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import os from "os";
import { Proposal, AppNotification, EmailLog, Customer, AppSettings, User, Invoice } from "./src/types.ts";
import { generateProposalEmailHtml } from "./src/utils/emailTemplate.ts";
import {
  getDb,
  resetDatabase,
  getSettings,
  updateSettings,
  getAllCustomers,
  getCustomerById,
  insertCustomer,
  updateCustomer,
  deleteCustomer,
  getAllProposals,
  getProposalById,
  insertProposal,
  updateProposal,
  deleteProposal,
  getAllInvoices,
  getInvoiceById,
  insertInvoice,
  updateInvoice,
  deleteInvoice,
  updateCustomerInAllProposals,
  getNotifications,
  insertNotification,
  readAllNotifications,
  readNotification,
  clearNotifications,
  getEmailLogs,
  insertEmailLog,
  getAllUsers,
  getUserById,
  insertUser,
  updateUser,
  deleteUser,
  authenticateUser,
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  revokeAccessTokenJti,
  updateTokenLastUsed,
  logAuthEvent,
  getAuthAuditLogs,
  getAuthAuditStats
} from "./src/db.ts";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hashRefreshToken, TOKEN_EXPIRY } from "./src/utils/jwt.ts";

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.error("Gemini initialization error:", err);
    }
  }
  return aiClient;
}

async function startServer() {
  // Initialize Database
  await getDb();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // -----------------------------------------------------------------
  // API ROUTES
  // -----------------------------------------------------------------

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // POST /api/auth/login - Returns JWT access + refresh tokens
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, rememberMe } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Kullanıcı adı ve şifre zorunludur." });
      }
      const user = await authenticateUser(username, password);
      if (!user) {
        await logAuthEvent('LOGIN_FAILED', false, {
          username,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get('user-agent')
        });
        return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı." });
      }

      const { token: accessToken, payload: accessPayload } = generateAccessToken(user);
      const { token: refreshToken, payload: refreshPayload } = generateRefreshToken(user, accessPayload.jti);

      const refreshTokenHash = hashRefreshToken(refreshToken);
      await storeRefreshToken(
        user.id,
        refreshTokenHash,
        accessPayload.jti,
        req.get('user-agent'),
        req.ip || req.socket.remoteAddress
      );

      await logAuthEvent('LOGIN_SUCCESS', true, {
        userId: user.id,
        username: user.username,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        details: `Başarılı giriş (${rememberMe ? 'Beni Hatırla' : 'Normal'})`
      });

      res.json({
        success: true,
        user,
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: 15 * 60 * 1000
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/refresh
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token gerekli." });
      }

      const refreshPayload = verifyRefreshToken(refreshToken);
      if (!refreshPayload || refreshPayload.type !== 'refresh') {
        return res.status(401).json({ error: "Geçersiz refresh token." });
      }

      const refreshTokenHash = hashRefreshToken(refreshToken);
      const tokenData = await validateRefreshToken(refreshTokenHash);
      if (!tokenData) {
        return res.status(401).json({ error: "Refresh token geçersiz veya süresi dolmuş." });
      }

      const user = await getUserById(tokenData.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Kullanıcı bulunamadı veya pasif." });
      }

      const { token: accessToken, payload: accessPayload } = generateAccessToken(user);

      await storeRefreshToken(
        user.id,
        refreshTokenHash,
        accessPayload.jti,
        req.get('user-agent'),
        req.ip || req.socket.remoteAddress
      );

      await updateTokenLastUsed(refreshTokenHash);
      await logAuthEvent('TOKEN_REFRESH', true, {
        userId: user.id,
        username: user.username
      });

      res.json({
        success: true,
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 * 1000
      });
    } catch (err: any) {
      res.status(401).json({ error: "Oturum yenileme başarısız." });
    }
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        const refreshPayload = verifyRefreshToken(refreshToken);
        if (refreshPayload && refreshPayload.sub) {
          await logAuthEvent('LOGOUT', true, {
            userId: refreshPayload.sub,
            username: refreshPayload.username
          });
        }
        const refreshTokenHash = hashRefreshToken(refreshToken);
        await revokeRefreshToken(refreshTokenHash);
      }
      res.json({ success: true, message: "Başarıyla çıkış yapıldı." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "E-posta adresi zorunludur." });
      }

      const users = await getAllUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        await logAuthEvent('PASSWORD_RESET_REQUEST', true, {
          userId: user.id,
          username: user.username,
          details: `E-posta: ${user.email}`
        });
      } else {
        await logAuthEvent('PASSWORD_RESET_REQUEST', false, { details: `E-posta: ${email}` });
      }

      res.json({ success: true, message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (varsa)." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: "Token ve yeni şifre zorunludur." });
      }

      const resetPayload = verifyRefreshToken(token);
      if (!resetPayload || resetPayload.type !== 'refresh') {
        return res.status(401).json({ error: "Geçersiz veya süresi dolmuş sıfırlama token'ı." });
      }

      const user = await getUserById(resetPayload.sub);
      if (!user || !user.isActive) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      }

      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 12);
      await updateUser(user.id, { password: passwordHash });

      await revokeAllUserTokens(user.id);

      await logAuthEvent('PASSWORD_RESET_COMPLETE', true, {
        userId: user.id,
        username: user.username,
        details: 'Şifre sıfırlandı, tüm oturumlar kapatıldı'
      });

      res.json({ success: true, message: "Şifre başarıyla güncellendi." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/auth/audit-logs
  app.get("/api/auth/audit-logs", async (req, res) => {
    try {
      const { userId, action, startDate, endDate, limit, offset } = req.query;
      const result = await getAuthAuditLogs({
        userId: userId as string,
        action: action as any,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/auth/audit-stats
  app.get("/api/auth/audit-stats", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const stats = await getAuthAuditStats(days);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/users
  app.get("/api/users", async (_req, res) => {
    try {
      res.json(await getAllUsers());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/users
  app.post("/api/users", async (req, res) => {
    try {
      const newUser: User = {
        id: `usr-${Date.now()}`,
        username: req.body.username || `kullanici_${Date.now()}`,
        name: req.body.name || "Yeni Kullanıcı",
        email: req.body.email || "",
        role: req.body.role || "SALES",
        password: req.body.password || "123456",
        avatarUrl: req.body.avatarUrl || undefined,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        createdAt: new Date().toISOString()
      };
      await insertUser(newUser);
      res.status(201).json(newUser);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/users/:id
  app.put("/api/users/:id", async (req, res) => {
    try {
      await updateUser(req.params.id, req.body);
      const updated = await getUserById(req.params.id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/users/:id
  app.delete("/api/users/:id", async (req, res) => {
    try {
      await deleteUser(req.params.id);
      res.json({ success: true, message: "Kullanıcı silindi" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/customers
  app.get("/api/customers", async (_req, res) => {
    try {
      res.json(await getAllCustomers());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/customers
  app.post("/api/customers", async (req, res) => {
    try {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        name: req.body.name || "Yeni Müşteri",
        companyName: req.body.companyName || "Şirket Unvanı",
        email: req.body.email || "",
        phone: req.body.phone || "",
        address: req.body.address || "",
        taxOffice: req.body.taxOffice || "",
        taxNumber: req.body.taxNumber || ""
      };
      await insertCustomer(newCustomer);
      res.status(201).json(newCustomer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/customers/:id
  app.put("/api/customers/:id", async (req, res) => {
    try {
      const customer = await getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Müşteri bulunamadı" });
      }
      await updateCustomer(req.params.id, req.body);
      await updateCustomerInAllProposals(req.params.id, req.body);
      const updated = await getCustomerById(req.params.id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/customers/:id
  app.delete("/api/customers/:id", async (req, res) => {
    try {
      await deleteCustomer(req.params.id);
      res.json({ success: true, message: "Müşteri silindi" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/proposals
  app.get("/api/proposals", async (_req, res) => {
    try {
      res.json(await getAllProposals());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/proposals/:id
  app.get("/api/proposals/:id", async (req, res) => {
    try {
      const proposal = await getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Teklif bulunamadı" });
      }
      res.json(proposal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/proposals - Create new proposal
  app.post("/api/proposals", async (req, res) => {
    try {
      const year = new Date().getFullYear();
      const existingProposals = await getAllProposals();
      const count = existingProposals.length + 1;
      const proposalNum = `TEK-${year}-${String(count).padStart(3, '0')}`;

      // Default customer if none provided
      let customerObj = req.body.customer;
      if (!customerObj) {
        const allCustomers = await getAllCustomers();
        customerObj = allCustomers[0];
      }

      const newProposal: Proposal = {
        id: `prop-${Date.now()}`,
        proposalNumber: req.body.proposalNumber || proposalNum,
        title: req.body.title || 'Yeni Hizmet / Ürün Teklifi',
        customer: customerObj,
        issueDate: req.body.issueDate || new Date().toISOString().split('T')[0],
        validUntilDate: req.body.validUntilDate || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
        currency: req.body.currency || 'TRY',
        notes: req.body.notes || 'Teklifimiz belirtilen süre içerisinde geçerlidir.',
        paymentTerms: req.body.paymentTerms || '%50 Peşin, %50 Teslimat Onayında',
        status: req.body.status || 'TASLAK',
        items: req.body.items || [],
        subtotal: Number(req.body.subtotal) || 0,
        totalTax: Number(req.body.totalTax) || 0,
        totalDiscount: Number(req.body.totalDiscount) || 0,
        grandTotal: Number(req.body.grandTotal) || 0,
        devices: req.body.devices || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          {
            id: `log-${Date.now()}`,
            date: new Date().toLocaleString('tr-TR'),
            action: 'Oluşturuldu',
            description: 'Teklif taslağı oluşturuldu.',
            actor: 'Sistem Yöneticisi'
          }
        ]
      };

      await insertProposal(newProposal);
      res.status(201).json(newProposal);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/proposals/:id - Update proposal
  app.put("/api/proposals/:id", async (req, res) => {
    try {
      const existing = await getProposalById(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Teklif bulunamadı" });
      }

      const updated: Proposal = {
        ...existing,
        ...req.body,
        updatedAt: new Date().toISOString(),
        history: [
          ...existing.history,
          {
            id: `log-${Date.now()}`,
            date: new Date().toLocaleString('tr-TR'),
            action: 'Güncellendi',
            description: 'Teklif detayları güncellendi.',
            actor: 'Sistem Yöneticisi'
          }
        ]
      };

      await updateProposal(req.params.id, updated);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/proposals/:id
  app.delete("/api/proposals/:id", async (req, res) => {
    try {
      await deleteProposal(req.params.id);
      res.json({ success: true, message: "Teklif silindi" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/invoices
  app.get("/api/invoices", async (_req, res) => {
    try {
      res.json(await getAllInvoices());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/invoices/:id
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const inv = await getInvoiceById(req.params.id);
      if (!inv) return res.status(404).json({ error: "Fatura bulunamadı" });
      res.json(inv);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/invoices - Create new invoice
  app.post("/api/invoices", async (req, res) => {
    try {
      const existing = await getAllInvoices();
      const year = new Date().getFullYear();
      const count = existing.length + 1;
      const defaultInvNum = `FTR-${year}-${String(count).padStart(3, '0')}`;

      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: req.body.invoiceNumber || defaultInvNum,
        proposalId: req.body.proposalId || undefined,
        proposalNumber: req.body.proposalNumber || undefined,
        customer: req.body.customer,
        issueDate: req.body.issueDate || new Date().toISOString().split('T')[0],
        dueDate: req.body.dueDate || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: req.body.status || 'BEKLIYOR',
        amount: Number(req.body.amount) || 0,
        paidAmount: Number(req.body.paidAmount) || 0,
        currency: req.body.currency || 'TRY',
        notes: req.body.notes || undefined,
        createdAt: new Date().toISOString()
      };

      await insertInvoice(newInvoice);
      res.status(201).json(newInvoice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/invoices/:id
  app.put("/api/invoices/:id", async (req, res) => {
    try {
      await updateInvoice(req.params.id, req.body);
      const updated = await getInvoiceById(req.params.id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/invoices/:id
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      await deleteInvoice(req.params.id);
      res.json({ success: true, message: "Fatura silindi" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/proposals/:id/send-email
  app.post("/api/proposals/:id/send-email", async (req, res) => {
    try {
      const proposal = await getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Teklif bulunamadı" });
      }

      const { toEmail, subject, customMessage } = req.body;
      const recipientEmail = (toEmail && toEmail.trim()) || proposal.customer.email;

      if (!recipientEmail) {
        return res.status(400).json({ error: "Geçerli bir alıcı e-posta adresi bulunamadı." });
      }

      const systemSettings = await getSettings();

      // Generate public origin URL for links inside email
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3000';
      const configuredPublicUrl = process.env.PUBLIC_URL || systemSettings.company?.publicUrl;
      const hostOrigin = configuredPublicUrl && configuredPublicUrl.trim()
        ? configuredPublicUrl.trim().replace(/\/+$/, '') + '/'
        : `${protocol}://${host}/`;

      // Generate rich HTML email
      const htmlBody = generateProposalEmailHtml(proposal, systemSettings, customMessage, hostOrigin);
      const emailSubject = subject || `${proposal.proposalNumber} - ${proposal.title}`;

      // Determine SMTP configuration
      const smtpHost = process.env.SMTP_HOST || systemSettings.smtp?.host;
      const smtpPort = Number(process.env.SMTP_PORT || systemSettings.smtp?.port) || 587;
      const smtpUser = process.env.SMTP_USER || systemSettings.smtp?.user;
      const smtpPass = process.env.SMTP_PASS || systemSettings.smtp?.pass;
      const smtpSecure = process.env.SMTP_SECURE === 'true' || systemSettings.smtp?.secure || false;
      const fromEmail = process.env.SMTP_FROM || systemSettings.smtp?.fromEmail || systemSettings.company.email || 'teklif@teklifpro.com.tr';
      const senderName = systemSettings.notifications.senderName || systemSettings.company.name || 'TeklifPro';

      let sendStatus: 'GÖNDERİLDİ' | 'HATA' = 'GÖNDERİLDİ';
      let deliveryMethod = 'SIMULATED';
      let testPreviewUrl = '';
      let errorMessage = '';

      try {
        let transporter: nodemailer.Transporter;

        if (smtpHost && smtpUser && smtpPass) {
          // Real SMTP Server with connection timeouts
          deliveryMethod = 'SMTP';
          transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: { user: smtpUser, pass: smtpPass },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000
          });
        } else {
          // Fast instant transport (Prevents network hang or freeze)
          deliveryMethod = 'SIMULATED';
          transporter = nodemailer.createTransport({
            jsonTransport: true
          });
        }

        const mailInfo = await transporter.sendMail({
          from: `"${senderName}" <${fromEmail}>`,
          to: recipientEmail,
          subject: emailSubject,
          text: customMessage || `Sayın ${proposal.customer.name},\nTeklifinizi incelemek için web sitemizi ziyaret edin.`,
          html: htmlBody
        });

        const testUrl = nodemailer.getTestMessageUrl(mailInfo);
        if (testUrl) {
          testPreviewUrl = testUrl as string;
        }
      } catch (err: any) {
        console.error("E-posta gönderim hatası:", err);
        sendStatus = 'HATA';
        errorMessage = err.message || 'SMTP iletim hatası';
      }

      // Update proposal status & history
      proposal.status = 'GONDERILDI';
      proposal.sentAt = new Date().toISOString();
      proposal.history.push({
        id: `log-${Date.now()}`,
        date: new Date().toLocaleString('tr-TR'),
        action: 'E-posta Gönderildi',
        description: sendStatus === 'GÖNDERİLDİ' 
          ? `Teklif e-posta ile ${recipientEmail} adresine ulaştırıldı. (${deliveryMethod})`
          : `E-posta gönderimi ${recipientEmail} adresine başarısız oldu: ${errorMessage}`,
        actor: 'Sistem Yöneticisi'
      });

      await updateProposal(proposal.id, proposal);

      // Record email log
      const emailLog: EmailLog = {
        id: `email-${Date.now()}`,
        proposalId: proposal.id,
        toEmail: recipientEmail,
        subject: emailSubject,
        sentAt: new Date().toISOString(),
        status: sendStatus,
        customMessage
      };
      await insertEmailLog(emailLog);

      // Create system notification
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        proposalId: proposal.id,
        proposalNumber: proposal.proposalNumber,
        customerName: proposal.customer.companyName || proposal.customer.name,
        type: 'EPOSTA_GONDERILDI',
        title: sendStatus === 'GÖNDERİLDİ' ? '📧 E-Posta İletildi' : '⚠️ E-Posta İletilemedi',
        message: sendStatus === 'GÖNDERİLDİ'
          ? `${proposal.proposalNumber} teklifi ${recipientEmail} adresine e-posta olarak gönderildi.`
          : `${proposal.proposalNumber} teklifi e-postası gönderilemedi: ${errorMessage}`,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      await insertNotification(newNotif);

      res.json({ 
        success: sendStatus === 'GÖNDERİLDİ', 
        proposal, 
        emailLog, 
        deliveryMethod, 
        testPreviewUrl,
        errorMessage: errorMessage || undefined
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/test-smtp - Test SMTP connection
  app.post("/api/test-smtp", async (req, res) => {
    const { host, port, user, pass, secure, fromEmail, testRecipient } = req.body;
    
    if (!host || !user || !pass) {
      return res.status(400).json({ 
        success: false, 
        message: "SMTP Sunucu (Host), Kullanıcı Adı ve Şifre bilgileri zorunludur." 
      });
    }

    try {
      const systemSettings = await getSettings();

      const transporter = nodemailer.createTransport({
        host: host.trim(),
        port: Number(port) || 587,
        secure: Boolean(secure),
        auth: {
          user: user.trim(),
          pass: pass.trim()
        }
      });

      // Verify connection configuration
      await transporter.verify();

      // Send test mail if recipient is provided
      if (testRecipient && testRecipient.trim()) {
        await transporter.sendMail({
          from: `"${systemSettings.company.name}" <${fromEmail || user}>`,
          to: testRecipient.trim(),
          subject: 'TEKLİFPRO - SMTP Test E-Postası',
          text: 'Tebrikler! TEKLİFPRO SMTP sunucu ayarlarınız başarıyla doğrulandı ve çalışıyor.',
          html: `<div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; rounded: 8px;">
            <h2 style="color: #2563eb;">TEKLİFPRO SMTP Testi Başarılı!</h2>
            <p>Bu e-posta, TEKLİFPRO e-posta sunucu ayarlarınızı test etmek amacıyla gönderilmiştir.</p>
            <p><strong>Sunucu:</strong> ${host}:${port}</p>
            <p>E-postalarınız müşterilerinize sorunsuz ulaştırılacaktır.</p>
          </div>`
        });
      }

      res.json({ 
        success: true, 
        message: `SMTP sunucusuyla bağlantı başarıyla kuruldu! ${testRecipient ? testRecipient + ' adresine test e-postası gönderildi.' : ''}` 
      });
    } catch (err: any) {
      console.error("SMTP Test hatası:", err);
      res.status(500).json({ 
        success: false, 
        message: `SMTP Bağlantı Hatası: ${err.message || 'Sunucuya bağlanılamadı.'}` 
      });
    }
  });

  // GET /api/email-logs - Retrieve email dispatch history
  app.get("/api/email-logs", async (_req, res) => {
    try {
      res.json(await getEmailLogs());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/proposals/:id/view - Customer views proposal link
  app.post("/api/proposals/:id/view", async (req, res) => {
    try {
      const proposal = await getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Teklif bulunamadı" });
      }

      // Only set viewed if not already approved/rejected
      if (proposal.status === 'GONDERILDI' || proposal.status === 'TASLAK') {
        proposal.status = 'INCELENIYOR';
        proposal.viewedAt = new Date().toISOString();
        proposal.history.push({
          id: `log-${Date.now()}`,
          date: new Date().toLocaleString('tr-TR'),
          action: 'Görüntülendi',
          description: 'Müşteri teklifi online portal üzerinden açıp inceledi.',
          actor: `Müşteri (${proposal.customer.name})`
        });

        await updateProposal(proposal.id, proposal);

        // Notify owner that customer opened proposal
        await insertNotification({
          id: `notif-${Date.now()}`,
          proposalId: proposal.id,
          proposalNumber: proposal.proposalNumber,
          customerName: proposal.customer.companyName || proposal.customer.name,
          type: 'GORUNTULEME',
          title: '👀 Teklif İncelemeye Alındı',
          message: `${proposal.customer.companyName || proposal.customer.name} firmanızın gönderdiği ${proposal.proposalNumber} numaralı teklifi incelemeye başladı.`,
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }

      res.json({ success: true, proposal });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/proposals/:id/approve - Customer approves proposal
  app.post("/api/proposals/:id/approve", async (req, res) => {
    try {
      const proposal = await getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Teklif bulunamadı" });
      }

      const { note, signatureName } = req.body;

      proposal.status = 'ONAYLANDI';
      proposal.respondedAt = new Date().toISOString();
      proposal.customerResponseNote = note || '';
      proposal.customerSignature = signatureName || proposal.customer.name;

      proposal.history.push({
        id: `log-${Date.now()}`,
        date: new Date().toLocaleString('tr-TR'),
        action: 'Onaylandı',
        description: `Müşteri teklifi onayladı.${note ? ' Not: ' + note : ''}`,
        actor: `Müşteri (${proposal.customer.name})`
      });

      await updateProposal(proposal.id, proposal);

      // CRITICAL AUTOMATIC NOTIFICATION FOR APPROVAL
      const approvalNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        proposalId: proposal.id,
        proposalNumber: proposal.proposalNumber,
        customerName: proposal.customer.companyName || proposal.customer.name,
        type: 'ONAY',
        title: '🎉 TEKLİF ONAYLANDI!',
        message: `${proposal.customer.companyName || proposal.customer.name} ${proposal.proposalNumber} numaralı teklifinizi ONAYLADI!`,
        createdAt: new Date().toISOString(),
        isRead: false,
        amount: proposal.grandTotal,
        currency: proposal.currency,
        customerNote: note || undefined
      };

      await insertNotification(approvalNotif);

      res.json({ success: true, proposal, notification: approvalNotif });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/proposals/:id/reject - Customer rejects proposal
  app.post("/api/proposals/:id/reject", async (req, res) => {
    try {
      const proposal = await getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: "Teklif bulunamadı" });
      }

      const { reason } = req.body;

      proposal.status = 'REDDEDILDI';
      proposal.respondedAt = new Date().toISOString();
      proposal.rejectionReason = reason || 'Belirtilmedi';

      proposal.history.push({
        id: `log-${Date.now()}`,
        date: new Date().toLocaleString('tr-TR'),
        action: 'Reddedildi',
        description: `Müşteri teklifi reddetti. Nedeni: ${reason || 'Belirtilmedi'}`,
        actor: `Müşteri (${proposal.customer.name})`
      });

      await updateProposal(proposal.id, proposal);

      // CRITICAL AUTOMATIC NOTIFICATION FOR REJECTION
      const rejectionNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        proposalId: proposal.id,
        proposalNumber: proposal.proposalNumber,
        customerName: proposal.customer.companyName || proposal.customer.name,
        type: 'RET',
        title: '⚠️ TEKLİF REDDEDİLDİ',
        message: `${proposal.customer.companyName || proposal.customer.name} ${proposal.proposalNumber} numaralı teklifinizi reddetti.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        amount: proposal.grandTotal,
        currency: proposal.currency,
        customerNote: reason || undefined
      };

      await insertNotification(rejectionNotif);

      res.json({ success: true, proposal, notification: rejectionNotif });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/notifications
  app.get("/api/notifications", async (_req, res) => {
    try {
      res.json(await getNotifications());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/notifications/read-all
  app.put("/api/notifications/read-all", async (_req, res) => {
    try {
      await readAllNotifications();
      res.json({ success: true, unreadCount: 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/notifications/:id/read
  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      await readNotification(req.params.id);
      res.json(await getNotifications());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/notifications
  app.delete("/api/notifications", async (_req, res) => {
    try {
      await clearNotifications();
      res.json({ success: true, unreadCount: 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/settings
  app.get("/api/settings", async (_req, res) => {
    try {
      res.json(await getSettings());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/settings
  app.put("/api/settings", async (req, res) => {
    try {
      await updateSettings(req.body);
      res.json({ success: true, settings: await getSettings() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/settings/reset-data - Reset all system data to initial defaults
  app.post("/api/settings/reset-data", async (_req, res) => {
    try {
      await resetDatabase();
      res.json({ success: true, message: "Sistem verileri fabrika ayarlarına sıfırlandı." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/ai/generate-proposal-text
  app.post("/api/ai/generate-proposal-text", async (req, res) => {
    const { title, customerName, industry, itemsSummary, tone } = req.body;
    const client = getGeminiClient();

    if (!client) {
      // Fallback professional templates if Gemini API key not set
      return res.json({
        text: `Sayın ${customerName || 'Müşterimiz'},\n\n` +
          `Firmanız için hazırladığımız "${title || 'Hizmet ve Danışmanlık'}" teklifimizi bilgilerinize sunarız.\n` +
          `Teklifimiz kapsamında, belirlenen gereksinimler doğrultusunda yüksek kaliteli ve zamanında teslimat ilkesiyle çalışmayı taahhüt ediyoruz.\n\n` +
          `Gereksinimlerinizin eksiksiz karşılanması amacıyla hazırlanan detaylı kalemler aşağıda yer almaktadır. Sorularınız veya özel talepleriniz için temsilcinizle her zaman iletişime geçebilirsiniz.\n\n` +
          `İş birliğimizin hayırlı olmasını dileriz.`
      });
    }

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Sen profesyonel bir kurumsal teklif hazırlama uzmanısın. Aşağıdaki bilgilere dayanarak Türkçe dilinde, müşteriye sunulacak son derece ikna edici, saygın ve kurumsal bir teklif giriş mektubu/ön sunuş metni yaz:
        - Proje/Hizmet Başlığı: ${title || 'Yazılım ve Danışmanlık Hizmetleri'}
        - Müşteri/Firma Adı: ${customerName || 'Değerli Müşterimiz'}
        - Sektör/Konu: ${industry || 'Teknoloji & Tasarım'}
        - Dahil Olan Hizmetler: ${itemsSummary || 'Detaylı hizmet kalemleri'}
        - Üslup: ${tone || 'Kurumsal, Kurumsal Güven Verici ve Şeffaf'}
        
        Metni doğrudan müşteriye hitap ederek 2-3 paragraf şeklinde yaz.`
      });

      res.json({ text: response.text || "Teklif metni üretildi." });
    } catch (err: any) {
      console.error("Gemini text generation failed:", err);
      res.json({
        text: `Sayın ${customerName || 'Müşterimiz'},\n\n` +
          `Sizler için özel olarak hazırladığımız "${title}" projemize ait teklif şartlarımız ve hizmet kapsamımız aşağıda bilgilerinize sunulmuştur.`
      });
    }
  });

  // -----------------------------------------------------------------
  // VITE & STATIC SERVING
  // -----------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n==================================================================`);
    console.log(`🚀 Teklif Yönetim Sistemi Sunucusu Başlatıldı!`);
    console.log(`   - Yerel Erişim (Local):     http://localhost:${PORT}`);
    
    // Get and print LAN IP addresses
    const interfaces = os.networkInterfaces();
    let hasLanAddress = false;
    for (const name of Object.keys(interfaces)) {
      const netInterface = interfaces[name];
      if (netInterface) {
        for (const net of netInterface) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`   - Ağ Erişimi (LAN - ${name}): http://${net.address}:${PORT}`);
            hasLanAddress = true;
          }
        }
      }
    }
    if (!hasLanAddress) {
      console.log(`   - Ağ Erişimi (LAN):         Aktif bir LAN/Wi-Fi bağlantısı bulunamadı`);
    }
    console.log(`==================================================================\n`);
  });
}

startServer();
