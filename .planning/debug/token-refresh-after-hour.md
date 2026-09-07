---
status: diagnosed
trigger: "Посмотри почему у меня вылогинивает пользователей через час, я знаю что у меня в токене стоит 1 час, но мне нужно понять почему не рефрешится токен как на клиенте фронт и админка так и в андройд приложении"
created: 2026-09-06
updated: 2026-09-06T00:45:00+03:00
---

# Symptoms

- expected: Access token должен прозрачно обновляться через refresh token во фронтенде, админке и Android-приложении.
- actual: Примерно через час после входа пользователь оказывается разлогинен во всех клиентах.
- errors: Точные сообщения об ошибках и HTTP-ответы пока неизвестны.
- timeline: Неизвестно, работало ли обновление токена раньше.
- reproduction: Войти в приложение, оставить сессию активной до истечения часового access token, затем выполнить запрос.

# Current Focus

- hypothesis: Подтверждены разные клиентские разрывы одного cookie-only контракта: web не сохраняет cookie/login refresh state и блокирует PUT по отсутствию localStorage refreshToken; Android хранит cookie только в памяти, не сохраняет новый access token и не single-flight синхронизирует ротацию.
- test: Сопоставить каждую подтверждённую ветку с наблюдаемым результатом после истечения access token и проверить альтернативы: URL/response mapping, backend TTL/rotation, pipeline registration.
- expecting: Если гипотеза верна, web детерминированно завершит refresh до сети и очистит сессию; Android после process death получит 400 без cookie, а при конкурентных 401 способен повторно использовать уже ротированный token и спровоцировать server-side revoke-all.
- next_action: Return diagnosis to caller; no source fix in diagnose-only mode.
- reasoning_checkpoint:
    hypothesis: "Cookie-only refresh contract не реализован end-to-end: web требует недоступный JSON/localStorage refresh token и не принимает login cookie; Android держит cookie только в process-memory и запускает несинхронизированные refresh requests."
    confirming_evidence:
      - "Backend LoginResponse и GoogleLoginResponse помечают RefreshToken JsonIgnore и контроллер устанавливает его только HttpOnly cookie."
      - "Оба web login выполняются без credentials=include, а ensureFresh/performRefresh требуют localStorage refreshToken до сетевого PUT."
      - "Android singleton HttpClientHandler UseCookies=true имеет только in-memory CookieContainer; local settings сохраняют исключительно access token, а UnauthorizedRefreshBehavior не сохраняет обновлённый access token и не имеет lock/single-flight."
      - "Backend RotateRefreshToken отзывает все сессии при повторном использовании уже ротированного token, поэтому конкурентный Android refresh опасен."
    falsification_test: "Гипотезу опровергли бы код, который кладёт refreshToken в web localStorage или login credentials=include, persistent Android CookieContainer/secure refresh storage, а также единый lock вокруг Android refresh; полного поиска таких путей не найдено."
    fix_rationale: "Нужен единый явный transport contract: web должен полностью работать через credentials/include + HttpOnly cookie без localStorage guard; native — через secure persisted refresh credential или persisted cookie jar, с single-flight rotation и сохранением нового access token."
    blind_spots: "Нет production network trace и точной версии APK/backend deployment; поэтому для Android различены current-main поведение и дополнительная несовместимость старой workload backend revision."
- tdd_checkpoint:

# Evidence

- timestamp: 2026-09-06T00:10:00+03:00
  checked: Knowledge base и project-local skills
  found: Knowledge base отсутствует; .claude/skills и .agents/skills в проекте отсутствуют.
  implication: Известного локального паттерна и дополнительных проектных skill-правил нет; исследование идёт по фактическому коду.

- timestamp: 2026-09-06T00:10:00+03:00
  checked: Поиск refresh/token реализаций в трёх репозиториях
  found: Оба web-клиента имеют собственные interceptors; backend имеет TokensController и RefreshTokenHandler; Android-клиент содержит TokenRefresher и WebAuthenticationClient.
  implication: Есть три клиентских пути, которые можно независимо сопоставить с единым backend-контрактом.

- timestamp: 2026-09-06T00:25:00+03:00
  checked: Backend login/refresh HTTP contract
  found: POST /api/Tokens сериализует LoginResponse, где RefreshToken помечен JsonIgnore, и кладёт refreshToken только в Secure HttpOnly SameSite=Strict cookie. PUT /api/Tokens [AllowAnonymous] читает refresh token исключительно из Request.Cookies; JSON body не читается.
  implication: Web-клиенты не могут получить refresh token из login JSON; рабочий web-flow обязан сохранять cookie при login и вызывать refresh по cookie без localStorage-зависимости.

