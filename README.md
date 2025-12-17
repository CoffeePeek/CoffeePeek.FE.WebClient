# CoffeePeek WebClient

## Требования

- Node.js 18+ (рекомендуется LTS)
- npm

## Быстрый старт

Установить зависимости:

```bash
npm install
```

Запустить dev-сервер:

```bash
npm run dev
```

По умолчанию dev-сервер стартует на `http://127.0.0.1:5173` (см. `vite.config.ts`). Это сделано, чтобы избежать `EACCES` на `3000` в некоторых конфигурациях Windows.

## Сборка

```bash
npm run build
```

Артефакты сборки кладутся в `dist/` (см. `vite.config.ts` → `build.outDir`).

## Анализ бандла

Собрать проект и сгенерировать отчет по бандлу:

```bash
npm run build:analyze
```

Отчет будет в `dist/stats.html`.

## Переменные окружения

Пример переменных лежит в `env.example` (создать `.env.local` и заполнить значениями):

- `VITE_API_BASE_URL` — базовый URL API в production
- `VITE_USE_LOCAL_API` — `true/false`, использовать локальный API URL (для локальной отладки)

## E2E smoke-тест

```bash
npm run test:e2e
```

## Deploy на Vercel

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA rewrites**: заданы в `vercel.json`, чтобы роутинг React Router работал при прямом открытии URL.

Если вы используете переменные окружения, добавьте их в Vercel → Project Settings → Environment Variables (Production/Preview).