import React, { useState, useEffect } from 'react';
import { Proposal, ProposalDevice, DeviceItem, ProposalItem, Customer, AppSettings } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Save, 
  Send, 
  ArrowLeft, 
  UserPlus, 
  Building2, 
  DollarSign, 
  Calendar, 
  Calculator,
  Laptop,
  Layers,
  Wrench
} from 'lucide-react';

interface ProposalFormProps {
  initialProposal?: Proposal | null;
  customers: Customer[];
  settings?: AppSettings;
  onSave: (proposalData: Partial<Proposal>, sendEmailAfter?: boolean) => void;
  onCancel: () => void;
  onAddNewCustomer: (customer: Customer) => void;
  onGenerateAiText: (title: string, customerName: string, itemsSummary: string) => Promise<string>;
}

export const ProposalForm: React.FC<ProposalFormProps> = ({
  initialProposal,
  customers,
  settings,
  onSave,
  onCancel,
  onAddNewCustomer,
  onGenerateAiText
}) => {
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialProposal?.customer?.id || customers[0]?.id || ''
  );

  const [currency, setCurrency] = useState<'TRY' | 'USD' | 'EUR' | 'GBP'>(
    initialProposal?.currency || settings?.proposalDefaults.currency || 'TRY'
  );
  const [issueDate, setIssueDate] = useState<string>(
    initialProposal?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [validDays, setValidDays] = useState<number>(
    settings?.proposalDefaults.validDays || 14
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialProposal?.paymentTerms || settings?.proposalDefaults.paymentTerms || '%50 Peşin Siparişte, %50 Teslimat ve Onay Sonrasında'
  );
  const [notes, setNotes] = useState<string>(
    initialProposal?.notes || settings?.proposalDefaults.notes || 'Fiyatlarımıza sunucu kurulumu ve 1 yıllık teknik bakım desteği dahildir.'
  );

  // Initialize Devices State
  const [devices, setDevices] = useState<ProposalDevice[]>(() => {
    if (initialProposal?.devices && initialProposal.devices.length > 0) {
      return initialProposal.devices;
    }
    if (initialProposal) {
      return [
        {
          id: `dev-${Date.now()}`,
          receiptNo: initialProposal.receiptNo || '',
          modelCode: initialProposal.modelCode || '',
          serialNo: initialProposal.serialNo || '',
          items: initialProposal.items?.map(i => ({
            id: i.id,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit
          })) || [
            { id: 'item-1', description: 'Servis, Bakım ve Onarım Hizmeti', quantity: 1, unit: 'Adet' }
          ],
          deviceTotal: initialProposal.grandTotal || initialProposal.subtotal || 0
        }
      ];
    }
    return [
      {
        id: `dev-${Date.now()}`,
        receiptNo: '',
        modelCode: '',
        serialNo: '',
        items: [
          { id: `item-1`, description: 'Servis, Bakım ve Onarım Hizmeti', quantity: 1, unit: 'Adet' }
        ],
        deviceTotal: 0,
        deviceNote: ''
      }
    ];
  });

  // Calculate sum of device totals
  const calculatedGrandTotal = devices.reduce((sum, dev) => sum + (Number(dev.deviceTotal) || 0), 0);

  // Sync state whenever initialProposal changes
  useEffect(() => {
    if (initialProposal) {
      if (initialProposal.customer?.id) {
        setSelectedCustomerId(initialProposal.customer.id);
      }
      if (initialProposal.currency) {
        setCurrency(initialProposal.currency);
      }
      if (initialProposal.issueDate) {
        setIssueDate(initialProposal.issueDate);
      }
      if (initialProposal.paymentTerms !== undefined) {
        setPaymentTerms(initialProposal.paymentTerms);
      }
      if (initialProposal.notes !== undefined) {
        setNotes(initialProposal.notes);
      }
      if (initialProposal.devices && initialProposal.devices.length > 0) {
        setDevices(initialProposal.devices);
      } else if (initialProposal) {
        setDevices([
          {
            id: `dev-${Date.now()}`,
            receiptNo: initialProposal.receiptNo || '',
            modelCode: initialProposal.modelCode || '',
            serialNo: initialProposal.serialNo || '',
            items: initialProposal.items?.map(i => ({
              id: i.id,
              description: i.description,
              quantity: i.quantity,
              unit: i.unit
            })) || [
              { id: 'item-1', description: 'Servis, Bakım ve Onarım Hizmeti', quantity: 1, unit: 'Adet' }
            ],
            deviceTotal: initialProposal.grandTotal || initialProposal.subtotal || 0
          }
        ]);
      }
    }
  }, [initialProposal]);

  const effectiveGrandTotal = calculatedGrandTotal;

  // New Customer Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // AI Loading State
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Device Helper Functions
  const addDevice = () => {
    setDevices(prev => [
      ...prev,
      {
        id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        receiptNo: '',
        modelCode: '',
        serialNo: '',
        items: [
          { id: `item-${Date.now()}`, description: 'Servis ve Bakım Hizmeti', quantity: 1, unit: 'Adet' }
        ],
        deviceTotal: 0,
        deviceNote: settings?.proposalDefaults?.deviceDefaultNote || ''
      }
    ]);
  };

  const removeDevice = (index: number) => {
    if (devices.length === 1) return;
    setDevices(prev => prev.filter((_, i) => i !== index));
  };

  const updateDeviceField = (devIndex: number, field: keyof ProposalDevice, value: any) => {
    setDevices(prev => {
      const updated = [...prev];
      updated[devIndex] = { ...updated[devIndex], [field]: value };
      return updated;
    });
  };

  const addDeviceItem = (devIndex: number) => {
    setDevices(prev => {
      const updated = [...prev];
      const dev = { ...updated[devIndex] };
      dev.items = [
        ...dev.items,
        { id: `item-${Date.now()}`, description: '', quantity: 1, unit: 'Adet' }
      ];
      updated[devIndex] = dev;
      return updated;
    });
  };

  const updateDeviceItem = (devIndex: number, itemIndex: number, field: keyof DeviceItem, value: any) => {
    setDevices(prev => {
      const updated = [...prev];
      const dev = { ...updated[devIndex] };
      const items = [...dev.items];
      items[itemIndex] = { ...items[itemIndex], [field]: value };
      dev.items = items;
      updated[devIndex] = dev;
      return updated;
    });
  };

  const removeDeviceItem = (devIndex: number, itemIndex: number) => {
    setDevices(prev => {
      const updated = [...prev];
      const dev = { ...updated[devIndex] };
      if (dev.items.length === 1) return prev;
      dev.items = dev.items.filter((_, i) => i !== itemIndex);
      updated[devIndex] = dev;
      return updated;
    });
  };

  // Selected customer object
  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const handleSaveCustomer = () => {
    if (!newCustName || !newCustEmail) return;
    const created: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      companyName: newCustCompany || newCustName,
      email: newCustEmail,
      phone: newCustPhone,
      address: newCustAddress
    };
    onAddNewCustomer(created);
    setSelectedCustomerId(created.id);
    setShowCustomerModal(false);
    setNewCustName('');
    setNewCustCompany('');
    setNewCustEmail('');
  };

  const handleAiGenerate = async () => {
    setIsGeneratingAi(true);
    const allDescriptions = devices.flatMap(d => d.items.map(i => i.description)).filter(Boolean).join(', ');
    const searchTitle = devices.map(d => [d.receiptNo, d.modelCode, d.serialNo].filter(Boolean).join(' ')).filter(Boolean).join(' | ') || 'Cihaz Servis Hizmeti';
    const aiText = await onGenerateAiText(searchTitle, currentCustomer?.companyName || currentCustomer?.name, allDescriptions);
    setNotes(aiText);
    setIsGeneratingAi(false);
  };

  const calculateValidUntil = () => {
    const date = new Date(issueDate);
    date.setDate(date.getDate() + validDays);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = (sendEmail: boolean) => {
    // Generate primary proposal title
    let derivedTitle = '';
    if (devices.length === 1) {
      const d = devices[0];
      derivedTitle = [
        d.receiptNo ? `Fiş: ${d.receiptNo}` : '',
        d.modelCode ? `Model: ${d.modelCode}` : '',
        d.serialNo ? `Seri: ${d.serialNo}` : ''
      ].filter(Boolean).join(' | ') || initialProposal?.title || 'Cihaz Servis Teklifi';
    } else {
      derivedTitle = `${devices.length} Cihaz Servis & Bakım Teklifi`;
    }

    // Flat items for backward compatibility
    const flatProposalItems: ProposalItem[] = devices.flatMap((dev, devIdx) => 
      dev.items.map(item => ({
        id: item.id || `item-${Date.now()}`,
        description: devices.length > 1 && dev.modelCode ? `[Cihaz ${devIdx + 1} - ${dev.modelCode}] ${item.description}` : item.description,
        quantity: item.quantity,
        unit: item.unit || 'Adet',
        unitPrice: 0,
        taxRate: 0,
        discountPercent: 0,
        total: 0
      }))
    );

    const firstDev: Partial<ProposalDevice> = devices[0] || {};

    const proposalData: Partial<Proposal> = {
      title: derivedTitle,
      receiptNo: firstDev.receiptNo || '',
      modelCode: firstDev.modelCode || '',
      serialNo: firstDev.serialNo || '',
      devices,
      customer: currentCustomer,
      currency,
      issueDate,
      validUntilDate: calculateValidUntil(),
      items: flatProposalItems,
      subtotal: effectiveGrandTotal,
      totalDiscount: 0,
      totalTax: 0,
      grandTotal: effectiveGrandTotal,
      notes,
      paymentTerms,
      status: initialProposal?.status || 'TASLAK'
    };

    onSave(proposalData, sendEmail);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-sm text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              {initialProposal ? 'Teklifi Düzenle' : 'Yeni Teklif Oluştur'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cihazların fiş no, model, seri numaraları ve hizmet detaylarını girerek teklifinizi hazırlayın.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit(false)}
            className="px-4 py-2.5 rounded-sm bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors flex items-center gap-2 border border-slate-300 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Taslak Kaydet</span>
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="px-4 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs border border-blue-500 shadow-xs transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Kaydet & Gönder</span>
          </button>
        </div>
      </div>

      {/* Customer & Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Customer Select */}
        <div className="md:col-span-2 bg-white p-5 rounded-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Müşteri / Firma Seçimi</span>
            </label>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Yeni Müşteri Ekle</span>
            </button>
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} ({c.name} - {c.email})
              </option>
            ))}
          </select>

          {currentCustomer && (
            <div className="p-3 rounded-sm bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{currentCustomer.companyName}</div>
              <div className="text-slate-500">Yetkili: {currentCustomer.name} • Tel: {currentCustomer.phone}</div>
              <div className="text-slate-500 font-mono">E-posta: {currentCustomer.email}</div>
            </div>
          )}
        </div>

        {/* Currency & Dates */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Para Birimi</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold text-slate-900"
            >
              <option value="TRY">Türk Lirası (₺)</option>
              <option value="USD">Amerikan Doları ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">İngiliz Sterlini (£)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Teklif Tarihi & Süresi</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-sm text-xs text-slate-900 font-mono"
              />
              <select
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                className="p-2 bg-slate-50 border border-slate-300 rounded-sm text-xs text-slate-900 font-semibold"
              >
                <option value={7}>7 Gün Geçerli</option>
                <option value={14}>14 Gün Geçerli</option>
                <option value={30}>30 Gün Geçerli</option>
                <option value={60}>60 Gün Geçerli</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              Son Geçerlilik: {calculateValidUntil()}
            </p>
          </div>
        </div>

      </div>

      {/* MULTI-DEVICE SECTION */}
      <div className="space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-600" />
              <span>Cihazlar ve Hizmet Detayları ({devices.length} Cihaz)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Her cihaz için fiş no, model kodu, seri no, hizmet açıklamaları ve özel toplam tutarını belirleyin.
            </p>
          </div>

          <button
            type="button"
            onClick={addDevice}
            className="px-3.5 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Cihaz Ekle</span>
          </button>
        </div>

        {/* Device Cards */}
        {devices.map((device, devIdx) => (
          <div 
            key={device.id} 
            className="bg-white rounded-sm border border-slate-300 shadow-2xs overflow-hidden space-y-4"
          >
            
            {/* Card Header */}
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-sm bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                  {devIdx + 1}
                </span>
                <span className="font-bold text-sm text-slate-900">
                  {device.modelCode ? `Cihaz: ${device.modelCode}` : `Cihaz #${devIdx + 1}`}
                </span>
              </div>

              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDevice(devIdx)}
                  className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-sm border border-rose-200 font-semibold flex items-center gap-1 transition-colors"
                  title="Bu cihazı tekliften kaldır"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cihazı Sil</span>
                </button>
              )}
            </div>

            <div className="p-5 space-y-5">
              
              {/* Device Metadata Inputs: FİŞ NO, MODEL KODU, SERİ NO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-sm border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    FİŞ NO
                  </label>
                  <input
                    type="text"
                    value={device.receiptNo || ''}
                    onChange={(e) => updateDeviceField(devIdx, 'receiptNo', e.target.value)}
                    placeholder="Örn: FİŞ-10492"
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    MODEL KODU
                  </label>
                  <input
                    type="text"
                    value={device.modelCode || ''}
                    onChange={(e) => updateDeviceField(devIdx, 'modelCode', e.target.value)}
                    placeholder="Örn: MD-2024-X"
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    SERİ NO
                  </label>
                  <input
                    type="text"
                    value={device.serialNo || ''}
                    onChange={(e) => updateDeviceField(devIdx, 'serialNo', e.target.value)}
                    placeholder="Örn: SN-8839201"
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Service & Product Items for this Device */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hizmet ve Ürün Açıklaması</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => addDeviceItem(devIdx)}
                    className="px-2.5 py-1 rounded-sm bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Kalem Ekle
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Hizmet / Ürün Açıklaması</th>
                        <th className="py-2 px-3 w-28 text-center">Miktar</th>
                        <th className="py-2 px-2 w-12 text-center">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {device.items.map((item, itemIdx) => (
                        <tr key={item.id || itemIdx} className="hover:bg-slate-50/50">
                          
                          {/* Description */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateDeviceItem(devIdx, itemIdx, 'description', e.target.value)}
                              placeholder="Cihaz için yapılan hizmet veya parça açıklamasını girin..."
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold text-slate-900"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateDeviceItem(devIdx, itemIdx, 'quantity', Number(e.target.value))}
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-sm text-xs font-mono font-bold text-center text-slate-900"
                            />
                          </td>

                          {/* Delete Item */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeDeviceItem(devIdx, itemIdx)}
                              disabled={device.items.length === 1}
                              className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-sm hover:bg-rose-50"
                              title="Kalemi Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Device Proposal Note Section */}
              <div className="pt-3 border-t border-slate-250">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-650 block mb-1">
                  CİHAZ TEKLİF NOTU (Bu cihaza özel not veya açıklama)
                </label>
                <textarea
                  rows={2}
                  value={device.deviceNote || ''}
                  onChange={(e) => updateDeviceField(devIdx, 'deviceNote', e.target.value)}
                  placeholder="Örn: Cihaz yedek parçaları 1 yıl garantilidir. Teslim süresi 3 iş günüdür."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Device Total Section (Cihaz Genel Toplamı) */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <div className="bg-slate-50 p-3 rounded-sm border border-slate-200 flex items-center gap-3">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 shrink-0">
                    Cihaz Genel Toplamı:
                  </label>
                  <div className="flex items-center gap-1.5 w-40">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={device.deviceTotal || 0}
                      onChange={(e) => updateDeviceField(devIdx, 'deviceTotal', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full p-2 bg-white border border-blue-500 rounded-sm text-sm font-mono font-extrabold text-blue-700 focus:ring-2 focus:ring-blue-500/20 text-right"
                    />
                    <span className="font-bold text-slate-700 font-mono text-sm shrink-0">
                      {currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}

        {/* OVERALL PROPOSAL GRAND TOTAL */}
        <div className="bg-white p-5 rounded-sm border border-slate-300 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Teklif Genel Toplamı
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {devices.length > 1 
                  ? `${devices.length} adet cihazın genel toplamlarının toplamıdır.` 
                  : 'Yukarıda girdiğiniz cihaz genel toplam tutarıdır.'}
              </p>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-sm border border-slate-800 flex items-center gap-4 shadow-sm w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">GENEL TOPLAM:</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-black text-emerald-400">
                  {formatCurrency(effectiveGrandTotal, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Payment Terms & AI Text Generator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Payment Terms */}
        <div className="bg-white p-5 rounded-sm border border-slate-200 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Ödeme Koşulları & Şartlar
          </label>
          <textarea
            rows={4}
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-sm text-xs text-slate-900 leading-relaxed font-mono"
          />
        </div>

      </div>

      {/* New Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Yeni Müşteri Ekle</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Yetkili Adı Soyadı *</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-sm font-semibold"
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Firma Unvanı *</label>
                <input
                  type="text"
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-sm font-semibold"
                  placeholder="Yılmaz A.Ş."
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">E-Posta Adresi *</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-sm font-mono"
                  placeholder="ahmet@firma.com"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Telefon</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-sm"
                  placeholder="+90 532 000 00 00"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Adres</label>
                <textarea
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-sm"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="px-4 py-2 rounded-sm text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="px-4 py-2 rounded-sm text-xs font-semibold bg-blue-600 text-white border border-blue-500"
              >
                Müşteriyi Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
