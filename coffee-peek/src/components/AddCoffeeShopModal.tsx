import React, { useState } from 'react';
import { sendCoffeeShopToModeration } from '../api/moderation';
import { City, Equipment, CoffeeBean, Roaster, BrewMethod, formatEquipmentName, getEquipmentCategoryLabel } from '../api/coffeeshop';
import Button from './Button';
import MaterialSelect from './MaterialSelect';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { getThemeClasses } from '../utils/theme';
import { getDefaultSchedules } from '../utils/shopUtils';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { logger } from '../utils/logger';
import { BynSign } from './icons';
import {
  MapPin, Images, Factory, Leaf, Flame, Drop, Lightbulb, X,
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

interface AddCoffeeShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cities: City[];
  equipments: Equipment[];
  coffeeBeans: CoffeeBean[];
  roasters: Roaster[];
  brewMethods: BrewMethod[];
  referenceDataLoaded: boolean;
}

const AddCoffeeShopModal: React.FC<AddCoffeeShopModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  cities,
  equipments,
  coffeeBeans,
  roasters,
  brewMethods,
  referenceDataLoaded,
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const themeClasses = getThemeClasses(theme);

  const [formData, setFormData] = useState<ShopFormData>(INITIAL_SHOP_FORM_DATA);

  const { selectedFiles, uploadingPhotos, error: uploadError, handleFileSelect, removeFile, uploadPhotos, clearFiles } = usePhotoUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ShopFormField, string>>>({});

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
        // Удаляем расписание для этого дня
        return {
          ...prev,
          schedules: prev.schedules.filter(s => s.dayOfWeek !== dayOfWeek),
        };
      } else {
        // Добавляем дефолтное расписание для этого дня
        const defaultTime = dayOfWeek >= 5 ? '10:00' : '08:00'; // Сб-Вс: 10:00, Пн-Пт: 08:00
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
  const dayNamesShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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

      const uploadedPhotos = await uploadPhotos();
      const shopData = buildShopSubmissionPayload(formData);
      const response = await sendCoffeeShopToModeration(shopData, uploadedPhotos.length > 0 ? uploadedPhotos : undefined);

      if (response.data?.isAddressValidated) {
        showToast('Заявка отправлена на модерацию', 'success');
      } else {
        showToast('Заявка принята, адрес проверит модератор', 'warning');
      }

      onSuccess();
      onClose();
      setFormData({ ...INITIAL_SHOP_FORM_DATA, schedules: getDefaultSchedules() });
      clearFiles();
    } catch (err: unknown) {
      const parsed = parseShopModerationError(err);
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.globalError);
      logger.error('Error submitting coffee shop:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className={`text-3xl font-bold ${themeClasses.text.primary}`}>Добавить кофейню</h2>
            <button
              onClick={onClose}
              className={`${themeClasses.text.secondary} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} text-2xl transition-colors`}
            >
              <X size={24} />
            </button>
          </div>

          {(error || uploadError) && (
            <div className={`mb-6 p-4 ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border rounded-2xl`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error || uploadError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Основная информация */}
            <div className="space-y-4">
              <h3 className={`text-xl font-semibold ${themeClasses.text.primary} mb-4`}>Основная информация</h3>
              
              <div>
                <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Название *</label>
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

              <div>
                <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Адрес *</label>
                <input
                  type="text"
                  required
                  value={formData.notValidatedAddress}
                  onChange={(e) => handleInputChange('notValidatedAddress', e.target.value)}
                  className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all ${getShopFieldErrorClass(!!fieldErrors.notValidatedAddress)}`}
                  placeholder="Введите адрес"
                />
                {fieldErrors.notValidatedAddress && (
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{fieldErrors.notValidatedAddress}</p>
                )}
              </div>

              <div>
                <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Описание</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <MaterialSelect
                    label="Город"
                    value={formData.cityId || ''}
                    onChange={(value) => handleInputChange('cityId', value || undefined)}
                    options={[
                      { value: '', label: 'Выберите город' },
                      ...cities.map(city => ({ value: city.id, label: city.name }))
                    ]}
                    icon={<MapPin size={20} />}
                  />
                  {fieldErrors.cityId && (
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{fieldErrors.cityId}</p>
                  )}
                </div>

                <MaterialSelect
                  label="Ценовой диапазон"
                  value={formData.priceRange || ''}
                  onChange={(value) => handleInputChange('priceRange', value || undefined)}
                  options={[
                    { value: '', label: 'Выберите диапазон' },
                    { value: 'Budget', label: 'Бюджетный' },
                    { value: 'Moderate', label: 'Средний' },
                    { value: 'Premium', label: 'Премиум' }
                  ]}
                  icon={<BynSign size={20} />}
                />
              </div>
            </div>

            {/* Контакты */}
            <div className="space-y-4">
              <h3 className={`text-xl font-semibold ${themeClasses.text.primary} mb-4`}>Контакты</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Телефон</label>
                  <input
                    type="tel"
                    value={formData.shopContact?.phone || ''}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                    placeholder="+375..."
                  />
                </div>

                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Email</label>
                  <input
                    type="email"
                    value={formData.shopContact?.email || ''}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Сайт</label>
                  <input
                    type="url"
                    value={formData.shopContact?.website || ''}
                    onChange={(e) => handleContactChange('website', e.target.value)}
                    className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Instagram</label>
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
            <div className="space-y-4">
              <h3 className={`text-xl font-semibold ${themeClasses.text.primary} mb-4`}>Фотографии</h3>
              
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
                  className={`block w-full ${themeClasses.bg.input} border-2 border-dashed ${themeClasses.border.default} rounded-2xl py-8 px-4 text-center cursor-pointer hover:border-[#EAB308] transition-all`}
                >
                  <Images size={48} className={`mx-auto mb-2 ${themeClasses.text.secondary}`} />
                  <span className={themeClasses.text.secondary}>Нажмите для выбора фотографий</span>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
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
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Оборудование и ингредиенты */}
            <div className="space-y-4">
              <h3 className={`text-xl font-semibold ${themeClasses.text.primary} mb-4`}>Оборудование и ингредиенты</h3>
              
              <div className="grid grid-cols-2 gap-4">
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
              <div className="flex flex-wrap gap-2">
                {formData.equipmentIds?.map(id => {
                  const eq = equipments.find(e => e.id === id);
                  return eq ? (
                    <span key={id} className={`px-3 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-xl text-sm flex items-center gap-2`}>
                      {formatEquipmentName(eq)}
                      <button
                        type="button"
                        onClick={() => handleInputChange('equipmentIds', formData.equipmentIds?.filter(i => i !== id))}
                        className={`text-[#EAB308] ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
                {formData.coffeeBeanIds?.map(id => {
                  const bean = coffeeBeans.find(b => b.id === id);
                  return bean ? (
                    <span key={id} className={`px-3 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-xl text-sm flex items-center gap-2`}>
                      {bean.name}
                      <button
                        type="button"
                        onClick={() => handleInputChange('coffeeBeanIds', formData.coffeeBeanIds?.filter(i => i !== id))}
                        className={`text-[#EAB308] ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
                {formData.roasterIds?.map(id => {
                  const roaster = roasters.find(r => r.id === id);
                  return roaster ? (
                    <span key={id} className={`px-3 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-xl text-sm flex items-center gap-2`}>
                      {roaster.name}
                      <button
                        type="button"
                        onClick={() => handleInputChange('roasterIds', formData.roasterIds?.filter(i => i !== id))}
                        className={`text-[#EAB308] ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
                {formData.brewMethodIds?.map(id => {
                  const method = brewMethods.find(m => m.id === id);
                  return method ? (
                    <span key={id} className={`px-3 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-xl text-sm flex items-center gap-2`}>
                      {method.name}
                      <button
                        type="button"
                        onClick={() => handleInputChange('brewMethodIds', formData.brewMethodIds?.filter(i => i !== id))}
                        className={`text-[#EAB308] ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Расписание работы */}
            <div className="space-y-4">
              <h3 className={`text-xl font-semibold ${themeClasses.text.primary} mb-4`}>Расписание работы</h3>
              
              <div className="space-y-3">
                {dayNames.map((dayName, index) => {
                  const schedule = formData.schedules.find(s => s.dayOfWeek === index);
                  const isEnabled = !!schedule;
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        isEnabled
                          ? `${themeClasses.bg.input} ${themeClasses.border.default}`
                          : `${themeClasses.bg.tertiary} ${themeClasses.border.default} opacity-60`
                      }`}
                    >
                      {/* Чекбокс для включения/выключения дня */}
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleScheduleDay(index)}
                          className="w-5 h-5 rounded border-2 border-[#EAB308] text-[#EAB308] focus:ring-[#EAB308] focus:ring-offset-0 cursor-pointer"
                        />
                        <label className={`${themeClasses.text.primary} font-medium cursor-pointer`}>
                          {dayName}
                        </label>
                      </div>

                      {/* Время работы */}
                      {isEnabled && schedule && (
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <label className={`${themeClasses.text.secondary} text-xs mb-1 block`}>Открытие</label>
                            <input
                              type="time"
                              value={schedule.openTime}
                              onChange={(e) => handleScheduleChange(index, 'openTime', e.target.value)}
                              className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-xl py-2 px-3 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                            />
                          </div>
                          <span className={`${themeClasses.text.secondary} mt-6`}>—</span>
                          <div className="flex-1">
                            <label className={`${themeClasses.text.secondary} text-xs mb-1 block`}>Закрытие</label>
                            <input
                              type="time"
                              value={schedule.closeTime}
                              onChange={(e) => handleScheduleChange(index, 'closeTime', e.target.value)}
                              className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-xl py-2 px-3 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
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

              <p className={`${themeClasses.text.secondary} text-xs mt-2 flex items-center gap-1.5`}>
                <Lightbulb size={14} />
                По умолчанию: Пн-Пт 8:00-22:00, Сб-Вс 10:00-22:00
              </p>
            </div>

            {/* Кнопки */}
            <div className={`flex gap-4 pt-4 border-t ${themeClasses.border.default}`}>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={isSubmitting || uploadingPhotos}
                disabled={isSubmitting || uploadingPhotos}
              >
                {uploadingPhotos ? 'Загрузка фотографий...' : isSubmitting ? 'Отправка...' : 'Отправить на модерацию'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting || uploadingPhotos}
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCoffeeShopModal;

