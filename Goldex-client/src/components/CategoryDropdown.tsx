// src/components/CategoryDropdown.tsx

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CategoryDropdownProps {
  categories: string[];
  onCategorySelect: (category: string) => void;
}

export function CategoryDropdown({ categories, onCategorySelect }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (category: string) => {
    onCategorySelect(category);
    setIsOpen(false); // Seçimdən sonra dropdown bağlansın
  };

  return (
    <div className="relative z-30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-amber-600 rounded-full hover:bg-amber-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        Kateqoriyalar
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-xl">
          <div className="py-1">
            {/* Hamısı Seçimi */}
            <button
              onClick={() => handleSelect('')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
            >
              Bütün Məhsullar
            </button>
            {/* Kateqoriyalar */}
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleSelect(category)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}