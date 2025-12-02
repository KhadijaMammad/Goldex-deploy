import { useState, useEffect } from 'react';
import { supabase, Product } from '../lib/supabase';
import { ProductCard } from './ProductCard';
import { Loader2 } from 'lucide-react';

interface ProductGridProps {
  onViewDetails: (id: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  // headerHeight silindi
}

export function ProductGrid({
  onViewDetails,
  selectedCategory,
  // onCategoryChange, // Artıq bu komponentin içində istifadə edilmir, lakin prop kimi saxlamaq olar.
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  // const [categories, setCategories] = useState<string[]>([]); // Silindi
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

      // Kateqoriya məntiqi silindi
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

  // ... (Error və products.length === 0 yoxlamaları)

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
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-1 md:gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} onViewDetails={handleViewDetails} />
        ))}
      </div>
    </div>
  );
}