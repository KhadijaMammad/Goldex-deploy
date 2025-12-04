export interface CreditOptionDetail {
    [x: string]: number | string | boolean;
    id: number;
    name: string;
    min_months: number;
    max_months: number;
    percent: number;    
    is_active: boolean; 
    created_at: string; 
    updated_at: string; 
}