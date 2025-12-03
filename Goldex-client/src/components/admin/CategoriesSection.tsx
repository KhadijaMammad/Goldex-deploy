// CategoriesSection.tsx
// (API_URL və Axios istifadə edilərək)

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { CategoryEditModal } from './CategoryEditModal'; // Eyni qovluq olduğu üçün './'
import toast from 'react-hot-toast'; 

// API URL-ni global olaraq götürürük
const API_URL = import.meta.env.VITE_API_URL;

interface Category {
    id: string; 
    name: string;
    material: string | null; 
    display_order: number;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export function CategoriesSection() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            // API_URL/categories endpoint-inə müraciət edirik
            const response = await axios.get<Category[]>(`${API_URL}/categories`);

            // Material null ola biləcəyi üçün tipi dəqiqləşdiririk
            setCategories(response.data.map(cat => ({ ...cat, material: cat.material || null })) || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
            toast.error('Kateqoriyaları yükləyərkən xəta baş verdi!');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`"${name}" kateqoriyasını silmək istədiyinizdən əminsiniz?`)) {
            return;
        }

        try {
            // DELETE sorğusu
            await axios.delete(`${API_URL}/categories/${id}`);

            toast.success('Kateqoriya uğurla silindi!');
            fetchCategories();
        } catch (err) {
            console.error('Error deleting category:', err);
            toast.error(`Xəta baş verdi: ${err instanceof Error ? err.message : 'Naməlum xəta'}`);
        }
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setShowModal(true);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingCategory(null);
    };

    const handleModalSave = () => {
        fetchCategories(); // Məlumat dəyişdikdən sonra siyahını yeniləyirik
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    // --- JSX (Görünüş hissəsi dəyişməz qalır) ---
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Kateqoriyalar 🏷️</h2>
                    <p className="text-gray-600 mt-1">Məhsul kateqoriyalarını idarə edin</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Kateqoriya
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sıra
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kateqoriya adı
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Material
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Əməliyyatlar
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {categories.map((category) => (
                            <tr key={category.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {category.display_order}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-600">{category.material || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            category.active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {category.active ? 'Aktiv' : 'Deaktiv'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="text-amber-600 hover:text-amber-800 p-2 hover:bg-amber-50 rounded transition-colors"
                                            title="Redaktə et"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id, category.name)}
                                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {categories.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Heç bir kateqoriya tapılmadı</p>
                    </div>
                )}
            </div>

            {showModal && (
                <CategoryEditModal
                    category={editingCategory}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}
        </div>
    );
}