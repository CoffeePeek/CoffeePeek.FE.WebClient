const SITE_URL = 'https://coffeepeek.by';
const DEFAULT_API_URL = 'https://api.coffeepeek.by';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const stripTrailingSlash = (value) => value.replace(/\/$/, '');

function apiUrl(path) {
  const configured = process.env.PUBLIC_API_URL || process.env.VITE_API_URL || DEFAULT_API_URL;
  return `${stripTrailingSlash(configured)}${path}`;
}

async function fetchJson(path) {
  try {
    const response = await fetch(apiUrl(path), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { ok: false, status: response.status, body: null };
    const body = await response.json();
    return { ok: body?.isSuccess !== false, status: response.status, body };
  } catch {
    return { ok: false, status: 503, body: null };
  }
}

async function loadSpaShell(request) {
  const requestUrl = new URL(request.url);
  const shellUrl = new URL('/index.html', requestUrl.origin);
  const response = await fetch(shellUrl, { headers: { Accept: 'text/html' } });
  if (!response.ok) throw new Error(`SPA shell returned ${response.status}`);
  return response.text();
}

function replaceMeta(html, { title, description, canonical, type = 'website', image }) {
  const tags = [
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="CoffeePeek">`,
    image ? `<meta property="og:image" content="${escapeHtml(image)}">` : '',
  ].filter(Boolean).join('\n    ');

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace('</head>', `    ${tags}\n</head>`);
}

function serverContent(content) {
  return `<div id="server-rendered-content" style="min-height:100vh;background:#1A1412;color:#fff;font-family:'RF Dewi',sans-serif">
    <header style="border-bottom:1px solid #3D2F28;padding:16px clamp(20px,5vw,64px)"><a href="/" style="color:#fff;text-decoration:none;font-size:20px;font-weight:700">Coffee<span style="color:#EAB308">Peek</span></a></header>
    ${content}
  </div>
  <script>document.getElementById('server-rendered-content')?.remove()</script>`;
}

function injectContent(html, content) {
  return html.replace('<body>', `<body>\n${serverContent(content)}`);
}

function pageLayout(title, intro, body) {
  return `<main style="max-width:1120px;margin:0 auto;padding:48px 20px 72px">
    <h1 style="font-family:'RF Dewi Extended',sans-serif;font-size:clamp(32px,5vw,52px);margin:0 0 12px">${escapeHtml(title)}</h1>
    <p style="color:#A39E93;font-size:18px;line-height:1.6;margin:0 0 32px">${escapeHtml(intro)}</p>
    ${body}
  </main>`;
}

function renderHome() {
  return pageLayout(
    'Кофейни Беларуси',
    'CoffeePeek помогает находить интересные кофейни, изучать меню и выбирать место для следующей чашки кофе.',
    '<p><a href="/shops" style="display:inline-block;background:#EAB308;color:#1A1412;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:700">Смотреть кофейни</a></p>',
  );
}

function renderShopCards(shops) {
  return `<ul style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;padding:0;list-style:none">${shops.map((shop) => {
    const address = shop.location?.address || 'Адрес уточняется';
    const photo = shop.photos?.[0]?.fullUrl;
    return `<li style="border:1px solid #3D2F28;border-radius:16px;overflow:hidden;background:#2D241F">
      ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(shop.name)}" width="640" height="360" style="display:block;width:100%;height:180px;object-fit:cover">` : ''}
      <div style="padding:18px"><h2 style="font-size:20px;margin:0 0 8px"><a href="/shops/${escapeHtml(shop.id)}" style="color:#fff">${escapeHtml(shop.name)}</a></h2>
      <p style="color:#A39E93;margin:0 0 8px">${escapeHtml(address)}</p>
      <p style="margin:0">${shop.reviewCount ? `${escapeHtml(shop.rating)} ★ · ${escapeHtml(shop.reviewCount)} отзывов` : 'Пока без отзывов'}</p></div>
    </li>`;
  }).join('')}</ul>`;
}

function renderShopDetails(shop) {
  const address = shop.location?.address || 'Адрес уточняется';
  const coordinates = shop.location?.latitude != null && shop.location?.longitude != null
    ? `<a href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(shop.location.latitude)}&mlon=${encodeURIComponent(shop.location.longitude)}" style="color:#EAB308">Открыть на карте</a>`
    : '';
  const menuItems = (shop.menu?.items || []).filter((item) => item.availability !== 'Absent').slice(0, 12);
  const menu = menuItems.length
    ? `<section><h2>Меню</h2><ul>${menuItems.map((item) => `<li>${escapeHtml(item.nameRu || item.nameEn || item.slug)}${item.price != null ? ` — ${escapeHtml(item.price)} ${escapeHtml(item.currency || shop.menu.currency || 'BYN')}` : ''}</li>`).join('')}</ul></section>`
    : '';
  return pageLayout(
    shop.name,
    shop.description || `${shop.name} — кофейня на CoffeePeek. Адрес: ${address}.`,
    `<article>
      <p><strong>Адрес:</strong> ${escapeHtml(address)}</p>
      ${shop.reviewCount ? `<p><strong>Рейтинг:</strong> ${escapeHtml(shop.rating)} из 5 · ${escapeHtml(shop.reviewCount)} отзывов</p>` : '<p>Пока без отзывов</p>'}
      ${coordinates ? `<p>${coordinates}</p>` : ''}
      ${menu}
    </article>`,
  );
}

function renderNotFound() {
  return pageLayout('Кофейня не найдена', 'Возможно, кофейня была удалена или ссылка указана неверно.', '<p><a href="/shops" style="color:#EAB308">Вернуться в каталог</a></p>');
}

function renderUnavailable() {
  return pageLayout('Страница временно недоступна', 'Не удалось загрузить данные CoffeePeek. Попробуйте ещё раз позже.', '<p><a href="/shops" style="color:#EAB308">Обновить каталог</a></p>');
}

function jsonLd(value) {
  return `<script type="application/ld+json">${JSON.stringify(value).replaceAll('<', '\\u003c')}</script>`;
}

export async function renderPublicPage(request) {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') || 'home';
  const shell = await loadSpaShell(request);

  if (page === 'home') {
    const title = 'CoffeePeek — кофейни Беларуси';
    const description = 'Находите кофейни Беларуси, изучайте меню, отзывы и выбирайте место для следующей чашки кофе.';
    let html = replaceMeta(shell, { title, description, canonical: `${SITE_URL}/` });
    html = injectContent(html, `${renderHome()}${jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'CoffeePeek', url: `${SITE_URL}/` })}`);
    return { html, status: 200 };
  }

  if (page === 'shops') {
    const result = await fetchJson('/api/CoffeeShops?page=1&pageSize=48');
    if (!result.ok) {
      const html = injectContent(replaceMeta(shell, { title: 'CoffeePeek временно недоступен', description: 'Каталог кофеен временно недоступен.', canonical: `${SITE_URL}/shops` }), renderUnavailable());
      return { html, status: 503 };
    }
    const shops = result.body?.data?.coffeeShops || [];
    const title = 'Кофейни Беларуси — CoffeePeek';
    const description = `Каталог кофеен CoffeePeek: ${shops.length} заведений с адресами, рейтингами, меню и фотографиями.`;
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: shops.map((shop, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/shops/${shop.id}`,
        name: shop.name,
      })),
    };
    let html = replaceMeta(shell, { title, description, canonical: `${SITE_URL}/shops` });
    html = injectContent(
      html,
      `${pageLayout('Кофейни', 'Каталог кофеен с адресами, рейтингами и меню.', renderShopCards(shops))}${jsonLd(structuredData)}`,
    );
    return { html, status: 200 };
  }

  const shopId = url.searchParams.get('shopId') || '';
  if (!UUID_PATTERN.test(shopId)) {
    const html = injectContent(replaceMeta(shell, { title: 'Кофейня не найдена — CoffeePeek', description: 'Запрошенная кофейня не найдена.', canonical: `${SITE_URL}/shops/${encodeURIComponent(shopId)}` }), renderNotFound());
    return { html, status: 404 };
  }

  const [result, citiesResult] = await Promise.all([
    fetchJson(`/api/CoffeeShops/${shopId}`),
    fetchJson('/api/Catalogs/cities'),
  ]);
  const shop = result.body?.data?.shopDto;
  if (!result.ok || !shop) {
    if (!result.body && result.status >= 500) {
      const html = injectContent(replaceMeta(shell, { title: 'CoffeePeek временно недоступен', description: 'Данные кофейни временно недоступны.', canonical: `${SITE_URL}/shops/${shopId}` }), renderUnavailable());
      return { html, status: 503 };
    }
    const html = injectContent(replaceMeta(shell, { title: 'Кофейня не найдена — CoffeePeek', description: 'Запрошенная кофейня не найдена.', canonical: `${SITE_URL}/shops/${shopId}` }), renderNotFound());
    return { html, status: 404 };
  }

  const address = shop.location?.address || 'Беларусь';
  const city = citiesResult.body?.data?.cities?.find((item) => item.id === shop.cityId)?.name;
  const title = `${shop.name}${city ? `, ${city}` : ''} — CoffeePeek`;
  const description = (shop.description || `${shop.name}: ${address}. Рейтинг, отзывы, меню и информация о кофейне на CoffeePeek.`).slice(0, 160);
  const canonical = `${SITE_URL}/shops/${shop.id}`;
  const image = shop.photos?.[0]?.fullUrl;
  let html = replaceMeta(shell, { title, description, canonical, type: 'business.business', image });
  html = injectContent(html, `${renderShopDetails(shop)}${jsonLd({ '@context': 'https://schema.org', '@type': 'CafeOrCoffeeShop', name: shop.name, description, url: canonical, image, address: { '@type': 'PostalAddress', streetAddress: address, addressLocality: city, addressCountry: 'BY' }, geo: shop.location?.latitude != null ? { '@type': 'GeoCoordinates', latitude: shop.location.latitude, longitude: shop.location.longitude } : undefined, aggregateRating: shop.reviewCount ? { '@type': 'AggregateRating', ratingValue: shop.rating, reviewCount: shop.reviewCount } : undefined })}`);
  return { html, status: 200 };
}

export default {
  async fetch(request) {
    try {
      const { html, status } = await renderPublicPage(request);
      return new Response(html, {
        status,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': status === 200 ? 'public, s-maxage=300, stale-while-revalidate=3600' : 'public, s-maxage=60',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      return new Response('Public page is temporarily unavailable', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
  },
};
