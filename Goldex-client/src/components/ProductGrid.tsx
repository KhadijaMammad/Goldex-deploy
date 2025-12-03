import { useState, useEffect } from 'react';
import axios from 'axios'; // ⬅️ axios import edildi
import { ProductCard } from './ProductCard';
import { Loader2 } from 'lucide-react';
import { Product, ProductGridProps } from '../types/products/product.type';

const API_URL = import.meta.env.VITE_API_URL;

export function ProductGrid({
  onViewDetails,
  selectedCategory,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true); 
    setError(null);

    try {
      const response = await axios.get<Product[]>(`${API_URL}/products`);
      const data = response.data;

      setProducts(data || []); 
      
    } catch (err) {
      let errorMessage = 'Məhsulları yükləmək mümkün olmadı';
      
      if (axios.isAxiosError(err)) {
        // HTTP cavabı varsa (məsələn, 404, 500)
        if (err.response) {
          errorMessage = `Server Xətası: ${err.response.status} - ${err.response.statusText}`;
        } 
        // Sorğu göndərilib, lakin cavab gəlməyibsə
        else if (err.request) {
          errorMessage = 'Serverə qoşulma xətası. Şəbəkə problemi ola bilər.';
        } 
        // Başqa bir xəta
        else {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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

  if (products.length === 0 && !selectedCategory) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-gray-600">Məhsul yoxdur</p>
      </div>
    );
  }
  
  if (filteredProducts.length === 0 && selectedCategory) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-gray-600">Bu kateqoriyada məhsul yoxdur</p>
      </div>
    );
  }


  const handleViewDetails = (id: number) => {
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