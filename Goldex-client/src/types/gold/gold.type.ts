export interface GoldPriceEntry {
    id: number;
    carat: number; // Karat (məsələn: 14, 18, 21, 24)
    price_per_gram: number; // USD-də qram qiyməti
    created_at: string;
    updated_at: string;
}