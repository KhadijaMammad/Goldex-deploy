import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';

interface CreditOption {
  name: string;
  months_min: number;
  months_max: number;
  interest_percent: number;
}

export function CreditSettingsSection() {
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [minDownpayment, setMinDownpayment] = useState('');
  const [options, setOptions] = useState<CreditOption[]>([]);
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
        .in('key', ['credit_min_amount', 'credit_max_amount', 'credit_min_downpayment', 'credit_options']);

      if (data) {
        data.forEach((setting) => {
          switch (setting.key) {
            case 'credit_min_amount':
              setMinAmount(setting.value);
              break;
            case 'credit_max_amount':
              setMaxAmount(setting.value);
              break;
            case 'credit_min_downpayment':
              setMinDownpayment(setting.value);
              break;
            case 'credit_options':
              setOptions(JSON.parse(setting.value));
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

  async function handleSave() {
    setSaving(true);
    try {
      const updates = [
        { key: 'credit_min_amount', value: minAmount },
        { key: 'credit_max_amount', value: maxAmount },
        { key: 'credit_min_downpayment', value: minDownpayment },
        { key: 'credit_options', value: JSON.stringify(options) },
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

  const addOption = () => {
    setOptions([...options, { name: '', months_min: 3, months_max: 6, interest_percent: 12 }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof CreditOption, value: number | string) => {
    const updated = [...options];
    updated[index][field] = value as never;
    setOptions(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Kredit şərtləri</h2>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum məbləğ (AZN)
            </label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maksimum məbləğ (AZN)
            </label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İlkin ödəniş (%)
            </label>
            <input
              type="number"
              value={minDownpayment}
              onChange={(e) => setMinDownpayment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Kredit variantları</h3>
            <button
              onClick={addOption}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni şərt əlavə et
            </button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Variant adı</label>
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) => updateOption(index, 'name', e.target.value)}
                      placeholder="məs: Standart Kredit"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Minimum ay</label>
                      <input
                        type="number"
                        value={option.months_min}
                        onChange={(e) => updateOption(index, 'months_min', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Maksimum ay</label>
                      <input
                        type="number"
                        value={option.months_max}
                        onChange={(e) => updateOption(index, 'months_max', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Faiz %</label>
                      <input
                        type="number"
                        value={option.interest_percent}
                        onChange={(e) => updateOption(index, 'interest_percent', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeOption(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {options.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Hələ heç bir kredit variantı əlavə edilməyib
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-semibold disabled:bg-gray-300"
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
