import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Plus, Edit, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { ProductEditModal } from "./ProductEditModal";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

interface Product {
  id: string;
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
  credit_options: any;
}

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [goldPrice, setGoldPrice] = useState(60);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [productsResult, goldPriceResult] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("settings")
          .select("*")
          .eq("key", "gold_price_per_gram")
          .maybeSingle(),
      ]);

      if (productsResult.data) {
        setProducts(productsResult.data);
      }
      if (goldPriceResult.data) {
        setGoldPrice(parseFloat(goldPriceResult.data.value));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

const handleDelete = async (id: string) => {
  Swal.fire({
    title: "Əminsiniz?",
    text: "Bu məhsulu silmək istədiyinizdən əminsiniz?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Bəli, sil!",
    cancelButtonText: "Ləğv et",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Supabase-dən silirik
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;

        // Client state-dən də silirik
        setProducts((prev) => prev.filter((p) => p.id !== id));

        // SweetAlert success mesaj
        Swal.fire({
          icon: "success",
          title: "Silindi!",
          text: "Məhsul uğurla silindi.",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("Product delete error:", err);
        Swal.fire({
          icon: "error",
          title: "Xəta!",
          text: "Məhsulu silmək mümkün olmadı.",
        });
      }
    }
  });
};


  async function toggleActive(id: string, currentActive: boolean) {
    try {
      await supabase
        .from("products")
        .update({ active: !currentActive })
        .eq("id", id);
      fetchData();
    } catch (err) {
      console.error("Error toggling active:", err);
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setShowModal(true);
    toast.success("Yeni məhsul əlavə edildi!");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleSave = () => {
    fetchData();
  };

  const filteredProducts = products.filter((product) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.title.toLowerCase().includes(query) ||
      product.article?.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Məhsullar</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Yeni məhsul əlavə et
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Article, ad və ya kateqoriya üzrə axtar..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Şəkil
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Məhsul adı
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Article
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Əyar
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Çəki
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                  Qiymət (AZN)
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">
                  Aktiv
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                  Əməliyyatlar
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <img
                      src={product.main_image}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {product.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.category}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {product.article || "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {product.material}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {product.weight_grams}q
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {product.price_azn.toFixed(2)} ₼
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleActive(product.id, product.active)}
                      className={`p-1 rounded ${
                        product.active
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {product.active ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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

      {showModal && (
        <ProductEditModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={handleSave}
          goldPricePerGram={goldPrice}
        />
      )}
    </div>
  );
}