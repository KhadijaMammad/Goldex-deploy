// ProductGrid.tsx

import { ProductCard } from "./ProductCard";
import { Loader2 } from "lucide-react";
import { Product } from "../types/products/product.type";

// ProductGridProps tipini tətbiqinizdəki reallığa uyğunlaşdırmalısınız
interface ProductGridProps {
  products: Product[]; // Artıq filtrlənmiş məhsullar massivi
  loading: boolean;
  error: string | null;
  selectedCategoryName: string | null; // Boş mesajlar üçün kateqoriya adı
  onViewDetails: (id: number) => void;
}

export function ProductGrid({
  products,
  loading,
  error,
  selectedCategoryName,
  onViewDetails,
}: ProductGridProps) {
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600 mb-2">Xəta baş verdi</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    const categoryName = selectedCategoryName ? ` (${selectedCategoryName})` : '';
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-gray-600">
          {selectedCategoryName ? `Bu kateqoriyada məhsul yoxdur${categoryName}` : "Məhsul yoxdur"}
        </p>
      </div>
    );
  }

  const handleViewDetails = (id: number) => {
    onViewDetails(id);
  };

  return (
    <div>
      <div
        className="grid 
          grid-cols-2          /* Kiçik ekranlar üçün 2 sütun */
          md:grid-cols-3       /* Orta ekranlar üçün 3 sütun */
          lg:grid-cols-4       /* Böyük ekranlar üçün mütləq 4 sütun */
          gap-3                /* Kartlar arasındakı boşluq (~12px) */
          p-2                  /* Kənarlarda kiçik boşluq */
        "
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>
    </div>
  );
}