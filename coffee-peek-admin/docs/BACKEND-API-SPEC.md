# CoffeePeek Admin — спецификация недостающего Backend API

Документ описывает, что нужно реализовать на бэкенде (`CoffeePeek-NET`), чтобы админ-панель `coffee-peek-admin` работала полностью.

**Базовый URL:** тот же, что у основного клиента (`https://api.coffeepeek.by`)  
**Формат ответа:** как в существующих сервисах — обёртка `Response<T>` / `UpdateEntityResponse<T>` с полями `isSuccess`, `message`, `data`.

---

## 1. Текущее состояние

### 1.1. Уже есть и подключено с фронта

| Метод | Путь | Роль | Назначение |
|-------|------|------|------------|
| `POST` | `/api/tokens` | — | Логин |
| `PUT` | `/api/tokens` | Auth | Refresh token |
| `DELETE` | `/api/tokens` | Auth | Logout |
| `GET` | `/api/ModerationShops` | Moderator | Список кофеен на модерации |
| `PUT` | `/api/ModerationShops/status?id={guid}&status={Pending\|Approved\|Rejected}` | Moderator | Смена статуса кофейни |
| `PUT` | `/api/ModerationShops` | Moderator | Редактирование (FormData, `ModerationShopDto`) |
| `GET` | `/api/ModerationReviews` | Moderator | Список отзывов на модерации |
| `PUT` | `/api/ModerationReviews` | Moderator | Смена статуса отзыва (JSON body) |

### 1.2. Есть, но недостаточно для админки

| Проблема | Детали |
|----------|--------|
| Нет пагинации / фильтров | `GET ModerationShops` и `GET ModerationReviews` отдают **весь** список |
| Нет `GET` по id | Детальная страница кофейни делает полный fetch + поиск на клиенте |
| Редактирование кофейни | `UpdateModerationCoffeeShopHandler` проверяет `shop.UserId == command.UserId` — **модератор не может править чужую заявку** |
| Нет комментария при approve/reject кофейни | `UpdateModerationCoffeeShopStatus` принимает только `id` + `status` |
| `UserProfileResponse` без ролей | Админке нужны `roles[]` в списке пользователей |
| Нет audit trail | Кто и когда одобрил/отклонил — не возвращается в DTO |

### 1.3. Полностью отсутствует

| Блок | Эндпоинты |
|------|-----------|
| Дашборд | `GET /api/Stats/overview` |
| Пользователи (admin) | `GET /api/admin/users`, `GET /api/admin/users/stats`, `PATCH /api/admin/users/{id}/role`, `DELETE /api/admin/users/{id}` |
| Кеш | `GET /api/admin/cache/keys`, `POST /api/admin/cache/clear`, `POST /api/admin/cache/clear/{pattern}` |
| Опубликованные кофейни | CRUD для уже approved shops (см. раздел 6) |
| Owner-портал | Привязка владельца к кофейне (см. раздел 7) |

---

## 2. Общие соглашения

### 2.1. Авторизация

| Policy | Роли JWT | Доступ |
|--------|----------|--------|
| `Moderator` | Moderator, Admin | Модерация кофеен и отзывов |
| `Admin` | Admin | Пользователи, кеш, статистика, системные операции |
| `Owner` | Owner (+ Admin) | Свои кофейни (ограниченный набор) |

Рекомендуется вынести admin-эндпoинты под префикс **`/api/admin/...`**, чтобы не смешивать с публичным `UsersController`.

### 2.2. Пагинация (единый контракт)

Использовать тот же паттерн, что в `GetCoffeeShopsResponse`:

```json
{
  "isSuccess": true,
  "message": "",
  "data": {
    "items": [],
    "totalCount": 120,
    "page": 1,
    "pageSize": 15,
    "totalPages": 8
  }
}
```

Query-параметры: `page` (default 1), `pageSize` (default 15, max 100), `search` (optional string).

### 2.3. Enum `ModerationStatus`

