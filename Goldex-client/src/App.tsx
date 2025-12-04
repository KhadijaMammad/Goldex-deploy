import { useState, useEffect, useRef } from "react";
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

const API_URL = import.meta.env.VITE_API_URL;
type View = "catalog" | "detail" | "admin-login" | "admin-dashboard";
type ProductIdType = number;

const WIDE_CONTAINER_CLASSES = "xl:max-w-[1400px] 2xl:max-w-[1500px]";

function App() {
  const [view, setView] = useState<View>("catalog");
  const [selectedProductId, setSelectedProductId] =
    useState<ProductIdType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
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
        const response = await axios.get<{ data: Category[] }>(
          `${API_URL}/categories`
        );
        console.log(response.data);
        
        const fetchedCategories = response.data?.data || response.data;

        if (Array.isArray(fetchedCategories)) {
          const activeCategories = fetchedCategories.filter((c) => c.active);
          setCategories(activeCategories);
        } else {
          console.error("API cavabı gözlənilən formatda deyil.");
        }
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

  if (view === "admin-login") {
    return <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
  }

  if (view === "admin-dashboard") {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 to-gray-50">
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
              {view === "catalog" &&
                selectedCategory === null &&
                categories.length > 0 && (
                  <CategoryDropdown
                    categories={categories}
                    onCategorySelect={setSelectedCategory}
                    selectedCategory={null}
                    headerHeight={0}
                  />
                )}
            </div>
          </div>
        </div>
      </header>

      <main className={`${WIDE_CONTAINER_CLASSES} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {view === "catalog" && (
          <>
            {/* SEKUNDAR NAVİGASİYA */}
            {selectedCategory !== null && (
              <CategoryTabs
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                headerHeight={headerHeight}
              />
            )}
            
            <div className="flex flex-col w-full lg:flex-row gap-2">
              <div className="flex-1">
                <ProductGrid
                  onViewDetails={handleViewDetails}
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