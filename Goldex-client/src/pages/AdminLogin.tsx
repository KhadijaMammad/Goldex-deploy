import { useState } from "react";
import axios from "axios";
import { Lock, User, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

// Backend-dən gözlənilən cavab tipi
interface TokenResponse {
    access_token: string;
    token_type: string;
    // Əgər refresh token istifadə olunursa, onu da buraya əlavə etmək lazımdır
    // refresh_token?: string; 
}


// --- TİP DÜZƏLİŞİ: onLoginSuccess tokeni qəbul edir ---
export interface AdminLoginProps {
    // onLoginSuccess access_token-i qəbul etməlidir.
    onLoginSuccess: (token: string) => void; 
}


export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        try {
            // 1. API-a POST sorğusu göndərilir
            const response = await axios.post<TokenResponse>(
                `${API_URL}/auth/token`, 
                formData.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const { access_token } = response.data;
            
            // 2. Tokeni local storage'a yazırıq (Tətbiqin yenilənməsi üçün lazım)
            localStorage.setItem('access_token', access_token);
            
            // 3. Axios'un default header-ını təyin edirik (Bütün sorğular üçün avtorizasiya)
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            toast.success("Giriş uğurludur!");
            
            // 4. Tokeni valideyn komponentə ötürürük
            onLoginSuccess(access_token); 

        } catch (err) {
            console.error("Login error:", err);
            
            let errorMessage = "Gözlənilməyən xəta baş verdi.";
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 401 || err.response.status === 400) {
                    errorMessage = "İstifadəçi adı və ya şifrə yanlışdır.";
                } else if (err.response.data && err.response.data.detail) {
                    errorMessage = err.response.data.detail;
                }
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="flex items-center justify-center mb-8">
                    <div className="bg-gray-800 p-4 rounded-full">
                        <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    Admin Panel
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    GOLDEX İdarəetmə Paneli
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User className="w-4 h-4 inline mr-2" />
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="İstifadəçi adı"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Lock className="w-4 h-4 inline mr-2" />
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Daxil ol"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}