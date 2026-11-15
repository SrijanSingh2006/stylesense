# Account upgrade initial audit

Baseline `6f1a7db733f3454068c6f7a2f082811844bb61c5`, clean worktree before upgrade. Existing customer experience uses browser-persisted demo personas and cart, while business APIs lack authentication. Wishlists are database-backed but scoped by user-submitted customer IDs. Historical orders have no authenticated owner. These are intentional prototype limitations documented in the previous release and now become upgrade requirements.

Retain the existing app/services, migrations and data. Add explicit account ownership; preserve unclaimed historical records. Enforce permissions at the backend rather than relying on navigation. Email testing uses a local outbox, with SMTP delivery treated as unverified until a real provider is configured and tested. No real payments are introduced.
