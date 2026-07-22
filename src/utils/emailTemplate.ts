import { Proposal, AppSettings } from '../types';
import { formatCurrency, formatDate } from './formatters';

export function generateProposalEmailHtml(
  proposal: Proposal,
  settings: AppSettings,
  customMessage?: string,
  hostOrigin: string = ''
): string {
  const portalUrl = `${hostOrigin}#/customer/teklif/${proposal.id}`;
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
    <div style="margin-bottom: 24px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <!-- Device Title Header -->
      <div style="background-color: #0f172a; padding: 12px 20px; color: #ffffff; display: table; width: 100%; box-sizing: border-box;">
        <div style="display: table-cell; vertical-align: middle;">
          <span style="background-color: #2563eb; color: #ffffff; font-family: monospace; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; margin-right: 10px;">
            CİHAZ #${idx + 1}
          </span>
          <span style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #f8fafc;">
            ${dev.modelCode ? `CİHAZ #${idx + 1} - ${dev.modelCode}` : `CİHAZ #${idx + 1}`}
          </span>
        </div>
      </div>

      <!-- Device Metadata Grid -->
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; color: #334155;">
        <tr>
          <td style="padding: 10px 16px; border-right: 1px solid #e2e8f0; width: 33%;">
            <span style="color: #64748b; font-size: 9px; font-weight: bold; display: block; text-transform: uppercase;">Fiş No</span>
            <strong style="color: #0f172a; font-size: 12px;">${dev.receiptNo || '-'}</strong>
          </td>
          <td style="padding: 10px 16px; border-right: 1px solid #e2e8f0; width: 33%;">
            <span style="color: #64748b; font-size: 9px; font-weight: bold; display: block; text-transform: uppercase;">Model Kodu</span>
            <strong style="color: #0f172a; font-size: 12px;">${dev.modelCode || '-'}</strong>
          </td>
          <td style="padding: 10px 16px; width: 34%;">
            <span style="color: #64748b; font-size: 9px; font-weight: bold; display: block; text-transform: uppercase;">Seri No</span>
            <strong style="color: #0f172a; font-size: 12px;">${dev.serialNo || '-'}</strong>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <div style="padding: 16px;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; width: 50px; text-align: center; border-right: 1px solid #e2e8f0;">Sıra</th>
              <th style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700;">Hizmet / İşlem Açıklaması</th>
              <th style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; width: 90px; font-weight: 700;">Miktar</th>
            </tr>
          </thead>
          <tbody>
            ${dev.items.map((item, iIdx) => `
              <tr style="background-color: ${iIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b; font-family: monospace; font-weight: 700; border-right: 1px solid #f1f5f9;">#${idx + 1}.${iIdx + 1}</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; line-height: 1.5; white-space: pre-line;">${item.description || 'Hizmet / Bakım Detayı'}</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #334155; font-family: monospace; font-weight: 700;">${item.quantity} ${item.unit || 'Adet'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Device Total Footer -->
        <div style="margin-top: 12px; text-align: right;">
          <div style="display: inline-block; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 16px; border-radius: 4px; font-size: 12px;">
            <span style="color: #475569; font-weight: bold; margin-right: 10px; font-size: 11px; text-transform: uppercase;">Cihaz Genel Toplamı:</span>
            <strong style="color: #1e3a8a; font-family: monospace; font-size: 14px; font-weight: 900;">${formatCurrency(dev.deviceTotal || 0, proposal.currency)}</strong>
          </div>
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
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 24px 0;">
    <tr>
      <td align="center" style="padding: 12px;">
        <table role="presentation" style="max-width: 680px; width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 36px; color: #ffffff;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="vertical-align: middle;">
                    ${company.logoUrl ? `
                      <div style="margin-bottom: 8px; max-height: 40px;">
                        <img src="${company.logoUrl}" alt="Logo" style="max-height: 40px; max-width: 185px; object-fit: contain;" />
                      </div>
                    ` : `
                      <div style="font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #3b82f6; text-transform: uppercase;">
                        ${company.logoText || 'TEKLİFPRO'}
                      </div>
                    `}
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; font-weight: 500;">
                      ${company.title || company.name}
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle; text-align: right;">
                    <div style="background-color: #1e293b; color: #38bdf8; padding: 8px 16px; border-radius: 6px; font-family: monospace; font-size: 13px; font-weight: bold; display: inline-block; border: 1px solid #334155; letter-spacing: 0.5px;">
                      ${proposal.proposalNumber}
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 6px; font-family: monospace;">
                      Tarih: ${formatDate(proposal.issueDate)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px;">
              
              <!-- Greeting & Message -->
              <h2 style="margin-top: 0; font-size: 18px; color: #0f172a; font-weight: 800; letter-spacing: -0.2px;">
                Sayın ${proposal.customer.name},
              </h2>
              
              <div style="font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 28px; white-space: pre-line;">
                ${customMessage || `Sayın ${proposal.customer.name},\n\nFirmanız (${proposal.customer.companyName || proposal.customer.name}) için hazırladığımız "${proposal.title}" başlıklı teklifimiz hazırlanmış olup detayları aşağıda ve online portalımızda bilgilerinize sunulmuştur.`}
              </div>

              <!-- Main Call To Action / Grand Total Card -->
              <div style="background-color: #0f172a; border-radius: 10px; padding: 24px; margin-bottom: 32px; text-align: center; color: #ffffff; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);">
                <div style="font-size: 11px; color: #60a5fa; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                  TEKLİF GENEL TOPLAMI
                </div>
                <div style="font-size: 30px; font-weight: 900; color: #34d399; font-family: monospace; margin-bottom: 20px; tracking: -0.5px;">
                  ${formatCurrency(proposal.grandTotal, proposal.currency)}
                </div>
                <div>
                  <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 800; font-size: 14px; padding: 14px 32px; text-decoration: none; border-radius: 6px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                    Teklifi Çevrim İçi İncele & Onayla &rarr;
                  </a>
                </div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 14px; font-family: monospace;">
                  Son Geçerlilik Tarihi: <strong style="color: #cbd5e1;">${formatDate(proposal.validUntilDate)}</strong>
                </div>
              </div>

              <!-- Customer Info Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px; font-size: 12px;">
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 8px;">
                  Müşteri / Firma Bilgileri
                </div>
                <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
                  ${proposal.customer.companyName || proposal.customer.name}
                </div>
                <div style="color: #475569; margin-bottom: 2px;">
                  <strong>Yetkili:</strong> ${proposal.customer.name}
                </div>
                <div style="color: #475569; font-family: monospace;">
                  <strong>E-Posta:</strong> ${proposal.customer.email} ${proposal.customer.phone ? `| <strong>Tel:</strong> ${proposal.customer.phone}` : ''}
                </div>
              </div>

              <!-- Devices & Items Section Title -->
              <div style="border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                  Teklif Kapsamındaki Cihazlar ve Hizmet Detayları (${devices.length} Cihaz)
                </h3>
              </div>

              ${devicesHtml}

              <!-- Terms & Notes Grid -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                <tr>
                  <td style="width: 50%; vertical-align: top; padding-right: 8px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 12px;">
                      <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
                        Ödeme Koşulları & Şartlar
                      </div>
                      <div style="color: #334155; font-family: monospace; font-size: 11px; line-height: 1.5; white-space: pre-line;">
                        ${proposal.paymentTerms || '%50 Peşin Siparişte, %50 Teslimat ve Onay Sonrasında'}
                      </div>
                    </div>
                  </td>
                  <td style="width: 50%; vertical-align: top; padding-left: 8px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 12px;">
                      <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
                        Teklif Notları & Sunuş
                      </div>
                      <div style="color: #334155; font-size: 11px; line-height: 1.5; white-space: pre-line;">
                        ${proposal.notes || 'Fiyatlarımıza sunucu kurulumu ve 1 yıllık teknik bakım desteği dahildir.'}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Company Footer -->
              <div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6; text-align: center;">
                <strong style="color: #0f172a; font-size: 13px;">${company.name}</strong><br>
                ${company.address ? `${company.address}<br>` : ''}
                Tel: <strong>${company.phone || '-'}</strong> | E-Posta: <strong>${company.email || '-'}</strong><br>
                Website: <a href="${company.website || '#'}" style="color: #2563eb; text-decoration: none;">${company.website || '-'}</a>
              </div>

            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 14px 36px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              Bu e-posta TEKLİFPRO Otomasyonu üzerinden güvenli olarak iletilmiştir. © ${new Date().getFullYear()} ${company.name}
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
