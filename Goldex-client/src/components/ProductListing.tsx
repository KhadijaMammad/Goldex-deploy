import  { useState, useMemo, useEffect, useCallback } from 'react';
import { ProductCard } from './ProductCard'; 
import { CategoryTabs } from './CategoryTabs'; 

import { Product } from '../types/products/product.type'; 
import { Category } from '../types/categories/category.type'; 

const API_URL = import.meta.env.VITE_API_URL;
const CATEGORIES_API_URL = `${API_URL}/categories`; 
const PRODUCTS_API_URL = `${API_URL}/products`; 

type CategoryId = number | null; 

export function ProductListingPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<CategoryId>(null);
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState<string | null>(null);

    const headerHeight = 64; 

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const categoriesRes = await fetch(CATEGORIES_API_URL);
            if (!categoriesRes.ok) throw new Error(`Kateqoriyaları çəkərkən xəta: ${categoriesRes.status}`);
            const categoriesData: Category[] = await categoriesRes.json();
            setCategories(categoriesData);

            const productsRes = await fetch(PRODUCTS_API_URL);
            if (!productsRes.ok) throw new Error(`Məhsulları çəkərkən xəta: ${productsRes.status}`);
            const productsData: Product[] = await productsRes.json();
            setAllProducts(productsData);

        } catch (err) {
            console.error("API Error:", err);
            setError("Məlumatları serverdən çəkərkən problem yaşandı.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCategorySelect = (categoryId: CategoryId) => {
        setSelectedCategory(categoryId);
    };

    const filteredProducts = useMemo(() => {
        if (selectedCategory === null || selectedCategory === 0) {
            return allProducts; 
        }

        return allProducts.filter(product => product.category_id === selectedCategory);
    }, [selectedCategory, allProducts]); 
    
    //  Render hissəsi

    if (isLoading) {
        return <div className="text-center py-20 text-xl text-gray-600"> Məlumatlar yüklənir...</div>;
    }

    if (error) {
        return <div className="text-center py-20 text-xl text-red-600"> Xəta: {error}</div>;
    }

    return (
        <div className="min-h-screen bg-white">
            
            <CategoryTabs 
                categories={categories} 
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect} 
                headerHeight={headerHeight}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="flex flex-wrap justify-start gap-6">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                onViewDetails={(id) => console.log('Detal səhifəsinə keçid:', id)}
                            />
                        ))
                    ) : (
                        <p className="text-gray-500 text-lg py-10">Seçilmiş kateqoriyada heç bir məhsul tapılmadı.</p>
                    )}
                </div>
            </main>
        </div>
    );
}