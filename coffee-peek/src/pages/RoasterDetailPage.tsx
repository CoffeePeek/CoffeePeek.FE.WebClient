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

  return (
    <div className={`min-h-screen ${bgClass} font-body overflow-x-hidden`}>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="h-[220px] sm:h-[280px] md:h-[380px] rounded-3xl overflow-hidden">
          <PhotoCarousel images={roaster.photos} shopName={roaster.name} />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 space-y-6 sm:space-y-8">
        <div>
          <h1 className={`text-2xl sm:text-4xl font-extended font-bold ${textMain}`}>{roaster.name}</h1>
          {roaster.location?.address && (
            <p className={`mt-2 flex items-center gap-2 ${textMuted}`}>
              <AppIcon name="pin_drop" size={18} color="#D4A84B" />
              {roaster.location.address}
            </p>
          )}
        </div>

        {roaster.about && (
          <div className={`${cardBg} p-4 sm:p-6 rounded-3xl border ${borderColor}`}>
            <h2 className={`text-xl font-extended font-bold ${textMain} flex items-center gap-3 mb-4`}>
              <span className="w-1.5 h-8 bg-[#D4A84B] rounded-full shrink-0" />
              О компании
            </h2>
            <p className={`${textMuted} leading-relaxed`}>{roaster.about}</p>
          </div>
        )}

        {(roaster.contact?.instagramLink || websiteHref) && (
          <div className={`${cardBg} p-4 sm:p-6 rounded-3xl border ${borderColor}`}>
            <h2 className={`text-xl font-extended font-bold ${textMain} flex items-center gap-3 mb-4`}>
              <span className="w-1.5 h-8 bg-[#D4A84B] rounded-full shrink-0" />
              Контакты
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {roaster.contact?.instagramLink && (
                <a
                  href={instagramUrl(roaster.contact.instagramLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-full font-semibold border ${borderColor} ${textMain} hover:border-[#D4A84B]/50 transition-all`}
                >
                  <AppIcon name="photo_camera" size={18} color="#D4A84B" />
                  {instagramHandle(roaster.contact.instagramLink)}
                </a>
              )}
              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-full font-semibold border ${borderColor} ${textMain} hover:border-[#D4A84B]/50 transition-all`}
                >
                  <AppIcon name="language" size={18} color="#D4A84B" />
                  Сайт
                </a>
              )}
            </div>
          </div>
        )}

        {roaster.shops.length > 0 && (
          <div>
            <h2 className={`text-xl font-extended font-bold ${textMain} flex items-center gap-3 mb-4`}>
              <span className="w-1.5 h-8 bg-[#D4A84B] rounded-full shrink-0" />
              Кофейни
            </h2>
            <div className="flex flex-wrap gap-2">
              {roaster.shops.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shops/${shop.id}`}
                  className="px-4 py-2 bg-[#F8F1DD] text-[#D4A84B] rounded-xl text-sm font-semibold border border-[#D4A84B]/20 hover:border-[#D4A84B]/50 transition-colors"
                >
                  {shop.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default RoasterDetailPage;
