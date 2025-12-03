import { useState, useEffect } from 'react';
import axios from 'axios'; 
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react'; 
import { Product, ProductDetailProps } from '../types/products/product.type';
import { CreditOptionDetail } from '../types/credits/credit.type'; 

const API_URL = import.meta.env.VITE_API_URL; 

// API-dən gələn bütün potensial ay opsiyaları
const ALL_AVAILABLE_MONTHS = [3, 6, 12, 18];

// DÜZƏLİŞ: Çəki stringindən rəqəmi çıxaran köməkçi funksiya. 
const getWeightGrams = (weightString: any): number => {
    if (!weightString) return 0;
    
    if (typeof weightString === 'number') {
        return weightString;
    }

    if (typeof weightString !== 'string') {
        return 0;
    }
    
    const match = weightString.match(/(\d+(\.\d+)?)/);
    
    return match ? parseFloat(match[0]) : 0;
};

export function ProductDetail({ productId, onBack }: ProductDetailProps) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creditSettings, setCreditSettings] = useState<CreditOptionDetail | null>(null);
    const [availableMonths, setAvailableMonths] = useState<number[]>([]);
    const [selectedCreditMonth, setSelectedCreditMonth] = useState<number | null>(null);

    // --- HESABLAMALAR ---
    const priceAZN = product?.custom_price && typeof product.custom_price === 'number'
        ? product.custom_price
        : 0;

    // Kredit ödənişinin hesablanması (DÜZƏLİŞ: settings.percent, settings.price_min, settings.price_max istifadə olunur)
    const calculateMonthlyPayment = (months: number, price: number, settings: CreditOptionDetail) => {
        if (
            isNaN(price) || price <= 0 || months <= 0 ||
            price < (settings.min_months ?? 0) || price > (settings.max_months ?? Infinity)
        ) {
            return 0;
        }

        const interestRate = settings.percent / 100; // DÜZƏLİŞ: percent istifadə olunur
        const totalAmount = price * (1 + interestRate * (months / 12)); 
        
        return totalAmount / months;
    };


    // 1. Kredit tənzimləmələrini çəkmək (Sizin original Key-Value parsing məntiqiniz - TƏHLÜKƏLİ YANAŞMA)
    // DÜZƏLİŞ: Əvvəlki fayldakı kimi API-dan CreditOptionDetail[] gəldiyini fərz edərək kodu sadələşdiririk.
    async function fetchCreditSettings() {
        try {
            // Fərz edilir ki, API artıq CreditOptionDetail[] tipində data qaytarır
            const response = await axios.get<CreditOptionDetail[]>(`${API_URL}/credit_options`); 
            
            const options = response.data; 

            if (options && options.length > 0) {
                // City Finance və ya ilk mövcud opsiyanı seçirik
                const creditOptionName = "City Finance"; // Sabit bir ad fərz edilir
                const selectedOption = options.find(opt => opt.name === creditOptionName) || options[0];

                if (selectedOption) {
                    setCreditSettings(selectedOption);
                    
                    // DÜZƏLİŞ: API adlarını istifadə edirik: min_months, max_months
                    const min = selectedOption.min_months ?? 3;
                    const max = selectedOption.max_months ?? 18;

                    const filteredMonths = ALL_AVAILABLE_MONTHS.filter(month => month >= min && month <= max);
                    
                    setAvailableMonths(filteredMonths);

                    if (filteredMonths.length > 0) {
                        setSelectedCreditMonth(filteredMonths[0]);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching credit settings:', err); 
        }
    }
    
    // 2. Məhsulun detallarını çəkmək 
    async function fetchProduct() {
        try {
            const response = await axios.get<Product>(`${API_URL}/products/${productId}`);
            const data = response.data;
            
            if (data && data.id) {
                setProduct(data);
            } else {
                setError('Məhsul tapılmadı.');
            }
        } catch (err) {
            let errorMessage = 'Məhsul yüklənmədi.';
            if (axios.isAxiosError(err) && err.response && err.response.status === 404) {
                 errorMessage = 'Məhsul tapılmadı (404).';
            } else if (err instanceof Error) {
                 errorMessage = err.message;
            }
            setError(errorMessage);
        }
    }

    useEffect(() => {
        if (!productId) {
            setError('Məhsul ID-si təyin edilməyib.');
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all([fetchProduct(), fetchCreditSettings()]).finally(() => setLoading(false)); 
    }, [productId]);

    // --- RENDER MƏNTİQİ ---

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

    const getAvailabilityColor = (availability: string | null | undefined) => {
        const safeAvailability = (typeof availability === 'string') ? availability : '';
        const lower = safeAvailability.toLowerCase();
        
        if (lower.includes('mövcuddur') || lower.includes('in stock') || lower.includes('hazır')) {
            return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
        }
        if (lower.includes('mövcud deyil') || lower.includes('out of stock')) {
            return 'bg-red-100 text-red-800 border border-red-300';
        }
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    };

    // product.main_image_link-in mövcudluğunu yoxlayırıq
    const mainImage = product.main_image_link && typeof product.main_image_link === 'string' 
        ? product.main_image_link 
        : ''; 
    
    // Kredit imkanının yoxlanılması
    // DÜZƏLİŞ: creditSettings.price_min / price_max istifadə olunur
    const isCreditAvailable = creditSettings && priceAZN > 0 && priceAZN >= (creditSettings.min_months ?? 0) && priceAZN <= (creditSettings.max_months ?? Infinity);
    
    // DÜZƏLİŞ: creditSettings-in mövcudluğunu yoxlayırıq
    const selectedMonthlyPayment = (isCreditAvailable && selectedCreditMonth && creditSettings)
        ? calculateMonthlyPayment(selectedCreditMonth, priceAZN, creditSettings)
        : 0;
        
    // DÜZƏLİŞ: weight dəyərini təhlükəsiz şəkildə ötürürük
    const weightInGrams = getWeightGrams(product.weight);
    // Əgər funksiya rəqəm qaytarmayıbsa (yəni 0-dırsa) orjinal dəyəri göstəririk
    const formattedWeight = weightInGrams > 0 ? `${weightInGrams.toFixed(2)}q` : product.weight || 'N/A';


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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 lg:h-[75vh] overflow-hidden"> 
                    
                    {/* ⬅️ LEFT COLUMN: IMAGE */}
                    <div className="flex-shrink-0">
                        <div className="h-full max-h-[60vh] lg:max-h-[70vh] overflow-hidden rounded-xl bg-gray-100 shadow-inner"> 
                            <img
                                src={mainImage}
                                alt={product.title}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* ➡️ RIGHT COLUMN: DETAILS AND ACTIONS */}
                    <div className="flex flex-col ml-6 pr-4 overflow-y-auto"> 
                        <div className="mb-3">
                            
                            {/* Kateqoriya və Kod */}
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
                                <span className="font-semibold text-gray-900 uppercase">Kateqoriya ID: {product.category_id}</span>
                                <span className="text-gray-400">•</span>
                                <span>Kod: {product.slug || 'N/A'}</span>
                                <span className="text-gray-400">•</span>
                                <span className={`flex-shrink-0 font-medium p-1 rounded text-xs ${getAvailabilityColor(product.availability)}`}>
                                    {product.availability || 'N/A'}
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
                             {product.discount > 0 && (
                                 <span className="ml-3 text-lg font-semibold text-red-500">
                                     Endirim: -{product.discount}%
                                 </span>
                             )}
                        </div>
                        
                        {/* KREDİT KALKULYATORU */}
                        {isCreditAvailable && creditSettings && availableMonths.length > 0 && (
                            <div className="mb-4 border-b pb-3 border-gray-100">
                                <h2 className="text-md font-semibold text-gray-800 mb-2">Kredit şərtləri ({creditSettings.percent}% faiz)</h2>
                                
                                <div className="flex">
                                    <div className="grid grid-cols-2 gap-1.5 w-[270px]"> 
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
                                                    <span className="font-medium text-sm text-gray-800">{month} ay</span>
                                                    <span className="font-bold text-lg text-amber-700">{monthlyPayment.toFixed(2)} ₼</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* WhatsApp Button */}
                                {selectedCreditMonth && selectedMonthlyPayment > 0 && (
                                    <a
                                        href={`https://wa.me/994702229284?text=${encodeURIComponent(
                                            `Mən ${product.title} (Kod: ${
                                                product.article || product.slug || "N/A"
                                            }) məhsulunu ${selectedCreditMonth} aylıq kreditə (${selectedMonthlyPayment.toFixed(2)} ₼/ay) almaq istəyirəm.`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors shadow-lg animate-pulse mt-3"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        <span>Kreditlə Sifariş Et</span>
                                    </a>
                                )}
                            </div>
                        )}
                        
                        {/* Ətraflı Məlumatlar */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h2 className="text-md font-semibold text-gray-800 mb-2">Ətraflı</h2>
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <span className="text-gray-600">Material/Əyar:</span>
                                <span className="font-medium text-gray-900">{product.material || product.metal || 'N/A'}</span>
                                
                                <span className="text-gray-600">Karat:</span>
                                <span className="font-medium text-gray-900">{product.carat || 'N/A'}</span>

                                <span className="text-gray-600">Çəki:</span>
                                <span className="font-medium text-gray-900">{formattedWeight}</span>
                                
                                <span className="text-gray-600">Ölçü:</span>
                                <span className="font-medium text-gray-900">{product.size || 'N/A'}</span>
                                
                                {product.gemstone_type && (
                                    <>
                                        <span className="text-gray-600">Daş növü:</span>
                                        <span className="font-medium text-gray-900">{product.gemstone_type}</span>
                                        <span className="text-gray-600">Daş çəkisi:</span>
                                        <span className="font-medium text-gray-900">{product.gemstone_carat || 'N/A'}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Təsvir */}
                        {product.description && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <h2 className="text-md font-semibold text-gray-800 mb-2">Təsvir</h2>
                                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* General WhatsApp Button */}
                        <div className="mt-6">
                            <a
                                href={`https://wa.me/994702229284?text=${encodeURIComponent(
                                    `Mən ${product.title} (Kod: ${product.article || "N/A"}) məhsulu ilə maraqlanıram. Qiyməti: ${priceAZN.toFixed(2)} ₼.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition-colors shadow-lg"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span>Məhsul haqqında məlumat al / Sifariş et</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}