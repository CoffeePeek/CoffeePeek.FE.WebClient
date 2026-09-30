import assert from 'node:assert/strict';
import test from 'node:test';
import handler, { renderPublicPage } from '../api/public-page.mjs';

const shell = '<!doctype html><html><head><title>CoffeePeek</title></head><body><div id="root"></div></body></html>';
const shopId = '5fd6949e-5101-4f50-a1b1-291ddb89dc85';

function withFetchMock(apiBody, callback, cities = []) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/index.html')) return new Response(shell);
    if (url.includes('/public-addresses?')) return new Response(JSON.stringify([{ entityId: shopId, canonicalPath: '/coffee-shops/1801' }]));
    if (url.endsWith('/public-address')) return new Response('', { status: 503 });
    if (url.endsWith('/api/Catalogs/cities')) {
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
    assert.match(result.html, /href="\/coffee-shops\/1801"/);
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

test('replacement patterns in shop data are inserted literally', async () => {
  await withFetchMock({ isSuccess: true, data: { shopDto: { id: shopId, name: "Кофе $` $' $&", description: 'x', location: { address: 'a' }, photos: [] } } }, async () => {
    const result = await renderPublicPage(new Request(`https://coffeepeek.by/api/public-page?page=shop&shopId=${shopId}`));
    assert.match(result.html, /Кофе \$` \$&#39; \$&amp;|Кофе \$` \$' \$&amp;|Кофе \$` \$&#x27; \$&amp;/);
    assert.equal(result.html.match(/<head>/g)?.length, 1);
    assert.equal(result.html.match(/<body>/g)?.length, 1);
  });
});

for (const kind of ['shops', 'roasters', 'users', 'cities', 'zones']) {
  test(`${kind}: alias returns actual 301 from backend metadata`, async () => {
    await withFetchMock({ data: { userName: 'Petr' }, address: { entityId: shopId, canonicalPath: '/users/petr', isAlias: true } }, async () => {
      const result = await renderPublicPage(new Request(`https://coffeepeek.by/api/public-page?page=address&kind=${kind}&segment=old-name&path=/users/old-name`));
      assert.equal(result.status, 301);
      assert.equal(result.location, '/users/petr');
    });
  });
}

test('canonical user uses envelope data without data.id', async () => {
  await withFetchMock({ data: { userName: 'Petr', about: 'Filter first', reviewCount: 12 }, address: { entityId: shopId, canonicalPath: '/users/petr', isAlias: false } }, async () => {
    const result = await renderPublicPage(new Request('https://coffeepeek.by/api/public-page?page=address&kind=users&segment=petr&path=/users/petr'));
    assert.equal(result.status, 200);
    assert.match(result.html, /Petr/);
    assert.match(result.html, /https:\/\/coffeepeek.by\/users\/petr/);
    assert.doesNotMatch(result.html, new RegExp(shopId));
  });
});

for (const status of [400, 404, 429, 503]) {
  test(`slug-only HTTP ${status}: preserves status and never calls GUID fallback`, async () => {
    const original = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async input => {
      if (String(input).endsWith('/index.html')) return new Response(shell);
      calls.push(String(input));
      return new Response('Gateway error', { status, headers: { 'Retry-After': '30' } });
    };
    try {
      const result = await renderPublicPage(new Request('https://coffeepeek.by/api/public-page?page=address&kind=users&segment=petr&path=/users/petr'));
      assert.equal(result.status, status);
      assert.equal(calls.length, 1);
      assert.match(calls[0], /by-slug\/petr$/);
      assert.equal(result.retryAfter, '30');
    } finally { globalThis.fetch = original; }
  });
}

test('legacy GUID uses GUID API and redirects only to returned canonical metadata', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.endsWith('/index.html')) return new Response(shell);
    calls.push(url);
    if (url.endsWith('/public-address')) return new Response(JSON.stringify({ entityId: shopId, canonicalPath: '/coffee-shops/coffee', isAlias: false }));
    return new Response(JSON.stringify({ isSuccess: true, data: { shopDto: { id: shopId, name: 'Coffee' } } }));
  };
  try {
    const response = await handler.fetch(new Request(`https://coffeepeek.by/api/public-page?page=shop&shopId=${shopId}`));
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('Location'), '/coffee-shops/coffee');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.ok(calls.every(url => !url.includes('by-slug')));
  } finally { globalThis.fetch = original; }
});

test('legacy GUID profile retains its GUID API when metadata is unavailable', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.endsWith('/index.html')) return new Response(shell);
    calls.push(url);
    if (url.endsWith('/public-address')) return new Response('', { status: 503 });
    return new Response(JSON.stringify({ isSuccess: true, data: { userName: 'Petr', reviewCount: 1 } }));
  };
  try {
    const result = await renderPublicPage(new Request(`https://coffeepeek.by/api/public-page?page=address&kind=users&segment=${shopId}&path=/users/${shopId}`));
    assert.equal(result.status, 200);
    assert.match(result.html, /Petr/);
    assert.equal(calls.length, 2);
    assert.ok(calls.every(url => !url.includes('by-slug')));
  } finally { globalThis.fetch = original; }
});
