import { useState } from 'react';
import { DollarSign, Package, Percent, LogOut, FolderOpen } from 'lucide-react';
import { GoldPriceSection } from '../components/admin/GoldPriceSection';
import { ProductsSection } from '../components/admin/ProductsSection';
import { CreditSettingsSection } from '../components/admin/CreditSettingsSection';
import { CategoriesSection } from '../components/admin/CategoriesSection';
import { Toaster } from 'react-hot-toast';

interface AdminDashboardProps {
  onLogout: () => void;
}

type Section = 'gold' | 'products' | 'credit' | 'categories';

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<Section>('gold');

  const menuItems = [
    { id: 'gold' as Section, label: 'Qızıl qiyməti', icon: DollarSign },
    { id: 'products' as Section, label: 'Məhsullar', icon: Package },
    { id: 'categories' as Section, label: 'Kateqoriyalar', icon: FolderOpen },
    { id: 'credit' as Section, label: 'Kredit şərtləri', icon: Percent },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col h-[100vh] sticky top-0">
        <Toaster position="top-center" />
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">GOLDEX Admin</h1>
          <p className="text-sm text-gray-400 mt-1">İdarəetmə Paneli</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-amber-500 text-gray-900 font-semibold'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Çıxış
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeSection === 'gold' && <GoldPriceSection />}
          {activeSection === 'products' && <ProductsSection />}
          {activeSection === 'categories' && <CategoriesSection />}
          {activeSection === 'credit' && <CreditSettingsSection />}
        </div>
      </div>
    </div>
  );
}


