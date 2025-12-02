import { CreditSettings } from '../hooks/useProductData'; 

// Simple Interest hesablama məntiqi
export const calculateMonthlyPayment = (months: number, price: number, settings: CreditSettings): number => {
  if (
    isNaN(price) ||
    price < settings.minPrice ||
    price > settings.maxPrice ||
    months <= 0
  ) {
    return 0;
  }

  // Faiz dərəcəsi (məsələn, 10% üçün 0.1)
  const interestRate = settings.interestRate / 100;
  
  // Ümumi məbləğ = Əsas Qiymət * (1 + Faiz dərəcəsi * İllərin sayı)
  const totalAmount = price * (1 + interestRate * (months / 12));
  
  return totalAmount / months;
};