# User journeys

## Customer

Browse/search anonymously, use fit/size assistance and add a guest bag. Registration creates an unverified customer; open the configured delivery message, verify and sign in. First login opens seven-step onboarding: welcome, categories, colours, brands, budget, fit and review. Preference steps can be skipped and edited later.

The account overview shows actual order and wishlist counts, completion, recent activity and personal recommendations. Profile, addresses, preferences, wishlist, notifications and sessions use current-user APIs. Sign in after logout or refresh the browser to restore database records. Protected destinations return to the requested safe internal path after login/onboarding.

Checkout: saved address → server-reloaded bag review → simulated method → server validation/atomic stock update → confirmation and owned order detail. Request failures preserve the bag and selected inputs. A stable request key prevents duplicate purchase on retry. Orders keep their address snapshot. Cancellation is restricted to pending orders; completed simulated purchases remain in history.

## Product manager

Login redirects to `/dashboard`. Inspect actual analytics/funnel/cohorts and segmentation. Create/start an experiment, assign and explicitly record exposure, inspect observed results. Manage flags, roadmap/RICE and stakeholder feedback. Release readiness is readable. Inventory mutations, operational workspaces and administration are denied.

## Operations manager

Login redirects to `/operations/inventory`. Inspect stock and demand, enter permitted inbound/outbound movements, review returns/catalogue issues and promotion simulations. Update release checklists; readiness requires all mandatory gates. Analytics/experiments, roadmap/flags and user administration are denied.

## Administrator

Login redirects to `/admin`. Search/filter/paginate accounts; inspect safe account details; change another account's permitted role/status. Staff receive expiring invitations and set their own password. Revoke unused invitations, inspect audit records, manage registration availability and maintenance notices. Admin has management permissions but current-user private resources remain owner-scoped. Own role/status cannot be edited.

## Anonymous and expired sessions

Private customer/dashboard/admin routes wait for restoration, then redirect anonymous visitors to login with an internal intended destination. Authenticated users without permission see the unauthorized page. Direct API calls return 401/403 without private records. Expired access triggers one single-flight refresh; a failed refresh returns to anonymous state. Logout/revocation/reset invalidates database sessions and cached private UI.

Actual automated evidence and screenshots are listed in [end-to-end results](../qa/END_TO_END_TEST_RESULTS.md). A journey described here is a product flow, not a claim that every possible branch has a browser assertion.
