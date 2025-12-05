import { NewCategoryTabsProps } from "../types/categories/category.type";



export function CategoryTabs({ categories, selectedCategory, onCategorySelect, headerHeight }: NewCategoryTabsProps) {
  return (
    <div
      className="sticky z-100 bg-gray-100 shadow-inner border-b border-gray-300 mb-6 transition-all duration-200"
      style={{ top: `${headerHeight}px` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap py-2">
          
          <button
            onClick={() => onCategorySelect(null)}
            className={`px-3 py-1.5 text-m font-semibold rounded-full transition-colors duration-200 ${
              selectedCategory === null || selectedCategory === 0 
                ? 'bg-amber-500 text-gray-900 shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bütün Məhsullar
          </button>

          {categories.map(category => (
            <button
              key={category.id} 
              onClick={() => onCategorySelect(category.id)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
                selectedCategory === category.id
                  ? 'bg-amber-500 text-gray-900 shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} 
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}