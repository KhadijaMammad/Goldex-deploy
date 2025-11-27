// src/components/CategoryTabs.tsx

interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  headerHeight: number; // Yapışqan pozisiya üçün
}

export function CategoryTabs({ categories, selectedCategory, onCategorySelect, headerHeight }: CategoryTabsProps) {
  return (
    // Yapışqan zolaq (Navbar altındakı mövqeyi headerHeight ilə təmin edilir)
    <div
      className="sticky z-20 bg-gray-100 shadow-inner border-b border-gray-300 mb-6 transition-all duration-200"
      style={{ top: `${headerHeight}px` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap py-2">
          
          {/* 'Hamısı' (Bütün Məhsullar) düyməsi */}
          <button
            onClick={() => onCategorySelect('')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
              selectedCategory === ''
                ? 'bg-amber-500 text-gray-900 shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bütün Məhsullar
          </button>

          {/* Kateqoriya sekmələri */}
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              // Seçilmiş kateqoriya üçün fərqli görünüş
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
                selectedCategory === category
                  ? 'bg-amber-500 text-gray-900 shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}