```csharp
Pending = 0,
Approved = 1,
Rejected = 2
```

На фронте — строки `"Pending" | "Approved" | "Rejected"` (JsonStringEnumConverter).

---

## 3. Фаза 1 — Критично (без этого админка «дырявая»)

### 3.1. Дашборд — `GET /api/admin/stats/overview`

**Policy:** `Admin` (Moderator может получать урезанную версию без user-stats — опционально).

**Response `OverviewStatsDto`:**

```csharp
public record OverviewStatsDto(
    int TotalUsers,
    int TotalShops,           // опубликованные кофейни
    int TotalReviews,         // опубликованные отзывы
    int PendingShops,
    int PendingReviews,
    int NewUsersToday,
    int NewShopsToday
);
```

**Источники данных:**

- `TotalUsers`, `NewUsersToday` — Account DB
- `TotalShops`, `NewShopsToday` — Shops DB (или Moderation + approved)
- `PendingShops`, `PendingReviews` — Moderation DB, `ModerationStatus = Pending`
- `TotalReviews` — Shops DB, опубликованные отзывы

**Кеширование:** Redis, TTL 1–5 мин (`CacheKey.Admin.OverviewStats()`).

---

### 3.2. Пользователи — Admin API

Новый контроллер: `AdminUsersController` в **AccountService** (или отдельный AdminService).

#### `GET /api/admin/users`

**Policy:** `Admin`

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Страница |
| `pageSize` | int | Размер страницы |
| `search` | string | Поиск по email, userName |
| `role` | string | Фильтр: User, Moderator, Admin, Owner |

**Response item `AdminUserDto`:**

```csharp
public record AdminUserDto(
    Guid Id,
    Guid UserCredentialId,
    string UserName,
    string Email,
    IReadOnlyList<string> Roles,
    string? About,
    DateTime CreatedAtUtc,
    string? AvatarUrl,
    int ReviewCount,
    int CheckInCount,
    int AddedShopsCount,
    bool IsBlocked
);
```

> `ReviewCount`, `CheckInCount`, `AddedShopsCount` можно агрегировать join-ом или denormalize — как в `UserProfileResponse`, но с `Roles`.

#### `GET /api/admin/users/stats`

**Policy:** `Admin`

```csharp
public record AdminUserStatsDto(
    int TotalUsers,
    int NewUsersThisMonth,
    int ActiveUsers,      // логин / активность за 30 дней — уточнить метрику
    int BlockedUsers
);
```

#### `PATCH /api/admin/users/{id}/role`

**Policy:** `Admin`

**Body:**

```json
{
  "role": "Moderator"
}
```

**Поведение:**

- Заменить роль пользователя (или добавить/убрать — зафиксировать: **replace primary role** vs **add to UserRoles**).
- Нельзя снять роль Admin у самого себя (защита).
- Логировать в audit.

**Response:** `UpdateEntityResponse<string>` или `204`.

#### `DELETE /api/admin/users/{id}`

**Policy:** `Admin`

**Поведение:** soft-delete или hard-delete (рекомендуется soft + `IsBlocked`).  
Не путать с `DELETE /api/users/me` (самоудаление).

---

### 3.3. Кеш — Admin API

Новый контроллер в **Gateway** или отдельном **AdminService** с доступом к Redis (`ICacheService` / `IConnectionMultiplexer`).

#### `GET /api/admin/cache/keys`

**Policy:** `Admin`

**Query (optional):** `pattern` (default `*`), `limit` (default 100)

**Response:**

```csharp
public record CacheKeyInfoDto(
    string Key,
    long? SizeBytes,
    DateTime? ExpiresAtUtc,
    string? Service   // из метаданных CacheKey, если известно
);
```

**Реализация:** `SCAN` по Redis + `TTL` + `MEMORY USAGE` (если доступно).  
Альтернатива: статический реестр ключей из `CacheKey` + проверка `EXISTS`.

#### `POST /api/admin/cache/clear`

**Policy:** `Admin`

