# SQL

This folder contains a consolidated, human-friendly view of the database schema objects used by this project (tables, indexes, functions, triggers, RLS policies, and optional cron scheduling).

- Source of truth for deployments remains `supabase/migrations/`.
- Use this folder as a reference and/or for manual review.

## Apply

If you want to apply these scripts manually (not recommended vs migrations), run them in order:

1. `01_extensions.sql`
2. `10_tables.sql`
3. `20_functions.sql`
4. `30_triggers.sql`
5. `40_rls_policies.sql`
6. `50_indexes.sql`
7. `60_cron_optional.sql` (optional)

## Notes

- This project uses `gen_random_uuid()`; it requires the `pgcrypto` extension.
- A trigger on `auth.users` is required for `profiles` auto-provisioning.
- Cron scheduling is provided as an *optional* template; you should review secrets/headers before enabling it.
