import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendCoffeeShopToModeration } from '../api/moderation';
import { getCities, getEquipments, getCoffeeBeans, getRoasters, getBrewMethods, City, Equipment, CoffeeBean, Roaster, BrewMethod, formatEquipmentName, getEquipmentCategoryLabel } from '../api/coffeeshop';
import Button from '../components/Button';
import MaterialSelect from '../components/MaterialSelect';
import { PriceRangeSlider } from '../components/PriceRangeSlider';
import { RemovableChip } from '../components/RemovableChip';
import { AddressMapField } from '../components/AddressMapField';
import { ShopDetailSkeleton } from '../components/skeletons';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { getThemeClasses } from '../utils/theme';
import { getDefaultSchedules } from '../utils/shopUtils';
import { usePhotoUpload, useMenuPhotoUpload } from '../hooks/usePhotoUpload';
import { logger } from '../utils/logger';
import { usePageTitle } from '../hooks/usePageTitle';
import { AppIcon } from '../components/icons';
import { COLORS } from '../constants/colors';
import {
  MapPin, Images, Factory, Leaf, Flame, Drop, Lightbulb,
} from '@/components/Icon';
import {
  buildShopSubmissionPayload,
  INITIAL_SHOP_FORM_DATA,
  ShopFormData,
  validateShopFormClient,
} from '../utils/shopModerationForm';
import {
  getShopFieldErrorClass,
  parseShopModerationError,
  ShopFormField,
} from '../utils/shopModerationFormErrors';

RF Dewiface CreateCoffeeShopPageProps {
  onBack ?: () => void;
}

