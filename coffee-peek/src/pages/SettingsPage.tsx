import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import AddCoffeeShopModal from '../components/AddCoffeeShopModal';
import { getCities, getEquipments, getCoffeeBeans, getRoasters, getBrewMethods, City, Equipment, CoffeeBean, Roaster, BrewMethod } from '../api/coffeeshop';

const SettingsPage: React.FC = () => {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Reference data for AddCoffeeShopModal
  const [cities, setCities] = useState<City[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [coffeeBeans, setCoffeeBeans] = useState<CoffeeBean[]>([]);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [brewMethods, setBrewMethods] = useState<BrewMethod[]>([]);
  const [referenceDataLoaded, setReferenceDataLoaded] = useState(false);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [citiesRes, equipmentsRes, beansRes, roastersRes, methodsRes] = await Promise.all([
        getCities(),
        getEquipments(),
        getCoffeeBeans(),
        getRoasters(),
        getBrewMethods(),
      ]);
      
      const citiesResponse: any = citiesRes;
      const equipmentsResponse: any = equipmentsRes;
      const beansResponse: any = beansRes;
      const roastersResponse: any = roastersRes;
      const methodsResponse: any = methodsRes;
      
      const citiesData = citiesResponse.data?.cities || citiesResponse.data || [];
      const equipmentsData = equipmentsResponse.data?.equipments || equipmentsResponse.data || [];
      const beansData = beansResponse.data?.beans || beansResponse.data || [];
      const roastersData = roastersResponse.data?.roasters || roastersResponse.data || [];
      const methodsData = methodsResponse.data?.methods || methodsResponse.data || [];
      
      const citiesArray = Array.isArray(citiesData) ? citiesData : [];
      const equipmentsArray = Array.isArray(equipmentsData) ? equipmentsData : [];
      const beansArray = Array.isArray(beansData) ? beansData : [];
      const roastersArray = Array.isArray(roastersData) ? roastersData : [];
      const methodsArray = Array.isArray(methodsData) ? methodsData : [];
      
      setCities(citiesArray);
      setEquipments(equipmentsArray);
      setCoffeeBeans(beansArray);
      setRoasters(roastersArray);
      setBrewMethods(methodsArray);
      setReferenceDataLoaded(true);
    } catch (err) {
      console.error('Error loading reference data:', err);
      setReferenceDataLoaded(true);
    }
  };

  const themeClasses = theme === 'dark' 
    ? {
        bg: 'bg-[#1A1412]',
        cardBg: 'bg-[#2D241F]',
        border: 'border-[#3D2F28]',
        text: 'text-white',
        textSecondary: 'text-[#A39E93]',
      }
    : {
        bg: 'bg-white',
        cardBg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
      };

  return (
    <div className={`min-h-screen ${themeClasses.bg} p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className={`text-4xl font-bold ${themeClasses.text} mb-2`}>Настройки</h1>
          <p className={themeClasses.textSecondary}>Управление настройками приложения</p>
        </header>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Добавить кофейню */}
          <div className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-2xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-bold ${themeClasses.text} mb-2`}>Добавить кофейню</h3>
                <p className={`${themeClasses.textSecondary} text-sm`}>
                  Отправьте новую кофейню на модерацию. После проверки она появится в каталоге.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                className="w-auto flex items-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Добавить кофейню
              </Button>
            </div>
          </div>

          {/* Другие настройки */}
          <div className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-2xl p-6`}>
            <h3 className={`text-xl font-bold ${themeClasses.text} mb-4`}>Настройки аккаунта</h3>

            <div className="space-y-4">
              <SettingItem
                title="Изменить пароль"
                description="Обновите свой пароль для безопасности аккаунта"
                buttonText="Изменить"
              />

              <SettingItem
                title="Уведомления"
                description="Управляйте настройками уведомлений"
                buttonText="Настроить"
              />

              <SettingItem
                title="Конфиденциальность"
                description="Управляйте настройками приватности"
                buttonText="Настроить"
              />
            </div>
          </div>

          {/* Настройки приложения */}
          <div className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-2xl p-6`}>
            <h3 className={`text-xl font-bold ${themeClasses.text} mb-4`}>Настройки приложения</h3>

            <div className="space-y-4">
              <ThemeSettingItem
                title="Тема"
                description={theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
                currentTheme={theme}
                onToggle={toggleTheme}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно добавления кофейни */}
      <AddCoffeeShopModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          // Можно показать уведомление об успехе
        }}
        cities={cities}
        equipments={equipments}
        coffeeBeans={coffeeBeans}
        roasters={roasters}
        brewMethods={brewMethods}
        referenceDataLoaded={referenceDataLoaded}
      />
    </div>
  );
};

// Компонент элемента настройки
interface SettingItemProps {
  title: string;
  description: string;
  buttonText: string;
}

const SettingItem: React.FC<SettingItemProps> = ({ title, description, buttonText }) => {
  const { theme } = useTheme();
  const themeClasses = theme === 'dark' 
    ? {
        border: 'border-[#3D2F28]',
        text: 'text-white',
        textSecondary: 'text-[#A39E93]',
      }
    : {
        border: 'border-gray-200',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
      };

  return (
    <div className={`flex items-center justify-between py-3 border-b ${themeClasses.border} last:border-0`}>
      <div>
        <p className={`${themeClasses.text} font-medium`}>{title}</p>
        <p className={`${themeClasses.textSecondary} text-sm`}>{description}</p>
      </div>
      <Button variant="secondary" className="w-auto">{buttonText}</Button>
    </div>
  );
};

// Компонент настройки темы
interface ThemeSettingItemProps {
  title: string;
  description: string;
  currentTheme: 'dark' | 'light';
  onToggle: () => void;
}

const ThemeSettingItem: React.FC<ThemeSettingItemProps> = ({ title, description, currentTheme, onToggle }) => {
  const { theme } = useTheme();
  const themeClasses = theme === 'dark' 
    ? {
        border: 'border-[#3D2F28]',
        text: 'text-white',
        textSecondary: 'text-[#A39E93]',
        toggleBg: currentTheme === 'dark' ? 'bg-[#EAB308]' : 'bg-[#3D2F28]',
      }
    : {
        border: 'border-gray-200',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        toggleBg: currentTheme === 'dark' ? 'bg-[#EAB308]' : 'bg-gray-300',
      };

  return (
    <div className={`flex items-center justify-between py-3 border-b ${themeClasses.border} last:border-0`}>
      <div>
        <p className={`${themeClasses.text} font-medium`}>{title}</p>
        <p className={`${themeClasses.textSecondary} text-sm`}>{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`
          relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200
          ${themeClasses.toggleBg}
        `}
        aria-label="Переключить тему"
      >
        <span
          className={`
            inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 shadow-md
            ${currentTheme === 'dark' ? 'translate-x-9' : 'translate-x-1'}
          `}
        />
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs">
          {currentTheme === 'dark' ? '🌙' : '☀️'}
        </span>
      </button>
    </div>
  );
};

export default SettingsPage;

