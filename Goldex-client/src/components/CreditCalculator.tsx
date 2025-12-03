import { useState, useEffect, useMemo } from 'react';
import axios from 'axios'; // ⬅️ axios import edildi
import { Calculator, Loader2 } from 'lucide-react';
import { ImageWithSkeleton } from './ImageWithSkeleton';

// API URL-i üçün env dəyişənini fərz edirik
const API_URL = import.meta.env.VITE_API_URL;

// Tənzimləmə obyektlərinin tipi
interface SettingItem {
    key: string;
    value: string;
}

// TypeScript xətasını aradan qaldırmaq üçün:
type CalculatedPayments = Record<number, number>;

export function CreditCalculator() {
    const [productPrice, setProductPrice] = useState<string>('1000');
    // months burada seçilmiş ay müddəti kimi istifadə olunur, minimum dəyər kimi deyil.
    const [months, setMonths] = useState<number>(6); 
    const [interestRate, setInterestRate] = useState<number>(15);

    const [minPrice, setMinPrice] = useState<number>(100);
    const [maxPrice, setMaxPrice] = useState<number>(10000);
    // Maksimum ay (bu dəyişən creditTerms-i filtrləmək üçün istifadə olunmur,
    // lakin setting-dən gəlirsə onu qeyd etmək yaxşıdır)
    const [maxMonthsSetting, setMaxMonthsSetting] = useState<number>(18); 
    const [loading, setLoading] = useState(true);

    // Sabit təklif olunan ay müddətləri (maksimum ay setting-ə görə filtrlənməmiş)
    const ALL_CREDIT_TERMS = [3, 6, 12, 18, 24]; 

    useEffect(() => {
        fetchSettings();
    }, []);

    // Parametrləri API-dən çəkmə
    async function fetchSettings() {
        try {
            // ⬅️ Supabase GET sorğusu axios ilə əvəz edildi
            const response = await axios.get<SettingItem[]>(`${API_URL}/credit_options`);
            const data = response.data;

            if (data) {
                data.forEach((setting) => {
                    switch (setting.key) {
                        case 'credit_interest_rate':
                            setInterestRate(parseFloat(setting.value));
                            break;
                        case 'credit_min_months':
                            // setMonths(parseInt(setting.value)); // Artıq seçilmiş ay üçün istifadə olunur
                            break;
                        case 'credit_max_months':
                            setMaxMonthsSetting(parseInt(setting.value));
                            break;
                        case 'credit_min_price':
                            setMinPrice(parseFloat(setting.value));
                            break;
                        case 'credit_max_price':
                            setMaxPrice(parseFloat(setting.value));
                            break;
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    }

    // Yalnız API-dən gələn maksimum ay müddətinə uyğun olan müddətləri filterlə
    const creditTerms = useMemo(() => {
        // Yalnız maxMonthsSetting-dən kiçik və ya bərabər olan müddətləri saxlayırıq
        return ALL_CREDIT_TERMS.filter(term => term <= maxMonthsSetting);
    }, [maxMonthsSetting]);


    // Sadə faiz əsasında aylıq ödənişi hesablamaq
    const calculateMonthlyPaymentForTerm = (price: string, rate: number, term: number) => {
        const parsedPrice = parseFloat(price);
        // Qiymətin kredit şərtlərinə uyğun olub olmadığını yoxlayırıq
        if (isNaN(parsedPrice) || parsedPrice < minPrice || parsedPrice > maxPrice) return 0;

        // Faiz dərəcəsi (faiz/100)
        const annualRateDecimal = rate / 100; 
        
        // TotalAmount = Principal * (1 + AnnualRate * (Months / 12))
        const totalAmount = parsedPrice * (1 + annualRateDecimal * (term / 12)); 
        
        return totalAmount / term;
    };

    // Cari seçilmiş ay üçün aylıq ödəniş
    const monthlyPayment = useMemo(() => {
        return calculateMonthlyPaymentForTerm(productPrice, interestRate, months);
    }, [productPrice, interestRate, months, minPrice, maxPrice]);
    
    // Cari seçilmiş ay üçün ümumi ödəniş
    const totalAmount = monthlyPayment * months;

    // Bütün təklif olunan ay müddətləri üçün aylıq ödənişləri hesablamaq
    const calculatedPayments = useMemo(() => {
        return creditTerms.reduce((acc: CalculatedPayments, term: number) => {
            acc[term] = calculateMonthlyPaymentForTerm(productPrice, interestRate, term);
            return acc;
        }, {} as CalculatedPayments);
    }, [productPrice, interestRate, minPrice, maxPrice, creditTerms]);


    if (loading) {
        return (
            <div className="bg-green-50 rounded-lg shadow-md p-6 max-w-[300px] mx-auto">
                <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-green-50 rounded-lg shadow-lg p-5 border-2 border-green-200 max-w-[360px] mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-teal-700" />
                    <h2 className="text-xl font-bold text-gray-900">Kredit Kalkulyatoru</h2>
                </div>
                <ImageWithSkeleton src="/city-logo.jpg" alt="City Finance" className="h-10 object-contain" />
            </div>

            <p className="text-xs text-gray-600 mb-4 italic">
                Kredit City Finance tərəfindən təqdim olunur (Faiz: {interestRate}%)
            </p>

            <div className="space-y-5">

                {/* PRICE INPUT */}
                <div>
                    <label className="block text-sm font-medium text-black mb-1">
                        Məhsulun qiyməti (AZN)
                    </label>
                    <input
                        type="number"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        min={minPrice}
                        max={maxPrice}
                        step="10"
                        className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white text-black"
                    />
                    <p className="text-xs text-black mt-1">
                        Minimum: ₼{minPrice} | Maksimum: ₼{maxPrice}
                    </p>
                </div>

                {/* MONTHS SELECTION with Payments Display */}
                <div>
                    <label className="block text-sm font-medium text-black mb-2">
                        Kredit müddəti (Aylıq Ödəniş)
                    </label>
                    <div className="space-y-2">
                        {creditTerms.map((m) => (
                            <button
                                key={m}
                                onClick={() => setMonths(m)}
                                className={`w-full px-3 py-2 rounded-lg font-semibold text-sm transition-all flex justify-between items-center ${
                                    months === m
                                        ? "bg-blue-300 text-black shadow border border-blue-400"
                                        : "bg-white text-black border-2 border-green-200 hover:border-green-300"
                                }`}
                            >
                                <span>{m} ay</span>
                                <span className={`text-base font-bold ${months === m ? "text-blue-800" : "text-black"}`}>
                                    {calculatedPayments[m] !== undefined && calculatedPayments[m] > 0
                                        ? `₼${calculatedPayments[m].toFixed(2)}`
                                        : '---'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* CURRENT SELECTED PAYMENT BOX */}
                <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-sm">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-black text-sm font-medium">Seçilmiş Aylıq ödəniş:</span>
                            <span className="text-xl font-bold text-black">₼{monthlyPayment.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-black text-sm font-medium">Seçilmiş Ümumi ödəniş:</span>
                            <span className="text-lg font-semibold text-black">₼{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* INFO BOX */}
                <div className="bg-lime-100 rounded-lg p-3 border border-lime-300">
                    <p className="text-xs text-black text-center leading-tight">
                        Bu hesablama yalnız təxmini məlumat üçündür. 
                        Dəqiq şərtlər üçün mağaza ilə əlaqə saxlayın.
                    </p>
                </div>
            </div>
        </div>
    );
}
export default CreditCalculator;