import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, getThemeColors } from '../constants/colors';
import { usePageTitle } from '../hooks/usePageTitle';
import { useCheckIns } from '../hooks/queries/useCheckIns';
import WobbleRing from '../components/WobbleRing';
import { AppIcon } from '../components/icons';
import Mascot from '../components/Mascot';
import { getErrorMessage } from '../utils/errorHandler';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAGE_SIZE = 10;

const CheckInsPage: React.FC = () => {
  usePageTitle('Мои посещения');
  const navigate = useNavigate();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const gold = COLORS.primary;

  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useCheckIns(page, PAGE_SIZE);

  const items = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);

  return (
    <div style={{ minHeight: '100%', background: colors.background }}>
      <div style={{
        borderBottom: `1px solid ${colors.border}`,
        background: isDark ? 'rgba(45,36,31,0.7)' : colors.surface,
        backdropFilter: 'blur(12px)',
      }}>
        <div
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Назад"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, padding: 0, flexShrink: 0,
              border: 'none', borderRadius: 8, background: 'transparent',
              color: colors.textPrimary, cursor: 'pointer',
            }}
          >
            <AppIcon name="arrow_back" size={20} color="currentColor" />
          </button>
          <h1 style={{
            margin: 0, fontFamily: '"RF Dewi Expanded"', fontWeight: 700,
            fontSize: 18, color: colors.textPrimary, letterSpacing: '-0.01em',
          }}>
            Мои посещения
          </h1>
          {totalItems > 0 && (
            <span style={{
              fontFamily: '"Noto Sans"', fontSize: 13, color: colors.textSecondary,
            }}>
              {totalItems}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <WobbleRing size={48} />
          </div>
        ) : error ? (
          <div style={{
            padding: 24, borderRadius: 16, border: `1px solid ${colors.border}`,
            background: colors.surface, textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 16px', fontFamily: '"Noto Sans"', fontSize: 14, color: '#EF4444' }}>
              {getErrorMessage(error)}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                padding: '10px 18px', borderRadius: 12, border: 'none', background: gold,
                color: '#1A1412', fontFamily: '"Noto Sans"', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Повторить
            </button>
          </div>
        ) : items.length === 0 ? (
          <div style={{
            padding: '48px 24px', borderRadius: 20, border: `1px solid ${colors.border}`,
            background: colors.surface, textAlign: 'center',
          }}>
            <div style={{ margin: '0 auto 8px', display: 'flex', justifyContent: 'center' }} aria-hidden>
              <Mascot pose="happy" size={128} />
            </div>
            <h2 style={{
              margin: '0 0 8px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700,
              fontSize: 18, color: colors.textPrimary,
            }}>
              Пока нет посещений
            </h2>
            <p style={{ margin: '0 0 20px', fontFamily: '"Noto Sans"', fontSize: 14, color: colors.textSecondary }}>
              Отметьте визит на странице кофейни — он появится здесь.
            </p>
            <button
              type="button"
              onClick={() => navigate('/shops')}
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none', background: gold,
                color: '#1A1412', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Открыть каталог
            </button>
          </div>
        ) : (
          <>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12, opacity: isFetching ? 0.7 : 1, transition: 'opacity .2s' }}>
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    padding: '16px 18px', borderRadius: 16, border: `1px solid ${colors.border}`,
                    background: colors.surface,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/shops/${item.shopId}`)}
                      style={{
                        flex: 1, textAlign: 'left', border: 'none', background: 'transparent',
                        padding: 0, cursor: 'pointer',
                      }}
                    >
                      <p style={{
                        margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700,
                        fontSize: 16, color: colors.textPrimary,
                      }}>
                        {item.shopName || 'Кофейня'}
                      </p>
                      <p style={{
                        margin: '6px 0 0', fontFamily: '"Noto Sans"', fontSize: 13, color: colors.textSecondary,
                      }}>
                        {formatDate(item.createdAt)}
                      </p>
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      {item.reviewId ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/shops/${item.shopId}/reviews/${item.reviewId}/edit`)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', borderRadius: 8,
                            border: `1px solid ${isDark ? '#3D2F28' : '#E7E5E4'}`,
                            background: 'transparent', color: gold,
                            fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          <AppIcon name="rate_review" size={14} color="currentColor" />
                          Отзыв
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {item.note ? (
                    <p style={{
                      margin: '12px 0 0', paddingTop: 12, borderTop: `1px solid ${colors.border}`,
                      fontFamily: '"Noto Sans"', fontSize: 14, color: colors.textPrimary, lineHeight: 1.5,
                    }}>
                      {item.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{
                      padding: '10px 18px', borderRadius: 12,
                      border: `1px solid ${colors.border}`,
                      background: page <= 1 ? colors.border : colors.surface,
                      color: page <= 1 ? `${colors.textSecondary}80` : colors.textPrimary,
                      fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14,
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ← Назад
                  </button>
                  <span style={{ fontFamily: '"Noto Sans"', fontSize: 14, color: colors.textSecondary }}>
                    Страница <span style={{ fontWeight: 700, color: gold }}>{page}</span> из {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    style={{
                      padding: '10px 18px', borderRadius: 12,
                      border: `1px solid ${colors.border}`,
                      background: page >= totalPages ? colors.border : colors.surface,
                      color: page >= totalPages ? `${colors.textSecondary}80` : colors.textPrimary,
                      fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14,
                      cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Вперёд →
                  </button>
                </div>
                <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontSize: 13, color: colors.textSecondary }}>
                  Показано {items.length} из {totalItems}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CheckInsPage;
