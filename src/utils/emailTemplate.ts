import { Proposal, AppSettings } from '../types';
import { formatCurrency, formatDate, getPublicPortalUrl } from './formatters';

export function generateProposalEmailHtml(
  proposal: Proposal,
  settings: AppSettings,
  customMessage?: string,
  hostOrigin: string = ''
): string {
  const portalUrl = getPublicPortalUrl(proposal.id, settings);
  const company = settings.company;

  const devices = (proposal.devices && proposal.devices.length > 0)
    ? proposal.devices
    : [
        {
          id: 'dev-1',
          receiptNo: proposal.receiptNo || '',
          modelCode: proposal.modelCode || '',
          serialNo: proposal.serialNo || '',
          items: proposal.items?.map(i => ({
            id: i.id,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit
          })) || [],
          deviceTotal: proposal.grandTotal || proposal.subtotal || 0
        }
      ];

  const devicesHtml = devices.map((dev, idx) => `
    <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <!-- Device Header -->
      <div style="background-color: #0f172a; padding: 10px 16px; color: #ffffff;">
        <span style="background-color: #2563eb; color: #ffffff; font-family: monospace; font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-right: 8px;">
          CİHAZ #${idx + 1}
        </span>
        <strong style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${dev.modelCode ? dev.modelCode : `Cihaz Hizmet Grubu #${idx + 1}`}
        </strong>
      </div>

      <!-- Metadata Bar -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">
        <tr>
          <td style="padding: 8px 14px; border-right: 1px solid #e2e8f0; width: 33%;">
            <span style="color: #94a3b8; font-size: 9px; text-transform: uppercase; font-weight: bold; display: block;">Fiş No</span>
            <strong style="color: #0f172a; font-family: monospace;">${dev.receiptNo || '-'}</strong>
          </td>
          <td style="padding: 8px 14px; border-right: 1px solid #e2e8f0; width: 33%;">
            <span style="color: #94a3b8; font-size: 9px; text-transform: uppercase; font-weight: bold; display: block;">Model Kodu</span>
            <strong style="color: #0f172a; font-family: monospace;">${dev.modelCode || '-'}</strong>
          </td>
          <td style="padding: 8px 14px; width: 34%;">
            <span style="color: #94a3b8; font-size: 9px; text-transform: uppercase; font-weight: bold; display: block;">Seri No</span>
            <strong style="color: #0f172a; font-family: monospace;">${dev.serialNo || '-'}</strong>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <div style="padding: 12px 14px;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead>
            <tr style="border-bottom: 1.5px solid #e2e8f0; color: #64748b; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 6px 8px; font-weight: 700; width: 40px; text-align: center;">#</th>
              <th style="padding: 6px 8px; font-weight: 700;">Hizmet / Ürün Açıklaması</th>
              <th style="padding: 6px 8px; font-weight: 700; text-align: center; width: 80px;">Miktar</th>
            </tr>
          </thead>
          <tbody>
            ${dev.items.map((item, iIdx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px; text-align: center; color: #94a3b8; font-family: monospace; font-weight: bold;">${iIdx + 1}</td>
                <td style="padding: 8px; color: #1e293b; font-weight: 500; line-height: 1.4;">${item.description || '-'}</td>
                <td style="padding: 8px; text-align: center; color: #475569; font-family: monospace; font-weight: bold;">${item.quantity} ${item.unit || 'Adet'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 10px; text-align: right;">
          <span style="font-size: 11px; color: #64748b; font-weight: 600; margin-right: 8px;">Cihaz Toplamı:</span>
          <strong style="font-size: 13px; color: #0f172a; font-family: monospace; background-color: #f1f5f9; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
            ${formatCurrency(dev.deviceTotal || 0, proposal.currency)}
          </strong>
        </div>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${proposal.proposalNumber} - ${proposal.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f1f5f9; padding: 20px 0;">
    <tr>
      <td align="center" style="padding: 10px;">
        <table role="presentation" style="max-width: 640px; width: 100%; background-color: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
          
          <!-- Sleek Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; color: #ffffff;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="vertical-align: middle;">
                    ${company.logoUrl ? `
                      <img src="${company.logoUrl}" alt="Logo" style="max-height: 36px; max-width: 170px; object-fit: contain;" />
                    ` : `
                      <div style="font-size: 20px; font-weight: 900; color: #3b82f6; letter-spacing: 0.5px; text-transform: uppercase;">
                        ${company.logoText || company.name || 'TEKLİFPRO'}
                      </div>
                    `}
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                      ${company.title || company.name}
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="background-color: #1e293b; color: #38bdf8; padding: 6px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; font-weight: bold; border: 1px solid #334155;">
                      ${proposal.proposalNumber}
                    </div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-family: monospace;">
                      Tarih: ${formatDate(proposal.issueDate)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 32px;">
              
              <!-- Greeting & Note -->
              <div style="font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 24px; white-space: pre-line;">
                ${customMessage || `Sayın ${proposal.customer.name || proposal.customer.companyName},\n\nFirmanız için hazırladığımız "${proposal.title}" başlıklı teklifimiz bilgilerinize sunulmuştur.`}
              </div>

              <!-- Main Call To Action Card -->
              <div style="background-color: #0f172a; border-radius: 8px; padding: 22px; margin-bottom: 28px; text-align: center; color: #ffffff;">
                <div style="font-size: 10px; color: #93c5fd; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                  TEKLİF TOPLAM TUTARI (KDV DAHİL)
                </div>
                <div style="font-size: 26px; font-weight: 900; color: #34d399; font-family: monospace; margin-bottom: 18px;">
                  ${formatCurrency(proposal.grandTotal, proposal.currency)}
                </div>

                <!-- DIRECT CLICKABLE BUTTON -->
                <div style="margin-bottom: 14px;">
                  <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 800; font-size: 13px; padding: 12px 28px; text-decoration: none; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
                    Teklifi Çevrim İçi İncele & Onayla &rarr;
                  </a>
                </div>

                <!-- DIRECT CLICKABLE LINK URL -->
                <div style="background-color: #1e293b; border: 1px solid #334155; padding: 8px 12px; border-radius: 4px; font-size: 11px; word-break: break-all;">
                  <span style="color: #94a3b8; font-size: 10px; display: block; margin-bottom: 2px;">Tıklanabilir doğrudan erişim adresi:</span>
                  <a href="${portalUrl}" target="_blank" style="color: #60a5fa; font-family: monospace; font-weight: bold; text-decoration: underline;">
                    ${portalUrl}
                  </a>
                </div>

                <div style="font-size: 10px; color: #94a3b8; margin-top: 10px; font-family: monospace;">
                  Son Geçerlilik Tarihi: <strong style="color: #e2e8f0;">${formatDate(proposal.validUntilDate)}</strong>
                </div>
              </div>

              <!-- Customer Summary Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px; font-size: 11px;">
                <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px;">
                  Teklif Edilen Müşteri
                </div>
                <div style="font-size: 13px; font-weight: bold; color: #0f172a;">
                  ${proposal.customer.companyName || proposal.customer.name}
                </div>
                <div style="color: #475569; margin-top: 2px;">
                  Yetkili: <strong>${proposal.customer.name}</strong> | E-Posta: <strong style="font-family: monospace;">${proposal.customer.email}</strong>
                </div>
              </div>

              <!-- Devices Header -->
              <div style="border-bottom: 1.5px solid #0f172a; padding-bottom: 6px; margin-bottom: 16px;">
                <h3 style="margin: 0; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                  Hizmet ve Kalem Detayları (${devices.length} Hizmet Grubu)
                </h3>
              </div>

              ${devicesHtml}

              <!-- Terms & Notes -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <td style="width: 50%; vertical-align: top; padding-right: 6px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 11px;">
                      <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
                        Ödeme Şartları
                      </div>
                      <div style="color: #334155; font-family: monospace; font-size: 10px; line-height: 1.4; white-space: pre-line;">
                        ${proposal.paymentTerms || '%50 Peşin Siparişte, %50 Teslimat ve Onay Sonrasında'}
                      </div>
                    </div>
                  </td>
                  <td style="width: 50%; vertical-align: top; padding-left: 6px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 11px;">
                      <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
                        Teklif Notları
                      </div>
                      <div style="color: #334155; font-size: 10px; line-height: 1.4; white-space: pre-line;">
                        ${proposal.notes || 'Fiyatlarımıza tüm vergiler ve standart servis garantisi dahildir.'}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Company Contact Footer -->
              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5; text-align: center;">
                <strong style="color: #0f172a; font-size: 12px;">${company.name}</strong><br>
                ${company.address ? `${company.address}<br>` : ''}
                Tel: <strong>${company.phone || '-'}</strong> | E-Posta: <strong>${company.email || '-'}</strong> | Web: <a href="${company.website || '#'}" style="color: #2563eb; text-decoration: none;">${company.website || '-'}</a>
              </div>

            </td>
          </tr>

          <!-- Footer Legal -->
          <tr>
            <td style="background-color: #f8fafc; padding: 12px 32px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              Bu e-posta TEKLİFPRO Otomasyon Sistemi üzerinden otomatik oluşturulmuştur. © ${new Date().getFullYear()} ${company.name}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
