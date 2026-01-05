import React, { useState, useEffect } from 'react';
import { getCoffeeShops, getCities, getEquipments, getCoffeeBeans, getRoasters, getBrewMethods, getCoffeeShopById, CoffeeShop, DetailedCoffeeShop, City, Equipment, CoffeeBean, Roaster, BrewMethod, CoffeeShopFilters } from '../api/coffeeshop';
import Button from './Button';
import CoffeeShopModal from './CoffeeShopModal';
import PhotoCarousel from './PhotoCarousel';
import MaterialSelect from './MaterialSelect';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';

const CoffeeShopList: React.FC = () => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [shops, setShops] = useState<CoffeeShop[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [cities, setCities] = useState<City[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [coffeeBeans, setCoffeeBeans] = useState<CoffeeBean[]>([]);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [brewMethods, setBrewMethods] = useState<BrewMethod[]>([]);

  const [filters, setFilters] = useState<CoffeeShopFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(''); // Скрыто от пользователя, но используется для API
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedBeans, setSelectedBeans] = useState<string>('');
  const [selectedRoasters, setSelectedRoasters] = useState<string>('');
  const [selectedBrewMethods, setSelectedBrewMethods] = useState<string>('');
  
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [selectedShop, setSelectedShop] = useState<DetailedCoffeeShop | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingShopDetails, setLoadingShopDetails] = useState(false);
  
  useEffect(() => {
    loadInitialData().then(() => {
      setInitialDataLoaded(true);
    });
  }, []);
  
  // Set default city when cities are loaded and no city is selected yet
  // Автоматически выбираем первый город при загрузке (скрыто от пользователя)
  useEffect(() => {
    if (cities.length > 0 && !selectedCity && initialDataLoaded) {
      setSelectedCity(cities[0].id);
    }
  }, [cities, selectedCity, initialDataLoaded]);
  
  // Load shops once when initial data is loaded and default city is set
  useEffect(() => {
    if (initialDataLoaded && selectedCity && Object.keys(filters).length === 0) {
      // This will trigger the filter change effect which loads shops
      setFilters({
        cityId: selectedCity,
      });
    }
  }, [initialDataLoaded, selectedCity]);
  

  


  useEffect(() => {
    // Update filters with selected items
    const updatedFilters: CoffeeShopFilters = {
      cityId: selectedCity || undefined, // Обязательный параметр, но скрыт от пользователя
      equipmentIds: selectedEquipment ? [selectedEquipment] : undefined,
      coffeeBeanIds: selectedBeans ? [selectedBeans] : undefined,
      roasterIds: selectedRoasters ? [selectedRoasters] : undefined,
      brewMethodIds: selectedBrewMethods ? [selectedBrewMethods] : undefined,
      priceRange: filters.priceRange, // Keep existing price range filter
    };
      
    // Only update if filters actually changed
    if (JSON.stringify(filters) !== JSON.stringify(updatedFilters)) {
      setFilters(updatedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedEquipment, selectedBeans, selectedRoasters, selectedBrewMethods]);

  // Only trigger shop loading from filter changes after initial load is complete
  useEffect(() => {
    // Only run this effect after initial data is loaded to prevent duplicate calls
    if (initialDataLoaded && filters.cityId) {
      // Reset to first page and load shops when filters change
      setCurrentPage(1);
      loadShops();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.cityId,
    filters.priceRange,
    filters.equipmentIds?.length ?? 0,
    filters.coffeeBeanIds?.length ?? 0,
    filters.roasterIds?.length ?? 0,
    filters.brewMethodIds?.length ?? 0,
    initialDataLoaded, // This ensures the effect only runs after initial data is loaded
  ]);

  useEffect(() => {
    // Load shops when page changes
    if (filters.cityId && initialDataLoaded) { // Only load if city is selected and initial data loaded
      loadShops();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, initialDataLoaded]);

  const loadInitialData = async () => {
    try {
      const [citiesRes, equipmentsRes, beansRes, roastersRes, methodsRes] = await Promise.all([
        getCities(),
        getEquipments(),
        getCoffeeBeans(),
        getRoasters(),
        getBrewMethods(),
      ]);

      // Handle different possible response structures (cast to any to access nested properties)
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

      setCities(Array.isArray(citiesData) ? citiesData : []);
      setEquipments(Array.isArray(equipmentsData) ? equipmentsData : []);
      setCoffeeBeans(Array.isArray(beansData) ? beansData : []);
      setRoasters(Array.isArray(roastersData) ? roastersData : []);
      setBrewMethods(Array.isArray(methodsData) ? methodsData : []);
    } catch (err) {
      console.error('Error loading initial data:', err);
      // Set empty arrays to prevent errors
      setCities([]);
      setEquipments([]);
      setCoffeeBeans([]);
      setRoasters([]);
      setBrewMethods([]);
    }
  };

  const loadShops = async () => {
    try {
      setIsLoading(true);
      const response = await getCoffeeShops(filters, currentPage, pageSize);
      console.log('CoffeeShopList: Получен ответ от API:', response);
        
      // Handle different response formats
      if (response.data && typeof response.data === 'object') {
        const responseData: any = response.data;
        console.log('CoffeeShopList: Структура response.data:', responseData);
        console.log('CoffeeShopList: Ключи в response.data:', Object.keys(responseData));
        
        // Check if it's the new format with coffeeShops
        if ('coffeeShops' in responseData && Array.isArray(responseData.coffeeShops)) {
          console.log('CoffeeShopList: Найден формат coffeeShops, количество:', responseData.coffeeShops.length);
          // Преобразуем ShortShopDto[] в CoffeeShop[]
          const shops = responseData.coffeeShops.map((shop: any) => {
            // Обрабатываем photos
            const shopPhotos = shop.photos?.map((p: any) => {
              // Если это объект с fullUrl, извлекаем URL
              if (p && typeof p === 'object' && 'fullUrl' in p) {
                return p.fullUrl;
              }
              // Если это уже строка, возвращаем как есть
              if (typeof p === 'string') {
                return p;
              }
              return '';
            }).filter((url: string) => url && url.length > 0) || [];
            
            console.log(`CoffeeShopList: Обработка кофейни ${shop.name}:`, {
              originalPhotos: shop.photos,
              processedShopPhotos: shopPhotos,
              photosCount: shop.photos?.length || 0,
              shopPhotosCount: shopPhotos.length
            });
            
            return {
              id: shop.id,
              name: shop.name,
              description: shop.description,
              priceRange: shop.priceRange,
              cityId: shop.cityId,
              cityName: shop.cityName,
              address: shop.location?.address,
              location: shop.location ? {
                latitude: shop.location.latitude,
                longitude: shop.location.longitude,
              } : undefined,
              rating: shop.rating,
              reviewCount: shop.reviewCount,
              isOpen: shop.isOpen,
              // Преобразуем photos в массив URL для обратной совместимости
              shopPhotos: shopPhotos,
              photos: shop.photos, // Сохраняем оригинальный массив photos
              // Сохраняем equipments если есть
              equipments: shop.equipments,
              equipmentIds: shop.equipmentIds,
              coffeeBeanIds: shop.coffeeBeanIds,
              roasterIds: shop.roasterIds,
              brewMethodIds: shop.brewMethodIds,
            };
          });
          console.log('CoffeeShopList: Преобразованные shops:', shops);
          setShops(shops);
          setTotalItems(responseData.totalItems || shops.length);
          setTotalPages(responseData.totalPages || 1);
          setCurrentPage(responseData.currentPage || 1);
          setPageSize(responseData.pageSize || 10);
        } else if ('items' in responseData) {
          console.log('CoffeeShopList: Найден формат items, количество:', responseData.items?.length || 0);
          // Check if it's the pagination format
          setShops(responseData.items || []);
          setTotalItems(responseData.totalItems || 0);
          setTotalPages(responseData.totalPages || 1);
          setCurrentPage(responseData.currentPage || 1);
          setPageSize(responseData.pageSize || 10);
        } else if ('content' in responseData) {
          // Handle the content array format
          setShops(responseData.content || []);
          // Try to get pagination info from response data or calculate from content
          setTotalItems(responseData.totalItems || responseData.content?.length || 0);
          setTotalPages(responseData.totalPages || 1);
          setCurrentPage(responseData.currentPage || 1);
          setPageSize(responseData.pageSize || 10);
        } else {
          // Fallback for direct array
          if (Array.isArray(responseData)) {
            setShops(responseData);
            setTotalItems(responseData.length);
            setTotalPages(1);
          } else {
            setShops([]);
            setTotalItems(0);
            setTotalPages(1);
          }
        }
      } else {
        // Fallback for old response format
        if (Array.isArray(response.data)) {
          setShops(response.data);
          setTotalItems(response.data.length);
          setTotalPages(1);
        } else {
          setShops([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке кофеен');
      console.error('CoffeeShopList: Ошибка при загрузке кофеен:', err);
      console.error('CoffeeShopList: Stack trace:', err.stack);
      setShops([]); // Set empty array on error
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CoffeeShopFilters, value: string | string[] | undefined) => {
    setFilters(prev => {
      // Проверяем, изменилось ли значение, чтобы избежать лишних обновлений
      if (prev[key] === value || (Array.isArray(prev[key]) && Array.isArray(value) &&
        prev[key].length === value.length &&
        prev[key].every((v, i) => v === value[i]))) {
        return prev;
      }
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const clearFilters = () => {
    setFilters({});
  };
  
  const openShopDetails = async (shopId: string) => {
    try {
      setLoadingShopDetails(true);
      const response = await getCoffeeShopById(shopId);
      if (response.success && response.data) {
        setSelectedShop(response.data);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading shop details:', error);
    } finally {
      setLoadingShopDetails(false);
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedShop(null);
  };

  if (isLoading && shops.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg.primary}`}>
        <div className="text-[#EAB308] text-xl">Загрузка...</div>
      </div>
    );
  }

  // Добавляем логирование для отладки
  console.log('CoffeeShopList: Рендер компонента', {
    isLoading,
    shopsCount: shops.length,
    totalItems,
    error,
    shops: shops.slice(0, 2), // Первые 2 элемента для отладки
    isArray: Array.isArray(shops),
    shopsType: typeof shops
  });

  // Проверяем, что shops - это массив
  if (!Array.isArray(shops)) {
    console.error('CoffeeShopList: shops не является массивом!', shops);
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg.primary}`}>
        <div className={`${themeClasses.text.primary} text-xl`}>
          Ошибка: данные не являются массивом
        </div>
      </div>
    );
  }

  return (
    <>
    <div className={`min-h-screen ${themeClasses.bg.primary} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-4xl font-bold ${themeClasses.text.primary} mb-2`}>Кофейни</h1>
            <p className={themeClasses.text.secondary}>Найдите лучшие кофейни поблизости</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 ${themeClasses.bg.card} ${theme === 'dark' ? 'hover:bg-[#3D2F28]' : 'hover:bg-gray-100'} ${themeClasses.text.primary} rounded-2xl font-medium transition-all duration-200 active:scale-[0.98] flex items-center gap-2 ${themeClasses.shadow} border ${themeClasses.border.default} hover:border-[#EAB308]/30`}
          >
            {showFilters ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Скрыть фильтры
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                Показать фильтры
              </>
            )}
          </button>
        </div>

        {error && (
          <div className={`mb-6 p-4 ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border rounded-2xl`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          </div>
        )}

        {/* Фильтры */}
        {showFilters && (
          <div className={`mb-6 ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-3xl p-8 ${themeClasses.shadow} animate-in fade-in slide-in-from-top-4 duration-300`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Фильтр по городу убран для пользователя */}
              <MaterialSelect
                label="Ценовой диапазон"
                  value={filters.priceRange || ''}
                onChange={(value) => handleFilterChange('priceRange', value || undefined)}
                options={[
                  { value: '', label: 'Любой' },
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

              <MaterialSelect
                label="Оборудование"
                  value={selectedEquipment}
                onChange={(value) => setSelectedEquipment(value)}
                options={[
                  { value: '', label: 'Любое оборудование' },
                  ...equipments.map(equipment => ({ value: equipment.id, label: equipment.name }))
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
                  value={selectedBeans}
                onChange={(value) => setSelectedBeans(value)}
                options={[
                  { value: '', label: 'Любые зёрна' },
                  ...coffeeBeans.map(bean => ({ value: bean.id, label: bean.name }))
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
                  value={selectedRoasters}
                onChange={(value) => setSelectedRoasters(value)}
                options={[
                  { value: '', label: 'Любые обжарщики' },
                  ...roasters.map(roaster => ({ value: roaster.id, label: roaster.name }))
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
                  value={selectedBrewMethods}
                onChange={(value) => setSelectedBrewMethods(value)}
                options={[
                  { value: '', label: 'Любые методы' },
                  ...brewMethods.map(method => ({ value: method.id, label: method.name }))
                ]}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                }
              />

              <div className="flex items-end md:col-span-2 lg:col-span-3">
                <button
                  onClick={() => {
                  clearFilters();
                  // Сохраняем выбранный город (скрыто от пользователя)
                  if (cities.length > 0 && !selectedCity) {
                    setSelectedCity(cities[0].id);
                  }
                  setSelectedEquipment('');
                  setSelectedBeans('');
                  setSelectedRoasters('');
                  setSelectedBrewMethods('');
                  }}
                  className={`w-full py-3 px-6 ${themeClasses.bg.tertiary} ${theme === 'dark' ? 'hover:bg-[#4A3D35]' : 'hover:bg-gray-200'} ${themeClasses.text.primary} rounded-2xl font-medium transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${themeClasses.shadow}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Сбросить фильтры
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Список кофеен */}
        {!Array.isArray(shops) || shops.length === 0 ? (
          <div className="bg-[#2D241F] border border-[#3D2F28] rounded-2xl p-8 text-center">
            <p className="text-[#A39E93]">
              {!Array.isArray(shops) ? 'Ошибка загрузки данных' : 'Кофейни не найдены'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => {
                // Get photos from photos array (new format) or shopPhotos/imageUrls (legacy)
                // Приоритет: shopPhotos (уже обработанные URL) > photos (объекты) > imageUrls (legacy)
                let photos: string[] = [];
                
                if (shop.shopPhotos && Array.isArray(shop.shopPhotos) && shop.shopPhotos.length > 0) {
                  // Используем уже обработанные shopPhotos (массив строк URL)
                  photos = shop.shopPhotos.filter((p: any) => p && typeof p === 'string' && p.trim().length > 0);
                } else if ((shop as any).photos && Array.isArray((shop as any).photos) && (shop as any).photos.length > 0) {
                  // Обрабатываем photos (массив объектов с fullUrl)
                  photos = (shop as any).photos.map((p: any) => {
                    // Если это объект с fullUrl, извлекаем URL
                    if (p && typeof p === 'object' && 'fullUrl' in p) {
                      return p.fullUrl;
                    }
                    // Если это уже строка, возвращаем как есть
                    if (typeof p === 'string') {
                      return p;
                    }
                    // Иначе пытаемся преобразовать в строку
                    return p ? String(p) : '';
                  }).filter((url: string) => url && url.length > 0);
                } else if ((shop as any).imageUrls && Array.isArray((shop as any).imageUrls) && (shop as any).imageUrls.length > 0) {
                  // Legacy формат
                  photos = (shop as any).imageUrls.filter((p: any) => p && typeof p === 'string' && p.trim().length > 0);
                }
                
                console.log(`CoffeeShopList: Фото для кофейни ${shop.name}:`, {
                  shopPhotos: shop.shopPhotos,
                  photos: (shop as any).photos,
                  imageUrls: (shop as any).imageUrls,
                  result: photos
                });
                
                return (
                <div
                  key={shop.id}
                  className="bg-[#2D241F] border border-[#3D2F28] rounded-2xl p-6 hover:border-[#EAB308]/50 transition-all cursor-pointer"
                  onClick={() => openShopDetails(shop.id)}
                >
                  {photos.length > 0 ? (
                    <div className="mb-4 rounded-xl overflow-hidden h-48">
                      <PhotoCarousel
                        images={photos}
                        shopName={shop.name}
                        isCardView={true}
                        />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-xl overflow-hidden h-48 bg-[#1A1412] flex items-center justify-center">
                      <div className="text-center text-[#A39E93]">
                        <div className="text-4xl mb-2">☕</div>
                        <div className="text-sm">Нет фото</div>
                      </div>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-white mb-2">{shop.name}</h3>

                  {shop.address && (
                    <p className="text-[#A39E93] text-sm mb-2">{shop.address}</p>
                  )}

                  {shop.cityName && (
                    <p className="text-[#A39E93] text-sm mb-2">📍 {shop.cityName}</p>
                  )}

                  {shop.description && (
                    <p className="text-[#A39E93] text-sm mb-4 line-clamp-2">{shop.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-2">
                    {shop.equipmentIds && shop.equipmentIds.length > 0 && (
                      <span className="px-2 py-1 bg-[#3D2F28] text-[#EAB308] rounded-full text-xs">
                        Оборудование: {shop.equipmentIds.length}
                      </span>
                    )}
                    {shop.coffeeBeanIds && shop.coffeeBeanIds.length > 0 && (
                      <span className="px-2 py-1 bg-[#3D2F28] text-[#EAB308] rounded-full text-xs">
                        Зёрна: {shop.coffeeBeanIds.length}
                      </span>
                    )}
                    {shop.roasterIds && shop.roasterIds.length > 0 && (
                      <span className="px-2 py-1 bg-[#3D2F28] text-[#EAB308] rounded-full text-xs">
                        Обжарщики: {shop.roasterIds.length}
                      </span>
                    )}
                    {typeof shop.isOpen !== 'undefined' && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        shop.isOpen 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {shop.isOpen ? 'Открыто' : 'Закрыто'}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-[#EAB308]">⭐</span>
                      <span className="text-white">{(shop.rating || 0).toFixed(1)}</span>
                      <span className="text-[#A39E93] text-sm">({shop.reviewCount || 0})</span>
                    </div>
                    
                    {shop.priceRange && (
                      <span className="text-[#A39E93] text-sm">
                        {shop.priceRange === 'Budget' ? '💰' : shop.priceRange === 'Moderate' ? '💰💰' : '💰💰💰'}
                      </span>
                    )}
                  </div>
                </div>
              );
              })}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl ${currentPage === 1
                      ? `${themeClasses.bg.tertiary} ${themeClasses.text.tertiary} cursor-not-allowed`
                      : `${themeClasses.bg.tertiary} ${themeClasses.text.primary} hover:bg-[#EAB308]/20 hover:text-[#EAB308]`
                      }`}
                  >
                    Назад
                  </button>

                  <span className={`${themeClasses.text.secondary} mx-2`}>
                    Страница {currentPage} из {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl ${currentPage === totalPages
                      ? `${themeClasses.bg.tertiary} ${themeClasses.text.tertiary} cursor-not-allowed`
                      : `${themeClasses.bg.tertiary} ${themeClasses.text.primary} hover:bg-[#EAB308]/20 hover:text-[#EAB308]`
                      }`}
                  >
                    Вперед
                  </button>
                </div>

                <p className={`${themeClasses.text.secondary} text-sm mt-2`}>
                  Показано {shops.length} из {totalItems} кофеен
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    <CoffeeShopModal
      shop={selectedShop}
      isOpen={isModalOpen}
      onClose={closeModal}
    />
    </>
  );
};

export default CoffeeShopList;

