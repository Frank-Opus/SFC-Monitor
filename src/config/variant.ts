const buildVariant = (() => {
  try {
    return import.meta.env?.VITE_VARIANT || 'full';
  } catch {
    return 'full';
  }
})();

const VALID_VARIANTS = new Set(['full', 'tech', 'finance', 'happy', 'commodity']);

function getStoredVariant(): string | null {
  try {
    const stored = localStorage.getItem('worldmonitor-variant');
    return stored && VALID_VARIANTS.has(stored) ? stored : null;
  } catch {
    return null;
  }
}

function getUrlVariant(): string | null {
  try {
    const value = new URL(window.location.href).searchParams.get('variant');
    return value && VALID_VARIANTS.has(value) ? value : null;
  } catch {
    return null;
  }
}

export const SITE_VARIANT: string = (() => {
  if (typeof window === 'undefined') return buildVariant;

  const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  if (isTauri) {
    return getStoredVariant() || buildVariant;
  }

  const h = location.hostname;
  if (h.startsWith('tech.')) return 'tech';
  if (h.startsWith('finance.')) return 'finance';
  if (h.startsWith('happy.')) return 'happy';
  if (h.startsWith('commodity.')) return 'commodity';

  if (h === 'localhost' || h === '127.0.0.1') {
    return getUrlVariant() || getStoredVariant() || buildVariant;
  }

  // Custom domains and preview deployments can host every variant on one origin.
  return getUrlVariant() || getStoredVariant() || 'full';
})();
