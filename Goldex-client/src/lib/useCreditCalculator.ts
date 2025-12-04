import { CreditOptionDetail } from "../types/credits/credit.type";

/**
 * Sadə faiz (Simple Interest) metoduna əsaslanaraq aylıq ödənişi hesablayır.
 *
 * @param months - Kredit müddəti (ay sayı).
 * @param price - Məhsulun əsas qiyməti.
 * @param settings - Kredit seçimi (API-dan gələn min_months, max_months, percent daxil olmaqla).
 * @returns Aylıq ödənişin məbləği.
 */
export const calculateMonthlyPayment = (months: number, price: number, settings: CreditOptionDetail): number => {
  if (
    isNaN(price) ||
    price <= 0 ||
    isNaN(months) ||
    months < settings.min_months || // İnterfeysdən gələn min_months
    months > settings.max_months    // İnterfeysdən gələn max_months
  ) {
    return 0;
  }

  const interestRate = settings.percent / 100;
  const interestFactor = interestRate * (months / 12);
  const totalAmount = price * (1 + interestFactor);
  
  return totalAmount / months;
};