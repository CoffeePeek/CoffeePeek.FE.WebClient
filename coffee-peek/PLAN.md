# CoffeePeek Frontend — Plan

## Анализ проекта

### Критические проблемы

**1. Утечка токенов в консоль**
`LoginPage.tsx:37` логирует полный ответ сервера включая `accessToken`. То же в `api/user.ts`, `api/auth.ts`, `MapPage.tsx` (~20+ мест). В продакшне это leak чувствительных данных в DevTools.

**2. Отсутствие валидации перед API-запросами**
`LoginPage` отправляет пустые поля на сервер без pre-validation. `CoffeeShopList` у поля поиска нет `maxLength` — можно отправить неограниченную строку.

**3. Сломанный LoadingFallback в light-теме**
`AppRoutes.tsx` — спиннер ленивой загрузки захардкожен в тёмные цвета. На светлой теме невидим.

---

### Высокоприоритетные проблемы

**4. `CoffeeShopList.tsx` — компонент на 1025 строк**
Делает всё: поиск, дебаунс, фильтрация (клиент + сервер), пагинация, избранное, посещённые, рендер карточек. Поддерживать невозможно.

**5. Дублирование theme-логики в 3 страницах**
`LoginPage`, `RegisterPage`, `LandingPage` — каждая сама строит одни и те же 7 переменных через захардкоженные hex-цвета, хотя `getThemeClasses()` уже решает эту задачу.

**6. 40+ захардкоженных hex в компонентах**
`Header.tsx` строит 12 цветов вручную. `CoffeeShopPage.tsx` — ещё 5. Половина обходит theme-систему.

**7. Отсутствие пустых состояний**
`UserProfilePage` — нет сообщения если отзывов нет. `AdminPanel` — нет состояния "очередь пуста". `MapPage` — логирует в консоль, но пользователю ничего не показывает.

**8. Клавиатурная недоступность Header**
Все `<button>` в навигации работают только на мышь. Нет `aria-expanded` на мобильном меню. Ошибки форм не обёрнуты в `role="alert"`.

---

### Среднеприоритетные проблемы

**9. 30+ использований `any`**
`CoffeeShopList`, `httpClient`, `ReviewsSection`, `CoffeeShopModal` — везде `any` вместо нормальных типов.

**10. Мок-данные в продакшн коде**
`SettingsPage.tsx` — `MOCK_FAVORITE_SHOPS` и `MOCK_RECENT_REVIEWS` захардкожены, `favoriteShops` и `recentReviews` state вообще не рендерится.

**11. Мёртвый код**
`CoffeeShopPage.tsx:67-74` — состояние `showReviewModal` со всеми полями объявлено, но навигация заменила модалки. Код висит мёртвым грузом.

**12. Нет мемоизации**
`Header` — ре-рендерится при любом изменении контекста. Карточки кофеен рендерятся без `React.memo`, инлайн-хэндлеры создаются заново при каждом рендере.

---

### Низкоприоритетные проблемы

**13. Ленивая загрузка изображений**
Фотографии кофеен грузятся через CSS `backgroundImage` — нет `loading="lazy"`, нет Intersection Observer. При 10+ карточках на странице всё грузится сразу.

**14. `key={index}` в списках**
В нескольких местах используется индекс как ключ вместо `id`.

---

## План исправлений

### Фаза 1 — Безопасность и критика ✅

| # | Задача | Файлы | Статус |
|---|--------|-------|--------|
| 1.1 | Убрать `logger.log` с токенами из LoginPage | `LoginPage.tsx` | ✅ |
| 1.2 | Убрать сенситивные console.log из api/user.ts, RegisterPage | `api/user.ts`, `RegisterPage.tsx` | ✅ |
| 1.3 | Pre-validation в LoginPage + maxLength=100 на поиске | `LoginPage.tsx`, `CoffeeShopList.tsx` | ✅ |
| 1.4 | LoadingFallback — theme-aware (useTheme) | `AppRoutes.tsx` | ✅ |
| 1.5 | `role="alert"` на ошибки, `role="status"` на успех | `LoginPage`, `RegisterPage` | ✅ |

### Фаза 2 — Чистка theme-системы ✅

| # | Задача | Файлы | Статус |
|---|--------|-------|--------|
| 2.1 | LoginPage/RegisterPage: убрать 8 дублирующихся hex-переменных → themeClasses | `LoginPage.tsx`, `RegisterPage.tsx` | ✅ |
| 2.2 | Header.tsx: удалить инлайн theme-объект с hardcoded hex, перейти на themeClasses | `Header.tsx` | ✅ |
| 2.3 | Sweep hex-цветов: CoffeeShopPage, LandingPage → themeClasses | `CoffeeShopPage.tsx` | ✅ |
| 2.4 | `aria-expanded`, `aria-controls`, динамический `aria-label` на мобильное меню | `Header.tsx` | ✅ |

### Фаза 3 — Рефакторинг CoffeeShopList

| # | Задача | Файлы | Статус |
|---|--------|-------|--------|
| 3.1 | Выделить `ShopCard.tsx` — карточка кофейни с `React.memo` | `src/components/ShopCard.tsx` | ✅ |
| 3.2 | Выделить `ShopSearchBar.tsx` — инпут + теги + дропдаун города | `src/components/ShopSearchBar.tsx` | ✅ |
| 3.3 | Выделить `ShopFilterPanel.tsx` — все фильтры + сброс | `src/components/ShopFilterPanel.tsx` | ✅ |
| 3.4 | Выделить `ShopPagination.tsx` — пагинация | `src/components/ShopPagination.tsx` | ✅ |
| 3.5 | CoffeeShopList: 1026 → 456 строк, убраны debug-логи и console.log | `CoffeeShopList.tsx` | ✅ |
| 3.6 | Убраны `any`: экспортирован `AppUser`, `ReviewsSection user: any → AppUser\|null`, `interval: any → ReturnType<typeof setInterval>`, `catch any → unknown` в 9 файлах, `responseData: any → ShopsPage` с `extractList<T>` хелпером | несколько файлов | ✅ |

### Фаза 4 — UX и пустые состояния

| # | Задача | Файлы | Статус |
|---|--------|-------|--------|
| 4.1 | Пустое состояние в `UserProfilePage` | уже было ✓ | ✅ |
| 4.2 | Пустое состояние в `ModeratorPanel` | уже было ✓ | ✅ |
| 4.3 | Пустое состояние на карте — overlay «Кофейни не найдены», убраны console.log | `MapPage.tsx` | ✅ |
| 4.4 | DashboardPage — панели eager-loaded, loading state внутри каждой | — | ✅ |

### Фаза 5 — Мёртвый код и моки

| # | Задача | Файлы | Статус |
|---|--------|-------|--------|
| 5.1 | Удалён `showReviewModal` + 6 state vars + `handleSubmitReview` + modal JSX | `CoffeeShopPage.tsx` | ✅ |
| 5.2 | Удалены `MOCK_FAVORITE_SHOPS`, `MOCK_RECENT_REVIEWS`, оба state. Секции рендерят пустые массивы | `SettingsPage.tsx` | ✅ |
| 5.3 | `ShopCard`: CSS `backgroundImage` → `<img loading="lazy" decoding="async">` | `ShopCard.tsx` | ✅ |
