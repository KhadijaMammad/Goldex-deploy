export interface CategoryTabsProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  headerHeight: number; // Yapışqan pozisiya üçün
}

export interface CategoryDropdownProps {
  categories: string[];
  onCategorySelect: (category: string) => void;
}