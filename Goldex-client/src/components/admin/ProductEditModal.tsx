import { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { ImageWithSkeleton } from '../ImageWithSkeleton'; 
import { Product, ProductEditModalProps } from '../../types/products/product.type'; 

const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

type EditableProduct = Omit<Product,
    'id' | 'weight' | 'search_string' | 'views_count' | 'created_at' | 'updated_at' | 'gold_price_id' | 'is_most_viewed' | 'is_new' | 'is_recommended' | 'is_active'
> & {
    weight_grams: number; 
    active: boolean; 
    isNew: boolean;
    isRecommended: boolean; 
    isMostViewed: boolean; 
    has_diamond: boolean; 
};

const API_URL = import.meta.env.VITE_API_URL;

export function ProductEditModal({ product, onClose, onSave, goldPricePerGram }: ProductEditModalProps) {
    
    const getWeightGrams = (weightString: string | null | undefined): number => {
        if (weightString == null || typeof weightString !== 'string' || weightString.trim() === "") return 0;
        const match = weightString.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : 0;
    };

    const initialFormData: EditableProduct = {
        title: '',
        description: null,
        slug: '',
        category_name: '',
        metal: '',
        material: '',
        carat: null,
        main_image_link: '',
        gemstone_type: null,
        gemstone_carat: null,
        gemstone_size: null,
        production_status: 'Hazırdır',
        availability: 'mövcuddur',
        stock_status: 'Stokda',
        discount: 0,
        custom_price: null,
        
        weight_grams: 0,
        active: true,
        isNew: false,
        isRecommended: false,
        isMostViewed: false,
        has_diamond: false, 
    };

    const [formData, setFormData] = useState<EditableProduct>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
    
    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                weight_grams: getWeightGrams(product.weight),
                active: product.is_active,
                isNew: product.is_new,
                isRecommended: product.is_recommended,
                isMostViewed: product.is_most_viewed,
                has_diamond: product.has_diamond || false, 
            } as EditableProduct);
        } else {
            setFormData(initialFormData); 
        }
    }, [product]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/categories`);
            const data = response.data.data || response.data;
            if (Array.isArray(data)) {
                setCategories(data.map((c: any) => ({ id: Number(c.id), name: c.title || c.name })));
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            toast.error('Kateqoriyaları yükləmək mümkün olmadı.');
        }
    };

    const safeWeightGrams = Number(formData.weight_grams) || 0;
    const calculatedGoldValue = safeWeightGrams * goldPricePerGram * 1.7;

    const uploadImage = async (file: File): Promise<string> => {
         await new Promise(resolve => setTimeout(resolve, 1500));
         return `https://mock-image-server.com/images/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    };

    const handleMainImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadImage(file);
            setFormData({ ...formData, main_image_link: url }); 
            toast.success("Şəkil uğurla yükləndi (Mock).");
        } catch (err) {
            console.error('Error uploading image:', err);
            toast.error('Şəkil yüklənərkən xəta baş verdi!');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const authConfig = getAuthHeaders();
        // console.log(authCofig);
        

        if (!authConfig.headers) {
            toast.error("Saxlama üçün avtorizasiya tələb olunur.");
            setSaving(false);
            return;
        }

        try {
            const productDataToSend = {
                title: formData.title,
                slug: formData.slug,
                category_name: formData.category_name , 
                metal: formData.metal,
                material: formData.material,
                
                carat: formData.carat || null, 
                gemstone_type: formData.gemstone_type || null,
                gemstone_size: formData.gemstone_size || null,
                gemstone_carat: (parseFloat(formData.gemstone_carat ?? '0') > 0) ? parseFloat(formData.gemstone_carat!) : null,
                
                production_status: formData.production_status, 
                availability: formData.availability,             
                stock_status: formData.stock_status,            

                discount: formData.discount || 0,
                custom_price: formData.custom_price || null,
                description: formData.description || '',
                main_image_link: formData.main_image_link,
                
                weight: safeWeightGrams, 
                
                is_active: formData.active,
                is_new: formData.isNew,
                is_recommended: formData.isRecommended,
                is_most_viewed: formData.isMostViewed,
                has_diamond: formData.has_diamond,

                ...(product?.id && {
                    id: product.id,
                    gold_price_id: product.gold_price_id ?? 1,
                    search_string: product.search_string ?? '', 
                    views_count: product.views_count ?? 0,
                }),
            };

            let result;
            const apiEndpoint = `${API_URL}/products${product?.id ? '/' + product.id : ''}`;

            if (product?.id) {
                result = await axios.put(apiEndpoint, productDataToSend, authConfig); 
            } else {
                result = await axios.post(apiEndpoint, productDataToSend, authConfig); 
            }

            toast.success( product?.id ? 'Məhsul uğurla yeniləndi!' : 'Yeni məhsul uğurla əlavə edildi!' );
            onSave();
            onClose();

        } catch (err) {
            console.error('Error saving product:', err);
            
            let errorMessage = 'Saxlama zamanı bilinməyən xəta baş verdi.';

            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 422) {
                    const validationErrors = err.response.data.errors || err.response.data.message;
                    if (validationErrors) {
                        const firstError = typeof validationErrors === 'object' ? Object.values(validationErrors)[0] : validationErrors;
                        errorMessage = `Məlumat Xətası: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
                    } else {
                        errorMessage = 'Validasiya Xətası: Göndərilən məlumatlar formatı səhvdir.';
                    }
                } else if (err.response.status === 401) {
                    errorMessage = 'Avtorizasiya uğursuz oldu. Tokeninizi yoxlayın.';
                } else {
                    errorMessage = `API Xətası: Status ${err.response.status}`;
                }
            }
            
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {product?.id ? 'Məhsulu Redaktə Et' : 'Yeni Məhsul Əlavə Et'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* INPUT SAHƏLƏRİ VƏ LOGİKA YUXARIDAKİ KİMİ QALIR */}
                        {/* ... (Bütün form sahələri) */}

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Məhsul adı</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value.slice(0, 100).replace(/\s+/g, '-').toLowerCase() })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                placeholder="avtomatik-yaradilir"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kateqoriya</label>
                            <select
                                value={formData.category_id || 0}
                                onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            >
                                <option value={0}>Seçin...</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Metal (Qızıl, Gümüş)</label>
                            <input
                                type="text"
                                value={formData.metal}
                                onChange={(e) => setFormData({ ...formData, metal: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                placeholder="Qızıl"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Material (Əyar - 585, 750)</label>
                            <input
                                type="text"
                                value={formData.material}
                                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                placeholder="585"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Çəki (qram)</label>
                            <input
                                type="number"
                                value={safeWeightGrams} 
                                onChange={(e) => {
                                    const weight = parseFloat(e.target.value) || 0;
                                    setFormData({ ...formData, weight_grams: weight });
                                }}
                                step="0.1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-gray-900">
                                Hesablanmış Dəyər: {calculatedGoldValue.toFixed(2)} AZN
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                (Çəki * {goldPricePerGram} USD * 1.7)
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Karat</label>
                            <input
                                type="text"
                                value={formData.carat ?? ''}
                                onChange={(e) => setFormData({ ...formData, carat: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Daş növü</label>
                            <input
                                type="text"
                                value={formData.gemstone_type ?? ''}
                                onChange={(e) => setFormData({ ...formData, gemstone_type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                placeholder="Brilyant, Zümrüd..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Daşın çəkisi (karat)</label>
                            <input
                                type="text"
                                value={formData.gemstone_carat ?? ''}
                                onChange={(e) => setFormData({ ...formData, gemstone_carat: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                placeholder="0.5 karat"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Daşın ölçüsü</label>
                            <input
                                type="text"
                                value={formData.gemstone_size ?? ''}
                                onChange={(e) => setFormData({ ...formData, gemstone_size: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                placeholder="3mm x 5mm"
                            />
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Xüsusi Qiymət (AZN)</label>
                            <input
                                type="number"
                                value={formData.custom_price ?? ''}
                                onChange={(e) => setFormData({ ...formData, custom_price: parseFloat(e.target.value) || null })}
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                placeholder="Qiymət müəyyən edilməyibsə boş saxlayın"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endirim (%)</label>
                            <input
                                type="number"
                                value={formData.discount}
                                onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                                min={0}
                                max={100}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hazırlanma statusu</label>
                            <select
                                value={formData.production_status}
                                onChange={(e) => setFormData({ ...formData, production_status: e.target.value as EditableProduct['production_status'] })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="Hazırdır">Hazırdır</option>
                                <option value="Sifarişlə">Sifarişlə</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stok statusu</label>
                            <select
                                value={formData.stock_status}
                                onChange={(e) => setFormData({ ...formData, stock_status: e.target.value as EditableProduct['stock_status'] })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="Stokda">Stokda</option>
                                <option value="Stokda deyil">Stokda deyil</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mövcudluq</label>
                            <select
                                value={formData.availability}
                                onChange={(e) => setFormData({ ...formData, availability: e.target.value as EditableProduct['availability'] })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="mövcuddur">Mövcuddur</option>
                                <option value="mövcud deyil">Mövcud deyil</option>
                                <option value="sifarişlə">Sifarişlə</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Əsas şəkil linki</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                {/* Şəkil Yükləmə Logikası */}
                                {formData.main_image_link ? (
                                    <div className="flex items-center gap-4">
                                        <ImageWithSkeleton
                                            src={formData.main_image_link} 
                                            alt="Main"
                                            className="w-24 h-24 object-cover rounded-lg"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600 mb-2">Mevcud Link: {formData.main_image_link.substring(0, 50)}...</p>
                                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm">
                                                <Upload className="w-4 h-4" />
                                                Yeni Şəkil Yüklə / Dəyişdir
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleMainImageUpload}
                                                    className="hidden"
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center gap-2 py-8">
                                        <ImageIcon className="w-12 h-12 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-700">Əsas Şəkil Yüklə</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleMainImageUpload}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Təsvir</label>
                            <textarea
                                value={formData.description ?? ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                placeholder="Məhsul haqqında ətraflı məlumat..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Xüsusiyyətlər</label>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-700">Aktivdir</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isNew}
                                        onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-700">Yenidir</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isRecommended}
                                        onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-700">Tövsiyə olunur</span>
                                </label>
                                   <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isMostViewed}
                                        onChange={(e) => setFormData({ ...formData, isMostViewed: e.target.checked })}
                                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-700">Ən çox baxılan</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.has_diamond}
                                        onChange={(e) => setFormData({ ...formData, has_diamond: e.target.checked })}
                                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-700">Brilyant var</span>
                                </label>
                            </div>
                        </div>

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