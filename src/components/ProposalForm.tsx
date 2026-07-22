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
  Wrench,
  FileText,
  Tag,
  Hash,
  ShieldCheck,
  FileEdit,
  User,
  Clock
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
      if (initialProposal.devices && initialProposal.devices.length > 0) {
        setDevices(initialProposal.devices);
      }
    }
  }, [initialProposal]);

  // Modal State for Adding New Customer
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustCompanyName, setNewCustCompanyName] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Device List Manipulation Helpers
  const addDevice = () => {
    setDevices([
      ...devices,
      {
        id: `dev-${Date.now()}`,
        receiptNo: '',
        modelCode: '',
        serialNo: '',
        items: [
          { id: `item-${Date.now()}`, description: 'Servis, Bakım ve Onarım Hizmeti', quantity: 1, unit: 'Adet' }
        ],
        deviceTotal: 0,
        deviceNote: ''
      }
    ]);
  };

  const removeDevice = (deviceIndex: number) => {
    if (devices.length === 1) return;
    setDevices(devices.filter((_, idx) => idx !== deviceIndex));
  };

  const updateDeviceField = (deviceIndex: number, field: keyof ProposalDevice, value: any) => {
    const updated = [...devices];
    updated[deviceIndex] = { ...updated[deviceIndex], [field]: value };
    setDevices(updated);
  };

  const addDeviceItem = (deviceIndex: number) => {
    const updated = [...devices];
    const targetDev = updated[deviceIndex];
    targetDev.items = [
      ...targetDev.items,
      { id: `item-${Date.now()}`, description: '', quantity: 1, unit: 'Adet' }
    ];
    setDevices(updated);
  };

  const removeDeviceItem = (deviceIndex: number, itemIndex: number) => {
    const updated = [...devices];
    const targetDev = updated[deviceIndex];
    if (targetDev.items.length === 1) return;
    targetDev.items = targetDev.items.filter((_, idx) => idx !== itemIndex);
    setDevices(updated);
  };

  const updateDeviceItem = (
    deviceIndex: number, 
    itemIndex: number, 
    field: keyof DeviceItem, 
    value: any
  ) => {
    const updated = [...devices];
    const targetDev = updated[deviceIndex];
    const itemsCopy = [...targetDev.items];
    itemsCopy[itemIndex] = { ...itemsCopy[itemIndex], [field]: value };
    targetDev.items = itemsCopy;
    setDevices(updated);
  };

  // Valid Until Date calculation helper
  const calculateValidUntil = () => {
    const date = new Date(issueDate);
    date.setDate(date.getDate() + Number(validDays));
    return date.toISOString().split('T')[0];
  };

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail || !newCustCompanyName) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      companyName: newCustCompanyName,
      name: newCustName,
      email: newCustEmail,
      phone: newCustPhone,
      address: newCustAddress
    };

    onAddNewCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setShowCustomerModal(false);

    // Reset Modal
    setNewCustCompanyName('');
    setNewCustName('');
    setNewCustEmail('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  const effectiveGrandTotal = calculatedGrandTotal;

  // Form Submission Helper
  const handleSubmit = (sendEmail = false) => {
    if (!selectedCustomerId) {
      alert('Lütfen bir müşteri seçin veya yeni bir müşteri ekleyin.');
      return;
    }

    const firstDevice = devices[0] || { receiptNo: '', modelCode: '', serialNo: '' };
    const flatProposalItems: ProposalItem[] = [];

    devices.forEach((dev, dIdx) => {
      dev.items.forEach((item, iIdx) => {
        flatProposalItems.push({
          id: item.id || `item-${dIdx}-${iIdx}`,
          description: item.description,
          quantity: item.quantity,
          unitPrice: dev.deviceTotal || 0,
          taxRate: 0,
          discountPercent: 0,
          total: dev.deviceTotal || 0,
          unit: item.unit || 'Adet'
        });
      });
    });

    const proposalTitle = devices
      .map(d => d.modelCode ? `Cihaz Servis Teklifi (${d.modelCode})` : 'Teknik Servis ve Onarım Hizmeti')
      .join(' / ');

    const proposalData: Partial<Proposal> = {
      title: proposalTitle,
      proposalNumber: initialProposal?.proposalNumber || `TKL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      receiptNo: firstDevice.receiptNo || '',
      modelCode: firstDevice.modelCode || '',
      serialNo: firstDevice.serialNo || '',
      devices: devices,
      customer: currentCustomer!,
      currency,
      issueDate,
      validUntilDate: calculateValidUntil(),
      items: flatProposalItems,
      subtotal: effectiveGrandTotal,
      totalDiscount: 0,
      totalTax: 0,
      grandTotal: effectiveGrandTotal,
      paymentTerms,
      status: initialProposal?.status || 'TASLAK'
    };

    onSave(proposalData, sendEmail);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto antialiased">
      
      {/* ------------------------------------------------------------- */}
      {/* Top Header Card (Vibrant Royal Theme)                         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <span>{initialProposal ? 'Teklifi Düzenle' : 'Yeni Teklif Oluştur'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cihazların fiş no, model, seri numaraları ve hizmet detaylarını girerek teklifinizi hazırlayın.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit(false)}
            className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-2 border border-slate-300 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>Taslak Kaydet</span>
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border border-blue-500 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Kaydet & Gönder</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Customer & General Settings Grid                              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Customer Selection Card */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <span>Müşteri / Firma Seçimi</span>
            </label>
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Yeni Müşteri Ekle</span>
            </button>
          </div>

          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.name} - {c.email})
                </option>
              ))}
            </select>
          </div>

          {currentCustomer && (
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                <span>{currentCustomer.companyName}</span>
              </div>
              <div className="text-slate-600">Yetkili Alıcı: <strong>{currentCustomer.name}</strong> • Tel: {currentCustomer.phone}</div>
              <div className="text-slate-600 font-mono">E-posta: {currentCustomer.email}</div>
            </div>
          )}
        </div>

        {/* Currency & Validity Settings Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <span>Para Birimi</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="TRY">Türk Lirası (₺)</option>
              <option value="USD">Amerikan Doları ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">İngiliz Sterlini (£)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <span>Teklif Tarihi & Süresi</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
              <select
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
              >
                <option value={7}>7 Gün Geçerli</option>
                <option value={14}>14 Gün Geçerli</option>
                <option value={30}>30 Gün Geçerli</option>
                <option value={60}>60 Gün Geçerli</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Son Geçerlilik: <strong>{calculateValidUntil()}</strong></span>
            </p>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MULTI-DEVICE SECTION & CARDS                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md border border-purple-100">
                <Laptop className="w-4 h-4 text-purple-600" />
              </div>
              <span>Cihazlar ve Hizmet Detayları ({devices.length} Cihaz)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Her cihaz için fiş no, model kodu, seri no, hizmet açıklamaları ve özel toplam tutarını belirleyin.
            </p>
          </div>

          <button
            type="button"
            onClick={addDevice}
            className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Cihaz Ekle</span>
          </button>
        </div>

        {/* Device Cards Loop */}
        {devices.map((device, devIdx) => (
          <div 
            key={device.id} 
            className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden space-y-4"
          >
            
            {/* Card Header (Rich Navy Header) */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-xs shadow-xs">
                  {devIdx + 1}
                </span>
                <span className="font-bold text-sm text-white tracking-wide">
                  {device.modelCode ? `Cihaz: ${device.modelCode}` : `Cihaz #${devIdx + 1}`}
                </span>
              </div>

              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDevice(devIdx)}
                  className="px-2.5 py-1 text-xs text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 rounded-lg border border-rose-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Bu cihazı tekliften kaldır"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cihazı Sil</span>
                </button>
              )}
            </div>

            <div className="p-5 space-y-5">
              
              {/* Device Metadata Inputs: FİŞ NO, MODEL KODU, SERİ NO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>FİŞ NO</span>
                  </label>
                  <input
                    type="text"
                    value={device.receiptNo || ''}
                    onChange={(e) => updateDeviceField(devIdx, 'receiptNo', e.target.value)}
                    placeholder="Örn: FİŞ-10492"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>MODEL KODU</span>
                  </label>
                  <input
                    type="text"
                    value={device.modelCode || ''}
                    onChange={(e) => updateDeviceField(devIdx, 'modelCode', e.target.value)}
                    placeholder="Örn: MD-2024-X"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
                    <Hash className="w-3.5 h-3.5 text-purple-600" />
                    <span>SERİ NO</span>
                  </label>
                  <input
                    type="text"
                    value={device.serialNo || ''}
                    onChange={(e) => updateDeviceField(devIdx, 'serialNo', e.target.value)}
                    placeholder="Örn: SN-8839201"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Service & Product Items for this Device */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span>Hizmet ve Ürün Açıklaması</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => addDeviceItem(devIdx)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Kalem Ekle
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Hizmet / Ürün Açıklaması</th>
                        <th className="py-2.5 px-3 w-28 text-center">Miktar</th>
                        <th className="py-2.5 px-2 w-12 text-center">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {device.items.map((item, itemIdx) => (
                        <tr key={item.id || itemIdx} className="hover:bg-slate-50/70">
                          
                          {/* Description */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateDeviceItem(devIdx, itemIdx, 'description', e.target.value)}
                              placeholder="Cihaz için yapılan hizmet veya parça açıklamasını girin..."
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateDeviceItem(devIdx, itemIdx, 'quantity', Number(e.target.value))}
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-slate-900 focus:bg-white focus:border-blue-600"
                            />
                          </td>

                          {/* Delete Item */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeDeviceItem(devIdx, itemIdx)}
                              disabled={device.items.length === 1}
                              className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg hover:bg-rose-50 cursor-pointer"
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
              <div className="pt-3 border-t border-slate-200">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                  <span>CİHAZ TEKLİF NOTU (Bu cihaza özel açıklama)</span>
                </label>
                <textarea
                  rows={2}
                  value={device.deviceNote || ''}
                  onChange={(e) => updateDeviceField(devIdx, 'deviceNote', e.target.value)}
                  placeholder="Örn: Cihaz yedek parçaları 1 yıl garantilidir. Teslim süresi 3 iş günüdür."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Device Total Section (Cihaz Genel Toplamı) */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200 flex items-center gap-3">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800 shrink-0">
                    Cihaz Genel Toplamı:
                  </label>
                  <div className="flex items-center gap-1.5 w-44">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={device.deviceTotal || 0}
                      onChange={(e) => updateDeviceField(devIdx, 'deviceTotal', Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full p-2 bg-white border border-blue-500 rounded-lg text-sm font-mono font-black text-blue-700 focus:outline-none text-right shadow-2xs"
                    />
                    <span className="font-bold text-blue-800 font-mono text-sm shrink-0">
                      {currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}

        {/* OVERALL PROPOSAL GRAND TOTAL BANNER */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 rounded-xl border border-blue-800 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Teklif Genel Toplamı</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {devices.length > 1 
                  ? `${devices.length} adet cihazın genel toplamlarının birleşik tutarıdır.` 
                  : 'Yukarıda girdiğiniz cihaz genel toplam tutarıdır.'}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-blue-700/60 p-4 rounded-xl flex items-center gap-4 shadow-sm w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">GENEL TOPLAM:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-black text-emerald-400">
                  {formatCurrency(effectiveGrandTotal, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Payment Terms Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span>Ödeme Koşulları & Şartlar</span>
        </label>
        <textarea
          rows={3}
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 leading-relaxed font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
        />
      </div>

      {/* New Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Yeni Müşteri Ekle</span>
            </h3>
            
            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Firma Adı *</label>
                <input
                  type="text"
                  required
                  value={newCustCompanyName}
                  onChange={(e) => setNewCustCompanyName(e.target.value)}
                  placeholder="Firma Ticari Unvanı"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Yetkili Adı Soyadı *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Yetkili Ad Soyad"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">E-Posta Adresi *</label>
                <input
                  type="email"
                  required
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="ornek@firma.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Telefon</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="0532 000 00 00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border border-blue-500 shadow-md shadow-blue-600/20"
                >
                  Müşteriyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
