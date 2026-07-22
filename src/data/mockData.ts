import { Customer, Proposal, AppNotification } from '../types';

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Ahmet Yılmaz',
    companyName: 'Yılmaz Yazılım Teknolojileri A.Ş.',
    email: 'ahmet@yilmazyazilim.com',
    phone: '+90 (532) 111 22 33',
    address: 'Büyükdere Cad. No: 195, Levent, İstanbul',
    taxOffice: 'Zincirlikuyu',
    taxNumber: '9870123456'
  },
  {
    id: 'cust-2',
    name: 'Elif Kaya',
    companyName: 'Kaya Mimarlık & Tasarım Ltd. Şti.',
    email: 'elif@kayamimarlik.com',
    phone: '+90 (505) 999 88 77',
    address: 'Alsancak Mah. Atatürk Cad. No: 42, İzmir',
    taxOffice: 'Kordon',
    taxNumber: '4560987654'
  },
  {
    id: 'cust-3',
    name: 'Mehmet Demir',
    companyName: 'Demir Lojistik A.Ş.',
    email: 'mehmet.demir@demirlojistik.com',
    phone: '+90 (533) 444 55 66',
    address: 'Organize Sanayi Bölgesi 4. Cadde No: 12, Bursa',
    taxOffice: 'Nilüfer',
    taxNumber: '1234567890'
  }
];

