import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import LogoMark from '../LogoMark';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  moderatorOnly?: boolean;
  ownerOnly?: boolean;
  browseOnly?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  collapsible?: boolean;
  items: NavItem[];
}

const iconClass = 'w-[18px] h-[18px] shrink-0';

const IconDashboard = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 10.75 12 3.5l8.25 7.25M5.75 9v10.25h12.5V9M9.25 19.25v-5.5h5.5v5.5" />
  </svg>
);
const IconShop = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10.5v8.75h16V10.5M3.5 5.25h17l-1.25 5a2.5 2.5 0 0 1-3.75 1.45A2.5 2.5 0 0 1 12 12a2.5 2.5 0 0 1-3.5-.3 2.5 2.5 0 0 1-3.75-1.45l-1.25-5Z" />
  </svg>
);
const IconReview = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 17.5 3.75 20l3.5-.8A8.75 8.75 0 1 0 5 17.5Z" />
    <path strokeLinecap="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01" />
  </svg>
);
const IconFlag = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5.5 21V4m0 1h12l-2 4 2 4h-12" />
  </svg>
);
const IconUsers = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.5 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20m6.25-9.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm7-5.75a3 3 0 0 1 0 5.75M17 14.5a4 4 0 0 1 4 4V20" />
  </svg>
);
const IconCache = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6.5C4 4.57 7.58 3 12 3s8 1.57 8 3.5S16.42 10 12 10 4 8.43 4 6.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6.5v5c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5v-5M4 11.5v5c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5v-5" />
  </svg>
);
const IconMobile = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="6.5" y="2.5" width="11" height="19" rx="2" strokeWidth={1.8} />
    <path strokeLinecap="round" strokeWidth={1.8} d="M10 18.5h4" />
  </svg>
);
const IconAudit = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 5.5H5.5v15h13v-15H16M9 3.5h6v4H9v-4Zm-.5 10 2 2 4.5-5" />
  </svg>
);
const IconTags = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3.5H5.5a2 2 0 0 0-2 2V12l8.5 8.5 8.5-8.5L12 3.5Z" />
    <path strokeLinecap="round" strokeWidth={1.8} d="M8 8h.01" />
  </svg>
);
const IconCatalog = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.5 5.75A2.25 2.25 0 0 1 5.75 3.5H10a2 2 0 0 1 2 2V20a3 3 0 0 0-3-3H5.75a2.25 2.25 0 0 1-2.25-2.25v-9Zm17 0a2.25 2.25 0 0 0-2.25-2.25H14a2 2 0 0 0-2 2V20a3 3 0 0 1 3-3h3.25a2.25 2.25 0 0 0 2.25-2.25v-9Z" />
  </svg>
);
const IconMap = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m3.5 6 5.5-2.5 6 3 5.5-2.5v14L15 20.5l-6-3L3.5 20V6ZM9 3.5v14M15 6.5v14" />
  </svg>
);
const IconRoaster = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 9.5h13v3.25A6.25 6.25 0 0 1 11.75 19h-.5A6.25 6.25 0 0 1 5 12.75V9.5Zm13 1h1a2.5 2.5 0 0 1 0 5h-2.5M8 6.5c0-1 1-1 1-2s-1-1-1-2m4 4c0-1 1-1 1-2s-1-1-1-2" />
  </svg>
);
const IconImport = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5h14M5 9h14M5 13h9M5 17h7" />
  </svg>
);
const IconChevron = ({ open = false }: { open?: boolean }) => (
  <svg
    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
  </svg>
);
const IconLogout = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 5H5v14h5m5-4 4-3-4-3m4 3H9" />
  </svg>
);
const IconPerson = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
  </svg>
);

