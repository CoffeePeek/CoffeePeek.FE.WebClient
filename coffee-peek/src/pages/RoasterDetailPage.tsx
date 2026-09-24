import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShopDetailSkeleton } from '../components/skeletons';
import PhotoCarousel from '../components/PhotoCarousel';
import Mascot from '../components/Mascot';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { useRoaster } from '../hooks/queries/useCatalogs';
import { usePageTitle } from '../hooks/usePageTitle';
import { instagramHandle, instagramUrl, toWebsiteHref } from '../utils/shopUtils';
import { AppIcon } from '../components/icons';

const RoasterDetailPage: React.FC = () => {
  const { roasterId } = useParams<{ roasterId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const tc = getThemeClasses(theme);

  const { data: roaster, isLoading, error } = useRoaster(roasterId ?? null);

  usePageTitle(roaster?.name || 'Обжарщик');

  const bgClass = tc.bg.primary;
  const textMain = tc.text.primary;
  const textMuted = tc.text.secondary;
  const cardBg = tc.bg.card;
  const borderColor = tc.border.default;

  if (isLoading) {
    return <ShopDetailSkeleton />;
  }

  if (error || !roaster) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="flex justify-center mb-2" aria-hidden>
            <Mascot pose="astonishment" size={148} />
          </div>
          <p className={`text-xl ${textMain} mb-4`}>Обжарщик не найден</p>
          <button
            onClick={() => navigate('/shops')}
            className="bg-[#EAB308] hover:bg-[#FACC15] text-[#1A1412] px-6 py-3 rounded-2xl font-bold transition-all"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  const websiteHref = roaster.contact?.siteLink ? toWebsiteHref(roaster.contact.siteLink) : undefined;
  const websiteLabel = roaster.contact?.siteLink?.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className={`min-h-screen ${bgClass} overflow-x-hidden font-body`}>
      <section className="mx-auto max-w-[920px] sm:px-6 sm:pt-6">
        <div className="h-[260px] overflow-hidden bg-white sm:h-[340px] sm:rounded-[28px]">
          <PhotoCarousel images={roaster.photos} shopName={roaster.name} />
        </div>
      </section>

      <main className="mx-auto max-w-[920px] space-y-8 px-4 py-7 pb-28 sm:px-6 sm:py-9">
        <section>
          <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${textMain}`}>{roaster.name}</h1>
          {roaster.location?.address && (
            <p className={`mt-3 flex items-center gap-2 text-sm ${textMuted}`}>
              <AppIcon name="pin_drop" size={18} color="#D4A84B" />
              {roaster.location.address}
            </p>
          )}
        </section>

        {roaster.about && (
          <section>
            <h2 className={`mb-3 text-xl font-bold ${textMain}`}>Об обжарщике</h2>
            <p className={`${textMuted} text-base leading-relaxed sm:text-lg`}>{roaster.about}</p>
          </section>
        )}

        {(roaster.contact?.instagramLink || websiteHref) && (
          <section>
            <h2 className={`mb-3 text-xl font-bold ${textMain}`}>Ссылки</h2>
            <div className="flex flex-wrap items-center gap-3">
              {roaster.contact?.instagramLink && (
                <a
                  href={instagramUrl(roaster.contact.instagramLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-semibold transition-colors hover:border-[#D4A84B]/60 ${borderColor} ${textMain}`}
                >
                  <AppIcon name="photo_camera" size={20} color="currentColor" />
                  {instagramHandle(roaster.contact.instagramLink)}
                </a>
              )}
              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-semibold transition-colors hover:border-[#D4A84B]/60 ${borderColor} ${textMain}`}
                >
                  <AppIcon name="language" size={20} color="currentColor" />
                  {websiteLabel || 'Сайт'}
                </a>
              )}
            </div>
          </section>
        )}

        {roaster.shops.length > 0 && (
          <section>
            <h2 className={`mb-4 text-2xl font-bold ${textMain}`}>Где используют</h2>
            <div className="space-y-2.5">
              {roaster.shops.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shops/${shop.id}`}
                  className={`flex min-h-[86px] items-center gap-4 rounded-[22px] border p-3 transition-colors hover:border-[#D4A84B]/60 ${cardBg} ${borderColor} ${textMain}`}
                >
                  {shop.photoUrl
                    ? <img src={shop.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                    : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl font-bold text-stone-700">{shop.name.charAt(0)}</span>}
                  <span className="min-w-0 flex-1 truncate text-lg font-semibold">{shop.name}</span>
                  <AppIcon name="chevron_right" size={24} color="currentColor" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default RoasterDetailPage;
