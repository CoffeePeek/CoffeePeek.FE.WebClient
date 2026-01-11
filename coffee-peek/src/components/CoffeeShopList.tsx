import React, { useState, useEffect } from 'react';
import { getCoffeeShops, getCities, getEquipments, getCoffeeBeans, getRoasters, getBrewMethods, CoffeeShop, City, Equipment, CoffeeBean, Roaster, BrewMethod, CoffeeShopFilters, getPhotoUrl, getAllFavorites } from '../api/coffeeshop';
import Button from './Button';
import PhotoCarousel from './PhotoCarousel';
import MaterialSelect from './MaterialSelect';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { getThemeClasses } from '../utils/theme';
import { getErrorMessage } from '../utils/errorHandler';
import { COLORS, getThemeColors } from '../constants/colors';

interface CoffeeShopListProps {
  onShopSelect: (shopId: string) => void;
}

const CoffeeShopList: React.FC<CoffeeShopListProps> = ({ onShopSelect }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const themeClasses = getThemeClasses(theme);
  const colors = getThemeColors(theme);
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
  const [selectedCity, setSelectedCity] = useState<string>(''); // Фильтр по городу
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedBeans, setSelectedBeans] = useState<string>('');
  const [selectedRoasters, setSelectedRoasters] = useState<string>('');
  const [selectedBrewMethods, setSelectedBrewMethods] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'open' | 'new' | 'favorite' | 'visited'>('open');
  const [favoriteShopIds, setFavoriteShopIds] = useState<Set<string>>(new Set());
  const [visitedShopIds, setVisitedShopIds] = useState<Set<string>>(new Set());
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  useEffect(() => {
    loadInitialData().then(() => {
      setInitialDataLoaded(true);
    });
    
    // Загружаем избранные кофейни, если пользователь авторизован
    if (user) {
      loadFavorites();
    }
  }, [user]);
  
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
      cityId: selectedCity || undefined, // Фильтр по городу
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
    activeFilterTab, // Добавили зависимость от активного фильтра
    searchQuery, // Добавили зависимость от поискового запроса
    favoriteShopIds.size, // Обновляем при изменении избранных
    visitedShopIds.size, // Обновляем при изменении посещённых
    initialDataLoaded, // This ensures the effect only runs after initial data is loaded
  ]);

  useEffect(() => {
    // Load shops when page changes
    if (filters.cityId && initialDataLoaded) { // Only load if city is selected and initial data loaded
      loadShops();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, initialDataLoaded]);

  const filterShopsByActiveTab = (shopsToFilter: CoffeeShop[]): CoffeeShop[] => {
    let filtered = shopsToFilter;
    
    // Применяем фильтр по вкладке
    switch (activeFilterTab) {
      case 'open':
        // Фильтр "Открыты" применяется на сервере через isOpen в filters
        break;
      
      case 'new':
        // Фильтр "Новые" - сортируем по дате создания (если есть поле)
        // Пока просто возвращаем все, так как у нас нет поля createdAt
        break;
      
      case 'favorite':
        // Фильтр "Избранные" - только кофейни из favoriteShopIds
        filtered = filtered.filter(shop => favoriteShopIds.has(shop.id));
        break;
      
      case 'visited':
        // Фильтр "Посещённые" - только кофейни из visitedShopIds
        filtered = filtered.filter(shop => visitedShopIds.has(shop.id));
        break;
    }
    
    // Применяем поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shop => 
        shop.name.toLowerCase().includes(query) ||
        shop.description?.toLowerCase().includes(query) ||
        shop.address?.toLowerCase().includes(query) ||
        shop.cityName?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      const response = await getAllFavorites(token);
      if (response.isSuccess && response.data && response.data.data) {
        const favoriteIds = new Set(response.data.data.map((shop: CoffeeShop) => shop.id));
        setFavoriteShopIds(favoriteIds);
      }
    } catch (err) {
      // Тихо игнорируем ошибки для избранных (не критично)
      if (import.meta.env.DEV) {
        console.info('Could not load favorites:', err);
      }
    }
  };

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
      
      // Применяем фильтр статуса открытости только для вкладки "Открыты"
      // Для остальных вкладок загружаем все и фильтруем на клиенте
      const extendedFilters = {
        ...filters,
        isOpen: activeFilterTab === 'open' ? true : undefined,
      };
      
      const response = await getCoffeeShops(extendedFilters, currentPage, pageSize);
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
              // Если это объект PhotoMetadataDto, используем getPhotoUrl
              if (p && typeof p === 'object' && ('fullUrl' in p || 'storageKey' in p)) {
                return getPhotoUrl(p);
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
          
          // Применяем клиентскую фильтрацию
          const filteredShops = filterShopsByActiveTab(shops);
          
          setShops(filteredShops);
          setTotalItems(responseData.totalItems || filteredShops.length);
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
      setError(getErrorMessage(err));
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
  
  const openShopDetails = (shopId: string) => {
    onShopSelect(shopId);
  };

  if (isLoading && shops.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-xl" style={{ color: COLORS.primary }}>Загрузка...</div>
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-xl" style={{ color: colors.textPrimary }}>
          Ошибка: данные не являются массивом
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen pt-6 pb-20" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Search Section */}
        <div className="mt-4 mb-8 flex flex-col items-center text-center">
          <div className="w-full relative">
            <div className="flex items-center w-full h-14 rounded-2xl shadow-xl p-2 transition-all border" 
                 style={{ 
                   backgroundColor: colors.surface, 
                   borderColor: colors.border,
                   boxShadow: `0 20px 25px -5px ${COLORS.primary}10, 0 10px 10px -5px ${COLORS.primary}05`
                 }}>
              <span className="material-symbols-outlined px-4" style={{ color: colors.textSecondary }}>search</span>
              <input
                className="flex-1 bg-transparent border-none focus:ring-0 text-base font-medium outline-none"
                style={{ color: colors.textPrimary }}
                placeholder="Поиск идеальной кофейни..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="h-10 px-5 rounded-xl text-white font-bold flex items-center gap-2 transition-colors text-sm"
                style={{ backgroundColor: COLORS.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.primary}
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                Фильтры
              </button>
            </div>
            
            {/* Filter Tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs">
              {/* City selector - Custom Dropdown */}
              {cities.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowCityDropdown(!showCityDropdown)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border font-semibold transition-all hover:scale-105 active:scale-95"
                    style={{ 
                      backgroundColor: colors.surface, 
                      borderColor: colors.border,
                      color: colors.textPrimary
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = COLORS.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ color: COLORS.primary }}>
                      location_city
                    </span>
                    <span>{cities.find(c => c.id === selectedCity)?.name || 'Выбрать город'}</span>
                    <span className="material-symbols-outlined text-[14px]" style={{ 
                      color: colors.textSecondary,
                      transform: showCityDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      expand_more
                    </span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showCityDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCityDropdown(false)}
                      />
                      
                      {/* Menu */}
                      <div 
                        className="absolute top-full left-0 mt-2 rounded-xl border shadow-xl z-20 overflow-hidden"
                        style={{ 
                          backgroundColor: colors.surface, 
                          borderColor: colors.border,
                          minWidth: '160px',
                          maxHeight: '280px',
                          overflowY: 'auto'
                        }}
                      >
                        {cities.map((city) => (
                          <button
                            key={city.id}
                            onClick={() => {
                              setSelectedCity(city.id);
                              setShowCityDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-semibold transition-colors flex items-center gap-2"
                            style={{ 
                              backgroundColor: selectedCity === city.id ? `${COLORS.primary}15` : 'transparent',
                              color: selectedCity === city.id ? COLORS.primary : colors.textPrimary
                            }}
                            onMouseEnter={(e) => {
                              if (selectedCity !== city.id) {
                                e.currentTarget.style.backgroundColor = `${colors.border}`;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedCity !== city.id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              } else {
                                e.currentTarget.style.backgroundColor = `${COLORS.primary}15`;
                              }
                            }}
                          >
                            {selectedCity === city.id && (
                              <span className="material-symbols-outlined text-[14px] fill-1" style={{ color: COLORS.primary }}>
                                check_circle
                              </span>
                            )}
                            <span style={{ marginLeft: selectedCity === city.id ? '0' : '20px' }}>
                              {city.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {[
                { id: 'open' as const, label: 'Открыты', icon: 'schedule' },
                { id: 'new' as const, label: 'Новые', icon: 'fiber_new' },
                { id: 'favorite' as const, label: 'Избранные', icon: 'favorite' },
                { id: 'visited' as const, label: 'Посещённые', icon: 'check_circle' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilterTab(filter.id)}
                  className="px-4 py-2 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 border flex items-center gap-1.5"
                  style={
                    activeFilterTab === filter.id
                      ? {
                          backgroundColor: COLORS.primary,
                          color: 'white',
                          borderColor: COLORS.primary,
                          boxShadow: `0 4px 6px -1px ${COLORS.primary}30`,
                        }
                      : {
                          backgroundColor: colors.surface,
                          color: colors.textSecondary,
                          borderColor: colors.border,
                        }
                  }
                  onMouseEnter={(e) => {
                    if (activeFilterTab !== filter.id) {
                      e.currentTarget.style.borderColor = COLORS.primary;
                      e.currentTarget.style.color = COLORS.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeFilterTab !== filter.id) {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.color = colors.textSecondary;
                    }
                  }}
                >
                  <span className={`material-symbols-outlined text-[16px] ${activeFilterTab === filter.id ? 'fill-1' : ''}`}>
                    {filter.icon}
                  </span>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border rounded-2xl" style={{ 
            backgroundColor: `${COLORS.error}10`, 
            borderColor: `${COLORS.error}30` 
          }}>
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        {/* Фильтры */}
        {showFilters && (
          <div className="mb-6 rounded-3xl p-8 shadow-sm border" style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  // Город не сбрасываем, так как он отображается в тегах
                  setSelectedEquipment('');
                  setSelectedBeans('');
                  setSelectedRoasters('');
                  setSelectedBrewMethods('');
                  }}
                  className="w-full py-3 px-6 rounded-2xl font-medium transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                  style={{ backgroundColor: colors.background, color: colors.textPrimary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.border}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.background}
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
          <div className="rounded-2xl p-8 text-center border" style={{ 
            backgroundColor: colors.surface, 
            borderColor: colors.border 
          }}>
            <p style={{ color: colors.textSecondary }}>
              {!Array.isArray(shops) ? 'Ошибка загрузки данных' : 'Кофейни не найдены'}
            </p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => {
                // Get photos from photos array (new format) or shopPhotos/imageUrls (legacy)
                // Приоритет: shopPhotos (уже обработанные URL) > photos (объекты) > imageUrls (legacy)
                let photos: string[] = [];
                
                if (shop.shopPhotos && Array.isArray(shop.shopPhotos) && shop.shopPhotos.length > 0) {
                  // Используем уже обработанные shopPhotos (массив строк URL)
                  photos = shop.shopPhotos.filter((p: any) => p && typeof p === 'string' && p.trim().length > 0);
                } else if ((shop as any).photos && Array.isArray((shop as any).photos) && (shop as any).photos.length > 0) {
                  // Обрабатываем photos (массив объектов PhotoMetadataDto)
                  photos = (shop as any).photos.map((p: any) => {
                    // Если это объект PhotoMetadataDto, используем getPhotoUrl
                    if (p && typeof p === 'object' && ('fullUrl' in p || 'storageKey' in p)) {
                      return getPhotoUrl(p);
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
                
                const isTrending = shop.rating && shop.rating >= 4.7;
                const isHiring = false; // TODO: Add hiring flag to API
                
                return (
                <div
                  key={shop.id}
                  className="p-4 rounded-[1.5rem] shadow-sm border flex flex-col group hover:shadow-xl transition-all duration-300 cursor-pointer"
                  style={{ 
                    backgroundColor: colors.surface, 
                    borderColor: colors.border 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = `${COLORS.primary}50`}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = colors.border}
                  onClick={() => openShopDetails(shop.id)}
                >
                  {/* Image Section */}
                  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-lg mb-4">
                    {photos.length > 0 ? (
                      <>
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url("${photos[0]}")` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br flex items-center justify-center" 
                           style={{ 
                             backgroundImage: `linear-gradient(to bottom right, ${COLORS.primary}20, ${COLORS.primaryDark}20)` 
                           }}>
                        <div className="text-center" style={{ color: colors.textSecondary }}>
                          <div className="text-5xl mb-2">☕</div>
                          <div className="text-sm font-medium">Нет фото</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm border" 
                         style={{ 
                           backgroundColor: `${colors.surface}e6`, 
                           borderColor: `${colors.surface}33` 
                         }}>
                      <span className="material-symbols-outlined text-[14px] fill-1" style={{ color: COLORS.primary }}>star</span>
                      <span className="text-xs font-bold" style={{ color: colors.textPrimary }}>{(shop.rating || 0).toFixed(1)}</span>
                    </div>
                    
                    {/* Trending/Hiring Badge */}
                    {(isTrending || isHiring) && (
                      <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg shadow-lg border" 
                           style={{ 
                             backgroundColor: COLORS.primary, 
                             borderColor: COLORS.primaryDark 
                           }}>
                        <span className="text-xs uppercase font-bold text-white tracking-widest flex items-center gap-1">
                          {isTrending && (
                            <>
                              <span className="material-symbols-outlined text-[12px] fill-1">local_fire_department</span>
                              Trending
                            </>
                          )}
                          {isHiring && 'Hiring'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 px-1">
                    <h3 className="text-lg font-bold transition-colors mb-1" 
                        style={{ color: colors.textPrimary }}
                        onMouseEnter={(e) => e.currentTarget.style.color = COLORS.primary}
                        onMouseLeave={(e) => e.currentTarget.style.color = colors.textPrimary}>
                      {shop.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm my-1" style={{ color: colors.textSecondary }}>
                      <span className="material-symbols-outlined text-[16px]" style={{ color: COLORS.primary }}>location_on</span>
                      {shop.address || shop.cityName || 'Адрес не указан'}
                      {typeof shop.isOpen !== 'undefined' && (
                        <span>{shop.isOpen ? ' • Открыто' : ' • Закрыто'}</span>
                      )}
                    </div>
                    
                    {shop.description && (
                      <p className="text-sm mb-3 italic line-clamp-2" style={{ color: colors.textSecondary }}>
                        "{shop.description}"
                      </p>
                    )}
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {shop.equipmentIds && shop.equipmentIds.length > 0 && (
                        <span className="px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest" 
                              style={{ 
                                backgroundColor: colors.background, 
                                borderColor: colors.border, 
                                color: colors.textSecondary 
                              }}>
                          Оборудование: {shop.equipmentIds.length}
                        </span>
                      )}
                      {shop.priceRange && (
                        <span className="px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest" 
                              style={{ 
                                backgroundColor: colors.background, 
                                borderColor: colors.border, 
                                color: colors.textSecondary 
                              }}>
                          {shop.priceRange === 'Budget' ? '💰' : shop.priceRange === 'Moderate' ? '💰💰' : '💰💰💰'}
                        </span>
                      )}
                      {shop.reviewCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest" 
                              style={{ 
                                backgroundColor: colors.background, 
                                borderColor: colors.border, 
                                color: colors.textSecondary 
                              }}>
                          {shop.reviewCount} отзывов
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </section>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-3 rounded-xl font-semibold transition-all shadow-sm border"
                    style={
                      currentPage === 1
                        ? {
                            backgroundColor: colors.border,
                            color: `${colors.textSecondary}80`,
                            cursor: 'not-allowed',
                            borderColor: colors.border,
                          }
                        : {
                            backgroundColor: colors.surface,
                            color: colors.textPrimary,
                            borderColor: colors.border,
                          }
                    }
                    onMouseEnter={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.borderColor = COLORS.primary;
                        e.currentTarget.style.color = COLORS.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== 1) {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.color = colors.textPrimary;
                      }
                    }}
                  >
                    ← Назад
                  </button>

                  <span className="mx-4 font-medium" style={{ color: colors.textSecondary }}>
                    Страница <span className="font-bold" style={{ color: COLORS.primary }}>{currentPage}</span> из {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-6 py-3 rounded-xl font-semibold transition-all shadow-sm border"
                    style={
                      currentPage === totalPages
                        ? {
                            backgroundColor: colors.border,
                            color: `${colors.textSecondary}80`,
                            cursor: 'not-allowed',
                            borderColor: colors.border,
                          }
                        : {
                            backgroundColor: colors.surface,
                            color: colors.textPrimary,
                            borderColor: colors.border,
                          }
                    }
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.borderColor = COLORS.primary;
                        e.currentTarget.style.color = COLORS.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages) {
                        e.currentTarget.style.borderColor = colors.border;
                        e.currentTarget.style.color = colors.textPrimary;
                      }
                    }}
                  >
                    Вперед →
                  </button>
                </div>

                <p className="text-sm mt-4" style={{ color: colors.textSecondary }}>
                  Показано <span className="font-semibold" style={{ color: colors.textPrimary }}>{shops.length}</span> из{' '}
                  <span className="font-semibold" style={{ color: colors.textPrimary }}>{totalItems}</span> кофеен
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default CoffeeShopList;

