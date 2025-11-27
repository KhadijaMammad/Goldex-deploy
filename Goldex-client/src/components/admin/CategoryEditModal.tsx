import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Loader2 } from 'lucide-react';

interface Category {
  id?: string;
  name: string;
  material?: string;
  display_order: number;
  active: boolean;
}

interface CategoryEditModalProps {
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}

export function CategoryEditModal({ category, onClose, onSave }: CategoryEditModalProps) {
  const [formData, setFormData] = useState<Category>({
    name: '',
    material: '',
    display_order: 0,
    active: true
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (category) {
      setFormData(category);
    }
  }, [category]);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') return 'Kateqoriya adı daxil edin';
        if (value.length < 2) return 'Kateqoriya adı ən azı 2 simvol olmalıdır';
        return '';
      case 'display_order':
        if (value < 0) return 'Sıra 0-dan kiçik ola bilməz';
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const requiredFields = ['name', 'display_order'];
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
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleBlur = (name: string) => {
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, formData[name as keyof Category]);
    setErrors({ ...errors, [name]: error });
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Zəhmət olmasa bütün tələb olunan sahələri doldurun!');
      return;
    }

    setSaving(true);
    try {
      let result;
      if (category?.id) {
        result = await supabase
          .from('categories')
          .update(formData)
          .eq('id', category.id)
          .select();
      } else {
        result = await supabase
          .from('categories')
          .insert([formData])
          .select();
      }

      if (result.error) {
        throw result.error;
      }

      alert(category?.id ? 'Kateqoriya yeniləndi!' : 'Kateqoriya əlavə edildi!');
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
      alert(`Xəta baş verdi: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const getInputClassName = (fieldName: string) => {
    const baseClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500";
    const errorClass = touched[fieldName] && errors[fieldName] ? "border-red-500" : "border-gray-300";
    return `${baseClass} ${errorClass}`;
  };

  const ErrorMessage = ({ fieldName }: { fieldName: string }) => {
    if (!touched[fieldName] || !errors[fieldName]) return null;
    return <p className="text-xs text-red-600 mt-1">{errors[fieldName]}</p>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {category?.id ? 'Kateqoriyanı Redaktə Et' : 'Yeni Kateqoriya Əlavə Et'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

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
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
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
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">Aktivdir</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Ləğv et
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-semibold disabled:bg-gray-300"
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
