import React from 'react';
import { ImportCandidate } from '../../api/import';
import { MapTab, mapTabSrc } from '../../utils/importDossier';

const TABS: { id: MapTab; label: string }[] = [
  { id: 'map', label: 'Карта' },
  { id: 'pano', label: 'Панорама' },
  { id: 'google', label: 'Google' },
  { id: 'sv', label: 'Street View' },
];

interface DossierMapProps {
  candidate: ImportCandidate;
  tab: MapTab;
  onTab: (tab: MapTab) => void;
}

export const DossierMap: React.FC<DossierMapProps> = ({ candidate, tab, onTab }) => {
  const { embed, openUrl } = mapTabSrc(tab, candidate);
  const showOpen = tab === 'pano' || tab === 'sv';

  return (
    <section className="relative flex flex-col min-h-[280px] lg:min-h-0 flex-1 bg-[#cfd8c8] dark:bg-stone-800">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-0.5 rounded-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-md p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTab(item.id)}
            className={[
              'px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors font-body',
              tab === item.id
                ? 'bg-text-main text-white dark:bg-white dark:text-black'
                : 'text-text-muted hover:text-text-main dark:text-stone-400 dark:hover:text-white',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
        {showOpen && openUrl && (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full text-[13px] font-semibold text-text-muted hover:text-text-main dark:text-stone-400 dark:hover:text-white"
          >
            открыть
          </a>
        )}
      </div>
      {embed ? (
        <iframe
          key={`${candidate.id}-${tab}-${embed}`}
          title="Точка кандидата"
          src={embed}
          className="flex-1 w-full min-h-[280px] border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex-1 min-h-[280px] flex items-center justify-center text-sm text-text-muted">
          Нет координат для карты
        </div>
      )}
      <p className="absolute bottom-3 left-3 z-10 max-w-[420px] rounded-[10px] bg-[rgba(28,24,20,0.88)] text-[#fffdf8] text-xs px-3 py-2 leading-snug font-body">
        {tab === 'map' ? (
          <>
            Это <strong className="text-primary font-semibold">точка на карте</strong>. На виджете видны
            организации в доме — сверь с названием справа.
          </>
        ) : tab === 'pano' ? (
          'Панорама по координатам. Ищи вывеску на фасаде.'
        ) : tab === 'google' ? (
          'Google-пин тех же координат.'
        ) : (
          'Street View той же точки.'
        )}
      </p>
    </section>
  );
};
