import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Product {
  id: string;
  title: string;
  category: string;
  metal: string;
  material: string;
  karat: string;
  weight: string;
  weight_grams: number;
  availability: string;
  description: string;
  main_image: string;
  additional_images: string[];
  price_usd: number;
  article?: string;
  price_azn: number;
  has_diamond: boolean;
  gemstone_type: string;
  gemstone_carat: string;
  production_status: string;
  stock_status: string;
  size: string;
  featured_flags: string[];
  active: boolean;
  viewed_count: number;
  credit_options: Array<{
    months: number;
    interest_percent: number;
  }>;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}
