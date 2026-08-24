-- RT.1: enable Postgres Changes for characters table.
-- Run this ONCE in the Supabase SQL editor BEFORE merging the RT.1 branch.
-- RLS already covers: campaign members can read linked characters via
-- the "Campaign members can read linked characters" policy, and Supabase
-- Realtime filters events per subscriber by RLS.
--
-- No filter on the subscription: Postgres Changes accepts only one value
-- per column filter, but linked chars can be many. RLS does the scoping.

alter publication supabase_realtime add table public.characters;

-- Verify (should return one row):
select tablename from pg_publication_tables
 where pubname = 'supabase_realtime' and tablename = 'characters';
