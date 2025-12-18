# API coverage report

Source: `openapi.json`
Scanned: `src/**/*.ts(x)`

**Referenced in code:** 25/29
**Used in UI (non-`src/api`):** 14/29

## Summary table

| Path | Methods | Used in UI | Referenced | UI references | API references |
| --- | --- | --- | --- | --- | --- |
| `/api/auth/check-exists` | GET | ❌ | ✅ |  | `src/api/auth.ts:16` |
| `/api/auth/google/login` | POST | ❌ | ✅ |  | `src/api/auth.ts:48` |
| `/api/auth/login` | POST | ✅ | ✅ | `src/contexts/AuthContext.tsx:81` | `src/api/auth.ts:20` |
| `/api/auth/logout` | POST | ✅ | ✅ | `src/contexts/AuthContext.tsx:118` | `src/api/auth.ts:60` |
| `/api/auth/refresh` | GET | ❌ | ✅ |  | `src/api/auth.ts:36`<br/>`src/api/client.ts:131` |
| `/api/auth/register` | POST | ✅ | ✅ | `src/contexts/AuthContext.tsx:98` | `src/api/auth.ts:32` |
| `/api/checkin` | GET, POST | ❌ | ✅ |  | `src/api/checkin.ts:12`<br/>`src/api/checkin.ts:24` |
| `/api/checkin/user/{userId}` | GET | ❌ | ✅ |  | `src/api/checkin.ts:41` |
| `/api/coffeeshop` | GET | ❌ | ❌ |  |  |
| `/api/coffeeshop/map` | GET | ❌ | ❌ |  |  |
| `/api/coffeeshop/search` | GET | ❌ | ❌ |  |  |
| `/api/coffeeshop/{id}` | GET | ❌ | ❌ |  |  |
| `/api/internal/beans` | GET | ❌ | ✅ |  | `src/api/internal.ts:17` |
| `/api/internal/brew-methods` | GET | ✅ | ✅ | `src/components/CoffeeFeed.tsx:102`<br/>`src/components/CoffeeMap.tsx:39` | `src/api/internal.ts:29` |
| `/api/internal/cities` | GET | ✅ | ✅ | `src/components/CoffeeFeed.tsx:84`<br/>`src/components/JobsBoard.tsx:28` | `src/api/internal.ts:13` |
| `/api/internal/equipments` | GET | ✅ | ✅ | `src/components/CoffeeFeed.tsx:90` | `src/api/internal.ts:21` |
| `/api/internal/roasters` | GET | ✅ | ✅ | `src/components/CoffeeFeed.tsx:96` | `src/api/internal.ts:25` |
| `/api/internal/statistics/{userId}` | GET | ✅ | ✅ | `src/components/Profile.tsx:52` | `src/api/internal.ts:33` |
| `/api/moderation` | GET, POST, PUT | ✅ | ✅ | `src/components/ModeratorPanel.tsx:83` | `src/api/moderation.ts:14`<br/>`src/api/moderation.ts:24`<br/>`src/api/moderation.ts:53` |
| `/api/moderation/all` | GET | ✅ | ✅ | `src/components/ModeratorPanel.tsx:36` | `src/api/moderation.ts:18` |
| `/api/moderation/status` | PUT | ✅ | ✅ | `src/components/ModeratorPanel.tsx:64` | `src/api/moderation.ts:60` |
| `/api/reviewcoffee` | GET, POST, PUT | ✅ | ✅ | `src/components/CoffeeShopDetail.tsx:85`<br/>`src/components/UserReviews.tsx:38` | `src/api/review.ts:28`<br/>`src/api/review.ts:47`<br/>`src/api/review.ts:51` |
| `/api/reviewcoffee/user/{id}` | GET | ❌ | ✅ |  | `src/api/review.ts:43` |
| `/api/reviewcoffee/{id}` | GET | ❌ | ✅ |  | `src/api/review.ts:39` |
| `/api/user` | GET, PUT | ✅ | ✅ | `src/components/EditProfileSheet.tsx:22`<br/>`src/components/EditProfileSheet.tsx:52`<br/>`src/contexts/AuthContext.tsx:55` | `src/api/user.ts:12`<br/>`src/api/user.ts:16` |
| `/api/user/Users` | GET | ❌ | ✅ |  | `src/api/user.ts:20` |
| `/api/user/{id}` | DELETE | ❌ | ✅ |  | `src/api/user.ts:24` |
| `/api/vacancies` | GET | ✅ | ✅ | `src/components/JobsBoard.tsx:80` | `src/api/vacancies.ts:11` |
| `/favorite/{id}` | DELETE, POST | ❌ | ✅ |  | `src/api/coffeeshop.ts:95`<br/>`src/api/coffeeshop.ts:99` |

## Unused paths (UI)

- `/api/auth/check-exists` (GET)
- `/api/auth/google/login` (POST)
- `/api/auth/refresh` (GET)
- `/api/checkin` (GET, POST)
- `/api/checkin/user/{userId}` (GET)
- `/api/coffeeshop` (GET)
- `/api/coffeeshop/map` (GET)
- `/api/coffeeshop/search` (GET)
- `/api/coffeeshop/{id}` (GET)
- `/api/internal/beans` (GET)
- `/api/reviewcoffee/user/{id}` (GET)
- `/api/reviewcoffee/{id}` (GET)
- `/api/user/Users` (GET)
- `/api/user/{id}` (DELETE)
- `/favorite/{id}` (DELETE, POST)

## Notes

- This is a static source scan. It detects literal usage like `'/api/x'` and template literals like ``/api/x/${id}``.
- If the backend gateway uses different routes (e.g. `/api/shops` vs `/api/coffeeshop`), OpenAPI may be outdated.
