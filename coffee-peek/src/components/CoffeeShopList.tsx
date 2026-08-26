import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchCoffeeShops, getCities, getEquipments, getCoffeeBeans, getRoasters, getBrewMethods, getShopTags, CoffeeShop, City, Equipment, CoffeeBean, Roaster, BrewMethod, CoffeeShopFilters, ShopTagDto, getPhotoUrl } from '../api/coffeeshop';
import { ShopCardSkeleton } from './skeletons';
import { useTheme } from '../contexts/ThemeContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useLoadMoreOnScroll } from '../hooks/useLoadMoreOnScroll';
import { getErrorMessage } from '../utils/errorHandler';
import { COLORS, getThemeColors } from '../constants/colors';
import { logger } from '../utils/logger';
import { getPriceRangeTier } from '../utils/priceRange';
import ShopCard from './ShopCard';
import ShopSearchBar from './ShopSearchBar';
import ShopFilterPanel from './ShopFilterPanel';
import { AppIcon, StarIcon } from './icons';
import ShopPhotoPlaceholder from './ShopPhotoPlaceholder';
import Mascot from './Mascot';
import { useLocalFavorites } from '../hooks/useLocalFavorites';

const PAGE_SIZE = 12;
const SORT_PAGE_SIZE = 100;

type ShopSort = 'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

const SORT_OPTIONS: { id: ShopSort; label: string }[] = [
  { id: 'default', label: 'По умолчанию' },
  { id: 'name-asc', label: 'Название А–Я' },
  { id: 'name-desc', label: 'Название Я–А' },
  { id: 'price-asc', label: 'Сначала дешевле' },
  { id: 'price-desc', label: 'Сначала дороже' },
];

function compareShops(a: CoffeeShop, b: CoffeeShop, sort: ShopSort): number {
  if (sort === 'name-asc') return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
  if (sort === 'name-desc') return b.name.localeCompare(a.name, 'ru', { sensitivity: 'base' });
  if (sort === 'price-asc' || sort === 'price-desc') {
    const pa = getPriceRangeTier(a.priceRange) ?? 99;
    const pb = getPriceRangeTier(b.priceRange) ?? 99;
    return sort === 'price-asc' ? pa - pb : pb - pa;
  }
  return 0;
}

