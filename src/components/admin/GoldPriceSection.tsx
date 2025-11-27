import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader2 } from 'lucide-react';

export function GoldPriceSection() {
  const [goldPrice, setGoldPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGoldPrice();
  }, []);

  async function fetchGoldPrice() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'gold_price_per_gram')
        .maybeSingle();

      if (data) {
        setGoldPrice(data.value);
      }
    } catch (err) {
      console.error('Error fetching gold price:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const priceValue = parseFloat(goldPrice);

      if (isNaN(priceValue) || priceValue <= 0) {
        alert('Zəhmət olmasa düzgün qiymət daxil edin!');
        setSaving(false);
        return;
      }

      // Update the gold price setting
      await supabase
        .from('settings')
        .update({ value: goldPrice, updated_at: new Date().toISOString() })
        .eq('key', 'gold_price_per_gram');

      // Update ALL products with new calculated prices based on weight
      const { data: products } = await supabase
        .from('products')
        .select('id, weight_grams');

      if (products && products.length > 0) {
        const updates = products.map(product => {
          const weightGrams = product.weight_grams || 0;
          const newPrice = weightGrams * priceValue * 1.7;

          return supabase
            .from('products')
            .update({
              price_azn: newPrice,
              price_usd: newPrice
            })
            .eq('id', product.id);
        });

        await Promise.all(updates);
      }

      alert('Qızıl qiyməti və bütün məhsul qiymətləri yeniləndi!');

    } catch (err) {
      console.error('Error saving gold price:', err);
      alert('Xəta baş verdi!');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Qızıl qiyməti</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qızılın 1 qramının USD qiyməti
          </label>
          <input
            type="number"
            value={goldPrice}
            onChange={(e) => setGoldPrice(e.target.value)}
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="74.50"
          />
          <p className="text-sm text-gray-500 mt-2">
            Bu qiyməti dəyişdirdikdə, bütün qızıl məhsulların qiymətləri avtomatik olaraq yenilənəcək.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Qiymət hesablama düsturu:</h3>
          <p className="text-sm text-gray-700">
            Məhsulun AZN qiyməti = Çəki (qram) × Qızıl qiyməti (USD) × 1.7
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-semibold disabled:bg-gray-300"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Yenilənir...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Yenilə
            </>
          )}
        </button>
      </div>
    </div>
  );
}
