import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { ProductEditModal } from "./ProductEditModal";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { ImageWithSkeleton } from "../ImageWithSkeleton";

import { Product } from "../../types/products/product.type"; 

const API_URL = import.meta.env.VITE_API_URL;

interface CurrentGoldPrice {
    id: number;
    carat: number;           
    price_per_gram: number; 
    updated_at: string;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    if (token) {
        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    }
    return {};
};


export function ProductsSection() {
    const [products, setProducts] = useState<Product[]>([]); 
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [goldPrice, setGoldPrice] = useState<number>(0); 
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [searchQuery]);

    async function fetchData() {
        setLoading(true);
        try {
            const authConfig = getAuthHeaders();

            const [productsResult, goldPriceResult] = await Promise.all([
                axios.get<Product[]>(`${API_URL}/products`, {
                    ...authConfig,
                    params: {
                        search_query: searchQuery,
                    }
                }), 
                
                axios.get<CurrentGoldPrice | CurrentGoldPrice[]>(`${API_URL}/gold_prices`), 
            ]);

            if (productsResult.data) {
                setProducts(productsResult.data);
            }
            
            // 💰 Qızıl Qiymətinin İşlənməsi 
            let goldPriceData: CurrentGoldPrice | undefined;
            
            // Cavab massivdirsə, ilk elementi götür
            if (Array.isArray(goldPriceResult.data) && goldPriceResult.data.length > 0) {
                goldPriceData = goldPriceResult.data[0];
            // Cavab birbaşa obyektdirsə
            } else if (goldPriceResult.data && !Array.isArray(goldPriceResult.data)) {
                goldPriceData = goldPriceResult.data as CurrentGoldPrice;
            }

            // Dəyəri təyin et
            if (goldPriceData && goldPriceData.price_per_gram) {
                setGoldPrice(goldPriceData.price_per_gram);
            } else {
                setGoldPrice(0); // Dəyər tapılmadıqda 0.00
            }
            
        } catch (err) {
            console.error("Error fetching data:", err);
            // 401 Unauthorized xətasını yoxlayaq
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                toast.error("Avtorizasiya uğursuz oldu. Zəhmət olmasa, yenidən daxil olun.");
            } else {
                toast.error("Məlumatları yükləyərkən xəta baş verdi.");
            }
        } finally {
            setLoading(false);
        }
    }


    const handleDelete = async (id: number) => { 
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
                
                const authConfig = getAuthHeaders();
                
                if (!authConfig.headers) {
                    toast.error("Silmək üçün avtorizasiya tələb olunur.");
                    return;
                }

                try {
                    await axios.delete(`${API_URL}/products/${id}`, authConfig); 

                    setProducts((prev) => prev.filter((p) => p.id !== id));

                    Swal.fire({
                        icon: "success",
                        title: "Silindi!",
                        text: "Məhsul uğurla silindi.",
                        timer: 1500,
                        showConfirmButton: false,
                    });
                } catch (err) {
                    console.error("Product delete error:", err);
                    
                    const status = axios.isAxiosError(err) ? err.response?.status : null;
                    let errorText = "Məhsulu silmək mümkün olmadı.";

                    if (status === 401) errorText = "Avtorizasiya tələb olunur.";
                    if (status === 404) errorText = "Məhsul tapılmadı (404).";
                    
                    Swal.fire({
                        icon: "error",
                        title: "Xəta!",
                        text: errorText,
                    });
                }
            }
        });
    };


    async function toggleActive(id: number, currentActive: boolean) {
        
        const authConfig = getAuthHeaders();

        if (!authConfig.headers) {
            toast.error("Aktiv statusu dəyişdirmək üçün avtorizasiya tələb olunur.");
            return;
        }

        try {
            const newActiveStatus = !currentActive;
            
            await axios.patch(`${API_URL}/products/${id}`, 
                {
                    is_active: newActiveStatus,
                },
                authConfig
            ); 

            setProducts((prev) =>
                prev.map((p) =>
                    p.id === id ? { ...p, is_active: newActiveStatus } : p
                )
            );

            toast.success(newActiveStatus ? "Məhsul aktiv edildi!" : "Məhsul passiv edildi!");

        } catch (err) {
            console.error("Error toggling active:", err);
            
            if (axios.isAxiosError(err)) {
                let errorText = "Aktiv statusu dəyişdirilərkən xəta baş verdi.";
                
                if (err.response?.status === 404) {
                    errorText = "API endpointi tapılmadı (404). Zəhmət olmasa URL-i yoxlayın.";
                } else if (err.response?.status === 401) {
                    errorText = "Avtorizasiya uğursuz oldu (401). Giriş tokeninizi yoxlayın.";
                }
                toast.error(errorText);
            } else {
                toast.error("Aktiv statusu dəyişdirilərkən naməlum xəta baş verdi.");
            }
        }
    }


    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingProduct(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const handleSave = () => {
        fetchData();
    };

    const handleToggleActiveFromTable = (id: number, currentActive: boolean) => {
        toggleActive(id, currentActive);
    };

    const filteredProducts = products;


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
                <p className="text-sm font-semibold text-gray-600">
                    💰 Qızıl qiyməti: {goldPrice !== 0 ? `${goldPrice.toFixed(2)} USD` : "Yüklənir..."}
                </p>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Məhsulun ID-si, adı və ya axtarış sahəsi üzrə axtar..."
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
                                    ID
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
                                        <ImageWithSkeleton
                                            src={product.main_image_link}
                                            alt={product.title}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-gray-900">
                                            {product.title}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Category ID: {product.category_id} 
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-700">
                                        {product.id}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-700">
                                        {product.material}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-700">
                                        {product.weight}q
                                    </td>
                                    <td className="py-3 px-4 font-semibold text-gray-900">
                                        {product.price.toFixed(2)} ₼
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleToggleActiveFromTable(product.id, product.is_active)}
                                            className={`p-1 rounded ${
                                                product.is_active 
                                                    ? "text-green-600 hover:bg-green-50"
                                                    : "text-gray-400 hover:bg-gray-100"
                                            }`}
                                        >
                                            {product.is_active ? (
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