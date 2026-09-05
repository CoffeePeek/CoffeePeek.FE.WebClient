import React, { useEffect, useState, type ChangeEvent } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { brand, getThemeColors } from '../design-system/tokens';
import Mascot, { type MascotPose } from './Mascot';
import { StarIcon } from './icons';
import { Camera, Check, MapPin, X } from './Icon';
import WobbleRing from './WobbleRing';
import { CHECK_IN_LIMITS, todayInputValue } from '../utils/checkInForm';

interface RatingColumn {
  key: 'coffee' | 'service' | 'place';
  label: string;
  pose: MascotPose;
  value: number;
  onChange: (value: number) => void;
}

interface CheckInFormProps {
  shopName: string;
  header: string;
  onHeaderChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  isPublic: boolean;
  onPublicChange: (value: boolean) => void;
  visitedDate: string;
  onVisitedDateChange: (value: string) => void;
  ratingCoffee: number;
  ratingService: number;
  ratingPlace: number;
  onRatingCoffee: (value: number) => void;
  onRatingService: (value: number) => void;
  onRatingPlace: (value: number) => void;
  selectedFiles: File[];
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  uploadingPhotos?: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const StarRow: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label: string;
  emptyColor: string;
}> = ({ value, onChange, label, emptyColor }) => (
  <div className="flex items-center justify-center gap-0.5" role="radiogroup" aria-label={label}>
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = star <= value;
      return (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={filled && star === value}
          aria-label={`${star} из 5`}
          onClick={() => onChange(star)}
          className="p-0.5 rounded-sm hover:scale-110 transition-transform"
        >
          <StarIcon
            filled={filled}
            size={14}
            color={filled ? brand.primary : emptyColor}
          />
        </button>
      );
    })}
  </div>
);

const PhotoThumb: React.FC<{ file: File; onRemove: () => void }> = ({ file, onRemove }) => {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden">
      {src && <img src={src} alt="" className="w-full h-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Удалить фото"
        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
      >
        <X size={10} weight="bold" />
      </button>
    </div>
  );
};

