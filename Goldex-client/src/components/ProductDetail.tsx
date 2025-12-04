import { useState, useEffect, useMemo, ReactNode } from "react";
import axios from "axios";
import { ArrowLeft, MessageCircle, Loader2, Calculator } from "lucide-react";

// --- INTERFACES ---

export interface ProductDetailProps {
  productId: number;
  onBack: () => void;
}

export interface Product {
  [x: string]: ReactNode;
  id: number;
  title: string;
  article?: string | null;
  slug?: string | null;
  category_name?: string; // product.category_name üçün
  availability?: string | boolean | null; // boolean dəstəkləmək üçün yeniləndi
  custom_price?: number | string | null;
  discount: number;
  main_image_link?: string | null;
  material?: string | null;
  metal?: string | null;
  carat?: string | number | null;
  weight?: string | number | null;
  description?: string | null;
}

export interface CreditOptionDetail {
  [x: string]: number | string | boolean;
  id: number;
  name: string;
  min_months: number;
  max_months: number;
  percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- SABİTLƏR ---

const API_URL = import.meta.env.VITE_API_URL;

const ALL_AVAILABLE_MONTHS = [3, 6, 12, 18];

// --- HELPER FUNKSİYALAR ---

// Çəki dəyərini string-dən rəqəmə çevirmə funksiyası
const getWeightGrams = (weightString: any): number => {
  if (!weightString) return 0;
  if (typeof weightString === "number") return weightString;
  if (typeof weightString !== "string") return 0;
  const match = weightString.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

/**
 * product.availability dəyərini (boolean, string və ya null) oxunacaq mətnə çevirir.
 * @param availability - product.availability
 * @returns {string} - "Mövcuddur", "Stokda Yoxdur", və ya gələn string dəyəri.
 */
const getAvailabilityText = (availability: any): string => {
    // Əgər boolean-dırsa, istədiyimiz mətnə çeviririk
    if (typeof availability === 'boolean') {
        return availability ? 'Mövcuddur' : 'Stokda Yoxdur';
    }
    // Əgər string, null və ya undefined-dırsa, stringə çevirib qaytarır (və ya 'N/A')
    return (typeof availability === 'string' && availability) ? availability : 'N/A';
}

/**
 * Mövcudluq mətninə əsasən Tailwind CSS rəng siniflərini qaytarır.
 * Mətn boolean-dan gəlsə də, rəngi təyin edə bilir.
 * @param availability - product.availability (boolean, string və ya null)
 * @returns {string} - Rəng sinifləri
 */
const getAvailabilityColor = (availability: any) => {
    // getAvailabilityText funksiyasından istifadə edərək rəngi təyin edirik
    const text = getAvailabilityText(availability).toLowerCase();
    
    if (text.includes('mövcuddur') || text.includes('in stock') || text.includes('hazır')) {
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (text.includes('stokda yoxdur') || text.includes('mövcud deyil') || text.includes('out of stock')) {
        return 'bg-red-100 text-red-800 border-red-300';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
};


// --- KOMPONENT ---

export function ProductDetail({ productId, onBack }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditSettings, setCreditSettings] =
    useState<CreditOptionDetail | null>(null);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);

  const [productPriceInput, setProductPriceInput] = useState<string>("0");
  const [selectedCreditMonth, setSelectedCreditMonth] = useState<number | null>(
    null
  );

  // --- HESABLAMALAR ---

  const priceAZN = parseFloat(productPriceInput) || 0;

  const calculateMonthlyPaymentForTerm = (
    price: number,
    rate: number,
    term: number
  ): number => {
    if (isNaN(price) || price <= 0 || term <= 0) return 0;

    const annualRateDecimal = rate / 100;
    // Sadə faiz düsturu: Total Amount = Principal * (1 + Annual Rate * (Term in Years))
    const totalAmount = price * (1 + annualRateDecimal * (term / 12));

    return totalAmount / term;
  };

  const calculatedPayments = useMemo(() => {
    if (!creditSettings) return {};

    return availableMonths.reduce((acc, term) => {
      acc[term] = calculateMonthlyPaymentForTerm(
        priceAZN,
        creditSettings.percent,
        term
      );
      return acc;
    }, {} as Record<number, number>);
  }, [priceAZN, creditSettings, availableMonths]);

  // Seçilmiş müddət üçün aylıq ödəniş
  const selectedMonthlyPayment = selectedCreditMonth
    ? calculatedPayments[selectedCreditMonth] ?? 0
    : 0;

  // --- MƏLUMATLARIN YÜKLƏNMƏSİ ---

  async function fetchCreditSettings() {
    try {
      const response = await axios.get<CreditOptionDetail[]>(
        `${API_URL}/credit_options`
      );
      const options = response.data;

      if (options && options.length > 0) {
        const creditOptionName = "City Finance";
        const selectedOption =
          options.find((opt) => opt.name === creditOptionName) || options[0];

        if (selectedOption) {
          setCreditSettings(selectedOption);

          const min = selectedOption.min_months ?? 3;
          const max = selectedOption.max_months ?? 18;

          const filteredMonths = ALL_AVAILABLE_MONTHS.filter(
            (month) => month >= min && month <= max
          );

          setAvailableMonths(filteredMonths);

          if (filteredMonths.length > 0 && !selectedCreditMonth) {
            setSelectedCreditMonth(filteredMonths[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching credit settings:", err);
    }
  }

  async function fetchProduct() {
    try {
      const response = await axios.get<Product>(
        `${API_URL}/products/${productId}`
      );
      const data = response.data;

      if (data && data.id) {
        setProduct(data);

        const initialPrice =
          data.custom_price && typeof data.custom_price === "number"
            ? data.custom_price.toFixed(2)
            : "0";
        setProductPriceInput(initialPrice);
      } else {
        setError("Məhsul tapılmadı.");
      }
    } catch (err) {
      let errorMessage = "Məhsul yüklənmədi.";
      if (
        axios.isAxiosError(err) &&
        err.response &&
        err.response.status === 404
      ) {
        errorMessage = "Məhsul tapılmadı (404).";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  }

  useEffect(() => {
    if (!productId) {
      setError("Məhsul ID-si təyin edilməyib.");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchProduct(), fetchCreditSettings()]).finally(() =>
      setLoading(false)
    );
  }, [productId]);


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
          <p className="text-red-800 font-semibold mb-4">
            Xəta: {error || "Məhsul məlumatı əldə edilmədi."}
          </p>
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


  const mainImage =
    product.main_image_link && typeof product.main_image_link === "string"
      ? product.main_image_link
      : "";

  const weightInGrams = getWeightGrams(product.weight);
  const formattedWeight =
    weightInGrams > 0
      ? `${weightInGrams.toFixed(2)}q`
      : product.weight || "N/A";

  const isCreditAvailable =
    creditSettings && priceAZN > 0 && availableMonths.length > 0;
  const isCreditSelected = selectedCreditMonth && selectedMonthlyPayment > 0;

  const whatsappButtonText = isCreditSelected
    ? "Kreditlə Sifariş Et"
    : "Sifariş Et / Məlumat Al";

  const whatsappMessage = isCreditSelected
    ? // Kredit seçimi varsa, kredit şərtlərini daxil edirik
      `Mən ${product.title} (Kod: ${
        product.article || product.slug || "N/A"
      }) məhsulunu ${selectedCreditMonth} aylıq kreditə (${selectedMonthlyPayment.toFixed(
        2
      )} ₼/ay) almaq istəyirəm. Qiymət: ${priceAZN.toFixed(2)} ₼.`
    : // Kredit seçimi yoxdursa, ümumi məlumat göndəririk
      `Mən ${product.title} (Kod: ${
        product.article || "N/A"
      }) məhsulu ilə maraqlanıram. Qiyməti: ${priceAZN.toFixed(2)} ₼.`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mt-2 mb-4 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Kataloqa qayıt
      </button>

      <div className="bg-white rounded-xl shadow-xl border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* ⬅️ LEFT COLUMN: IMAGE */}
          <div className="flex-shrink-0">
            <div className="h-full min-h-[400px] max-h-[70vh] overflow-hidden rounded-xl bg-gray-100 shadow-inner flex items-center justify-center">
              <img
                src={mainImage}
                alt={product.title}
                className="w-full h-full object-contain p-4"
              />
            </div>
          </div>

          {/* ➡️ RIGHT COLUMN: DETAILS AND ACTIONS */}
          <div className="flex flex-col">
            {/* Başlıq və Stok/Kod */}
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {product.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-semibold">
                  Kateqoriya: {product.category_name}
                </span>
                <span
                  className={`flex-shrink-0 font-medium px-2 py-0.5 rounded text-xs border ${getAvailabilityColor(
                    product.availability
                  )}`}
                >
                  {getAvailabilityText(product.availability)} {/* ⬅️ YENİLƏNMİŞ HİSSƏ */}
                </span>
              </div>
            </div>

            {/* Qiymət Bloku */}
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-extrabold text-amber-700">
                  {priceAZN.toFixed(2)} ₼
                </span>
                {product.discount > 0 && (
                  <span className="ml-3 text-lg font-semibold text-red-500 line-through">
                    Endirim: -{product.discount}%
                  </span>
                )}
              </div>
            </div>

            {/* MƏHSUL XÜSUSİYYƏTLƏRİ */}
            <div className="flex gap-8 border-y border-gray-200 py-3 mb-6">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">
                  Material / Əyar:
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {product.material || product.metal || "N/A"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">Çəki:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formattedWeight}
                </span>
              </div>
              {product.carat && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">
                    Karat:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {product.carat}
                  </span>
                </div>
              )}
            </div>

            {/* KREDİT KALKULYATORU - Yalnız Input */}
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 mb-6">
              <div className="mb-4">
              </div>

              {/* KREDİT ŞƏRTLƏRİ (4 müddət) */}
              {isCreditAvailable && creditSettings && (
                <>
                  <div className="flex items-center gap-2 mb-3 mt-4">
                    <Calculator className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-bold text-gray-800">
                      Kredit Şərtləri ({creditSettings.percent}%)
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {availableMonths.map((m) => {
                      const monthlyPayment = calculatedPayments[m] ?? 0;
                      const isSelected = selectedCreditMonth === m;

                      return (
                        <button
                          key={m}
                          onClick={() => setSelectedCreditMonth(m)}
                          className={`w-full p-3 rounded-xl border-2 transition-all flex justify-between items-center text-left ${
                            isSelected
                              ? "bg-amber-100 border-amber-500 shadow-md ring-2 ring-amber-300"
                              : "bg-white border-gray-300 hover:border-amber-400"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? "text-amber-700" : "text-gray-600"
                              }`}
                            >
                              {m} ay
                            </span>
                            <span className="text-xs text-gray-500">
                              MÜDDƏT
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span
                              className={`text-xl font-extrabold ${
                                isSelected ? "text-amber-800" : "text-gray-900"
                              }`}
                            >
                              {monthlyPayment > 0
                                ? monthlyPayment.toFixed(2)
                                : "---"}{" "}
                              ₼
                            </span>
                            <span className="text-xs text-gray-500">
                              AYLIQ ÖDƏNİŞ
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ⬇️ TƏK WHATSAPP DÜYMƏSİ */}
            <div className="flex flex-col gap-3 mt-auto pt-4">
              <a
                href={`https://wa.me/994702229284?text=${encodeURIComponent(
                  whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-3 w-full py-3 rounded-lg font-semibold transition-colors shadow-lg ${
                  isCreditSelected
                    ? "bg-green-500 hover:bg-green-600 text-white animate-pulse"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>{whatsappButtonText}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Təsvir */}
        {product.description && (
          <div className="px-6 pb-6 pt-4 border-t border-gray-100 mt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Məhsul Təsviri
            </h2>
            <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}