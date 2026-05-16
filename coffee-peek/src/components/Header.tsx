import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { Icons } from '../constants';
import { COLORS } from '../constants/colors';

const PUBLIC_NAV = [
  { id: 'coffeeshops', label: 'Кофейни', route: '/shops',               match: (p: string) => p.startsWith('/shops')   },
  { id: 'map',         label: 'Карта',   route: '/dashboard?page=map',  match: (p: string) => p.includes('map')        },
  { id: 'jobs',        label: 'Работа',  route: '/dashboard?page=jobs', match: (p: string) => p.includes('jobs')       },
] as const;

const ADMIN_NAV = [
  { id: 'moderation', label: 'Модерация',    route: '/dashboard?page=moderation', match: (p: string) => p.includes('moderation') },
  { id: 'admin',      label: 'Админ панель', route: '/dashboard?page=admin',      match: (p: string) => p.includes('admin')      },
] as const;

const Header: React.FC = () => {
  const { theme } = useTheme();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isDark = theme === 'dark';
  const gold = COLORS.primary;
  const goldWarm = '#D4A84B';

  const allNav = [
    ...PUBLIC_NAV,
    ...(user?.isAdmin ? ADMIN_NAV : []),
  ];

  const currentPath = location.pathname + location.search;
  const currentId = allNav.find(n => n.match(currentPath))?.id ?? '';
  const isSettings = currentPath.startsWith('/settings');

  const bg = isDark ? 'rgba(45,36,31,0.88)' : 'rgba(255,255,255,0.88)';
  const borderColor = isDark ? '#3D2F28' : '#E7E5E4';
  const textColor = isDark ? '#fff' : '#1C1917';
  const mutedColor = isDark ? '#A39E93' : '#78716C';
  const surfaceBg = isDark ? '#2D241F' : '#fff';
  const hoverBg = isDark ? 'rgba(61,47,40,0.5)' : '#F5F4F2';

  const initial = (user?.email?.[0] ?? '?').toUpperCase();
  const displayEmail = user?.email ?? '';
  const displayName = user?.email?.split('@')[0] ?? '';

  const navBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 12px', borderRadius: 8,
    border: active ? `1px solid ${gold}` : '1px solid transparent',
    background: active ? (isDark ? '#1A1412' : '#fff') : 'transparent',
    color: active ? gold : mutedColor,
    fontFamily: '"Noto Sans",system-ui', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', transition: 'all .15s',
  });

  return (
    <header style={{ background: bg, borderBottom: `1px solid ${borderColor}`, position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', height: 64 }}>

          {/* Left: logo */}
          <div>
            <button onClick={() => navigate('/shops')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: 40, height: 40, background: isDark ? '#1A1412' : '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${borderColor}` }}>
                <div style={{ color: gold, width: 20, height: 20 }}><Icons.Coffee /></div>
              </div>
              <span style={{ fontFamily: '"RF Dewi Expanded","Sora",system-ui', fontWeight: 800, fontSize: 20, letterSpacing: '-0.045em', color: textColor }}>
                Coffee<span style={{ color: gold }}>Peek</span>
              </span>
            </button>
          </div>

          {/* Center: desktop nav */}
          <nav className="hidden lg:flex" style={{ gap: 4 }}>
            {allNav.map(({ id, label, route }) => (
              <button key={id} onClick={() => navigate(route)} style={navBtn(currentId === id)}>
                {label}
              </button>
            ))}
          </nav>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>

            {user ? (
              /* ── Profile dropdown ── */
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 10px 5px 5px', borderRadius: 99,
                    border: `1px solid ${profileOpen ? gold : borderColor}`,
                    background: profileOpen ? `${gold}12` : (isDark ? 'rgba(255,255,255,0.04)' : '#fff'),
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{ width: 30, height: 30, borderRadius: 99, background: `${gold}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 800, fontSize: 13, color: goldWarm }}>{initial}</span>
                  </div>
                  <span className="hidden lg:block" style={{ fontFamily: '"Noto Sans",system-ui', fontWeight: 600, fontSize: 13, color: textColor, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: mutedColor, lineHeight: 1, transition: 'transform .2s', transform: profileOpen ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: surfaceBg, border: `1px solid ${borderColor}`, borderRadius: 16, boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.14)', zIndex: 30, minWidth: 224, overflow: 'hidden' }}>

                      {/* User info header */}
                      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${borderColor}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 99, background: `${gold}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 800, fontSize: 16, color: goldWarm }}>{initial}</span>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 14, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                            <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontSize: 11, color: mutedColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayEmail}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu */}
                      <div style={{ padding: '6px 0' }}>
                        {user.id && (
                          <DropdownItem icon="person" label="Мой профиль" hoverBg={hoverBg} textColor={textColor} mutedColor={mutedColor}
                            onClick={() => { navigate(`/users/${user.id}`); setProfileOpen(false); }} />
                        )}
                        <DropdownItem icon="settings" label="Настройки" hoverBg={hoverBg}
                          textColor={isSettings ? gold : textColor}
                          mutedColor={isSettings ? gold : mutedColor}
                          activeBg={isSettings ? `${gold}10` : undefined}
                          onClick={() => { navigate('/settings'); setProfileOpen(false); }} />
                      </div>

                      <div style={{ borderTop: `1px solid ${borderColor}`, padding: '6px 0' }}>
                        <DropdownItem icon="logout" label="Выйти" hoverBg="rgba(239,68,68,0.07)"
                          textColor="#EF4444" mutedColor="#EF4444"
                          onClick={() => { logout(); navigate('/'); setProfileOpen(false); }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ── Login / Register ── */
              <div className="hidden lg:flex" style={{ gap: 8, alignItems: 'center' }}>
                <button onClick={() => navigate('/login')}
                  style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}>
                  Войти
                </button>
                <button onClick={() => navigate('/register')}
                  style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${gold}`, background: gold, color: '#1A1412', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}>
                  Регистрация
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(o => !o)}
                style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', color: mutedColor, cursor: 'pointer' }}
                aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav"
              >
                {isMobileMenuOpen ? <Icons.Close className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {isMobileMenuOpen && (
          <div id="mobile-nav" style={{ padding: '12px 0 16px', borderTop: `1px solid ${borderColor}` }}>
            {/* Nav items */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allNav.map(({ id, label, route }) => (
                <button key={id} onClick={() => { navigate(route); setIsMobileMenuOpen(false); }} style={navBtn(currentId === id)}>
                  {label}
                </button>
              ))}
            </div>

            {/* Auth actions */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${borderColor}`, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {user ? (
                <>
                  {user.id && (
                    <button onClick={() => { navigate(`/users/${user.id}`); setIsMobileMenuOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 16, lineHeight: 1 }}>person</span>
                      Профиль
                    </button>
                  )}
                  <button onClick={() => { navigate('/settings'); setIsMobileMenuOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: `1px solid ${isSettings ? gold : borderColor}`, background: isSettings ? `${gold}12` : 'transparent', color: isSettings ? gold : textColor, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, lineHeight: 1 }}>settings</span>
                    Настройки
                  </button>
                  <button onClick={() => { logout(); navigate('/'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#EF4444', fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, lineHeight: 1 }}>logout</span>
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                    style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    Войти
                  </button>
                  <button onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}
                    style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${gold}`, background: gold, color: '#1A1412', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Регистрация
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

interface DropdownItemProps {
  icon: string;
  label: string;
  onClick: () => void;
  textColor: string;
  mutedColor: string;
  hoverBg: string;
  activeBg?: string;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ icon, label, onClick, textColor, mutedColor, hoverBg, activeBg }) => (
  <button
    onClick={onClick}
    style={{ width: '100%', padding: '9px 16px', textAlign: 'left', background: activeBg ?? 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: '"Noto Sans"', fontSize: 14, color: textColor, transition: 'background .1s' }}
    onMouseEnter={e => !activeBg && (e.currentTarget.style.background = hoverBg)}
    onMouseLeave={e => !activeBg && (e.currentTarget.style.background = 'none')}
  >
    <span className="material-symbols-rounded" style={{ fontSize: 18, color: mutedColor, lineHeight: 1 }}>{icon}</span>
    {label}
  </button>
);

export default Header;
