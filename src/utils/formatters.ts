import { ProposalStatus } from '../types';

export function formatCurrency(amount: number, currency: 'TRY' | 'USD' | 'EUR' | 'GBP' = 'TRY'): string {
  const symbolMap = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const symbol = symbolMap[currency] || '₺';

  const formattedNumber = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);

  return `${formattedNumber} ${symbol}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getStatusBadgeConfig(status: ProposalStatus) {
  switch (status) {
    case 'TASLAK':
      return {
        label: 'Taslak',
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        textColor: 'text-slate-700 dark:text-slate-300',
        borderColor: 'border-slate-200 dark:border-slate-700',
        iconName: 'FileEdit'
      };
    case 'GONDERILDI':
      return {
        label: 'E-posta Gönderildi',
        bgColor: 'bg-blue-50 dark:bg-blue-950/50',
        textColor: 'text-blue-700 dark:text-blue-300',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconName: 'Send'
      };
    case 'INCELENIYOR':
      return {
        label: 'Müşteri İncenliyor',
        bgColor: 'bg-amber-50 dark:bg-amber-950/50',
        textColor: 'text-amber-700 dark:text-amber-300',
        borderColor: 'border-amber-200 dark:border-amber-800',
        iconName: 'Eye'
      };
    case 'ONAYLANDI':
      return {
        label: 'Onaylandı',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        iconName: 'CheckCircle2'
      };
    case 'REDDEDILDI':
      return {
        label: 'Reddedildi',
        bgColor: 'bg-rose-50 dark:bg-rose-950/50',
        textColor: 'text-rose-700 dark:text-rose-300',
        borderColor: 'border-rose-200 dark:border-rose-800',
        iconName: 'XCircle'
      };
    case 'SURESI_DOLDU':
      return {
        label: 'Süresi Doldu',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-600 dark:text-gray-400',
        borderColor: 'border-gray-300 dark:border-gray-700',
        iconName: 'Clock'
      };
    default:
      return {
        label: status,
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-700',
        borderColor: 'border-slate-200',
        iconName: 'FileText'
      };
  }
}

// Play notification sound chime using Web Audio API
export function playNotificationSound(type: 'ONAY' | 'RET' | 'GORUNTULEME') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'ONAY') {
      // Pleasant victory chord
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } else if (type === 'RET') {
      // Soft alert double tap
      const now = ctx.currentTime;
      [349.23, 293.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.12, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.4);
      });
    } else {
      // Gentle notification pop
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (err) {
    console.log('Audio playback error:', err);
  }
}

export function copyToClipboard(text: string): boolean {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback if clipboard API throws security exception
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Copy fallback failed:', err);
    return false;
  }
}

export function getPublicPortalUrl(proposalId: string, settings?: any): string {
  let baseUrl = '';

  const customUrl = settings?.company?.publicUrl;
  if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
    let clean = customUrl.trim();
    // Strip hash, query params, trailing slashes or subpaths
    clean = clean.split('#')[0].split('?')[0].split('/customer/')[0].split('/portal/')[0].split('/p/')[0].replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    baseUrl = clean;
  } else if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/+$/, '');
    baseUrl = `${origin}${pathname}`;
  } else {
    baseUrl = 'http://localhost:5173';
  }

  // Short & clean public web portal link: /#/p/TKL-2026-1690
  return `${baseUrl}/#/p/${proposalId}`;
}
