import assert from 'node:assert/strict';
import test from 'node:test';
import { renderPublicPage } from '../api/public-page.mjs';

const shell = '<!doctype html><html><head><title>CoffeePeek</title></head><body><div id="root"></div></body></html>';
const shopId = '5fd6949e-5101-4f50-a1b1-291ddb89dc85';

function withFetchMock(apiBody, callback, cities = []) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/index.html')) return new Response(shell);
    if (url.includes('/api/Catalogs/cities')) {
      return new Response(JSON.stringify({ isSuccess: true, data: { cities } }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(apiBody), { headers: { 'Content-Type': 'application/json' } });
  };
  return Promise.resolve(callback()).finally(() => { globalThis.fetch = originalFetch; });
}

test('catalog HTML contains coffee shops, links and SEO metadata', async () => {
  await withFetchMock({ isSuccess: true, data: { coffeeShops: [{ id: shopId, name: '1801 кофе', rating: 4.8, reviewCount: 12, location: { address: 'пр. Независимости 95' }, photos: [] }] } }, async () => {
    const result = await renderPublicPage(new Request('https://coffeepeek.by/api/public-page?page=shops'));
    assert.equal(result.status, 200);
    assert.match(result.html, /<title>Кофейни Беларуси — CoffeePeek<\/title>/);
    assert.match(result.html, /rel="canonical" href="https:\/\/coffeepeek\.by\/shops"/);
    assert.match(result.html, /property="og:title"/);
    assert.match(result.html, /1801 кофе/);
    assert.match(result.html, new RegExp(`href="/shops/${shopId}"`));
    assert.match(result.html, /server-rendered-content/);
  });
});

test('shop HTML contains details, menu and individual metadata', async () => {
  await withFetchMock({ isSuccess: true, data: { shopDto: { id: shopId, cityId: 'minsk-id', name: '1801 кофе', description: 'Спешелти кофейня', rating: 4.9, reviewCount: 20, location: { address: 'пр. Независимости 95', latitude: 53.9, longitude: 27.6 }, photos: [{ fullUrl: 'https://media.example/shop.jpg' }], menu: { currency: 'BYN', items: [{ nameRu: 'Капучино', availability: 'Present', price: 7, currency: 'BYN' }] } } } }, async () => {
    const result = await renderPublicPage(new Request(`https://coffeepeek.by/api/public-page?page=shop&shopId=${shopId}`));
    assert.equal(result.status, 200);
    assert.match(result.html, /<title>1801 кофе, Минск — CoffeePeek<\/title>/);
    assert.match(result.html, /Спешелти кофейня/);
    assert.match(result.html, /пр\. Независимости 95/);
    assert.match(result.html, /Капучино — 7 BYN/);
    assert.match(result.html, /property="og:image"/);
    assert.match(result.html, /CafeOrCoffeeShop/);
  }, [{ id: 'minsk-id', name: 'Минск' }]);
});

test('missing or invalid shop returns server-side 404 content', async () => {
  await withFetchMock({ isSuccess: false, data: null }, async () => {
    const result = await renderPublicPage(new Request(`https://coffeepeek.by/api/public-page?page=shop&shopId=${shopId}`));
    assert.equal(result.status, 404);
    assert.match(result.html, /Кофейня не найдена/);
  });
});

test('catalog API outage returns informative server-side 503 content', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/index.html')) return new Response(shell);
    throw new Error('network unavailable');
  };
  try {
    const result = await renderPublicPage(new Request('https://coffeepeek.by/api/public-page?page=shops'));
    assert.equal(result.status, 503);
    assert.match(result.html, /Страница временно недоступна/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
