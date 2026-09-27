import React from 'react';
import { AdminShopSchedule } from '../../api/admin';
import {
  getDeviceTimezoneLabel,
  localTimeToUtc,
  normalizeTime24,
} from '../../utils/dayOfWeek';
import { DAY_NAMES } from '../../utils/shopForm';

interface ScheduleEditorProps {
  value: AdminShopSchedule[];
  onChange: (schedules: AdminShopSchedule[]) => void;
}

function ensureWeek(value: AdminShopSchedule[]): AdminShopSchedule[] {
  const byDay = new Map(value.map((item) => [item.dayOfWeek, item]));
  return Array.from({ length: 7 }, (_, dayOfWeek) =>
    byDay.get(dayOfWeek) ?? {
      dayOfWeek,
      isClosed: true,
      openTime: '08:00',
      closeTime: '22:00',
    }
  );
}

function utcPreview(dayOfWeek: number, time: string): { dayOfWeek: number; time: string } | null {
  const normalized = normalizeTime24(time);
  return normalized ? localTimeToUtc(dayOfWeek, normalized) : null;
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ value, onChange }) => {
  const schedules = ensureWeek(value);
  const timezoneLabel = getDeviceTimezoneLabel();

  const updateDay = (dayOfWeek: number, patch: Partial<AdminShopSchedule>) => {
    onChange(
      schedules.map((schedule) =>
        schedule.dayOfWeek === dayOfWeek ? { ...schedule, ...patch } : schedule
      )
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-col gap-1 text-xs text-text-muted dark:text-stone-400 font-body">
        <span>Локальное время: {timezoneLabel}</span>
        <span>UTC — значение, которое будет сохранено в базе.</span>
      </div>
      <div className="space-y-2">
        {schedules.map((schedule) => {
          const openUtc = utcPreview(schedule.dayOfWeek, schedule.openTime);
          const closeUtc = utcPreview(schedule.dayOfWeek, schedule.closeTime);
          return (
            <div
              key={schedule.dayOfWeek}
              className="grid grid-cols-1 sm:grid-cols-[130px_100px_minmax(230px,1fr)_minmax(190px,0.8fr)] gap-2 sm:gap-3 items-center rounded-lg bg-gray-50 dark:bg-white/5 px-3 py-2.5"
            >
              <p className="text-sm font-medium text-text-main dark:text-white font-body">
                {DAY_NAMES[schedule.dayOfWeek]}
              </p>
              <label className="flex items-center gap-2 text-xs text-text-muted dark:text-stone-400 font-body">
                <input
                  type="checkbox"
                  checked={schedule.isClosed ?? false}
                  onChange={(e) =>
                    updateDay(schedule.dayOfWeek, {
                      isClosed: e.target.checked,
                      // Reopening a day that had no hours: start from a sensible template instead of empty fields.
                      ...(!e.target.checked && !schedule.openTime ? { openTime: '08:00' } : {}),
                      ...(!e.target.checked && !schedule.closeTime ? { closeTime: '22:00' } : {}),
                    })
                  }
                  className="rounded border-border-light dark:border-border-dark"
                />
                Выходной
              </label>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <TimeInput
                  label={`Открытие, ${DAY_NAMES[schedule.dayOfWeek]}`}
                  value={schedule.openTime}
                  disabled={schedule.isClosed}
                  onChange={(openTime) => updateDay(schedule.dayOfWeek, { openTime, isClosed: false })}
                />
                <span className="text-text-muted dark:text-stone-500" aria-hidden="true">—</span>
                <TimeInput
                  label={`Закрытие, ${DAY_NAMES[schedule.dayOfWeek]}`}
                  value={schedule.closeTime}
                  disabled={schedule.isClosed}
                  onChange={(closeTime) => updateDay(schedule.dayOfWeek, { closeTime, isClosed: false })}
                />
              </div>
              <div className="text-xs font-body">
                {schedule.isClosed ? (
                  <span className="text-text-muted dark:text-stone-500">UTC: выходной</span>
                ) : openUtc && closeUtc ? (
                  <span className="text-text-main dark:text-stone-200">
                    UTC в базе: {DAY_NAMES[openUtc.dayOfWeek]}, {openUtc.time} — {closeUtc.time}
                  </span>
                ) : (
                  <span className="text-red-500 dark:text-red-400">
                    Введите время как HH:mm — иначе сохранение будет заблокировано
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimeInput: React.FC<{
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}> = ({ label, value, disabled, onChange }) => (
  <input
    type="text"
    inputMode="numeric"
    aria-label={label}
    pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
    placeholder="HH:mm"
    maxLength={5}
    value={value}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    onBlur={(event) => {
      const normalized = normalizeTime24(event.target.value);
      if (normalized && normalized !== event.target.value) onChange(normalized);
    }}
    className="w-full min-w-0 border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1A1412] text-text-main dark:text-white disabled:opacity-50 font-mono tabular-nums"
  />
);

export function getDefaultSchedules(): AdminShopSchedule[] {
  return [
    { dayOfWeek: 0, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00' },
    { dayOfWeek: 5, openTime: '10:00', closeTime: '22:00' },
    { dayOfWeek: 6, openTime: '10:00', closeTime: '22:00' },
  ];
}
