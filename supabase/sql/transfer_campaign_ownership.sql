-- Transfer.1 — transfer_campaign_ownership RPC
-- Applied manually in Supabase SQL editor (not run by CI).
-- Reference: PR feat/transfer-ownership
--
-- Validates: caller is owner, new owner is a member, not self.
-- Atomically updates campaigns.owner_id + roles in campaign_members.

create or replace function transfer_campaign_ownership(
  p_campaign_id uuid, p_new_owner uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from campaigns c
      where c.id = p_campaign_id and c.owner_id = v_uid) then
    raise exception 'not_owner';
  end if;
  if p_new_owner = v_uid then raise exception 'same_user'; end if;
  if not exists (select 1 from campaign_members m
      where m.campaign_id = p_campaign_id and m.user_id = p_new_owner) then
    raise exception 'not_member';
  end if;

  update campaigns set owner_id = p_new_owner where id = p_campaign_id;
  update campaign_members set role = 'master'
    where campaign_id = p_campaign_id and user_id = p_new_owner;
  update campaign_members set role = 'player'
    where campaign_id = p_campaign_id and user_id = v_uid;
end; $$;

grant execute on function transfer_campaign_ownership(uuid, uuid) to authenticated;