- timestamp: 2026-09-06T00:25:00+03:00
  checked: Customer и admin TokenManager/interceptors/login transport
  found: Оба login сохраняют refresh token только если он есть в JSON, но backend его скрывает. ensureFreshAccessToken и performRefresh в обоих клиентах немедленно возвращают false, если refreshToken отсутствует в localStorage. Обычный login fetch не задаёт credentials=include; credentials=include есть только у PUT refresh.
  implication: После login localStorage содержит только access token; через час preflight refresh не делает PUT вообще, очищает токены и инициирует session_revoked. При cross-origin размещении даже HttpOnly cookie с login не будет принят без credentials=include; SameSite=Strict также запрещает cookie в cross-site сценарии.

- timestamp: 2026-09-06T00:35:00+03:00
  checked: Android HttpClient, token refresher, 401 pipeline и local settings
  found: Android использует один HttpClientHandler с UseCookies=true и refresh PUT без body/Bearer; 401 behavior зарегистрирован и response AccessToken маппится корректно. Однако CookieContainer нигде не сохраняется, JsonFileLocalUserSettings хранит только access token, а после refresh новый access token записывается только в in-memory IClientSession.
  implication: В непрерывно живом процессе с current backend одиночный refresh должен работать; после Android process death/restart остаётся старый access token, но refresh cookie исчезает, поэтому первый запрос после expiry не может восстановить сессию.

- timestamp: 2026-09-06T00:40:00+03:00
  checked: Android concurrency против backend refresh rotation
  found: TokenRefresher/UnauthorizedRefreshBehavior не имеют semaphore/single-flight. Каждый параллельный authorized 401 независимо делает PUT. Backend RotateRefreshToken отзывает все sessions при reuse уже отозванного refresh token; current controller удаляет cookie при таком Security breach.
  implication: Несколько параллельных запросов в момент expiry могут вызвать refresh-token reuse race и server-side revoke-all, что объясняет logout Android даже без перезапуска процесса.

- timestamp: 2026-09-06T00:45:00+03:00
  checked: Android workload backend revision против current backend main
  found: Frozen workload revision 8d6933fe строит RefreshTokenCommand через userContext.GetUserIdOrThrow при refresh без Bearer и не записывает ротированный refresh token обратно в cookie. Current backend main устранил оба дефекта: AllowAnonymous, поиск user по refresh token, Set-Cookie после rotation.
  implication: Если APK/окружение всё ещё связано со старой серверной ревизией, refresh ломается уже на первом истечении независимо от Android persistence; на current main остаются native persistence/concurrency дефекты.

- timestamp: 2026-09-06T00:45:00+03:00
  checked: Backend lifetime и response mapping alternatives
  found: Deploy default access TTL=60 minutes, refresh TTL=30 days; current handler finds user by refresh token, rotates and saves; response AccessToken/RefreshToken matches parsers. All clients target /api/tokens with compatible casing/routing.
  implication: Истечение access token, URL и JSON mapping сами по себе не являются первопричиной; разрыв находится в transport/state ownership и rotation concurrency.


# Eliminated

- hypothesis: Access token refresh ломается из-за неправильного URL или response field name.
  evidence: Все клиенты используют PUT /api/tokens; current backend возвращает envelope data с AccessToken/RefreshToken, и парсеры поддерживают этот shape.
  timestamp: 2026-09-06T00:45:00+03:00

- hypothesis: Backend refresh token тоже истекает через один час.
  evidence: Deploy default JWT_REFRESH_TOKEN_DAYS=30 (dev=7), доменная сущность проверяет отдельный ExpiryDate, а access lifetime отдельно равен 60 минутам.
  timestamp: 2026-09-06T00:45:00+03:00


# Resolution

- root_cause: "Контракт refresh token cookie-only не согласован с клиентами. Customer/admin ожидают refresh token из JSON/localStorage, хотя backend намеренно JsonIgnore-ит его и выдаёт только HttpOnly cookie; login requests не используют credentials=include, а refresh функции вообще не вызывают endpoint без localStorage token. Android использует неперсистентный CookieContainer, сохраняет только первоначальный access token и не сериализует параллельные refresh calls, что создаёт loss-after-process-death и refresh-token-reuse revoke-all race. Старая workload backend revision дополнительно требовала user id от отсутствующего/expired Bearer и не обновляла cookie после rotation; current main это уже исправил."
- fix: "Не применялся (diagnose-only). Направление: web — credentials=include на login/logout/refresh и cookie-only refresh без localStorage guard; Android — secure persisted refresh credential/cookie jar, persistence нового access token, single-flight refresh; убедиться, что deployed backend содержит current anonymous refresh-by-cookie + Set-Cookie rotation."
- verification: "Подтверждено статическим полным trace всех веток и git-history differential; production HTTP trace/APK build version не проверялись."
- files_changed:
