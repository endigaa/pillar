import { useCallback } from 'react';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
export interface CurrencyConfig {
  code: string;
  label: string;
  locale: string;
}
export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', label: 'US Dollar ($)', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (��)', locale: 'de-DE' },
  { code: 'GBP', label: 'British Pound (£)', locale: 'en-GB' },
  { code: 'CAD', label: 'Canadian Dollar (CA$)', locale: 'en-CA' },
  { code: 'AUD', label: 'Australian Dollar (A$)', locale: 'en-AU' },
  { code: 'JPY', label: 'Japanese Yen (¥)', locale: 'ja-JP' },
  { code: 'INR', label: 'Indian Rupee (₹)', locale: 'en-IN' },
];
export function useCurrency() {
  const { profile } = useCompanyProfile();
  const currencyCode = profile?.currency || 'USD';
  const currencyConfig = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  const formatCurrency = useCallback((amountInCents: number, options?: Intl.NumberFormatOptions) => {
    // Handle JPY special case where there are no cents usually, but our DB stores integers.
    // If we assume DB stores "cents" (1/100), then for JPY 100 stored = 1 Yen.
    // If DB stores base units for JPY, we would need different logic.
    // For this app, let's assume uniform "cents" storage (divide by 100).
    const value = amountInCents / 100;
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currencyConfig.code,
      ...options,
    }).format(value);
  }, [currencyConfig]);
  return {
    formatCurrency,
    currency: currencyCode,
    currencySymbol: (0).toLocaleString(currencyConfig.locale, { style: 'currency', currency: currencyConfig.code }).replace(/\d|\s/g, ''),
    supportedCurrencies: CURRENCIES,
  };
}