const DASHBOARD: NavItem = { path: '/dashboard', label: 'Дашборд', icon: <IconDashboard /> };

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'browse',
    label: 'Обзор',
    items: [
      { path: '/coffee-shops', label: 'Кофейни', icon: <IconShop />, browseOnly: true },
      { path: '/map', label: 'Карта', icon: <IconMap />, browseOnly: true },
    ],
  },
  {
    id: 'moderation',
    label: 'Модерация',
    collapsible: true,
    items: [
      { path: '/shop-change-requests', label: 'Правки кофеен', icon: <IconReview />, moderatorOnly: true },
      { path: '/shops', label: 'Заявки на кофейни', icon: <IconShop />, moderatorOnly: true },
      { path: '/reviews', label: 'Отзывы на проверке', icon: <IconReview />, moderatorOnly: true },
      { path: '/shop-reports', label: 'Жалобы на данные', icon: <IconFlag />, moderatorOnly: true },
      { path: '/roasters', label: 'Заявки на обжарщиков', icon: <IconRoaster />, moderatorOnly: true },
    ],
  },
  {
    id: 'data',
    label: 'Данные и каталог',
    collapsible: true,
    items: [
      { path: '/published-shops', label: 'Все кофейни', icon: <IconShop />, adminOnly: true },
      { path: '/import', label: 'Импорт данных', icon: <IconImport />, moderatorOnly: true },
      { path: '/coffee-zones', label: 'Кофейные зоны', icon: <IconMap />, moderatorOnly: true },
      { path: '/catalogs', label: 'Справочники', icon: <IconCatalog />, adminOnly: true },
      { path: '/shop-tags', label: 'Теги кофеен', icon: <IconTags />, adminOnly: true },
      { path: '/my-shops', label: 'Мои кофейни', icon: <IconShop />, ownerOnly: true },
    ],
  },
  {
    id: 'system',
    label: 'Система',
    items: [
      { path: '/audit', label: 'Audit log', icon: <IconAudit />, adminOnly: true },
      { path: '/users', label: 'Пользователи', icon: <IconUsers />, adminOnly: true },
      { path: '/app-distribution', label: 'Приложения', icon: <IconMobile />, adminOnly: true },
      { path: '/cache', label: 'Кеши', icon: <IconCache />, adminOnly: true },
    ],
  },
];

function canSee(item: NavItem, roles: { isAdmin: boolean; isModerator: boolean; isOwner: boolean }) {
  if (item.adminOnly) return roles.isAdmin;
  if (item.moderatorOnly) return roles.isModerator;
  if (item.ownerOnly) return roles.isOwner;
  if (item.browseOnly) return !roles.isAdmin && !roles.isModerator;
  return true;
}

function pathActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function roleLabel(roles: string[]) {
  if (roles.includes('Admin')) return 'Администратор';
  if (roles.includes('Moderator')) return 'Модератор';
  if (roles.includes('Owner')) return 'Владелец';
  return roles[0] ?? 'Пользователь';
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, mobileOpen, onNavigate, onToggle }) => {
  const { user, isAdmin, isModerator, isOwner, logout } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    moderation: true,
    data: true,
  });

  const roles = useMemo(
    () => ({ isAdmin, isModerator, isOwner }),
    [isAdmin, isModerator, isOwner],
  );
  const showLabels = !collapsed || mobileOpen;
  const visibleSections = useMemo(
    () => NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => canSee(item, roles)),
    })).filter((section) => section.items.length > 0),
    [roles],
  );

  useEffect(() => {
    for (const section of visibleSections) {
      if (section.items.some((item) => pathActive(pathname, item.path))) {
        setOpenSections((current) => ({ ...current, [section.id]: true }));
      }
    }
  }, [pathname, visibleSections]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  const renderLink = (item: NavItem, prominent = false) => (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={onNavigate}
      title={!showLabels ? item.label : undefined}
      className={({ isActive }) => {
        const active = isActive || pathActive(pathname, item.path);
        return [
          'group/nav relative flex min-h-[38px] items-center rounded-[9px] text-[12px] font-medium leading-[1.25] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c51d]/70',
          showLabels ? 'gap-2.5 px-2.5' : 'mx-auto w-10 justify-center',
          active
            ? 'bg-gradient-to-r from-[#6b4a0f] to-[#49340f] text-[#ffd21f] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
            : 'text-[#e7dfda] hover:bg-white/[0.055] hover:text-white',
          prominent && showLabels ? 'min-h-[42px] px-3 font-semibold' : '',
        ].join(' ');
      }}
    >
      {({ isActive }) => {
        const active = isActive || pathActive(pathname, item.path);
        return (
          <>
            {active && <span className="absolute -left-0.5 top-1/2 h-[70%] w-[3px] -translate-y-1/2 rounded-r-full bg-[#ffd21f]" />}
            <span
              className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] transition-colors',
                active ? 'bg-[#eab308]/20 text-[#ffd21f]' : 'bg-white/[0.035] text-[#d8d0ca] group-hover/nav:bg-white/[0.07]',
              ].join(' ')}
            >
              {item.icon}
            </span>
            {showLabels && <span className="min-w-0 flex-1">{item.label}</span>}
          </>
        );
      }}
    </NavLink>
  );

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-50 flex h-full w-[min(248px,88vw)] shrink-0 flex-col border-r border-white/[0.045] bg-[#1d1714] pt-[env(safe-area-inset-top)] text-white shadow-[14px_0_36px_rgba(32,20,13,0.16)] transition-transform duration-300 ease-out',
        'lg:static lg:z-auto lg:translate-x-0 lg:transition-[width]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        collapsed ? 'lg:w-[72px]' : 'lg:w-[248px]',
      ].join(' ')}
    >
      <div className={`flex min-h-[72px] items-center ${showLabels ? 'gap-3 px-[18px]' : 'justify-center px-3'}`}>
        <LogoMark size={38} variant="dark" className="rounded-full ring-1 ring-white/10" />
        {showLabels && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[14px] font-semibold leading-5 text-white">Admin Panel</p>
            <p className="truncate text-[10px] leading-3 text-[#998d87]">CoffeePeek</p>
          </div>
        )}
        {showLabels && (
          <button
            type="button"
            onClick={onToggle}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.045] text-[#b7aca6] transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c51d]/70 lg:flex"
            aria-label="Свернуть меню"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m14 7-5 5 5 5" />
            </svg>
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto overscroll-contain pb-3 ${showLabels ? 'px-3' : 'px-2'}`} aria-label="Основная навигация">
        <div className="mb-3">{renderLink(DASHBOARD, true)}</div>

        {visibleSections.map((section) => {
          const open = !section.collapsible || Boolean(openSections[section.id]) || !showLabels;
          return (
            <section key={section.id} className={showLabels ? 'border-t border-white/[0.055] py-3' : 'border-t border-white/[0.055] py-2.5'}>
              {showLabels && (
                section.collapsible ? (
                  <button
                    type="button"
                    className="mb-2 flex w-full items-center justify-between px-2 text-[9px] font-semibold uppercase tracking-[0.11em] text-[#897d77] transition-colors hover:text-[#c9bdb6]"
                    aria-expanded={open}
                    onClick={() => setOpenSections((current) => ({ ...current, [section.id]: !open }))}
                  >
                    <span>{section.label}</span>
                    <IconChevron open={open} />
                  </button>
                ) : (
                  <h2 className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.11em] text-[#897d77]">
                    {section.label}
                  </h2>
                )
              )}

              {open && (
                <div className={showLabels ? 'rounded-[10px] bg-white/[0.025] p-1' : 'space-y-1'}>
                  {section.items.map((item) => renderLink(item))}
                </div>
              )}
            </section>
          );
        })}
      </nav>

      <div className={`shrink-0 border-t border-white/[0.055] ${showLabels ? 'p-3' : 'p-2.5'} pb-[max(0.75rem,env(safe-area-inset-bottom))]`}>
        {user && (
          <div className={`flex items-center rounded-[10px] border border-white/[0.055] bg-white/[0.045] ${showLabels ? 'gap-2.5 p-2' : 'justify-center p-1.5'}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#8d8179] to-[#5e554f] text-[#eee8e4] ring-1 ring-white/10">
              <IconPerson />
            </span>
            {showLabels && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-medium leading-4 text-[#f3efec]">{user.email}</p>
                <p className="truncate text-[9px] leading-3 text-[#978b84]">{roleLabel(user.roles)}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Выйти"
              aria-label={loggingOut ? 'Выход из системы' : 'Выйти'}
              className={`${showLabels ? 'flex' : 'hidden'} h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#9f938d] transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:cursor-wait disabled:opacity-50`}
            >
              <IconLogout />
            </button>
          </div>
        )}
        {!showLabels && (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Выйти"
            aria-label={loggingOut ? 'Выход из системы' : 'Выйти'}
            className="mx-auto mt-2 flex h-9 w-9 items-center justify-center rounded-lg text-[#8f837d] transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:cursor-wait disabled:opacity-50"
          >
            <IconLogout />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
