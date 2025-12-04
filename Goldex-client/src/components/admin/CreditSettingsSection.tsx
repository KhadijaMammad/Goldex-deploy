import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};


interface CreditOption {
    id?: number;
    name: string;
    months_min: number;
    months_max: number;
    interest_percent: number;
    is_active: boolean;
}

interface CreditSettings {
    credit_min_amount: number; 
    credit_max_amount: number;
    credit_min_downpayment: number;
    credit_options: CreditOption[];
}

export function CreditSettingsSection() {
    const [minAmount, setMinAmount] = useState<string>('');
    const [maxAmount, setMaxAmount] = useState<string>('');
    const [minDownpayment, setMinDownpayment] = useState<string>('');
    
    const [options, setOptions] = useState<CreditOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        setLoading(true);
        try {
            const authConfig = getAuthHeaders();
            const response = await axios.get<CreditSettings>(`${API_URL}/credit_options`, authConfig);

            const data = response.data;
            
            setMinAmount(String(data.credit_min_amount || 0));
            setMaxAmount(String(data.credit_max_amount || 0));
            setMinDownpayment(String(data.credit_min_downpayment || 0));
            
            const parsedOptions = (data.credit_options || []).map(opt => ({
                ...opt,
                id: (opt.id !== undefined && opt.id !== null) ? Number(opt.id) : undefined, 
                months_min: parseInt(String(opt.months_min)) || 0,
                months_max: parseInt(String(opt.months_max)) || 0,
                interest_percent: parseFloat(String(opt.interest_percent)) || 0,
                is_active: !!opt.is_active,
            }));
            
            setOptions(parsedOptions);

        } catch (err) {
            console.error('Error fetching credit settings:', err);
            const status = axios.isAxiosError(err) ? err.response?.status : null;
            if (status === 401) {
                toast.error("Avtorizasiya uğursuz oldu. Zəhmət olmasa, yenidən daxil olun.");
            } else {
                toast.error('Kredit parametrlərini yükləyərkən xəta baş verdi!');
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        const minAmountNum = parseFloat(minAmount);
        const maxAmountNum = parseFloat(maxAmount);
        const minDownpaymentNum = parseFloat(minDownpayment);

        if (isNaN(minAmountNum) || minAmountNum < 0 || isNaN(maxAmountNum) || maxAmountNum <= 0 || isNaN(minDownpaymentNum) || minDownpaymentNum < 0 || minDownpaymentNum > 100) {
            toast.error('Məbləğ və ilkin ödəniş dəyərləri düzgün daxil edilməlidir (müsbət rəqəm olmalıdır)!');
            return;
        }
        if (minAmountNum > maxAmountNum) {
            toast.error('Minimum məbləğ Maksimum məbləğdən böyük ola bilməz!');
            return;
        }

        const validationError = options.find(opt => opt.months_min > opt.months_max);
        if (validationError) {
             toast.error(`"${validationError.name || 'Adsız variant'}" üçün Minimum ay Maksimum aydan böyük ola bilməz.`);
             return;
        }
        
        const authConfig = getAuthHeaders();
        if (!authConfig.headers) {
            toast.error("Saxlamaq üçün avtorizasiya tələb olunur.");
            return;
        }

        setSaving(true);
        try {
            const payloadToSend: CreditSettings = {
                credit_min_amount: minAmountNum,
                credit_max_amount: maxAmountNum,
                credit_min_downpayment: minDownpaymentNum,
                
                credit_options: options.map(opt => ({
                    ...opt,
                })),
            };

            await axios.post(`${API_URL}/credit_options`, payloadToSend, authConfig);
            
            toast.success('Kredit parametrləri uğurla yeniləndi!');
            await fetchSettings();

        } catch (err) {
            console.error('Error saving settings:', err);
            let errorMessage = 'Naməlum xəta baş verdi!';

            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 422) {
                    const validationErrors = err.response.data.errors || err.response.data.message;
                    const firstError = typeof validationErrors === 'object' ? Object.values(validationErrors)[0] : validationErrors;
                    errorMessage = `Validasiya Xətası: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
                } else if (err.response.status === 401) {
                    errorMessage = 'Avtorizasiya Xətası: Token səhvdir və ya köhnəlib.';
                } else {
                    errorMessage = `API Xətası: Status ${err.response.status}`;
                }
            }
            
            toast.error(`Saxlama xətası: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    }

    const addOption = () => {
        setOptions([...options, { 
            id: undefined,
            name: 'Yeni Variant', 
            months_min: 3, 
            months_max: 6, 
            interest_percent: 12.0, 
            is_active: true 
        }]);
    };

    const removeOption = (index: number) => {
        Swal.fire({
            title: "Əminsiniz?",
            text: "Bu kredit variantını silmək istədiyinizdən əminsiniz?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Bəli, sil!",
            cancelButtonText: "Ləğv et",
        }).then((result) => {
            if (result.isConfirmed) {
                setOptions(options.filter((_, i) => i !== index));
                toast.success('Variant silindi. Yadda saxlamağı unutmayın!');
            }
        });
    };

    const toggleActive = (index: number) => {
        setOptions(prevOptions => {
            const updated = [...prevOptions];
            updated[index].is_active = !updated[index].is_active;
            return updated;
        });
    }

    const updateOption = useCallback((index: number, field: keyof CreditOption, value: string | boolean) => {
        setOptions(prevOptions => {
            const updated = [...prevOptions];
            
            if (field === 'is_active') {
                updated[index][field] = value as boolean;
            } else if (['months_min', 'months_max'].includes(field as string)) {
                updated[index][field] = (parseInt(value as string) || 0) as never;
            } else if (field === 'interest_percent') {
                updated[index][field] = (parseFloat(value as string) || 0) as never;
            } else {
                updated[index][field] = value as never;
            }
            return updated;
        });
    }, []);


    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Kredit şərtləri 💳</h2>

            <div className="bg-white rounded-xl shadow-lg p-8 space-y-8 border border-gray-100">
                <section className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Ümumi Şərtlər</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum məbləğ (AZN)
                            </label>
                            <input
                                type="number"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>
                </section>

                <section className="border-t pt-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-800">Fərdi Variantlar</h3>
                        <button
                            onClick={addOption}
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni şərt əlavə et
                        </button>
                    </div>

                    <div className="space-y-4">
                        {options.map((option, index) => (
                            <div key={option.id || index} className="flex gap-4 items-center bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <div className="flex-1 grid grid-cols-5 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-xs text-gray-600 mb-1">Variant adı</label>
                                        <input
                                            type="text"
                                            value={option.name}
                                            onChange={(e) => updateOption(index, 'name', e.target.value)}
                                            placeholder="məs: 3-6 Aylıq"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Min ay</label>
                                        <input
                                            type="number"
                                            value={option.months_min}
                                            onChange={(e) => updateOption(index, 'months_min', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Maks ay</label>
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
                                    <div className="flex flex-col justify-end">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 h-full">
                                            <button
                                                onClick={() => toggleActive(index)}
                                                type="button"
                                                className={`p-1 rounded transition-colors ${
                                                    option.is_active 
                                                        ? "text-green-600 hover:bg-green-100"
                                                        : "text-gray-400 hover:bg-gray-100"
                                                }`}
                                                title={option.is_active ? "Passiv et" : "Aktiv et"}
                                            >
                                                {option.is_active ? (
                                                    <Eye className="w-5 h-5" />
                                                ) : (
                                                    <EyeOff className="w-5 h-5" />
                                                )}
                                            </button>
                                            <span className="text-xs">{option.is_active ? 'Aktivdir' : 'Passivdir'}</span>
                                        </label>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeOption(index)}
                                    type="button"
                                    className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Sil"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}

                        {options.length === 0 && (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                Hələ heç bir kredit variantı əlavə edilməyib
                            </div>
                        )}
                    </div>
                </section>

                <div className="border-t pt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-semibold disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-md"
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