const CreateCoffeeShopPage: React.FC<CreateCoffeeShopPageProps> = ({ onBack }) => {
  usePageTitle('Добавить кофейню');
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate('/shops'));
  const { theme } = useTheme();
  const { showToast } = useToast();
  const themeClasses = getThemeClasses(theme);

  // Состояние для справочных данных
  const [cities, setCities] = useState<City[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [coffeeBeans, setCoffeeBeans] = useState<CoffeeBean[]>([]);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [brewMethods, setBrewMethods] = useState<BrewMethod[]>([]);
  const [referenceDataLoaded, setReferenceDataLoaded] = useState(false);
  const [isLoadingReferenceData, setIsLoadingReferenceData] = useState(true);

  const [formData, setFormData] = useState<ShopFormData>(INITIAL_SHOP_FORM_DATA);

  const { selectedFiles, uploadingPhotos, error: uploadError, handleFileSelect, removeFile, uploadPhotos, clearFiles } = usePhotoUpload();
  const {
    selectedFiles: menuFiles,
    uploadingPhotos: uploadingMenu,
    error: menuUploadError,
    handleFileSelect: handleMenuFileSelect,
    removeFile: removeMenuFile,
    uploadPhotos: uploadMenuPhotos,
    clearFiles: clearMenuFiles,
  } = useMenuPhotoUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ShopFormField, string>>>({});

  // Загрузка справочных данных
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setIsLoadingReferenceData(true);
        const [citiesRes, equipmentsRes, beansRes, roastersRes, methodsRes] = await Promise.all([
          getCities(),
          getEquipments(),
          getCoffeeBeans(),
          getRoasters(),
          getBrewMethods(),
        ]);

        const unwrapList = <T,>(data: unknown, key: string): T[] => {
          if (Array.isArray(data)) return data as T[];
          if (data && typeof data === 'object' && key in data) {
            const nested = (data as Record<string, unknown>)[key];
            if (Array.isArray(nested)) return nested as T[];
          }
          return [];
        };

        const citiesData = unwrapList<City>(citiesRes.data, 'cities');
        const equipmentsData = unwrapList<Equipment>(equipmentsRes.data, 'equipments');
        const beansData = unwrapList<CoffeeBean>(beansRes.data, 'beans');
        const roastersData = unwrapList<Roaster>(roastersRes.data, 'roasters');
        const methodsData = unwrapList<BrewMethod>(methodsRes.data, 'methods');

        setCities(citiesData);
        setEquipments(equipmentsData);
        setCoffeeBeans(beansData);
        setRoasters(roastersData);
        setBrewMethods(methodsData);

        const minsk =
          citiesData.find((c) => /^мінск$|^минск$|^minsk$/i.test(c.name.trim())) ?? citiesData[0];
        if (minsk?.id) {
          setFormData((prev) => (prev.cityId ? prev : { ...prev, cityId: minsk.id }));
        }

        setReferenceDataLoaded(true);
      } catch (err) {
        logger.error('Error loading reference data:', err);
        setReferenceDataLoaded(true);
      } finally {
        setIsLoadingReferenceData(false);
      }
    };

    loadReferenceData();
  }, []);

  const handleInputChange = (field: keyof ShopFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (field in fieldErrors) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field as ShopFormField];
        return next;
      });
    }
  };

  const handleContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      shopContact: {
        ...prev.shopContact,
        [field]: value,
      },
    }));
  };

  const handleScheduleChange = (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map(schedule =>
        schedule.dayOfWeek === dayOfWeek
          ? { ...schedule, [field]: value }
          : schedule
      ),
    }));
  };

  const toggleScheduleDay = (dayOfWeek: number) => {
    setFormData(prev => {
      const existingSchedule = prev.schedules.find(s => s.dayOfWeek === dayOfWeek);
      if (existingSchedule) {
        return {
          ...prev,
          schedules: prev.schedules.filter(s => s.dayOfWeek !== dayOfWeek),
        };
      } else {
        const defaultTime = dayOfWeek >= 5 ? '10:00' : '08:00';
        return {
          ...prev,
          schedules: [
            ...prev.schedules,
            { dayOfWeek, openTime: defaultTime, closeTime: '22:00' },
          ].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
        };
      }
    });
  };

  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const clientErrors = validateShopFormClient(formData);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const [uploadedPhotos, uploadedMenuPhotos] = await Promise.all([
        uploadPhotos(),
        uploadMenuPhotos(),
      ]);
      const shopData = buildShopSubmissionPayload(formData);
      const response = await sendCoffeeShopToModeration(
        shopData,
        uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        uploadedMenuPhotos.length > 0 ? uploadedMenuPhotos : undefined
      );

      if (response.data?.isAddressValidated) {
        showToast('Заявка отправлена на модерацию', 'success');
      } else {
        showToast('Заявка принята, адрес проверит модератор', 'warning');
      }

      setFormData({ ...INITIAL_SHOP_FORM_DATA, schedules: getDefaultSchedules() });
      clearFiles();
      clearMenuFiles();
      handleBack();
    } catch (err: unknown) {
      const parsed = parseShopModerationError(err);
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.globalError);
      logger.error('Error submitting coffee shop:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bgClass = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-[#FCFBFA]';

  if (isLoadingReferenceData) {
    return <ShopDetailSkeleton />;
  }

  return (
    <div className={`min-h-screen ${bgClass} pt-4 sm:pt-6 pb-8 sm:pb-12 px-4 sm:px-6 overflow-x-hidden`}>
      <div className="max-w-4xl mx-auto min-w-0">
        {/* Заголовок */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={handleBack}
            className={`mb-3 sm:mb-6 flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
          >
            <AppIcon name="arrow_back" size={24} />
            <span>Назад</span>
          </button>
          <h1 className={`text-2xl sm:text-4xl font-bold ${themeClasses.text.primary} mb-2 break-words`}>Добавить кофейню</h1>
          <p className={`${themeClasses.text.secondary} text-sm sm:text-base`}>Заполните форму для отправки кофейни на модерацию</p>
        </div>

        {(error || uploadError || menuUploadError) && (
          <div className={`mb-6 p-4 ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border rounded-2xl`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error || uploadError || menuUploadError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8 min-w-0">
          {/* Основная информация */}
          <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4`}>
            <h3 className={`text-xl sm:text-2xl font-semibold ${themeClasses.text.primary} mb-4 sm:mb-6`}>Основная информация</h3>

            <div>
              <label className={`${themeClasses.text.secondary} text-sm mb-2 block font-medium`}>Название *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all ${getShopFieldErrorClass(!!fieldErrors.name)}`}
                placeholder="Введите название кофейни"
              />
              {fieldErrors.name && (
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{fieldErrors.name}</p>
              )}
            </div>

            <AddressMapField
              value={formData.notValidatedAddress}
              onChange={(address) => handleInputChange('notValidatedAddress', address)}
              error={fieldErrors.notValidatedAddress}
              inputClassName={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all ${getShopFieldErrorClass(!!fieldErrors.notValidatedAddress)}`}
            />

            <div>
              <label className={`${themeClasses.text.secondary} text-sm mb-2 block font-medium`}>Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all ${getShopFieldErrorClass(!!fieldErrors.description)}`}
                rows={4}
                placeholder="Описание кофейни"
              />
              {fieldErrors.description && (
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{fieldErrors.description}</p>
              )}
            </div>

            <div>
              <label className={`${themeClasses.text.secondary} text-sm mb-2 block font-medium`}>Город</label>
              <div
                className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.secondary} opacity-80 flex items-center gap-2 cursor-not-allowed`}
                aria-disabled
              >
                <MapPin size={20} className="text-[#EAB308] shrink-0" />
                <span className={themeClasses.text.primary}>
                  {cities.find((c) => c.id === formData.cityId)?.name || 'Минск'}
                </span>
              </div>
              {fieldErrors.cityId && (
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{fieldErrors.cityId}</p>
              )}
            </div>

            <div>
              <label className={`${themeClasses.text.secondary} text-sm mb-2 block font-medium`}>
                Ценовой диапазон
              </label>
              <PriceRangeSlider
                value={formData.priceRange}
                onChange={(priceRange) => handleInputChange('priceRange', priceRange)}
                gold={COLORS.primary}
                muted={theme === 'dark' ? '#A8A29E' : '#78716C'}
                track={theme === 'dark' ? '#3D2F28' : '#E7E5E4'}
                allowClear
              />
            </div>
          </div>

          {/* Контакты */}
          <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4`}>
            <h3 className={`text-xl sm:text-2xl font-semibold ${themeClasses.text.primary} mb-4 sm:mb-6`}>Контакты</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`${themeClasses.text.secondary} text-sm mb-2 block font-medium`}>Телефон</label>
                <input
                  type="tel"
                  value={formData.shopContact?.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                  placeholder="+375..."
                />
              </div>

              <div>
                <label className={`${themeClasses.text.secondary} text-sm mb-2 block font-medium`}>Email</label>
                <input
                  type="email"
                  value={formData.shopContact?.email || ''}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className={`${themeClasses.text.secondary} text-sm mb-2 block font-medium`}>Сайт</label>
                <input
                  type="url"
                  value={formData.shopContact?.website || ''}
                  onChange={(e) => handleContactChange('website', e.target.value)}
                  className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className={`${themeClasses.text.secondary} text-sm mb-2 block font-medium`}>Instagram</label>
                <input
                  type="text"
                  value={formData.shopContact?.instagram || ''}
                  onChange={(e) => handleContactChange('instagram', e.target.value)}
                  className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                  placeholder="@username"
                />
              </div>
            </div>
          </div>

          {/* Фотографии */}
          <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4`}>
            <h3 className={`text-xl sm:text-2xl font-semibold ${themeClasses.text.primary} mb-4 sm:mb-6`}>Фотографии</h3>

            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className={`block w-full ${themeClasses.bg.input} border-2 border-dashed ${themeClasses.border.default} rounded-2xl py-8 px-4 text-center cursor-poRF Dewi hover:border-[#EAB308] transition-all`}
              >
                <Images size={48} className={`mx-auto mb-2 ${themeClasses.text.secondary}`} />
                <span className={themeClasses.text.secondary}>Нажмите для выбора фотографий</span>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4`}>
            <h3 className={`text-xl sm:text-2xl font-semibold ${themeClasses.text.primary} mb-2`}>Фото меню</h3>
            <p className={`text-sm ${themeClasses.text.secondary}`}>До 4 фото меню напитков. Не галерея кофейни.</p>
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMenuFileSelect}
                className="hidden"
                id="menu-photo-upload"
              />
              <label
                htmlFor="menu-photo-upload"
                className={`block w-full ${themeClasses.bg.input} border-2 border-dashed ${themeClasses.border.default} rounded-2xl py-8 px-4 text-center cursor-poRF Dewi hover:border-[#EAB308] transition-all`}
              >
                <Images size={48} className={`mx-auto mb-2 ${themeClasses.text.secondary}`} />
                <span className={themeClasses.text.secondary}>Нажмите для выбора фото меню</span>
              </label>
            </div>
            {menuFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {menuFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Меню ${index + 1}`}
                      className="w-full h-24 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeMenuFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Оборудование и ингредиенты */}
          <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4`}>
            <h3 className={`text-xl sm:text-2xl font-semibold ${themeClasses.text.primary} mb-4 sm:mb-6`}>Оборудование и ингредиенты</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MaterialSelect
                label="Оборудование"
                value=""
                onChange={(value) => {
                  if (value && !formData.equipmentIds?.includes(value)) {
                    handleInputChange('equipmentIds', [...(formData.equipmentIds || []), value]);
                  }
                }}
                options={[
                  { value: '', label: 'Выберите оборудование' },
                  ...equipments
                    .filter(eq => !formData.equipmentIds?.includes(eq.id))
                    .map(eq => ({ value: eq.id, label: `${formatEquipmentName(eq)} — ${getEquipmentCategoryLabel(eq.category)}` }))
                ]}
                icon={<Factory size={20} />}
              />

              <MaterialSelect
                label="Кофейные зёрна"
                value=""
                onChange={(value) => {
                  if (value && !formData.coffeeBeanIds?.includes(value)) {
                    handleInputChange('coffeeBeanIds', [...(formData.coffeeBeanIds || []), value]);
                  }
                }}
                options={[
                  { value: '', label: 'Выберите зёрна' },
                  ...coffeeBeans
                    .filter(bean => !formData.coffeeBeanIds?.includes(bean.id))
                    .map(bean => ({ value: bean.id, label: bean.name }))
                ]}
                icon={<Leaf size={20} />}
              />

              <MaterialSelect
                label="Обжарщики"
                value=""
                onChange={(value) => {
                  if (value && !formData.roasterIds?.includes(value)) {
                    handleInputChange('roasterIds', [...(formData.roasterIds || []), value]);
                  }
                }}
                options={[
                  { value: '', label: 'Выберите обжарщика' },
                  ...roasters
                    .filter(roaster => !formData.roasterIds?.includes(roaster.id))
                    .map(roaster => ({ value: roaster.id, label: roaster.name }))
                ]}
                icon={<Flame size={20} />}
              />

              <MaterialSelect
                label="Методы заваривания"
                value=""
                onChange={(value) => {
                  if (value && !formData.brewMethodIds?.includes(value)) {
                    handleInputChange('brewMethodIds', [...(formData.brewMethodIds || []), value]);
                  }
                }}
                options={[
                  { value: '', label: 'Выберите метод' },
                  ...brewMethods
                    .filter(method => !formData.brewMethodIds?.includes(method.id))
                    .map(method => ({ value: method.id, label: method.name }))
                ]}
                icon={<Drop size={20} />}
              />
            </div>

            {/* Показать выбранные элементы */}
            <div className="flex flex-wrap gap-2 mt-4">
              {formData.equipmentIds?.map(id => {
                const eq = equipments.find(e => e.id === id);
                return eq ? (
                  <RemovableChip
                    key={id}
                    label={formatEquipmentName(eq)}
                    gold={COLORS.primary}
                    onRemove={() => handleInputChange('equipmentIds', formData.equipmentIds?.filter(i => i !== id))}
                  />
                ) : null;
              })}
              {formData.coffeeBeanIds?.map(id => {
                const bean = coffeeBeans.find(b => b.id === id);
                return bean ? (
                  <RemovableChip
                    key={id}
                    label={bean.name}
                    gold={COLORS.primary}
                    onRemove={() => handleInputChange('coffeeBeanIds', formData.coffeeBeanIds?.filter(i => i !== id))}
                  />
                ) : null;
              })}
              {formData.roasterIds?.map(id => {
                const roaster = roasters.find(r => r.id === id);
                return roaster ? (
                  <RemovableChip
                    key={id}
                    label={roaster.name}
                    gold={COLORS.primary}
                    onRemove={() => handleInputChange('roasterIds', formData.roasterIds?.filter(i => i !== id))}
                  />
                ) : null;
              })}
              {formData.brewMethodIds?.map(id => {
                const method = brewMethods.find(m => m.id === id);
                return method ? (
                  <RemovableChip
                    key={id}
                    label={method.name}
                    gold={COLORS.primary}
                    onRemove={() => handleInputChange('brewMethodIds', formData.brewMethodIds?.filter(i => i !== id))}
                  />
                ) : null;
              })}
            </div>
          </div>

          {/* Расписание работы */}
          <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4`}>
            <h3 className={`text-xl sm:text-2xl font-semibold ${themeClasses.text.primary} mb-4 sm:mb-6`}>Расписание работы</h3>

            <div className="space-y-3">
              {dayNames.map((dayName, index) => {
                const schedule = formData.schedules.find(s => s.dayOfWeek === index);
                const isEnabled = !!schedule;

                return (
                  <div
                    key={index}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl border-2 transition-all min-w-0 ${isEnabled
                        ? `${themeClasses.bg.input} ${themeClasses.border.default}`
                        : `${themeClasses.bg.tertiary} ${themeClasses.border.default} opacity-60`
                      }`}
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggleScheduleDay(index)}
                        className="w-5 h-5 rounded border-2 border-[#EAB308] text-[#EAB308] focus:ring-[#EAB308] focus:ring-offset-0 cursor-poRF Dewi"
                      />
                      <label className={`${themeClasses.text.primary} font-medium cursor-poRF Dewi`}>
                        {dayName}
                      </label>
                    </div>

                    {isEnabled && schedule && (
                      <div className="grid grid-cols-2 gap-2 w-full min-w-0 sm:flex sm:items-end sm:gap-3 sm:flex-1">
                        <div className="min-w-0 sm:flex-1">
                          <label className={`${themeClasses.text.secondary} text-xs mb-1 block`}>Открытие</label>
                          <input
                            type="time"
                            value={schedule.openTime}
                            onChange={(e) => handleScheduleChange(index, 'openTime', e.target.value)}
                            className={`w-full min-w-0 max-w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-xl py-2 px-2 sm:px-3 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                          />
                        </div>
                        <span className={`${themeClasses.text.secondary} hidden sm:block pb-2`}>—</span>
                        <div className="min-w-0 sm:flex-1">
                          <label className={`${themeClasses.text.secondary} text-xs mb-1 block`}>Закрытие</label>
                          <input
                            type="time"
                            value={schedule.closeTime}
                            onChange={(e) => handleScheduleChange(index, 'closeTime', e.target.value)}
                            className={`w-full min-w-0 max-w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-xl py-2 px-2 sm:px-3 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                          />
                        </div>
                      </div>
                    )}

                    {!isEnabled && (
                      <div className={`flex-1 ${themeClasses.text.secondary} text-sm italic`}>
                        Выходной
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className={`${themeClasses.text.secondary} text-xs mt-2 flex items-start gap-1.5`}>
              <Lightbulb size={14} className="shrink-0 mt-0.5" />
              <span>По умолчанию: Пн-Пт 8:00-22:00, Сб-Вс 10:00-22:00</span>
            </p>
          </div>

          {/* Кнопки */}
          <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t ${themeClasses.border.default}`}>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:flex-1 whitespace-nowrap"
              isLoading={isSubmitting || uploadingPhotos || uploadingMenu}
              disabled={isSubmitting || uploadingPhotos || uploadingMenu}
            >
              {uploadingPhotos || uploadingMenu ? 'Загрузка фотографий...' : isSubmitting ? 'Отправка...' : 'Отправить на модерацию'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              className="w-full sm:w-auto sm:min-w-32"
              disabled={isSubmitting || uploadingPhotos || uploadingMenu}
            >
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCoffeeShopPage;
