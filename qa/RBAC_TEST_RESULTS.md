# Role and ownership test results

Validation date: **16 November 2026, Asia/Calcutta**. Permissions are enforced in FastAPI dependencies and owner-filtered database queries. UI visibility alone is not used as evidence.

| Actor | Permitted direct API checks | Denied direct API checks | Result |
|---|---|---|---|
| Anonymous | Public catalogue/search/cold-start remain available in regression suite | Profile/cart/wishlist/orders/analytics/inventory/admin/legacy wishlist return401 | PASS |
| Customer | Own account resources and private shopping | Analytics, inventory and admin return403 | PASS |
| Product manager | Analytics, experiments and roadmap | Inventory and admin return403 | PASS |
| Operations manager | Inventory, returns and releases | Analytics, roadmap and admin return403 | PASS |
| Admin | User/audit administration plus product/operations tools | Self role/status mutation prohibited; other users' private resources remain owner-scoped | PASS |

The four parameterized role-matrix cases, eight anonymous-route cases, malicious role-claim/registration cases, cross-user ownership checks and admin mutation tests are included in the **53 account/security backend cases**. All are subsets of the 234 passing backend tests; do not add these counts together. Exact assertions are in `backend/tests/test_auth_accounts.py`, with real JWT/database sessions.

Additional evidence:

- Foreign order/address/cart item/session/notification IDs are denied without disclosing their records. Another account's wishlist and order history remain empty until that account creates its own records.
- Legacy customer-ID routes check the caller's linked customer; old order records remain unclaimed after migration. Admin privilege does not bypass private order ownership.
- Public registration rejects role/status injection. JWT role claims cannot grant permissions because the server reads the database role.
- Status/role edits revoke sessions and require an authorized current actor. Concurrent admin deactivation allows one mutation and retains an active admin. Self changes and last-admin removal are protected.
- Invitation expiry/revocation and existing-account protections pass. Safe audit/session responses exclude password/raw-token material.
- React guard tests deny forbidden workspaces and preserve safe intended destinations. Browser checks exercise actual customer/PM/operations/admin restrictions, admin status revocation and staff invitation acceptance; see [browser results](END_TO_END_TEST_RESULTS.md).

No MFA, OAuth, external security audit or commercial production authorization certification is implied. The full documented permission matrix is [ROLE_PERMISSION_MATRIX.md](../docs/ROLE_PERMISSION_MATRIX.md).
