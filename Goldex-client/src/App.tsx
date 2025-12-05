// App.tsx

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { ProductGrid } from "./components/ProductGrid";
import { ProductDetail } from "./components/ProductDetail";
import { CreditCalculator } from "./components/CreditCalculator";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CategoryTabs } from "./components/CategoryTabs";
import { CategoryDropdown } from "./components/CategoryDropdown";
import { Settings } from "lucide-react";

// TİPLƏRİ İMPORT EDİN
import { Category } from "./types/categories/category.type";
import { Product } from "./types/products/product.type";

const API_URL = import.meta.env.VITE_API_URL;
type View = "catalog" | "detail" | "admin-login" | "admin-dashboard";
type ProductIdType = number;
type CategoryIdType = number | null; 

const WIDE_CONTAINER_CLASSES = "xl:max-w-[1400px] 2xl:max-w-[1500px]";

function App() {
    // --- MƏHSUL VƏ FİLTRLƏMƏ STATE'LƏRİ ---
    const [view, setView] = useState<View>("catalog");
    const [selectedProductId, setSelectedProductId] = useState<ProductIdType | null>(null);
    // DÜZƏLİŞ: selectedCategory üçün default null olaraq qalır. 
    // null bütün məhsulları (filtri sıfırlanmış) təmsil edir.
    const [selectedCategory, setSelectedCategory] = useState<CategoryIdType>(null);
    
    // API-dən gələn məlumatlar və vəziyyət state-ləri
    const [categories, setCategories] = useState<Category[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- HEADER VƏ SCROLL STATE'LƏRİ ---
    const [isScrolled, setIsScrolled] = useState(false);
    const headerRef = useRef<HTMLElement | null>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    // Header hündürlüyünün hesablanması
    useEffect(() => {
        const measure = () => {
          const h = headerRef.current?.offsetHeight || 0;
          setHeaderHeight(h);
        };
        measure();
        window.addEventListener("resize", measure);
        const ro = new ResizeObserver(measure);
        if (headerRef.current) ro.observe(headerRef.current);
        return () => {
          window.removeEventListener("resize", measure);
          ro.disconnect();
        };
    }, []);

    // Scroll state-i
    useEffect(() => {
        const onScroll = () => {
          setIsScrolled(window.scrollY > 24);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // --- MƏHSUL VƏ KATEQORİYA ÇƏKMƏ FUNKSİYASI ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Kateqoriyaları çək
            const categoriesResponse = await axios.get<{ data: Category[] }>(`${API_URL}/categories`);
            const fetchedCategories = categoriesResponse.data?.data || categoriesResponse.data;
            if (Array.isArray(fetchedCategories)) {
                setCategories(fetchedCategories.filter((c) => c.active));
            }

            // 2. Məhsulları çək
            const productsResponse = await axios.get<{ data: Product[] }>(`${API_URL}/products`);
            const fetchedProducts = productsResponse.data?.data || productsResponse.data;
            if (Array.isArray(fetchedProducts)) {
                setAllProducts(fetchedProducts);
            }

        } catch (err) {
            let errorMessage = "Məlumatları yükləmək mümkün olmadı";
            if (axios.isAxiosError(err)) {
                errorMessage = err.response ? `Server Xətası: ${err.response.status}` : "Şəbəkə xətası.";
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // API-dən məlumatları komponent yüklənəndə çək
    useEffect(() => {
        fetchData();
    }, [fetchData]);


    // --- FİLTRLƏMƏ MƏNTİQİ ---
    const filteredProducts = useMemo(() => {
        // DÜZƏLİŞ: selectedCategory === null yoxlanılır (0-ı rəqəm ID-si kimi qəbul edirik)
        if (selectedCategory === null) {
            return allProducts; 
        }
        // Qeyd: Product tipinizdəki kateqoriya ID-sinin adı category_id-dir.
        return allProducts.filter(product => product.category_id === selectedCategory);
    }, [selectedCategory, allProducts]);

    // Seçilmiş kateqoriyanın adını tapmaq (ProductGrid üçün)
    const selectedCategoryName = useMemo(() => {
        // DÜZƏLİŞ: selectedCategory === null yoxlanılır
        if (selectedCategory === null) return "Bütün Məhsullar";
        return categories.find(c => c.id === selectedCategory)?.name || null;
    }, [selectedCategory, categories]);

    // --- DİGƏR FUNKSİYALAR ---
    const handleViewDetails = (productId: ProductIdType) => {
        setSelectedProductId(productId);
        setView("detail");
    };

    const handleBackToCatalog = () => {
        setView("catalog");
        setSelectedProductId(null);
    };

    const handleGoToAdmin = () => {
        setView("admin-login");
    };

    const handleAdminLoginSuccess = () => { setView("admin-dashboard"); };
    const handleAdminLogout = () => { setView("catalog"); };

    // DÜZƏLİŞ: CategoryTabs və CategoryDropdown üçün tək bir seçmə funksiyası
    const handleCategorySelect = (categoryId: CategoryIdType) => {
        // Əgər Bütün Məhsullar (null) seçilərsə, yuxarı scroll edək
        if (categoryId === null) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setSelectedCategory(categoryId);
    };


    // --- GÖRÜNÜŞ MƏNTİQİ ---
    if (view === "admin-login") { return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />; }
    if (view === "admin-dashboard") { return <AdminDashboard onLogout={handleAdminLogout} />; }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 to-gray-50">
            {/* --- HEADER BAŞLANĞICI --- */}
            <header
                className={`bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg sticky top-0 z-10 transition-all duration-200 ease-in-out ${
                  isScrolled ? "backdrop-blur-sm" : ""
                }`}
                ref={headerRef}
            >
                {/* DÜZƏLİŞ: Konteynerin enini artırdıq */}
                <div
                    className={`${WIDE_CONTAINER_CLASSES} mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-200 ease-in-out ${
                        isScrolled ? "py-1" : "py-3"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img
                                src="/goldex logo.jpg"
                                alt="Goldex"
                                className={`rounded-full object-cover transition-all duration-200 ${
                                    isScrolled ? "w-6 h-6" : "w-8 h-8"
                                }`}
                            />
                            <div>
                                <h2
                                    className={`font-bold text-white transition-all duration-200 ${
                                        isScrolled ? "text-l" : "text-l"
                                    }`}
                                >
                                    GOLDEX - Məhsul kataloqu
                                </h2>
                            </div>
                        </div>
                        
                        {/* DROP DOWN */}
                        <div className="flex items-center gap-4">
                            {view === "catalog" && categories.length > 0 && (
                                <CategoryDropdown
                                    categories={categories}
                                    onCategorySelect={handleCategorySelect} // DÜZƏLİŞ
                                    selectedCategory={selectedCategory}
                                    headerHeight={0}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </header>
            {/* --- HEADER SONU --- */}

            <main className={`${WIDE_CONTAINER_CLASSES} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
                {view === "catalog" && (
                    <>
                        {/* SEKUNDAR NAVİGASİYA - selectedCategory null deyilsə göstər */}
                        {selectedCategory !== null && (
                            <CategoryTabs
                                categories={categories}
                                selectedCategory={selectedCategory}
                                onCategorySelect={handleCategorySelect} // DÜZƏLİŞ
                                headerHeight={headerHeight}
                            />
                        )}
                        
                        <div className="flex flex-col w-full lg:flex-row gap-2">
                            <div className="flex-1">
                                <ProductGrid
                                    products={filteredProducts} // Filtrlənmiş siyahı
                                    loading={isLoading}          // Yüklənmə state-i
                                    error={error}                // Xəta state-i
                                    selectedCategoryName={selectedCategoryName}
                                    onViewDetails={handleViewDetails}
                                />
                            </div>
                            
                            {/* RIGHT — CALCULATOR */}
                            <div className="w-full lg:w-[340px] lg:sticky lg:top-[120px] h-fit">
                                <CreditCalculator />
                            </div>
                        </div>
                    </>
                )}
                {view === "detail" && selectedProductId && (
                    <ProductDetail
                        productId={selectedProductId}
                        onBack={handleBackToCatalog}
                    />
                )}
            </main>

            <footer className="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-amber-500 mt-8">
                <div className={`${WIDE_CONTAINER_CLASSES} mx-auto px-4 sm:px-6 lg:px-8 py-5`}>
                    <div className="flex items-center justify-between">
                        <p className="text-amber-100 text-sm">
                            &copy; 2025 GOLDEX. Bütün hüquqlar qorunur.
                        </p>
                        <button
                            onClick={handleGoToAdmin}
                            className="text-amber-500 hover:text-amber-400 transition-colors"
                            title="Admin Panel"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;