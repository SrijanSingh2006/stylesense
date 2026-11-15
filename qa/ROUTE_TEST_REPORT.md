# Browser route verification

The final browser run used the production Vite build and a real FastAPI server backed by a fresh temporary database. Each route entry below was inspected at 1440x900, 1366x768, 768x1024, 390x844 and 360x800. Document overflow, page exceptions, unexpected API errors and broken images were checked. Remote photo/font requests were deliberately aborted to verify the local image fallback. An additional console-error sweep checked every route.

| Route entry | Result |
|---|---|
| `/` | PASS at five viewports |
| `/discover` | PASS at five viewports |
| `/search?q=shirts` | PASS at five viewports |
| `/product/101` | PASS at five viewports |
| `/cart` | PASS at five viewports |
| `/wishlist` | PASS at five viewports |
| `/account/demo` | PASS at five viewports |
| `/dashboard` | PASS at five viewports |
| `/dashboard/analytics` | PASS at five viewports |
| `/dashboard/experiments` | PASS at five viewports |
| `/dashboard/segments` | PASS at five viewports |
| `/operations` | PASS at five viewports |
| `/operations/inventory` | PASS at five viewports |
| `/operations/returns` | PASS at five viewports |
| `/operations/catalogue` | PASS at five viewports |
| `/operations/pricing` | PASS at five viewports |
| `/operations/roadmap` | PASS at five viewports |
| `/operations/releases` | PASS at five viewports |
| `/operations/feedback` | PASS at five viewports |
| `/operations/settings` | PASS at five viewports |

The /operations entry redirects to inventory. The wildcard is checked separately with an unknown URL and a working return link. This is 100 primary route/viewport visits, plus customer, failed checkout, manager, operations, console and error-route scenarios. Screenshots are in screenshots/.
