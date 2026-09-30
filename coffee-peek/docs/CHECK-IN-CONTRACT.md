# Check-in contract

Issue: [CoffeePeek-NET #288](https://github.com/CoffeePeek/CoffeePeek-NET/issues/288).
Updated on 2026-09-30 for the new build, using the supplied
[public addresses contract](PUBLIC-ADDRESSES-CONTRACT.md). This describes the new
API contract and does not confirm that the production server has been updated.
The API changes in place, without `/v2`.

## Create: `POST /api/CheckIns`

Requires `Authorization: Bearer …`. The current user comes from JWT; do not send
`userId`. Use the shop's supplied `address.slug`; do not generate a slug from its
name or substitute a GUID. The client supplies:

```json
{
  "shop": "26-october-16",
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
`X-Page-Size` headers. The response is `ApiResponse<Page<CheckIn>>`, with
`data: { items, totalItems, totalPages,
currentPage, pageSize }`; totals must not be inferred from the current array length.

Each item contains its service `id`, `shop: PublicAddress | null`, `shopName`,
nullable `note`, `createdAt`, nullable `reviewId`, and `photos`. `shop` replaces
`shopId`; an unavailable historical shop is `null`, with no GUID fallback.
Each photo contains `id`, `fileName`, `storageKey`,
`fullUrl`, and `sortIndex`. Render `fullUrl`; do not invent storage URLs.

The response includes `visitedAt`. The client displays it as a
local calendar date, falling back to `createdAt` for older responses. The existing
`createdAt` remains the UTC creation timestamp, mapped from `CreatedAtUtc`.

Optional `from` and `to` query parameters must include a timezone and select the
half-open interval `[from, to)`. Pagination response headers are `X-Total-Count`,
`X-Total-Pages`, `X-Current-Page`, and `X-Page-Size`.

Use `shop.canonicalPath` for navigation and `shop.slug` for requests. Aliases are
accepted; responses include the current address and `isAlias: true`. Service GUIDs
for check-ins, reviews and photos remain unchanged. Public responses with addresses
use `Cache-Control: no-store`.

## Rollout and verification

Release the client migration together with the corresponding backend build.
The existing handler still validates ratings and public/private business rules.
Address errors use 400 for invalid/reserved/GUID-shaped slugs, 404 for unknown or
unavailable shops, and 503 when required public addresses are unavailable. Do not
retry through the removed `public-address` endpoints or substitute internal IDs.
The optional `reviewId` linkage remains a service identifier; do not fabricate it.

When migrating the client, update regression tests for `shop` slugs, nullable
historical shop addresses, `data.items`, and pagination headers. Run `npm test`,
`npm run build`, and `npx tsc -p tsconfig.app.json --noEmit` inside `coffee-peek/`.
After deployment, smoke-test private/public creation with and without photos using
an authenticated account. Mocked responses do not verify deployed server behavior.
