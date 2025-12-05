import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Calculator, Loader2, X } from 'lucide-react'; // X ikonunu da əlavə edirik
import { ImageWithSkeleton } from './ImageWithSkeleton';

const API_URL = import.meta.env.VITE_API_URL;

interface SettingItem {
    key: string;
    value: string;
}
type CalculatedPayments = Record<number, number>;

// TƏK KOMPONENTİ MODAL VƏ BLOQ GÖRÜNÜŞÜNƏ UYĞUNLAŞDIRIR
export function CreditCalculator() {
    // --- STATE'LƏR ---
    const [productPrice, setProductPrice] = useState<string>('1000');
    const [months, setMonths] = useState<number>(6); 
    const [interestRate, setInterestRate] = useState<number>(15);
    const [minPrice, setMinPrice] = useState<number>(100);
    const [maxPrice, setMaxPrice] = useState<number>(10000);
    const [maxMonthsSetting, setMaxMonthsSetting] = useState<number>(18); 
    const [loading, setLoading] = useState(true);
    
    // YENİ: Modalın açıq olub-olmaması üçün state
    const [isModalOpen, setIsModalOpen] = useState(false); 

    const ALL_CREDIT_TERMS = [3, 6, 12, 18]; 

    // --- SETTİNGLƏRİ ÇƏKMƏ ---
    const fetchSettings = useCallback(async () => {
        try {
            const response = await axios.get<SettingItem[]>(`${API_URL}/credit_options`);
            const data = response.data;

            if (data) {
                data.forEach((setting) => {
                    switch (setting.key) {
                        case 'credit_interest_rate':
                            setInterestRate(parseFloat(setting.value));
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
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // --- HESABLAMA MƏNTİQİ ---

    const creditTerms = useMemo(() => {
        return ALL_CREDIT_TERMS.filter(term => term <= maxMonthsSetting);
    }, [maxMonthsSetting]);


    // KREDİT FORMULU: Simple Interest Calculation (Əsas faiz)
    const calculateMonthlyPaymentForTerm = (price: string, rate: number, term: number) => {
        const parsedPrice = parseFloat(price);
        // Validasiya
        if (isNaN(parsedPrice) || parsedPrice < minPrice || parsedPrice > maxPrice) return 0;
        
        // Bu, yəqin ki, tətbiq etdiyiniz "faizsiz kredit" modelinə yaxın sadə bir formuladır.
        // totalAmount = P + (P * r * t)
        const annualRateDecimal = rate / 100; 
        const totalAmount = parsedPrice * (1 + annualRateDecimal * (term / 12)); 
        return totalAmount / term; // Aylıq ödəniş
    };

    const monthlyPayment = useMemo(() => {
        return calculateMonthlyPaymentForTerm(productPrice, interestRate, months);
    }, [productPrice, interestRate, months, minPrice, maxPrice]);
        
    const totalAmount = monthlyPayment * months;

    const calculatedPayments = useMemo(() => {
        return creditTerms.reduce((acc: CalculatedPayments, term: number) => {
            acc[term] = calculateMonthlyPaymentForTerm(productPrice, interestRate, term);
            return acc;
        }, {} as CalculatedPayments);
    }, [productPrice, interestRate, minPrice, maxPrice, creditTerms]);

    // --- KREDİT KALKULYATORU KOMPONENTİ ---
    const CalculatorContent = () => (
        <div className="space-y-5">
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
    );

    // --- YÜKLƏNMƏ GÖRÜNÜŞÜ ---
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 max-w-[300px] mx-auto border-2 border-green-200">
                <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                </div>
            </div>
        );
    }

    // --- RENDER: İKİ QAT GÖRÜNÜŞ (Desktop/Mobile) ---
    return (
        <>
            {/* 1. DESKTOP GÖRÜNÜŞÜ (lg: ekrandan yuxarıda görünür) */}
            <div className="hidden lg:block bg-green-50 rounded-lg shadow-lg p-5 border-2 border-green-200 max-w-[360px] mx-auto">
                <CalculatorContent />
            </div>

            {/* 2. MOBİL GÖRÜNÜŞ (lg: ekrandan aşağıda işləyir) */}

            {/* FAB (Floating Action Button) - Həmişə görünür, amma böyük ekranda gizlənir */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="lg:hidden fixed bottom-4 right-4 z-50 p-4 rounded-full bg-teal-600 text-white shadow-xl hover:bg-teal-700 transition-colors"
                aria-label="Kredit Kalkulyatorunu Aç"
            >
                <Calculator className="w-6 h-6" />
            </button>

            {/* MODAL PƏNCƏRƏ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
                    {/* Modal Overlay */}
                    <div 
                        className="absolute inset-0 bg-gray-900 opacity-70"
                        onClick={() => setIsModalOpen(false)} // Overlay kliklənəndə bağlansın
                    />

                    {/* Modal Content (aşağıdan yuxarı slayt effekti üçün justify-end istifadə olunur) */}
                    <div className="relative w-full max-w-sm bg-green-50 rounded-t-xl shadow-2xl p-5 border-t-4 border-teal-500 transform transition-transform duration-300 ease-out translate-y-0">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-900 transition-colors"
                            aria-label="Bağla"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <CalculatorContent />
                    </div>
                </div>
            )}
        </>
    );
}

export default CreditCalculator;