import { useState, useEffect, useCallback, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import axios from "axios";
import { X, Loader2, Calculator, MessageCircle } from "lucide-react";
import { ImageWithSkeleton } from "./ImageWithSkeleton";
import {
  Product,
  ProductDetailModalProps,
} from "../types/products/product.type";
import { CreditOptionDetail } from "../types/credits/credit.type";

const API_URL = import.meta.env.VITE_API_URL;

export function ProductDetailModal({
  productId,
  onClose,
}: ProductDetailModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  const [creditOptionDetails, setCreditOptionDetails] =
    useState<CreditOptionDetail | null>(null);
  const [selectedCreditMonth, setSelectedCreditMonth] = useState<number | null>(
    null
  );

  // Qiymət hesablamasında null/undefined yoxlamaları
  const finalPrice = product?.custom_price && typeof product.custom_price === 'number'
    ? product.custom_price
    : 0;

  // Çəki formatlanması üçün köməkçi funksiya (Əvvəlki koddan saxlanılıb)
  const formatWeight = (
    weightGrams: number | string | null | undefined,
    weight: number | string | null | undefined
  ): string => {
    if (
      typeof weightGrams === "number" &&
      !isNaN(weightGrams) &&
      weightGrams > 0
    ) {
      return `${weightGrams}q`;
    }
    if (typeof weight === "string" && weight) {
      return weight.includes('g') ? weight : `${weight}q`;
    }
    return "N/A";
  };
  
  // Calculate credit payment (DÜZƏLİŞ: interestPercent adını percent olaraq dəyişirik)
  const calculateCreditPayment = useCallback((months: number, interestPercent: number) => {
    if (finalPrice <= 0 || !interestPercent || isNaN(interestPercent) || months <= 0) return 0;

    // Sadə faiz düsturu: Total Amount = Price * (1 + Rate * Time)
    const monthlyRate = interestPercent / 100;
    const totalAmount = finalPrice * (1 + monthlyRate * (months / 12));
    return totalAmount / months;
  }, [finalPrice]);


  // 1. Məhsulu çəkmək
  async function fetchProduct() {
    try {
      const response = await axios.get<Product>(
        `${API_URL}/products/${productId}`
      );

      const data = response.data;

      if (data && data.id) {
        setProduct(data);

        if (typeof data.main_image_link === "string" && data.main_image_link) {
          setSelectedImage(data.main_image_link);
        }
      } else {
        setError("Məhsul məlumatları tapılmadı.");
      }
    } catch (err) {
      setError("Məhsul yüklənərkən xəta baş verdi.");
      console.error("Error fetching product:", err);
    }
  }

  // 2. Kredit tənzimləmələrini çəkmək
  async function fetchCreditOptions() {
    try {
      const response = await axios.get<CreditOptionDetail[]>(
        `${API_URL}/credit_options`
      );

      const options = response.data;

      const creditOptionName = "City Finance";

      if (options && options.length > 0) {
        
        const selectedOption =
          options.find(
            (opt: CreditOptionDetail) => opt.name === creditOptionName
          ) || options[0];

        if (selectedOption) {
          setCreditOptionDetails(selectedOption);

          // DÜZƏLİŞ: API adlarını istifadə edirik: min_months, max_months
          const minMonth = selectedOption.min_months ?? 3; 
          const maxMonth = selectedOption.max_months ?? 18;
          
          if (finalPrice > 0) {
              // Mövcud aylardan minimuma ən yaxın olanı seçirik
              const availableMonths = [3, 6, 9, 12, 18].filter(m => m >= minMonth && m <= maxMonth);
              if (availableMonths.length > 0) {
                  setSelectedCreditMonth(availableMonths[0]);
              }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching credit options:", err);
    }
  }

  // Effect - Məhsul və Kredit opsiyalarını çəkir
  useEffect(() => {
    if (!productId) {
        setLoading(false);
        setError("Məhsul ID-si təyin edilməyib.");
        return;
    }
    setLoading(true);

    Promise.all([fetchProduct(), fetchCreditOptions()]).finally(() =>
      setLoading(false)
    );
  }, [productId]);


  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!product || error) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 text-center shadow-2xl max-w-sm w-full">
                <p className="text-red-700 font-semibold mb-4">{error || 'Məhsul yüklənərkən naməlum xəta baş verdi.'}</p>
                <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                    <X className="w-4 h-4" />
                    Bağla
                </button>
            </div>
        </div>
    );
  }

  const safeAdditionalImages = Array.isArray(product.additional_images)
    ? product.additional_images.filter(
        (img: string | any[]): img is string => typeof img === "string" && img.length > 0
      )
    : [];

  const allImages = [product.main_image]
    .filter((img): img is string => typeof img === "string" && img.length > 0)
    .concat(safeAdditionalImages);

  
  // DÜZƏLİŞ: creditOptionDetails.percent istifadə olunur
  const selectedMonthlyPayment = selectedCreditMonth && creditOptionDetails 
    ? calculateCreditPayment(selectedCreditMonth, creditOptionDetails.percent ?? 0)
    : 0;

  // Kreditin qiymət limitlərinə uyğun olub-olmaması yoxlanılır (price_min/max fərz edilir)
  const isCreditAvailableByPrice = creditOptionDetails && finalPrice >= (creditOptionDetails.min_months ?? 0) && finalPrice <= (creditOptionDetails.max_months ?? Infinity);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{product.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Images */}
            <div>
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4 relative">
                <ImageWithSkeleton
                  src={selectedImage}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
                {product.has_diamond && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    💎 Brilyant
                  </div>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image)}
                      className={`aspect-square overflow-hidden rounded-lg bg-gray-100 border-2 transition-all ${
                        selectedImage === image
                          ? "border-amber-600 ring-2 ring-amber-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <ImageWithSkeleton
                        src={image}
                        alt={`${product.title} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div>
              <div className="mb-6">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mb-3">
                  {product.category || `Kateqoriya ID: ${product.category_id}`}
                </span>
                <p className="text-4xl font-bold text-amber-600 mb-2">
                  {finalPrice.toFixed(2)} ₼
                </p>
                {product.article && (
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    Məhsul kodu:{" "}
                    <span className="text-gray-900">{product.article}</span>
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  {product.stock_status || "Stok vəziyyəti məlum deyil"} • {product.production_status || "İstehsal statusu məlum deyil"}
                </p>
              </div>

              {/* Specifications */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Xüsusiyyətlər
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Əyar:</span>
                    <span className="font-medium text-gray-900">
                      {product.material || product.metal || "N/A"}
                    </span>
                  </div>
                  {product.carat && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Karat:</span>
                      <span className="font-medium text-gray-900">
                        {product.carat}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Çəki:</span>
                    <span className="font-medium text-gray-900">
                      {formatWeight(product.weight_grams, product.weight)}
                    </span>
                  </div>
                  {product.gemstone_type && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daş növü:</span>
                        <span className="font-medium text-gray-900">
                          {product.gemstone_type}
                        </span>
                      </div>
                      {product.gemstone_carat && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Daş çəkisi:</span>
                          <span className="font-medium text-gray-900">
                            {product.gemstone_carat}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {product.size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ölçü:</span>
                      <span className="font-medium text-gray-900">
                        {product.size}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Təsvir</h3>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line"> 
                    {product.description}
                  </p>
                </div>
              )}

              {product.featured_flags && product.featured_flags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {product.featured_flags.map((flag: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | null | undefined, index: Key | null | undefined) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Kredit məntiqi - Yalnız qiymət limitlərinə uyğundursa göstərilir */}
              {creditOptionDetails && isCreditAvailableByPrice ? (
                <div className="bg-gradient-to-br from-lime-50 via-emerald-50 to-teal-50 rounded-lg p-5 border-2 border-emerald-200 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-5 h-5 text-teal-700" />
                      <h3 className="font-semibold text-gray-900">
                        Kredit Variantları ({creditOptionDetails.name})
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 italic mb-4">
                        Minimum ödəniş: {creditOptionDetails.price_min} ₼, Maksimum ödəniş: {creditOptionDetails.price_max} ₼
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[3, 6, 9, 12, 18]
                        .filter(
                          (month) =>
                            // DÜZƏLİŞ: API adlarını istifadə edirik: min_months, max_months
                            month >= (creditOptionDetails.min_months ?? 0) &&
                            month <= (creditOptionDetails.max_months ?? 999)
                        )
                        .map((month) => {
                          const monthlyPayment = calculateCreditPayment(
                            month,
                            creditOptionDetails.percent ?? 0 // DÜZƏLİŞ: percent istifadə olunur
                          );
                          const isSelected = selectedCreditMonth === month;
                          return (
                            <button
                              key={month}
                              onClick={() => setSelectedCreditMonth(month)}
                              className={`p-4 rounded-lg border-2 shadow-sm transition-all ${
                                isSelected
                                  ? "bg-teal-200 border-teal-400 ring-2 ring-teal-300"
                                  : "bg-white border-gray-200 hover:border-teal-300"
                              }`}
                            >
                              <div className="text-center">
                                <p className="text-lg font-bold text-gray-900 mb-1">
                                  {month} ay
                                </p>
                                <p className="text-2xl font-bold text-teal-700">
                                  {monthlyPayment.toFixed(2)} ₼
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  aylıq ödəniş
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>

                    {/* WhatsApp Button - Shows when credit month selected */}
                    {selectedCreditMonth && selectedMonthlyPayment > 0 && (
                      <a
                        href={`https://wa.me/994702229284?text=${encodeURIComponent(
                          `Mən ${product.title} (Kod: ${
                            product.article || "N/A"
                          }) məhsulunu ${selectedCreditMonth} aylıq kreditə (${selectedMonthlyPayment.toFixed(2)} ₼/ay) almaq istəyirəm.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors shadow-lg animate-pulse mt-4"
                      >
                        <MessageCircle className="w-6 h-6" />
                        <span>Kreditlə Sifariş Et</span>
                      </a>
                    )}
                </div>
              ) : (
                // Kredit mövcud deyilsə və ya qiymət uyğun deyilsə
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mt-4">
                    Bu məhsul üçün kredit imkanı **mövcud deyil** və ya qiymət şərtlərə uyğun gəlmir ({creditOptionDetails?.price_min} ₼ - {creditOptionDetails?.price_max} ₼).
                </div>
              )}
              
              {/* General WhatsApp Button - Kredit məntiqi göstərilməsə də göstərilir */}
              <a
                href={`https://wa.me/994702229284?text=${encodeURIComponent(
                    `Mən ${product.title} (Kod: ${product.article || "N/A"}) məhsulu ilə maraqlanıram. Qiyməti: ${finalPrice.toFixed(2)} ₼.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-lg font-semibold transition-colors shadow-lg mt-6"
              >
                <MessageCircle className="w-6 h-6" />
                <span>Məhsul haqqında məlumat al / Sifariş et</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;