const CheckInForm: React.FC<CheckInFormProps> = ({
  shopName,
  header,
  onHeaderChange,
  note,
  onNoteChange,
  isPublic,
  onPublicChange,
  visitedDate,
  onVisitedDateChange,
  ratingCoffee,
  ratingService,
  ratingPlace,
  onRatingCoffee,
  onRatingService,
  onRatingPlace,
  selectedFiles,
  onFileSelect,
  onRemoveFile,
  uploadingPhotos,
  isSubmitting,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const gold = brand.primary;
  const isDark = theme === 'dark';
  const emptyStar = isDark ? '#5C544F' : '#D6D3D1';
  const cardShadow = isDark ? 'none' : '0 4px 16px rgba(28, 25, 23, 0.08)';
  const fieldBorder = `1px solid ${colors.border}`;

  const columns: RatingColumn[] = [
    { key: 'coffee', label: 'Кофе', pose: 'cup', value: ratingCoffee, onChange: onRatingCoffee },
    { key: 'service', label: 'Сервис', pose: 'dessert', value: ratingService, onChange: onRatingService },
    { key: 'place', label: 'Атмосф.', pose: 'dance', value: ratingPlace, onChange: onRatingPlace },
  ];

  return (
    <fieldset disabled={isSubmitting} className="flex flex-col gap-5 border-0 p-0 m-0 min-w-0">
      <header className="space-y-1.5">
        <h2
          className="font-extended font-bold text-[28px] leading-none tracking-tight"
          style={{ color: colors.textPrimary }}
        >
          Чекин
        </h2>
        <p className="flex items-center gap-1.5 min-w-0">
          <MapPin size={16} weight="fill" color={gold} className="shrink-0" />
          <span
            className="font-extended font-semibold text-[13px] uppercase tracking-[0.04em] truncate"
            style={{ color: gold }}
          >
            {shopName}
          </span>
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {columns.map((col) => (
          <div
            key={col.key}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-1.5 pt-3 pb-2.5"
            style={{ backgroundColor: isDark ? colors.surface : '#FFFFFF', boxShadow: cardShadow }}
          >
            <Mascot pose={col.pose} size={72} eager />
            <span
              className="font-extended font-semibold text-[12px]"
              style={{ color: colors.textPrimary }}
            >
              {col.label}
            </span>
            <StarRow value={col.value} onChange={col.onChange} label={col.label} emptyColor={emptyStar} />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="checkin-date"
          className="block font-body text-[13px]"
          style={{ color: colors.textSecondary }}
        >
          Дата чекина
        </label>
        <input
            id="checkin-date"
            type="date"
            max={todayInputValue()}
            value={visitedDate}
            onChange={(e) => onVisitedDateChange(e.target.value)}
            className="w-full rounded-2xl py-3 px-4 font-body text-sm outline-none"
            style={{
              backgroundColor: isDark ? colors.input : '#FFFFFF',
              color: colors.textPrimary,
              border: fieldBorder,
              colorScheme: theme,
            }}
          />
      </div>

      <div className="space-y-1.5">
        <p className="font-body text-[13px]" style={{ color: colors.textSecondary }}>
          Фото (необязательно)
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <label
            htmlFor="checkin-photos"
            className="w-16 h-16 shrink-0 rounded-xl border border-dashed flex items-center justify-center cursor-pointer"
            style={{ borderColor: colors.border, backgroundColor: isDark ? colors.surface : '#FFFFFF', color: colors.textSecondary }}
            aria-label="Добавить фото"
          >
            <Camera size={22} />
          </label>
          <input
            id="checkin-photos"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFileSelect}
          />
          {selectedFiles.map((file, index) => (
            <PhotoThumb key={`${file.name}-${file.size}-${index}`} file={file} onRemove={() => onRemoveFile(index)} />
          ))}
        </div>
        {uploadingPhotos && (
          <div className="flex items-center gap-2 py-1" style={{ color: colors.textSecondary }}>
            <WobbleRing size={16} />
            <span className="text-xs font-body">Загрузка фотографий...</span>
          </div>
        )}
      </div>

      {isPublic && (
        <div className="space-y-1.5">
          <label htmlFor="checkin-header" className="block font-body text-[13px]" style={{ color: colors.textSecondary }}>
            Заголовок отзыва (обязательно)
          </label>
          <input
            id="checkin-header"
            value={header}
            onChange={(e) => onHeaderChange(e.target.value)}
            required
            minLength={CHECK_IN_LIMITS.headerMin}
            maxLength={CHECK_IN_LIMITS.headerMax}
            placeholder="Коротко о впечатлении"
            className="w-full rounded-2xl px-4 py-3 font-body text-sm outline-none"
            style={{ backgroundColor: isDark ? colors.input : '#FFFFFF', color: colors.textPrimary, border: fieldBorder }}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="checkin-note"
          className="block font-body text-[13px]"
          style={{ color: colors.textSecondary }}
        >
          {isPublic ? 'Описание отзыва (обязательно)' : 'Заметка (необязательно)'}
        </label>
        <textarea
          id="checkin-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Расскажите о вашем визите..."
          required={isPublic}
          minLength={isPublic ? CHECK_IN_LIMITS.noteMin : undefined}
          maxLength={CHECK_IN_LIMITS.noteMax}
          aria-describedby={isPublic ? 'checkin-note-hint' : undefined}
          rows={3}
          className="w-full rounded-2xl px-4 py-3 font-body text-sm resize-none outline-none placeholder:opacity-50"
          style={{
            backgroundColor: isDark ? colors.input : '#FFFFFF',
            color: colors.textPrimary,
            border: fieldBorder,
          }}
        />
        {isPublic && (
          <p id="checkin-note-hint" className="font-body text-xs" style={{ color: colors.textSecondary }}>
            От 10 до 500 символов
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-extended font-bold text-[15px]" style={{ color: colors.textPrimary }}>
            Сделать публичным
          </p>
          <p className="font-body text-[12px] mt-0.5" style={{ color: colors.textSecondary }}>
            Ваш чекин станет отзывом
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="Сделать чекин публичным"
          aria-checked={isPublic}
          onClick={() => onPublicChange(!isPublic)}
          className="inline-flex h-7 w-12 shrink-0 items-center rounded-full border-0 p-[2px] appearance-none"
          style={{ backgroundColor: isPublic ? gold : isDark ? '#5C544F' : '#D6D3D1' }}
        >
          <span
            className="block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out"
            style={{ transform: isPublic ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full rounded-[18px] py-3.5 font-extended font-bold text-[16px] flex items-center justify-center gap-2 text-[#1A1412] transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ backgroundColor: gold }}
      >
        {isSubmitting ? (
          <>
            <WobbleRing size={18} color="#1A1412" />
            Создание...
          </>
        ) : (
          <>
            Чекин
            <Check size={18} weight="bold" />
          </>
        )}
      </button>
    </fieldset>
  );
};

export default CheckInForm;
