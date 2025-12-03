// CreditSettingsSection.tsx
// (Rəqəmsal Sahələr NUMBER tipinə keçirilib)

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; 

// API URL-ni global olaraq götürürük
const API_URL = import.meta.env.VITE_API_URL;

// Düzəliş edilmiş CreditOption interfeysi
interface CreditOption {
    id?: string | number; // ID nömrə və ya string ola bilər
    name: string;
    months_min: number; // NUMBER
    months_max: number; // NUMBER
    interest_percent: number; // NUMBER
    is_active: boolean; 
}

// Bütün kredit parametrlərini əhatə edən interfeys
interface CreditSettings {
    // Input fieldləri üçün hələlik string saxlayırıq (input value həmişə stringdir)
    credit_min_amount: string; 
    credit_max_amount: string;
    credit_min_downpayment: string;
    credit_options: CreditOption[]; 
}

export function CreditSettingsSection() {
    // Basic settings üçün string saxlayırıq (input value-dan gəlir)
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [minDownpayment, setMinDownpayment] = useState('');
    
    // Options massivini CreditOption interfeysi ilə idarə edirik
    const [options, setOptions] = useState<CreditOption[]>([]); 
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setLoading(true);
        try {
            const response = await axios.get<CreditSettings>(`${API_URL}/credit_options`);

            const data = response.data;
            setMinAmount(data.credit_min_amount || '0');
            setMaxAmount(data.credit_max_amount || '0');
            setMinDownpayment(data.credit_min_downpayment || '0');
            
            // Options massivini daxil edərkən rəqəmsal sahələri number-ə çevirmək lazımdır
            const parsedOptions = (data.credit_options || []).map(opt => ({
                ...opt,
                months_min: Number(opt.months_min) || 0,
                months_max: Number(opt.months_max) || 0,
                interest_percent: Number(opt.interest_percent) || 0,
            }));
            
            setOptions(parsedOptions);

        } catch (err) {
            console.error('Error fetching credit settings:', err);
            toast.error('Kredit parametrlərini yükləyərkən xəta baş verdi!');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        const minAmountVal = parseFloat(minAmount);
        const maxAmountVal = parseFloat(maxAmount);
        const minDownpaymentVal = parseFloat(minDownpayment);

        if (minAmountVal <= 0 || maxAmountVal <= 0 || minDownpaymentVal < 0) {
            toast.error('Məbləğ və ilkin ödəniş dəyərləri düzgün daxil edilməlidir!');
            return;
        }

        const validationError = options.find(opt => opt.months_min > opt.months_max);
        if (validationError) {
             toast.error(`"${validationError.name || 'Adsız variant'}" üçün Minimum ay Maksimum aydan böyük ola bilməz.`);
             return;
        }

        setSaving(true);
        try {
            // Payload göndərərkən də string olan dəyərləri təmizləyə bilərik
            const payload: CreditSettings = {
                credit_min_amount: minAmount,
                credit_max_amount: maxAmount,
                credit_min_downpayment: minDownpayment,
                credit_options: options,
            };

            await axios.patch(`${API_URL}/credit_options`, payload); 
            
            toast.success('Kredit parametrləri uğurla yeniləndi!');
            await fetchSettings(); 

        } catch (err) {
            console.error('Error saving settings:', err);
            const errorMessage = axios.isAxiosError(err) && err.response?.data?.message
                ? err.response.data.message
                : 'Naməlum xəta baş verdi!';
            toast.error(`Saxlama xətası: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    }

    const addOption = () => {
        setOptions([...options, { 
            name: '', 
            months_min: 3, 
            months_max: 6, 
            interest_percent: 12.0, 
            is_active: true 
        }]);
    };

    const removeOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    // Callback funksiyası rəqəm sahələrini dəqiq idarə edir
    // Burada "value" inputdan string və ya boolean kimi gələ bilər
    const updateOption = useCallback((index: number, field: keyof CreditOption, value: string | boolean) => {
        setOptions(prevOptions => {
            const updated = [...prevOptions];
            
            if (field === 'is_active') {
                updated[index][field] = value as boolean;
            } else if (['months_min', 'months_max'].includes(field as string)) {
                 // Ay sayı integer olmalıdır
                updated[index][field] = (parseInt(value as string) || 0) as never;
            } else if (field === 'interest_percent') {
                 // Faiz faiz onluq (float) ola bilər
                updated[index][field] = (parseFloat(value as string) || 0) as never;
            } else {
                updated[index][field] = value as never;
            }
            return updated;
        });
    }, []);

    // --- JSX (Görünüş) ---

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Kredit şərtləri 💳</h2>

            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Basic Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum məbləğ (AZN)
                        </label>
                        <input
                            type="number"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            min="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maksimum məbləğ (AZN)
                        </label>
                        <input
                            type="number"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            min="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            İlkin ödəniş (%)
                        </label>
                        <input
                            type="number"
                            value={minDownpayment}
                            onChange={(e) => setMinDownpayment(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            min="0"
                            max="100"
                        />
                    </div>
                </div>

                <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Kredit variantları</h3>
                        <button
                            onClick={addOption}
                            type="button"
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni şərt əlavə et
                        </button>
                    </div>

                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div key={option.id || index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg">
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Variant adı</label>
                                        <input
                                            type="text"
                                            value={option.name}
                                            onChange={(e) => updateOption(index, 'name', e.target.value)}
                                            placeholder="məs: Standart Kredit"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 gap-3 items-end">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Minimum ay</label>
                                            <input
                                                type="number"
                                                // Doğrudan number istifadə edirik
                                                value={option.months_min} 
                                                onChange={(e) => updateOption(index, 'months_min', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Maksimum ay</label>
                                            <input
                                                type="number"
                                                value={option.months_max} 
                                                onChange={(e) => updateOption(index, 'months_max', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Faiz %</label>
                                            <input
                                                type="number"
                                                value={option.interest_percent} 
                                                onChange={(e) => updateOption(index, 'interest_percent', e.target.value)}
                                                step="0.1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                                min="0"
                                            />
                                        </div>
                                        <div className="flex items-center h-full pt-4">
                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={option.is_active}
                                                    onChange={(e) => updateOption(index, 'is_active', e.target.checked)}
                                                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                                />
                                                Aktiv
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeOption(index)}
                                    type="button"
                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors self-center mt-3"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}

                        {options.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                Hələ heç bir kredit variantı əlavə edilməyib
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t pt-6">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-semibold disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saxlanılır...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Yadda saxla
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}