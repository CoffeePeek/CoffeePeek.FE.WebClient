import React, { useState, useEffect, useCallback } from 'react';
import { searchCoffeeShops, getCities, getEquipments, getCoffeeBeans, getRoasters, getBrewMethods, CoffeeShop, City, Equipment, CoffeeBean, Roaster, BrewMethod, CoffeeShopFilters, getPhotoUrl } from '../api/coffeeshop';
import { ShopCardSkeleton } from './skeletons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { getErrorMessage } from '../utils/errorHandler';
import { COLORS, getThemeColors } from '../constants/colors';
import { logger } from '../utils/logger';
import ShopCard from './ShopCard';
import ShopSearchBar from './ShopSearchBar';
import ShopFilterPanel from './ShopFilterPanel';
import ShopPagination from './ShopPagination';

type PhotoInput = { fullUrl?: string; storageKey?: string } | string;

type ShopsPage = Record<string, unknown> & {
  coffeeShops?: Record<string, unknown>[];
  items?: Record<string, unknown>[];
  content?: Record<string, unknown>[];
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
};

function extractList<T>(data: unknown, ...keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    for (const key of keys) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as T[];
    }
  }
  return [];
}

function normalizeShopPhoto(p: unknown): string {
  if (typeof p === 'string') return p;
  if (p && typeof p === 'object' && ('fullUrl' in p || 'storageKey' in p)) {
    return getPhotoUrl(p as Parameters<typeof getPhotoUrl>[0]);
  }
  return '';
}

interface CoffeeShopListProps {
  onShopSelect: (shopId: string) => void;
}

