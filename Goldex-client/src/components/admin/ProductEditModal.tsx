import { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Save, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { ImageWithSkeleton } from "../ImageWithSkeleton";
import { ProductEditModalProps } from "../../types/products/product.type";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

type EditableProduct = {
  title: string;
  description: string | null;
  category_id: number;
  gold_price_id: number;
  metal: string; // Siz JSON-da string ('Gold') verdiyiniz üçün type-ı string saxlayıram
  material: string; // Siz JSON-da string ('Yellow Gold') verdiyiniz üçün type-ı string saxlayıram
  carat: number | null;
  weight: number;
  custom_price: number | null;
  discount: number;
  gemstone_type: string | null;
  gemstone_carat: number | null;
  gemstone_weight: number | null;
  gemstone_size: string | null;

  // Boolean statuslar
  production_status: boolean;
  availability: boolean;
  stock_status: boolean;

  is_new: boolean;
  is_recommended: boolean;
  is_most_viewed: boolean;
  is_active: boolean;

  // API-yə göndərilən datada olmasa da, Formda şəkil göstərmək üçün lazımdır
  main_image_link: string | null;
};

// Əsas URL
const API_URL = import.meta.env.VITE_API_URL;

export function ProductEditModal({
  product,
  onClose,
  onSave,
  goldPricePerGram,
}: ProductEditModalProps) {
  // Köməkçi funksiya (dəyişməz)
  const getWeightGrams = (
    weightString: string | number | null | undefined
  ): number => {
    if (typeof weightString === "number") return weightString;
    if (
      weightString == null ||
      typeof weightString !== "string" ||
      weightString.trim() === ""
    )
      return 0;
    const match = weightString.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Yalnız tələb olunan propertylərə uyğun INITIAL FORMDATA
  const initialFormData: EditableProduct = {
    title: "",
    description: null,
    category_id: 0,
    gold_price_id: 0,
    metal: "",
    material: "",
    carat: null,
    weight: 0,
    custom_price: null,
    discount: 0,
    gemstone_type: null,
    gemstone_carat: null,
    gemstone_weight: null,
    gemstone_size: null,
    production_status: true,
    availability: true,
    stock_status: true,
    is_new: false,
    is_recommended: false,
    is_most_viewed: false,
    is_active: true,
    main_image_link: null,
  };

  const [formData, setFormData] = useState<EditableProduct>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);

  // Mövcud məhsul datası ilə formu doldurmaq
  useEffect(() => {
    if (product) {
      setFormData({
        // Yalnız 21 Tələb olunan Sahəni Doldurmaq
        title: product.title,
        description: product.description || null,
        category_id: Number(product.category_id) || 0,
        gold_price_id: Number(product.gold_price_id) || 0,

        // Qeyd: Metal və Material əvvəlki xətalardan sonra Number əvəzinə String olaraq saxlanıldı
        metal: (product as any).metal || "",
        material: (product as any).material || "",

        carat: parseFloat(product.carat as string) || null,
        weight: getWeightGrams(product.weight),
        custom_price: product.custom_price || null,
        discount: product.discount || 0,

        gemstone_type: product.gemstone_type || null,
        gemstone_carat: parseFloat(product.gemstone_carat as string) || null,
        gemstone_weight: (product as any).gemstone_weight || null,
        gemstone_size: product.gemstone_size || null,

        // Tip uyğunsuzluğu həlli (TS2367)
        production_status:
          typeof product.production_status === "boolean"
            ? product.production_status
            : product.production_status === "Hazırdır",
        availability:
          typeof product.availability === "boolean"
            ? product.availability
            : product.availability === "mövcuddur",
        stock_status:
          typeof product.stock_status === "boolean"
            ? product.stock_status
            : product.stock_status === "Stokda",

        is_new: product.is_new,
        is_recommended: product.is_recommended,
        is_most_viewed: product.is_most_viewed,
        is_active: product.is_active,

        // Şəkil linkini formda göstərmək üçün
        main_image_link: (product as any).main_image_link || null,
      } as unknown as EditableProduct);
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
        setCategories(
          data.map((c: any) => ({ id: Number(c.id), name: c.title || c.name }))
        );
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Kateqoriyaları yükləmək mümkün olmadı.");
    }
  };

  const safeWeight = Number(formData.weight) || 0;
  const calculatedGoldValue = safeWeight * (goldPricePerGram ?? 0) * 1.7;

  const uploadImage = async (file: File): Promise<string> => {
    // Mock image upload, real API call here
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return `https://mock-image-server.com/images/${Date.now()}-${file.name.replace(
      /\s/g,
      "_"
    )}`;
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
      console.error("Error uploading image:", err);
      toast.error("Şəkil yüklənərkən xəta baş verdi!");
    } finally {
      setUploading(false);
    }
  };

  // Saxlama funksiyası
  const handleSave = async () => {
    setSaving(true);
    const authConfig = getAuthHeaders();

    if (!authConfig.headers) {
      toast.error("Saxlama üçün avtorizasiya tələb olunur.");
      setSaving(false);
      return;
    }

    try {
      const productDataToSend = {
        title: formData.title,
        description: formData.description || "",
        category_id: Number(formData.category_id) || null,
        gold_price_id: formData.gold_price_id ?? 1,
        metal: formData.metal,
        material: formData.material,
        carat: formData.carat || null,
        weight: safeWeight,
        custom_price: formData.custom_price || null,
        discount: formData.discount || 0,
        gemstone_type: formData.gemstone_type || null,
        gemstone_carat: formData.gemstone_carat || null,
        gemstone_weight: formData.gemstone_weight || null,
        gemstone_size: formData.gemstone_size || null,

        production_status: formData.production_status,
        availability: formData.availability,
        stock_status: formData.stock_status,
        is_active: formData.is_active,
        is_new: formData.is_new,
        is_recommended: formData.is_recommended,
        is_most_viewed: formData.is_most_viewed,

        ...(product?.id && {
          id: product.id,
        }),
      };

      const isEdit = !!product?.id;
      const apiEndpoint = `${API_URL}/products/` + `${isEdit ? product.id : ""
      }`;
      if (product?.id) {
        await axios.patch(apiEndpoint, productDataToSend, authConfig);
      } else {
        await axios.post(apiEndpoint, productDataToSend, authConfig);
      }

      toast.success(
        product?.id
          ? "Məhsul uğurla yeniləndi!"
          : "Yeni məhsul uğurla əlavə edildi!"
      );
      onSave();
      onClose();
    } catch (err) {
      console.error("Error saving product:", err);

      let errorMessage = "Saxlama zamanı bilinməyən xəta baş verdi.";

      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 422) {
          const validationErrors =
            err.response.data.errors || err.response.data.message;
          if (validationErrors) {
            const firstError =
              typeof validationErrors === "object"
                ? Object.values(validationErrors)[0]
                : validationErrors;
            errorMessage = `Məlumat Xətası: ${
              Array.isArray(firstError) ? firstError[0] : firstError
            }`;
          } else {
            errorMessage =
              "Validasiya Xətası: Göndərilən məlumatlar formatı səhvdir.";
          }
        } else if (err.response.status === 401) {
          errorMessage = "Avtorizasiya uğursuz oldu. Tokeninizi yoxlayın.";
        } else {
          errorMessage = `API Xətası: Status ${err.response.status}`;
        }
      }

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // FORM RENDERİ (YALNIZ YUXARIDAKI SAHƏLƏR ÜÇÜN İNPUTLAR)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {product?.id ? "Məhsulu Redaktə Et" : "Yeni Məhsul Əlavə Et"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Məhsul adı
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 3. category_id */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kateqoriya (ID)
              </label>
              <select
                value={formData.category_id || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category_id: parseInt(e.target.value) || 0,
                  })
                }
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

            {/* 4. gold_price_id */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qızıl Qiyməti (ID)
              </label>
              <input
                type="number"
                value={formData.gold_price_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gold_price_id: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="1"
              />
            </div>

            {/* 5. metal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metal (Gold, Silver)
              </label>
              <input
                type="text"
                value={formData.metal}
                onChange={(e) =>
                  setFormData({ ...formData, metal: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Gold"
              />
            </div>

            {/* 6. material */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material (Yellow Gold, White Gold)
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) =>
                  setFormData({ ...formData, material: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Yellow Gold"
              />
            </div>

            {/* 7. carat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Karat (22, 18)
              </label>
              <input
                type="number"
                value={formData.carat ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    carat: parseFloat(e.target.value) || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 8. weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Çəki (qram)
              </label>
              <input
                type="number"
                value={safeWeight}
                onChange={(e) => {
                  const weight = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, weight: weight });
                }}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Hesablanmış Dəyər (Yalnız məlumat üçün) */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900">
                Hesablanmış Dəyər: {calculatedGoldValue.toFixed(2)} AZN
              </p>
            </div>

            {/* 9. custom_price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xüsusi Qiymət (AZN)
              </label>
              <input
                type="number"
                value={formData.custom_price ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    custom_price: parseFloat(e.target.value) || null,
                  })
                }
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="3000"
              />
            </div>

            {/* 10. discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endirim (%)
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount: parseInt(e.target.value) || 0,
                  })
                }
                min={0}
                max={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 11. gemstone_type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daş növü
              </label>
              <input
                type="text"
                value={formData.gemstone_type ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, gemstone_type: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Diamond"
              />
            </div>

            {/* 12. gemstone_carat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daşın çəkisi (karat)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.gemstone_carat ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gemstone_carat: parseFloat(e.target.value) || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="0.5"
              />
            </div>

            {/* 13. gemstone_weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daşın çəkisi (qram)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.gemstone_weight ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gemstone_weight: parseFloat(e.target.value) || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="0.25"
              />
            </div>

            {/* 14. gemstone_size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daşın ölçüsü
              </label>
              <input
                type="text"
                value={formData.gemstone_size ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, gemstone_size: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="6mm"
              />
            </div>

            {/* 15. production_status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hazırlanma statusu
              </label>
              <select
                value={formData.production_status ? "Hazırdır" : "Sifarişlə"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    production_status: e.target.value === "Hazırdır",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="Hazırdır">Hazırdır</option>
                <option value="Sifarişlə">Sifarişlə</option>
              </select>
            </div>

            {/* 17. stock_status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stok statusu
              </label>
              <select
                value={formData.stock_status ? "Stokda" : "Stokda deyil"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock_status: e.target.value === "Stokda",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="Stokda">Stokda</option>
                <option value="Stokda deyil">Stokda deyil</option>
              </select>
            </div>

            {/* 16. availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mövcudluq
              </label>
              <select
                value={formData.availability ? "mövcuddur" : "mövcud deyil"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availability: e.target.value === "mövcuddur",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="mövcuddur">Mövcuddur</option>
                <option value="mövcud deyil">Mövcud deyil</option>
              </select>
            </div>

            {/* main_image_link (Redaktə üçün lazım) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Əsas şəkil linki
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {/* Şəkil yükləmə hissəsi saxlanıldı */}
                {formData.main_image_link ? (
                  <div className="flex items-center gap-4">
                    <ImageWithSkeleton
                      src={formData.main_image_link}
                      alt="Main"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        Mevcud Link: {formData.main_image_link.substring(0, 50)}
                        ...
                      </p>
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
                    <span className="text-sm font-medium text-gray-700">
                      Əsas Şəkil Yüklə
                    </span>
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

            {/* 2. description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Təsvir
              </label>
              <textarea
                value={formData.description ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Beautiful handcrafted necklace"
              />
            </div>

            {/* Xüsusiyyətlər (Checkboxlar) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xüsusiyyətlər
              </label>
              <div className="flex flex-wrap gap-4">
                {/* 21. is_active */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Aktivdir</span>
                </label>
                {/* 18. is_new */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_new}
                    onChange={(e) =>
                      setFormData({ ...formData, is_new: e.target.checked })
                    }
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Yenidir</span>
                </label>
                {/* 19. is_recommended */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_recommended}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_recommended: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Tövsiyə olunur</span>
                </label>
                {/* 20. is_most_viewed */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_most_viewed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_most_viewed: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Ən çox baxılan</span>
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
                Yadda Saxla
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
