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

import { Category } from "./types/categories/category.type";
import { Product } from "./types/products/product.type";

const API_URL = import.meta.env.VITE_API_URL;

// TİPLƏR
type View = "catalog" | "detail" | "admin-login" | "admin-dashboard";
type ProductIdType = number;
type CategoryIdType = number | null; 

// SABİTLƏR
const WIDE_CONTAINER_CLASSES = "xl:max-w-[1400px] 2xl:max-w-[1500px]";
const PRODUCTS_PER_PAGE = 100; // Sizin backend tərəfindən dəstəklənən limit

function App() {
    // ƏSAS STATE-LƏR
    const [view, setView] = useState<View>("catalog");
    const [selectedProductId, setSelectedProductId] = useState<ProductIdType | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<CategoryIdType>(null);
    
    // MƏHSUL VƏ KATEQORİYA STATE-LƏRİ
    const [categories, setCategories] = useState<Category[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // PAGINATION STATE-LƏRİ
    const [page, setPage] = useState(1); // Cari səhifə nömrəsi (default: 1)
    const [hasMoreProducts, setHasMoreProducts] = useState(true); // Daha çox məhsul olub-olmaması

    // UI STATE-LƏRİ (Header)
    const [isScrolled, setIsScrolled] = useState(false);
    const headerRef = useRef<HTMLElement | null>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    // --- UI/EFFECT MƏNTİQİ ---

    // Header hündürlüyünü ölçmək
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

    // Scroll vəziyyətini izləmək
    useEffect(() => {
        const onScroll = () => {
          setIsScrolled(window.scrollY > 24);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // --- DATA ÇƏKMƏ MƏNTİQİ ---

    /**
     * API-dən məhsulları çəkir.
     * @param reset Əgər True olarsa (məsələn, kateqoriya dəyişəndə), məhsul siyahısı sıfırlanır və page=1 sorğusu edilir.
     */
    const fetchData = useCallback(async (reset: boolean = false) => {
        const currentPage = reset ? 1 : page;
        const limit = PRODUCTS_PER_PAGE;

        if (!reset && currentPage > 1 && !hasMoreProducts) return;

        if (reset || currentPage === 1) {
            setIsLoading(true);
        }
        setError(null);

        try {
            // 1. Kateqoriyaları çək (yalnız ilk dəfə)
            if (categories.length === 0) {
                const categoriesResponse = await axios.get<{ data: Category[] }>(`${API_URL}/categories`);
                const fetchedCategories = categoriesResponse.data?.data || categoriesResponse.data;
                if (Array.isArray(fetchedCategories)) {
                    setCategories(fetchedCategories.filter((c) => c.active));
                }
            }

            // 2. Məhsulları çək (Sizin backendin gözlədiyi page və page_size parametrləri ilə)
            let url = `${API_URL}/products?page=${currentPage}&page_size=${limit}`;

            // Kateqoriya filtrini əlavə et
            if (selectedCategory !== null) {
                url += `&category_id=${selectedCategory}`;
            }

            const productsResponse = await axios.get<{ data: Product[] }>(url);
            const fetchedProducts = productsResponse.data?.data || productsResponse.data;

            if (Array.isArray(fetchedProducts)) {
                if (reset || currentPage === 1) {
                    // Siyahını sıfırla və yenilə (yeni axtarış/filtr)
                    setAllProducts(fetchedProducts);
                } else {
                    // Məhsulları mövcud siyahının üzərinə əlavə et ("Load More")
                    setAllProducts((prevProducts) => [...prevProducts, ...fetchedProducts]);
                }

                // Daha çox məhsulun olub-olmadığını yoxla
                setHasMoreProducts(fetchedProducts.length === limit);
            } else {
                setAllProducts([]);
                setHasMoreProducts(false);
            }

        } catch (err) {
            let errorMessage = "Məlumatları yükləmək mümkün olmadı";
            if (axios.isAxiosError(err)) {
                errorMessage = err.response ? `Server Xətası: ${err.response.status}` : "Şəbəkə xətası.";
            }
            setError(errorMessage);
            setHasMoreProducts(false);
        } finally {
            setIsLoading(false);
        }
    }, [page, selectedCategory, categories.length, hasMoreProducts]);


    // Səhifə yüklənəndə VƏ ya `selectedCategory` dəyişəndə 1-ci səhifəni çək
    useEffect(() => {
        // Kateqoriya dəyişəndə səhifəni sıfırlayırıq və yeni məlumatı çəkirik
        setPage(1); 
        fetchData(true); 
    }, [selectedCategory, fetchData]);
    
    // `page` dəyişəndə (ancaq 1-dən böyük olduqda) növbəti səhifəni çək
    useEffect(() => {
        if (page > 1) {
            fetchData();
        }
    }, [page, fetchData]); 
    

    // --- FİLTRLƏMƏ VƏ YÜKLƏMƏ FUNKSİYALARI ---

    // "Daha çox yüklə" funksiyası
    const handleLoadMore = useCallback(() => {
        if (!isLoading && hasMoreProducts) {
            setPage((prevPage) => prevPage + 1);
        }
    }, [isLoading, hasMoreProducts]);

    // `allProducts` state-i artıq API tərəfindən filtrlənmiş olduğu üçün, onu birbaşa istifadə edirik
    const filteredProducts = useMemo(() => allProducts, [allProducts]);

    // Seçilmiş kateqoriyanın adını tapmaq
    const selectedCategoryName = useMemo(() => {
        if (selectedCategory === null) return "Bütün Məhsullar";
        return categories.find(c => c.id === selectedCategory)?.name || null;
    }, [selectedCategory, categories]);

    // --- GÖRÜNÜŞ VƏ NAVİQASİYA FUNKSİYALARI ---

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

    const handleCategorySelect = (categoryId: CategoryIdType) => {
        if (categoryId === null) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        // Bu, yuxarıdakı `useEffect` hookunu işə salacaq
        setSelectedCategory(categoryId);
    };


    // --- GÖRÜNTÜ VƏ RENDER MƏNTİQİ ---

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
                                    onCategorySelect={handleCategorySelect}
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
                        {/* SEKUNDAR NAVİGASİYA */}
                        {selectedCategory !== null && (
                            <CategoryTabs
                                categories={categories}
                                selectedCategory={selectedCategory}
                                onCategorySelect={handleCategorySelect}
                                headerHeight={headerHeight}
                            />
                        )}
                        
                        <div className="flex flex-col w-full lg:flex-row gap-2">
                            <div className="flex-1">
                                <ProductGrid
                                    products={filteredProducts} 
                                    loading={isLoading}
                                    error={error}
                                    selectedCategoryName={selectedCategoryName}
                                    onViewDetails={handleViewDetails}
                                    // PAGINATION PROPS
                                    onLoadMore={handleLoadMore}
                                    hasMore={hasMoreProducts}
                                    currentPage={page}
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