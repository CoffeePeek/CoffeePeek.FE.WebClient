import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../constants/colors';
import { StarIcon } from './icons';
import {
  CaretLeft,
  CaretRight,
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

const SceneFind: React.FC<{
  gold: string;
  muted: string;
  text: string;
  border: string;
  surface: string;
  reduceMotion: boolean;
}> = ({ gold, muted, text, border, surface, reduceMotion }) => {
  const pins = [
    { left: '22%', top: '30%', label: 'Atlas', delay: '0.15s' },
    { left: '52%', top: '46%', label: 'Kofe', delay: '0.45s' },
    { left: '74%', top: '24%', label: 'Dobra', delay: '0.75s' },
  ];
  const chips = ['V60', 'Espresso', 'Kalita', 'AeroPress'];

  return (
    <div className="relative h-full min-h-[280px] lg:min-h-[400px] overflow-hidden" style={{ background: surface }}>
      <svg viewBox="0 0 480 280" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="480" height="280" fill={surface} />
        <path d="M0 180 C80 140 140 220 220 170 C300 120 360 200 480 150 L480 280 L0 280 Z" fill={gold} opacity="0.08" />
        <path d="M40 40 L200 40 L200 90 M40 90 L320 90 M80 90 L80 200 M200 40 L200 240 M320 90 L320 220 M400 20 L400 180" stroke={muted} strokeWidth="1.2" opacity="0.35" />
      </svg>

      {pins.map((p) => (
        <Hint
          key={p.label}
          text="Точка на карте — кофейня рядом с тобой"
          placement="bottom"
          className="absolute"
          style={{
            left: p.left,
            top: p.top,
            animation: reduceMotion ? undefined : `lp-pin-in 0.5s ease ${p.delay} both`,
            opacity: reduceMotion ? 1 : undefined,
          }}
        >
          <span className="flex flex-col items-center cursor-default">
            <span
              className="block w-3.5 h-3.5 rounded-full"
              style={{ background: gold, boxShadow: `0 0 0 7px ${gold}33` }}
            />
            <span className="mt-1 font-display font-bold text-[11px] whitespace-nowrap" style={{ color: text }}>
              {p.label}
            </span>
          </span>
        </Hint>
      ))}

      <Hint
        text="Карточка кофейни — рейтинг, статус и быстрый выбор"
        className="absolute left-4 right-4 lg:left-auto lg:right-5 lg:w-[240px]"
        style={{
          bottom: 56,
          animation: reduceMotion ? undefined : 'lp-fade-up 0.45s ease 1.15s both',
          opacity: reduceMotion ? 1 : undefined,
        }}
      >
        <div
          className="w-full rounded-2xl border px-3.5 py-3 cursor-default"
          style={{
            background: surface === '#241C18' || surface === '#1A1412' ? '#2D241F' : '#FFFFFF',
            borderColor: border,
            boxShadow: '0 16px 40px -18px rgba(0,0,0,0.45)',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-display font-bold text-[14px]" style={{ color: text }}>Atlas Espresso</div>
              <div className="mt-0.5 font-body text-[11px]" style={{ color: muted }}>открыто · 4 мин пешком</div>
            </div>
            <span className="font-display font-bold text-[13px]" style={{ color: gold }}>4.8</span>
          </div>
        </div>
      </Hint>

      <div className="absolute left-3 right-3 bottom-3 flex flex-wrap gap-1.5">
        {chips.map((name, i) => (
          <Hint key={name} text={`Фильтр — покажи места с ${name}`}>
            <span
              className="px-2.5 py-1 rounded-full font-display font-semibold text-[11px] lg:text-[12px] cursor-default"
              style={{
                border: `1px solid ${border}`,
                color: text,
                animation: reduceMotion ? undefined : `lp-chip-on 0.4s ease ${1.85 + i * 0.32}s both`,
                background: reduceMotion ? `${gold}28` : 'transparent',
              }}
            >
              {name}
            </span>
          </Hint>
        ))}
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

        <div key={category.id}>
          {category.id === 'find' && (
            <SceneFind gold={GOLD} muted={c.textSecondary} text={c.textPrimary} border={c.border} surface={sceneSurface} reduceMotion={reduceMotion} />
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
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border z-10 opacity-80 hover:opacity-100"
          style={{ background: c.surface, borderColor: c.border, color: c.textPrimary }}
        >
          <CaretLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Следующая категория"
          onClick={() => go(index + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border z-10 opacity-80 hover:opacity-100"
          style={{ background: c.surface, borderColor: c.border, color: c.textPrimary }}
        >
          <CaretRight size={16} />
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