export const initialProposals: Proposal[] = [
  {
    id: 'prop-101',
    proposalNumber: 'TEK-2026-001',
    title: 'Mobil Uygulama ve Web Portalı Geliştirme Projesi',
    customer: initialCustomers[0],
    issueDate: '2026-07-20',
    validUntilDate: '2026-08-03',
    currency: 'TRY',
    notes: 'Teklifimiz 14 gün geçerlidir. Fiyatlarımıza sunucu barındırma dahildir.',
    paymentTerms: '%40 Peşin, %30 Tasarım Onayında, %30 Proje Tesliminde',
    status: 'GONDERILDI',
    devices: [
      {
        id: 'dev-101-1',
        receiptNo: 'FIS-2026-88',
        modelCode: 'DELL-POWEREDGE-R750',
        serialNo: 'SN-99887711',
        items: [
          { id: 'item-101-1', description: 'Sunucu Ana Kart Tamiri ve Güç Modülü Değişimi', quantity: 1, unit: 'Adet' },
          { id: 'item-101-2', description: 'Termal Macun Yenileme, Fan Temizliği ve Yük Testi', quantity: 1, unit: 'Adet' }
        ],
        deviceTotal: 185000
      },
      {
        id: 'dev-101-2',
        receiptNo: 'FIS-2026-89',
        modelCode: 'CISCO-CATALYST-C9300',
        serialNo: 'SN-44332211',
        items: [
          { id: 'item-101-3', description: 'Anahtar Port Modülü Değişimi ve VLAN Yapılandırması', quantity: 1, unit: 'Adet' },
          { id: 'item-101-4', description: 'Firmware Güncellemesi ve Ağ Güvenlik Testleri', quantity: 1, unit: 'Adet' }
        ],
        deviceTotal: 187000
      }
    ],
    items: [
      {
        id: 'item-1',
        description: 'iOS ve Android Uygun Mobil Uygulama (React Native)',
        quantity: 1,
        unit: 'Proje',
        unitPrice: 180000,
        taxRate: 20,
        discountPercent: 5,
        total: 205200
      },
      {
        id: 'item-2',
        description: 'Yönetim Paneli (Admin Dashboard) ve REST API',
        quantity: 1,
        unit: 'Proje',
        unitPrice: 85000,
        taxRate: 20,
        discountPercent: 0,
        total: 102000
      },
      {
        id: 'item-3',
        description: '1 Yıllık Bakım ve Teknik Destek Hizmeti',
        quantity: 12,
        unit: 'Ay',
        unitPrice: 5000,
        taxRate: 20,
        discountPercent: 10,
        total: 64800
      }
    ],
    subtotal: 311000,
    totalDiscount: 15000,
    totalTax: 61200,
    grandTotal: 372000,
    createdAt: '2026-07-20T10:30:00.000Z',
    updatedAt: '2026-07-20T11:15:00.000Z',
    sentAt: '2026-07-20T11:15:00.000Z',
    history: [
      {
        id: 'log-1',
        date: '2026-07-20 10:30',
        action: 'Oluşturuldu',
        description: 'Teklif taslağı hazırlandı.',
        actor: 'Sistem Yöneticisi'
      },
      {
        id: 'log-2',
        date: '2026-07-20 11:15',
        action: 'E-posta Gönderildi',
        description: 'Teklif ahmet@yilmazyazilim.com adresine e-posta ile iletildi.',
        actor: 'Sistem Yöneticisi'
      }
    ]
  },
  {
    id: 'prop-102',
    proposalNumber: 'TEK-2026-002',
    title: 'Kurumsal Kimlik ve Web Sitesi Yenileme',
    customer: initialCustomers[1],
    issueDate: '2026-07-18',
    validUntilDate: '2026-08-01',
    currency: 'TRY',
    notes: 'Tüm grafik kaynak dosyaları ve logo varyasyonları teslim edilecektir.',
    paymentTerms: '%50 Siparişte, %50 Teslimatta',
    status: 'ONAYLANDI',
    items: [
      {
        id: 'item-10',
        description: 'Kurumsal Logo ve Vektörel Tasarım Paketi',
        quantity: 1,
        unit: 'Paket',
        unitPrice: 25000,
        taxRate: 20,
        discountPercent: 0,
        total: 30000
      },
      {
        id: 'item-11',
        description: 'Responsive Web Sitesi (Next.js & Tailwind)',
        quantity: 1,
        unit: 'Proje',
        unitPrice: 60000,
        taxRate: 20,
        discountPercent: 0,
        total: 72000
      }
    ],
    subtotal: 85000,
    totalDiscount: 0,
    totalTax: 17000,
    grandTotal: 102000,
    createdAt: '2026-07-18T09:00:00.000Z',
    updatedAt: '2026-07-19T14:20:00.000Z',
    sentAt: '2026-07-18T09:30:00.000Z',
    viewedAt: '2026-07-19T10:11:00.000Z',
    respondedAt: '2026-07-19T14:20:00.000Z',
    customerResponseNote: 'Teklif şartlarını ve teslim sürelerini uygun bulduk. Projeyi başlatabilirsiniz.',
    history: [
      {
        id: 'log-10',
        date: '2026-07-18 09:00',
        action: 'Oluşturuldu',
        description: 'Teklif hazırlandı.',
        actor: 'Sistem Yöneticisi'
      },
      {
        id: 'log-11',
        date: '2026-07-18 09:30',
        action: 'E-posta Gönderildi',
        description: 'Teklif elif@kayamimarlik.com adresine e-posta ile gönderildi.',
        actor: 'Sistem Yöneticisi'
      },
      {
        id: 'log-12',
        date: '2026-07-19 10:11',
        action: 'Görüntülendi',
        description: 'Müşteri teklifi bağlantı üzerinden inceledi.',
        actor: 'Müşteri (Elif Kaya)'
      },
      {
        id: 'log-13',
        date: '2026-07-19 14:20',
        action: 'Onaylandı',
        description: 'Müşteri teklifi onayladı. Not: Teklif şartlarını ve teslim sürelerini uygun bulduk.',
        actor: 'Müşteri (Elif Kaya)'
      }
    ]
  },
  {
    id: 'prop-103',
    proposalNumber: 'TEK-2026-003',
    title: 'ERP / Depo Otomasyonu Danışmanlık Hizmeti',
    customer: initialCustomers[2],
    issueDate: '2026-07-15',
    validUntilDate: '2026-07-29',
    currency: 'USD',
    notes: 'Saha incelemeleri ve eğitim günleri fiyatlandırmaya dahildir.',
    paymentTerms: 'Aylık hakediş faturalandırması',
    status: 'REDDEDILDI',
    items: [
      {
        id: 'item-20',
        description: 'Saha Süreç Analizi ve ERP Entegrasyonu',
        quantity: 40,
        unit: 'Saat',
        unitPrice: 100,
        taxRate: 20,
        discountPercent: 10,
        total: 4320
      }
    ],
    subtotal: 4000,
    totalDiscount: 400,
    totalTax: 720,
    grandTotal: 4320,
    createdAt: '2026-07-15T14:00:00.000Z',
    updatedAt: '2026-07-17T16:45:00.000Z',
    sentAt: '2026-07-15T14:30:00.000Z',
    viewedAt: '2026-07-16T08:22:00.000Z',
    respondedAt: '2026-07-17T16:45:00.000Z',
    rejectionReason: 'Bütçe sınırlamalarımız nedeniyle projeyi bu çeyrekte ertelemek durumunda kaldık.',
    history: [
      {
        id: 'log-20',
        date: '2026-07-15 14:00',
        action: 'Oluşturuldu',
        description: 'Teklif taslağı oluşturuldu.',
        actor: 'Sistem Yöneticisi'
      },
      {
        id: 'log-21',
        date: '2026-07-15 14:30',
        action: 'E-posta Gönderildi',
        description: 'Teklif mehmet.demir@demirlojistik.com adresine e-posta ile gönderildi.',
        actor: 'Sistem Yöneticisi'
      },
      {
        id: 'log-22',
        date: '2026-07-17 16:45',
        action: 'Reddedildi',
        description: 'Müşteri teklifi reddetti. Nedeni: Bütçe sınırlamaları nedeniyle ertelendi.',
        actor: 'Müşteri (Mehmet Demir)'
      }
    ]
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    proposalId: 'prop-102',
    proposalNumber: 'TEK-2026-002',
    customerName: 'Kaya Mimarlık & Tasarım Ltd. Şti.',
    type: 'ONAY',
    title: '🎉 Teklif Onaylandı!',
    message: 'Kaya Mimarlık firması TEK-2026-002 numaralı teklifi onayladı.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    isRead: false,
    amount: 102000,
    currency: 'TRY',
    customerNote: 'Teklif şartlarını ve teslim sürelerini uygun bulduk.'
  },
  {
    id: 'notif-2',
    proposalId: 'prop-103',
    proposalNumber: 'TEK-2026-003',
    customerName: 'Demir Lojistik A.Ş.',
    type: 'RET',
    title: '⚠️ Teklif Reddedildi',
    message: 'Demir Lojistik A.Ş. TEK-2026-003 numaralı teklifi reddetti.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
    amount: 4320,
    currency: 'USD',
    customerNote: 'Bütçe sınırlamalarımız nedeniyle ertelemek durumunda kaldık.'
  }
];
