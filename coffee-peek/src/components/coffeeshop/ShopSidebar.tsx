import React from 'react';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { formatDayOfWeek } from '../../utils/shopUtils';

interface ShopSidebarProps {
  shop: DetailedCoffeeShop;
  textMain: string;
  textMuted: string;
  cardBg: string;
  borderColor: string;
  primary: string;
}

export const ShopSidebar: React.FC<ShopSidebarProps> = ({
  shop,
  textMain,
  textMuted,
  cardBg,
  borderColor,
  primary,
}) => {
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;

  return (
    <div className={`${cardBg} rounded-3xl border ${borderColor} overflow-hidden shadow-sm`}>
      <div className="p-8">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#F5EFE6] flex items-center justify-center shrink-0">
            <span className={`material-symbols-outlined text-[${primary}]`}>pin_drop</span>
          </div>
          <div>
            <h3 className={`font-bold ${textMain} mb-1`}>{shop.location?.address || shop.address || 'Адрес не указан'}</h3>
            {(shop.location?.latitude && shop.location?.longitude) && (
              <p className={`${textMuted} text-sm`}>
                {shop.location.latitude.toFixed(6)}, {shop.location.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {shop.schedules && shop.schedules.length > 0 && (
          <div className={`space-y-4 pt-6 border-t ${borderColor}`}>
            <div className={`flex items-center gap-4 ${textMain} font-bold`}>
              <div className="w-12 h-12 rounded-2xl bg-[#F5EFE6] flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined text-[${primary}]`}>schedule</span>
              </div>
              <span>Часы работы</span>
            </div>
            <div className="space-y-3 ml-16 text-sm">
              {shop.schedules.map((schedule) => {
                const isToday = schedule.dayOfWeek === currentDay;
                
                return (
                  <div 
                    key={schedule.dayOfWeek} 
                    className={`flex justify-between ${isToday ? 'font-bold text-[#B48C4B]' : textMuted}`}
                  >
                    <span>{isToday ? 'Сегодня' : formatDayOfWeek(schedule.dayOfWeek)}</span>
                    <span>{schedule.openTime} - {schedule.closeTime}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

