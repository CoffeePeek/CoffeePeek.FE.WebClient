import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DownloadButton from '../src/components/mobile-app/DownloadButton';

test('download buttons use store artwork and preserve accessible download links', () => {
  for (const [channel, href, artwork] of [
    ['google-play', '/download/android', '/images/stores/google-play.png'],
    ['app-store', '/download/ios', '/images/stores/app-store.svg'],
    ['apk', '/download/apk', 'APK-файл'],
  ]) {
    const html = renderToStaticMarkup(React.createElement(DownloadButton, { channel, href, label: 'Скачать CoffeePeek' }));
    expect(html).toContain(`href="${href}"`);
    expect(html).toContain('aria-label="Скачать CoffeePeek"');
    expect(html).toContain(artwork);
  }
});
