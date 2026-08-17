import React from 'react';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { getThemeClasses } from '../../utils/theme';
import { instagramHandle, instagramUrl } from '../../utils/shopUtils';
import { AppIcon } from '../icons';

interface ContactButtonsProps {
  shop: DetailedCoffeeShop;
  cardBg: string;
  borderColor: string;
  textMain: string;
  textMuted: string;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export const ContactButtons: React.FC<ContactButtonsProps> = ({
  shop,
  cardBg,
  borderColor,
  textMain,
  textMuted,
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const themeClasses = getThemeClasses(theme);
  const contact = shop.shopContact;
  if (!contact?.phone && !contact?.email && !contact?.website && !contact?.instagram) {
    return null;
  }

  const websiteHref = contact.website
    ? contact.website.startsWith('http')
      ? contact.website
      : `https://${contact.website}`
    : undefined;

  const linkBtn = `inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold border ${borderColor} ${textMain} hover:border-[#D4A84B]/50 transition-all`;

  const copyPhone = async () => {
    if (!contact.phone) return;
    const ok = await copyText(contact.phone);
    showToast(ok ? 'Номер скопирован' : 'Не удалось скопировать', ok ? 'success' : 'error');
  };

  return (
    <div className={`${cardBg} p-6 rounded-3xl border ${borderColor}`}>
      <h2 className={`text-2xl font-display font-bold ${textMain} flex items-center gap-3 mb-4`}>
        <span className="w-1.5 h-8 bg-[#D4A84B] rounded-full" />
        Контакты
      </h2>
      <div className="space-y-4">
        {contact.phone && (
          <div className="flex items-center gap-3 flex-wrap">
            <AppIcon name="call" size={22} color="#D4A84B" />
            <span className={`font-medium ${textMain}`}>{contact.phone}</span>
            <button
              type="button"
              onClick={copyPhone}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border ${borderColor} ${textMuted} hover:border-[#D4A84B]/50 hover:text-[#D4A84B] transition-all`}
            >
              <AppIcon name="content_copy" size={16} />
              Скопировать
            </button>
          </div>
        )}
        {contact.email && (
          <div className={`flex items-center gap-3 ${textMuted}`}>
            <AppIcon name="mail" size={22} color="#D4A84B" />
            <a href={`mailto:${contact.email}`} className={`font-medium break-all hover:text-[#D4A84B]`}>
              {contact.email}
            </a>
          </div>
        )}
        {(websiteHref || contact.instagram) && (
          <div className="flex flex-wrap gap-3">
            {websiteHref && (
              <a href={websiteHref} target="_blank" rel="noopener noreferrer" className={linkBtn}>
                <AppIcon name="language" size={20} className={themeClasses.primary.text} />
                Веб-сайт
              </a>
            )}
            {contact.instagram && (
              <a
                href={instagramUrl(contact.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className={linkBtn}
              >
                <AppIcon name="photo_camera" size={20} className={themeClasses.primary.text} />
                {instagramHandle(contact.instagram)}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
