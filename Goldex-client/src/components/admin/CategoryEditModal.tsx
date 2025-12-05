import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; 

const API_URL = import.meta.env.VITE_API_URL;

interface Category {
    id?: number; 
    name: string;
    material: string | null;
    display_order: number;
    active: boolean;
}

type CategoryPayload = Omit<Category, 'id'>;

interface CategoryEditModalProps {
    category: Category | null;
    onClose: () => void;
    onSave: () => void;
}

const initialFormData: Category = {
    name: '',
    material: null,
    display_order: 0,
    active: true,
};

export function CategoryEditModal({ category, onClose, onSave }: CategoryEditModalProps) {
    const [formData, setFormData] = useState<Category>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const isEditing = !!category?.id;

    useEffect(() => {
        if (category) {
            setFormData({
                ...category,
                material: category.material === null ? '' : category.material,
            });
        } else {
            setFormData(initialFormData);
        }
    }, [category]);
    
    const validateField = useCallback((name: string, value: any): string => {
        switch (name) {
            case 'name':
                if (!value || String(value).trim() === '') return 'Kateqoriya adı daxil edin';
                if (String(value).length < 2) return 'Kateqoriya adı ən azı 2 simvol olmalıdır';
                return '';
            case 'display_order':
                if (parseInt(value) < 0) return 'Sıra 0-dan kiçik ola bilməz';
                return '';
            default:
                return '';
        }
    }, []);

    const validateForm = useCallback((): boolean => {
        const requiredFields: (keyof Category)[] = ['name', 'display_order'];
        const newErrors: Record<string, string> = {};
        let isValid = true;

        requiredFields.forEach(field => {
            const error = validateField(field, formData[field as keyof Category]);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        setTouched(requiredFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
        return isValid;
    }, [formData, validateField]);


    const handleFieldChange = (name: keyof Category, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handleBlur = (name: keyof Category) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, formData[name]);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSave = async () => {
        if (!validateForm()) {
            toast.error('Zəhmət olmasa, xətaları düzəldin.');
            return;
        }

        setSaving(true);
        try {
            const payload: CategoryPayload = {
                id: formData.name.trim(),
                material: formData.material?.trim() || null, 
                display_order: formData.display_order,
                active: formData.active,
            };

            if (isEditing) {
                await axios.patch(`${API_URL}/categories/${category.id}`, payload);
            } else {
                await axios.post(`${API_URL}/categories`, payload);
            }

            toast.success(isEditing ? 'Kateqoriya uğurla yeniləndi!' : 'Yeni kateqoriya əlavə edildi!');
            onSave();
            onClose();
        } catch (err) {
            console.error('Error saving category:', err);
            toast.error(`Xəta baş verdi: ${err instanceof Error ? err.message : 'Naməlum xəta'}`);
        } finally {
            setSaving(false);
        }
    };
    

    const getInputClassName = (fieldName: keyof Category) => {
        const baseClass = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors";
        const errorClass = touched[fieldName] && errors[fieldName] ? "border-red-500" : "border-gray-300";
        return `${baseClass} ${errorClass}`;
    };

    const ErrorMessage = ({ fieldName }: { fieldName: keyof Category }) => {
        if (!touched[fieldName] || !errors[fieldName]) return null;
        return <p className="text-xs text-red-600 mt-1">{errors[fieldName]}</p>;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Kateqoriyanı Redaktə Et' : 'Yeni Kateqoriya Əlavə Et'} 
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kateqoriya adı <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            className={getInputClassName('name')}
                            placeholder="Məsələn: Üzük, Sırqa..."
                        />
                        <ErrorMessage fieldName="name" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Material / Əyar
                        </label>
                        <input
                            type="text"
                            value={formData.material || ''} 
                            onChange={(e) => handleFieldChange('material', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                            placeholder="Məsələn: 585, 14K qızıl..."
                        />
                        <p className="text-xs text-gray-500 mt-1">İstəyə bağlı - kateqoriya üçün default material</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Göstərilmə sırası <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.display_order}
                            onChange={(e) => handleFieldChange('display_order', parseInt(e.target.value) || 0)}
                            onBlur={() => handleBlur('display_order')}
                            className={getInputClassName('display_order')}
                            min="0"
                        />
                        <ErrorMessage fieldName="display_order" />
                        <p className="text-xs text-gray-500 mt-1">Kiçik nömrə əvvəl göstərilir</p>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={(e) => handleFieldChange('active', e.target.checked)}
                                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">Aktivdir</span>
                        </label>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Ləğv et
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-semibold disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
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