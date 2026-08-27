-- F3: default HP on token presets; character_id and hp_max on map tokens
--
-- Already executed manually on Supabase (2026-08-27).
-- Kept here as reference for schema history.
--
-- Validation:
--   select column_name
--   from information_schema.columns
--   where table_name in ('campaign_token_presets','campaign_map_tokens')
--     and column_name in ('default_hp','character_id','hp_max');
--   → 3 rows expected.

-- HP padrão do preset (ex.: Goblin = 7)
alter table campaign_token_presets
  add column if not exists default_hp integer;

-- vínculo do token com um personagem (marca "não é criatura") e vida do token
alter table campaign_map_tokens
  add column if not exists character_id text,
  add column if not exists hp_max integer;

-- Notes:
--   * character_id is TEXT (ids use format char_<ts>_<random>, not uuid — same as
--     campaign_characters.character_id).
--   * No new policies: tables are already governed by is_campaign_master / is_map_master.
--   * default_hp is a snapshot copied to hp_max at placement time; editing the preset
--     later does NOT update tokens already on the map.
--   * character_id is set when the master picks a character portrait for a token.
--     Tokens with character_id are excluded from the creature token-select and
--     quick-add list in the initiative panel (they are player tokens, not monsters).