**Body (optional):**

```json
{
  "pattern": "shop:*"
}
```

Если body пустой — очистка **только** ключей приложения (не `FLUSHALL` на prod).

#### `POST /api/admin/cache/clear/{key}`

**Policy:** `Admin`

URL-encoded ключ. Удалить один ключ.

**Безопасность:** whitelist префиксов (`user:`, `shop:`, `auth:`, …), запрет на `*` в path segment.

---

## 4. Фаза 2 — Доработка модерации

### 4.1. `GET /api/ModerationShops` — расширение

Добавить query-параметры (обратная совместимость: без параметров — как сейчас, все записи):

| Param | Description |
|-------|-------------|
| `status` | Pending / Approved / Rejected |
| `search` | name, address |
| `page`, `pageSize` | пагинация |

**Response:** заменить/дополнить `GetAllModerationShopsResponse`:

```csharp
public record GetModerationShopsPagedResponse(
    ModerationShopAdminDto[] Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);
```

**Расширить DTO `ModerationShopAdminDto`** (на базе `ModerationShopDto`):

```csharp
// дополнительные поля для админки
string? SubmitterEmail,
DateTime CreatedAtUtc,
DateTime? ModeratedAtUtc,
Guid? ModeratedBy,
string? ModerationComment,
string? CityName
```

### 4.2. `GET /api/ModerationShops/{id}`

**Policy:** `Moderator`

Один объект `ModerationShopAdminDto` — без загрузки всего списка.

### 4.3. `PUT /api/ModerationShops/status` — комментарий

Расширить command:

```csharp
public record UpdateModerationCoffeeShopStatusCommand(
    Guid UserId,
    Guid Id,
    ModerationStatus ModerationStatus,
    string? Comment   // NEW
);
```

Сохранять `ModeratedBy`, `ModeratedAtUtc`, `Comment` в сущности.

### 4.4. Редактирование модератором

**Вариант A (минимальный):** в `UpdateModerationCoffeeShopHandler` для роли Moderator/Admin **пропускать** проверку `shop.UserId == command.UserId`.

**Вариант B (чище):** отдельный endpoint:

```
PUT /api/admin/moderation/shops/{id}
Content-Type: application/json
Policy: Moderator
Body: UpdateModerationShopAdminCommand
```

JSON вместо FormData упростит админ-фронт.

### 4.5. `GET /api/ModerationReviews` — расширение

Аналогично кофейням:

- query: `status`, `search`, `page`, `pageSize`
- DTO дополнить: `ShopName`, `AuthorEmail`, `ModeratedAtUtc`, `ModeratedBy`

### 4.6. `GET /api/ModerationReviews/{id}`

**Policy:** `Moderator`

---

## 5. Фаза 3 — Полноценная админка (рекомендуется)

### 5.1. Блокировка пользователя

```
PATCH /api/admin/users/{id}/block
Body: { "isBlocked": true, "reason": "..." }
Policy: Admin
```

Проверка `IsBlocked` при логине (`TokensController`).

### 5.2. Журнал модерации (audit log)

```
GET /api/admin/audit/moderation?page=&pageSize=&entityType=Shop|Review&entityId=
Policy: Admin
```

```csharp
public record ModerationAuditEntryDto(
    Guid Id,
    string EntityType,
    Guid EntityId,
    string Action,          // Approved, Rejected, Updated
    ModerationStatus OldStatus,
    ModerationStatus NewStatus,
    string? Comment,
    Guid ActorUserId,
    string ActorEmail,
    DateTime CreatedAtUtc
);
```

### 5.3. Управление опубликованными кофейнями

Сейчас `CoffeeShopsController` только read (search + get by id). Для админки:

| Метод | Путь | Policy | Действие |
|-------|------|--------|----------|
| `GET` | `/api/admin/coffee-shops` | Moderator | Список опубликованных с пагинацией |
| `PATCH` | `/api/admin/coffee-shops/{id}` | Moderator | Редактирование |
| `DELETE` | `/api/admin/coffee-shops/{id}` | Admin | Снятие с публикации / soft delete |
| `POST` | `/api/admin/coffee-shops/{id}/hide` | Moderator | Скрыть без удаления |

