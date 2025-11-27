import { useState, useEffect } from 'react';
import { supabase, Product } from '../lib/supabase';
import { ProductCard } from './ProductCard';
import { Loader2, Filter } from 'lucide-react';

interface ProductGridProps {
  onViewDetails: (id: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  headerHeight: number; 
}

export function ProductGrid({
  onViewDetails,
  selectedCategory,
  onCategoryChange,
  headerHeight,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);

      const uniqueCategories = Array.from(new Set(data?.map(p => p.category) || []));
      setCategories(uniqueCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Məhsulları yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

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
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-gray-600">Məhsul yoxdur</p>
      </div>
    );
  }

  const handleViewDetails = (id: string) => {
    onViewDetails(id);
  };

  return (
    <div>
      {/* Sticky Category Section */}
      <div
        className="bg-white rounded-lg shadow-md p-4 mb-6 sticky z-20"
        style={{ top: `${headerHeight}px` }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Filter className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">Kateqoriya</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-amber-500 text-gray-900'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hamısı
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-amber-500 text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} onViewDetails={handleViewDetails} />
        ))}
      </div>
    </div>
  );
}
