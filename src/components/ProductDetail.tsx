import { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react'; 
// Zəhmət olmasa bu import path-i düzgün təyin etdiyinizə əmin olun
import { supabase, Product } from '../lib/supabase'; 

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
}

interface CreditSettings {
  interestRate: number;
  minMonths: number;
  maxMonths: number;
  minPrice: number;
  maxPrice: number;
}

// Bütün ay opsiyaları
const ALL_AVAILABLE_MONTHS = [3, 6, 12, 18];

export function ProductDetail({ productId, onBack }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditSettings, setCreditSettings] = useState<CreditSettings | null>(null);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [selectedCreditMonth, setSelectedCreditMonth] = useState<number | null>(null);

  // --- HESABLAMALAR ---
  const priceAZN = product ? (product.price_azn || product.price_usd * 1.7 || 0) : 0;

  const calculateMonthlyPayment = (months: number, price: number, settings: CreditSettings) => {
    if (
      isNaN(price) || price <= 0 || months <= 0 ||
      price < settings.minPrice || price > settings.maxPrice
    ) {
      return 0;
    }

    const interestRate = settings.interestRate / 100;
    const totalAmount = price * (1 + interestRate * (months / 12));
    
    return totalAmount / months;
  };

  // --- MƏLUMAT YÜKLƏNMƏ MƏNTİQİ ---
  async function fetchSettings() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'credit_interest_rate', 'credit_min_months', 'credit_max_months', 
          'credit_min_price', 'credit_max_price',
        ]);

      if (data) {
        const newSettings: Partial<CreditSettings> = {};
        data.forEach((setting) => {
          const value = parseFloat(setting.value);
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
            
            // Bütün ay opsiyalarını göstəririk.
            setAvailableMonths(ALL_AVAILABLE_MONTHS);

            if (ALL_AVAILABLE_MONTHS.length > 0) {
                // Default olaraq ən kiçik ayı seçirik (3 ay)
                setSelectedCreditMonth(ALL_AVAILABLE_MONTHS[0]);
            }
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }
  
  async function fetchProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProduct(data);
      } else {
          setError('Məhsul tapılmadı.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Məhsul yüklənmədi.');
    }
  }

  useEffect(() => {
    if (!productId) {
        setError('Məhsul ID-si təyin edilməyib.');
        setLoading(false);
        return;
    }
    setLoading(true);
    Promise.all([fetchProduct(), fetchSettings()]).finally(() => setLoading(false));
  }, [productId]);

  // --- RENDER KÖMƏKÇİ FUNKSİYALARI ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]"> 
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-800 font-semibold mb-4">Xəta: {error || 'Məhsul məlumatı əldə edilmədi.'}</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kataloqa qayıt
          </button>
        </div>
      </div>
    );
  }

  const getAvailabilityColor = (availability: string) => {
    const lower = availability.toLowerCase();
    if (lower.includes('mövcuddur') || lower.includes('in stock') || lower.includes('hazır')) {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    }
    if (lower.includes('mövcud deyil') || lower.includes('out of stock')) {
      return 'bg-red-100 text-red-800 border border-red-300';
    }
    return 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  const mainImage = product.main_image; 
  const isCreditAvailable = creditSettings && priceAZN > 0 && priceAZN >= creditSettings.minPrice && priceAZN <= creditSettings.maxPrice;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6"> 
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 mt-2 mb-4 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> 
        Kataloqa qayıt
      </button>

      <div className="bg-white rounded-xl shadow-xl border border-gray-100">
        {/* hündürlüyü böyük ekranlarda 75vh-ə məhdudlaşdırırıq */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 lg:h-[75vh] overflow-hidden"> 
          
          {/* ⬅️ LEFT COLUMN: IMAGE */}
          <div className="flex-shrink-0">
            {/* Şəkilin hündürlüyünü məhdudlaşdırırıq */}
            <div className="h-full max-h-[60vh] lg:max-h-[70vh] overflow-hidden rounded-xl bg-gray-100 shadow-inner"> 
              <img
                src={mainImage}
                alt={product.title}
                className="w-full h-full object-contain" // Proporsiya saxlanılır
              />
            </div>
          </div>

          {/* ➡️ RIGHT COLUMN: DETAILS AND ACTIONS */}
          {/* Məlumat bloku. Məzmunu flex və overflow ilə idarə edirik */}
          <div className="flex flex-col ml-6  pr-4"> 
            <div className="mb-3">
              
              {/* Kateqoriya və Kod */}
              <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
                <span className="font-semibold text-gray-900 uppercase">{product.category}</span>
                <span className="text-gray-400">•</span>
                <span>Kod: {product.article || 'N/A'}</span>
                <span className="text-gray-400">•</span>
                <span className={`flex-shrink-0 font-medium p-1 rounded text-xs ${getAvailabilityColor(product.availability)}`}>
                  {product.availability}
                </span>
              </div>
            	
              {/* Başlıq */}
              <h1 className="text-2xl font-bold text-gray-900 pr-4">
                {product.title}
              </h1>
            </div>

            {/* Qiymət Bloku */}
            <div className="mb-4">
              <span className="text-4xl font-extrabold text-amber-700"> 
                {priceAZN.toFixed(2)} ₼
              </span>
            </div>

            {/* KREDİT KALKULYATORU */}
            {isCreditAvailable && creditSettings && availableMonths.length > 0 && (
              <div className="mb-4 border-b pb-3 border-gray-100">
                <h2 className="text-md font-semibold text-gray-800 mb-2">Kredit şərtləri</h2>
                
                {/* DÜZƏLİŞ: Xarici flex konteyner ortalanmanı təmin edir */}
                <div className="flex">
                    {/* Daxili blok w-80 ölçüsünü saxlayır */}
                    <div className="grid grid-cols-1 gap-1.5 w-[270px]"> 
                      {availableMonths.map(month => {
                        const monthlyPayment = calculateMonthlyPayment(month, priceAZN, creditSettings);
                        const isSelected = selectedCreditMonth === month;
                        
                        return (
                          <div
                            key={month}
                            onClick={() => setSelectedCreditMonth(month)}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${ 
                              isSelected
                                ? 'border-amber-600 bg-amber-50 shadow-sm'
                                : 'border-gray-200 hover:border-amber-300'
                            } flex justify-between items-center`}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-gray-900">{month} ay</span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className={`text-md font-extrabold ${isSelected ? 'text-amber-700' : 'text-gray-800'}`}>
                                {monthlyPayment.toFixed(2)} ₼
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          
            {/* Xüsusiyyətlər */}
            <div className="flex gap-8 mb-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-600">Əyar:</span>
                <span className="text-sm font-bold text-gray-900">{product.metal || product.material || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600">Çəki:</span>
                <span className="text-sm font-bold text-gray-900">
                    {product.weight_grams ? `${product.weight_grams}q` : product.weight || 'N/A'}
                </span>
              </div>
            </div>

            {/* Təsvir bloku */}
            {product.description && (
              <div className="mb-4">
                <h2 className="text-sm font-bold text-gray-900 mb-1">Əlavə Məlumat</h2>
                <p className="text-gray-700 text-xs leading-relaxed">{product.description}</p>
              </div>
            )}
          
            {/* Əsas Action Button */}
           <a
  href={`https://wa.me/994702229284?text=${encodeURIComponent(
    isCreditAvailable && selectedCreditMonth && creditSettings
      ? `Mən ${product.title} (Kod: ${product.article || 'N/A'}) məhsulunu ${selectedCreditMonth} aylıq kreditlə almaq istəyirəm. Aylıq ödəniş: ${calculateMonthlyPayment(selectedCreditMonth, priceAZN, creditSettings).toFixed(2)} ₼`
      : `Mən ${product.title} (Kod: ${product.article || 'N/A'}) məhsulu ilə maraqlanıram. Qiymət: ${priceAZN.toFixed(2)} ₼`
  )}`}
  target="_blank"
  rel="noopener noreferrer"
  
  className={`flex items-center justify-center gap-3 w-[450px] mr-auto py-3 rounded-lg font-semibold text-base transition-colors shadow-lg mt-4 ${
    isCreditAvailable && selectedCreditMonth
      ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/50' 
      : 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/50' 
  }`}
>
  <MessageCircle className="w-5 h-5" />
  <span>
    {isCreditAvailable && selectedCreditMonth ? `Kreditlə Sifariş Et (${selectedCreditMonth} ay)` : 'WhatsApp ilə Sifariş Et'}
  </span>
</a>
          </div>
        </div>
      </div>
    </div>
  );
}