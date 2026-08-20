import React from 'react';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { getThemeClasses } from '../../utils/theme';
import { instagramHandle, instagramUrl, toWebsiteHref } from '../../utils/shopUtils';
import { AppIcon } from '../icons';
import { Globe, InstagramLogo } from '@/components/Icon';

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

  const websiteHref = contact.website ? toWebsiteHref(contact.website) : undefined;

  const copyPhone = async () => {
    if (!contact.phone) return;
    const ok = await copyText(contact.phone);
    showToast(ok ? 'Номер скопирован' : 'Не удалось скопировать', ok ? 'success' : 'error');
  };

  const iconBtn = `inline-flex items-center justify-center w-10 h-10 rounded-full border ${borderColor} ${textMain} hover:border-[#D4A84B]/50 transition-all`;
  const chipBtn = `inline-flex items-center gap-2 h-10 px-3.5 rounded-full font-semibold border ${borderColor} ${textMain} hover:border-[#D4A84B]/50 transition-all`;

  return (
    <div className={`${cardBg} p-6 rounded-3xl border ${borderColor}`}>
      <h2 className={`text-2xl font-display font-bold ${textMain} flex items-center gap-3 mb-4`}>
        <span className="w-1.5 h-8 bg-[#D4A84B] rounded-full" />
        Контакты
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        {contact.phone && (
          <>
            <AppIcon name="call" size={22} color="#D4A84B" />
            <span className={`font-medium ${textMain}`}>{contact.phone}</span>
            <button
              type="button"
              onClick={copyPhone}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${borderColor} ${textMuted} hover:border-[#D4A84B]/50 hover:text-[#D4A84B] transition-all`}
            >
              <AppIcon name="content_copy" size={16} />
              Скопировать
            </button>
          </>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className={`inline-flex items-center gap-2 ${textMuted} hover:text-[#D4A84B]`}>
            <AppIcon name="mail" size={20} color="#D4A84B" />
            <span className="font-medium break-all">{contact.email}</span>
          </a>
        )}
        {websiteHref && (
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Веб-сайт"
            title="Веб-сайт"
            className={iconBtn}
          >
            <Globe size={20} className={themeClasses.primary.text} />
          </a>
        )}
        {contact.instagram && (
          <a
            href={instagramUrl(contact.instagram)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram ${instagramHandle(contact.instagram)}`}
            className={chipBtn}
          >
            <InstagramLogo size={18} className={themeClasses.primary.text} />
            {instagramHandle(contact.instagram)}
          </a>
        )}
      </div>
    </div>
  );
};
