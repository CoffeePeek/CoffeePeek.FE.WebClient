import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../constants/colors';
import { StarIcon } from './icons';
import {
  Compass,
  ChatCircleText,
  Heart,
  MagnifyingGlass,
} from '@/components/Icon';
import type { IconProps } from '@phosphor-icons/react';

type CategoryId = 'find' | 'rate' | 'save';

interface Category {
  id: CategoryId;
  title: string;
  chrome: string;
  desc: string;
  more: string;
  Icon: React.ComponentType<IconProps>;
}

const CATEGORIES: Category[] = [
  {
    id: 'find',
    title: 'Найти',
    chrome: 'Карта',
    desc: 'Живые точки на карте и фильтры по методу — выбираешь чашку, а не список вслепую.',
    more: 'Сразу видно, что рядом: рейтинг, открыто ли сейчас, V60 или эспрессо за стойкой. Без простыни фильтров на весь экран.',
    Icon: Compass,
  },
  {
    id: 'rate',
    title: 'Оценить',
    chrome: 'Чек-ин',
    desc: 'Отметь визит, опиши вкус и поставь оценку — рейтинг растёт из реальных чашек.',
    more: 'Чек-ин фиксирует, что ты был. Отзыв — что почувствовал. Звёзды складываются в оценку места, а не в рекламу.',
    Icon: ChatCircleText,
  },
  {
    id: 'save',
    title: 'Сохранить',
    chrome: 'Лента',
    desc: 'Чужие эмоции в комментариях и сердце на карточке — свои места всегда под рукой.',
    more: 'Комментарии — это чужие чашки: «кисло», «десертно», «вернусь». Избранное живёт на устройстве, без прокрутки всего города.',
    Icon: Heart,
  },
];

const CYCLE_MS = 8500;
const GOLD = '#EAB308';
const GOLD_WARM = '#D4A84B';
const REVIEW_TEXT = 'Эспрессо чистый, молочко сладкое. Вернусь за воронкой.';

const ChevronIcon: React.FC<{ dir: 'left' | 'right' }> = ({ dir }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="block shrink-0 overflow-visible">
    <path
      d={dir === 'left' ? 'M11.25 3.75 5.75 9l5.5 5.25' : 'M6.75 3.75 12.25 9l-5.5 5.25'}
      stroke={GOLD}
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return reduce;
}

const Hint: React.FC<{
  text: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  placement?: 'top' | 'bottom';
}> = ({ text, children, className, style, placement = 'top' }) => (
  <span className={`group/hint relative inline-flex ${className ?? ''}`} style={style}>
    {children}
    <span
      role="tooltip"
      className={`pointer-events-none absolute z-30 left-1/2 -translate-x-1/2 w-max max-w-[220px] rounded-lg px-2.5 py-1.5 font-body text-[11px] leading-snug opacity-0 group-hover/hint:opacity-100 transition-all duration-150 text-left ${
        placement === 'top'
          ? 'bottom-[calc(100%+8px)] translate-y-1 group-hover/hint:translate-y-0'
          : 'top-[calc(100%+8px)] -translate-y-1 group-hover/hint:translate-y-0'
      }`}
      style={{
        background: '#1A1412',
        color: '#F5F0E8',
        border: `1px solid ${GOLD}59`,
        boxShadow: '0 10px 28px rgba(0,0,0,0.4)',
      }}
    >
      {text}
    </span>
  </span>
);

function Typewriter({
  text,
  reduceMotion,
  startDelay,
  color,
}: {
  text: string;
  reduceMotion: boolean;
  startDelay: number;
  color: string;
}) {
  const [n, setN] = useState(reduceMotion ? text.length : 0);

  useEffect(() => {
    if (reduceMotion) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    let tick: number | undefined;
    const start = window.setTimeout(() => {
      tick = window.setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length && tick) window.clearInterval(tick);
      }, 26);
    }, startDelay);
    return () => {
      window.clearTimeout(start);
      if (tick) window.clearInterval(tick);
    };
  }, [text, reduceMotion, startDelay]);

  return (
    <span style={{ color }}>
      {text.slice(0, n)}
      {!reduceMotion && n < text.length && (
        <span className="inline-block w-[1px] h-[0.9em] ml-0.5 align-[-1px] bg-current" style={{ animation: 'lp-caret 0.8s step-end infinite' }} />
      )}
    </span>
  );
}

