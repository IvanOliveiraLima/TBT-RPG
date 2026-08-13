-- ============================================================================
-- set_campaign_member_role — owner-only promote/demote
-- Aplicar manualmente no Supabase ANTES de mergear o PR.
--
-- Modelo: apenas o DONO troca o papel de um membro.
--   - Dono não pode trocar o próprio papel (a campanha nunca fica sem mestre).
--   - Papéis válidos: 'master' | 'player'.
--   - campaign_members NÃO tem policy de UPDATE (de propósito):
--     a única porta de entrada é esta RPC.
--
-- ROTEIRO DE VALIDAÇÃO (executar o bloco INTEIRO com set_config + set local role):
--   1. Como dono: promover jogador → role='master'; rebaixar → role='player'.
--   2. Como co-mestre: tentar promover alguém → erro not_owner.
--   3. Como dono, p_user_id = ele mesmo → erro cannot_change_own_role.
--   4. p_role='foo' → erro invalid_role; usuário não-membro → not_member.
-- ============================================================================

create or replace function set_campaign_member_role(
  p_campaign_id uuid, p_user_id uuid, p_role text
) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_role not in ('master','player') then raise exception 'invalid_role'; end if;
  -- só o DONO promove/rebaixa
  if not exists (select 1 from campaigns c
      where c.id = p_campaign_id and c.owner_id = v_uid) then
    raise exception 'not_owner';
  end if;
  -- o dono não muda o próprio papel (campanha nunca fica sem mestre)
  if p_user_id = v_uid then raise exception 'cannot_change_own_role'; end if;
  if not exists (select 1 from campaign_members m
      where m.campaign_id = p_campaign_id and m.user_id = p_user_id) then
    raise exception 'not_member';
  end if;

  update campaign_members set role = p_role
   where campaign_id = p_campaign_id and user_id = p_user_id;
end; $$;

grant execute on function set_campaign_member_role(uuid, uuid, text) to authenticated;
