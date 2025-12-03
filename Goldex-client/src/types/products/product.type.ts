import { CreditOptionDetail } from "../credits/credit.type";


export interface Product {
    [x: string]: any;
    main_image: any;
    id: number;
    title: string;
    description: string | null;
    slug: string;
    category_id: number;
    metal: string; // Məsələn: "Qızıl"
    material: string; // Məsələn: "585" (Əyar)
    carat: string | null;
    weight: string; // Məsələn: "3.5g"
    main_image_link: string;
    gemstone_type: string | null;
    gemstone_carat: string | null;
    gemstone_size: string | null;
    production_status: 'Hazırdır' | 'Sifarişlə';
    availability: 'mövcuddur' | 'mövcud deyil' | 'sifarişlə';
    stock_status: 'Stokda' | 'Stokda deyil';
    discount: number;
    search_string: string | null;
    views_count: number;
    is_active: boolean;
    is_new: boolean;
    is_recommended: boolean;
    is_most_viewed: boolean;
    created_at: string;
    updated_at: string;
    custom_price: number | null; // AZN-də xüsusi qiymət
    gold_price_id: number; // Qızılın bir qramının qiyməti ID-si
}

export interface ProductCardProps {
  product: Product;
  onViewDetails: (id: number) => void;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  updated_at: string;
}

export interface ProductGridProps {
  onViewDetails: (id: number) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export interface ProductDetailProps {
  productId: number;
  onBack: () => void;
}

 export interface ProductDetailModalProps {
    productId: number;
    onClose: () => void;
}

export interface ProductData {
  product: Product | null;
  creditSettings: CreditOptionDetail | null;
  availableMonths: number[];
  loading: boolean;
  error: string | null;
  priceAZN: number;
}


export interface ProductEditModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
  goldPricePerGram: number;
}


