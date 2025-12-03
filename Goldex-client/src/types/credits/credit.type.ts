export interface CreditOptionDetail {
    [x: string]: number | string | boolean;
    id: number;
    name: string;
    min_months: number; // API-dan gələn ad
    max_months: number; // API-dan gələn ad
    percent: number;    // API-dan gələn ad 
    is_active: boolean; 
    created_at: string; 
    updated_at: string; 
}