
export interface CategoryDropdownProps {
    categories: Category[];
    onCategorySelect: (categoryId: number | null) => void;
    selectedCategory?: number | null; 
  headerHeight?: number; 
}

export interface Category {
    id: number;
    name: string;
    material: string;
    display_order: number;
    active: boolean;
    parent_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface NewCategoryTabsProps {
    categories: Category[];
    selectedCategory: number | null; 
    onCategorySelect: (categoryId: number | null) => void;
    headerHeight: number;
}