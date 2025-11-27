import { useState, useEffect } from 'react';
import { supabase, Product } from '../lib/supabase';
import { ArrowLeft, Loader2, Package, Weight, Layers, DollarSign } from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
}

export function ProductDetail({ productId, onBack }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Məhsul yüklənmədi');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || 'Məhsul tapılmadı'}
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    if (lower.includes('mövcuddur') || lower.includes('in stock')) {
      return 'bg-emerald-100 text-emerald-800';
    }
    if (lower.includes('mövcud deyil') || lower.includes('out of stock')) {
      return 'bg-red-100 text-red-800';
    }
    if (lower.includes('sifarişlə') || lower.includes('made to order')) {
      return 'bg-amber-100 text-amber-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const allImages = [product.main_image, ...product.additional_images];

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Kataloqa qayıt
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          <div>
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`aspect-square overflow-hidden rounded-lg bg-gray-100 border-2 transition-all ${
                      selectedImage === image
                        ? 'border-blue-600 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h1>
                <p className="text-lg text-gray-600">{product.category}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getAvailabilityColor(product.availability)}`}>
                {product.availability}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Xüsusiyyətlər</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-gray-600">Əyar</span>
                    <span className="font-medium text-gray-900">{product.metal}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-gray-600">Karat</span>
                    <span className="font-medium text-gray-900">{product.karat}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Weight className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-gray-600">Çəki</span>
                    <span className="font-medium text-gray-900">{product.weight}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-gray-600">Qiymət</span>
                    <span className="font-medium text-gray-900">${product.price_usd.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Təsvir</h2>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
            <div>
              <ProductDetailModal productId={''} onClose={function (): void {
                throw new Error('Function not implemented.');
              } } />
            </div>

            <div className="mt-auto">
              <button
                onClick={onBack}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Daha çox məhsul
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
