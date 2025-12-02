import { Product } from '../lib/supabase';

interface ProductCardProps {
  product: Product;
  onViewDetails: (id: string) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
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

  // Qiymətin hesabatı (kod dəyişdirilmədi)
  const price = (product.price_azn || product.price_usd * 1.7).toFixed(2);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200">
      <div
        // Şəklin aspekt nisbəti qorunur (aspect-square), lakin padding yoxdur,
        // bu da card-ın ümumi hündürlüyünün yığcam qalmasına kömək edir.
        className="aspect-square overflow-hidden bg-gray-100 relative cursor-pointer"
        onClick={() => onViewDetails(product.id)}
      >
        <img
          src={product.main_image}
          alt={product.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {product.has_diamond && (
          <div className="absolute top-3 right-3 bg-amber-500 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            💎 Brilyant
          </div>
        )}
      </div>
      <div className="p-4 pt-3"> {/* Padding azaldıldı: p-5 -> p-4 pt-3 */}
        <div className="flex items-start justify-between mb-1"> {/* Margin azaldıldı: mb-2 -> mb-1 */}
          <h3
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-amber-600 transition-colors" // Başlıq text-xl -> text-lg
            onClick={() => onViewDetails(product.id)}
          >
            {product.title}
          </h3>
        </div>

        <p className="text-xs text-gray-500 mb-3">{product.category}</p> {/* Kateqoriya text-sm -> text-xs və rəng tündlüyü azaldıldı */}

        <div className="space-y-1 mb-3"> {/* Margin və space azaldıldı: space-y-2 -> space-y-1, mb-4 -> mb-3 */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Əyar:</span>
            <span className="font-medium text-gray-900">{product.material || product.metal}</span>
          </div>
          {product.karat && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Karat:</span>
              <span className="font-medium text-gray-900">{product.karat}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Çəki:</span>
            <span className="font-medium text-gray-900">{product.weight_grams || product.weight}q</span>
          </div>
          {product.gemstone_type && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Daş:</span>
              <span className="font-medium text-gray-900">{product.gemstone_type}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-2 mt-2"> {/* items-center ilə hiza təmin edildi */}
            <span className="text-gray-700 font-semibold">Qiymət:</span>
            <span className="font-bold text-amber-600 text-base">{price} ₼</span> {/* Qiymət text-lg -> text-base (kiçildildi) */}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1"> {/* Padding əlavə edildi: pt-1 */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(product.availability)}`}> {/* Padding azaldıldı: px-3 py-1 -> px-2 py-0.5 */}
            {product.availability}
          </span>
          <button
            onClick={() => onViewDetails(product.id)}
            className="text-sm font-semibold text-gray-900 hover:text-amber-600 transition-colors"
          >
            Ətraflı →
          </button>
        </div>
      </div>
    </div>
  );
}