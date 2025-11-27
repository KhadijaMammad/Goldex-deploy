import { useState, useEffect } from 'react';
import { supabase, Product } from '../lib/supabase';
import { Plus, Edit, Trash2, Save, X, DollarSign, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { CreditSettings } from './CreditSettings';
import toast from 'react-hot-toast';

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [goldPrice, setGoldPrice] = useState<string>('60');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const emptyProduct: Omit<Product, 'id' | 'created_at'> = {
    title: '',
    category: '',
    metal: '',
    material: '',
    karat: '',
    weight: '',
    weight_grams: 0,
    availability: 'mövcuddur',
    description: '',
    main_image: '',
    additional_images: [],
    price_usd: 0,
    price_azn: 0,
    has_diamond: false,
    gemstone_type: '',
    gemstone_carat: '',
    production_status: '',
    stock_status: '',
    size: '',
    featured_flags: [],
    active: true,
    viewed_count: 0,
    credit_options: [],
  };

  const [formData, setFormData] = useState<Omit<Product, 'id' | 'created_at'>>(emptyProduct);
  const [additionalImagesInput, setAdditionalImagesInput] = useState('');
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [productsResult, settingsResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*').eq('key', 'gold_price_per_gram').maybeSingle(),
      ]);

      if (productsResult.data) setProducts(productsResult.data);
      if (settingsResult.data) setGoldPrice(settingsResult.data.value);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateGoldPrice() {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: goldPrice, updated_at: new Date().toISOString() })
        .eq('key', 'gold_price_per_gram');

      if (error) throw error;

      const rpcResult = await supabase.rpc('update_gold_prices' as any, { new_price: parseFloat(goldPrice) });
      if (rpcResult.error) {
        // Fallback: update product prices manually
        const { data } = await supabase.from('products').select('*').ilike('metal', '%qızıl%');
        if (data) {
          for (const product of data) {
            try {
              const weightNum = parseFloat((product.weight || '').toString().replace(/[^0-9.]/g, '')) || 0;
              const newPrice = weightNum * parseFloat(goldPrice);
              await supabase.from('products').update({ price_usd: newPrice }).eq('id', product.id);
            } catch (e) {
              // continue on per-product error
              console.error('Error updating product price fallback:', e);
            }
          }
        }
      }

      // alert('Qızıl qiyməti yeniləndi!');
      toast.success('Qızıl qiyməti yeniləndi!');
      fetchData();
    } catch (err) {
      console.error('Error updating gold price:', err);
      toast.error('Xəta baş verdi!');
    }
  }

  async function handleImageUpload(file: File, isMainImage: boolean) {
    try {
      if (isMainImage) {
        setUploadingMain(true);
      } else {
        setUploadingAdditional(true);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (isMainImage) {
        setFormData({ ...formData, main_image: publicUrl });
      } else {
        const currentImages = additionalImagesInput ? additionalImagesInput + '\n' : '';
        setAdditionalImagesInput(currentImages + publicUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Şəkil yükləmək mümkün olmadı. Xahiş edirik URL istifadə edin.');
    } finally {
      setUploadingMain(false);
      setUploadingAdditional(false);
    }
  }

  function startEdit(product: Product) {
    setEditingProduct(product);
    setFormData({ ...product });
    setAdditionalImagesInput((product.additional_images || []).join('\n'));
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

  async function saveProduct() {
    try {
      const additionalImages = additionalImagesInput
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const weightNum = parseFloat(formData.weight.replace(/[^0-9.]/g, ''));
      let calculatedPrice = formData.price_usd;

      if (formData.metal.toLowerCase().includes('qızıl') || formData.metal.toLowerCase().includes('gold')) {
        calculatedPrice = weightNum * parseFloat(goldPrice);
      }

      const productData = {
        ...formData,
        additional_images: additionalImages,
        price_usd: calculatedPrice,
      };

      if (isAddingNew) {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        alert('Məhsul əlavə edildi!');
      } else if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        alert('Məhsul yeniləndi!');
      }

      cancelEdit();
      fetchData();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Xəta baş verdi!');
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Bu məhsulu silmək istədiyinizdən əminsiniz?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      alert('Məhsul silindi!');
      fetchData();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Xəta baş verdi!');
    }
  }

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
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Kataloqa qayıt
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">1 Qram Qızılın USD Qiyməti</h3>
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

      <CreditSettings />

      {(editingProduct || isAddingNew) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isAddingNew ? 'Yeni Məhsul Əlavə Et' : 'Məhsulu Redaktə Et'}
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
              value={formData.karat}
              onChange={(e) => setFormData({ ...formData, karat: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Əsas şəkil
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Şəkil URL"
                  value={formData.main_image}
                  onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <label className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer">
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
            <textarea
              placeholder="Təsvir"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2"
              rows={4}
            />
          </div>
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Qiymət</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <img src={product.main_image} alt={product.title} className="w-16 h-16 object-cover rounded" />
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
