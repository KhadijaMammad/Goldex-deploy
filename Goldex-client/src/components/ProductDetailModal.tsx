import { useState, useEffect } from 'react';
import { supabase, Product } from '../lib/supabase';
import { X, Loader2, Calculator, MessageCircle } from 'lucide-react';

interface ProductDetailModalProps {
  productId: string;
  onClose: () => void;
}

export function ProductDetailModal({ productId, onClose }: ProductDetailModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creditOptionDetails, setCreditOptionDetails] = useState<{
    months_min: number;
    months_max: number;
    interest_percent: number;
  } | null>(null);
  const [selectedCreditMonth, setSelectedCreditMonth] = useState<number | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

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
        setSelectedImage(data.main_image);

        // Fetch credit option details if product has one selected
        if (data.selected_credit_option) {
          await fetchCreditOption(data.selected_credit_option);
        }
      }
    } catch (err) {
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCreditOption(optionName: string) {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'credit_options')
        .maybeSingle();

      if (data) {
        const options = JSON.parse(data.value);
        const selectedOption = options.find((opt: any) => opt.name === optionName);
        if (selectedOption) {
          setCreditOptionDetails(selectedOption);
        }
      }
    } catch (err) {
      console.error('Error fetching credit option:', err);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const allImages = [product.main_image, ...product.additional_images];
  const price = product.price_azn || product.price_usd * 1.7;

  // Calculate credit payment
  const calculateCreditPayment = (months: number, interestPercent: number) => {
    const monthlyRate = interestPercent / 100 / 12;
    const totalAmount = price * (1 + monthlyRate * months);
    return totalAmount / months;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{product.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Images */}
            <div>
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4 relative">
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
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
                          ? 'border-amber-600 ring-2 ring-amber-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
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
                  {product.category}
                </span>
                <p className="text-4xl font-bold text-amber-600 mb-2">{price.toFixed(2)} ₼</p>
                {product.article && (
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    Məhsul kodu: <span className="text-gray-900">{product.article}</span>
                  </p>
                )}
                <p className="text-sm text-gray-600">{product.stock_status} • {product.production_status}</p>
              </div>

              {/* Specifications */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Xüsusiyyətlər</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Material:</span>
                    <span className="font-medium text-gray-900">{product.material || product.metal}</span>
                  </div>
                  {product.karat && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Karat:</span>
                      <span className="font-medium text-gray-900">{product.karat}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Çəki:</span>
                    <span className="font-medium text-gray-900">{product.weight_grams || product.weight}q</span>
                  </div>
                  {product.gemstone_type && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daş növü:</span>
                        <span className="font-medium text-gray-900">{product.gemstone_type}</span>
                      </div>
                      {product.gemstone_carat && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Daş çəkisi:</span>
                          <span className="font-medium text-gray-900">{product.gemstone_carat}</span>
                        </div>
                      )}
                    </>
                  )}
                  {product.size && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ölçü:</span>
                      <span className="font-medium text-gray-900">{product.size}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Təsvir</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {product.featured_flags && product.featured_flags.length > 0 && (
                <div className="mb-4 flex gap-2">
                  {product.featured_flags.map((flag, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {flag}
                    </span>
                  ))}
                </div>
              )}

              {/* General WhatsApp Button - Always shows */}
              <a
                href="https://wa.me/994702229284"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors shadow-lg mb-6"
              >
                <MessageCircle className="w-6 h-6" />
                <span>Almaq üçün WhatsApp-a yaz</span>
              </a>

              {/* Credit Options Grid */}
              {creditOptionDetails && (
                <div className="bg-gradient-to-br from-lime-50 via-emerald-50 to-teal-50 rounded-lg p-5 border-2 border-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-5 h-5 text-teal-700" />
                    <h3 className="font-semibold text-gray-900">Kredit Variantları</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <img src="/city logo.jpg" alt="City Finance" className="h-8 object-contain" />
                    <span className="text-xs text-gray-600 italic">City Finance tərəfindən</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[3, 6, 9, 12, 18]
                      .filter(month => month >= creditOptionDetails.months_min && month <= creditOptionDetails.months_max)
                      .map((month, index) => {
                        const monthlyPayment = calculateCreditPayment(month, creditOptionDetails.interest_percent);
                        const isEven = index % 2 === 0;
                        const isSelected = selectedCreditMonth === month;
                        return (
                          <button
                            key={month}
                            onClick={() => setSelectedCreditMonth(month)}
                            className={`p-4 rounded-lg border-2 shadow-sm transition-all ${
                              isSelected
                                ? 'bg-teal-200 border-teal-400 ring-2 ring-teal-300'
                                : isEven
                                ? 'bg-lime-100 border-lime-300 hover:border-lime-400'
                                : 'bg-teal-100 border-teal-300 hover:border-teal-400'
                            }`}
                          >
                            <div className="text-center">
                              <p className="text-lg font-bold text-gray-900 mb-1">{month} ay</p>
                              <p className="text-2xl font-bold text-teal-700">{monthlyPayment.toFixed(2)} ₼</p>
                              <p className="text-xs text-gray-600 mt-1">aylıq ödəniş</p>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {/* WhatsApp Button - Shows when credit month selected */}
                  {selectedCreditMonth && (
                    <a
                      href={`https://wa.me/994702229284?text=${encodeURIComponent(
                        `Mən ${product.article || 'N/A'} məhsul kodlu, məhsulu ${selectedCreditMonth} aylıq kreditə almaq istəyirəm.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors shadow-lg animate-pulse"
                    >
                      <MessageCircle className="w-6 h-6" />
                      <span>WhatsApp ilə əlaqə saxla</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
