import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Save, X, DollarSign, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { CreditSettings } from '../components/CreditSettings';
import toast from 'react-hot-toast';
import { ImageWithSkeleton } from '../components/ImageWithSkeleton'; // Bu komponentin mövcud olduğunu fərz edirik
import { Product } from '../types/products/product.type'; 
import { AdminPanelProps } from '../types/admin/admin.type';
import { GoldPriceEntry } from '../types/gold/gold.type';

// API URL-i üçün env dəyişənini fərz edirik
const API_URL = import.meta.env.VITE_API_URL;

// Product tipinin bəzi sahələrini dəyişdiririk
type ProductPayload = Omit<Product, 'id' | 'created_at' | 'viewed_count'>;

export function AdminPanel({ onBack }: AdminPanelProps) {
    // 1. STATE BƏYANLARI (BÜTÜN 'cannot find name' xətalarını həll edir)
    const [products, setProducts] = useState<Product[]>([]);
    const [goldPrice, setGoldPrice] = useState<string>('60'); 
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    
    // Əlavə etdiyiniz state-i istifadə etməyəcəyik, çünki POST/PUT əməliyyatları ID-ni serverdən alır
    // const [latestGoldPriceId, setLatestGoldPriceId] = useState<number | null>(null); 
    
    // Şəkil yükləmə state-ləri
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingAdditional, setUploadingAdditional] = useState(false);
    
    // Əlavə şəkillərin URL-lərini yadda saxlayan text sahəsi
    const [additionalImagesInput, setAdditionalImagesInput] = useState('');

    const emptyProduct: ProductPayload = {
        title: '',
        article: null,
        category: '',
        description: '',
        size: '',
        metal: '',
        material: '',
        carat: '',
        weight: '',
        weight_grams: 0,
        price: 0,
        price_azn: 0,
        price_usd: 0,
        main_image_link: '', 
        additional_images_links: [], 
        has_diamond: false,
        // Düzgün boş dəyərlər
        gemstone_type: null, 
        gemstone_carat: null,
        production_status: 'Hazırdır', 
        stock_status: 'Stokda', 
        availability: 'mövcuddur', 
        is_active: true, 
        featured_flags: [],
        selected_credit_option: null,
        credit_options: [],
    };
    
    // FormData üçün state bəyanı
    const [formData, setFormData] = useState<ProductPayload>(emptyProduct);

    // 2. LIFECYCLE VƏ DATA ÇƏKMƏ
    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [productsResult, goldPriceResult] = await Promise.all([
                axios.get<Product[]>(`${API_URL}/products`),
                axios.get<GoldPriceEntry[]>(`${API_URL}/gold_prices?carat=24&_limit=1`), // 24 Karatın ən son qiyməti
            ]);

            setProducts(productsResult.data || []);
            
            // Ən son qızıl qiymətini götürmə
            if (goldPriceResult.data && goldPriceResult.data.length > 0) {
                const latestPrice = goldPriceResult.data[0]; 
                setGoldPrice(latestPrice.price_per_gram.toString());
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            toast.error('Məlumatları yükləyərkən xəta baş verdi.');
        } finally {
            setLoading(false);
        }
    }
    
    // 3. QIZIL QİYMƏTİNİ YENİLƏMƏ
    async function updateGoldPrice() {
        const newPriceNum = parseFloat(goldPrice);
        if (isNaN(newPriceNum) || newPriceNum <= 0) {
             toast.error('Düzgün qiymət daxil edin.');
             return;
        }
        
        try {
            // Qızıl qiymətini yeniləyən POST əməliyyatı (yeni qeyd yaradır)
            await axios.post(`${API_URL}/gold_prices`, { 
                price_per_gram: newPriceNum,
                carat: 24, // Əsas qiyməti 24 karat üçün fərz edirik
            });

            toast.success('Qızıl qiyməti yeniləndi! Məhsul qiymətləri yenilənir...');
            fetchData(); // Yeni qiyməti çəkmək üçün
        } catch (err) {
            console.error('Error updating gold price:', err);
            toast.error('Qızıl qiymətini yeniləməkdə xəta baş verdi.');
        }
    }

    // 4. ŞƏKİL YÜKLƏMƏ FUNKSİYASI
    async function handleImageUpload(file: File, isMainImage: boolean) {
        const setUploading = isMainImage ? setUploadingMain : setUploadingAdditional;
        setUploading(true);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file); 
            
            // API yolu `/files` olaraq fərz edilir
            const response = await axios.post<{ publicUrl: string }>(
                `${API_URL}/files`, 
                uploadFormData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            const publicUrl = response.data.publicUrl;

            if (isMainImage) {
                setFormData(prev => ({ ...prev, main_image_link: publicUrl })); 
            } else {
                // Əlavə şəkilləri mövcud sətirlərə əlavə edir
                const currentImages = additionalImagesInput ? additionalImagesInput + '\n' : '';
                setAdditionalImagesInput(currentImages + publicUrl);
            }
            toast.success('Şəkil uğurla yükləndi!');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Şəkil yükləmək mümkün olmadı.');
        } finally {
            setUploading(false);
        }
    }

    // 5. REDAKTƏ/ƏLAVƏ MƏNTİQİ
    function startEdit(product: Product) {
        setEditingProduct(product);
        
        // YENİ DÜZƏLİŞ: Product tipindən çıxardığımız sahələri ayırırıq
        const { id, created_at, viewed_count, ...payloadData } = product;
        
        // Gemstone sahələri boş string ola bilərdi, onu null kimi çeviririk (əgər type-da null varsa)
        const formattedData: ProductPayload = {
            ...payloadData,
            gemstone_type: payloadData.gemstone_type || null,
            gemstone_carat: payloadData.gemstone_carat || null,
        } as ProductPayload;

        setFormData(formattedData); 
        setAdditionalImagesInput((product.additional_images_links || []).join('\n'));
        setIsAddingNew(false);
    }

    function startAddNew() {
        setEditingProduct(null);
        setFormData(emptyProduct);
        setAdditionalImagesInput('');
        setIsAddingNew(true);
    }

    function cancelEdit() {
        setEditingProduct(null);
        setIsAddingNew(false);
        setFormData(emptyProduct);
        setAdditionalImagesInput('');
    }

    // 6. MƏHSULU YADDA SAXLAMA (Əlavə etmə və Yeniləmə)
    async function saveProduct() {
        try {
            const additionalImages = additionalImagesInput
                .split('\n')
                .map((url) => url.trim())
                .filter((url) => url.length > 0);

            // Çəki hesablanması
            const weightMatch = formData.weight.match(/([0-9.]+)/);
            const weightNum = parseFloat(weightMatch ? weightMatch[0] : '0');

            let calculatedPrice = formData.price;
            const isGold = formData.metal.toLowerCase().includes('qızıl') || formData.metal.toLowerCase().includes('gold');
            
            // Qiymətin qızılın çəkisi və cari qızıl qiymətinə əsasən yenidən hesablanması
            if (isGold) {
                const goldPricePerGram = parseFloat(goldPrice);
                calculatedPrice = weightNum * goldPricePerGram;
            }

            const productData = {
                ...formData,
                additional_images_links: additionalImages, 
                price: calculatedPrice, 
                price_usd: calculatedPrice,
                weight_grams: weightNum,
            };

            if (isAddingNew) {
                await axios.post(`${API_URL}/products`, productData);
                toast.success('Məhsul uğurla əlavə edildi!');
            } else if (editingProduct) {
                await axios.put(`${API_URL}/products/${editingProduct.id}`, productData);
                toast.success('Məhsul uğurla yeniləndi!');
            }

            cancelEdit();
            fetchData();
        } catch (err) {
            console.error('Error saving product:', err);
            toast.error('Məhsulu yadda saxlayarkən xəta baş verdi!');
        }
    }

    // 7. MƏHSULU SİLMƏ
    async function deleteProduct(id: Product['id']) {
        if (!confirm('Bu məhsulu silmək istədiyinizdən əminsiniz?')) return;

        try {
            await axios.delete(`${API_URL}/products/${id}`);
            toast.success('Məhsul uğurla silindi!');
            fetchData();
        } catch (err) {
            console.error('Error deleting product:', err);
            toast.error('Məhsulu silərkən xəta baş verdi!');
        }
    }
    
    // --- RENDER HİSSƏSİ ---
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Admin Panel ⚙️</h2>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Kataloqa qayıt
                </button>
            </div>

            ---

            {/* Qızıl Qiyməti İdarəetməsi */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">1 Qram Qızılın USD Qiyməti (24K)</h3>
                </div>
                <div className="flex gap-3">
                    <input
                        type="number"
                        value={goldPrice}
                        onChange={(e) => setGoldPrice(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Qiymət (USD)"
                        step="0.01"
                    />
                    <button
                        onClick={updateGoldPrice}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                        Yenilə
                    </button>
                </div>
            </div>

            ---

            <CreditSettings /> 

            ---

            {/* Məhsul Forması */}
            {(editingProduct || isAddingNew) && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {isAddingNew ? 'Yeni Məhsul Əlavə Et' : `Məhsulu Redaktə Et (ID: ${editingProduct?.id})`}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Başlıq"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="text"
                            placeholder="Kateqoriya"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="text"
                            placeholder="Metal"
                            value={formData.metal}
                            onChange={(e) => setFormData({ ...formData, metal: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="text"
                            placeholder="Karat"
                            // DÜZƏLİŞ: Karat stringdir
                            value={formData.carat} 
                            onChange={(e) => setFormData({ ...formData, carat: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="text"
                            placeholder="Çəki (məs: 3.5q)"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                            value={formData.availability}
                            onChange={(e) => setFormData({ ...formData, availability: e.target.value as 'mövcuddur' | 'mövcud deyil' | 'sifarişlə' })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="mövcuddur">Mövcuddur</option>
                            <option value="mövcud deyil">Mövcud deyil</option>
                            <option value="sifarişlə">Sifarişlə</option>
                        </select>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="has_diamond"
                                checked={formData.has_diamond}
                                onChange={(e) => setFormData({ ...formData, has_diamond: e.target.checked })}
                                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                            />
                            <label htmlFor="has_diamond" className="text-sm font-medium text-gray-700">
                                Brilyant var
                            </label>
                        </div>
                        
                        {/* Əsas Şəkil */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Əsas şəkil (URL)
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Şəkil URL"
                                    value={formData.main_image_link} 
                                    onChange={(e) => setFormData({ ...formData, main_image_link: e.target.value })} 
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <label className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
                                       data-tooltip-content="Yükləmə aktivdirmi?"
                                >
                                    {uploadingMain ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    Yüklə
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], true)}
                                        className="hidden"
                                        disabled={uploadingMain}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Əlavə Şəkillər */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Əlavə şəkillər
                            </label>
                            <div className="flex gap-3 mb-2">
                                <label className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer">
                                    {uploadingAdditional ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-4 h-4" />
                                    )}
                                    Şəkil yüklə
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], false)}
                                        className="hidden"
                                        disabled={uploadingAdditional}
                                    />
                                </label>
                            </div>
                            <textarea
                                placeholder="Şəkil URL-ləri (hər sətirdə bir URL)"
                                value={additionalImagesInput}
                                onChange={(e) => setAdditionalImagesInput(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>
                        
                        {/* Təsvir */}
                        <textarea
                            placeholder="Təsvir"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2"
                            rows={4}
                        />
                    </div>
                    
                    {/* Yadda Saxla / Ləğv et düymələri */}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={saveProduct}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <Save className="w-4 h-4" />
                            Yadda saxla
                        </button>
                        <button
                            onClick={cancelEdit}
                            className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            <X className="w-4 h-4" />
                            Ləğv et
                        </button>
                    </div>
                </div>
            )}

            ---

            {/* Məhsul Siyahısı */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Məhsullar</h3>
                    <button
                        onClick={startAddNew}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Məhsul
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Şəkil</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Başlıq</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Kateqoriya</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Çəki</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Qiymət ($)</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Əməliyyatlar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <ImageWithSkeleton src={product.main_image_link} alt={product.title} className="w-16 h-16 object-cover rounded" />
                                    </td>
                                    <td className="py-3 px-4">{product.title}</td>
                                    <td className="py-3 px-4">{product.category}</td>
                                    <td className="py-3 px-4">{product.weight}</td>
                                    <td className="py-3 px-4 font-semibold">${product.price_usd.toFixed(2)}</td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm text-gray-600">{product.availability}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => startEdit(product)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(product.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}