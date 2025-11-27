import { useState, useEffect } from 'react';
// Zəhmət olmasa bu importların düzgün path-də olduğuna əmin olun.
import { supabase, Product } from '../lib/supabase'; 

export interface CreditSettings {
  interestRate: number;
  minMonths: number;
  maxMonths: number;
  minPrice: number;
  maxPrice: number;
}

const ALL_AVAILABLE_MONTHS = [3, 6, 9, 12, 18, 24];

interface ProductData {
  product: Product | null;
  creditSettings: CreditSettings | null;
  availableMonths: number[];
  loading: boolean;
  error: string | null;
  priceAZN: number;
}

export function useProductData(productId: string): ProductData {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditSettings, setCreditSettings] = useState<CreditSettings | null>(null);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);

  // qiyməti hesablayırıq
  const priceAZN = product ? (product.price_azn || product.price_usd * 1.7 || 0) : 0;

  useEffect(() => {
    if (!productId) {
      setError('Məhsul ID-si təyin edilməyib.');
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Məhsulu çəkmə
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .maybeSingle();

        if (productError) throw productError;
        setProduct(productData);

        if (!productData) {
            setError('Məhsul tapılmadı');
        }

        // Ayarları çəkmə
        const { data: settingsData } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', [
            'credit_interest_rate', 'credit_min_months', 'credit_max_months', 
            'credit_min_price', 'credit_max_price',
          ]);

        if (settingsData) {
          const newSettings: Partial<CreditSettings> = {};
          // Ayarları parse etmə məntiqi eynidir...
          settingsData.forEach((setting) => {
            const value = parseFloat(setting.value);
            // ... (düzgün switch case məntiqiniz)
            switch (setting.key) {
                case 'credit_interest_rate': newSettings.interestRate = value; break;
                case 'credit_min_months': newSettings.minMonths = value; break;
                case 'credit_max_months': newSettings.maxMonths = value; break;
                case 'credit_min_price': newSettings.minPrice = value; break;
                case 'credit_max_price': newSettings.maxPrice = value; break;
            }
          });

          const isComplete = newSettings.interestRate !== undefined && newSettings.minMonths !== undefined && 
                           newSettings.maxMonths !== undefined && newSettings.minPrice !== undefined && 
                           newSettings.maxPrice !== undefined;
          
          if (isComplete) {
            const finalSettings = newSettings as CreditSettings;
            setCreditSettings(finalSettings);
            
            // Mövcud kredit aylarını filtrləyirik
            const months = ALL_AVAILABLE_MONTHS.filter(month => 
              month >= finalSettings.minMonths && month <= finalSettings.maxMonths
            );
            setAvailableMonths(months);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Məlumat yüklənməsi xətası');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [productId]);

  return { product, creditSettings, availableMonths, loading, error, priceAZN };
}