type ShopsPage = Record<string, unknown> & {
  coffeeShops?: Record<string, unknown>[];
  items?: Record<string, unknown>[];
  content?: Record<string, unknown>[];
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  totalCount?: number;
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

function parseShopList(data: unknown): CoffeeShop[] {
  if (Array.isArray(data)) {
    return data.map((shop) => ({
      ...shop,
      rating: shop.rating ?? shop.averageRating ?? 0,
    })) as CoffeeShop[];
  }
  if (!data || typeof data !== 'object') return [];
  const rd = data as ShopsPage;
  const raw = rd.coffeeShops ?? rd.items ?? rd.content;
  if (!Array.isArray(raw)) return [];
  return raw.map((shop) => {
    const orderedPhotos = [...((shop.photos ?? []) as unknown[])].sort((left, right) => {
      const leftIndex = typeof left === 'object' && left !== null && 'sortIndex' in left
        ? Number((left as { sortIndex?: number }).sortIndex ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER;
      const rightIndex = typeof right === 'object' && right !== null && 'sortIndex' in right
        ? Number((right as { sortIndex?: number }).sortIndex ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    });
    const shopPhotos = orderedPhotos.map(normalizeShopPhoto).filter(Boolean);
    return {
      ...shop,
      shopPhotos,
      photos: orderedPhotos,
      rating: (shop.rating as number) ?? (shop.averageRating as number) ?? 0,
    } as unknown as CoffeeShop;
  });
}

interface CoffeeShopListProps {
  onShopSelect: (shopId: string) => void;
}

const CoffeeShopList: React.FC<CoffeeShopListProps> = ({ onShopSelect }) => {
  const { theme } = useTheme();
  const { user, requireAuth } = useRequireAuth();
  const colors = getThemeColors(theme);
  const { favoriteIds } = useLocalFavorites();
  const [allShops, setAllShops] = useState<CoffeeShop[]>([]); // Все кофейни с сервера (нефильтрованные)
  const [shops, setShops] = useState<CoffeeShop[]>([]); // Отфильтрованные кофейни для отображения
  const [totalItems, setTotalItems] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const [cities, setCities] = useState<City[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [coffeeBeans, setCoffeeBeans] = useState<CoffeeBean[]>([]);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [brewMethods, setBrewMethods] = useState<BrewMethod[]>([]);
  const [shopTags, setShopTags] = useState<ShopTagDto[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [filters, setFilters] = useState<CoffeeShopFilters>({ coffeeFocus: 'specialty' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [shopSort, setShopSort] = useState<ShopSort>('default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeQuick, setActiveQuick] = useState<string[]>(['all']);

  const handleQuickChange = (id: string) => {
    if (id === 'visited' && !requireAuth()) return;
    setActiveQuick(prev => {
      if (id === 'all') return ['all'];
      const without = prev.filter(x => x !== 'all');
      const next = without.includes(id) ? without.filter(x => x !== id) : [...without, id];
      return next.length === 0 ? ['all'] : next;
    });
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(x => x !== tagId) : [...prev, tagId]
    );
  };

  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedBeans, setSelectedBeans] = useState<string[]>([]);
  const [selectedRoasters, setSelectedRoasters] = useState<string[]>([]);
  const [selectedBrewMethods, setSelectedBrewMethods] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
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
    if (initialDataLoaded && selectedCity && !filters.cityId) {
      setFilters((prev) => ({
        ...prev,
        cityId: selectedCity,
        coffeeFocus: prev.coffeeFocus ?? 'specialty',
      }));
    }
  }, [initialDataLoaded, selectedCity, filters.cityId]);
  
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
      coffeeFocus: filters.coffeeFocus,
      isOpen: activeQuick.includes('open') ? true : undefined,
      isNew: activeQuick.includes('new') ? true : undefined,
      isVisited: activeQuick.includes('visited') ? true : undefined,
      tagIds: selectedTagIds.length ? selectedTagIds : undefined,
    };

    if (JSON.stringify(filters) !== JSON.stringify(updatedFilters)) {
      setFilters(updatedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedEquipments, selectedBeans, selectedRoasters, selectedBrewMethods, activeQuick, selectedTagIds]);

  useEffect(() => {
    if (initialDataLoaded && filters.cityId) {
      void loadShops(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.cityId,
    filters.priceRange,
    filters.coffeeFocus,
    filters.equipmentIds?.length ?? 0,
    filters.coffeeBeanIds?.length ?? 0,
    filters.roasterIds?.length ?? 0,
    filters.brewMethodIds?.length ?? 0,
    filters.tagIds?.join(',') ?? '',
    filters.isOpen,
    filters.isNew,
    filters.isVisited,
    debouncedSearchQuery,
    initialDataLoaded,
    shopSort,
  ]);

  const applyFavoriteFilter = useCallback((shopsToFilter: CoffeeShop[]): CoffeeShop[] => {
    if (!activeQuick.includes('favorite')) return shopsToFilter;
    return shopsToFilter.filter(shop => favoriteIds.has(shop.id));
  }, [activeQuick, favoriteIds]);

  // Favorite is local-only — re-apply after load or when favorite chip / ids change
  useEffect(() => {
    const filtered = applyFavoriteFilter(allShops);
    const next = shopSort === 'default' ? filtered : [...filtered].sort((a, b) => compareShops(a, b, shopSort));
    setShops(next);
    if (activeQuick.includes('favorite')) setTotalItems(next.length);
  }, [applyFavoriteFilter, allShops, activeQuick, shopSort]);

  const loadInitialData = async () => {
    try {
      const [citiesRes, equipmentsRes, beansRes, roastersRes, methodsRes, tagsRes] = await Promise.all([
        getCities(),
        getEquipments(),
        getCoffeeBeans(),
        getRoasters(),
        getBrewMethods(),
        getShopTags(),
      ]);

      const citiesData = extractList<City>(citiesRes.data, 'cities');
      const equipmentsData = extractList<Equipment>(equipmentsRes.data, 'equipments');
      const beansData = extractList<CoffeeBean>(beansRes.data, 'beans');
      const roastersData = extractList<Roaster>(roastersRes.data, 'roasters');
      const methodsData = extractList<BrewMethod>(methodsRes.data, 'methods');
      const tagsData = extractList<ShopTagDto>(tagsRes.data, 'tags', 'shopTags', 'items');

      setCities(Array.isArray(citiesData) ? citiesData : []);
      setEquipments(Array.isArray(equipmentsData) ? equipmentsData : []);
      setCoffeeBeans(Array.isArray(beansData) ? beansData : []);
      setRoasters(Array.isArray(roastersData) ? roastersData : []);
      setBrewMethods(Array.isArray(methodsData) ? methodsData : []);
      setShopTags(Array.isArray(tagsData) ? tagsData : (Array.isArray(tagsRes.data) ? tagsRes.data : []));
    } catch (err) {
      logger.error('Error loading initial data:', err);
      // Set empty arrays to prevent errors
      setCities([]);
      setEquipments([]);
      setCoffeeBeans([]);
      setRoasters([]);
      setBrewMethods([]);
      setShopTags([]);
    }
  };

  const loadShops = async (pageToLoad: number, append: boolean) => {
    if (append && loadingRef.current) return;
    const requestId = ++requestIdRef.current;
    loadingRef.current = true;
    if (append) setIsLoadingMore(true);
    else {
      setIsLoading(true);
      setError(null);
      setHasMore(true);
    }

    try {
      const pageSize = shopSort === 'default' ? PAGE_SIZE : SORT_PAGE_SIZE;
      const response = await searchCoffeeShops(debouncedSearchQuery, filters, pageToLoad, pageSize);
      if (requestId !== requestIdRef.current) return;

      const list = parseShopList(response.data);
      const rd = (response.data && typeof response.data === 'object' ? response.data : {}) as ShopsPage;
      const totalPages = Number(rd.totalPages ?? response.pagination?.totalPages ?? 0);
      const apiTotal = Number(rd.totalItems ?? (rd as { totalCount?: number }).totalCount ?? response.pagination?.totalItems ?? 0);

      setAllShops((prev) => {
        if (!append) return list;
        const seen = new Set(prev.map((s) => s.id));
        return [...prev, ...list.filter((shop) => !seen.has(shop.id))];
      });
      setHasMore(
        shopSort === 'default' && list.length > 0 && (
          totalPages > 0
            ? pageToLoad < totalPages
            : apiTotal > 0
              ? pageToLoad * PAGE_SIZE < apiTotal
              : list.length >= PAGE_SIZE
        ),
      );
      if (!activeQuick.includes('favorite') && apiTotal > 0) setTotalItems(apiTotal);
      setPage(pageToLoad);
    } catch (err: unknown) {
      if (requestId !== requestIdRef.current) return;
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      logger.error('CoffeeShopList: Ошибка при загрузке кофеен:', err);
      if (!append) {
        setAllShops([]);
        setShops([]);
        setTotalItems(0);
        setHasMore(false);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const loadMoreRef = useLoadMoreOnScroll(
    hasMore && !isLoading && !isLoadingMore && !!filters.cityId,
    () => { void loadShops(page + 1, true); },
  );

  const handleApplyFilters = (applied: { priceRange?: string; coffeeFocus?: string; equipments: string[]; beans: string[]; roasters: string[]; brewMethods: string[] }) => {
    setSelectedEquipments(applied.equipments);
    setSelectedBeans(applied.beans);
    setSelectedRoasters(applied.roasters);
    setSelectedBrewMethods(applied.brewMethods);
    setFilters(prev => ({ ...prev, priceRange: applied.priceRange, coffeeFocus: applied.coffeeFocus }));
  };

  const openShopDetails = (shopId: string) => {
    onShopSelect(shopId);
  };

  const isDark = theme === 'dark';
  const featured = shops.filter(s => s.rating && s.rating >= 4.7).slice(0, 5);

  const activeFilterCount =
    selectedEquipments.length + selectedBeans.length +
    selectedRoasters.length + selectedBrewMethods.length +
    selectedTagIds.length +
    (filters.priceRange ? 1 : 0);

  const filterPanelProps = {
    activeQuick,
    onQuickChange: handleQuickChange,
    shopTags,
    selectedTagIds,
    onTagToggle: handleTagToggle,
    filters,
    equipments,
    coffeeBeans,
    roasters,
    brewMethods,
    selectedEquipments,
    selectedBeans,
    selectedRoasters,
    selectedBrewMethods,
    cities,
    selectedCity,
    onCityChange: setSelectedCity,
    showCityDropdown,
    onCityDropdownToggle: () => setShowCityDropdown((v) => !v),
    colors,
    dark: isDark,
    onApplyFilters: handleApplyFilters,
    resultCount: totalItems || shops.length,
  };

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
          activeFilterCount={activeFilterCount}
          colors={colors}
          dark={isDark}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:block">
            <ShopFilterPanel mode="quick" {...filterPanelProps} />
          </div>
          <div className="lg:flex lg:gap-10 lg:items-start">
            <aside
              className="hidden lg:block w-[260px] xl:w-[280px] shrink-0 sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto no-scrollbar pb-8 pr-6"
              style={{ borderRight: `1px solid ${colors.border}` }}
            >
              <ShopFilterPanel mode="sidebar" {...filterPanelProps} />
            </aside>

            <div className="flex-1 min-w-0">
              <div className="lg:hidden">
                <ShopFilterPanel mode="chips" {...filterPanelProps} />
              </div>

        {error && (
          <div role="alert" className="mb-6 p-4 border rounded-2xl"
               style={{ backgroundColor: `${COLORS.error}10`, borderColor: `${COLORS.error}30` }}>
            <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
          </div>
        )}

        {/* ── Mobile: «Подборка недели» carousel ──────────────── */}
        {!isLoading && featured.length > 0 && (
          <div className="lg:hidden mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <h2 style={{ margin: 0, fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 17, color: colors.textPrimary, letterSpacing: '-0.01em' }}>Подборка недели</h2>
            </div>
            <div className="overflow-x-auto no-scrollbar -mx-4 sm:-mx-6 px-4 sm:px-6" style={{ display: 'flex', gap: 12, paddingBottom: 4 }}>
              {featured.map(shop => {
                const photos = shop.shopPhotos?.filter((p): p is string => typeof p === 'string') ?? [];
                return (
                  <div key={`f-${shop.id}`} onClick={() => openShopDetails(shop.id)}
                    style={{ flexShrink: 0, width: 200, borderRadius: 14, overflow: 'hidden', border: `1px solid ${colors.border}`, background: colors.surface, cursor: 'pointer' }}>
                    <div style={{ height: 112, position: 'relative', overflow: 'hidden' }}>
                      {photos[0] ? (
                        <div style={{ width: '100%', height: '100%', background: `url(${photos[0]}) center/cover` }} />
                      ) : (
                        <ShopPhotoPlaceholder fontSize={14} />
                      )}
                      {shop.rating && (
                        <span style={{ position: 'absolute', top: 8, left: 8, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(12px)', fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 11, color: '#D4A84B' }}>
                          <StarIcon filled size={12} color="#D4A84B" />
                          {shop.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '9px 11px 11px' }}>
                      <h4 style={{ margin: 0, fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 13, color: colors.textPrimary, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{shop.name}</h4>
                      <p
                        title={shop.location?.address || shop.address || shop.cityName || ''}
                        style={{ margin: '3px 0 0', fontFamily: '"RF Dewi Expanded"', fontSize: 11, color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}
                      >
                        {shop.location?.address || shop.address || shop.cityName || ''}
                      </p>
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
          <div className="flex items-baseline justify-between mb-3">
            <h2 style={{ margin: 0, fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 17, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
              <span className="hidden lg:inline">Кофейни рядом · </span>
              {totalItems || shops.length}
            </h2>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowSortMenu((v) => !v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                  color: shopSort === 'default' ? colors.textSecondary : COLORS.primary,
                  fontFamily: '"RF Dewi Expanded"', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <AppIcon name="swap_vert" size={14} />
                {SORT_OPTIONS.find((o) => o.id === shopSort)?.label ?? 'Сортировка'}
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 20, minWidth: 200,
                    borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.surface,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.16)', overflow: 'hidden',
                  }}>
                    {SORT_OPTIONS.map((option) => {
                      const active = shopSort === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => { setShopSort(option.id); setShowSortMenu(false); }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                            padding: '10px 14px', border: 'none', background: active ? `${COLORS.primary}14` : 'transparent',
                            color: active ? COLORS.primary : colors.textPrimary,
                            fontFamily: '"RF Dewi Expanded"', fontSize: 13, fontWeight: active ? 700 : 600,
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          {option.label}
                          {active && <AppIcon name="check" size={14} color={COLORS.primary} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Shop grid: 1 / 2 / 3 cols beside sidebar ── */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
              <ShopCardSkeleton count={8} />
            </div>
          ) : shops.length === 0 ? (
            <div
              className="rounded-2xl px-6 py-16 border flex flex-col items-center justify-center text-center min-h-[240px]"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <Mascot pose="search" size={132} />
              <p style={{ margin: '12px 0 0', fontFamily: '"RF Dewi Expanded"', fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                Ничего не найдено. Попробуйте другой фильтр.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12 sm:pb-12">
              {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} colors={colors} onSelect={openShopDetails} />
              ))}
            </div>
          )}
          <div ref={loadMoreRef} className="pb-8">
            {isLoadingMore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <ShopCardSkeleton count={4} />
              </div>
            )}
          </div>
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {showFilters && (
      <div className="lg:hidden fixed inset-0 z-50">
        <button
          type="button"
          aria-label="Закрыть фильтры"
          className="absolute inset-0 bg-black/50 border-0 cursor-pointer"
          onClick={() => setShowFilters(false)}
        />
        <aside
          className="absolute left-0 top-0 bottom-0 w-[min(86vw,340px)] overflow-y-auto p-4"
          style={{ background: colors.surface, borderRight: `1px solid ${colors.border}` }}
        >
          <ShopFilterPanel
            mode="sidebar"
            {...filterPanelProps}
            onClose={() => setShowFilters(false)}
          />
        </aside>
      </div>
    )}
    </>
  );
};

export default CoffeeShopList;
