import React, { useState, useEffect } from 'react';
import { getModerationShops, updateModerationStatus, ModerationShop, UpdateModerationShopRequest, updateModerationShop } from '../api/moderation';
import { getCities, getEquipments, getCoffeeBeans, getRoasters, getBrewMethods, City, Equipment, CoffeeBean, Roaster, BrewMethod } from '../api/coffeeshop';
import Button from './Button';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getErrorMessage } from '../utils/errorHandler';

const ModeratorPanel: React.FC = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [shops, setShops] = useState<ModerationShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<ModerationShop | null>(null);
  const [editingShop, setEditingShop] = useState<ModerationShop | null>(null);
  const [editForm, setEditForm] = useState<Partial<ModerationShop>>({});
  const [statusFilter, setStatusFilter] = useState<string>('Pending'); // По умолчанию показываем только кофейни на модерации
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list'); // Режим просмотра: список или редактирование
  const [updatingShopId, setUpdatingShopId] = useState<string | null>(null); // ID кофейни, для которой выполняется обновление статуса
  
  // Reference data for caching
  const [cities, setCities] = useState<City[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [coffeeBeans, setCoffeeBeans] = useState<CoffeeBean[]>([]);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [brewMethods, setBrewMethods] = useState<BrewMethod[]>([]);
  
  // Loading states for reference data
  const [referenceDataLoaded, setReferenceDataLoaded] = useState(false);

  useEffect(() => {
    loadShops();
    loadReferenceData();
  }, []);
  
  const loadReferenceData = async () => {
    try {
      console.log('Loading reference data...');
      const [citiesRes, equipmentsRes, beansRes, roastersRes, methodsRes] = await Promise.all([
        getCities(),
        getEquipments(),
        getCoffeeBeans(),
        getRoasters(),
        getBrewMethods(),
      ]);
      
      console.log('Reference data responses:', { citiesRes, equipmentsRes, beansRes, roastersRes, methodsRes });
      
      // The API returns data in format { brewMethods: [...] }, { cities: [...] }, etc.
      // Need to cast to any to access nested properties
      const citiesResponse: any = citiesRes;
      const equipmentsResponse: any = equipmentsRes;
      const beansResponse: any = beansRes;
      const roastersResponse: any = roastersRes;
      const methodsResponse: any = methodsRes;
      
      // Парсим данные из разных возможных форматов API
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
      
      // Детальное логирование для отладки
      console.log('Parsed reference data:', {
        cities: {
          count: citiesArray.length,
          sample: citiesArray.slice(0, 2),
          firstCityId: citiesArray[0]?.id,
          firstCityName: citiesArray[0]?.name
        },
        equipments: {
          count: equipmentsArray.length,
          sample: equipmentsArray.slice(0, 2),
          firstEquipmentId: equipmentsArray[0]?.id,
          firstEquipmentName: equipmentsArray[0]?.name
        },
        beans: {
          count: beansArray.length,
          sample: beansArray.slice(0, 2),
          firstBeanId: beansArray[0]?.id,
          firstBeanName: beansArray[0]?.name
        },
        roasters: {
          count: roastersArray.length,
          sample: roastersArray.slice(0, 2),
          firstRoasterId: roastersArray[0]?.id,
          firstRoasterName: roastersArray[0]?.name
        },
        methods: {
          count: methodsArray.length,
          sample: methodsArray.slice(0, 2),
          firstMethodId: methodsArray[0]?.id,
          firstMethodName: methodsArray[0]?.name
        }
      });
      
      setCities(citiesArray);
      setEquipments(equipmentsArray);
      setCoffeeBeans(beansArray);
      setRoasters(roastersArray);
      setBrewMethods(methodsArray);
      // Устанавливаем loaded в true после попытки загрузки (даже если данные пустые)
      // Это позволяет различать "данные загружаются" от "данные загружены (но могут быть пустыми)"
      setReferenceDataLoaded(true);
      console.log('Reference data loaded:', { 
        cities: citiesArray.length, 
        equipments: equipmentsArray.length, 
        beans: beansArray.length, 
        roasters: roastersArray.length, 
        methods: methodsArray.length,
        citiesSample: citiesArray.slice(0, 2),
        beansSample: beansArray.slice(0, 2),
        roastersSample: roastersArray.slice(0, 2),
        methodsSample: methodsArray.slice(0, 2)
      });
    } catch (err) {
      console.error('Error loading reference data:', err);
      // Устанавливаем loaded в true даже при ошибке, чтобы не показывать "Загрузка..." вечно
      setReferenceDataLoaded(true);
    }
  };

  const loadShops = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Не авторизован');
      }

      const response = await getModerationShops(token);
      console.log('ModeratorPanel: Получен ответ от API модерации:', response);
      
      // API может возвращать данные в разных форматах
      let shopsData: any = response.data;
      console.log('ModeratorPanel: Структура response.data:', shopsData);
      console.log('ModeratorPanel: Тип response.data:', typeof shopsData);
      console.log('ModeratorPanel: Ключи в response.data:', shopsData && typeof shopsData === 'object' ? Object.keys(shopsData) : 'не объект');
      
      // Проверяем, есть ли вложенный объект moderationShop
      if (shopsData && typeof shopsData === 'object' && 'moderationShop' in shopsData) {
        console.log('ModeratorPanel: Найден формат moderationShop, количество:', Array.isArray(shopsData.moderationShop) ? shopsData.moderationShop.length : 'не массив');
        shopsData = shopsData.moderationShop;
      }
      
      // Отладочная информация для первой кофейни и проверка сопоставления
      if (shopsData && Array.isArray(shopsData) && shopsData.length > 0) {
        const firstShop = shopsData[0];
        console.log('Sample shop data from ModerationShop API:', {
          id: firstShop.id,
          name: firstShop.name,
          equipmentIds: firstShop.equipmentIds,
          equipmentIdsType: Array.isArray(firstShop.equipmentIds) ? 'array' : typeof firstShop.equipmentIds,
          equipmentIdsLength: Array.isArray(firstShop.equipmentIds) ? firstShop.equipmentIds.length : 'not array',
          coffeeBeanIds: firstShop.coffeeBeanIds,
          coffeeBeanIdsType: Array.isArray(firstShop.coffeeBeanIds) ? 'array' : typeof firstShop.coffeeBeanIds,
          coffeeBeanIdsLength: Array.isArray(firstShop.coffeeBeanIds) ? firstShop.coffeeBeanIds.length : 'not array',
          roasterIds: firstShop.roasterIds,
          roasterIdsType: Array.isArray(firstShop.roasterIds) ? 'array' : typeof firstShop.roasterIds,
          roasterIdsLength: Array.isArray(firstShop.roasterIds) ? firstShop.roasterIds.length : 'not array',
          brewMethodIds: firstShop.brewMethodIds,
          brewMethodIdsType: Array.isArray(firstShop.brewMethodIds) ? 'array' : typeof firstShop.brewMethodIds,
          brewMethodIdsLength: Array.isArray(firstShop.brewMethodIds) ? firstShop.brewMethodIds.length : 'not array',
        });
        
        // Проверяем сопоставление ID после загрузки справочников
        // Это будет выполнено после того, как referenceDataLoaded станет true
        setTimeout(() => {
          if (referenceDataLoaded && firstShop.coffeeBeanIds && Array.isArray(firstShop.coffeeBeanIds) && firstShop.coffeeBeanIds.length > 0) {
            console.log('ID Matching Test (after reference data loaded):', {
              shopBeanIds: firstShop.coffeeBeanIds.slice(0, 3),
              availableBeanIds: coffeeBeans.slice(0, 10).map(b => b.id),
              matchingResults: firstShop.coffeeBeanIds.slice(0, 3).map(id => {
                const found = coffeeBeans.find(b => b.id === id);
                return { 
                  searchingId: id, 
                  idType: typeof id,
                  found: !!found, 
                  foundName: found?.name,
                  foundId: found?.id,
                  idMatch: found ? (found.id === id) : false
                };
              })
            });
          }
        }, 1000);
      }
      
      if (Array.isArray(shopsData)) {
        console.log('ModeratorPanel: Установлено кофеен:', shopsData.length);
        setShops(shopsData as ModerationShop[]);
      } else {
        console.warn('ModeratorPanel: shopsData не является массивом:', shopsData);
        setShops([]);
      }
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err));
      console.error('Error loading moderation shops:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (shopId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      setUpdatingShopId(shopId);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Не авторизован');
      }

      await updateModerationStatus(token, shopId, 'Approved');
      await loadShops();
      
      // Сбрасываем выбранную кофейню, если она была одобрена
      if (selectedShop?.id === shopId) {
        setSelectedShop(null);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при одобрении');
      console.error('Error approving shop:', err);
    } finally {
      setUpdatingShopId(null);
    }
  };

  const handleReject = async (shopId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      setUpdatingShopId(shopId);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Не авторизован');
      }

      await updateModerationStatus(token, shopId, 'Rejected');
      await loadShops();
      
      // Сбрасываем выбранную кофейню, если она была отклонена
      if (selectedShop?.id === shopId) {
        setSelectedShop(null);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при отклонении');
      console.error('Error rejecting shop:', err);
    } finally {
      setUpdatingShopId(null);
    }
  };

  const handleReturnToModeration = async (shopId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      setUpdatingShopId(shopId);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Не авторизован');
      }

      await updateModerationStatus(token, shopId, 'Pending');
      await loadShops();
    } catch (err: any) {
      setError(err.message || 'Ошибка при возврате в модерацию');
      console.error('Error returning shop to moderation:', err);
    } finally {
      setUpdatingShopId(null);
    }
  };

  const startEditing = (shop: ModerationShop) => {
    setEditingShop(shop);
    setEditForm({
      id: shop.id,
      name: shop.name,
      notValidatedAddress: shop.notValidatedAddress,
      description: shop.description,
      priceRange: shop.priceRange,
      cityId: shop.cityId,
      shopContact: shop.shopContact,
      schedules: shop.schedules,
      equipmentIds: shop.equipmentIds,
      coffeeBeanIds: shop.coffeeBeanIds,
      roasterIds: shop.roasterIds,
      brewMethodIds: shop.brewMethodIds,
      shopPhotos: shop.shopPhotos,
    });
    setViewMode('edit'); // Переключаемся в режим редактирования
  };

  const cancelEditing = () => {
    setEditingShop(null);
    setEditForm({});
    setViewMode('list'); // Возвращаемся к списку
  };

  const saveEditedShop = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Не авторизован');
      }

      // Prepare the update request object
      const updateRequest: UpdateModerationShopRequest = {
        id: editForm.id!,
        name: editForm.name,
        notValidatedAddress: editForm.notValidatedAddress,
        description: editForm.description,
        priceRange: editForm.priceRange,
        cityId: editForm.cityId,
        shopContact: editForm.shopContact,
        // Include other editable fields if they exist
        schedules: editForm.schedules,
        equipmentIds: editForm.equipmentIds,
        coffeeBeanIds: editForm.coffeeBeanIds,
        roasterIds: editForm.roasterIds,
        brewMethodIds: editForm.brewMethodIds,
        shopPhotos: editForm.shopPhotos,
      };

      await updateModerationShop(token, updateRequest);
      setEditingShop(null);
      setEditForm({});
      setViewMode('list'); // Возвращаемся к списку
      await loadShops(); // Reload the shops to get updated data
      setSelectedShop(null); // Reset selection to show updated data
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении изменений');
      console.error('Error saving edited shop:', err);
    }
  };

  const handleEditFormChange = (field: keyof ModerationShop, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedEditFormChange = (parentField: keyof ModerationShop, childField: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as object || {}),
        [childField]: value
      }
    }));
  };

  // Helper functions to get names by IDs
  const getCityNameById = (id: string) => {
    if (!referenceDataLoaded || !Array.isArray(cities)) return id;
    const city = cities.find(c => c.id === id);
    return city ? city.name : id;
  };
  
  const getEquipmentNamesByIds = (ids: string[]) => {
    if (!referenceDataLoaded || !Array.isArray(equipments) || !ids || !Array.isArray(ids)) {
      console.log('getEquipmentNamesByIds: conditions not met', { referenceDataLoaded, equipments: equipments?.length, ids });
      return [];
    }
    const names = ids.map(id => {
      const equipment = equipments.find(e => e.id === id);
      return equipment ? equipment.name : null;
    }).filter(name => name !== null) as string[];
    console.log('getEquipmentNamesByIds result:', { ids, names, equipmentsCount: equipments.length });
    return names;
  };
  
  const getCoffeeBeanNamesByIds = (ids: string[]): Array<{id: string, name: string | null}> => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
    // Если данные еще не загружены
    if (!referenceDataLoaded) {
      return ids.map(id => ({ id, name: null })); // Возвращаем ID с null для имени
    }
    // Если данные загружены, ищем имена
    if (!Array.isArray(coffeeBeans) || coffeeBeans.length === 0) {
      // Если справочник пуст, возвращаем ID
      return ids.map(id => ({ id, name: null }));
    }
    
    return ids.map(id => {
      // Ищем точное совпадение ID (строковое сравнение)
      const bean = coffeeBeans.find(b => b.id === id);
      return { id, name: bean ? bean.name : null };
    });
  };
  
  const getRoasterNamesByIds = (ids: string[]): Array<{id: string, name: string | null}> => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
    // Если данные еще не загружены
    if (!referenceDataLoaded) {
      return ids.map(id => ({ id, name: null }));
    }
    // Если данные загружены, ищем имена
    if (!Array.isArray(roasters) || roasters.length === 0) {
      return ids.map(id => ({ id, name: null }));
    }
    
    return ids.map(id => {
      // Ищем точное совпадение ID (строковое сравнение)
      const roaster = roasters.find(r => r.id === id);
      return { id, name: roaster ? roaster.name : null };
    });
  };
  
  const getBrewMethodNamesByIds = (ids: string[]): Array<{id: string, name: string | null}> => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
    // Если данные еще не загружены
    if (!referenceDataLoaded) {
      return ids.map(id => ({ id, name: null }));
    }
    // Если данные загружены, ищем имена
    if (!Array.isArray(brewMethods) || brewMethods.length === 0) {
      return ids.map(id => ({ id, name: null }));
    }
    
    return ids.map(id => {
      // Ищем точное совпадение ID (строковое сравнение)
      const method = brewMethods.find(m => m.id === id);
      return { id, name: method ? method.name : null };
    });
  };
  
  // Helper function to get status display text and styling
  const getStatusInfo = (status: string | number) => {
    const statusStr = String(status);
    switch(statusStr) {
      case 'Pending':
      case '0':
        return { text: 'На модерации', className: 'bg-yellow-500/20 text-yellow-400', value: 'Pending' };
      case 'Approved':
      case '1':
        return { text: 'Одобрено', className: 'bg-green-500/20 text-green-400', value: 'Approved' };
      case 'Rejected':
      case '2':
        return { text: 'Отклонено', className: 'bg-red-500/20 text-red-400', value: 'Rejected' };
      default:
        return { text: statusStr, className: 'bg-gray-500/20 text-gray-400', value: statusStr };
    }
  };

  // Filter shops by status
  const filteredShops = shops.filter(shop => {
    if (statusFilter === 'all') return true;
    const statusInfo = getStatusInfo(shop.moderationStatus);
    return statusInfo.value === statusFilter;
  });

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg.primary}`}>
        <div className="text-[#EAB308] text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg.primary} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${themeClasses.text.primary} mb-2`}>Панель модератора</h1>
          <p className={themeClasses.text.secondary}>Управление кофейнями на модерации</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Фильтр по статусу */}
        <div className={`mb-6 ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-3xl p-6`}>
          <div className="flex flex-wrap gap-3 items-center">
            <span className={`${themeClasses.text.secondary} text-sm font-medium`}>Фильтр по статусу:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-[#EAB308] text-[#1A1412] shadow-lg shadow-[#EAB308]/20'
                  : `${themeClasses.bg.input} ${themeClasses.text.secondary} ${theme === 'dark' ? 'hover:bg-[#3D2F28]' : 'hover:bg-gray-100'} border ${themeClasses.border.default}`
              }`}
            >
              Все ({shops.length})
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === 'Pending'
                  ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-400'
                  : `${themeClasses.bg.input} ${themeClasses.text.secondary} ${theme === 'dark' ? 'hover:bg-[#3D2F28]' : 'hover:bg-gray-100'} border ${themeClasses.border.default}`
              }`}
            >
              На модерации ({shops.filter(s => getStatusInfo(s.moderationStatus).value === 'Pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('Approved')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === 'Approved'
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-400'
                  : `${themeClasses.bg.input} ${themeClasses.text.secondary} ${theme === 'dark' ? 'hover:bg-[#3D2F28]' : 'hover:bg-gray-100'} border ${themeClasses.border.default}`
              }`}
            >
              Одобрено ({shops.filter(s => getStatusInfo(s.moderationStatus).value === 'Approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('Rejected')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === 'Rejected'
                  ? 'bg-red-500/20 text-red-400 border-2 border-red-400'
                  : `${themeClasses.bg.input} ${themeClasses.text.secondary} ${theme === 'dark' ? 'hover:bg-[#3D2F28]' : 'hover:bg-gray-100'} border ${themeClasses.border.default}`
              }`}
            >
              Отклонено ({shops.filter(s => getStatusInfo(s.moderationStatus).value === 'Rejected').length})
            </button>
          </div>
        </div>

        {viewMode === 'edit' && editingShop ? (
          // Режим редактирования - показываем только форму редактирования
          <div className="max-w-4xl mx-auto">
            <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                  Редактирование кофейни: {editingShop.name}
                </h2>
                <Button
                  variant="secondary"
                  onClick={cancelEditing}
                >
                  Назад к списку
                </Button>
              </div>
              
              {/* Форма редактирования */}
              <div className="space-y-4">
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Название</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} mt-1`}
                  />
                </div>
                
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Адрес</label>
                  <input
                    type="text"
                    value={editForm.notValidatedAddress || ''}
                    onChange={(e) => handleEditFormChange('notValidatedAddress', e.target.value)}
                    className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} mt-1`}
                  />
                </div>
                
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Описание</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} mt-1`}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Ценовой диапазон</label>
                  <select
                    value={editForm.priceRange || ''}
                    onChange={(e) => handleEditFormChange('priceRange', e.target.value)}
                    className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} mt-1`}
                  >
                    <option value="">Выберите диапазон</option>
                    <option value="Budget">Бюджетный</option>
                    <option value="Moderate">Средний</option>
                    <option value="Premium">Премиум</option>
                  </select>
                </div>
                
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Город</label>
                  <select
                    value={editForm.cityId || ''}
                    onChange={(e) => handleEditFormChange('cityId', e.target.value)}
                    className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} mt-1`}
                    disabled={!referenceDataLoaded}
                  >
                    <option value="">Выберите город</option>
                    {referenceDataLoaded && cities.map(city => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Контакты</label>
                  <div className="space-y-2 mt-1">
                    <input
                      type="text"
                      placeholder="Телефон"
                      value={editForm.shopContact?.phone || ''}
                      onChange={(e) => handleNestedEditFormChange('shopContact', 'phone', e.target.value)}
                      className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary}`}
                    />
                    <input
                      type="text"
                      placeholder="Email"
                      value={editForm.shopContact?.email || ''}
                      onChange={(e) => handleNestedEditFormChange('shopContact', 'email', e.target.value)}
                      className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary}`}
                    />
                    <input
                      type="text"
                      placeholder="Сайт"
                      value={editForm.shopContact?.website || ''}
                      onChange={(e) => handleNestedEditFormChange('shopContact', 'website', e.target.value)}
                      className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary}`}
                    />
                    <input
                      type="text"
                      placeholder="Instagram"
                      value={editForm.shopContact?.instagram || ''}
                      onChange={(e) => handleNestedEditFormChange('shopContact', 'instagram', e.target.value)}
                      className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary}`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Оборудование</label>
                  <select
                    multiple
                    value={editForm.equipmentIds || []}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                      handleEditFormChange('equipmentIds', selectedOptions);
                    }}
                    className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} mt-1 h-32`}
                    disabled={!referenceDataLoaded}
                  >
                    {referenceDataLoaded && equipments.map(equipment => (
                      <option key={equipment.id} value={equipment.id}>{equipment.name}</option>
                    ))}
                  </select>
                  <p className={`${themeClasses.text.secondary} text-xs mt-1`}>Удерживайте Ctrl для выбора нескольких значений</p>
                </div>
                
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Кофейные зёрна</label>
                  <select
                    multiple
                    value={editForm.coffeeBeanIds || []}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                      handleEditFormChange('coffeeBeanIds', selectedOptions);
                    }}
                    className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} mt-1 h-32`}
                    disabled={!referenceDataLoaded}
                  >
                    {referenceDataLoaded && coffeeBeans.map(bean => (
                      <option key={bean.id} value={bean.id}>{bean.name}</option>
                    ))}
                  </select>
                  <p className={`${themeClasses.text.secondary} text-xs mt-1`}>Удерживайте Ctrl для выбора нескольких значений</p>
                </div>
                
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Обжарщики</label>
                  <select
                    multiple
                    value={editForm.roasterIds || []}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                      handleEditFormChange('roasterIds', selectedOptions);
                    }}
                    className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} mt-1 h-32`}
                    disabled={!referenceDataLoaded}
                  >
                    {referenceDataLoaded && roasters.map(roaster => (
                      <option key={roaster.id} value={roaster.id}>{roaster.name}</option>
                    ))}
                  </select>
                  <p className={`${themeClasses.text.secondary} text-xs mt-1`}>Удерживайте Ctrl для выбора нескольких значений</p>
                </div>
                
                <div>
                  <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Методы заваривания</label>
                  <select
                    multiple
                    value={editForm.brewMethodIds || []}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                      handleEditFormChange('brewMethodIds', selectedOptions);
                    }}
                    className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} mt-1 h-32`}
                    disabled={!referenceDataLoaded}
                  >
                    {referenceDataLoaded && brewMethods.map(method => (
                      <option key={method.id} value={method.id}>{method.name}</option>
                    ))}
                  </select>
                  <p className={`${themeClasses.text.secondary} text-xs mt-1`}>Удерживайте Ctrl для выбора нескольких значений</p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={saveEditedShop}
                  >
                    Сохранить
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={cancelEditing}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Режим списка - показываем список кофеен
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Список кофеен */}
            <div className="lg:col-span-2 space-y-4">
              {!Array.isArray(filteredShops) || filteredShops.length === 0 ? (
                <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-8 text-center`}>
                  <p className={themeClasses.text.secondary}>
                    {shops.length === 0 ? 'Нет кофеен на модерации' : 'Нет кофеен с выбранным статусом'}
                  </p>
                </div>
              ) : (
                filteredShops.map((shop) => (
                  <div
                    key={shop.id}
                    className={`${themeClasses.bg.card} border rounded-2xl p-6 cursor-pointer transition-all ${
                      selectedShop?.id === shop.id
                        ? 'border-[#EAB308] shadow-lg shadow-[#EAB308]/10'
                        : `${themeClasses.border.default} hover:border-[#EAB308]/50`
                    }`}
                    onClick={() => setSelectedShop(shop)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className={`text-xl font-bold ${themeClasses.text.primary}`}>{shop.name}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(shop.moderationStatus).className}`}
                          >
                            {getStatusInfo(shop.moderationStatus).text}
                          </span>
                          {getStatusInfo(shop.moderationStatus).value === 'Pending' && (
                            <div className="flex gap-1.5 ml-auto flex-shrink-0">
                              <Button
                                variant="primary"
                                className="py-1.5 px-3 text-xs whitespace-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(shop);
                                }}
                              >
                                Редактировать
                              </Button>
                              <Button
                                variant="primary"
                                className="py-1.5 px-3 text-xs whitespace-nowrap"
                                disabled={updatingShopId === shop.id}
                                isLoading={updatingShopId === shop.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleApprove(shop.id, e);
                                }}
                              >
                                Одобрить
                              </Button>
                              <Button
                                variant="secondary"
                                className="py-1.5 px-3 text-xs whitespace-nowrap"
                                disabled={updatingShopId === shop.id}
                                isLoading={updatingShopId === shop.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleReject(shop.id, e);
                                }}
                              >
                                Отклонить
                              </Button>
                            </div>
                          )}
                          {getStatusInfo(shop.moderationStatus).value === 'Rejected' && (
                            <div className="flex gap-1.5 ml-auto flex-shrink-0">
                              <Button
                                variant="primary"
                                className="py-1.5 px-3 text-xs whitespace-nowrap"
                                disabled={updatingShopId === shop.id}
                                isLoading={updatingShopId === shop.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleReturnToModeration(shop.id, e);
                                }}
                              >
                                Вернуть в модерацию
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          {shop.notValidatedAddress && (
                            <p className={`${themeClasses.text.secondary} text-sm flex items-center gap-1`}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              {shop.notValidatedAddress}
                            </p>
                          )}
                          {shop.cityId && (
                            <p className={`${themeClasses.text.secondary} text-sm flex items-center gap-1`}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              {referenceDataLoaded ? getCityNameById(shop.cityId) : 'Загрузка...'}
                            </p>
                          )}
                          {shop.priceRange && (
                            <p className={`${themeClasses.text.secondary} text-sm`}>
                              {shop.priceRange === 'Budget' || String(shop.priceRange) === '0' ? '💰 Бюджетный' : 
                               shop.priceRange === 'Moderate' || String(shop.priceRange) === '1' ? '💰💰 Средний' : 
                               shop.priceRange === 'Premium' || String(shop.priceRange) === '2' ? '💰💰💰 Премиум' : 
                               ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {shop.description && (
                      <p className={`${themeClasses.text.secondary} text-sm mb-4 line-clamp-2`}>{shop.description}</p>
                    )}
                    
                    {/* Display relational data in the list view */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(shop.equipmentIds && shop.equipmentIds.length > 0) && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className={`${themeClasses.text.secondary} text-xs font-medium`}>Оборудование:</span>
                          {referenceDataLoaded ? (
                            getEquipmentNamesByIds(shop.equipmentIds || []).map((name, idx) => (
                              <span key={idx} className={`px-2 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-full text-xs`}>
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className={`${themeClasses.text.secondary} text-xs`}>Загрузка...</span>
                          )}
                        </div>
                      )}
                      {(shop.coffeeBeanIds && shop.coffeeBeanIds.length > 0) && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className={`${themeClasses.text.secondary} text-xs font-medium`}>Зёрна:</span>
                          {referenceDataLoaded ? (
                            getCoffeeBeanNamesByIds(shop.coffeeBeanIds || []).map((item, idx) => (
                              <span key={idx} className={`px-2 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-full text-xs`}>
                                {item.name || item.id}
                              </span>
                            ))
                          ) : (
                            <span className={`${themeClasses.text.secondary} text-xs`}>Загрузка...</span>
                          )}
                        </div>
                      )}
                      {(shop.roasterIds && shop.roasterIds.length > 0) && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className={`${themeClasses.text.secondary} text-xs font-medium`}>Обжарщики:</span>
                          {referenceDataLoaded ? (
                            getRoasterNamesByIds(shop.roasterIds || []).map((item, idx) => (
                              <span key={idx} className={`px-2 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-full text-xs`}>
                                {item.name || item.id}
                              </span>
                            ))
                          ) : (
                            <span className={`${themeClasses.text.secondary} text-xs`}>Загрузка...</span>
                          )}
                        </div>
                      )}
                      {(shop.brewMethodIds && shop.brewMethodIds.length > 0) && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className={`${themeClasses.text.secondary} text-xs font-medium`}>Методы:</span>
                          {referenceDataLoaded ? (
                            getBrewMethodNamesByIds(shop.brewMethodIds || []).map((item, idx) => (
                              <span key={idx} className={`px-2 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-full text-xs`}>
                                {item.name || item.id}
                              </span>
                            ))
                          ) : (
                            <span className={`${themeClasses.text.secondary} text-xs`}>Загрузка...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Детали выбранной кофейни */}
            {selectedShop && (
              <div className="lg:col-span-1">
                <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6 sticky top-6`}>
                  <h2 className={`text-2xl font-bold ${themeClasses.text.primary} mb-4`}>Детали</h2>
                  
                  <div className="space-y-4">
                    {/* Фотографии кофейни */}
                    {(() => {
                      // Получаем URL изображений из shopPhotos (новый формат - массив объектов с fullUrl)
                      const photos = selectedShop.shopPhotos && Array.isArray(selectedShop.shopPhotos) && selectedShop.shopPhotos.length > 0
                        ? selectedShop.shopPhotos.map((p: any) => {
                            // Если это объект с fullUrl (новый формат)
                            if (p && typeof p === 'object' && 'fullUrl' in p) {
                              return p.fullUrl;
                            }
                            // Если это уже строка (старый формат)
                            if (typeof p === 'string') {
                              return p;
                            }
                            // Иначе пытаемся преобразовать в строку
                            return p ? String(p) : '';
                          }).filter((url: string) => url && url.length > 0)
                        : [];
                      
                      return photos.length > 0 ? (
                        <div className="mb-4">
                          <label className={`${themeClasses.text.secondary} text-sm`}>Фотографии</label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {photos.map((photoUrl, index) => (
                              <div key={index} className={`aspect-square ${themeClasses.bg.input} rounded-xl overflow-hidden`}>
                                <img
                                  src={photoUrl}
                                  alt={`Фото кофейни ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                    <div>
                      <label className={`${themeClasses.text.secondary} text-sm`}>Название</label>
                      <p className={themeClasses.text.primary}>{selectedShop.name}</p>
                    </div>

                    {selectedShop.notValidatedAddress && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm`}>Адрес</label>
                        <p className={themeClasses.text.primary}>{selectedShop.notValidatedAddress}</p>
                      </div>
                    )}

                    {selectedShop.description && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm`}>Описание</label>
                        <p className={themeClasses.text.primary}>{selectedShop.description}</p>
                      </div>
                    )}

                    {selectedShop.priceRange && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm`}>Ценовой диапазон</label>
                        <p className={themeClasses.text.primary}>
                          {selectedShop.priceRange === 'Budget' || String(selectedShop.priceRange) === '0' ? '💰 Бюджетный' : 
                           selectedShop.priceRange === 'Moderate' || String(selectedShop.priceRange) === '1' ? '💰💰 Средний' : 
                           selectedShop.priceRange === 'Premium' || String(selectedShop.priceRange) === '2' ? '💰💰💰 Премиум' : 
                           ''}
                        </p>
                      </div>
                    )}

                    {selectedShop.cityId && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm`}>Город</label>
                        <p className={themeClasses.text.primary}>{referenceDataLoaded ? getCityNameById(selectedShop.cityId) : selectedShop.cityId}</p>
                      </div>
                    )}

                    {selectedShop.userId && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm`}>ID Пользователя</label>
                        <p className={`${themeClasses.text.tertiary} text-xs font-mono break-all`}>{selectedShop.userId}</p>
                      </div>
                    )}

                    {selectedShop.moderationStatus && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Статус модерации</label>
                        <span className={`inline-block px-3 py-1.5 rounded-xl text-sm font-medium ${getStatusInfo(selectedShop.moderationStatus).className}`}>
                          {getStatusInfo(selectedShop.moderationStatus).text}
                        </span>
                      </div>
                    )}

                    {selectedShop.shopContact && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm`}>Контакты</label>
                        <div className={`${themeClasses.text.primary} text-sm space-y-1`}>
                          {selectedShop.shopContact.phone && <p>📞 {selectedShop.shopContact.phone}</p>}
                          {selectedShop.shopContact.email && <p>✉️ {selectedShop.shopContact.email}</p>}
                          {selectedShop.shopContact.website && <p>🌐 {selectedShop.shopContact.website}</p>}
                          {selectedShop.shopContact.instagram && <p>📷 {selectedShop.shopContact.instagram}</p>}
                        </div>
                      </div>
                    )}

                    {selectedShop.equipmentIds && selectedShop.equipmentIds.length > 0 && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Оборудование</label>
                        <div className="flex flex-wrap gap-2">
                          {referenceDataLoaded ? (
                            getEquipmentNamesByIds(selectedShop.equipmentIds).map((name, idx) => (
                              <span key={idx} className={`px-3 py-1.5 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-xl text-sm`}>
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className={`${themeClasses.text.secondary} text-sm`}>Загрузка...</span>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedShop.coffeeBeanIds && selectedShop.coffeeBeanIds.length > 0 && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Кофейные зёрна</label>
                        <div className="flex flex-wrap gap-2">
                          {referenceDataLoaded ? (
                            getCoffeeBeanNamesByIds(selectedShop.coffeeBeanIds || []).map((item, idx) => (
                              <span key={idx} className={`px-3 py-1.5 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-xl text-sm`}>
                                {item.name || item.id}
                              </span>
                            ))
                          ) : (
                            <span className={`${themeClasses.text.secondary} text-sm`}>Загрузка...</span>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedShop.roasterIds && selectedShop.roasterIds.length > 0 && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Обжарщики</label>
                        <div className="flex flex-wrap gap-2">
                          {referenceDataLoaded ? (
                            getRoasterNamesByIds(selectedShop.roasterIds || []).map((item, idx) => (
                              <span key={idx} className={`px-3 py-1.5 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-xl text-sm`}>
                                {item.name || item.id}
                              </span>
                            ))
                          ) : (
                            <span className={`${themeClasses.text.secondary} text-sm`}>Загрузка...</span>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedShop.brewMethodIds && selectedShop.brewMethodIds.length > 0 && (
                      <div>
                        <label className={`${themeClasses.text.secondary} text-sm mb-2 block`}>Методы заваривания</label>
                        <div className="flex flex-wrap gap-2">
                          {referenceDataLoaded ? (
                            getBrewMethodNamesByIds(selectedShop.brewMethodIds || []).map((item, idx) => (
                              <span key={idx} className={`px-3 py-1.5 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-xl text-sm`}>
                                {item.name || item.id}
                              </span>
                            ))
                          ) : (
                            <span className={`${themeClasses.text.secondary} text-sm`}>Загрузка...</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons for non-editing mode */}
                    <div className={`pt-4 border-t ${themeClasses.border.default}`}>
                      {getStatusInfo(selectedShop.moderationStatus).value === 'Pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => handleApprove(selectedShop.id)}
                          >
                            Одобрить
                          </Button>
                          <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => handleReject(selectedShop.id)}
                          >
                            Отклонить
                          </Button>
                        </div>
                      )}
                      {getStatusInfo(selectedShop.moderationStatus).value === 'Rejected' && (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            className="flex-1"
                            disabled={updatingShopId === selectedShop.id}
                            isLoading={updatingShopId === selectedShop.id}
                            onClick={(e) => {
                              e.preventDefault();
                              handleReturnToModeration(selectedShop.id, e);
                            }}
                          >
                            Вернуть в модерацию
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorPanel;


