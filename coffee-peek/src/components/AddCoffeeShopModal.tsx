import React, { useState } from 'react';
import { sendCoffeeShopToModeration, getUploadUrls, SendCoffeeShopToModerationRequest } from '../api/moderation';
import { City, Equipment, CoffeeBean, Roaster, BrewMethod } from '../api/coffeeshop';
import Button from './Button';
import MaterialSelect from './MaterialSelect';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getErrorMessage } from '../utils/errorHandler';

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
  const themeClasses = getThemeClasses(theme);
  const [formData, setFormData] = useState<Omit<SendCoffeeShopToModerationRequest, 'priceRange'> & { priceRange?: string }>({
    name: '',
    notValidatedAddress: '',
    description: '',
    priceRange: undefined,
    cityId: '',
    shopContact: {
      phone: '',
      email: '',
      website: '',
      instagram: '',
    },
    schedules: [],
    equipmentIds: [],
    coffeeBeanIds: [],
    roasterIds: [],
    brewMethodIds: [],
    shopPhotos: [],
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof SendCoffeeShopToModerationRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<Array<{ fileName: string; contentType: string; storageKey: string; size: number }>> => {
    if (selectedFiles.length === 0) return [];

    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Не авторизован');
    }

    // Получаем presigned URLs
    const uploadRequests = selectedFiles.map(file => ({
      fileName: file.name,
      contentType: file.type,
    }));

    const uploadUrlsResponse = await getUploadUrls(token, uploadRequests);
    if (!uploadUrlsResponse.success || !uploadUrlsResponse.data) {
      throw new Error('Ошибка при получении URL для загрузки');
    }

    // Загружаем файлы на presigned URLs
    const uploadPromises = selectedFiles.map(async (file, index) => {
      const { uploadUrl, storageKey } = uploadUrlsResponse.data[index];
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Ошибка загрузки файла ${file.name}`);
      }

      return {
        fileName: file.name,
        contentType: file.type,
        storageKey: storageKey,
        size: file.size,
      };
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.notValidatedAddress) {
      setError('Заполните обязательные поля: название и адрес');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadingPhotos(true);

      // Загружаем фотографии
      const uploadedPhotos = await uploadPhotos();
      
      setUploadingPhotos(false);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Не авторизован');
      }

      // Преобразуем PriceRange из строки в число (enum)
      const priceRangeMap: Record<string, number> = {
        'Budget': 0,
        'Moderate': 1,
        'Premium': 2,
      };
      
      // Отправляем данные кофейни
      const shopData: SendCoffeeShopToModerationRequest = {
        ...formData,
        priceRange: formData.priceRange ? priceRangeMap[formData.priceRange] : undefined,
        shopPhotos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        equipmentIds: formData.equipmentIds && formData.equipmentIds.length > 0 ? formData.equipmentIds : undefined,
        coffeeBeanIds: formData.coffeeBeanIds && formData.coffeeBeanIds.length > 0 ? formData.coffeeBeanIds : undefined,
        roasterIds: formData.roasterIds && formData.roasterIds.length > 0 ? formData.roasterIds : undefined,
        brewMethodIds: formData.brewMethodIds && formData.brewMethodIds.length > 0 ? formData.brewMethodIds : undefined,
        shopContact: formData.shopContact && (
          formData.shopContact.phone || 
          formData.shopContact.email || 
          formData.shopContact.website || 
          formData.shopContact.instagram
        ) ? formData.shopContact : undefined,
      };

      const response = await sendCoffeeShopToModeration(token, shopData);
      
      if (response.success) {
        onSuccess();
        onClose();
        // Сброс формы
        setFormData({
          name: '',
          notValidatedAddress: '',
          description: '',
          priceRange: undefined,
          cityId: '',
          shopContact: {
            phone: '',
            email: '',
            website: '',
            instagram: '',
          },
          schedules: [],
          equipmentIds: [],
          coffeeBeanIds: [],
          roasterIds: [],
          brewMethodIds: [],
          shopPhotos: [],
        });
        setSelectedFiles([]);
      } else {
        setError(response.message || 'Ошибка при отправке кофейни на модерацию');
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
      console.error('Error submitting coffee shop:', err);
    } finally {
      setIsSubmitting(false);
      setUploadingPhotos(false);
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
              ✕
            </button>
          </div>

          {error && (
            <div className={`mb-6 p-4 ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border rounded-2xl`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
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
                  className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                  placeholder="Введите название кофейни"
                />
              </div>

              <div>
                <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Адрес *</label>
                <input
                  type="text"
                  required
                  value={formData.notValidatedAddress}
                  onChange={(e) => handleInputChange('notValidatedAddress', e.target.value)}
                  className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                  placeholder="Введите адрес"
                />
              </div>

              <div>
                <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full ${themeClasses.bg.input} border-2 ${themeClasses.border.default} rounded-2xl py-3 px-4 ${themeClasses.text.primary} focus:outline-none focus:border-[#EAB308] transition-all`}
                  rows={4}
                  placeholder="Описание кофейни"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MaterialSelect
                  label="Город"
                  value={formData.cityId || ''}
                  onChange={(value) => handleInputChange('cityId', value || undefined)}
                  options={[
                    { value: '', label: 'Выберите город' },
                    ...cities.map(city => ({ value: city.id, label: city.name }))
                  ]}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  }
                />

                <MaterialSelect
                  label="Ценовой диапазон"
                  value={formData.priceRange || ''}
                  onChange={(value) => handleInputChange('priceRange', value || undefined)}
                  options={[
                    { value: '', label: 'Выберите диапазон' },
                    { value: 'Budget', label: '💰 Бюджетный' },
                    { value: 'Moderate', label: '💰💰 Средний' },
                    { value: 'Premium', label: '💰💰💰 Премиум' }
                  ]}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  }
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
                  <svg className={`mx-auto h-12 w-12 ${themeClasses.text.secondary} mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
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
                      .map(eq => ({ value: eq.id, label: eq.name }))
                  ]}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  }
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
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  }
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
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                    </svg>
                  }
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
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                  }
                />
              </div>

              {/* Показать выбранные элементы */}
              <div className="flex flex-wrap gap-2">
                {formData.equipmentIds?.map(id => {
                  const eq = equipments.find(e => e.id === id);
                  return eq ? (
                    <span key={id} className={`px-3 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-xl text-sm flex items-center gap-2`}>
                      {eq.name}
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

