import { ProductCard } from "./ProductCard";
import { Loader2 } from "lucide-react";
import { Product } from "../types/products/product.type";

interface ProductGridProps {
    products: Product[]; 
    loading: boolean;
    error: string | null;
    selectedCategoryName: string | null; 
    onViewDetails: (id: number) => void;
    
    onLoadMore: () => void;
    hasMore: boolean;
    currentPage: number;
}

export function ProductGrid({
    products,
    loading,
    error,
    selectedCategoryName,
    onViewDetails,
    onLoadMore,
    hasMore,
    currentPage,
}: ProductGridProps) {
    
    if (loading && currentPage === 1) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
        );
    }

    if (error && currentPage === 1) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <p className="text-red-600 mb-2">Xəta baş verdi</p>
                    <p className="text-sm text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (products.length === 0 && !loading) {
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
            <h1 className="text-2xl font-extrabold text-gray-800 mb-6">
                {selectedCategoryName || "Bütün Məhsullar"}
            </h1>
            
            <div
                className="grid 
                    grid-cols-2          /* Kiçik ekranlar üçün 2 sütun */
                    md:grid-cols-3       /* Orta ekranlar üçün 3 sütun */
                    lg:grid-cols-4       /* Böyük ekranlar üçün mütləq 4 sütun */
                    gap-4                /* Kartlar arasındakı boşluq */
                    pb-4                 /* Düymə üçün aşağıda boşluq */
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

        
            {loading && currentPage > 1 && (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                </div>
            )}

            {hasMore && !loading && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={onLoadMore}
                        className="px-8 py-3 bg-gray-800 text-amber-400 font-semibold rounded-lg shadow-xl hover:bg-gray-700 transition duration-300 transform hover:scale-[1.01]"
                        disabled={loading} 
                    >
                        Daha çox məhsul yüklə ({products.length} məhsul var)
                    </button>
                </div>
            )}
            
            {!hasMore && products.length > 0 && (
                <div className="flex justify-center mt-8 text-gray-500">
                    <p>Bütün məhsullar yükləndi.</p>
                </div>
            )}
            
        </div>
    );
}