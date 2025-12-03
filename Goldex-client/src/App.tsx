import { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { ProductGrid } from "./components/ProductGrid";
import { ProductDetail } from "./components/ProductDetail"; 
import { CreditCalculator } from "./components/CreditCalculator";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CategoryTabs } from "./components/CategoryTabs"; 
import { CategoryDropdown } from "./components/CategoryDropdown";
import { Settings } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL; 

// Product ID üçün string tipini istifadə edirik (URL-lərə uyğun)
type View = "catalog" | "detail" | "admin-login" | "admin-dashboard";
type ProductIdType = number; // Tipi string olaraq saxlayırıq

function App() {
  const [view, setView] = useState<View>("catalog");
  const [selectedProductId, setSelectedProductId] = useState<ProductIdType | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]); 

  // DÜZƏLİŞ 1: productId-ni string kimi gözləyirik.
  // product.type.ts daxilindəki ProductGridProps interfeysindəki onViewDetails tipini (id: number) => void yerinə (id: string) => void olaraq dəyişin.
  const handleViewDetails = (productId: ProductIdType) => {
    setSelectedProductId(productId);
    setView("detail");
  };

  const handleBackToCatalog = () => {
    setView("catalog");
    setSelectedProductId(null);
  };

  useEffect(() => {
    async function fetchCategories() {
      try {      
        const response = await axios.get<any[]>(`${API_URL}/products?active=true`);
        
        const uniqueCategories = Array.from(
          new Set(response.data?.map((p: any) => p.category).filter((c: any) => c))
        );
        
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Kateqoriyaları yükləmə xətası:", err);
      }
    }
    fetchCategories();
  }, []);

  const handleGoToAdmin = () => {
    setView("admin-login");
  };

  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(0); 

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const handleAdminLoginSuccess = () => {
    setView("admin-dashboard");
  };

  const handleAdminLogout = () => {
    setView("catalog");
  };

  // Admin views
  if (view === "admin-login") {
    return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
  }

  if (view === "admin-dashboard") {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  // Public catalog views
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-gray-50">
      <header
        className={`bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg sticky top-0 z-10 transition-all duration-200 ease-in-out ${
          isScrolled ? "backdrop-blur-sm" : ""
        }`}
        ref={headerRef}
      >
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-200 ease-in-out ${
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

            {/* DROP DOWN (Yalnız kateqoriya seçilməyibsə) */}
            <div className="flex items-center gap-4">
              {view === "catalog" &&
                selectedCategory === "" &&
                categories.length > 0 && (
                  <CategoryDropdown
                    categories={categories}
                    onCategorySelect={setSelectedCategory}
                  />
                )}
              
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === "catalog" && (
          <>
            {/* SEKUNDAR NAVİGASİYA (Yalnız kateqoriya seçilibsə) */}
            {selectedCategory !== "" && (
              <CategoryTabs
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                headerHeight={headerHeight}
              />
            )}

            {/* NEW LAYOUT — PRODUCTS LEFT, CALCULATOR RIGHT */}
            <div className="flex flex-col lg:flex-row gap-10">
              {/* LEFT — PRODUCT GRID */}
              <div className="flex-1">
               <ProductGrid
                  onViewDetails={handleViewDetails} // Düzəliş 1: İndi handleViewDetails ProductGrid-in gözlədiyi tipi ötürür.
                  selectedCategory={selectedCategory} 
                  onCategoryChange={setSelectedCategory} 
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
            productId={selectedProductId as any} // DÜZƏLİŞ 2: Tip uyğunsuzluğunu həll etmək üçün müvəqqəti olaraq as any istifadə edilir.
            onBack={handleBackToCatalog}
          />
        )}
      </main>

      {/* Footer kodu dəyişməz qaldı */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-amber-500 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
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