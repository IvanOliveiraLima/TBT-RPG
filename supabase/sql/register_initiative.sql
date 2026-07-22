-- InitAuto.2 — auto_initiative toggle + register_initiative RPC
-- Applied manually in Supabase SQL editor (not run by CI).
-- Reference: PR feat/initauto-2-rpc-service
--
-- IMPORTANT: p_character_id is TEXT (ids use char_<timestamp>_<random> format), NOT uuid.

alter table campaigns
  add column if not exists auto_initiative boolean not null default false;

-- remove a versão anterior (parâmetro uuid errado), se já criada
drop function if exists register_initiative(uuid, uuid, int, text);

create or replace function register_initiative(
  p_campaign_id uuid, p_character_id text, p_value int, p_name text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_auto boolean; v_combatants jsonb; v_idx int;
begin
  if v_uid is null then return; end if;
  -- caller é membro da campanha?
  if not exists (select 1 from campaign_members m
      where m.campaign_id = p_campaign_id and m.user_id = v_uid) then return; end if;
  -- o char está vinculado a esta campanha por este usuário?
  if not exists (select 1 from campaign_characters cc
      where cc.campaign_id = p_campaign_id and cc.character_id = p_character_id
        and cc.user_id = v_uid) then return; end if;
  -- toggle ligado?
  select auto_initiative into v_auto from campaigns where id = p_campaign_id;
  if not coalesce(v_auto, false) then return; end if;

  insert into campaign_initiative (campaign_id, combatants, active_combatant_id, round, active)
    values (p_campaign_id, '[]'::jsonb, null, 1, false)
    on conflict (campaign_id) do nothing;

  select combatants into v_combatants from campaign_initiative
    where campaign_id = p_campaign_id for update;

  select idx-1 into v_idx from (
    select row_number() over () as idx, elem
    from jsonb_array_elements(v_combatants) elem
  ) t where t.elem->>'linkedCharacterId' = p_character_id limit 1;

  if v_idx is not null then
    v_combatants := jsonb_set(v_combatants, array[v_idx::text,'initiative'], to_jsonb(p_value));
  else
    v_combatants := v_combatants || jsonb_build_object(
      'id', gen_random_uuid()::text, 'name', p_name,
      'initiative', p_value, 'linkedCharacterId', p_character_id);
  end if;

  update campaign_initiative set combatants = v_combatants, updated_at = now()
    where campaign_id = p_campaign_id;
end; $$;

grant execute on function register_initiative(uuid, text, int, text) to authenticated;
