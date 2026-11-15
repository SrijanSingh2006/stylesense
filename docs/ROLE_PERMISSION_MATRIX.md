# Roles and permissions

All management routers enforce permissions on the backend. React guards and filtered navigation improve usability; direct API requests face the same server checks. Public registration accepts no role/status override. Administrators assign staff roles through expiring invitations or audited account management.

| Capability | Anonymous | Customer | Product manager | Operations manager | Admin |
|---|---|---|---|---|---|
| Catalogue, search, size assistant, cold-start `/recommendations/0` | Yes | Yes | Yes | Yes | Yes |
| Own profile, notifications, sessions/password | No | Yes | Yes | Yes | Yes |
| Own recommendations, addresses, preferences | No | Yes | No | No | Yes, with own customer profile |
| Own server cart/wishlist/order history | No | Yes | No | No | Yes, ownership still required |
| Analytics, funnel/cohorts, segments | No | No | Yes | No | Yes |
| Experiments, flags, roadmap, feedback | No | No | Yes | No | Yes |
| Inventory and movements, returns | No | No | No | Yes | Yes |
| Catalogue quality, promotion simulation | No | No | No | Yes | Yes |
| Read releases | No | No | Yes | Yes | Yes |
| Edit release checklist / approve readiness | No | No | No | Yes | Yes |
| Users, roles/status, invitations, audit/settings | No | No | No | No | Yes |

Exact permission identifiers are defined in `backend/app/services/security.py`: `storefront.read`, `products.read`, `recommendations.read`, `cart.manage`, `wishlist.manage`, `profile.manage`, `addresses.manage`, `orders.read_own`, `preferences.manage`; `analytics.read`, `experiments.manage`, `segments.read`, `roadmap.manage`, `feedback.manage`, `releases.read`, `feature_flags.manage`; `inventory.read`, `inventory.manage`, `returns.read`, `catalogue.manage`, `pricing.simulate`, `releases.manage`; `users.manage`, `roles.manage`, `invitations.manage`, `audit.read`, `system.manage`.

Admin has the union of all permissions. It does not gain the ability to read another user's private address/cart/order through current-user APIs. Account user listings expose safe profile/status fields, never password hashes, refresh hashes or reset tokens.

Unauthenticated private requests return 401, authenticated permission denials return 403. Foreign owned IDs normally return 404. Legacy customer-ID routes require the caller's linked customer ID. Anonymous behavioural events may use a null customer ID; experiment operators can explicitly record assigned-customer exposure.

Administrators cannot change their own role/status. Privilege/status updates serialize through a database lock record, refresh the actor and retain the last active administrator. Existing-account invitations cannot take over an account. A first administrator is created with the operator CLI, then verified through the configured email channel.

A role transition does not preserve the previous role’s shopping permission. A former customer promoted to staff retains historical ownership records but cannot use legacy order or private recommendation routes without the current role’s required permission. A regression test exercises this transition.
