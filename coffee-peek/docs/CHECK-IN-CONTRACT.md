# Check-in contract

Issue: [CoffeePeek-NET #288](https://github.com/CoffeePeek/CoffeePeek-NET/issues/288).
The published [Shops OpenAPI](https://api.coffeepeek.by/shops/openapi/v1.json), linked from
[Scalar](https://api.coffeepeek.by/scalar/), was checked on 2026-09-05.
The configured host is `api.coffeepeek.by` (not `api.coffeepeak.by`).

## Create: `POST /api/CheckIns`

Requires authentication. The client supplies:

```json
{
  "coffeeShopId": "11111111-1111-1111-1111-111111111111",
  "isPublic": false,
  "visitedAt": "2026-09-04T21:00:00.000Z",
  "rating": { "coffee": 5, "service": 5, "place": 5 },
  "header": null,
  "note": null,
  "photos": []
}
```

- Ratings are integers from 1 through 5 for every check-in. All default to 5.
- Private check-ins need no text or photos. `note` accepts up to 500 characters.
- Public check-ins require a separate `header` of 3–100 trimmed characters and
  `note` of 10–500 trimmed characters. Photos remain optional.
- `visitedAt` represents the selected local date, serialized as UTC. For example,
  September 5 midnight in Minsk is September 4 at 21:00 UTC. An empty date input
  defaults to today. Future dates are rejected.
- Photos use `{ fileName, contentType, storageKey, size }`, after uploading through
  `POST /api/photos/shop` and PUT to the returned upload URL. `size` is bytes;
  `sizeBytes` belongs to the upload-URL request, not the check-in request.
- Success wraps `{ checkInId, reviewId? }` in `data` with `isSuccess: true`.

Public check-ins enter the existing review moderation workflow. They are not
immediately published. The server forwards the explicit title, description,
ratings, username, and uploaded photo metadata to moderation.

## Read: `GET /api/CheckIns`

Returns only the authenticated user's check-ins. Send `X-Page-Number` and
`X-Page-Size` headers. The response is `data: { checkIns, totalItems, totalPages,
currentPage, pageSize }`; totals must not be inferred from the current array length.

Each item contains `id`, `userId`, `shopId`, `shopName`, nullable `note`, `createdAt`,
nullable `reviewId`, and `photos`. Each photo contains `id`, `fileName`, `storageKey`,
`fullUrl`, and `sortIndex`. Render `fullUrl`; do not invent storage URLs.

The accompanying backend change adds `visitedAt`. The client displays it as a
local calendar date, falling back to `createdAt` for older responses. The existing
`createdAt` remains the UTC creation timestamp, mapped from `CreatedAtUtc`.

## Rollout and verification

The inspected production schema did **not** yet contain request `header` or response
`visitedAt`. Release the accompanying CoffeePeek-NET changes with this frontend;
old backend code derives a title from the note and ignores a separate header.
The backend now persists private ratings and forwards photos to public reviews.
The existing `reviewId` linkage through asynchronous moderation remains unavailable;
this change does not fabricate a review ID.

Run `npm test` and `npm run build` inside `coffee-peek/`. Regression tests cover
payload fields, validation, dates, photos, and pagination. Server tests cover real
validation/mapping and public/private handler behavior. Browser verification uses
mocked authenticated API responses; it does not prove deployed database/broker
behavior or reproduce the reported production 500s. After deployment, smoke-test
private/public creation with and without photos using an authenticated account.