const CoffeeShopList: React.FC<CoffeeShopListProps> = ({ onShopSelect }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const colors = getThemeColors(theme);
  const [allShops, setAllShops] = useState<CoffeeShop[]>([]); // Все кофейни с сервера (нефильтрованные)
  const [shops, setShops] = useState<CoffeeShop[]>([]); // Отфильтрованные кофейни для отображения
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
  const [activeQuick, setActiveQuick] = useState('all');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedBeans, setSelectedBeans] = useState<string[]>([]);
  const [selectedRoasters, setSelectedRoasters] = useState<string[]>([]);
  const [selectedBrewMethods, setSelectedBrewMethods] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilterTabs, setActiveFilterTabs] = useState<Set<'open' | 'new' | 'favorite' | 'visited'>>(new Set());
  const [favoriteShopIds, setFavoriteShopIds] = useState<Set<string>>(new Set());
  const [visitedShopIds, setVisitedShopIds] = useState<Set<string>>(new Set());
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  useEffect(() => {
    loadInitialData().then(() => {
      setInitialDataLoaded(true);
    });
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
  
  // Debouncing для поискового запроса (задержка 600ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 600); // Запрос отправится через 600ms после последнего ввода

    return () => clearTimeout(timer);
  }, [searchQuery]);


  useEffect(() => {
    const updatedFilters: CoffeeShopFilters = {
      cityId: selectedCity || undefined,
      equipmentIds: selectedEquipments.length ? selectedEquipments : undefined,
      coffeeBeanIds: selectedBeans.length ? selectedBeans : undefined,
      roasterIds: selectedRoasters.length ? selectedRoasters : undefined,
      brewMethodIds: selectedBrewMethods.length ? selectedBrewMethods : undefined,
      priceRange: filters.priceRange,
    };

    if (JSON.stringify(filters) !== JSON.stringify(updatedFilters)) {
      setFilters(updatedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedEquipments, selectedBeans, selectedRoasters, selectedBrewMethods]);

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
    debouncedSearchQuery, // Загружаем данные при изменении debounced поискового запроса
    initialDataLoaded, // This ensures the effect only runs after initial data is loaded
    // activeFilterTab НЕ добавлен - фильтрация происходит на клиенте без перезагрузки
  ]);

  useEffect(() => {
    // Load shops when page changes
    if (filters.cityId && initialDataLoaded) { // Only load if city is selected and initial data loaded
      loadShops();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, initialDataLoaded]);

  // Применяем клиентскую фильтрацию при изменении вкладки
  useEffect(() => {
    if (allShops.length > 0) {
      const filtered = filterShopsByActiveTabs(allShops);
      setShops(filtered);
      setTotalItems(filtered.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilterTabs, allShops.length]);

  const filterShopsByActiveTabs = (shopsToFilter: CoffeeShop[]): CoffeeShop[] => {
    let filtered = shopsToFilter;
    
    // Если нет активных фильтров, показываем все кофейни
    if (activeFilterTabs.size === 0) {
      return filtered;
    }
    
    // Применяем все активные фильтры (AND логика - кофейня должна соответствовать всем выбранным фильтрам)
    if (activeFilterTabs.has('open')) {
      filtered = filtered.filter(shop => shop.isOpen === true);
    }
    
    if (activeFilterTabs.has('new')) {
      filtered = filtered.filter(shop => shop.isNew === true);
    }
    
    if (activeFilterTabs.has('favorite')) {
      filtered = filtered.filter(shop => shop.isFavorite === true);
    }
    
    if (activeFilterTabs.has('visited')) {
      filtered = filtered.filter(shop => shop.isVisited === true);
    }
    
    return filtered;
  };
  
  const toggleFilterTab = (filterId: 'open' | 'new' | 'favorite' | 'visited') => {
    setActiveFilterTabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filterId)) {
        // Если фильтр уже активен, снимаем его
        newSet.delete(filterId);
      } else {
        // Если фильтр не активен, добавляем его
        newSet.add(filterId);
      }
      return newSet;
    });
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

      const citiesData = extractList<City>(citiesRes.data, 'cities');
      const equipmentsData = extractList<Equipment>(equipmentsRes.data, 'equipments');
      const beansData = extractList<CoffeeBean>(beansRes.data, 'beans');
      const roastersData = extractList<Roaster>(roastersRes.data, 'roasters');
      const methodsData = extractList<BrewMethod>(methodsRes.data, 'methods');

      setCities(Array.isArray(citiesData) ? citiesData : []);
      setEquipments(Array.isArray(equipmentsData) ? equipmentsData : []);
      setCoffeeBeans(Array.isArray(beansData) ? beansData : []);
      setRoasters(Array.isArray(roastersData) ? roastersData : []);
      setBrewMethods(Array.isArray(methodsData) ? methodsData : []);
    } catch (err) {
      logger.error('Error loading initial data:', err);
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
      setError(null);
      
      const response = await searchCoffeeShops(debouncedSearchQuery, filters, currentPage, pageSize)
      
        
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as unknown as ShopsPage;
        const pagination = (rd: ShopsPage) => ({
          pages: rd.totalPages ?? 1,
          page: rd.currentPage ?? 1,
          size: rd.pageSize ?? 10,
        });

        if (Array.isArray(responseData.coffeeShops)) {
          const shops = responseData.coffeeShops.map((shop) => {
            const shopPhotos = ((shop.photos ?? []) as unknown[])
              .map(normalizeShopPhoto)
              .filter(Boolean);
            return { ...shop, shopPhotos, photos: shop.photos, rating: (shop.rating as number) ?? 0 } as unknown as CoffeeShop;
          });
          setAllShops(shops);
          const filtered = filterShopsByActiveTabs(shops);
          setShops(filtered);
          setTotalItems(filtered.length);
          const p = pagination(responseData);
          setTotalPages(p.pages);
          setCurrentPage(p.page);
          setPageSize(p.size);
        } else if (Array.isArray(responseData.items)) {
          const items = responseData.items.map((shop) => ({
            ...shop,
            rating: (shop.rating as number) ?? (shop.averageRating as number) ?? 0,
          })) as unknown as CoffeeShop[];
          setAllShops(items);
          const filtered = filterShopsByActiveTabs(items);
          setShops(filtered);
          setTotalItems(filtered.length);
          const p = pagination(responseData);
          setTotalPages(p.pages); setCurrentPage(p.page); setPageSize(p.size);
        } else if (Array.isArray(responseData.content)) {
          const content = responseData.content.map((shop) => ({
            ...shop,
            rating: (shop.rating as number) ?? (shop.averageRating as number) ?? 0,
          })) as unknown as CoffeeShop[];
          setAllShops(content);
          const filtered = filterShopsByActiveTabs(content);
          setShops(filtered);
          setTotalItems(filtered.length);
          const p = pagination(responseData);
          setTotalPages(p.pages); setCurrentPage(p.page); setPageSize(p.size);
        } else {
          // Fallback for direct array
          if (Array.isArray(responseData)) {
            setAllShops(responseData);
            const filteredShops = filterShopsByActiveTabs(responseData);
            setShops(filteredShops);
            setTotalItems(filteredShops.length);
            setTotalPages(1);
          } else {
            setAllShops([]);
            setShops([]);
            setTotalItems(0);
            setTotalPages(1);
          }
        }
      } else {
        // Fallback for old response format
        if (Array.isArray(response.data)) {
          setAllShops(response.data);
          const filteredShops = filterShopsByActiveTabs(response.data);
          setShops(filteredShops);
          setTotalItems(filteredShops.length);
          setTotalPages(1);
        } else {
          setAllShops([]);
          setShops([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      }
      
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      logger.error('CoffeeShopList: Ошибка при загрузке кофеен:', err);
      setAllShops([]);
      setShops([]);
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

  const isDark = theme === 'dark';
  const featured = shops.filter(s => s.rating && s.rating >= 4.7).slice(0, 5);

  return (
    <>
    <div className="min-h-screen pb-20" style={{ backgroundColor: colors.background, position: 'relative' }}>
      {/* Dotted bg pattern */}
      {isDark && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#2D241F 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <ShopSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={showFilters}
          onFilterToggle={() => setShowFilters(f => !f)}
          cities={cities}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          showCityDropdown={showCityDropdown}
          onCityDropdownToggle={() => setShowCityDropdown(v => !v)}
          colors={colors}
          dark={isDark}
        />

        {/* Unified filter panel: chips row + toggled advanced panel */}
        <ShopFilterPanel
          activeQuick={activeQuick}
          onQuickChange={setActiveQuick}
          showFilters={showFilters}
          filters={filters}
          equipments={equipments}
          coffeeBeans={coffeeBeans}
          roasters={roasters}
          brewMethods={brewMethods}
          selectedEquipments={selectedEquipments}
          selectedBeans={selectedBeans}
          selectedRoasters={selectedRoasters}
          selectedBrewMethods={selectedBrewMethods}
          colors={colors}
          dark={isDark}
          onFilterChange={handleFilterChange}
          onEquipmentChange={setSelectedEquipments}
          onBeansChange={setSelectedBeans}
          onRoastersChange={setSelectedRoasters}
          onBrewMethodsChange={setSelectedBrewMethods}
          onClearAdvanced={() => {
            clearFilters();
            setSelectedEquipments([]);
            setSelectedBeans([]);
            setSelectedRoasters([]);
            setSelectedBrewMethods([]);
          }}
        />

        {error && (
          <div role="alert" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 p-4 border rounded-2xl"
               style={{ backgroundColor: `${COLORS.error}10`, borderColor: `${COLORS.error}30` }}>
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        {/* ── Mobile: «Подборка недели» carousel ──────────────── */}
        {!isLoading && featured.length > 0 && (
          <div className="lg:hidden mb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-baseline justify-between mb-3">
              <h2 style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 17, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Подборка недели</h2>
              <button style={{ background: 'none', border: 'none', color: '#B48C4B', fontFamily: '"Noto Sans"', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Все →</button>
            </div>
            <div className="pl-4 sm:pl-6 overflow-x-auto no-scrollbar" style={{ display: 'flex', gap: 12, paddingBottom: 4 }}>
              {featured.map(shop => {
                const photos = shop.shopPhotos?.filter((p): p is string => typeof p === 'string') ?? [];
                return (
                  <div key={`f-${shop.id}`} onClick={() => openShopDetails(shop.id)}
                    style={{ flexShrink: 0, width: 200, borderRadius: 14, overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface, cursor: 'pointer' }}>
                    <div style={{ height: 112, background: photos[0] ? `url(${photos[0]}) center/cover` : `${COLORS.primary}20`, position: 'relative' }}>
                      {shop.rating && (
                        <span style={{ position: 'absolute', top: 8, left: 8, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(12px)', fontFamily: '"Noto Sans"', fontWeight: 700, fontSize: 11, color: '#B48C4B' }}>
                          <span className="material-symbols-rounded star-filled" style={{ fontSize: 12, color: '#B48C4B', lineHeight: 1 }}>star</span>
                          {shop.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '9px 11px 11px' }}>
                      <h4 style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 13, color: colors.textPrimary, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{shop.name}</h4>
                      <p style={{ margin: '3px 0 0', fontFamily: '"Noto Sans"', fontSize: 11, color: colors.textSecondary }}>{shop.address || shop.cityName || ''}</p>
                    </div>
                  </div>
                );
              })}
              <div style={{ flexShrink: 0, width: 4 }} />
            </div>
          </div>
        )}

        {/* ── Mobile: list section header ─────────────────────── */}
        {!isLoading && (
          <div className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 flex items-baseline justify-between mb-3">
            <h2 style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 17, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
              Кофейни рядом <span style={{ color: colors.textSecondary, fontWeight: 500, fontSize: 13 }}>· {shops.length}</span>
            </h2>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: colors.textSecondary, fontFamily: '"Noto Sans"', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14, lineHeight: 1 }}>swap_vert</span>
              Сортировка
            </button>
          </div>
        )}

        {/* ── Shop grid (desktop 4-col, tablet 2-col) / list (mobile) ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <>
              {/* Desktop skeleton */}
              <div className="hidden lg:grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <ShopCardSkeleton count={8} />
              </div>
              {/* Mobile skeleton */}
              <div className="lg:hidden flex flex-col gap-3">
                <ShopCardSkeleton count={4} />
              </div>
            </>
          ) : shops.length === 0 ? (
            <div className="rounded-2xl p-10 text-center border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <span className="material-symbols-rounded" style={{ fontSize: 40, color: colors.textSecondary, lineHeight: 1 }}>coffee_maker</span>
              <p style={{ margin: '12px 0 0', fontFamily: '"Noto Sans"', fontSize: 14, color: colors.textSecondary }}>Ничего не найдено. Попробуйте другой фильтр.</p>
            </div>
          ) : (
            <>
              {/* Desktop: 4-column grid */}
              <div className="hidden lg:grid gap-4 pb-12" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} colors={colors} favoriteShopIds={favoriteShopIds} onSelect={openShopDetails} />
                ))}
              </div>
              {/* Mobile: list rows */}
              <div className="lg:hidden flex flex-col gap-3 pb-24">
                {shops.map((shop) => {
                  const photos = shop.shopPhotos?.filter((p): p is string => typeof p === 'string') ?? [];
                  return (
                    <article key={shop.id} onClick={() => openShopDetails(shop.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, cursor: 'pointer' }}>
                      <div style={{ width: 84, height: 84, flexShrink: 0, borderRadius: 12, background: photos[0] ? `url(${photos[0]}) center/cover` : `${COLORS.primary}20`, overflow: 'hidden' }}>
                        {photos[0] && <img src={photos[0]} alt={shop.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <h3 style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 15, color: colors.textPrimary, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{shop.name}</h3>
                          {shop.rating && shop.rating > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, background: 'rgba(180,140,75,.12)', color: '#B48C4B', fontFamily: '"Noto Sans"', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' as const }}>
                              <span className="material-symbols-rounded star-filled" style={{ fontSize: 13, color: '#B48C4B', lineHeight: 1 }}>star</span>
                              {shop.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"Noto Sans"', fontSize: 11, color: colors.textSecondary }}>
                          {typeof shop.isOpen !== 'undefined' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, background: shop.isOpen ? 'rgba(34,197,94,.18)' : 'rgba(239,68,68,.18)', color: shop.isOpen ? '#15803D' : '#B91C1C', fontFamily: '"Noto Sans"', fontWeight: 700, fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase' as const }}>
                              {shop.isOpen ? 'Открыто' : 'Закрыто'}
                            </span>
                          )}
                          <span>{shop.address || shop.cityName || ''}</span>
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                          {(shop as unknown as Record<string, unknown[]>).tags?.slice(0, 3).map((t, i) => (
                            <span key={i} style={{ padding: '3px 8px', borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : '#F5F5F4', color: isDark ? '#A39E93' : '#57534E', fontFamily: '"Noto Sans"', fontSize: 10, fontWeight: 600 }}>{String(t)}</span>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {!isLoading && shops.length > 0 && totalPages > 1 && (
          <ShopPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            shopsCount={shops.length}
            colors={colors}
            onPrev={() => setCurrentPage(p => Math.max(p - 1, 1))}
            onNext={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          />
        )}
      </div>
    </div>
    </>
  );
};

export default CoffeeShopList;
