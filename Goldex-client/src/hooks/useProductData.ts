import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditOptionDetail } from '../types/credits/credit.type';
import { Product, ProductData } from '../types/products/product.type';

const API_URL = import.meta.env.VITE_API_URL; 

const ALL_AVAILABLE_MONTHS = [3, 6, 12, 18];

interface SettingItem {
    key: string;
    value: string;
}

export function useProductData(productId: string): ProductData {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creditSettings, setCreditSettings] = useState<CreditOptionDetail | null>(null);
    const [availableMonths, setAvailableMonths] = useState<number[]>([]);

    const priceAZN = product ? (product.price_azn || (product.price_usd || 0) * 1.7 || 0) : 0;

    useEffect(() => {
        if (!productId) {
            setError('Məhsul ID-si təyin edilməyib.');
            setLoading(false);
            return;
        }

        async function fetchProductData() {
            try {
                const productResponse = await axios.get<Product>(`${API_URL}/products/${productId}`);
                const productData = productResponse.data;

                if (productData && productData.id) {
                    setProduct(productData);
                } else {
                    setError('Məhsul tapılmadı');
                    setProduct(null);
                }

                // 2. Kredit Ayarlarını çəkmə (axios ilə, /credit_options endpoint-i fərz olunur)
                // Bu endpoint-in SettingItem[] massivi qaytardığını fərz edirik
                const settingsResponse = await axios.get<SettingItem[]>(`${API_URL}/credit_options`);
                const settingsData = settingsResponse.data;

                if (settingsData) {
                    const newSettings: Partial<CreditOptionDetail> = {};
                    
                    // Ayarları parse etmə
                    settingsData.forEach((setting) => {
                        const value = parseFloat(setting.value);
                        switch (setting.key) {
                            case 'credit_interest_rate': newSettings.interestRate = value; break;
                            case 'credit_min_months': newSettings.minMonths = value; break;
                            case 'credit_max_months': newSettings.maxMonths = value; break;
                            case 'credit_min_price': newSettings.minPrice = value; break;
                            case 'credit_max_price': newSettings.maxPrice = value; break;
                        }
                    });

                    // Bütün vacib sahələrin doldurulmasını yoxlayırıq
                    const isComplete = newSettings.interestRate !== undefined && newSettings.minMonths !== undefined && 
                                       newSettings.maxMonths !== undefined && newSettings.minPrice !== undefined && 
                                       newSettings.maxPrice !== undefined;
                    
                    if (isComplete) {
                        const finalSettings = newSettings as CreditOptionDetail;
                        setCreditSettings(finalSettings);

                        const months = ALL_AVAILABLE_MONTHS.filter(month => 
                            month >= finalSettings.min_months && month <= finalSettings.max_months
                        );
                        setAvailableMonths(months);
                    }
                }
            } catch (err) {
                let errorMessage = 'Məlumat yüklənməsi xətası';
                 if (axios.isAxiosError(err) && err.response) {
                    // 404 xətası məhsul tapılmaması deməkdir
                    if (err.response.status === 404) {
                        errorMessage = 'Məhsul tapılmadı (404)';
                    } else {
                        errorMessage = `API Xətası: ${err.response.status}`;
                    }
                } else if (err instanceof Error) {
                     errorMessage = err.message;
                }
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }

        fetchProductData();
    }, [productId]);

    return { product, creditSettings, availableMonths, loading, error, priceAZN };
}