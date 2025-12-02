import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Percent, Save, Loader2 } from 'lucide-react';

export function CreditSettings() {
  const [interestRate, setInterestRate] = useState<string>('15');
  const [minMonths, setMinMonths] = useState<string>('3');
  const [maxMonths, setMaxMonths] = useState<string>('12');
  const [minPrice, setMinPrice] = useState<string>('100');
  const [maxPrice, setMaxPrice] = useState<string>('10000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .in('key', [
          'credit_interest_rate',
          'credit_min_months',
          'credit_max_months',
          'credit_min_price',
          'credit_max_price',
        ]);

      if (data) {
        data.forEach((setting) => {
          switch (setting.key) {
            case 'credit_interest_rate':
              setInterestRate(setting.value);
              break;
            case 'credit_min_months':
              setMinMonths(setting.value);
              break;
            case 'credit_max_months':
              setMaxMonths(setting.value);
              break;
            case 'credit_min_price':
              setMinPrice(setting.value);
              break;
            case 'credit_max_price':
              setMaxPrice(setting.value);
              break;
          }
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const updates = [
        { key: 'credit_interest_rate', value: interestRate },
        { key: 'credit_min_months', value: minMonths },
        { key: 'credit_max_months', value: maxMonths },
        { key: 'credit_min_price', value: minPrice },
        { key: 'credit_max_price', value: maxPrice },
      ];

      for (const update of updates) {
        await supabase
          .from('settings')
          .update({ value: update.value, updated_at: new Date().toISOString() })
          .eq('key', update.key);
      }

      alert('Kredit parametrləri yeniləndi!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Xəta baş verdi!');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Percent className="w-6 h-6 text-amber-600" />
        <h3 className="text-lg font-semibold text-gray-900">Kredit Kalkulyatoru Parametrləri</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            İllik faiz dərəcəsi (%)
          </label>
          <input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            min="0"
            max="100"
            step="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum ay sayı
          </label>
          <input
            type="number"
            value={minMonths}
            onChange={(e) => setMinMonths(e.target.value)}
            min="1"
            max="12"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maksimum ay sayı
          </label>
          <input
            type="number"
            value={maxMonths}
            onChange={(e) => setMaxMonths(e.target.value)}
            min="1"
            max="60"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum qiymət (USD)
          </label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            min="0"
            step="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maksimum qiymət (USD)
          </label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min="0"
            step="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        onClick={saveSettings}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:bg-gray-400"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Yenilənir...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Parametrləri Yadda Saxla
          </>
        )}
      </button>
    </div>
  );
}