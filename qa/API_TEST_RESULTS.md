# Registered API inventory

Generated from the account-upgrade FastAPI OpenAPI schema on 15 November 2026. 104 operations. A registered route is not itself a passing test; execution evidence is in the current acceptance/auth/RBAC reports. Some public routes use optional bearer identity or require Origin, single-use token or cookie/CSRF checks.

| Method | Route | OpenAPI authorization |
|---|---|---|
| GET | `/api/v1/health` | Public; endpoint may enforce Origin/token/cookie |
| GET | `/api/v1/products` | Public; endpoint may enforce Origin/token/cookie |
| GET | `/api/v1/products/{product_id}` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/search` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/visual-search` | Public; endpoint may enforce Origin/token/cookie |
| GET | `/api/v1/recommendations/{customer_id}` | Bearer required |
| GET | `/api/v1/recommendations/{customer_id}/complete-look` | Bearer required |
| POST | `/api/v1/size-recommendation` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/cart/events` | Bearer required |
| POST | `/api/v1/orders` | Bearer required |
| POST | `/api/v1/events` | Bearer required |
| GET | `/api/v1/analytics/overview` | Bearer required |
| GET | `/api/v1/analytics/funnel` | Bearer required |
| GET | `/api/v1/analytics/cohorts` | Bearer required |
| GET | `/api/v1/analytics/products` | Bearer required |
| GET | `/api/v1/analytics/north-star` | Bearer required |
| GET | `/api/v1/segments` | Bearer required |
| GET | `/api/v1/segments/{segment_name}` | Bearer required |
| GET | `/api/v1/experiments` | Bearer required |
| POST | `/api/v1/experiments` | Bearer required |
| GET | `/api/v1/experiments/{experiment_id}` | Bearer required |
| PATCH | `/api/v1/experiments/{experiment_id}` | Bearer required |
| POST | `/api/v1/experiments/{experiment_id}/assign` | Bearer required |
| GET | `/api/v1/experiments/{experiment_id}/results` | Bearer required |
| GET | `/api/v1/feature-flags` | Bearer required |
| POST | `/api/v1/feature-flags` | Bearer required |
| PATCH | `/api/v1/feature-flags/{flag_id}` | Bearer required |
| GET | `/api/v1/feature-flags/eligibility/{customer_id}` | Bearer required |
| GET | `/api/v1/inventory` | Bearer required |
| GET | `/api/v1/inventory/alerts` | Bearer required |
| GET | `/api/v1/inventory/forecast/{product_id}` | Bearer required |
| POST | `/api/v1/inventory/movements` | Bearer required |
| GET | `/api/v1/returns/overview` | Bearer required |
| GET | `/api/v1/returns/insights` | Bearer required |
| GET | `/api/v1/catalogue/quality` | Bearer required |
| GET | `/api/v1/catalogue/issues` | Bearer required |
| PATCH | `/api/v1/catalogue/issues/{issue_id}` | Bearer required |
| POST | `/api/v1/promotions/simulate` | Bearer required |
| GET | `/api/v1/roadmap/tasks` | Bearer required |
| POST | `/api/v1/roadmap/tasks` | Bearer required |
| PATCH | `/api/v1/roadmap/tasks/{task_id}` | Bearer required |
| DELETE | `/api/v1/roadmap/tasks/{task_id}` | Bearer required |
| GET | `/api/v1/releases` | Bearer required |
| POST | `/api/v1/releases` | Bearer required |
| PATCH | `/api/v1/releases/{release_id}` | Bearer required |
| GET | `/api/v1/feedback` | Bearer required |
| POST | `/api/v1/feedback` | Bearer required |
| PATCH | `/api/v1/feedback/{feedback_id}` | Bearer required |
| GET | `/api/v1/wishlist/{customer_id}` | Bearer required |
| PUT | `/api/v1/wishlist/{customer_id}/{product_id}` | Bearer required |
| DELETE | `/api/v1/wishlist/{customer_id}/{product_id}` | Bearer required |
| POST | `/api/v1/auth/register` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/auth/login` | Public; endpoint may enforce Origin/token/cookie |
| GET | `/api/v1/auth/csrf` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/auth/refresh` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/auth/logout` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/auth/logout-all` | Bearer required |
| GET | `/api/v1/auth/me` | Bearer required |
| POST | `/api/v1/auth/verify-email` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/auth/resend-verification` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/auth/forgot-password` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/auth/reset-password` | Public; endpoint may enforce Origin/token/cookie |
| POST | `/api/v1/auth/change-password` | Bearer required |
| GET | `/api/v1/auth/sessions` | Bearer required |
| DELETE | `/api/v1/auth/sessions/{session_id}` | Bearer required |
| POST | `/api/v1/auth/accept-invitation` | Public; endpoint may enforce Origin/token/cookie |
| GET | `/api/v1/auth/policy` | Public; endpoint may enforce Origin/token/cookie |
| GET | `/api/v1/users/me` | Bearer required |
| PATCH | `/api/v1/users/me` | Bearer required |
| POST | `/api/v1/users/me/avatar` | Bearer required |
| GET | `/api/v1/users/me/addresses` | Bearer required |
| POST | `/api/v1/users/me/addresses` | Bearer required |
| PATCH | `/api/v1/users/me/addresses/{address_id}` | Bearer required |
| DELETE | `/api/v1/users/me/addresses/{address_id}` | Bearer required |
| GET | `/api/v1/users/me/preferences` | Bearer required |
| PATCH | `/api/v1/users/me/preferences` | Bearer required |
| GET | `/api/v1/users/me/wishlist` | Bearer required |
| PUT | `/api/v1/users/me/wishlist/{product_id}` | Bearer required |
| DELETE | `/api/v1/users/me/wishlist/{product_id}` | Bearer required |
| GET | `/api/v1/users/me/cart` | Bearer required |
| DELETE | `/api/v1/users/me/cart` | Bearer required |
| PUT | `/api/v1/users/me/cart/items` | Bearer required |
| DELETE | `/api/v1/users/me/cart/items/{item_id}` | Bearer required |
| PATCH | `/api/v1/users/me/cart/items/{item_id}` | Bearer required |
| POST | `/api/v1/users/me/cart/merge` | Bearer required |
| POST | `/api/v1/users/me/checkout` | Bearer required |
| GET | `/api/v1/users/me/orders` | Bearer required |
| GET | `/api/v1/users/me/orders/{order_id}` | Bearer required |
| POST | `/api/v1/users/me/orders/{order_id}/cancel` | Bearer required |
| GET | `/api/v1/users/me/notifications` | Bearer required |
| PATCH | `/api/v1/users/me/notifications/read-all` | Bearer required |
| PATCH | `/api/v1/users/me/notifications/{notification_id}/read` | Bearer required |
| GET | `/api/v1/users/me/activity` | Bearer required |
| GET | `/api/v1/admin/users` | Bearer required |
| GET | `/api/v1/admin/users/{user_id}` | Bearer required |
| PATCH | `/api/v1/admin/users/{user_id}/status` | Bearer required |
| PATCH | `/api/v1/admin/users/{user_id}/role` | Bearer required |
| POST | `/api/v1/admin/invitations` | Bearer required |
| GET | `/api/v1/admin/invitations` | Bearer required |
| DELETE | `/api/v1/admin/invitations/{invitation_id}` | Bearer required |
| GET | `/api/v1/admin/audit-logs` | Bearer required |
| GET | `/api/v1/admin/settings` | Bearer required |
| PATCH | `/api/v1/admin/settings` | Bearer required |
| GET | `/` | Public; endpoint may enforce Origin/token/cookie |