const MAP_SCALE = 1.72;

const MAP_PINS = [
  { id: 'atlas', x: 48, y: 51, name: 'Atlas Espresso', note: 'Центр · открыто', rating: '4.8', delay: '0.15s' },
  { id: 'dobra', x: 61, y: 38, name: 'Dobra Pour Over', note: 'Рядом с парком', rating: '4.6', delay: '0.4s' },
  { id: 'kava', x: 36, y: 58, name: 'Kava Lab', note: 'Эспрессо-бар', rating: '4.7', delay: '0.65s' },
];

const SceneFind: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => {
  const [active, setActive] = useState(0);
  const [tapKey, setTapKey] = useState(0);
  const [paused, setPaused] = useState(false);

  const selectPin = (i: number) => {
    setActive(i);
    setTapKey((k) => k + 1);
  };

  useEffect(() => {
    if (reduceMotion || paused) return;

    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        for (let i = 0; i < MAP_PINS.length; i += 1) {
          if (cancelled) return;
          selectPin(i);
          await new Promise((r) => setTimeout(r, 2800));
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [reduceMotion, paused]);

  const pin = MAP_PINS[active];

  return (
    <div
      className="relative h-full min-h-[280px] lg:min-h-[400px] overflow-hidden"
      style={{ background: '#f2efe9' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="absolute will-change-[left,top]"
        style={{
          width: `${MAP_SCALE * 100}%`,
          height: `${MAP_SCALE * 100}%`,
          left: `calc(50% - ${pin.x * MAP_SCALE}%)`,
          top: `calc(50% - ${pin.y * MAP_SCALE}%)`,
          transition: reduceMotion
            ? undefined
            : 'left 0.72s cubic-bezier(0.22, 1, 0.36, 1), top 0.72s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <img
          src="/map-minsk.svg"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-center select-none pointer-events-none"
        />

        {MAP_PINS.map((p, i) => {
          const isActive = active === i;
          return (
            <button
              key={p.id}
              type="button"
              aria-label={`${p.name}, ${p.rating}`}
              aria-pressed={isActive}
              onClick={() => {
                setPaused(true);
                selectPin(i);
              }}
              className={`group/pin absolute -translate-x-1/2 -translate-y-full ${isActive ? 'z-[3]' : 'z-[2]'}`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animation: reduceMotion ? undefined : `lp-pin-in 0.45s ease ${p.delay} both`,
              }}
            >
              <span
                role="tooltip"
                className={`pointer-events-none absolute left-1/2 bottom-[calc(100%+6px)] z-10 w-max max-w-[180px] -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-left transition-opacity duration-150 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover/pin:opacity-100'
                }`}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E7E5E4',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
                  animation: isActive && !reduceMotion ? 'lp-popup 0.28s ease both' : undefined,
                }}
              >
                <span className="block font-display font-bold text-[12px] leading-tight text-[#1C1917]">{p.name}</span>
                <span className="mt-0.5 flex items-center gap-1 font-body text-[11px] text-[#78716C]">
                  <StarIcon filled size={11} className="text-[#EAB308]" />
                  {p.rating}
                  <span>· {p.note}</span>
                </span>
                <span
                  className="absolute left-1/2 top-full -mt-px h-2 w-2 -translate-x-1/2 rotate-45"
                  style={{ background: '#FFFFFF', borderRight: '1px solid #E7E5E4', borderBottom: '1px solid #E7E5E4' }}
                  aria-hidden
                />
              </span>

              {isActive && !reduceMotion && (
                <span
                  key={`ripple-${tapKey}`}
                  className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full"
                  style={{
                    background: 'rgba(234,179,8,0.35)',
                    animation: 'lp-pin-ripple 0.55s ease-out both',
                  }}
                />
              )}
              <span
                key={isActive ? `tap-${tapKey}` : p.id}
                className="relative block"
                style={{
                  animation: isActive && !reduceMotion ? 'lp-pin-tap 0.48s cubic-bezier(0.22, 1.4, 0.36, 1) both' : undefined,
                  filter: isActive ? 'drop-shadow(0 6px 10px rgba(0,0,0,0.28))' : undefined,
                }}
              >
                <svg width={isActive ? 34 : 28} height={isActive ? 44 : 36} viewBox="0 0 22 28" aria-hidden>
                  <path fill="rgba(0,0,0,0.35)" d="M11 2.4c-4.5 0-8.1 3.6-8.1 8.1 0 6 8.1 16 8.1 16s8.1-10 8.1-16c0-4.5-3.6-8.1-8.1-8.1z" transform="translate(0 1)" />
                  <path fill={isActive ? GOLD : GOLD_WARM} stroke="#1A1412" strokeWidth="1.15" strokeLinejoin="round" d="M11 1.35c-4.85 0-8.8 3.95-8.8 8.8 0 6.55 8.8 17.1 8.8 17.1s8.8-10.55 8.8-17.1c0-4.85-3.95-8.8-8.8-8.8z" />
                  <circle cx="11" cy="10" r="3.1" fill="#1A1412" />
                </svg>
              </span>
            </button>
          );
        })}
      </div>

      <div
        key={pin.id}
        className="absolute left-4 right-4 bottom-4 z-[4] rounded-[14px] px-3.5 py-3 flex items-center gap-3 pointer-events-none"
        style={{
          background: 'rgba(255,255,255,0.96)',
          border: '1px solid #E7E5E4',
          boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
          backdropFilter: 'blur(12px)',
          animation: reduceMotion ? undefined : 'lp-plate 0.32s ease both',
        }}
      >
        <div
          className="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(234,179,8,0.16)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path fill={GOLD} d="M6 6.5h9.2c.7 0 1.3.6 1.3 1.3v6.4a6.6 6.6 0 0 1-13.2 0V7.8c0-.7.6-1.3 1.3-1.3H6zm11.6 2.2h1.4a2.7 2.7 0 1 1 0 5.4h-1.4" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold text-[14px] leading-tight text-[#1C1917]">{pin.name}</p>
          <p className="mt-0.5 font-body text-[12px] inline-flex items-center gap-1 text-[#78716C]">
            <StarIcon filled size={12} className="text-[#EAB308]" />
            {pin.rating}
            <span>· {pin.note}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const SceneRate: React.FC<{
  gold: string;
  muted: string;
  text: string;
  border: string;
  surface: string;
  reduceMotion: boolean;
}> = ({ gold, muted, text, border, surface, reduceMotion }) => (
  <div className="h-full min-h-[280px] lg:min-h-[400px] flex items-center justify-center p-5 lg:p-8">
    <div className="w-full max-w-[400px] space-y-3">
      <Hint
        text="Чек-ин — отметь, что ты здесь"
        className="w-full"
        style={{
          animation: reduceMotion ? undefined : 'lp-fade-up 0.45s ease 0.1s both',
          opacity: reduceMotion ? 1 : undefined,
        }}
      >
        <div
          className="w-full rounded-2xl border px-4 py-3 flex items-center justify-between cursor-default"
          style={{ background: surface, borderColor: border }}
        >
          <div>
            <div className="font-display font-bold text-[14px]" style={{ color: text }}>Чек-ин · Atlas</div>
            <div className="font-body text-[11px] mt-0.5" style={{ color: muted }}>только что · Минск</div>
          </div>
          <span
            className="px-2 py-0.5 rounded-full font-display font-semibold text-[10px] uppercase tracking-wide"
            style={{ background: `${gold}22`, color: gold }}
          >
            здесь
          </span>
        </div>
      </Hint>

      <div
        className="rounded-2xl border p-4"
        style={{
          background: surface,
          borderColor: border,
          animation: reduceMotion ? undefined : 'lp-fade-up 0.45s ease 0.55s both',
          opacity: reduceMotion ? 1 : undefined,
        }}
      >
        <Hint text="Оценка — вклад в рейтинг места" className="mb-3">
          <span className="flex gap-1 cursor-default">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="relative inline-flex">
                <StarIcon size={18} className="text-[#EAB308] opacity-25" />
                <span
                  className="absolute inset-0"
                  style={{
                    animation: reduceMotion ? undefined : `lp-star 0.35s ease ${2.55 + i * 0.14}s both`,
                    opacity: reduceMotion ? 1 : undefined,
                  }}
                >
                  <StarIcon filled size={18} className="text-[#EAB308]" />
                </span>
              </span>
            ))}
          </span>
        </Hint>
        <Hint text="Отзыв — опиши вкус своими словами" className="w-full">
          <p className="font-body text-[13px] lg:text-[14px] leading-relaxed min-h-[3.2em] cursor-default">
            <Typewriter text={REVIEW_TEXT} reduceMotion={reduceMotion} startDelay={900} color={text} />
          </p>
        </Hint>
      </div>
    </div>
  </div>
);

const SceneSave: React.FC<{
  gold: string;
  muted: string;
  text: string;
  border: string;
  surface: string;
  reduceMotion: boolean;
}> = ({ gold, muted, text, border, surface, reduceMotion }) => {
  const [fav, setFav] = useState(reduceMotion);
  const msgs = [
    { who: 'Аня', side: 'left' as const, body: 'Кто пробовал новый эфиоп на воронке?' },
    { who: 'Макс', side: 'right' as const, body: 'Я. Ягоды и какао, без горечи 🔥' },
    { who: 'Лена', side: 'left' as const, body: 'Тогда еду. Кто ещё?' },
  ];

  useEffect(() => {
    if (reduceMotion) {
      setFav(true);
      return;
    }
    setFav(false);
    const t = window.setTimeout(() => setFav(true), 2100);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  return (
    <div className="h-full min-h-[280px] lg:min-h-[400px] flex flex-col justify-center gap-3 p-5 lg:p-8 max-w-[460px] mx-auto">
      {msgs.map((m, i) => (
        <div
          key={m.body}
          className={`flex ${m.side === 'right' ? 'justify-end' : 'justify-start'}`}
          style={{
            animation: reduceMotion ? undefined : `lp-fade-up 0.45s ease ${0.12 + i * 0.42}s both`,
            opacity: reduceMotion ? 1 : undefined,
          }}
        >
          <Hint text="Комментарий — эмоция сообщества, не модерация">
            <div
              className="max-w-[280px] rounded-2xl px-3 py-2 cursor-default"
              style={{
                background: m.side === 'right' ? `${gold}22` : 'transparent',
                border: `1px solid ${border}`,
              }}
            >
              <div className="font-display font-bold text-[11px] mb-0.5" style={{ color: gold }}>{m.who}</div>
              <div className="font-body text-[13px] leading-snug" style={{ color: text }}>{m.body}</div>
            </div>
          </Hint>
        </div>
      ))}

      <Hint
        text="Избранное — сохрани кофейню на устройстве"
        className="w-full mt-1"
        style={{
          animation: reduceMotion ? undefined : 'lp-fade-up 0.4s ease 1.55s both',
          opacity: reduceMotion ? 1 : undefined,
        }}
      >
        <div
          className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-default"
          style={{ background: surface, borderColor: border }}
        >
          <Heart
            size={22}
            weight={fav ? 'fill' : 'regular'}
            color={gold}
            style={{ animation: fav && !reduceMotion ? 'lp-heart-on 0.45s ease' : undefined }}
          />
          <div className="min-w-0">
            <div className="font-display font-bold text-[14px]" style={{ color: text }}>Atlas Espresso</div>
            <div className="font-body text-[11px]" style={{ color: muted }}>
              {fav ? 'В избранном на этом устройстве' : 'Добавить в избранное'}
            </div>
          </div>
        </div>
      </Hint>
    </div>
  );
};

const LandingProductDemo: React.FC = () => {
  const { theme } = useTheme();
  const c = getThemeColors(theme);
  const isDark = theme === 'dark';
  const reduceMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [readMore, setReadMore] = useState(false);
  const [stageHover, setStageHover] = useState(false);
  const remainingMs = useRef(CYCLE_MS);
  const tickStartedAt = useRef(Date.now());

  const category = CATEGORIES[index];
  const sceneSurface = isDark ? '#241C18' : '#F5F4F2';
  const chromeBg = isDark ? '#1A1412' : '#FFFFFF';

  const go = (next: number) => {
    setIndex((next + CATEGORIES.length) % CATEGORIES.length);
  };

  useEffect(() => {
    setReadMore(false);
    remainingMs.current = CYCLE_MS;
    tickStartedAt.current = Date.now();
  }, [index]);

  useEffect(() => {
    if (reduceMotion) return;
    if (stageHover) return;
    tickStartedAt.current = Date.now();
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % CATEGORIES.length);
    }, remainingMs.current);
    return () => {
      window.clearTimeout(id);
      remainingMs.current = Math.max(0, remainingMs.current - (Date.now() - tickStartedAt.current));
    };
  }, [reduceMotion, index, stageHover]);

  return (
    <div>
      <div className="flex gap-2">
        {CATEGORIES.map((s, i) => {
          const active = i === index;
          const Icon = s.Icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-pressed={active}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-display font-semibold text-[12px] lg:text-[13px] border transition-colors"
              style={{
                background: active ? (isDark ? '#fff' : '#1C1917') : 'transparent',
                color: active ? (isDark ? '#1C1917' : '#fff') : c.textPrimary,
                borderColor: active ? 'transparent' : c.border,
              }}
            >
              <Icon size={14} color={active ? (isDark ? '#1C1917' : GOLD) : GOLD} />
              {s.title}
            </button>
          );
        })}
      </div>

      <div
        className="relative overflow-hidden rounded-[18px] lg:rounded-[22px] border mt-3"
        style={{
          background: chromeBg,
          borderColor: c.border,
          boxShadow: isDark
            ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 24px 50px -24px rgba(0,0,0,0.55)'
            : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 24px 50px -24px rgba(0,0,0,0.12)',
        }}
        onMouseEnter={() => setStageHover(true)}
        onMouseLeave={() => setStageHover(false)}
      >
        <div
          className="flex items-center gap-3 px-4 h-11 border-b"
          style={{ borderColor: c.border, background: isDark ? 'rgba(26,20,18,0.92)' : 'rgba(255,255,255,0.92)' }}
        >
          <span className="flex gap-1.5" aria-hidden>
            <i className="block w-2 h-2 rounded-full" style={{ background: isDark ? '#5C4A42' : '#D6D3D1' }} />
            <i className="block w-2 h-2 rounded-full" style={{ background: isDark ? '#5C4A42' : '#D6D3D1' }} />
            <i className="block w-2 h-2 rounded-full" style={{ background: GOLD_WARM, opacity: 0.85 }} />
          </span>
          <span className="font-display font-semibold text-[12px]" style={{ color: c.textPrimary }}>
            CoffeePeek · {category.chrome}
          </span>
          <span
            className="ml-auto hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border font-body text-[11px]"
            style={{ borderColor: c.border, color: c.textSecondary }}
          >
            <MagnifyingGlass size={12} />
            Минск
          </span>
        </div>

        <div key={category.id} className="relative z-0">
          {category.id === 'find' && (
            <SceneFind reduceMotion={reduceMotion} />
          )}
          {category.id === 'rate' && (
            <SceneRate gold={GOLD} muted={c.textSecondary} text={c.textPrimary} border={c.border} surface={sceneSurface} reduceMotion={reduceMotion} />
          )}
          {category.id === 'save' && (
            <SceneSave gold={GOLD} muted={c.textSecondary} text={c.textPrimary} border={c.border} surface={sceneSurface} reduceMotion={reduceMotion} />
          )}
        </div>

        <button
          type="button"
          aria-label="Предыдущая категория"
          onClick={() => go(index - 1)}
          className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center overflow-visible rounded-full border"
          style={{ background: c.surface, borderColor: c.border }}
        >
          <ChevronIcon dir="left" />
        </button>
        <button
          type="button"
          aria-label="Следующая категория"
          onClick={() => go(index + 1)}
          className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center overflow-visible rounded-full border"
          style={{ background: c.surface, borderColor: c.border }}
        >
          <ChevronIcon dir="right" />
        </button>

        {!reduceMotion && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `${GOLD}22` }}>
            <div
              key={category.id}
              className="h-full"
              style={{
                background: GOLD,
                animation: `lp-progress ${CYCLE_MS}ms linear both`,
                animationPlayState: stageHover ? 'paused' : 'running',
              }}
            />
          </div>
        )}
      </div>

      <h3 className="mt-5 font-display font-bold text-[20px] lg:text-[26px] tracking-[-0.02em]" style={{ color: c.textPrimary }}>
        {category.title}
      </h3>
      <p className="mt-2 font-body text-[14px] lg:text-[15px] leading-[1.55] max-w-[640px]" style={{ color: c.textSecondary }}>
        {category.desc}
        {readMore && <> {category.more}</>}
      </p>
      <button
        type="button"
        onClick={() => setReadMore((v) => !v)}
        className="mt-3 font-display font-semibold text-[13px] bg-transparent p-0 cursor-pointer"
        style={{ color: GOLD, border: 'none' }}
      >
        {readMore ? 'Свернуть' : 'Читать дальше'}
      </button>
    </div>
  );
};

export default LandingProductDemo;
