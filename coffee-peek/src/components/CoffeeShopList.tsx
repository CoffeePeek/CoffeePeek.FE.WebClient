import React, { useState, useEffect } from 'react';
import { getCoffeeShops, getCities, getEquipments, getCoffeeBeans, getRoasters, getBrewMethods, CoffeeShop, City, Equipment, CoffeeBean, Roaster, BrewMethod, CoffeeShopFilters } from '../api/coffeeshop';
import Button from './Button';
import Input from './Input';

const CoffeeShopList: React.FC = () => {
  const [shops, setShops] = useState<CoffeeShop[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [coffeeBeans, setCoffeeBeans] = useState<CoffeeBean[]>([]);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [brewMethods, setBrewMethods] = useState<BrewMethod[]>([]);
  
  const [filters, setFilters] = useState<CoffeeShopFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.cityId,
    filters.priceRange,
    filters.equipmentIds?.length ?? 0, 
    filters.coffeeBeanIds?.length ?? 0,
    filters.roasterIds?.length ?? 0,
    filters.brewMethodIds?.length ?? 0, 
]);

  const loadInitialData = async () => {
    try {
      const [citiesRes, equipmentsRes, beansRes, roastersRes, methodsRes] = await Promise.all([
        getCities(),
        getEquipments(),
        getCoffeeBeans(),
        getRoasters(),
        getBrewMethods(),
      ]);

      setCities(citiesRes.data || []);
      setEquipments(equipmentsRes.data || []);
      setCoffeeBeans(beansRes.data || []);
      setRoasters(roastersRes.data || []);
      setBrewMethods(methodsRes.data || []);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const loadShops = async () => {
    try {
      setIsLoading(true);
      const response = await getCoffeeShops(filters);
      console.log('Coffee shops response:', response);
      
      // Убеждаемся, что data - это массив
      const shopsData = response.data;
      if (Array.isArray(shopsData)) {
        setShops(shopsData);
      } else if (shopsData && typeof shopsData === 'object') {
        // Если data - объект, попробуем найти массив внутри
        const shopsArray = (shopsData as any).items || (shopsData as any).shops || [];
        setShops(Array.isArray(shopsArray) ? shopsArray : []);
      } else {
        setShops([]);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке кофеен');
      console.error('Error loading coffee shops:', err);
      setShops([]); // Устанавливаем пустой массив при ошибке
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

  if (isLoading && shops.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1412]">
        <div className="text-[#EAB308] text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1412] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Кофейни</h1>
            <p className="text-[#A39E93]">Найдите лучшие кофейни поблизости</p>
          </div>
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Фильтры */}
        {showFilters && (
          <div className="mb-6 bg-[#2D241F] border border-[#3D2F28] rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-[#A39E93] text-sm mb-2 block">Город</label>
                <select
                  className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white"
                  value={filters.cityId || ''}
                  onChange={(e) => handleFilterChange('cityId', e.target.value || undefined)}
                >
                  <option value="">Все города</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#A39E93] text-sm mb-2 block">Ценовой диапазон</label>
                <select
                  className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white"
                  value={filters.priceRange || ''}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value || undefined)}
                >
                  <option value="">Любой</option>
                  <option value="Budget">Бюджетный</option>
                  <option value="Moderate">Средний</option>
                  <option value="Premium">Премиум</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button variant="ghost" onClick={clearFilters} className="w-full">
                  Сбросить фильтры
                </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-[#2D241F] border border-[#3D2F28] rounded-2xl p-6 hover:border-[#EAB308]/50 transition-all"
              >
                {shop.shopPhotos && shop.shopPhotos.length > 0 && (
                  <div className="mb-4 aspect-video bg-[#1A1412] rounded-xl overflow-hidden">
                    <img
                      src={shop.shopPhotos[0]}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                    />
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

                <div className="flex justify-between items-center">
                  {shop.rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-[#EAB308]">⭐</span>
                      <span className="text-white">{shop.rating.toFixed(1)}</span>
                      {shop.reviewCount && (
                        <span className="text-[#A39E93] text-sm">({shop.reviewCount})</span>
                      )}
                    </div>
                  )}
                  
                  {shop.priceRange && (
                    <span className="text-[#A39E93] text-sm">
                      {shop.priceRange === 'Budget' ? '💰' : shop.priceRange === 'Moderate' ? '💰💰' : '💰💰💰'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoffeeShopList;

