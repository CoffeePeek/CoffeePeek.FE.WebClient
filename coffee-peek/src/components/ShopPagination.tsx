import React from 'react';
import { COLORS } from '../constants/colors';

interface ShopPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  shopsCount: number;
  colors: { surface: string; border: string; textPrimary: string; textSecondary: string; background: string };
  onPrev: () => void;
  onNext: () => void;
}

const btnBase = 'px-6 py-3 rounded-xl font-semibold transition-all shadow-sm border';

const ShopPagination: React.FC<ShopPaginationProps> = ({
  currentPage, totalPages, totalItems, shopsCount, colors, onPrev, onNext,
}) => (
  <div className="mt-12 flex flex-col items-center">
    <div className="flex items-center gap-3">
      <button
        onClick={onPrev}
        disabled={currentPage === 1}
        className={btnBase}
        style={
          currentPage === 1
            ? { backgroundColor: colors.border, color: `${colors.textSecondary}80`, cursor: 'not-allowed', borderColor: colors.border }
            : { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }
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
        Страница{' '}
        <span className="font-bold" style={{ color: COLORS.primary }}>{currentPage}</span>
        {' '}из {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className={btnBase}
        style={
          currentPage === totalPages
            ? { backgroundColor: colors.border, color: `${colors.textSecondary}80`, cursor: 'not-allowed', borderColor: colors.border }
            : { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }
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
      Показано{' '}
      <span className="font-semibold" style={{ color: colors.textPrimary }}>{shopsCount}</span>
      {' '}из{' '}
      <span className="font-semibold" style={{ color: colors.textPrimary }}>{totalItems}</span>
      {' '}кофеен
    </p>
  </div>
);

export default ShopPagination;