### 5.4. Удаление опубликованных отзывов

```
DELETE /api/admin/reviews/{id}
Policy: Moderator
```

(Сейчас есть `DELETE /api/CoffeeShopReviews/{reviewId}` — проверить policy; возможно достаточно расширить существующий.)

---

## 6. Owner-портал (роль `Owner`)

Для владельцев кофеен в той же админке (или отдельном UI):

| Метод | Путь | Policy | Действие |
|-------|------|--------|----------|
| `GET` | `/api/owner/coffee-shops` | Owner | Кофейни, где пользователь — владелец |
| `PUT` | `/api/owner/coffee-shops/{id}` | Owner | Редактирование **только своих** |
| `GET` | `/api/owner/coffee-shops/{id}/reviews` | Owner | Отзывы на свои кофейни |
| `GET` | `/api/owner/coffee-shops/{id}/stats` | Owner | Просмотры, рейтинг, кол-во отзывов |

**Admin-only:**

```
POST /api/admin/coffee-shops/{shopId}/owners
Body: { "userId": "guid" }
Policy: Admin
```

Привязка пользователя с ролью Owner к кофейне.

---

## 7. Матрица приоритетов

| Приоритет | Задача | Effort | Разблокирует на фронте |
|-----------|--------|--------|------------------------|
| P0 | `GET /api/admin/stats/overview` | S | Дашборд |
| P0 | `GET/PATCH/DELETE /api/admin/users*` + stats | M | Страница пользователей |
| P0 | `GET/POST /api/admin/cache/*` | M | Страница кешей |
| P1 | Пагинация ModerationShops/Reviews | M | Производительность списков |
| P1 | `GET ModerationShops/{id}` | S | Детальная страница |
| P1 | Moderator может edit чужую заявку | S | Редактирование кофейни |
| P2 | Comment + audit на модерации | M | История решений |
| P2 | Admin CRUD опубликованных кофеен | L | Полное управление каталогом |
| P3 | Owner API | L | Кабинет владельца |

**Effort:** S = 1–2 дня, M = 3–5 дней, L = 1–2 недели.

---

## 8. Рекомендуемая структура в .NET

```
CoffeePeek.AdminService/          # новый сервис (или модуль в Gateway)
  Controllers/
    AdminStatsController.cs
    AdminUsersController.cs
    AdminCacheController.cs
    AdminAuditController.cs
  Application/
    Features/...
```

**Gateway routes** (`ocelot` / YARP):

```json
{ "Upstream": "/api/admin/{**catch-all}", "Downstream": "AdminService" }
```

Moderation остаётся в `CoffeePeek.ModerationService`, но admin-обёртки могут проксировать или дублировать с расширенными DTO.

---

## 9. Checklist для приёмки

- [ ] Все admin-эндпoинты требуют JWT + policy Admin/Moderator
- [ ] Swagger описан для `/api/admin/*`
- [ ] Integration tests на каждый controller
- [ ] `GET overview` кешируется, invalidation при approve/reject
- [ ] Cache clear не использует `FLUSHALL` на production
- [ ] Moderator редактирует чужие moderation shops
- [ ] Пагинация: `pageSize` max 100
- [ ] Roles в JWT обновляются после `PATCH .../role` (re-issue token или note «перелогиньтесь»)

---

## 10. Связь с фронтом

После реализации P0 на фронте нужно:

1. Переключить `apiConfig.ts` на `/api/admin/...` для stats, users, cache.
2. Убрать client-side пагинацию модерации, когда бэк отдаёт `items + totalCount`.
3. Использовать `GET /api/ModerationShops/{id}` вместо fetch-all.

Файлы админки для синхронизации:

- `src/api/core/apiConfig.ts`
- `src/api/admin.ts`
