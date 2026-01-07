import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getCoffeeShopsByMapBounds, getCoffeeShopById, MapShop, DetailedCoffeeShop } from '../api/coffeeshop';
import { getErrorMessage } from '../utils/errorHandler';

declare global {
  interface Window {
    ymaps: any;
  }
}

const MapPage: React.FC = () => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shops, setShops] = useState<MapShop[]>([]);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);
  const [selectedShop, setSelectedShop] = useState<MapShop | null>(null);
  const [selectedShopDetails, setSelectedShopDetails] = useState<DetailedCoffeeShop | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    // Проверяем, загружена ли библиотека Яндекс.Карт
    if (window.ymaps) {
      initMap();
      return;
    }

    // Загружаем скрипт Яндекс.Карт (Enterprise версия)
    const apiKey = (import.meta.env as any).VITE_YANDEX_MAP_API_KEY || '';
    const version = '2.1'; // Версия API
    const lang = 'ru_RU'; // Язык интерфейса
    const script = document.createElement('script');
    script.src = `https://enterprise.api-maps.yandex.ru/${version}/?${apiKey ? `apikey=${apiKey}&` : ''}lang=${lang}`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => {
        initMap();
      });
    };
    script.onerror = () => {
      setError('Не удалось загрузить Яндекс.Карты');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Очистка при размонтировании
      if (mapInstance) {
        mapInstance.destroy();
      }
    };
  }, []);

  // Загружаем кофейни по границам видимой области карты
  const loadCoffeeShops = async (bounds?: number[][]) => {
    try {
      let minLat: number | undefined;
      let minLon: number | undefined;
      let maxLat: number | undefined;
      let maxLon: number | undefined;

      if (bounds && bounds.length >= 2) {
        // В Яндекс.Картах bounds возвращает [широта, долгота]
        // bounds[0] - левый нижний угол [широта, долгота]
        // bounds[1] - правый верхний угол [широта, долгота]
        minLat = Math.min(bounds[0][0], bounds[1][0]);
        minLon = Math.min(bounds[0][1], bounds[1][1]);
        maxLat = Math.max(bounds[0][0], bounds[1][0]);
        maxLon = Math.max(bounds[0][1], bounds[1][1]);
        
        console.log('Загрузка кофеен для границ:', { minLat, minLon, maxLat, maxLon });
      }

      const response = await getCoffeeShopsByMapBounds(minLat, minLon, maxLat, maxLon);
      console.log('Ответ API кофеен:', response);
      
      // API возвращает { data: { shops: MapShop[] } }
      let shopsList: MapShop[] = [];
      
      if (response.data && response.data.shops && Array.isArray(response.data.shops)) {
        shopsList = response.data.shops.map((shop: any) => ({
          id: shop.id,
          latitude: Number(shop.latitude),
          longitude: Number(shop.longitude),
          title: shop.title || shop.name || 'Кофейня',
        }));
      }
      
      console.log('Загружено кофеен:', shopsList.length, shopsList);
      setShops(shopsList);
      return shopsList;
    } catch (err: any) {
      console.error('Ошибка при загрузке кофеен:', err);
      setError('Ошибка при загрузке кофеен: ' + getErrorMessage(err));
      return [];
    }
  };

  // Загружаем детальную информацию о кофейне
  const loadShopDetails = async (shopId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await getCoffeeShopById(shopId);
      if (response.success && response.data) {
        setSelectedShopDetails(response.data);
      }
    } catch (err: any) {
      console.error('Ошибка при загрузке деталей кофейни:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Добавляем маркеры кофеен на карту
  const addCoffeeShopMarkers = (map: any, ymaps: any, shopsList: MapShop[] = shops) => {
    console.log('Добавление маркеров для кофеен:', shopsList.length);
    
    // Удаляем старые маркеры
    markersRef.current.forEach(marker => {
      map.geoObjects.remove(marker);
    });
    markersRef.current = [];

    if (!shopsList || shopsList.length === 0) {
      console.log('Нет кофеен для отображения');
      return;
    }

    shopsList.forEach((shop: MapShop) => {
      const coordinates = [shop.latitude, shop.longitude];
      
      if (!coordinates || coordinates.length !== 2 || !coordinates[0] || !coordinates[1]) {
        console.warn('Кофейня без координат:', shop.title, shop);
        return;
      }
      
      const isSelected = selectedShop?.id === shop.id;
      const circleColor = isSelected ? '#1A1412' : '#FFFFFF';
      const iconColor = isSelected ? '#FFFFFF' : '#1A1412';
      const borderColor = isSelected ? '#EAB308' : '#EAB308';
      const borderWidth = isSelected ? 3 : 2;

      // Создаем кастомную иконку
      const iconContent = `
        <div style="
          width: 40px;
          height: 50px;
          background: linear-gradient(135deg, #EAB308 0%, #FACC15 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            transform: rotate(45deg);
            font-size: 20px;
            color: #1A1412;
          ">☕</div>
        </div>
      `;

      const marker = new ymaps.Placemark(
        coordinates,
        {
          hintContent: shop.title,
        },
        {
          iconLayout: 'default#imageWithContent',
          iconImageHref: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" fill="${circleColor}" stroke="${borderColor}" stroke-width="${borderWidth}"/>
              <g transform="translate(12, 12) scale(0.045)">
                <path fill="${iconColor}" d="M378.596,374.959c1.729-2.724,3.363-5.429,4.953-8.222c13.649,12.403,31.767,20.005,51.619,20.005c42.366,0,76.832-34.45,76.832-76.815c0-42.366-34.508-76.824-76.874-76.824c-8.883,0-17.481,1.541-25.394,4.326v-39.62c0-9.364-7.508-17.354-16.872-17.354H48.544c-9.364,0-17.49,7.988-17.49,17.354v69.826c0,38.118,11.063,75.14,31.488,107.324c9.008,14.194,19.96,27.051,32.045,38.355H16.956C7.592,413.314,0,420.905,0,430.27s7.592,16.956,16.956,16.956h30.942c4.867,32.781,32.579,56.519,65.933,56.519h213.642c33.353,0,61.065-23.738,65.933-56.519h31.043c9.364,0,16.956-7.592,16.956-16.956s-7.592-16.956-16.956-16.956h-77.631C358.902,402.01,369.588,389.153,378.596,374.959z M409.653,275.455c7.137-5.295,15.966-8.432,25.515-8.432c23.667-0.001,42.921,19.254,42.921,42.921c0,23.667-19.254,42.921-42.921,42.921c-15.248,0-28.655-7.999-36.271-20.015C405.239,314.417,408.89,295.105,409.653,275.455z M358.666,447.225c-4.258,13.565-16.629,22.608-31.194,22.608H113.831c-14.565,0-26.935-9.043-31.194-22.608H358.666z M289.631,413.314H151.773c-52.73-28.26-86.808-84.98-86.808-145.679v-53.268H375.82v53.268C375.82,328.334,342.361,385.054,289.631,413.314z"/>
                <path fill="${iconColor}" d="M169.907,122.299l-8.316-6.683c-3.207-2.577-5.014-6.414-4.958-10.527c0.055-4.113,1.966-7.9,5.242-10.389c11.481-8.727,18.268-21.999,18.62-36.417s-5.78-28.005-16.822-37.281c-7.17-6.023-17.866-5.092-23.889,2.078c-6.023,7.17-5.092,17.866,2.078,23.89c4.254,3.572,4.791,8.104,4.733,10.488c-0.059,2.383-0.817,6.883-5.239,10.245c-11.642,8.848-18.433,22.308-18.63,36.93c-0.198,14.621,6.226,28.261,17.625,37.42l8.316,6.683c3.132,2.516,6.883,3.739,10.611,3.739c4.961,0,9.878-2.167,13.228-6.335C178.369,138.838,177.207,128.166,169.907,122.299z"/>
                <path fill="${iconColor}" d="M240.322,131.073l-9.754-7.838c-4.468-3.591-6.987-8.938-6.909-14.67c0.077-5.732,2.74-11.009,7.303-14.478c12.753-9.692,20.292-24.435,20.681-40.448c0.39-16.013-6.419-31.107-18.684-41.409c-7.17-6.024-17.867-5.094-23.888,2.077c-6.024,7.17-5.094,17.866,2.076,23.888c4.329,3.636,6.734,8.964,6.595,14.616c-0.138,5.652-2.799,10.856-7.3,14.277c-12.93,9.826-20.474,24.777-20.693,41.018c-0.22,16.24,6.915,31.39,19.575,41.563l9.754,7.838c3.132,2.517,6.883,3.739,10.611,3.739c4.961,0,9.878-2.167,13.228-6.335C248.782,147.611,247.62,136.939,240.322,131.073z"/>
                <path fill="${iconColor}" d="M308.086,122.299l-8.316-6.683c-3.207-2.577-5.014-6.414-4.958-10.527c0.055-4.113,1.966-7.9,5.242-10.389c11.481-8.727,18.268-21.999,18.62-36.417c0.352-14.418-5.78-28.005-16.822-37.281c-7.171-6.023-17.867-5.092-23.889,2.078c-6.023,7.17-5.092,17.866,2.078,23.89c4.254,3.572,4.791,8.104,4.733,10.488c-0.06,2.383-0.817,6.883-5.239,10.245c-11.642,8.848-18.433,22.308-18.63,36.93c-0.198,14.621,6.226,28.261,17.625,37.42l8.316,6.683c3.132,2.516,6.883,3.739,10.611,3.739c4.961,0,9.878-2.167,13.228-6.335C316.548,138.838,315.386,128.166,308.086,122.299z"/>
              </g>
            </svg>
          `),
          iconImageSize: [48, 48],
          iconImageOffset: [-24, -24],
          shopData: shop,
        }
      );

      // Обработчик клика на маркер
      marker.events.add('click', () => {
        setSelectedShop(shop);
        loadShopDetails(shop.id);
        // Обновляем все маркеры для обновления визуального состояния
        setTimeout(() => {
          addCoffeeShopMarkers(map, ymaps, shopsList);
        }, 100);
      });

      try {
        map.geoObjects.add(marker);
        markersRef.current.push(marker);
      } catch (err: any) {
        console.error('Ошибка при добавлении маркера для', shop.title, ':', err);
      }
    });
    
    console.log('Всего маркеров добавлено:', markersRef.current.length);
  };

  const initMap = () => {
    if (!mapRef.current || !window.ymaps) return;

    try {
      window.ymaps.ready(() => {
        const map = new window.ymaps.Map(mapRef.current, {
          center: [53.9, 27.5667], // Минск по умолчанию
          zoom: 12,
          controls: [
            'zoomControl',
            'fullscreenControl',
            'geolocationControl',
          ],
          behaviors: ['default', 'scrollZoom'],
        });

        // Устанавливаем тему карты в зависимости от темы приложения
        if (theme === 'dark') {
          map.options.set('theme', 'dark');
        }

        // Кастомизация элементов управления (как на скриншоте - справа вверху)
        map.controls.get('zoomControl').options.set({
          size: 'small',
          position: { right: 10, top: 10 },
        });

        map.controls.get('geolocationControl').options.set({
          position: { right: 10, top: 60 },
        });

        setMapInstance(map);
        setIsLoading(false);

        // Функция для загрузки кофеен при изменении границ карты
        let updateTimeout: NodeJS.Timeout;
        const updateCoffeeShops = () => {
          // Дебаунс для избежания слишком частых запросов
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            try {
              const bounds = map.getBounds();
              console.log('Границы карты:', bounds);
              
              if (bounds && Array.isArray(bounds) && bounds.length >= 2) {
                // В Яндекс.Картах bounds[0] - левый нижний угол [широта, долгота]
                // bounds[1] - правый верхний угол [широта, долгота]
                const boundsArray = [
                  [bounds[0][0], bounds[0][1]], // левый нижний угол [lat, lon]
                  [bounds[1][0], bounds[1][1]]  // правый верхний угол [lat, lon]
                ];
                console.log('Обработанные границы:', boundsArray);
                
                loadCoffeeShops(boundsArray).then((loadedShops) => {
                  console.log('Загруженные кофейни для отображения:', loadedShops?.length);
                  if (loadedShops && loadedShops.length > 0) {
                    addCoffeeShopMarkers(map, window.ymaps, loadedShops);
                  } else {
                    console.log('Нет кофеен для отображения в текущей области');
                  }
                });
              } else {
                console.warn('Не удалось получить границы карты:', bounds);
              }
            } catch (err: any) {
              console.error('Ошибка при обновлении кофеен:', err);
            }
          }, 300); // Задержка 300мс для дебаунса
        };

        // Загружаем кофейни при первой загрузке
        setTimeout(() => {
          updateCoffeeShops();
        }, 500); // Небольшая задержка для полной инициализации карты

        // Обновляем кофейни при изменении границ карты (движение, зум)
        map.events.add('boundschange', () => {
          updateCoffeeShops();
        });
      });
    } catch (err: any) {
      setError('Ошибка при инициализации карты: ' + getErrorMessage(err));
      setIsLoading(false);
    }
  };

  // Обновляем маркеры при изменении списка кофеен (резервный механизм)
  useEffect(() => {
    if (mapInstance && shops.length > 0 && window.ymaps) {
      console.log('Обновление маркеров через useEffect, кофеен:', shops.length);
      addCoffeeShopMarkers(mapInstance, window.ymaps, shops);
    }
  }, [shops, mapInstance]);


  // Форматируем часы работы
  const formatWorkingHours = (schedules?: Array<{ dayOfWeek: number; openTime?: string; closeTime?: string }>) => {
    if (!schedules || schedules.length === 0) return 'Часы работы не указаны';
    
    const today = new Date().getDay(); // 0 = воскресенье, 1 = понедельник и т.д.
    const todaySchedule = schedules.find(s => s.dayOfWeek === today);
    
    if (todaySchedule && todaySchedule.openTime && todaySchedule.closeTime) {
      return `${todaySchedule.openTime} - ${todaySchedule.closeTime}`;
    }
    return 'Часы работы не указаны';
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg.primary} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className={`text-4xl font-bold ${themeClasses.text.primary} mb-2`}>Карта кофеен</h1>
          <p className={themeClasses.text.secondary}>Найдите кофейни на карте</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Карта в виде плитки */}
        <div className={`relative ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl overflow-hidden`} style={{ height: '600px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-[#EAB308] text-xl">Загрузка карты...</div>
            </div>
          )}
          <div
            ref={mapRef}
            style={{ width: '100%', height: '100%', minHeight: '600px' }}
            className={isLoading ? 'hidden' : ''}
          />

          {/* Кнопка "Поиск в этой области" внизу по центру */}
          <button
            onClick={() => {
              if (mapInstance) {
                const bounds = mapInstance.getBounds();
                if (bounds) {
                  const boundsArray = [
                    [bounds[0][0], bounds[0][1]],
                    [bounds[1][0], bounds[1][1]]
                  ];
                  loadCoffeeShops(boundsArray).then((loadedShops) => {
                    if (loadedShops && loadedShops.length > 0) {
                      addCoffeeShopMarkers(mapInstance, window.ymaps, loadedShops);
                    }
                  });
                }
              }
            }}
            className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 px-6 py-3 ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-full shadow-lg hover:bg-opacity-90 transition-all`}
          >
            <span className={`${themeClasses.text.primary} font-medium`}>Поиск в этой области</span>
          </button>

          {/* Карточка деталей кофейни внизу (как на скриншоте) */}
          {selectedShop && (
            <div className={`absolute bottom-4 left-4 right-4 z-20 ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl shadow-2xl transform transition-transform duration-300 max-w-md mx-auto`}>
            {isLoadingDetails ? (
              <div className="p-4 flex items-center justify-center">
                <div className="text-[#EAB308]">Загрузка...</div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex gap-4">
                  {/* Изображение слева */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                    {(() => {
                      // Получаем URL изображений из photos (новый формат) или imageUrls (старый формат)
                      const imageUrls = selectedShopDetails?.photos && Array.isArray(selectedShopDetails.photos) && selectedShopDetails.photos.length > 0
                        ? selectedShopDetails.photos.map((p: any) => p.fullUrl || p)
                        : selectedShopDetails?.imageUrls && selectedShopDetails.imageUrls.length > 0
                          ? selectedShopDetails.imageUrls
                          : [];
                      
                      const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : null;
                      
                      return firstImageUrl ? (
                        <img
                          src={firstImageUrl}
                          alt={selectedShop.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.warn('Ошибка загрузки изображения кофейни:', firstImageUrl);
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-3xl">☕</span></div>';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-3xl">☕</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Информация справа */}
                  <div className="flex-1 min-w-0">
                    {/* Рейтинг и отзывы */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className={`${themeClasses.text.secondary} text-sm`}>
                        {selectedShopDetails?.reviewCount ? `${selectedShopDetails.reviewCount} отзывов` : 'Нет отзывов'}
                      </span>
                    </div>

                    {/* Название */}
                    <h3 className={`${themeClasses.text.primary} font-bold text-lg mb-1 truncate`}>
                      {selectedShop.title}
                    </h3>

                    {/* Часы работы */}
                    <p className={`${themeClasses.text.secondary} text-sm`}>
                      {formatWorkingHours(selectedShopDetails?.schedules)}
                    </p>
                  </div>

                  {/* Иконка закладки справа вверху */}
                  <button
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
                    onClick={() => {
                      // TODO: Добавить функционал закладок
                      console.log('Добавить в закладки:', selectedShop.id);
                    }}
                  >
                    <svg
                      className={`w-6 h-6 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;

