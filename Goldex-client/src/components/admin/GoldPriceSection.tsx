import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

interface GoldPriceSetting {
    id: number;
    carat: number;
    price_per_gram: number; 
    created_at: string; 
    updated_at: string; 
}

interface ProductInfo {
    id: number; 
    weight_grams: number | null;
}

export function GoldPriceSection() {
    const [goldPrice, setGoldPrice] = useState<number>(0); 
    const [caratValue, setCaratValue] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settingId, setSettingId] = useState<number | null>(null); 

    useEffect(() => {
        fetchGoldPrice();
    }, []);

    async function fetchGoldPrice() {
        setLoading(true);
        try {
            const response = await axios.get<GoldPriceSetting>(`${API_URL}/gold_prices`);
            const goldPriceData = response.data;

            if (goldPriceData && goldPriceData.id) {
                setGoldPrice(goldPriceData.price_per_gram);
                setCaratValue(goldPriceData.carat);
                setSettingId(goldPriceData.id); 
            } else {
                toast.error('Qızıl qiyməti settingi tapılmadı.');
                setGoldPrice(0);
                setCaratValue(585);
            }
        } catch (err) {
            console.error('Error fetching gold price:', err);
            toast.error('Qızıl qiymətini yükləyərkən xəta baş verdi!');
            setGoldPrice(0);
            setCaratValue(585);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        
        const priceValue = parseFloat(goldPrice.toString()); 
        const currentCarat = caratValue || 585;

        if (isNaN(priceValue) || priceValue <= 0) {
            toast.error('Zəhmət olmasa, 0-dan böyük düzgün qiymət daxil edin!');
            setSaving(false);
            return;
        }

        try {
            const settingPayload = {
                price_per_gram: priceValue,
                carat: currentCarat
            };

            if (!settingId) {
                toast.error('Setting ID tapılmadığı üçün qiyməti saxlamaq mümkün olmadı.');
                setSaving(false);
                return;
            }

            await axios.put(`${API_URL}/gold_prices/${settingId}`, settingPayload);
            toast.success('Qızıl qiyməti uğurla yeniləndi!');

            const productsResponse = await axios.get<ProductInfo[]>(`${API_URL}/products`);
            const productsToUpdate = productsResponse.data;

            if (productsToUpdate && productsToUpdate.length > 0) {

                const updates = productsToUpdate.map(product => {
                    const weightGrams = product.weight_grams || 0;
                    const newPrice = weightGrams * priceValue * 1.7; 

                    return axios.patch(`${API_URL}/products/${product.id}`, {
                        price_azn: parseFloat(newPrice.toFixed(2)),
                        price_usd: parseFloat(newPrice.toFixed(2))
                    });
                });

                await Promise.all(updates);
                toast.success('Bütün məhsul qiymətləri avtomatik yeniləndi!');
            } else {
                toast('Yenilənəcək məhsul tapılmadı.');
            }

        } catch (err) {
            console.error('Error saving gold price:', err);
            const errorMessage = axios.isAxiosError(err) && err.response?.data?.message
                ? err.response.data.message
                : 'Naməlum xəta baş verdi.';
            toast.error(`Xəta baş verdi: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Qızıl qiyməti 💰</h2>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="goldPriceInput">
                        Qızılın 1 qramının USD qiyməti
                    </label>
                    <input
                        id="goldPriceInput"
                        type="number"
                        value={goldPrice.toString()} 
                        onChange={(e) => setGoldPrice(parseFloat(e.target.value) || 0)} 
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="74.50"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        Bu qiyməti dəyişdirdikdə, bütün qızıl məhsulların qiymətləri avtomatik olaraq yenilənəcək.
                    </p>
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hazırkı Karat Dəyəri
                    </label>
                    <p className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                        {caratValue ?? 'Məlum deyil'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Bu dəyər back-end tərəfindən idarə olunur.
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Qiymət hesablama düsturu:</h3>
                    <p className="text-sm text-gray-700">
                        Məhsulun qiyməti = Məhsulun çəkisi (qram) × Qızılın 1 qram qiyməti (USD) × 1.7
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-semibold disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Yenilənir...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Yenilə
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}