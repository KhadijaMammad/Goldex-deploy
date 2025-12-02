import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { X, Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { ImageWithSkeleton } from '../ImageWithSkeleton';

interface Product {
  id?: string;
  title: string;
  article?: string;
  category: string;
  material: string;
  karat: string;
  weight_grams: number;
  gemstone_type: string;
  gemstone_carat: string;
  price_azn: number;
  production_status: string;
  stock_status: string;
  availability: string;
  main_image: string;
  additional_images: string[];
  description: string;
  size: string;
  featured_flags: string[];
  active: boolean;
  selected_credit_option?: string;
}

interface ProductEditModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
  goldPricePerGram: number;
}

export function ProductEditModal({ product, onClose, onSave, goldPricePerGram }: ProductEditModalProps) {
  const [formData, setFormData] = useState<Product>({
    title: '',
    article: '',
    category: '',
    material: '',
    karat: '',
    weight_grams: 0,
    gemstone_type: '',
    gemstone_carat: '',
    price_azn: 0,
    production_status: 'Hazırdır',
    stock_status: 'Stokda',
    availability: 'mövcuddur',
    main_image: '',
    additional_images: [],
    description: '',
    size: '',
    featured_flags: [],
    active: true,
    selected_credit_option: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [creditOptions, setCreditOptions] = useState<Array<{ name: string; months_min: number; months_max: number; interest_percent: number }>>([]);
  const [selectedCreditOption, setSelectedCreditOption] = useState<string>('');

  useEffect(() => {
    if (product) {
      setFormData(product);
      setSelectedCreditOption(product.selected_credit_option || '');
    }
  }, [product]);

  useEffect(() => {
    fetchCategories();
    fetchCreditOptions();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchCreditOptions = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'credit_options')
        .maybeSingle();

      if (data) {
        setCreditOptions(JSON.parse(data.value));
      }
    } catch (err) {
      console.error('Error fetching credit options:', err);
    }
  };

  const calculatedGoldValue = formData.weight_grams * goldPricePerGram * 1.7;

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData({ ...formData, main_image: url });
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Şəkillər yüklənərkən xəta baş verdi!');
    } finally {
      setUploading(false);
    }
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const urls = await Promise.all(uploadPromises);

      const newImages = [...formData.additional_images, ...urls];
      setFormData({ ...formData, additional_images: newImages });
    } catch (err) {
      console.error('Error uploading images:', err);
      toast.error('Şəkillər yüklənərkən xəta baş verdi!');
    } finally {
      setUploading(false);
    }
  };

  const removeAdditionalImage = (index: number) => {
    const newImages = formData.additional_images.filter((_, i) => i !== index);
    setFormData({ ...formData, additional_images: newImages });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const productData = {
        ...formData,
        article: formData.article || null,
        additional_images: formData.additional_images,
        weight: `${formData.weight_grams}q`,
        price_usd: formData.price_azn,
        metal: formData.material,
        selected_credit_option: selectedCreditOption || null
      };

      let result;
      if (product?.id) {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select();
      } else {
        result = await supabase
          .from('products')
          .insert([productData])
          .select();
      }

      if (result.error) {
        throw result.error;
      }

      toast.success( 'Məhsul yeniləndi!' );
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      toast.error(`Xəta baş verdi: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleFeaturedFlag = (flag: string) => {
    const flags = formData.featured_flags.includes(flag)
      ? formData.featured_flags.filter(f => f !== flag)
      : [...formData.featured_flags, flag];
    setFormData({ ...formData, featured_flags: flags });
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
            {/* Basic Info */}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Article</label>
              <input
                type="text"
                value={formData.article || ''}
                onChange={(e) => setFormData({ ...formData, article: e.target.value.slice(0, 20) })}
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Məhsul article kodu"
              />
              <p className="text-xs text-gray-500 mt-1">Maksimum 20 simvol</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kateqoriya</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Seçin...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Əyar / Material</label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="14K qızıl, 18K qızıl..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Karat</label>
              <input
                type="text"
                value={formData.karat}
                onChange={(e) => setFormData({ ...formData, karat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Çəki (qram)</label>
              <input
                type="number"
                value={formData.weight_grams}
                onChange={(e) => {
                  const weight = parseFloat(e.target.value) || 0;
                  const calculatedPrice = weight * goldPricePerGram * 1.7;
                  setFormData({ ...formData, weight_grams: weight, price_azn: calculatedPrice });
                }}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Calculated Gold Value */}
            <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900">
                Qızıl dəyəri (hesablanmış): {calculatedGoldValue.toFixed(2)} AZN
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Bu dəyər avtomatik hesablanır: {formData.weight_grams} qram × {goldPricePerGram} USD × 1.7
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daş növü</label>
              <input
                type="text"
                value={formData.gemstone_type}
                onChange={(e) => setFormData({ ...formData, gemstone_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Brilyant, Zümrüd..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brilyantın çəkisi</label>
              <input
                type="text"
                value={formData.gemstone_carat}
                onChange={(e) => setFormData({ ...formData, gemstone_carat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="0.5 karat"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qiymət (AZN)</label>
              <input
                type="number"
                value={formData.price_azn}
                onChange={(e) => setFormData({ ...formData, price_azn: parseFloat(e.target.value) || 0 })}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ölçü</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="18, L, XL..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hazırlanma statusu</label>
              <select
                value={formData.production_status}
                onChange={(e) => setFormData({ ...formData, production_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="Hazırdır">Hazırdır</option>
                <option value="Sifarişlə 3-5 gün">Sifarişlə 3-5 gün</option>
                <option value="Sifarişlə 7-10 gün">Sifarişlə 7-10 gün</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok statusu</label>
              <select
                value={formData.stock_status}
                onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="Stokda">Stokda</option>
                <option value="Sifarişlə">Sifarişlə</option>
              </select>
            </div>

            {/* Images */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Əsas şəkil</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {formData.main_image ? (
                  <div className="flex items-center gap-4">
                    <ImageWithSkeleton
                      src={formData.main_image}
                      alt="Main"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">Əsas şəkil yükləndi</p>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm">
                        <Upload className="w-4 h-4" />
                        Dəyişdir
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
                    <span className="text-sm font-medium text-gray-700">Şəkil əlavə et</span>
                    <span className="text-xs text-gray-500">PNG, JPG, WEBP (max 5MB)</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Əlavə şəkillər</label>
              <div className="space-y-3">
                {/* Upload Button */}
                <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center gap-2 hover:border-amber-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Şəkil əlavə et</span>
                  <span className="text-xs text-gray-500">Bir neçə şəkil seçə bilərsiniz</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImagesUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>

                {/* Image Grid */}
                {formData.additional_images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {formData.additional_images.map((image, index) => (
                      <div key={index} className="relative group">
                        <ImageWithSkeleton
                          src={image}
                          alt={`Additional ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {uploading && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-800">Şəkillər yüklənir...</span>
              </div>
            )}

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Təsvir</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Məhsul haqqında ətraflı məlumat..."
              />
            </div>

            {/* Featured Flags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Xüsusiyyətlər</label>
              <div className="flex flex-wrap gap-3">
                {['Yeni', 'Tövsiyə olunur', 'Ən çox baxılan'].map(flag => (
                  <label key={flag} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured_flags.includes(flag)}
                      onChange={() => toggleFeaturedFlag(flag)}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">{flag}</span>
                  </label>
                ))}
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

            {/* Credit Options */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Kredit variantı</label>
              <select
                value={selectedCreditOption}
                onChange={(e) => setSelectedCreditOption(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Kredit variantı seçin...</option>
                {creditOptions.map((option, index) => (
                  <option key={index} value={option.name}>
                    {option.name} ({option.months_min}-{option.months_max} ay, {option.interest_percent}% faiz)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Müştərilər seçilmiş variantın ay aralığında aylıq ödənişləri görəcəklər
              </p>
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