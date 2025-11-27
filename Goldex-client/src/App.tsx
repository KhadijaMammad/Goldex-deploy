import { useState, useEffect, useRef } from "react";
import { ProductGrid } from "./components/ProductGrid";
import { ProductDetail } from "./components/ProductDetail";
import { CreditCalculator } from "./components/CreditCalculator";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Settings } from "lucide-react";

type View = "catalog" | "detail" | "admin-login" | "admin-dashboard";

function App() {
  const [view, setView] = useState<View>("catalog");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleViewDetails = (productId: string) => {
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
        className={`bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg sticky top-0 z-10 transition-all duration-200 ease-in-out ${
          isScrolled ? "backdrop-blur-sm" : ""
        }`}
        ref={headerRef}
      >
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-200 ease-in-out ${
            isScrolled ? "py-3" : "py-6"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/goldex logo.jpg"
                alt="Goldex"
                className={`rounded-full object-cover transition-all duration-200 ${
                  isScrolled ? "w-10 h-10" : "w-16 h-16"
                }`}
              />
              <div>
                <h1
                  className={`font-bold text-white transition-all duration-200 ${
                    isScrolled ? "text-xl" : "text-3xl"
                  }`}
                >
                  GOLDEX - Məhsul kataloqu
                </h1>
                <p
                  className={`text-amber-100 mt-1 transition-opacity ${
                    isScrolled ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
                  }`}
                >
                  Zərif zərgərlik kolleksiyamızı kəşf edin
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {view === "catalog" && (
          <>
            {/* CATEGORY SELECTOR (sticky same as before) */}
            <div
              className="sticky z-20 bg-white"
              style={{ top: `${headerHeight}px` }}
            ></div>

            {/* NEW LAYOUT — PRODUCTS LEFT, CALCULATOR RIGHT */}
            <div className="flex flex-col lg:flex-row gap-10">
              
              {/* LEFT — PRODUCT GRID */}
              <div className="flex-1">
                <ProductGrid
                  onViewDetails={handleViewDetails}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  headerHeight={headerHeight}
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

      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-amber-500 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-amber-100">
              &copy; 2025 GOLDEX. Bütün hüquqlar qorunur.
            </p>
            <button
              onClick={handleGoToAdmin}
              className="p-2 text-amber-500 hover:text-amber-400 transition-colors"
              title="Admin Panel"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
