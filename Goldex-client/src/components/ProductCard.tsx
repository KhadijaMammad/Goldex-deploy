// ProductCard.tsx

import { ProductCardProps } from "../types/products/product.type";

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  
  // Mövcudluq rəngini təyin edən funksiya (dəyişməz qalır)
  const getAvailabilityColor = (availability: string | null | undefined) => {
    const safeAvailability =
      typeof availability === "string" ? availability : "";
    const lower = safeAvailability.toLowerCase();

    if (lower.includes("mövcuddur") || lower.includes("in stock")) {
      return "bg-emerald-100 text-emerald-800";
    }
    if (lower.includes("mövcud deyil") || lower.includes("out of stock")) {
      return "bg-red-100 text-red-800";
    }
    if (lower.includes("sifarişlə") || lower.includes("made to order")) {
      return "bg-amber-100 text-amber-800";
    }
    return "bg-gray-100 text-gray-800";
  };


  const price = (
    typeof product.custom_price === "number" ? product.custom_price : 0
  ).toFixed(2);


  // Düzəliş 2: Çəki.
  // product.weight artıq string ("3.5g") formatında gəlir.
  const formattedWeight = product.weight || "N/A";


  // NOTE: product.has_diamond, product.category, product.carat, product.gemstone_type 
  // sahələrinin mövcudluğunu fərz edirik (köhnə kodda da var idi).

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200">
      <div
        className="aspect-square overflow-hidden bg-gray-100 relative cursor-pointer"
        onClick={() => onViewDetails(product.id)}
      >
        <img
          src={product.main_image_link ?? ""}
          alt={product.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {/* product.has_diamond artıq yeni Product interfeysində yoxdur, 
            lakin bu funksionallığı saxlamaq üçün fərz edirik ki, siz onu 
            is_active / is_new kimi is_diamond kimi bir boolean sahə ilə əvəz etmisiniz, 
            yoxsa bu hissə xəta verə bilər. Əgər 'has_diamond' yoxdursa, 'gemstone_type' istifadə edə bilərik.
            İndi kodu sizin köhnə kodunuzda olduğu kimi saxlayıram, lakin diqqətli olun. */}
        {/* Fərz edilir ki, Product tipinizdə has_diamond yenidən əlavə edilib VƏ YA gemstone_type istifadə olunur */}
        {product.gemstone_type && product.gemstone_type.toLowerCase().includes("brilyant") && (
          <div className="absolute top-3 right-3 bg-amber-500 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            💎 Brilyant
          </div>
        )}
      </div>
      <div className="p-4 pt-3">
        <div className="flex items-start justify-between mb-1">
          <h3
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-amber-600 transition-colors"
            onClick={() => onViewDetails(product.id)}
          >
            {product.title}
          </h3>
        </div>

        {/* category sahəsi yoxdur, category_id var. category sahəsini fərz edirik */}
        <p className="text-xs text-gray-500 mb-3"> {product.name}</p>

        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Əyar:</span>
            <span className="font-medium text-gray-900">
              {product.material}
            </span>
          </div>
          {/* Karat null ola bilər, amma string olaraq istifadə edilir */}
          {/* {product.carat && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Karat:</span>
              <span className="font-medium text-gray-900">{product.carat}</span>
            </div>
          )} */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Çəki:</span>
            <span className="font-medium text-gray-900">{formattedWeight}</span>
          </div>
          {product.gemstone_type && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Daş:</span>
              <span className="font-medium text-gray-900">
                {product.gemstone_type}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-2 mt-2">
            <span className="text-gray-700 font-semibold">Qiymət:</span>
            <span className="font-bold text-amber-600 text-base">
              {price} ₼
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(
              product.availability
            )}`}
          >
            {product.availability || "N/A"}
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